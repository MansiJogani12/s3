from app.core.schemas import CamelModel
"""
FastAPI router for Reviews (Faculty-conducted project reviews).
Converted from reviewController.js + reviewRoutes.js.

Covers:
  - Coordinator: Manage Reviews (CRUD)
  - Faculty: Conduct Reviews (assigned reviews + submit marks)
  - Student: View marks and schedules

Prefix: /api/reviews
"""

from typing import Any, Dict, List, Optional

from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status

from app.core.security import get_current_user, require_roles
from app.models.review import Review
from app.models.review_mark import ReviewMark
from app.models.notification import Notification
from app.models.project_group import ProjectGroup
from app.models.group_member import GroupMember
from app.models.project import Project

router = APIRouter(prefix="/api/reviews", tags=["Reviews"])


# ============================================================
# REQUEST BODY SCHEMAS
# ============================================================

class ReviewCreate(CamelModel):
    title: str
    type: str
    description: Optional[str] = ""
    department: Optional[str] = None
    reviewDate: Optional[str] = None  # ISO date string
    startTime: Optional[str] = None
    endTime: Optional[str] = None
    maxMarks: Optional[float] = 100
    assignedGroups: Optional[List[str]] = []
    facultyReviewers: Optional[List[str]] = []
    status: Optional[str] = "DRAFT"
    marksVisibility: Optional[str] = "HIDDEN"


class ReviewUpdate(CamelModel):
    title: Optional[str] = None
    type: Optional[str] = None
    description: Optional[str] = None
    department: Optional[str] = None
    reviewDate: Optional[str] = None
    startTime: Optional[str] = None
    endTime: Optional[str] = None
    maxMarks: Optional[float] = None
    assignedGroups: Optional[List[str]] = None
    facultyReviewers: Optional[List[str]] = None
    status: Optional[str] = None
    marksVisibility: Optional[str] = None


class StudentMarkEntry(CamelModel):
    studentId: str
    marks: float
    feedback: Optional[str] = ""


class SubmitReviewMarksBody(CamelModel):
    groupId: str
    studentMarks: List[StudentMarkEntry]
    isDraft: Optional[bool] = False


# ============================================================
# COORDINATOR: MANAGE REVIEWS
# ============================================================

@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    summary="Create a new review event",
    dependencies=[Depends(require_roles(["COORDINATOR", "ADMIN"]))],
)
async def create_review(
    body: ReviewCreate,
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """Create a review event (draft or published) for groups to be evaluated in."""
    assigned_group_ids = [PydanticObjectId(gid) for gid in (body.assignedGroups or [])]
    faculty_reviewer_ids = [PydanticObjectId(fid) for fid in (body.facultyReviewers or [])]

    review = Review(
        title=body.title,
        type=body.type,
        description=body.description or "",
        department=body.department,
        review_date=body.reviewDate,
        start_time=body.startTime,
        end_time=body.endTime,
        max_marks=body.maxMarks or 100,
        status=body.status or "DRAFT",
        marks_visibility=body.marksVisibility or "HIDDEN",
        assigned_groups=assigned_group_ids,
        faculty_reviewers=faculty_reviewer_ids,
    )
    await review.insert()
    return {"success": True, "review": review.dict()}


@router.get(
    "/",
    summary="Get all reviews (coordinator/admin view)",
    dependencies=[Depends(require_roles(["COORDINATOR", "ADMIN"]))],
)
async def get_all_reviews(
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """Return all reviews. Coordinators are scoped to their department if set."""
    query_filter: List[Any] = []
    dept = current_user.get("department")
    if current_user.role == "COORDINATOR" and dept:
        query_filter.append(Review.department == dept)

    reviews = await Review.find(*query_filter).sort(+Review.review_date).to_list()
    return {"success": True, "reviews": [r.dict() for r in reviews]}


@router.put(
    "/{id}",
    summary="Update a review",
    dependencies=[Depends(require_roles(["COORDINATOR", "ADMIN"]))],
)
async def update_review(
    id: str,
    body: ReviewUpdate,
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """Update any fields of an existing review event."""
    try:
        oid = PydanticObjectId(id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid review ID.")

    review = await Review.get(oid)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found.")

    update_data = body.dict(exclude_none=True)
    for field, value in update_data.items():
        if field == "assignedGroups":
            review.assigned_groups = [PydanticObjectId(gid) for gid in value]
        elif field == "facultyReviewers":
            review.faculty_reviewers = [PydanticObjectId(fid) for fid in value]
        elif field == "reviewDate":
            review.review_date = value
        elif field == "startTime":
            review.start_time = value
        elif field == "endTime":
            review.end_time = value
        elif field == "maxMarks":
            review.max_marks = value
        elif field == "marksVisibility":
            review.marks_visibility = value
        else:
            if hasattr(review, field):
                setattr(review, field, value)

    await review.save()
    return {"success": True, "review": review.dict()}


@router.delete(
    "/{id}",
    summary="Delete a review and its marks",
    dependencies=[Depends(require_roles(["COORDINATOR", "ADMIN"]))],
)
async def delete_review(
    id: str,
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """Delete a review event and all associated ReviewMark records."""
    try:
        oid = PydanticObjectId(id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid review ID.")

    review = await Review.get(oid)
    if review:
        await review.delete()

    # Cascade delete review marks
    marks = await ReviewMark.find(ReviewMark.review_id == oid).to_list()
    for mark in marks:
        await mark.delete()

    return {"success": True, "message": "Review deleted successfully."}


# ============================================================
# FACULTY: CONDUCT REVIEWS
# ============================================================

@router.get(
    "/faculty/assigned",
    summary="Get reviews assigned to the current faculty with enriched group data",
    dependencies=[Depends(require_roles(["FACULTY", "ADMIN"]))],
)
async def get_assigned_reviews(
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Return all reviews enriched with the faculty member's assigned groups
    and their student members. Mirrors the Node.js behaviour of listing
    all reviews but injecting the faculty's groups into each.
    """
    user_id = PydanticObjectId(current_user.id)

    # All reviews
    reviews = await Review.find().sort(+Review.review_date).to_list()

    # Resolve faculty's groups (same dual-source logic as Node.js)
    legacy_projects = await Project.find(Project.faculty_guide_id == user_id).to_list()
    legacy_group_ids = [p.group_id for p in legacy_projects if p.group_id]

    user_groups_query: List[Any] = []
    if legacy_group_ids:
        user_groups = await ProjectGroup.find(
            {"$or": [
                {"guideId": user_id},
                {"coGuideId": user_id},
                {"_id": {"$in": legacy_group_ids}},
            ]}
        ).to_list()
    else:
        user_groups = await ProjectGroup.find(
            {"$or": [{"guideId": user_id}, {"coGuideId": user_id}]}
        ).to_list()

    if not user_groups:
        user_groups = await ProjectGroup.find_all().to_list()

    group_ids = [g.id for g in user_groups]

    # Build group → members map
    memberships = await GroupMember.find(
        {"groupId": {"$in": group_ids}}
    ).to_list()

    group_members_map: Dict[str, List[Dict[str, Any]]] = {}
    for gm in memberships:
        gid_str = str(gm.group_id)
        if gid_str not in group_members_map:
            group_members_map[gid_str] = []
        # Avoid duplicates
        if not any(str(m.get("_id")) == str(gm.user_id) for m in group_members_map[gid_str]):
            group_members_map[gid_str].append(
                {
                    "_id": str(gm.user_id),
                    "name": gm.user_name or "",
                    "enrollmentNumber": gm.enrollment_number or "",
                    "role": gm.role or "MEMBER",
                }
            )

    enriched_groups: List[Dict[str, Any]] = []
    for g in user_groups:
        gid_str = str(g.id)
        members = group_members_map.get(gid_str, [])
        # Prepend leader if not already present
        if g.leader_id and not any(m["_id"] == str(g.leader_id) for m in members):
            members = [
                {
                    "_id": str(g.leader_id),
                    "name": getattr(g, "leader_name", ""),
                    "enrollmentNumber": getattr(g, "leader_enrollment", ""),
                    "role": "LEADER",
                }
            ] + members
        enriched_groups.append(
            {
                "_id": str(g.id),
                "id": str(g.id),
                "name": g.name,
                "code": getattr(g, "code", ""),
                "title": g.name,
                "leaderId": str(g.leader_id) if g.leader_id else None,
                "members": members,
            }
        )

    # Inject enriched groups into each review
    result_reviews = []
    for r in reviews:
        r_dict = r.dict()
        r_dict["assignedGroups"] = enriched_groups
        result_reviews.append(r_dict)

    return {"success": True, "reviews": result_reviews}


@router.post(
    "/{id}/marks",
    summary="Submit or save draft review marks for a group",
    dependencies=[Depends(require_roles(["FACULTY", "ADMIN"]))],
)
async def submit_review_marks(
    id: str,
    body: SubmitReviewMarksBody,
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Upsert ReviewMark records for each student in a group.
    Marks must not exceed the review's maxMarks.
    """
    faculty_id = PydanticObjectId(current_user.id)
    try:
        review_oid = PydanticObjectId(id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid review ID.")

    review = await Review.get(review_oid)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found.")

    group_id = PydanticObjectId(body.groupId)
    review_status = "DRAFT" if body.isDraft else "SUBMITTED"

    for sm in body.studentMarks:
        if sm.marks > review.max_marks or sm.marks < 0:
            raise HTTPException(
                status_code=400,
                detail=f"Marks for student {sm.studentId} exceed maximum allowed ({review.max_marks}) or are invalid.",
            )

        student_id = PydanticObjectId(sm.studentId)
        existing = await ReviewMark.find_one(
            ReviewMark.review_id == review_oid,
            ReviewMark.student_id == student_id,
            ReviewMark.faculty_id == faculty_id,
        )
        if existing:
            existing.group_id = group_id
            existing.marks = sm.marks
            existing.feedback = sm.feedback or ""
            existing.status = review_status
            await existing.save()
        else:
            new_mark = ReviewMark(
                review_id=review_oid,
                student_id=student_id,
                faculty_id=faculty_id,
                group_id=group_id,
                marks=sm.marks,
                feedback=sm.feedback or "",
                status=review_status,
            )
            await new_mark.insert()

    return {
        "success": True,
        "message": "Draft saved." if body.isDraft else "Marks submitted successfully.",
    }


# ============================================================
# STUDENT: VIEW MARKS
# ============================================================

@router.get(
    "/student/marks",
    summary="Get the current student's review marks (visible only)",
    dependencies=[Depends(require_roles(["STUDENT"]))],
)
async def get_student_marks(
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Return marks for the current student where the parent review is COMPLETED
    and marks visibility is VISIBLE.
    """
    student_id = PydanticObjectId(current_user.id)
    all_marks = await ReviewMark.find(ReviewMark.student_id == student_id).to_list()

    visible_marks: List[Dict[str, Any]] = []
    for mark in all_marks:
        review = await Review.get(mark.review_id)
        if review and review.status == "COMPLETED" and review.marks_visibility == "VISIBLE":
            m_dict = mark.dict()
            m_dict["reviewId"] = review.dict()
            visible_marks.append(m_dict)

    return {"success": True, "marks": visible_marks}


@router.get(
    "/student/schedules",
    summary="Get published review schedules for a student's group",
    dependencies=[Depends(require_roles(["STUDENT"]))],
)
async def get_review_details_for_student(
    groupId: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Return reviews that are PUBLISHED or COMPLETED and are assigned to
    the student's group. Hides sensitive configuration fields.
    """
    if not groupId:
        return {"success": True, "reviews": []}

    try:
        group_oid = PydanticObjectId(groupId)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid group ID.")

    reviews = await Review.find(
        {"assignedGroups": group_oid, "status": {"$in": ["PUBLISHED", "COMPLETED"]}}
    ).to_list()

    # Strip config fields from response
    result = []
    for r in reviews:
        r_dict = r.dict()
        r_dict.pop("maxMarks", None)
        r_dict.pop("max_marks", None)
        r_dict.pop("marksVisibility", None)
        r_dict.pop("marks_visibility", None)
        result.append(r_dict)

    return {"success": True, "reviews": result}
