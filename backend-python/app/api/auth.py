from app.core.schemas import CamelModel
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.core.security import get_current_user, create_access_token
from app.core.security import verify_password
from app.models.user import User, UserRole
from app.models.student_profile import StudentProfile
from app.models.faculty_profile import FacultyProfile
from app.utils.audit_logger import log_audit_event

router = APIRouter(prefix="/api/auth", tags=["auth"])


# ─── Schemas ────────────────────────────────────────────────────────────────


class LoginRequest(CamelModel):
    login_id: str
    password: str


class LoginResponse(CamelModel):
    success: bool
    message: str
    token: Optional[str] = None
    user: Optional[dict] = None


# ─── Routes ─────────────────────────────────────────────────────────────────


@router.post("/login", response_model=LoginResponse)
async def login(body: LoginRequest, request: Request):
    """Authenticate user & get JWT token."""
    identifier = body.login_id.strip()

    # Find by enrollmentNumber OR email
    from beanie.operators import Or
    user = await User.find_one(
        Or(User.enrollment_number == identifier.upper(), User.email == identifier.lower())
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid enrollment number/email or password.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact an administrator.",
        )

    if not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid enrollment number/email or password.",
        )

    # Update last login
    user.last_login = datetime.now(timezone.utc)
    user.updated_at = datetime.now(timezone.utc)
    await user.save()

    # Generate JWT
    token = create_access_token(
        {
            "id": str(user.id),
            "role": user.role,
            "name": user.name,
            "enrollmentNumber": user.enrollment_number,
        }
    )

    # Load profile
    profile = None
    if user.role == UserRole.STUDENT:
        p = await StudentProfile.find_one(StudentProfile.user_id == user.id)
        profile = p.model_dump(mode="json") if p else None
    elif user.role in (UserRole.FACULTY, UserRole.COORDINATOR):
        p = await FacultyProfile.find_one(FacultyProfile.user_id == user.id)
        profile = p.model_dump(mode="json") if p else None

    # Audit log
    await log_audit_event(
        action="USER_LOGIN",
        actor=user,
        target_entity="User",
        target_id=str(user.id),
        details={"role": user.role},
        request=request,
    )

    user_dict = user.dict_safe()
    user_dict["profile"] = profile

    return LoginResponse(
        success=True,
        message="Login successful",
        token=token,
        user=user_dict,
    )


@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    """Get currently logged-in user profile."""
    profile = None
    if current_user.role == UserRole.STUDENT:
        p = await StudentProfile.find_one(StudentProfile.user_id == current_user.id)
        profile = p.model_dump(mode="json") if p else None
    elif current_user.role in (UserRole.FACULTY, UserRole.COORDINATOR):
        p = await FacultyProfile.find_one(FacultyProfile.user_id == current_user.id)
        profile = p.model_dump(mode="json") if p else None

    user_dict = current_user.dict_safe()
    user_dict["profile"] = profile

    return {"success": True, "user": user_dict}


@router.post("/logout")
async def logout(request: Request, current_user: User = Depends(get_current_user)):
    """Logout user (audit log only; JWT is stateless)."""
    await log_audit_event(
        action="USER_LOGOUT",
        actor=current_user,
        target_entity="User",
        target_id=str(current_user.id),
        request=request,
    )
    return {"success": True, "message": "Logged out successfully"}
