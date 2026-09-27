from app.core.schemas import CamelModel
"""
FastAPI router for Project Groups.
Converted from: groupController.js + groupRoutes.js
Prefix: /api/groups
"""

from __future__ import annotations

import random
import string
from datetime import datetime, timezone
from typing import Optional

from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.core.security import get_current_user, require_roles
from app.models.group_member import GroupMember
from app.models.project_group import ProjectGroup
from app.models.student_profile import StudentProfile
from app.models.user import User
from app.utils.audit_logger import log_audit_event

router = APIRouter(prefix="/api/groups", tags=["groups"])


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------


class CreateGroupBody(CamelModel):
    """Request body for creating a new project group."""

    name: str
    sgp_cycle_id: Optional[PydanticObjectId] = None
    department_id: Optional[PydanticObjectId] = None


class JoinByCodeBody(CamelModel):
    """Request body for joining a group by its short code."""

    code: str


class InviteMemberBody(CamelModel):
    """Request body for inviting a student to a group."""

    search_identifier: str  # enrollment number OR e-mail


class RespondInviteBody(CamelModel):
    """Request body for accepting or rejecting an invite."""

    action: str  # "ACCEPT" | "REJECT"


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------


def _generate_group_code() -> str:
    """Generate a unique group code like GRP-2026-X8A2."""
    suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"GRP-{datetime.now(timezone.utc).year}-{suffix}"


# ---------------------------------------------------------------------------
# POST /api/groups  – create group
# ---------------------------------------------------------------------------


@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    summary="Create a new project group",
)
async def create_group(
    request: Request,
    body: CreateGroupBody,
    current_user: User = Depends(require_roles("STUDENT", "ADMIN")),
):
    """
    Create a new project group.
    The calling student is automatically made the group leader.
    """
    # Check if student is already in an active group
    existing_membership = await GroupMember.find_one(
        GroupMember.user_id == current_user.id,
        GroupMember.status == "ACCEPTED",
    )
    if existing_membership:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already belong to an active project group.",
        )

    group_code = _generate_group_code()

    group = ProjectGroup(
        name=body.name,
        code=group_code,
        leader_id=current_user.id,
        sgp_cycle_id=body.sgp_cycle_id,
        department_id=body.department_id,
        status="FORMING",
    )
    await group.insert()

    leader_member = GroupMember(
        group_id=group.id,
        user_id=current_user.id,
        role="LEADER",
        status="ACCEPTED",
    )
    await leader_member.insert()

    await log_audit_event(
        actor=current_user,
        action="GROUP_CREATED",
        target_entity="ProjectGroup",
        target_id=group.id,
        details={"name": group.name, "code": group.code},
        request=request,
    )

    return {
        "success": True,
        "message": "Group created successfully.",
        "group": group.model_dump(by_alias=True),
        "membership": leader_member.model_dump(by_alias=True),
    }


# ---------------------------------------------------------------------------
# POST /api/groups/join-by-code  – join by code
# ---------------------------------------------------------------------------


@router.post(
    "/join-by-code",
    summary="Join an existing group using its group code",
)
async def join_group_by_code(
    request: Request,
    body: JoinByCodeBody,
    current_user: User = Depends(require_roles("STUDENT", "ADMIN")),
):
    """Join a project group using its short code (e.g. GRP-2026-X639)."""
    if not body.code or not body.code.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Group Code is required.",
        )

    trimmed_code = body.code.strip().upper()

    # Check if student is already in an active group
    existing_membership = await GroupMember.find_one(
        GroupMember.user_id == current_user.id,
        GroupMember.status == "ACCEPTED",
    )
    if existing_membership:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already belong to an active project group.",
        )

    group = await ProjectGroup.find_one(ProjectGroup.code == trimmed_code)
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No project group found with code '{trimmed_code}'.",
        )

    if group.status in ("LOCKED", "DISBANDED"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Group '{group.name}' is {group.status.lower()} and not accepting new members.",
        )

    membership = await GroupMember.find_one(
        GroupMember.group_id == group.id,
        GroupMember.user_id == current_user.id,
    )

    if membership:
        if membership.status == "ACCEPTED":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You are already a member of this group.",
            )
        membership.status = "ACCEPTED"
        await membership.save()
    else:
        membership = GroupMember(
            group_id=group.id,
            user_id=current_user.id,
            role="MEMBER",
            status="ACCEPTED",
        )
        await membership.insert()

    # Reject all other pending invitations for this student
    other_invites = await GroupMember.find(
        GroupMember.user_id == current_user.id,
        GroupMember.status == "INVITED",
        GroupMember.id != membership.id,
    ).to_list()
    for invite in other_invites:
        invite.status = "REJECTED"
        await invite.save()

    await log_audit_event(
        actor=current_user,
        action="GROUP_JOINED_BY_CODE",
        target_entity="ProjectGroup",
        target_id=group.id,
        details={"code": group.code},
        request=request,
    )

    return {
        "success": True,
        "message": f"Successfully joined group '{group.name}' ({group.code})!",
        "group": group.model_dump(by_alias=True),
    }


# ---------------------------------------------------------------------------
# GET /api/groups/my-group  – get current student's group
# ---------------------------------------------------------------------------


@router.get(
    "/my-group",
    summary="Get current student's group details and members",
)
async def get_my_group(
    current_user: User = Depends(get_current_user),
):
    """Return the calling user's active project group, or pending invites if none."""
    membership = await GroupMember.find_one(
        GroupMember.user_id == current_user.id,
        GroupMember.status == "ACCEPTED",
    )

    if not membership:
        # Return pending invites instead
        pending_invites_docs = await GroupMember.find(
            GroupMember.user_id == current_user.id,
            GroupMember.status == "INVITED",
        ).to_list()

        pending_invites = []
        for pi in pending_invites_docs:
            pi_dict = pi.model_dump(by_alias=True)
            if pi.group_id:
                grp = await ProjectGroup.get(pi.group_id)
                pi_dict["group"] = grp.model_dump(by_alias=True) if grp else None
            pending_invites.append(pi_dict)

        return {
            "success": True,
            "hasGroup": False,
            "group": None,
            "members": [],
            "pendingInvites": pending_invites,
        }

    group = await ProjectGroup.get(membership.group_id)
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found.",
        )

    # Get all accepted members with profiles
    member_docs = await GroupMember.find(
        GroupMember.group_id == group.id,
        GroupMember.status == "ACCEPTED",
    ).to_list()

    members = []
    for m in member_docs:
        m_dict = m.model_dump(by_alias=True)
        user_doc = await User.get(m.user_id)
        profile = None
        if user_doc:
            profile_doc = await StudentProfile.find_one(
                StudentProfile.user_id == user_doc.id
            )
            if profile_doc:
                profile = {
                    "skills": profile_doc.skills,
                    "interests": profile_doc.interests,
                    "bio": profile_doc.bio,
                    "semester": getattr(profile_doc, "semester", None),
                }
            m_dict["user"] = {
                **user_doc.model_dump(by_alias=True),
                "profile": profile,
            }
        members.append(m_dict)

    # Pending invites sent by this group
    pending_group_invites_docs = await GroupMember.find(
        GroupMember.group_id == group.id,
        GroupMember.status == "INVITED",
    ).to_list()
    pending_group_invites = []
    for inv in pending_group_invites_docs:
        inv_dict = inv.model_dump(by_alias=True)
        candidate = await User.get(inv.user_id)
        if candidate:
            inv_dict["user"] = {
                "name": candidate.name,
                "enrollmentNumber": getattr(candidate, "enrollment_number", None),
                "email": candidate.email,
            }
        pending_group_invites.append(inv_dict)

    return {
        "success": True,
        "hasGroup": True,
        "group": group.model_dump(by_alias=True),
        "userRoleInGroup": membership.role,
        "members": members,
        "pendingInvites": pending_group_invites,
    }


# ---------------------------------------------------------------------------
# POST /api/groups/{id}/invite  – invite member
# ---------------------------------------------------------------------------


@router.post(
    "/{group_id}/invite",
    status_code=status.HTTP_201_CREATED,
    summary="Invite a student to the group",
)
async def invite_member(
    request: Request,
    group_id: PydanticObjectId,
    body: InviteMemberBody,
    current_user: User = Depends(require_roles("STUDENT", "ADMIN")),
):
    """
    Invite a student (by enrollment number or email) to a project group.
    Only the group leader may send invitations.
    """
    group = await ProjectGroup.get(group_id)
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found.",
        )

    # Only leader can invite
    caller_membership = await GroupMember.find_one(
        GroupMember.group_id == group_id,
        GroupMember.user_id == current_user.id,
        GroupMember.status == "ACCEPTED",
    )
    if not caller_membership or caller_membership.role != "LEADER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the group leader can invite members.",
        )

    trimmed = body.search_identifier.strip()

    # Find student by enrollment number or email
    candidate = await User.find_one(
        User.role == "STUDENT",
        {
            "$or": [
                {"enrollment_number": trimmed.upper()},
                {"email": trimmed.lower()},
            ]
        },
    )
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No student found matching '{body.search_identifier}'.",
        )

    # Check if candidate is already in an accepted group
    candidate_active = await GroupMember.find_one(
        GroupMember.user_id == candidate.id,
        GroupMember.status == "ACCEPTED",
    )
    if candidate_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Student '{candidate.name}' ({getattr(candidate, 'enrollment_number', '')}) already belongs to a group.",
        )

    # Check existing invite
    existing_invite = await GroupMember.find_one(
        GroupMember.group_id == group_id,
        GroupMember.user_id == candidate.id,
    )
    if existing_invite:
        if existing_invite.status == "INVITED":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Student '{candidate.name}' has already been invited to this group.",
            )
        if existing_invite.status == "ACCEPTED":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Student '{candidate.name}' is already a member of this group.",
            )

    invite = GroupMember(
        group_id=group_id,
        user_id=candidate.id,
        role="MEMBER",
        status="INVITED",
        invited_by=current_user.id,
    )
    await invite.insert()

    await log_audit_event(
        actor=current_user,
        action="GROUP_MEMBER_INVITED",
        target_entity="ProjectGroup",
        target_id=group_id,
        details={"invitedStudent": getattr(candidate, "enrollment_number", "")},
        request=request,
    )

    return {
        "success": True,
        "message": f"Invitation sent to {candidate.name} ({getattr(candidate, 'enrollment_number', '')}).",
        "invite": invite.model_dump(by_alias=True),
    }


# ---------------------------------------------------------------------------
# POST /api/groups/invites/{invite_id}/respond  – respond to invite
# ---------------------------------------------------------------------------


@router.post(
    "/invites/{invite_id}/respond",
    summary="Respond to a group invitation (Accept / Reject)",
)
async def respond_invite(
    request: Request,
    invite_id: PydanticObjectId,
    body: RespondInviteBody,
    current_user: User = Depends(get_current_user),
):
    """Accept or reject a pending group invitation."""
    if body.action not in ("ACCEPT", "REJECT"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="action must be 'ACCEPT' or 'REJECT'.",
        )

    invite = await GroupMember.get(invite_id)
    if not invite or invite.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found or not assigned to you.",
        )

    if invite.status != "INVITED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This invitation has already been processed.",
        )

    if body.action == "ACCEPT":
        existing_accepted = await GroupMember.find_one(
            GroupMember.user_id == current_user.id,
            GroupMember.status == "ACCEPTED",
        )
        if existing_accepted:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You already belong to another active group.",
            )

        invite.status = "ACCEPTED"
        await invite.save()

        # Reject all other pending invitations for this student
        others = await GroupMember.find(
            GroupMember.user_id == current_user.id,
            GroupMember.status == "INVITED",
        ).to_list()
        for other in others:
            other.status = "REJECTED"
            await other.save()

        await log_audit_event(
            actor=current_user,
            action="GROUP_INVITE_ACCEPTED",
            target_entity="ProjectGroup",
            target_id=invite.group_id,
            request=request,
        )

        return {
            "success": True,
            "message": "Invitation accepted! You are now a member of the group.",
        }

    # REJECT
    invite.status = "REJECTED"
    await invite.save()
    return {"success": True, "message": "Invitation rejected."}


# ---------------------------------------------------------------------------
# POST /api/groups/{id}/leave  – leave group
# ---------------------------------------------------------------------------


@router.post(
    "/{group_id}/leave",
    summary="Leave a project group",
)
async def leave_group(
    request: Request,
    group_id: PydanticObjectId,
    current_user: User = Depends(get_current_user),
):
    """Remove the calling user from a project group. Reassigns leader if needed."""
    membership = await GroupMember.find_one(
        GroupMember.group_id == group_id,
        GroupMember.user_id == current_user.id,
        GroupMember.status == "ACCEPTED",
    )
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are not a member of this group.",
        )

    accepted_members = await GroupMember.find(
        GroupMember.group_id == group_id,
        GroupMember.status == "ACCEPTED",
    ).to_list()

    if membership.role == "LEADER" and len(accepted_members) > 1:
        next_leader = next(
            (m for m in accepted_members if m.user_id != current_user.id),
            None,
        )
        if next_leader:
            next_leader.role = "LEADER"
            await next_leader.save()
            group = await ProjectGroup.get(group_id)
            if group:
                group.leader_id = next_leader.user_id
                await group.save()

    await membership.delete()

    # Count remaining accepted members
    remaining = await GroupMember.find(
        GroupMember.group_id == group_id,
        GroupMember.status == "ACCEPTED",
    ).to_list()

    if len(remaining) == 0:
        group = await ProjectGroup.get(group_id)
        if group:
            group.status = "DISBANDED"
            await group.save()

    await log_audit_event(
        actor=current_user,
        action="GROUP_MEMBER_LEFT",
        target_entity="ProjectGroup",
        target_id=group_id,
        request=request,
    )

    return {"success": True, "message": "You have left the group."}


# ---------------------------------------------------------------------------
# GET /api/groups  – list all groups (coordinator / admin / faculty)
# ---------------------------------------------------------------------------


@router.get(
    "/",
    summary="List all groups (Coordinator / Admin / Faculty oversight)",
)
async def get_all_groups(
    department_id: Optional[str] = None,
    sgp_cycle_id: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(require_roles("ADMIN", "COORDINATOR", "FACULTY")),
):
    """Return all project groups, optionally filtered by department, cycle, or name/code."""
    query: dict = {}

    if department_id:
        query["department_id"] = PydanticObjectId(department_id)
    if sgp_cycle_id:
        query["sgp_cycle_id"] = PydanticObjectId(sgp_cycle_id)
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"code": {"$regex": search, "$options": "i"}},
        ]

    groups = await ProjectGroup.find(query).sort("-created_at").to_list()

    groups_with_members = []
    for g in groups:
        g_dict = g.model_dump(by_alias=True)
        members = await GroupMember.find(
            GroupMember.group_id == g.id,
            GroupMember.status == "ACCEPTED",
        ).to_list()
        member_list = []
        for m in members:
            m_dict = m.model_dump(by_alias=True)
            user_doc = await User.get(m.user_id)
            if user_doc:
                m_dict["user"] = {
                    "name": user_doc.name,
                    "enrollmentNumber": getattr(user_doc, "enrollment_number", None),
                    "email": user_doc.email,
                }
            member_list.append(m_dict)
        g_dict["members"] = member_list
        groups_with_members.append(g_dict)

    return {"success": True, "groups": groups_with_members}


# ---------------------------------------------------------------------------
# PUT /api/groups/{id}/ready  – mark group ready for proposal
# ---------------------------------------------------------------------------


@router.put(
    "/{group_id}/ready",
    summary="Mark group as Ready for Proposal",
)
async def mark_group_ready(
    request: Request,
    group_id: PydanticObjectId,
    current_user: User = Depends(require_roles("STUDENT", "ADMIN")),
):
    """Transition a FORMING group to READY_FOR_PROPOSAL state."""
    group = await ProjectGroup.get(group_id)
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found.",
        )

    caller_membership = await GroupMember.find_one(
        GroupMember.group_id == group_id,
        GroupMember.user_id == current_user.id,
        GroupMember.status == "ACCEPTED",
    )
    if not caller_membership or caller_membership.role != "LEADER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the group leader can mark the group as ready.",
        )

    if group.status != "FORMING":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Group is not in the FORMING state.",
        )

    accepted_members = await GroupMember.find(
        GroupMember.group_id == group_id,
        GroupMember.status == "ACCEPTED",
    ).to_list()
    accepted_count = len(accepted_members)

    min_members = getattr(group, "min_members", 2) or 2
    if accepted_count < min_members:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"At least {min_members} members are required to proceed. Currently have {accepted_count}.",
        )

    group.status = "READY_FOR_PROPOSAL"
    await group.save()

    await log_audit_event(
        actor=current_user,
        action="GROUP_MARKED_READY",
        target_entity="ProjectGroup",
        target_id=group_id,
        request=request,
    )

    return {
        "success": True,
        "message": "Group is now Ready for Proposal.",
        "group": group.model_dump(by_alias=True),
    }
