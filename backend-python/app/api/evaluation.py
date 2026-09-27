from app.core.schemas import CamelModel
"""
FastAPI router for Evaluation features.
Converted from evaluationController.js + evaluationRoutes.js.

Covers:
  - Evaluation Criteria / Rubrics (FR-1601)
  - Review Schedules (FR-1602)
  - Student Marking Engine (FR-1603 & FR-1604)

Prefix: /api/evaluation
"""

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.core.security import get_current_user, require_roles
from app.models.evaluation_criteria import EvaluationCriteria
from app.models.review_schedule import ReviewSchedule
from app.models.student_mark import StudentMark
from app.models.project import Project
from app.models.group_member import GroupMember
from app.models.project_group import ProjectGroup

router = APIRouter(prefix="/api/evaluation", tags=["Evaluation"])


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def compute_letter_grade(percentage: float) -> str:
    """Convert a numeric percentage (0-100) to a letter grade."""
    if percentage >= 90:
        return "A+"
    if percentage >= 80:
        return "A"
    if percentage >= 70:
        return "B+"
    if percentage >= 60:
        return "B"
    if percentage >= 50:
        return "C"
    return "F"


async def resolve_student_project_id(current_user: dict) -> Optional[PydanticObjectId]:
    """Find the active project ID for a STUDENT user via GroupMember → Project."""
    from app.models.group_member import GroupMember  # local import to avoid circulars
    user_id = PydanticObjectId(current_user.id)
    membership = await GroupMember.find_one(GroupMember.user_id == user_id)
    if not membership:
        return None
    project = await Project.find_one(Project.group_id == membership.group_id)
    return project.id if project else None


# ============================================================
# REQUEST BODY SCHEMAS
# ============================================================

class CriteriaCreate(CamelModel):
    name: str
    weightagePercentage: float
    maxMarks: Optional[float] = 100
    description: Optional[str] = ""


class CriteriaUpdate(CamelModel):
    name: Optional[str] = None
    weightagePercentage: Optional[float] = None
    maxMarks: Optional[float] = None
    description: Optional[str] = None


class ReviewScheduleCreate(CamelModel):
    reviewName: str
    stage: str
    scheduledDate: datetime
    venue: Optional[str] = "Main Seminar Hall"
    description: Optional[str] = ""
    attachmentUrl: Optional[str] = ""


class ReviewScheduleUpdate(CamelModel):
    reviewName: Optional[str] = None
    stage: Optional[str] = None
    scheduledDate: Optional[datetime] = None
    venue: Optional[str] = None
    description: Optional[str] = None
    attachmentUrl: Optional[str] = None


class CriteriaScore(CamelModel):
    criteriaId: Optional[str] = None
    criteriaName: Optional[str] = None
    weightagePercentage: Optional[float] = 25
    marksObtained: float
    maxMarks: Optional[float] = 100


class SubmitMarksBody(CamelModel):
    projectId: Optional[str] = None
    studentId: Optional[str] = None
    reviewStage: Optional[str] = "REVIEW_1"
    criteriaScores: List[CriteriaScore]
    feedback: Optional[str] = ""


# ============================================================
# EVALUATION CRITERIA (FR-1601)
# ============================================================

@router.get("/criteria", summary="Get evaluation criteria / rubrics")
async def get_criteria(
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """Return all evaluation criteria. Seeds institutional defaults if none exist."""
    criteria = await EvaluationCriteria.find().sort(+EvaluationCriteria.created_at).to_list()

    if not criteria:
        defaults = [
            EvaluationCriteria(
                name="Proposal & SRS Documentation",
                weightage_percentage=20,
                max_marks=100,
                description="Problem statement definition and SRS requirements spec.",
            ),
            EvaluationCriteria(
                name="System Architecture & Design",
                weightage_percentage=25,
                max_marks=100,
                description="Database schema, API endpoints, and component design.",
            ),
            EvaluationCriteria(
                name="Implementation & Code Quality",
                weightage_percentage=35,
                max_marks=100,
                description="Working prototype, clean code, tests, and Git commits.",
            ),
            EvaluationCriteria(
                name="Presentation & Viva Voce",
                weightage_percentage=20,
                max_marks=100,
                description="Demonstration and Q&A defense before faculty panel.",
            ),
        ]
        for d in defaults:
            await d.insert()
        criteria = defaults

    return {"success": True, "criteria": [c.dict() for c in criteria]}


@router.post(
    "/criteria",
    status_code=status.HTTP_201_CREATED,
    summary="Create evaluation criteria",
    dependencies=[Depends(require_roles(["ADMIN", "COORDINATOR"]))],
)
async def create_criteria(
    body: CriteriaCreate,
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """Create a new evaluation rubric item."""
    item = EvaluationCriteria(
        name=body.name,
        weightage_percentage=body.weightagePercentage,
        max_marks=body.maxMarks or 100,
        description=body.description or "",
    )
    await item.insert()
    return {"success": True, "criteria": item.dict()}


@router.put(
    "/criteria/{id}",
    summary="Update evaluation criteria",
    dependencies=[Depends(require_roles(["ADMIN", "COORDINATOR"]))],
)
async def update_criteria(
    id: str,
    body: CriteriaUpdate,
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """Update an existing rubric item by ID."""
    try:
        oid = PydanticObjectId(id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid criteria ID.")

    criteria = await EvaluationCriteria.get(oid)
    if not criteria:
        raise HTTPException(status_code=404, detail="Criteria not found.")

    if body.name is not None:
        criteria.name = body.name
    if body.weightagePercentage is not None:
        criteria.weightage_percentage = body.weightagePercentage
    if body.maxMarks is not None:
        criteria.max_marks = body.maxMarks
    if body.description is not None:
        criteria.description = body.description

    await criteria.save()
    return {"success": True, "criteria": criteria.dict()}


@router.delete(
    "/criteria/{id}",
    summary="Delete evaluation criteria",
    dependencies=[Depends(require_roles(["ADMIN", "COORDINATOR"]))],
)
async def delete_criteria(
    id: str,
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """Delete a rubric item by ID."""
    try:
        oid = PydanticObjectId(id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid criteria ID.")

    criteria = await EvaluationCriteria.get(oid)
    if criteria:
        await criteria.delete()
    return {"success": True, "message": "Criteria deleted."}


# ============================================================
# REVIEW SCHEDULES (FR-1602)
# ============================================================

@router.get("/reviews", summary="Get review schedules")
async def get_review_schedules(
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """Return all review schedules. Seeds institutional defaults if none exist."""
    reviews = await ReviewSchedule.find().sort(+ReviewSchedule.scheduled_date).to_list()

    if not reviews:
        _now = now_utc()
        defaults = [
            ReviewSchedule(
                review_name="SGP Review 1: Proposal & Topic Approval",
                stage="REVIEW_1",
                scheduled_date=_now + timedelta(days=10),
                venue="Lab 4 / Online Zoom",
            ),
            ReviewSchedule(
                review_name="SGP Review 2: Mid-Term Code & Progress Review",
                stage="REVIEW_2",
                scheduled_date=_now + timedelta(days=30),
                venue="Main Seminar Hall",
            ),
            ReviewSchedule(
                review_name="SGP Final Viva Presentation & Evaluation",
                stage="FINAL_VIVA",
                scheduled_date=_now + timedelta(days=60),
                venue="Auditorium Block B",
            ),
        ]
        for d in defaults:
            await d.insert()
        reviews = defaults

    return {"success": True, "reviews": [r.dict() for r in reviews]}


@router.post(
    "/reviews",
    status_code=status.HTTP_201_CREATED,
    summary="Create a review schedule",
    dependencies=[Depends(require_roles(["ADMIN", "COORDINATOR"]))],
)
async def create_review_schedule(
    body: ReviewScheduleCreate,
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """Schedule a new institutional review event."""
    review = ReviewSchedule(
        review_name=body.reviewName,
        stage=body.stage,
        scheduled_date=body.scheduledDate,
        venue=body.venue or "Main Seminar Hall",
        description=body.description or "",
        attachment_url=body.attachmentUrl or "",
    )
    await review.insert()
    return {"success": True, "review": review.dict()}


@router.put(
    "/reviews/{id}",
    summary="Update a review schedule",
    dependencies=[Depends(require_roles(["ADMIN", "COORDINATOR"]))],
)
async def update_review_schedule(
    id: str,
    body: ReviewScheduleUpdate,
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """Update an existing review schedule."""
    try:
        oid = PydanticObjectId(id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid review schedule ID.")

    review = await ReviewSchedule.get(oid)
    if not review:
        raise HTTPException(status_code=404, detail="Review schedule not found.")

    if body.reviewName is not None:
        review.review_name = body.reviewName
    if body.stage is not None:
        review.stage = body.stage
    if body.scheduledDate is not None:
        review.scheduled_date = body.scheduledDate
    if body.venue is not None:
        review.venue = body.venue
    if body.description is not None:
        review.description = body.description
    if body.attachmentUrl is not None:
        review.attachment_url = body.attachmentUrl

    await review.save()
    return {"success": True, "review": review.dict()}


@router.delete(
    "/reviews/{id}",
    summary="Delete a review schedule",
    dependencies=[Depends(require_roles(["ADMIN", "COORDINATOR"]))],
)
async def delete_review_schedule(
    id: str,
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """Delete a review schedule by ID."""
    try:
        oid = PydanticObjectId(id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid review schedule ID.")

    review = await ReviewSchedule.get(oid)
    if review:
        await review.delete()
    return {"success": True, "message": "Review schedule deleted."}


# ============================================================
# STUDENT MARKING ENGINE (FR-1603 & FR-1604)
# ============================================================

@router.post(
    "/marks",
    summary="Submit or update student marks",
    dependencies=[Depends(require_roles(["FACULTY", "ADMIN", "COORDINATOR"]))],
)
async def submit_student_marks(
    body: SubmitMarksBody,
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Upsert a StudentMark record for the given student / project / review stage.
    Calculates total weighted score and derives a letter grade.
    """
    evaluator_id = PydanticObjectId(current_user.id)

    if not body.projectId:
        raise HTTPException(status_code=400, detail="Project ID is required.")

    project_id = PydanticObjectId(body.projectId)
    student_id_str = body.studentId

    # Auto-resolve student if not provided
    if not student_id_str:
        project = await Project.get(project_id)
        if project and project.group_id:
            group = await ProjectGroup.get(project.group_id)
            if group and group.leader_id:
                student_id_str = str(group.leader_id)

    if not student_id_str or not body.criteriaScores:
        raise HTTPException(
            status_code=400, detail="Student ID and criteria scores are required."
        )

    student_id = PydanticObjectId(student_id_str)

    # Compute weighted total
    total_weighted_score = 0.0
    formatted_scores: List[Dict[str, Any]] = []
    for cs in body.criteriaScores:
        marks = float(cs.marksObtained)
        max_m = float(cs.maxMarks or 100)
        weight = float(cs.weightagePercentage or 25)
        total_weighted_score += (marks / max_m) * weight
        formatted_scores.append(
            {
                "criteriaId": cs.criteriaId,
                "criteriaName": cs.criteriaName,
                "weightagePercentage": weight,
                "marksObtained": marks,
                "maxMarks": max_m,
            }
        )

    final_marks = round(total_weighted_score * 10) / 10
    grade = compute_letter_grade(final_marks)
    review_stage = body.reviewStage or "REVIEW_1"

    # Upsert the mark record
    mark_record = await StudentMark.find_one(
        StudentMark.project_id == project_id,
        StudentMark.student_id == student_id,
        StudentMark.review_stage == review_stage,
        StudentMark.evaluator_id == evaluator_id,
    )

    if mark_record:
        mark_record.criteria_scores = formatted_scores
        mark_record.total_marks_obtained = final_marks
        mark_record.grade = grade
        mark_record.feedback = body.feedback or ""
        await mark_record.save()
    else:
        mark_record = StudentMark(
            project_id=project_id,
            student_id=student_id,
            evaluator_id=evaluator_id,
            review_stage=review_stage,
            criteria_scores=formatted_scores,
            total_marks_obtained=final_marks,
            grade=grade,
            feedback=body.feedback or "",
        )
        await mark_record.insert()

    return {"success": True, "markRecord": mark_record.dict()}


@router.get("/marks", summary="Get student mark records")
async def get_student_marks(
    projectId: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Return mark records scoped by role:
    - STUDENT: their own marks for their active project.
    - FACULTY: marks for all projects under their guidance.
    - ADMIN/COORDINATOR: optionally filter by projectId query param.
    """
    role = current_user.get("role", "")
    user_id = PydanticObjectId(current_user.id)

    query_filters: List[Any] = []

    if role == "STUDENT":
        project_id = await resolve_student_project_id(current_user)
        if not project_id:
            return {"success": True, "markRecords": []}
        query_filters.append(StudentMark.project_id == project_id)
        query_filters.append(StudentMark.student_id == user_id)

    elif role == "FACULTY":
        # Find all groups guided by this faculty
        user_groups = await ProjectGroup.find(ProjectGroup.faculty_id == user_id).to_list()
        group_ids = [g.id for g in user_groups]
        projects = await Project.find(In(Project.group_id, group_ids)).to_list()
        project_ids = [p.id for p in projects]
        query_filters.append(In(StudentMark.project_id, project_ids))

    else:
        if projectId:
            query_filters.append(StudentMark.project_id == PydanticObjectId(projectId))

    mark_records = await StudentMark.find(*query_filters).sort(-StudentMark.created_at).to_list()
    return {"success": True, "markRecords": [m.dict() for m in mark_records]}
