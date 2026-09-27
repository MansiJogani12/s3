# TEAMSYNC — Product Requirements Document (PRD)
### College SGP (Student Group Project) Management, Collaboration, Review, Evaluation & AI-Assisted Project Intelligence Platform

> Is document ko directly Antigravity (ya kisi bhi AI coding agent) ko de sakte ho. Isme **kya banana hai**, **role kya kar sakta hai**, aur sabse important — **data kaise connected hai (entity relationships)** — sab clearly likha hai.

---

## 1. PRODUCT OVERVIEW

**Product Name:** TeamSync (naam hamesha yahi rahega — ProjectHub / DevFlow / kisi aur naam ka use mat karo)

**One-line description:** TeamSync ek end-to-end platform hai jisme college ke SGP projects ka pura lifecycle manage hota hai — account creation se lekar final evaluation aur analytics tak.

**Build type:** Ye ek *real working application* hai, UI mockup nahi. Har button ek real API call karega, har form MongoDB me persist hoga, har role ka authorization backend pe enforce hoga.

---

## 2. TECH STACK (Strict — Antigravity ko exactly ye follow karna hai)

| Layer | Technology |
|---|---|
| Frontend | React + Vite, **JavaScript only (.js/.jsx)** — NO TypeScript, NO .ts/.tsx |
| Styling | Tailwind CSS |
| Routing | React Router |
| Data fetching | Axios + TanStack React Query |
| State mgmt | Zustand (jahan zaroorat ho) |
| Backend | Node.js + Express.js (JavaScript only) |
| Database | MongoDB + Mongoose |
| Auth | JWT / secure session |
| Validation | Zod (ya equivalent JS validation lib) |

**Hard rule:** Koi bhi `.ts` / `.tsx` file allowed nahi hai. Pure `.js` / `.jsx`.

---

## 3. USER ROLES

```
ADMIN         → Full institutional control
COORDINATOR   → Department-level SGP management
FACULTY       → Assigned project review & evaluation
STUDENT       → Own profile / group / project
```
No separate "Super Admin". Admin is the highest role. Roles are **fixed, not extendable** without explicit instruction.

### 3.1 Permission Matrix (summary)

| Capability | Admin | Coordinator | Faculty | Student |
|---|:---:|:---:|:---:|:---:|
| Create student/faculty/coordinator accounts | ✅ | ❌ | ❌ | ❌ |
| Activate/deactivate accounts | ✅ | ❌ | ❌ | ❌ |
| Manage departments/academic years/SGP cycles | ✅ | ❌ | ❌ | ❌ |
| Assign faculty to projects | ✅ | ✅ (dept only) | ❌ | ❌ |
| View own department data | ✅ | ✅ | ❌ | ❌ |
| Review/approve/reject proposals | ❌ | ❌ | ✅ (assigned only) | ❌ |
| Give marks/feedback | ❌ | ❌ | ✅ (assigned only) | ❌ |
| Create group, propose project | ❌ | ❌ | ❌ | ✅ |
| Manage backlog/sprint/kanban/tasks/bugs | ❌ | ❌ | View only | ✅ (own project) |
| View marks | View all | View dept | View assigned | View own |

**Student CANNOT:** create other accounts, modify marks, approve own proposal, access another group's private data, access admin pages.

---

## 4. AUTHENTICATION RULES (very important — mistakes yaha nahi chalenge)

- **No public student self-registration.**
- Student login = **Enrollment Number + Password** (e.g. `24IT001` / `********`).
- **No "Login with Google" button anywhere on student login page.** Google auth is optional, internal-only, for admin/faculty — not for students, and not in this version unless separately instructed.
- Only Admin creates Student / Faculty / Coordinator accounts (with a temporary password Admin sets).
- Passwords: hashed (bcrypt/argon2) — **never stored plain, never returned in any API response.**
- JWT or secure session cookie for auth state.
- Every protected route re-verifies role + resource ownership server-side — **frontend hiding a menu item is NOT security.**

---

## 5. DATA MODEL — Entity Relationships (Kaun Kis Se Juda Hua Hai)

Ye sabse important section hai — Antigravity ko exact relational structure yahi follow karna chahiye.

```
User (base identity: role, email, password hash, status)
 ├── 1:1 → StudentProfile   (enrollment no, department, semester, skills, interests, bio)
 └── 1:1 → FacultyProfile   (department, designation, expertise)

Department
 ├── 1:N → StudentProfile
 ├── 1:N → FacultyProfile
 └── 1:N → ProjectGroup

AcademicYear
 └── 1:N → SGPCycle

SGPCycle (belongs to AcademicYear + Department)
 └── 1:N → ProjectGroup

ProjectGroup
 ├── 1:N → GroupMember (link table: Group ↔ StudentProfile, with role: LEADER/MEMBER)
 ├── 1:1 → Project        (a group owns exactly one active project at a time)
 └── belongs to → Department, AcademicYear, SGPCycle

Project
 ├── belongs to → ProjectGroup
 ├── assigned → FacultyProfile (Guide)
 ├── 1:N → ProjectProposal (version history of proposal submissions)
 ├── 1:N → ProjectReview
 ├── 1:N → Requirement
 ├── 1:N → Epic
 ├── 1:N → Sprint
 ├── 1:N → Task
 ├── 1:N → Bug
 ├── 1:N → Milestone
 ├── 1:N → WikiPage
 ├── 1:N → ChatMessage
 ├── 1:N → ProjectFile
 ├── 1:1 → GitHubIntegration → 1:N GitHubRepository
 ├── 1:N → Release
 ├── 1:1 → Evaluation (final aggregated score)
 └── 1:N → ProjectSimilarity (comparison against past projects)

ProjectProposal
 └── status history: DRAFT → SUBMITTED → UNDER_REVIEW → REVISION_REQUIRED
     → RESUBMITTED → APPROVED / REJECTED

Requirement
 └── 1:N → Epic
      └── 1:N → UserStory
           └── 1:N → BacklogItem
                └── (optionally moved into) → Sprint
                     └── 1:N → Task
                          ├── may link → Bug (N:N via LinkedTask)
                          ├── belongs to → Epic / UserStory / Requirement / Sprint / Milestone
                          └── assigned to → StudentProfile

Bug
 ├── linked → Task (optional)
 └── linked → Requirement (optional)

Milestone
 ├── 1:N → Task (tasks mapped to milestone)
 └── linked → ProjectReview (faculty review tied to a milestone stage)

ProjectReview (Proposal Review / Design Review / Mid-Term / Final …)
 ├── conducted by → FacultyProfile
 ├── belongs to → Project
 └── 1:N → Evaluation entries (per EvaluationCriteria)

EvaluationCriteria (Admin-configurable, e.g. Proposal-10, Design-15 … total=100)
 └── 1:N → Evaluation (actual marks given per project per criteria)

GitHubIntegration → GitHubRepository
 └── Commits / Branches / PRs / Issues (fetched live via GitHub API, not always stored)
      └── can be linked to → Task (by task key, e.g. PROJECTKEY-123)

Release
 └── references → Task[], PR[], Commit[] (features/fixes included)

Notification
 └── belongs to → User (recipient), triggered by any workflow event

AuditLog
 └── belongs to → User (actor) + action + target entity + timestamp

SystemSetting / AIRecommendation / ProjectSimilarity
 └── AIRecommendation → generated for StudentProfile/ProjectGroup (skills + interests input)
 └── ProjectSimilarity → compares Project against historical Project corpus
```

### 5.1 Traceability chain (core PM logic)
```
Requirement → Epic → UserStory → BacklogItem → Sprint → Task → Bug
```
Ye chain **har jagah maintain honi chahiye** — task ban raha ho to uska requirement/epic/story se link optional but supported hona chahiye, taaki analytics aur audit trace ho sake.

### 5.2 Ownership & Isolation rule (security-critical)
Har data-fetching API `/api/projects/:projectId/...` type ke endpoints me backend ko ye verify karna hai:
- Requesting user's role
- Agar STUDENT → uska GroupMember record us project ki group me hona chahiye
- Agar FACULTY → wo us project ka assigned Guide ya reviewer hona chahiye
- Agar COORDINATOR → project uske department ke andar hona chahiye
- ADMIN → full access

IDs kabhi frontend se trust nahi karne — hamesha DB me relation verify karo (IDOR prevention).

---

## 6. CORE LIFECYCLE / WORKFLOW

```
Admin creates Student account
   ↓
Student login (Enrollment No + Password)
   ↓
Student Profile setup
   ↓
Project Group formation (create/invite/accept/leave)
   ↓
Project Idea (AI recommendation optional)
   ↓
Similarity Check (against past projects)
   ↓
Project Proposal submission
   ↓
Faculty Review → Approve / Reject / Request Revision
   ↓ (loop until approved)
Approved Project → Full Workspace unlocked
   ↓
Requirements → Epics → User Stories → Backlog → Sprints → Kanban → Tasks/Bugs
   ↓ (parallel, ongoing)
Files / Wiki / Chat / GitHub / Releases / Milestones
   ↓
Faculty Reviews (Design/Mid-Term/Final) → Evaluation (per configurable criteria)
   ↓
Final Score calculated
   ↓
Analytics (student/faculty/coordinator/admin dashboards)
   ↓
Completion
```

### Status enums (must be implemented exactly)
- **Project:** DRAFT, PROPOSAL, UNDER_REVIEW, REVISION_REQUIRED, APPROVED, IN_DEVELOPMENT, FINAL_REVIEW, COMPLETED, REJECTED
- **Proposal:** DRAFT, SUBMITTED, UNDER_REVIEW, REVISION_REQUIRED, RESUBMITTED, APPROVED, REJECTED
- **Sprint:** PLANNED, ACTIVE, COMPLETED, CANCELLED
- **Kanban columns:** TO DO, IN PROGRESS, IN REVIEW, DONE
- **Bug:** OPEN, IN_PROGRESS, FIXED, RETEST, CLOSED

---

## 7. FEATURE MODULES (consolidated — build these as functional units, not throwaway phases)

1. **Auth & Session** — enrollment login, JWT/session, protected routes, role-based redirect to correct dashboard
2. **Admin Console** — manage Students/Faculty/Coordinators/Departments/AcademicYears/SGPCycles/RBAC/SystemSettings/AuditLogs/AI Settings
3. **Coordinator Console** — department-scoped group/project monitoring, faculty assignment, analytics
4. **Student Profile** — editable profile (enrollment no locked), skills/interests for AI matching
5. **Group Management** — create/invite/accept/reject/leave, group code, leader/member roles
6. **Project Proposal Flow** — draft → submit → review → revise → approve, with complete history log
7. **AI Recommendation** — skill/interest-based project idea generation via a pluggable AI-provider service (env-configured, no fake/mocked responses)
8. **Project Similarity** — scores new proposal against historical project corpus, flags high similarity with reasoning
9. **Project Workspace** — overview, progress, deadlines, guide/coordinator visibility
10. **Requirements → Epics → Stories → Backlog** — full traceable chain
11. **Sprints & Kanban** — drag-drop board, persisted state, story points, labels
12. **Tasks & Bugs** — structured IDs (`PROJECTKEY-001`), full metadata, linking
13. **Milestones** — configurable stages, progress tracking, tied to faculty feedback
14. **Wiki** — per-project documentation, CRUD
15. **Chat** — project-scoped messaging, persisted, access-controlled
16. **File Management** — uploads with metadata + version, access-controlled downloads
17. **GitHub Integration** — repo connect, commits/branches/PRs/issues, task linking, tokens never exposed to frontend
18. **Releases** — versioned release notes referencing tasks/PRs/commits
19. **Calendar** — unified view of tasks/sprints/milestones/reviews/deadlines
20. **Faculty Review System** — configurable review types, feedback, marks (locked post-submission unless re-authorized)
21. **Evaluation Engine** — Admin-configurable weighted criteria (sums to 100), auto-calculated final score
22. **Notifications** — event-driven, unread counts, mark-as-read
23. **Analytics Dashboards** — role-specific (Student/Faculty/Coordinator/Admin), real DB-driven, charts for status/domain/risk/performance
24. **Project Risk Engine** — AI-assisted signal aggregation (overdue tasks, stalled sprints, low activity) → LOW/MEDIUM/HIGH with explanation, explicitly non-guaranteed
25. **Audit Log** — every sensitive action logged with actor, action, target, timestamp; searchable/filterable by Admin
26. **RBAC enforcement** — every single API route checked; frontend nav hides unauthorized items but backend is the real gate

---

## 8. NON-FUNCTIONAL / SECURITY REQUIREMENTS

- Password hashing mandatory; hashes never leave the backend.
- Authorization middleware: authentication → role check → resource ownership check, in that order, on every protected route.
- Prevent IDOR on: projects, documents, reviews, marks, groups.
- Rate limiting / input validation (Zod) on all write endpoints.
- Env vars for all secrets: DB URI, JWT secret, AI provider keys, GitHub tokens — `.env.example` provided, nothing committed.
- Pagination on all list endpoints returning potentially large datasets.
- Consistent API error shape + proper HTTP status codes (401 vs 403 used correctly).
- No duplicate components/models/routes; reusable UI components; no dead code.

---

## 9. UI/UX REQUIREMENTS

- One consistent design system across the whole app — sidebar, top nav, breadcrumbs, tables, forms, modals, tabs, filters, pagination, toasts.
- Every page needs: loading state, empty state, error state, success feedback.
- Fully responsive: desktop, laptop, tablet, mobile — sidebar collapses, Kanban scrolls horizontally on small screens.
- Brand name **"TeamSync"** used consistently everywhere in UI copy.

---

## 10. ACCEPTANCE CRITERIA (Definition of Done for the whole build)

- [ ] End-to-end flow works: Admin creates student → student logs in → profile → group → proposal → AI + similarity → faculty approval → workspace → requirements→epics→stories→backlog→sprints→kanban→tasks→bugs → milestones → docs/wiki/chat/GitHub → release → review → evaluation → final score → analytics → completion.
- [ ] Every role's access boundaries verified with real 401/403 tests (student hitting admin routes, faculty hitting unassigned projects, cross-group file access, etc.).
- [ ] All data written by forms is actually persisted in MongoDB and re-readable after refresh.
- [ ] No `.ts`/`.tsx` files anywhere in the codebase.
- [ ] No mock/fake AI responses — AI calls go through a real configurable provider abstraction.
- [ ] Evaluation criteria are Admin-editable, not hardcoded, and always sum-validated.

---

## 11. RECOMMENDED BUILD ORDER (for an agent like Antigravity)

Antigravity ko incremental milestones me build karne ko bolo, har milestone ke baad build+test+report:

1. Project scaffold (frontend + backend + DB connection + env setup)
2. Auth (enrollment login, JWT, role-based routing)
3. Admin account management (students/faculty/coordinators) + College structure (dept/year/cycle)
4. Student profile + Group management
5. Project proposal + AI recommendation + similarity + faculty approval flow
6. Project workspace core (Requirements→Epic→Story→Backlog→Sprint→Kanban→Task→Bug)
7. Milestones, Wiki, Chat, Files
8. GitHub integration + Releases + Calendar
9. Faculty reviews + Evaluation engine
10. Notifications + Analytics + Risk engine + Audit log + final RBAC hardening
11. Responsive polish + full security test pass

*(Ye ek suggested sequence hai — agar Antigravity apna khud ka planning/phase system use karta hai to wahi follow karne dena, bas upar diya scope aur data-model kabhi mat todna.)*