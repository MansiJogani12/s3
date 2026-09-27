"""
TeamSync Python Backend - Database Seed Script
Mirrors the Node.js seed.js script exactly.
Run: python seed.py
"""
import asyncio
from datetime import datetime, timezone

import motor.motor_asyncio
import beanie

from app.core.config import settings
from app.core.security import hash_password
from app.models.user import User, UserRole
from app.models.student_profile import StudentProfile
from app.models.faculty_profile import FacultyProfile
from app.models.department import Department
from app.models.academic_year import AcademicYear
from app.models.sgp_cycle import SGPCycle
from app.models.project_group import ProjectGroup
from app.models.group_member import GroupMember


async def seed():
    print("[Seed]: Connecting to MongoDB...")
    client = motor.motor_asyncio.AsyncIOMotorClient(settings.MONGODB_URI)
    db = client.get_default_database()

    await beanie.init_beanie(
        database=db,
        document_models=[
            User, StudentProfile, FacultyProfile,
            Department, AcademicYear, SGPCycle,
            ProjectGroup, GroupMember,
        ],
    )
    print("[MongoDB Connected]")

    # ── Clean existing collections ──────────────────────────────────────────
    print("[Seed]: Cleaning existing Collections...")
    await User.delete_all()
    await StudentProfile.delete_all()
    await FacultyProfile.delete_all()
    await Department.delete_all()
    await AcademicYear.delete_all()
    await SGPCycle.delete_all()
    await ProjectGroup.delete_all()
    await GroupMember.delete_all()

    print("[Seed]: Creating seed structure & accounts...")

    # ── Departments ─────────────────────────────────────────────────────────
    dept_it = await Department(
        name="Information Technology",
        code="IT",
        description="Department of Information Technology & Software Engineering",
        is_active=True,
    ).insert()

    dept_cse = await Department(
        name="Computer Science & Engineering",
        code="CSE",
        description="Department of Computer Science & Artificial Intelligence",
        is_active=True,
    ).insert()

    print("* Departments created: IT, CSE")

    # ── Academic Year ────────────────────────────────────────────────────────
    acad_year = await AcademicYear(
        year_label="2025-2026",
        start_date=datetime(2025, 7, 1, tzinfo=timezone.utc),
        end_date=datetime(2026, 6, 30, tzinfo=timezone.utc),
        is_active=True,
    ).insert()

    print("* Academic Year created: 2025-2026")

    # ── SGP Cycle ────────────────────────────────────────────────────────────
    sgp_cycle = await SGPCycle(
        name="SGP-V 2026 (Semester 5 Project)",
        department_id=dept_it.id,
        academic_year_id=acad_year.id,
        start_date=datetime(2026, 1, 10, tzinfo=timezone.utc),
        end_date=datetime(2026, 5, 30, tzinfo=timezone.utc),
        is_active=True,
    ).insert()

    print("* SGP Cycle created: SGP-V 2026")

    # ── Admin Account ─────────────────────────────────────────────────────────
    admin_user = await User(
        name="System Administrator",
        email="admin@teamsync.edu",
        password_hash=hash_password("admin123"),
        role=UserRole.ADMIN,
        is_active=True,
    ).insert()

    print("* Admin created: admin@teamsync.edu / admin123")

    # ── Coordinator Account ──────────────────────────────────────────────────
    coord_user = await User(
        name="Prof. Hitesh Patel",
        email="coordinator@teamsync.edu",
        password_hash=hash_password("coord123"),
        role=UserRole.COORDINATOR,
        is_active=True,
    ).insert()

    await FacultyProfile(
        user_id=coord_user.id,
        department_id=dept_it.id,
        designation="Associate Professor & SGP Coordinator",
        expertise=["Cloud Computing", "Software Architecture"],
    ).insert()

    print("* Coordinator created: coordinator@teamsync.edu / coord123")

    # ── Faculty Account ───────────────────────────────────────────────────────
    faculty_user = await User(
        name="Dr. Ananya Sharma",
        email="faculty@teamsync.edu",
        password_hash=hash_password("faculty123"),
        role=UserRole.FACULTY,
        is_active=True,
    ).insert()

    await FacultyProfile(
        user_id=faculty_user.id,
        department_id=dept_it.id,
        designation="Assistant Professor",
        expertise=["Artificial Intelligence", "Data Science"],
    ).insert()

    print("* Faculty created: faculty@teamsync.edu / faculty123")

    # ── Student 1 ─────────────────────────────────────────────────────────────
    student1 = await User(
        name="Rahul Sharma",
        enrollment_number="24IT001",
        password_hash=hash_password("student123"),
        role=UserRole.STUDENT,
        is_active=True,
    ).insert()

    await StudentProfile(
        user_id=student1.id,
        enrollment_number="24IT001",
        department_id=dept_it.id,
        semester=5,
        skills=["React", "Node.js", "MongoDB"],
        interests=["Web Development", "AI"],
        bio="Enthusiastic full-stack developer passionate about building web apps.",
    ).insert()

    print("* Student 1 created: 24IT001 / student123")

    # ── Student 2 ─────────────────────────────────────────────────────────────
    student2 = await User(
        name="Priya Verma",
        enrollment_number="24IT002",
        password_hash=hash_password("student123"),
        role=UserRole.STUDENT,
        is_active=True,
    ).insert()

    await StudentProfile(
        user_id=student2.id,
        enrollment_number="24IT002",
        department_id=dept_it.id,
        semester=5,
        skills=["UI/UX Design", "Tailwind CSS", "Python"],
        interests=["Frontend", "Machine Learning"],
        bio="Design enthusiast and frontend builder.",
    ).insert()

    print("* Student 2 created: 24IT002 / student123")

    print("\n[Seed Success]: Database populated with initial structure and test accounts!")
    client.close()


if __name__ == "__main__":
    asyncio.run(seed())
