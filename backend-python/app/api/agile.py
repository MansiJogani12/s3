from app.core.schemas import CamelModel
"""
FastAPI router for Agile project management (Requirements, Features, Sprints, Tasks, Bugs, Traceability).
Converted from: agileController.js + agileRoutes.js
Prefix: /api/agile
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status

from app.core.security import get_current_user, require_roles
from app.models.bug import Bug
from app.models.feature import Feature
from app.models.project import Project
from app.models.requirement import Requirement
from app.models.sprint import Sprint
from app.models.task import Task
from app.models.user import User
from app.utils.notification_utils import notify_project_members
from app.utils.project_access import resolve_and_verify_project_id

router = APIRouter(prefix="/api/agile", tags=["agile"])


# ---------------------------------------------------------------------------
# Request body schemas
# ---------------------------------------------------------------------------


class CreateRequirementBody(CamelModel):
    title: str
    description: Optional[str] = None
    priority: Optional[str] = "MEDIUM"
    type: Optional[str] = "FUNCTIONAL"
    status: Optional[str] = "PLANNED"
    linked_features: Optional[List[PydanticObjectId]] = []


class UpdateRequirementBody(CamelModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    type: Optional[str] = None
    status: Optional[str] = None
    linked_features: Optional[List[PydanticObjectId]] = None


class CreateFeatureBody(CamelModel):
    title: str
    description: Optional[str] = ""
    priority: Optional[str] = "MEDIUM"
    start_date: Optional[datetime] = None
    target_end_date: Optional[datetime] = None


class UpdateFeatureBody(CamelModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    start_date: Optional[datetime] = None
    target_end_date: Optional[datetime] = None
    checklist_items: Optional[List[Dict[str, Any]]] = None


class CreateSprintBody(CamelModel):
    name: str
    goal: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class UpdateSprintBody(CamelModel):
    name: Optional[str] = None
    goal: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class UpdateSprintStatusBody(CamelModel):
    status: str  # PLANNED | ACTIVE | COMPLETED | CANCELLED


class CreateTaskBody(CamelModel):
    title: str
    description: Optional[str] = None
    feature_id: Optional[PydanticObjectId] = None
    sprint_id: Optional[PydanticObjectId] = None
    checklist_item_id: Optional[PydanticObjectId] = None
    assignee_id: Optional[PydanticObjectId] = None
    priority: Optional[str] = "MEDIUM"
    story_points: Optional[int] = 1
    labels: Optional[List[str]] = []
    start_date: Optional[datetime] = None
    start_time: Optional[str] = ""
    due_date: Optional[datetime] = None
    due_time: Optional[str] = ""
    is_calendar_event_only: Optional[bool] = False


class UpdateTaskBody(CamelModel):
    title: Optional[str] = None
    description: Optional[str] = None
    feature_id: Optional[PydanticObjectId] = None
    sprint_id: Optional[PydanticObjectId] = None
    assignee_id: Optional[PydanticObjectId] = None
    priority: Optional[str] = None
    story_points: Optional[int] = None
    labels: Optional[List[str]] = None
    start_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    status: Optional[str] = None


class UpdateTaskStatusBody(CamelModel):
    status: str  # TO_DO | IN_PROGRESS | IN_REVIEW | DONE


class CreateBugBody(CamelModel):
    title: str
    description: Optional[str] = None
    feature_id: Optional[PydanticObjectId] = None
    assignee_id: Optional[PydanticObjectId] = None
    priority: Optional[str] = "MEDIUM"
    status: Optional[str] = "OPEN"
    due_date: Optional[datetime] = None
    attachment_url: Optional[str] = ""


class UpdateBugBody(CamelModel):
    title: Optional[str] = None
    description: Optional[str] = None
    feature_id: Optional[PydanticObjectId] = None
    assignee_id: Optional[str] = None  # str to allow empty-string clearing
    priority: Optional[str] = None
    status: Optional[str] = None
    due_date: Optional[datetime] = None
    attachment_url: Optional[str] = None


class UpdateBugStatusBody(CamelModel):
    status: str  # OPEN | IN_PROGRESS | FIXED | CLOSED | REOPENED


# ---------------------------------------------------------------------------
# Internal helper
# ---------------------------------------------------------------------------


async def _sync_checklist_item_status(task: Task) -> None:
    """If the task is linked to a feature checklist item, sync its completion."""
    if not task.feature_id or not getattr(task, "checklist_item_id", None):
        return
    feature = await Feature.get(task.feature_id)
    if not feature:
        return
    checklist = getattr(feature, "checklist_items", []) or []
    for item in checklist:
        if str(item.get("_id", "")) == str(task.checklist_item_id):
            is_done = task.status == "DONE"
            if item.get("isCompleted") != is_done:
                item["isCompleted"] = is_done
                all_done = all(i.get("isCompleted") for i in checklist)
                if all_done:
                    feature.status = "DONE"
                elif feature.status == "DONE":
                    feature.status = "IN_PROGRESS"
                feature.checklist_items = checklist
                await feature.save()
            break


# ===========================================================================
# REQUIREMENTS (FR-701)
# ===========================================================================


@router.get("/requirements", summary="Get all requirements for the project")
async def get_requirements(
    request: Request,
    current_user: User = Depends(get_current_user),
):
    """Return all requirements for the calling user's active project."""
    project_id = await resolve_and_verify_project_id(request, current_user)
    if not project_id:
        return {"success": True, "requirements": []}

    requirements = (
        await Requirement.find(Requirement.project_id == project_id)
        .sort("-created_at")
        .to_list()
    )
    return {
        "success": True,
        "requirements": [r.model_dump(by_alias=True) for r in requirements],
    }


@router.post(
    "/requirements",
    status_code=status.HTTP_201_CREATED,
    summary="Create a requirement",
)
async def create_requirement(
    request: Request,
    body: CreateRequirementBody,
    current_user: User = Depends(require_roles("STUDENT", "ADMIN")),
):
    """Create a new functional or non-functional requirement."""
    project_id = await resolve_and_verify_project_id(request, current_user)
    if not project_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Active project group required.",
        )

    req_type = body.type or "FUNCTIONAL"
    prefix = "FR-" if req_type == "FUNCTIONAL" else "NFR-"
    count = await Requirement.find(
        Requirement.project_id == project_id,
        Requirement.type == req_type,
    ).count()
    code = f"{prefix}{str(count + 1).zfill(3)}"

    req_doc = Requirement(
        project_id=project_id,
        code=code,
        title=body.title,
        description=body.description,
        type=req_type,
        priority=body.priority or "MEDIUM",
        status=body.status or "PLANNED",
        linked_features=body.linked_features or [],
        created_by=current_user.id,
    )
    await req_doc.insert()

    return {"success": True, "requirement": req_doc.model_dump(by_alias=True)}


@router.put(
    "/requirements/{req_id}",
    summary="Update a requirement",
)
async def update_requirement(
    request: Request,
    req_id: PydanticObjectId,
    body: UpdateRequirementBody,
    current_user: User = Depends(require_roles("STUDENT", "ADMIN")),
):
    """Update any field of an existing requirement."""
    project_id = await resolve_and_verify_project_id(request, current_user)

    requirement = await Requirement.find_one(
        Requirement.id == req_id,
        Requirement.project_id == project_id,
    )
    if not requirement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Requirement not found or unauthorized.",
        )

    update_data = body.model_dump(exclude_none=True)
    for field, value in update_data.items():
        setattr(requirement, field, value)
    await requirement.save()

    return {"success": True, "requirement": requirement.model_dump(by_alias=True)}


@router.delete(
    "/requirements/{req_id}",
    summary="Delete a requirement",
)
async def delete_requirement(
    request: Request,
    req_id: PydanticObjectId,
    current_user: User = Depends(require_roles("STUDENT", "ADMIN")),
):
    """Delete a requirement document."""
    project_id = await resolve_and_verify_project_id(request, current_user)

    requirement = await Requirement.find_one(
        Requirement.id == req_id,
        Requirement.project_id == project_id,
    )
    if not requirement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Requirement not found or unauthorized.",
        )

    await requirement.delete()
    return {"success": True, "message": "Requirement deleted successfully."}


# ===========================================================================
# FEATURES
# ===========================================================================


@router.get("/features", summary="Get all features for the project")
async def get_features(
    request: Request,
    current_user: User = Depends(get_current_user),
):
    """Return all features with calculated checklist progress."""
    project_id = await resolve_and_verify_project_id(request, current_user)
    if not project_id:
        return {"success": True, "features": []}

    features = (
        await Feature.find(Feature.project_id == project_id)
        .sort("-created_at")
        .to_list()
    )

    features_with_stats = []
    for f in features:
        f_dict = f.model_dump(by_alias=True)
        checklist = f_dict.get("checklistItems") or []
        total_items = len(checklist)
        completed_items = sum(1 for item in checklist if item.get("isCompleted"))
        progress = (
            round((completed_items / total_items) * 100) if total_items > 0 else 0
        )
        f_dict["totalItems"] = total_items
        f_dict["completedItems"] = completed_items
        f_dict["progress"] = progress
        features_with_stats.append(f_dict)

    return {"success": True, "features": features_with_stats}


@router.post(
    "/features",
    status_code=status.HTTP_201_CREATED,
    summary="Create a feature",
)
async def create_feature(
    request: Request,
    body: CreateFeatureBody,
    current_user: User = Depends(require_roles("STUDENT", "ADMIN")),
):
    """Create a new project feature and notify group members."""
    project_id = await resolve_and_verify_project_id(request, current_user)
    if not project_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Active project group required.",
        )

    feature = Feature(
        project_id=project_id,
        title=body.title,
        description=body.description or "",
        priority=body.priority or "MEDIUM",
        start_date=body.start_date,
        target_end_date=body.target_end_date,
        created_by=current_user.id,
        status="TO_DO",
    )
    await feature.insert()

    await notify_project_members(
        project_id=project_id,
        actor=current_user,
        event_type="FEATURE",
        title="New Feature Added",
        message=f"{current_user.name} created a new feature: \"{feature.title}\"",
    )

    return {"success": True, "feature": feature.model_dump(by_alias=True)}


@router.put(
    "/features/{feature_id}",
    summary="Update a feature",
)
async def update_feature(
    request: Request,
    feature_id: PydanticObjectId,
    body: UpdateFeatureBody,
    current_user: User = Depends(require_roles("STUDENT", "ADMIN")),
):
    """Update a feature; auto-adjusts status based on checklist completion."""
    project_id = await resolve_and_verify_project_id(request, current_user)

    feature = await Feature.find_one(
        Feature.id == feature_id,
        Feature.project_id == project_id,
    )
    if not feature:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feature not found or unauthorized.",
        )

    update_data = body.model_dump(exclude_none=True)

    # Auto-adjust status based on checklist items
    checklist_items = update_data.get("checklist_items")
    if checklist_items and len(checklist_items) > 0:
        all_done = all(i.get("isCompleted") for i in checklist_items)
        if all_done:
            update_data["status"] = "DONE"
        elif update_data.get("status") == "DONE":
            update_data["status"] = "IN_PROGRESS"

    for field, value in update_data.items():
        setattr(feature, field, value)
    await feature.save()

    await notify_project_members(
        project_id=project_id,
        actor=current_user,
        event_type="FEATURE",
        title="Feature Updated",
        message=f"{current_user.name} updated the feature: \"{feature.title}\"",
    )

    return {"success": True, "feature": feature.model_dump(by_alias=True)}


@router.delete(
    "/features/{feature_id}",
    summary="Delete a feature",
)
async def delete_feature(
    request: Request,
    feature_id: PydanticObjectId,
    current_user: User = Depends(require_roles("STUDENT", "ADMIN")),
):
    """Delete a feature – blocked if tasks are still linked to it."""
    project_id = await resolve_and_verify_project_id(request, current_user)

    feature = await Feature.find_one(
        Feature.id == feature_id,
        Feature.project_id == project_id,
    )
    if not feature:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feature not found or unauthorized.",
        )

    linked_tasks_count = await Task.find(Task.feature_id == feature_id).count()
    if linked_tasks_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete feature. It is linked to {linked_tasks_count} task(s).",
        )

    await feature.delete()
    return {"success": True, "message": "Feature deleted successfully."}


# ===========================================================================
# SPRINTS (FR-801)
# ===========================================================================


@router.get("/sprints", summary="Get all sprints for the project")
async def get_sprints(
    request: Request,
    current_user: User = Depends(get_current_user),
):
    """Return all sprints sorted by start date descending."""
    project_id = await resolve_and_verify_project_id(request, current_user)
    if not project_id:
        return {"success": True, "sprints": []}

    sprints = (
        await Sprint.find(Sprint.project_id == project_id)
        .sort("-start_date")
        .to_list()
    )
    return {"success": True, "sprints": [s.model_dump(by_alias=True) for s in sprints]}


@router.post(
    "/sprints",
    status_code=status.HTTP_201_CREATED,
    summary="Create a sprint",
)
async def create_sprint(
    request: Request,
    body: CreateSprintBody,
    current_user: User = Depends(require_roles("STUDENT", "ADMIN")),
):
    """Create a new sprint for the project."""
    project_id = await resolve_and_verify_project_id(request, current_user)
    if not project_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Active project group required.",
        )

    sprint = Sprint(
        project_id=project_id,
        name=body.name,
        goal=body.goal,
        start_date=body.start_date,
        end_date=body.end_date,
    )
    await sprint.insert()

    return {"success": True, "sprint": sprint.model_dump(by_alias=True)}


@router.put(
    "/sprints/{sprint_id}",
    summary="Update a sprint",
)
async def update_sprint(
    request: Request,
    sprint_id: PydanticObjectId,
    body: UpdateSprintBody,
    current_user: User = Depends(require_roles("STUDENT", "ADMIN")),
):
    """Update sprint metadata (name, goal, dates)."""
    project_id = await resolve_and_verify_project_id(request, current_user)

    sprint = await Sprint.find_one(
        Sprint.id == sprint_id,
        Sprint.project_id == project_id,
    )
    if not sprint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sprint not found or unauthorized.",
        )

    update_data = body.model_dump(exclude_none=True)
    for field, value in update_data.items():
        setattr(sprint, field, value)
    await sprint.save()

    return {"success": True, "sprint": sprint.model_dump(by_alias=True)}


@router.put(
    "/sprints/{sprint_id}/status",
    summary="Update sprint status",
)
async def update_sprint_status(
    request: Request,
    sprint_id: PydanticObjectId,
    body: UpdateSprintStatusBody,
    current_user: User = Depends(require_roles("STUDENT", "ADMIN")),
):
    """Transition a sprint between PLANNED, ACTIVE, COMPLETED, and CANCELLED."""
    valid_statuses = {"PLANNED", "ACTIVE", "COMPLETED", "CANCELLED"}
    if body.status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid sprint status.",
        )

    project_id = await resolve_and_verify_project_id(request, current_user)

    if body.status == "ACTIVE":
        active_count = await Sprint.find(
            Sprint.project_id == project_id,
            Sprint.status == "ACTIVE",
        ).count()
        if active_count > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Another sprint is already active. Complete it first.",
            )

    sprint = await Sprint.find_one(
        Sprint.id == sprint_id,
        Sprint.project_id == project_id,
    )
    if not sprint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sprint not found or unauthorized.",
        )

    sprint.status = body.status
    await sprint.save()

    return {"success": True, "sprint": sprint.model_dump(by_alias=True)}


@router.delete(
    "/sprints/{sprint_id}",
    summary="Delete a sprint",
)
async def delete_sprint(
    request: Request,
    sprint_id: PydanticObjectId,
    current_user: User = Depends(require_roles("STUDENT", "ADMIN")),
):
    """Delete a sprint and move its tasks back to the backlog."""
    project_id = await resolve_and_verify_project_id(request, current_user)

    sprint = await Sprint.find_one(
        Sprint.id == sprint_id,
        Sprint.project_id == project_id,
    )
    if not sprint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sprint not found or unauthorized.",
        )

    await sprint.delete()

    # Move associated tasks back to backlog
    sprint_tasks = await Task.find(Task.sprint_id == sprint_id).to_list()
    for t in sprint_tasks:
        t.sprint_id = None
        await t.save()

    return {
        "success": True,
        "message": "Sprint deleted successfully. Associated tasks moved to backlog.",
    }


# ===========================================================================
# TASKS & KANBAN (FR-901, FR-902 & FR-802)
# ===========================================================================


@router.get("/tasks", summary="Get all tasks for the project")
async def get_tasks(
    request: Request,
    sprint_id: Optional[str] = Query(None, alias="sprintId"),
    task_status: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(get_current_user),
):
    """Return tasks, optionally filtered by sprint and/or status."""
    project_id = await resolve_and_verify_project_id(request, current_user)
    if not project_id:
        return {"success": True, "tasks": []}

    query: Dict[str, Any] = {"project_id": project_id}
    if sprint_id:
        query["sprint_id"] = PydanticObjectId(sprint_id)
    if task_status:
        query["status"] = task_status

    tasks = await Task.find(query).sort("-updated_at").to_list()
    return {"success": True, "tasks": [t.model_dump(by_alias=True) for t in tasks]}


@router.post(
    "/tasks",
    status_code=status.HTTP_201_CREATED,
    summary="Create a task",
)
async def create_task(
    request: Request,
    body: CreateTaskBody,
    current_user: User = Depends(require_roles("STUDENT", "ADMIN")),
):
    """Create a new task; auto-generates a sequential task key."""
    project_id = await resolve_and_verify_project_id(request, current_user)
    if not project_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Active project group required.",
        )

    project = await Project.get(project_id)
    key_prefix = (project.project_key if project else None) or "PROJ"

    last_task = await Task.find(Task.project_id == project_id).sort("-task_number").first_or_none()
    task_number = (getattr(last_task, "task_number", 0) or 0) + 1
    task_key = f"{key_prefix}-{str(task_number).zfill(3)}"

    task = Task(
        project_id=project_id,
        task_key=task_key,
        task_number=task_number,
        title=body.title,
        description=body.description,
        feature_id=body.feature_id,
        sprint_id=body.sprint_id,
        checklist_item_id=body.checklist_item_id,
        assignee_id=body.assignee_id or current_user.id,
        reporter_id=current_user.id,
        priority=body.priority or "MEDIUM",
        status="TO_DO",
        story_points=body.story_points or 1,
        labels=body.labels or [],
        start_date=body.start_date,
        start_time=body.start_time or "",
        due_date=body.due_date,
        due_time=body.due_time or "",
        is_calendar_event_only=body.is_calendar_event_only or False,
    )
    await task.insert()

    await notify_project_members(
        project_id=project_id,
        actor=current_user,
        event_type="TASK",
        title="New Task Created",
        message=f"{current_user.name} created a new task: \"{body.title}\"",
    )

    return {"success": True, "task": task.model_dump(by_alias=True)}


@router.put(
    "/tasks/{task_id}",
    summary="Update a task",
)
async def update_task(
    request: Request,
    task_id: PydanticObjectId,
    body: UpdateTaskBody,
    current_user: User = Depends(
        require_roles("STUDENT", "ADMIN", "FACULTY", "COORDINATOR")
    ),
):
    """Update task fields and notify group members."""
    task = await Task.get(task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found.",
        )

    update_data = body.model_dump(exclude_none=True)
    for field, value in update_data.items():
        setattr(task, field, value)
    await task.save()

    project_id = await resolve_and_verify_project_id(request, current_user)
    if project_id:
        await notify_project_members(
            project_id=project_id,
            actor=current_user,
            event_type="TASK",
            title="Task Updated",
            message=f"{current_user.name} updated the task: \"{task.title}\"",
        )
        await _sync_checklist_item_status(task)

    return {"success": True, "task": task.model_dump(by_alias=True)}


@router.put(
    "/tasks/{task_id}/status",
    summary="Update task status (Kanban drag-and-drop)",
)
async def update_task_status(
    request: Request,
    task_id: PydanticObjectId,
    body: UpdateTaskStatusBody,
    current_user: User = Depends(
        require_roles("STUDENT", "ADMIN", "FACULTY", "COORDINATOR")
    ),
):
    """Change only the status of a task (used by the Kanban board)."""
    valid_statuses = {"TO_DO", "IN_PROGRESS", "IN_REVIEW", "DONE"}
    if body.status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid status.",
        )

    task = await Task.get(task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found.",
        )

    old_status = task.status
    task.status = body.status
    await task.save()

    if old_status != body.status:
        project_id = await resolve_and_verify_project_id(request, current_user)
        if project_id:
            await notify_project_members(
                project_id=project_id,
                actor=current_user,
                event_type="TASK",
                title="Task Status Changed",
                message=(
                    f"{current_user.name} moved task \"{task.title}\" "
                    f"from {old_status.replace('_', ' ')} to {body.status.replace('_', ' ')}"
                ),
            )
        await _sync_checklist_item_status(task)

    return {"success": True, "task": task.model_dump(by_alias=True)}


@router.delete(
    "/tasks/{task_id}",
    summary="Delete a task",
)
async def delete_task(
    request: Request,
    task_id: PydanticObjectId,
    current_user: User = Depends(require_roles("STUDENT", "ADMIN")),
):
    """Delete a task and notify project members."""
    project_id = await resolve_and_verify_project_id(request, current_user)

    task = await Task.find_one(
        Task.id == task_id,
        Task.project_id == project_id,
    )
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found or unauthorized.",
        )

    task_title = task.title
    await task.delete()

    await notify_project_members(
        project_id=project_id,
        actor=current_user,
        event_type="TASK",
        title="Task Deleted",
        message=f"{current_user.name} deleted task: \"{task_title}\"",
    )

    return {"success": True, "message": "Task deleted successfully."}


# ===========================================================================
# BUGS (FR-903)
# ===========================================================================


@router.get("/bugs", summary="Get all bugs for the project")
async def get_bugs(
    request: Request,
    current_user: User = Depends(get_current_user),
):
    """Return all bugs for the active project, sorted newest-first."""
    project_id = await resolve_and_verify_project_id(request, current_user)
    if not project_id:
        return {"success": True, "bugs": []}

    bugs = (
        await Bug.find(Bug.project_id == project_id)
        .sort("-created_at")
        .to_list()
    )
    return {"success": True, "bugs": [b.model_dump(by_alias=True) for b in bugs]}


@router.post(
    "/bugs",
    status_code=status.HTTP_201_CREATED,
    summary="Log a new bug",
)
async def create_bug(
    request: Request,
    body: CreateBugBody,
    current_user: User = Depends(require_roles("STUDENT", "ADMIN")),
):
    """Log a new bug and notify project members."""
    project_id = await resolve_and_verify_project_id(request, current_user)
    if not project_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Active project group required.",
        )

    project = await Project.get(project_id)
    key_prefix = (project.project_key if project else None) or "PROJ"

    bug_count = await Bug.find(Bug.project_id == project_id).count()
    bug_key = f"{key_prefix}-BUG-{str(bug_count + 1).zfill(3)}"

    bug = Bug(
        project_id=project_id,
        bug_key=bug_key,
        title=body.title,
        description=body.description,
        priority=body.priority or "MEDIUM",
        status=body.status or "OPEN",
        feature_id=body.feature_id,
        assignee_id=body.assignee_id,
        reporter_id=current_user.id,
        due_date=body.due_date,
        attachment_url=body.attachment_url or "",
    )
    await bug.insert()

    await notify_project_members(
        project_id=project_id,
        actor=current_user,
        event_type="BUG",
        title="New Bug Logged",
        message=f"{current_user.name} logged a bug: \"{bug.title}\"",
    )

    return {"success": True, "bug": bug.model_dump(by_alias=True)}


@router.put(
    "/bugs/{bug_id}/status",
    summary="Update bug status",
)
async def update_bug_status(
    request: Request,
    bug_id: PydanticObjectId,
    body: UpdateBugStatusBody,
    current_user: User = Depends(require_roles("STUDENT", "ADMIN", "FACULTY")),
):
    """Change only the status field of a bug."""
    valid_statuses = {"OPEN", "IN_PROGRESS", "FIXED", "CLOSED", "REOPENED"}
    if body.status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid bug status.",
        )

    bug = await Bug.get(bug_id)
    if not bug:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bug not found.",
        )

    old_status = bug.status
    bug.status = body.status
    await bug.save()

    if old_status != body.status:
        project_id = await resolve_and_verify_project_id(request, current_user)
        if project_id:
            await notify_project_members(
                project_id=project_id,
                actor=current_user,
                event_type="BUG",
                title="Bug Status Changed",
                message=(
                    f"{current_user.name} moved bug \"{bug.title}\" "
                    f"from {old_status.replace('_', ' ')} to {body.status.replace('_', ' ')}"
                ),
            )

    return {"success": True, "bug": bug.model_dump(by_alias=True)}


@router.put(
    "/bugs/{bug_id}",
    summary="Update bug details",
)
async def update_bug(
    request: Request,
    bug_id: PydanticObjectId,
    body: UpdateBugBody,
    current_user: User = Depends(require_roles("STUDENT", "ADMIN", "FACULTY")),
):
    """Update bug fields. Pass assignee_id as empty string to clear the assignment."""
    project_id = await resolve_and_verify_project_id(request, current_user)

    bug = await Bug.find_one(
        Bug.id == bug_id,
        Bug.project_id == project_id,
    )
    if not bug:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bug not found or unauthorized.",
        )

    update_data = body.model_dump(exclude_unset=True)
    # Empty-string assignee_id means "clear"
    if "assignee_id" in update_data and update_data["assignee_id"] == "":
        update_data["assignee_id"] = None

    for field, value in update_data.items():
        setattr(bug, field, value)
    await bug.save()

    await notify_project_members(
        project_id=project_id,
        actor=current_user,
        event_type="BUG",
        title="Bug Updated",
        message=f"{current_user.name} updated the bug: \"{bug.title}\"",
    )

    return {"success": True, "bug": bug.model_dump(by_alias=True)}


@router.delete(
    "/bugs/{bug_id}",
    summary="Delete a bug",
)
async def delete_bug(
    request: Request,
    bug_id: PydanticObjectId,
    current_user: User = Depends(require_roles("STUDENT", "ADMIN")),
):
    """Delete a bug report and notify project members."""
    project_id = await resolve_and_verify_project_id(request, current_user)

    bug = await Bug.find_one(
        Bug.id == bug_id,
        Bug.project_id == project_id,
    )
    if not bug:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bug not found or unauthorized.",
        )

    bug_title = bug.title
    await bug.delete()

    await notify_project_members(
        project_id=project_id,
        actor=current_user,
        event_type="BUG",
        title="Bug Deleted",
        message=f"{current_user.name} deleted the bug: \"{bug_title}\"",
    )

    return {"success": True, "message": "Bug deleted successfully."}


# ===========================================================================
# TRACEABILITY MATRIX (FR-706)
# ===========================================================================


@router.get("/traceability", summary="Get Requirements → Features → Tasks → Bugs traceability chain")
async def get_traceability_chain(
    request: Request,
    current_user: User = Depends(get_current_user),
):
    """
    Build and return the full traceability chain:
    Requirement → linked Features → Tasks under those Features → Bugs under those Tasks/Features.
    """
    project_id = await resolve_and_verify_project_id(request, current_user)
    if not project_id:
        return {"success": True, "chain": []}

    requirements = await Requirement.find(
        Requirement.project_id == project_id
    ).to_list()
    features = await Feature.find(Feature.project_id == project_id).to_list()
    tasks = await Task.find(Task.project_id == project_id).to_list()
    bugs = await Bug.find(Bug.project_id == project_id).to_list()

    chain = []
    for req in requirements:
        linked_feature_ids_raw: list = getattr(req, "linked_features", []) or []
        linked_feature_ids = [str(fid) for fid in linked_feature_ids_raw]

        linked_features = [
            f for f in features if str(f.id) in linked_feature_ids
        ]

        linked_tasks = [
            t for t in tasks
            if t.feature_id and str(t.feature_id) in linked_feature_ids
        ]
        linked_task_ids = [str(t.id) for t in linked_tasks]

        linked_bugs = [
            b for b in bugs
            if (
                (b.feature_id and str(b.feature_id) in linked_feature_ids)
                or (getattr(b, "task_id", None) and str(b.task_id) in linked_task_ids)
                or (getattr(b, "requirement_id", None) and str(b.requirement_id) == str(req.id))
            )
        ]

        chain.append(
            {
                "requirement": req.model_dump(by_alias=True),
                "features": [f.model_dump(by_alias=True) for f in linked_features],
                "tasks": [t.model_dump(by_alias=True) for t in linked_tasks],
                "bugs": [b.model_dump(by_alias=True) for b in linked_bugs],
            }
        )

    return {"success": True, "chain": chain}
