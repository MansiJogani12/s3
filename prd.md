# TeamSync — Formal Product Requirements Document (PRD)

*Companion document to `TeamSync-PRD.md` (technical/data-model spec). Is doc me product-management side cover hai: problem, goals, personas, scope, success metrics, risks, timeline.*

---

## 1. Executive Summary

**Product:** TeamSync
**Category:** College SGP (Student Group Project) Management, Collaboration, Review, Evaluation & AI-Assisted Project Intelligence Platform
**Users:** College students, faculty guides, department coordinators, institution admin
**Core value:** Ek hi platform me poora SGP lifecycle — group formation se lekar final evaluation aur analytics tak — track, execute aur assess ho.

---

## 2. Problem Statement

Colleges me SGP/mini-project execution aaj bhi fragmented tools se hoti hai:
- Proposals WhatsApp/email pe submit hote hain, koi structured history nahi.
- Faculty ko review/approval ke liye scattered documents dekhne padte hain.
- Project management (tasks, sprints, bugs) students khud kisi third-party tool (Trello/Notion) pe karte hain — institution ko visibility nahi milti.
- Evaluation/marks manually excel me maintain hoti hai, criteria hardcoded, inconsistent.
- Plagiarism/duplicate project ideas detect karna manual hai.
- Admin ko institution-wide analytics (kitne projects on-track hain, risk kaunsa) nahi milte.

**Result:** Visibility gap, inconsistent evaluation, duplicate/low-quality project ideas, and no single source of truth.

---

## 3. Goals & Objectives

| Goal | Description |
|---|---|
| G1 | Single controlled onboarding — sirf Admin account create kare, students self-register na kar sakein |
| G2 | Structured proposal→approval workflow with full audit history |
| G3 | Built-in project management (Requirements→Epic→Story→Backlog→Sprint→Kanban→Task→Bug) so students don't need external tools |
| G4 | AI-assisted idea generation + similarity/plagiarism detection at proposal stage |
| G5 | Configurable, transparent evaluation criteria and auto-calculated final scores |
| G6 | Real-time institutional visibility — dashboards for Admin/Coordinator/Faculty/Student |
| G7 | Strict role-based data isolation (no cross-project/cross-group leakage) |

### Non-Goals (Out of Scope for v1)
- Public/self-signup for students
- Payment/billing features
- Mobile native apps (responsive web only)
- Multi-institution/multi-tenant support (single institution instance)
- Real-time video conferencing (chat is text-based only)

---

## 4. User Personas

**1. Admin (Institution/HOD level)**
Needs: full control over accounts, department structure, evaluation criteria, institution-wide analytics and audit visibility.

**2. Coordinator (Department SGP in-charge)**
Needs: monitor all groups/projects in their department, assign faculty, track review completion, department analytics — without full system admin rights.

**3. Faculty (Project Guide/Reviewer)**
Needs: review only assigned proposals/projects, give structured feedback and marks, track progress without micromanaging tools.

**4. Student (Project team member)**
Needs: form a group, get/validate a project idea, manage the whole build (tasks/sprints/bugs/docs/chat/GitHub) in one place, see their evaluation and feedback transparently.

---

## 5. Scope Summary (functional area → owner persona)

| Area | Primary Owner | Consumers |
|---|---|---|
| Account provisioning | Admin | All |
| College structure (dept/year/cycle) | Admin | Coordinator, Faculty, Student |
| Group formation | Student | Coordinator, Admin (monitor) |
| Proposal + AI + Similarity | Student | Faculty (review) |
| Approval workflow | Faculty | Student, Coordinator |
| Project execution (Agile stack) | Student | Faculty (view), Coordinator (view) |
| Wiki/Chat/Files/GitHub/Releases | Student | Faculty (view where authorized) |
| Reviews & Evaluation | Faculty | Student, Coordinator, Admin |
| Analytics & Risk | All (scoped per role) | — |
| Notifications & Audit | System-generated | Admin (audit), All (notifications) |

*(Full field-level detail, entity relationships, and API rules are in `TeamSync-PRD.md`.)*

---

## 6. Success Metrics (v1)

- 100% of student accounts created only via Admin (zero self-registration paths in production).
- Proposal → Approval cycle fully traceable (every status change has actor + timestamp).
- 0 cross-tenant/cross-project data leaks in security test suite (Phase-38 style tests all pass with correct 401/403).
- Evaluation totals always validate to Admin-configured 100 (no silent mismatches).
- Every dashboard chart backed by live DB queries — 0% mocked/static data in production build.

---

## 7. Assumptions & Constraints

- Single institution deployment (no multi-college tenancy in v1).
- AI features depend on an external AI provider configured via env vars — if no provider key is set, AI features should gracefully degrade (disabled state), not fake results.
- GitHub integration requires each project group to connect their own repo/token; tokens stored server-side only.
- English-primary UI (no localization requirement stated).

---

## 8. Risks

| Risk | Mitigation |
|---|---|
| Scope is very large (39+ modules) for one build pass | Build in incremental milestones (see build order in technical PRD), test each before moving on |
| AI provider cost/availability | Abstract AI calls behind a service layer; feature-flaggable |
| Faculty adoption resistance (used to manual marksheets) | Keep evaluation UI simple; auto-calculation reduces their manual work |
| IDOR / authorization bugs given many roles & nested resources | Centralized authorization middleware + dedicated security test phase before release |
| Similarity/AI risk scoring perceived as "final judgment" | Always show explanation text and explicitly label as assistive, not guaranteed |

---

## 9. Milestone Timeline (suggested, not fixed)

| Milestone | Contents |
|---|---|
| M1 | Scaffold + Auth + Admin account/college-structure management |
| M2 | Student profile, Group management |
| M3 | Proposal flow + AI recommendation + Similarity + Faculty approval |
| M4 | Core Agile workspace: Requirements→Epic→Story→Backlog→Sprint→Kanban→Task/Bug |
| M5 | Milestones, Wiki, Chat, Files |
| M6 | GitHub integration, Releases, Calendar |
| M7 | Faculty reviews + Evaluation engine |
| M8 | Notifications, Analytics, Risk engine, Audit log |
| M9 | RBAC hardening, security test pass, responsive polish, final QA |

---

## 10. Open Questions (to confirm before/at build start)

- Kya groups fixed-size honge (e.g. max 4 students) ya open-ended?
- Ek student ek hi active SGP cycle me ek hi group me ho sakta hai — confirm?
- AI provider konsa use karna hai (OpenAI/Anthropic/other) — env-configurable rakhna hai ya ek fixed provider?
- GitHub integration OAuth app institution ke apne GitHub org ke through hoga ya per-user personal token?

---

*Is document ko technical spec (`TeamSync-PRD.md`) ke saath hi Antigravity ko dena — pehla "kya aur kyun" batata hai, dusra "kaise aur kya connected hai" batata hai.*