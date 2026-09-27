# Software Requirements Specification (SRS)
## TeamSync — College SGP Project Management, Collaboration, Review, Evaluation & AI-Assisted Project Intelligence Platform

**Document version:** 1.0
**Format reference:** Based on IEEE 830 / ISO-29148 style SRS structure

*Ye teesra document hai is set me — PRD (`TeamSync-PRD.md`) "kya connected hai" batata hai, Formal PRD (`TeamSync-Formal-PRD.md`) "kyun aur kis liye" batata hai, aur ye SRS "system ko exactly kaise behave karna hai, requirement-by-requirement" define karta hai. Antigravity ko teeno saath dena.*

---

## 1. Introduction

### 1.1 Purpose
Ye document TeamSync software system ki complete functional aur non-functional requirements define karta hai, taaki development team (ya AI coding agent) ambiguity ke bina implementation kar sake.

### 1.2 Scope
TeamSync ek web-based platform hai jo college SGP (Student Group Project) ke poore lifecycle ko digitize karta hai: account provisioning, group formation, project proposal, faculty review, agile project execution (requirements/epics/stories/backlog/sprints/kanban/tasks/bugs), documentation, collaboration (wiki/chat), source-control integration (GitHub), academic review, weighted evaluation, analytics, aur audit logging.

### 1.3 Intended Audience
- Development team / AI build agent (e.g., Antigravity)
- QA/testers
- Institution admin (as functional reviewer)

### 1.4 Definitions, Acronyms, Abbreviations

| Term | Meaning |
|---|---|
| SGP | Student Group Project |
| RBAC | Role-Based Access Control |
| IDOR | Insecure Direct Object Reference |
| JWT | JSON Web Token |
| CRUD | Create, Read, Update, Delete |
| PRD | Product Requirements Document |

### 1.5 References
- `TeamSync-PRD.md` (data model / entity relationships)
- `TeamSync-Formal-PRD.md` (goals, personas, success metrics)

---

## 2. Overall Description

### 2.1 Product Perspective
TeamSync ek standalone, single-institution web application hai. Frontend React (Vite, JS/JSX) SPA hai jo Express.js REST API se Axios/React Query ke through communicate karta hai. MongoDB persistence layer hai. Koi legacy system integration required nahi hai; GitHub external integration ek optional connected service hai.

### 2.2 Product Functions (high-level)
1. Account provisioning & authentication (enrollment-number based)
2. Institutional structure management (departments, academic years, SGP cycles)
3. Group formation and membership management
4. Project ideation (AI-assisted), similarity/plagiarism detection
5. Proposal submission & multi-stage faculty approval
6. Agile project management suite (requirements→epics→stories→backlog→sprints→kanban→tasks→bugs)
7. Collaboration tools (wiki, chat, file storage)
8. GitHub integration and release tracking
9. Faculty review scheduling and structured feedback
10. Configurable weighted evaluation and automatic score computation
11. Notifications
12. Role-scoped analytics dashboards
13. AI-assisted project risk scoring
14. Audit logging
15. Full RBAC enforcement across every module

### 2.3 User Classes and Characteristics
| Class | Technical proficiency | Frequency of use |
|---|---|---|
| Admin | Medium-High | Regular (setup + oversight) |
| Coordinator | Medium | Regular (weekly monitoring) |
| Faculty | Low-Medium | Periodic (review cycles) |
| Student | Medium | Daily (active development) |

### 2.4 Operating Environment
- Server: Node.js runtime, MongoDB database (self-hosted or Atlas)
- Client: Modern evergreen browsers (Chrome/Edge/Firefox/Safari), responsive across desktop/tablet/mobile
- Deployment target: standard cloud VM/container or PaaS (not specified further — implementer's choice)

### 2.5 Design and Implementation Constraints
- **Language constraint:** JavaScript only. `.js` / `.jsx` files exclusively. No `.ts` / `.tsx` anywhere in the codebase.
- **Frontend stack:** React, Vite, Tailwind CSS, React Router, Axios, TanStack React Query, Zustand (as needed).
- **Backend stack:** Node.js, Express.js, MongoDB, Mongoose, JWT/session auth, Zod (or equivalent) validation.
- **No student self-registration** — this is a hard business constraint, not just a UI decision; must be enforced at the API layer too (no public `POST /api/auth/register` for students).
- Secrets only via environment variables; `.env.example` provided; nothing committed to version control.
- GitHub tokens must never be exposed to the frontend/client bundle.

### 2.6 Assumptions and Dependencies
- Single-institution deployment (no multi-tenancy).
- An AI provider (LLM API) is available and configured via env var for AI recommendation/similarity/risk features; if absent, those features must degrade gracefully rather than fabricate output.
- Institution provides enrollment number format and initial department/academic-year data at setup time.

---

## 3. System Features (Functional Requirements)

Each feature below is written as testable requirements (FR-xxx), grouped by module. This directly maps to the modules in the technical PRD.

### 3.1 Authentication & Session (FR-1xx)
- FR-101: System shall allow ONLY Admin-created accounts to log in; no public registration endpoint for students shall exist.
- FR-102: Student login shall require Enrollment Number + Password (no other field).
- FR-103: System shall NOT display or provide a "Login with Google" option on the student-facing login page.
- FR-104: System shall hash all passwords before storage (irreversible hashing algorithm); plaintext passwords shall never be persisted or logged.
- FR-105: System shall issue a JWT or secure session token on successful login and validate it on every protected request.
- FR-106: System shall expose `GET /api/auth/me` to retrieve the current authenticated user's profile (excluding password hash).
- FR-107: System shall expose `POST /api/auth/logout` to invalidate the session/token.
- FR-108: On login, system shall redirect the user to a role-specific dashboard (Admin/Coordinator/Faculty/Student).

### 3.2 Admin Account & Structure Management (FR-2xx)
- FR-201: Admin shall be able to create Student, Faculty, and Coordinator accounts with role-appropriate fields.
- FR-202: Admin shall be able to search, filter, edit, activate, deactivate, and reset the password of any account.
- FR-203: Admin shall be able to create/edit/deactivate Departments, Academic Years, and SGP Cycles.
- FR-204: System shall prevent creation of duplicate Enrollment Numbers (unique constraint).
- FR-205: Deactivated accounts shall be denied login with an appropriate error, without revealing account existence details beyond "invalid credentials or inactive account."

### 3.3 Student Profile (FR-3xx)
- FR-301: Student shall be able to view and edit allowed profile fields (skills, interests, technologies, bio, preferred domains).
- FR-302: Enrollment Number field shall be read-only for the student (editable only by Admin).
- FR-303: Institutional fields (department, semester, academic year) shall be editable only by Admin.

### 3.4 Group Management (FR-4xx)
- FR-401: Student shall be able to create a Project Group with a unique group code within the active SGP cycle.
- FR-402: Group creator shall become the default Leader.
- FR-403: Leader shall be able to invite students; invited students shall be able to accept or reject.
- FR-404: A student shall not be allowed to belong to more than one active group within the same SGP cycle.
- FR-405: Members shall be able to leave a group (subject to business rule: leader leaving requires leadership reassignment or admin action).
- FR-406: Coordinator/Admin shall be able to view all groups within their scope (department/institution respectively).

### 3.5 Project Proposal & AI (FR-5xx)
- FR-501: Group shall be able to draft a Project (name, description, domain, tech stack, problem statement, objectives, scope, expected outcome, innovation).
- FR-502: System shall provide an AI-generated project recommendation feature based on group members' skills/interests, calling a configurable AI provider service — output shall never be hardcoded/fabricated when the provider is unavailable (feature shall show a disabled/unavailable state instead).
- FR-503: Each AI recommendation shall include: title, problem statement, objectives, solution, tech stack, difficulty, innovation, expected outcome, match score, explanation.
- FR-504: System shall allow the group to save/select a recommendation into their proposal draft.
- FR-505: System shall compute a similarity score comparing the draft proposal against historical projects (title, problem statement, description, objectives, domain, technology) and display similar project(s), similarity %, and reasoning.
- FR-506: System shall display a warning when similarity exceeds a configurable threshold, and may suggest originality improvements via AI.
- FR-507: Proposal status shall follow: DRAFT → SUBMITTED → UNDER_REVIEW → REVISION_REQUIRED → RESUBMITTED → APPROVED/REJECTED, with every transition timestamped and attributed to an actor.

### 3.6 Faculty Review of Proposal (FR-6xx)
- FR-601: Faculty shall see only proposals for projects they are assigned to.
- FR-602: Faculty shall be able to Approve, Reject, or Request Revision, with mandatory feedback text for Reject/Revision.
- FR-603: Students shall be able to view feedback history and resubmit after revision.
- FR-604: On Approval, the Project status shall transition to APPROVED and the full project workspace shall unlock.

### 3.7 Requirements / Epics / Stories / Backlog (FR-7xx)
- FR-701: Students shall be able to CRUD Requirements (title, description, priority, status).
- FR-702: Students shall be able to CRUD Epics linked to Requirements.
- FR-703: Students shall be able to CRUD User Stories (As a / I want / So that) linked to Epics.
- FR-704: Students shall be able to CRUD Backlog Items derived from stories, with story points, priority, labels, assignee.
- FR-705: Backlog items shall be movable into a Sprint.
- FR-706: System shall maintain a traceable chain: Requirement → Epic → Story → Task/Bug, queryable in either direction.

### 3.8 Sprints & Kanban (FR-8xx)
- FR-801: Students shall be able to create Sprints (name, goal, start/end date) with status PLANNED/ACTIVE/COMPLETED/CANCELLED.
- FR-802: System shall provide a Kanban board with columns TO DO / IN PROGRESS / IN REVIEW / DONE, supporting drag-and-drop, with position/status changes persisted to the database immediately.
- FR-803: Kanban cards shall display task title, assignee, priority, due date, story points, labels.

### 3.9 Tasks & Bugs (FR-9xx)
- FR-901: Tasks shall have a structured, sequential ID per project: `PROJECTKEY-001`, `PROJECTKEY-002`, etc.
- FR-902: Tasks shall support assignee, priority, status, due date, story points, labels, and links to Epic/Story/Requirement/Sprint/Milestone.
- FR-903: Bugs shall have severity, priority, status (OPEN/IN_PROGRESS/FIXED/RETEST/CLOSED), assignee, and optional links to a Task and/or Requirement.

### 3.10 Milestones (FR-10xx)
- FR-1001: Admin shall be able to configure milestone templates (e.g., Proposal, Requirement Analysis, Design, Development, Testing, Documentation, Final Presentation).
- FR-1002: Each project milestone instance shall show progress %, deadline, status, linked tasks, and faculty feedback.

### 3.11 Wiki, Chat, Files (FR-11xx)
- FR-1101: Project members shall be able to CRUD Wiki pages scoped to their project.
- FR-1102: Project members and authorized faculty shall be able to send/edit/delete chat messages within their project's chat, with message history and unread counts.
- FR-1103: Project members shall be able to upload files (proposal, SRS, reports, PPT, papers, diagrams, screenshots, final docs) with metadata (name, type, size, uploader, version, timestamp).
- FR-1104: Only authorized project members/faculty shall be able to download a given project's files (server-side ownership check on every download request).

### 3.12 GitHub Integration & Releases (FR-12xx)
- FR-1201: Groups shall be able to connect a GitHub repository to their project.
- FR-1202: System shall surface commits, branches, pull requests, issues, and contributors for the connected repo.
- FR-1203: GitHub access tokens shall be stored server-side only and never returned in any client-facing API response.
- FR-1204: Tasks shall be linkable to GitHub PRs/commits/branches/issues by task key.
- FR-1205: Groups shall be able to create Releases referencing included features/fixes/tasks/PRs/commits, and mark a release as Final.

### 3.13 Calendar (FR-13xx)
- FR-1301: System shall provide a unified calendar view aggregating tasks, sprints, milestones, reviews, proposal deadlines, project deadlines, final submission date, and releases for the logged-in user's scope.

### 3.14 Faculty Reviews & Evaluation (FR-14xx)
- FR-1401: Admin/Coordinator shall be able to schedule configurable review types (Proposal, Literature, Design, Mid-Term, Final, etc.) with date and assigned faculty.
- FR-1402: Faculty shall submit review feedback and marks per review.
- FR-1403: Once a review is submitted, associated marks shall be locked from further edits unless explicitly re-authorized (e.g., by Admin override with audit log entry).
- FR-1404: Admin shall be able to configure Evaluation Criteria (name + weight), and the system shall validate that active criteria weights sum to a configured total (default 100) before allowing evaluation to proceed.
- FR-1405: System shall auto-calculate each project's final score from the configured criteria and submitted marks — this value shall never be hardcoded.

### 3.15 Notifications (FR-15xx)
- FR-1501: System shall generate notifications for: group invitation, proposal submission/revision/approval/rejection, review scheduled, review feedback given, task deadline approaching, task overdue, milestone deadline approaching, final submission due.
- FR-1502: Users shall see an unread notification count and be able to mark notifications as read.

### 3.16 Analytics (FR-16xx)
- FR-1601: Student dashboard shall show task/sprint/milestone progress, review scores, upcoming deadlines, project risk, and GitHub activity — for their own project(s) only.
- FR-1602: Faculty dashboard shall show assigned projects, progress, overdue tasks, review status, and marks — scoped to assigned projects only.
- FR-1603: Coordinator dashboard shall show department-level projects, groups, progress, review completion, and evaluation scores.
- FR-1604: Admin dashboard shall show institution-wide totals (students, faculty, departments, groups, projects, pending/approved/active/completed projects, average marks, risk distribution, technology usage, project domains).
- FR-1605: All analytics values shall be computed from live database queries — no static/mocked figures in production.

### 3.17 Project Risk (FR-17xx)
- FR-1701: System shall compute a project risk level (LOW/MEDIUM/HIGH) using signals such as overdue tasks, sprint progress, milestone delays, review scores, GitHub activity, and recent activity.
- FR-1702: System shall display the contributing reasons alongside the risk level (e.g., "5 overdue tasks, milestone deadline approaching, low recent activity").
- FR-1703: UI shall explicitly state risk output is assistive/non-guaranteed, not a certified prediction.

### 3.18 Audit Log (FR-18xx)
- FR-1801: System shall log sensitive actions (login/logout, account creation, group/project creation, proposal submission/approval/rejection, task creation/update, review submission, marks update, file upload, GitHub connection, admin settings changes) with actor, action, target entity, and timestamp.
- FR-1802: Admin shall be able to search and filter audit logs.

### 3.19 RBAC Enforcement (FR-19xx)
- FR-1901: Every API endpoint shall enforce authentication + role authorization + resource-ownership checks server-side, regardless of what the frontend displays.
- FR-1902: Frontend navigation shall hide unauthorized sections, but this shall be treated as UX convenience only, never as the security boundary.

---

## 4. External Interface Requirements

### 4.1 User Interfaces
- Responsive web UI: sidebar navigation, top bar, breadcrumbs, dashboard cards, data tables with pagination/filter/search, forms with validation feedback, modals/dialogs, tabbed views, toast notifications.
- Every page shall implement: loading state, empty state, error state, and success feedback — consistently across the app.

### 4.2 API Interfaces
- RESTful JSON API under `/api/*`, versioned informally by route grouping (e.g. `/api/auth`, `/api/projects`, `/api/tasks`).
- Consistent error response shape and correct HTTP status codes (400 validation, 401 unauthenticated, 403 unauthorized, 404 not found, 409 conflict, 500 server error).

### 4.3 Hardware Interfaces
Not applicable (standard web client/server; no special hardware).

### 4.4 Communications Interfaces
- HTTPS for all client-server traffic in production.
- Outbound HTTPS calls to: configured AI provider API, GitHub API.

---

## 5. Non-Functional Requirements

### 5.1 Security
- NFR-S1: All passwords hashed with a strong, salted algorithm; password hashes never included in any API response payload.
- NFR-S2: Authorization middleware chain (auth → role → ownership) mandatory on all protected routes; IDOR prevented on projects, files, reviews, marks, groups.
- NFR-S3: Secrets (DB URI, JWT secret, AI provider keys, GitHub tokens) stored only in environment variables; `.env.example` documents required vars without values.
- NFR-S4: Input validated server-side (Zod or equivalent) on all write endpoints, independent of client-side validation.

### 5.2 Performance
- NFR-P1: List endpoints returning collections shall support pagination to avoid unbounded payloads.
- NFR-P2: Frequently queried fields (enrollment number, project status, task project+status) shall be indexed in MongoDB.

### 5.3 Reliability & Availability
- NFR-R1: API errors shall be handled gracefully with informative, non-leaking error messages (no stack traces exposed to client in production).
- NFR-R2: Critical write operations (proposal submission, marks entry, evaluation calculation) shall be atomic at the document/transaction level where supported.

### 5.4 Usability
- NFR-U1: Consistent design system across all modules; no visually inconsistent "one-off" pages.
- NFR-U2: Fully responsive across desktop, laptop, tablet, and mobile breakpoints.

### 5.5 Maintainability
- NFR-M1: No duplicate components/models/routes/dead code.
- NFR-M2: Modular folder structure separating controllers/services/models/validators/middleware (backend) and components/pages/hooks/services/store (frontend).

### 5.6 Compatibility
- NFR-C1: Codebase restricted to `.js`/`.jsx` — no TypeScript files, ensuring toolchain consistency and avoiding the ts/tsx build step entirely.

---

## 6. Data Requirements (summary — full detail in `TeamSync-PRD.md` §5)

Minimum required Mongoose models: `User, StudentProfile, FacultyProfile, Department, AcademicYear, SGPCycle, ProjectGroup, GroupMember, Project, ProjectProposal, ProjectReview, EvaluationCriteria, Evaluation, Requirement, Epic, UserStory, BacklogItem, Sprint, Task, Bug, Milestone, WikiPage, ChatMessage, ProjectFile, GitHubIntegration, GitHubRepository, Release, Notification, AuditLog, SystemSetting, AIRecommendation, ProjectSimilarity`.

All relational integrity (references, uniqueness, ownership) as defined in the PRD's entity-relationship section must be enforced at the schema and API layer both.

---

## 7. Verification / Acceptance Criteria

A build is considered SRS-compliant when:
- [ ] Every FR-xxx above is demonstrably implemented and testable via API/UI.
- [ ] Security test matrix (Section "Final Security Test" in original scope) passes: unauthorized cross-role, cross-project, cross-group access attempts all correctly return 401/403.
- [ ] No `.ts`/`.tsx` file exists in the repository.
- [ ] No student self-registration endpoint/route exists.
- [ ] Evaluation criteria weights are Admin-editable and validated to sum correctly before use.
- [ ] All analytics figures are traceable to live database queries.

---

## 8. Appendix — Traceability to PRD

| SRS Section | Corresponding PRD Reference |
|---|---|
| 3.1–3.4 | PRD §3–4 (Roles, Auth) |
| 3.5–3.6 | PRD §6 (Workflow) |
| 3.7–3.13 | PRD §5, §7 (Data model, Feature modules) |
| 3.14 | PRD §7 item 21, Formal PRD §6 (success metrics) |
| 3.16–3.17 | PRD §7 items 23–24 |
| Section 5 (NFRs) | PRD §8 (Non-functional/Security) |

*End of SRS. Use together with `TeamSync-PRD.md` and `TeamSync-Formal-PRD.md` when handing off to Antigravity.*