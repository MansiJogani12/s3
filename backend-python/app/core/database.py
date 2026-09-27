import motor.motor_asyncio
import beanie
from app.core.config import settings

# All models imported here so Beanie can initialize them
from app.models.user import User
from app.models.student_profile import StudentProfile
from app.models.faculty_profile import FacultyProfile
from app.models.department import Department
from app.models.academic_year import AcademicYear
from app.models.sgp_cycle import SGPCycle
from app.models.project_group import ProjectGroup
from app.models.group_member import GroupMember
from app.models.project import Project
from app.models.audit_log import AuditLog
from app.models.notification import Notification
from app.models.sprint import Sprint
from app.models.task import Task
from app.models.user_story import UserStory
from app.models.bug import Bug
from app.models.wiki_page import WikiPage
from app.models.milestone import Milestone
from app.models.release import Release
from app.models.review import Review
from app.models.review_mark import ReviewMark
from app.models.review_schedule import ReviewSchedule
from app.models.student_mark import StudentMark
from app.models.peer_evaluation import PeerEvaluation
from app.models.evaluation_criteria import EvaluationCriteria
from app.models.github_integration import GithubIntegration
from app.models.ci_pipeline_run import CiPipelineRun
from app.models.feature import Feature
from app.models.guidance_log import GuidanceLog
from app.models.project_file import ProjectFile
from app.models.proposal_feedback import ProposalFeedback
from app.models.requirement import Requirement
from app.models.epic import Epic
from app.models.system_config import SystemConfig
from app.models.chat_message import ChatMessage


async def init_db():
    client = motor.motor_asyncio.AsyncIOMotorClient(settings.MONGODB_URI)
    db = client.teamsync

    await beanie.init_beanie(
        database=db,
        document_models=[
            User,
            StudentProfile,
            FacultyProfile,
            Department,
            AcademicYear,
            SGPCycle,
            ProjectGroup,
            GroupMember,
            Project,
            AuditLog,
            Notification,
            Sprint,
            Task,
            UserStory,
            Bug,
            WikiPage,
            Milestone,
            Release,
            Review,
            ReviewMark,
            ReviewSchedule,
            StudentMark,
            PeerEvaluation,
            EvaluationCriteria,
            GithubIntegration,
            CiPipelineRun,
            Feature,
            GuidanceLog,
            ProjectFile,
            ProposalFeedback,
            Requirement,
            Epic,
            SystemConfig,
            ChatMessage,
        ],
    )
    print(f"[MongoDB Connected]: {settings.MONGODB_URI}")
