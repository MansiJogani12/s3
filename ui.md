# TeamSync — UI/UX Design Specification

*Chautha document is set me. PRD (data/relationships) + Formal PRD (goals) + SRS (testable requirements) ke saath ye batata hai ki app **dikhega kaisa aur kaam kaise karega screen-by-screen**. Antigravity ko ye bhi saath dena taaki wo random/inconsistent design na bana de.*

---

## 1. Design Principles

1. **One system, every page** — Admin, Coordinator, Faculty, Student — sab ek hi component library, spacing, color logic use karte hain. Alag "look" nahi.
2. **Function-first, not decorative** — ye ek academic project-management tool hai, dashboard density > flashy visuals.
3. **Status is always visible** — proposal status, task status, review status — colored badges everywhere, never just text.
4. **Every state designed** — loading / empty / error / success, har page pe, no exceptions.
5. **Role clarity** — top bar/sidebar hamesha clearly batayega ki user kis role me logged in hai (badge next to name).

---

## 2. Design System

### 2.1 Color Palette (semantic, not decorative)

| Token | Usage | Example |
|---|---|---|
| `--primary` | Brand actions, active nav, primary buttons | Indigo/Blue family |
| `--secondary` | Secondary actions, accents | Slate/Teal |
| `--success` | Approved, Done, Fixed, Low Risk | Green |
| `--warning` | Revision Required, In Review, Medium Risk | Amber |
| `--danger` | Rejected, Overdue, High Risk, Critical Bug | Red |
| `--info` | Notifications, informational badges | Sky blue |
| `--neutral-bg` | Page background | Light gray / near-white |
| `--surface` | Card/panel background | White |
| `--border` | Dividers, card borders | Light gray |
| `--text-primary` / `--text-secondary` | Body text hierarchy | Near-black / gray |

Dark mode: optional (v2), design tokens should be structured (CSS variables) so it's addable later without rewrite.

### 2.2 Typography

| Level | Use |
|---|---|
| Display (24–28px, semibold) | Page titles |
| Heading (18–20px, semibold) | Section/card headers |
| Body (14–15px, regular) | Default text |
| Small/Caption (12–13px) | Meta info, timestamps, helper text |
| Mono (for IDs) | Task IDs, Bug IDs (e.g. `PROJ-014`), commit hashes |

Font: one clean sans-serif system font stack (no more than 2 font families total).

### 2.3 Spacing & Grid
- 4px/8px base spacing scale (Tailwind default scale is fine: 4,8,12,16,24,32...).
- Max content width on large screens (~1440px) with centered layout; sidebar fixed width (~260px, collapsible to icon-only ~72px).
- Card padding consistent: 16–24px.

### 2.4 Core Components (build once, reuse everywhere)
- Sidebar nav (role-aware menu items)
- Top bar (search, notifications bell w/ unread dot, user menu)
- Breadcrumbs
- Data table (sortable columns, pagination, row actions, empty state)
- Status badge (color-coded per status enum — see §2.5)
- Stat/metric card (for dashboards)
- Kanban board + draggable card
- Modal / Drawer (drawer preferred for "view details" without losing list context)
- Form fields with inline validation error text
- Toast notification (top-right, auto-dismiss)
- Tabs
- Filter bar (dropdowns + search input)
- Empty state illustration/block ("No tasks yet — create one")
- Comment/feedback thread component (used in reviews, chat, bug comments)

### 2.5 Status Badge Colors (must match exactly — consistency across app)

| Status type | Value | Color |
|---|---|---|
| Project/Proposal | DRAFT | Neutral gray |
| | SUBMITTED / UNDER_REVIEW | Info blue |
| | REVISION_REQUIRED | Warning amber |
| | APPROVED | Success green |
| | REJECTED | Danger red |
| | IN_DEVELOPMENT | Primary blue |
| | COMPLETED | Success green (filled) |
| Sprint | PLANNED | Neutral |
| | ACTIVE | Primary |
| | COMPLETED | Success |
| | CANCELLED | Danger |
| Bug | OPEN | Danger |
| | IN_PROGRESS | Warning |
| | FIXED / RETEST | Info |
| | CLOSED | Success |
| Risk | LOW | Success |
| | MEDIUM | Warning |
| | HIGH | Danger |

---

## 3. Navigation Structure (per role)

### Student Sidebar
Dashboard · Profile · My Group · Project Overview · Proposal · Requirements · Epics & Stories · Backlog · Sprints · Kanban · Tasks · Bugs · Milestones · Files · Wiki · Chat · GitHub · Releases · Calendar · Reviews & Marks · Notifications

### Faculty Sidebar
Dashboard · Assigned Projects · Proposals to Review · Reviews & Feedback · Marks Entry · Project Analytics · Notifications

### Coordinator Sidebar
Dashboard · Students · Groups · Projects · Faculty Assignment · Reviews Overview · Department Analytics · Notifications

### Admin Sidebar
Dashboard · Students · Faculty · Coordinators · Departments · Academic Years · SGP Cycles · Groups · Projects · Faculty Assignment · Evaluation Criteria · Reviews · Analytics · Notifications · Audit Logs · AI Settings · System Settings

*(Sidebar collapses to icons on tablet; becomes a slide-over drawer on mobile with hamburger trigger.)*

---

## 4. Key Screen Specs

### 4.1 Login Screen
- Centered card: TeamSync logo/wordmark, "Enrollment Number" field, "Password" field, "Login" button.
- **No** "Login with Google" button on this screen (hard requirement).
- Error state: inline red text below form ("Invalid enrollment number or password").
- Loading state: button shows spinner + disabled while request in flight.

### 4.2 Admin Dashboard
- Top row: stat cards — Students, Faculty, Groups, Projects, Pending Proposals, Active Projects, Pending Reviews, Completed Projects.
- Charts row: Projects by Department (bar), Projects by Status (donut), Project Domains (bar), Evaluation Performance (line/bar), Risk Distribution (donut: Low/Med/High).
- Below: recent activity feed (from Audit Log) + quick links (Create Student, Create Faculty).

### 4.3 Student Dashboard
- Top: Project status card (current status badge + progress %).
- Widgets: My Tasks (due soon), Sprint burndown mini-chart, Upcoming milestones, Notifications preview, Risk indicator (if applicable) with reasons expandable.

### 4.4 Group Formation
- "Create Group" form (name, auto-generated code shown).
- "Invite Member" — search by enrollment number/name, sends invite.
- Pending invites list (accept/reject) shown to invited student.
- Member list with leader badge.

### 4.5 Proposal Builder
- Multi-section form (Title, Problem, Objectives, Scope, Methodology, Tech Stack, Innovation, Expected Outcome, Timeline, Document uploads).
- Sidebar panel: "AI Recommendations" (generate button → list of AI-suggested ideas with match score, "Use this" action to prefill form).
- Sidebar panel: "Similarity Check" — run button → list of similar past projects with % and reasoning, warning banner if above threshold.
- Bottom: Save Draft / Submit for Review buttons. Status badge + revision history timeline visible once submitted.

### 4.6 Faculty Review Screen
- Split view: left = proposal/project content (read-only), right = review panel (Approve / Reject / Request Revision buttons, feedback textarea, mark entry fields tied to Evaluation Criteria).
- History tab: all past review rounds with timestamps and outcomes.

### 4.7 Project Workspace (post-approval hub)
- Top: Project header (name, group, guide, status, progress bar).
- Tab bar: Overview · Requirements · Epics/Stories · Backlog · Sprints · Kanban · Tasks · Bugs · Milestones · Files · Wiki · Chat · GitHub · Releases · Calendar.
- Overview tab: milestone timeline, recent activity, risk card, quick stats (open tasks, open bugs, days to deadline).

### 4.8 Kanban Board
- 4 fixed columns (TO DO / IN PROGRESS / IN REVIEW / DONE), horizontal scroll on small screens.
- Card: task ID (mono font), title, assignee avatar, priority dot color, due date, story points chip, labels.
- Drag-and-drop between columns → optimistic UI update + persisted API call; rollback + toast on failure.

### 4.9 Backlog / Sprint Planning
- Table/list view of backlog items with drag-to-reorder priority, story point input, "Move to Sprint" dropdown/action.
- Sprint tab: active sprint's committed items, burndown mini-chart, "Start Sprint" / "Complete Sprint" controls.

### 4.10 Bug Tracker
- Table view: Bug ID, Title, Severity (badge), Priority, Status (badge), Assignee, Linked Task.
- Bug detail drawer: description, repro steps, comments thread, status transition buttons.

### 4.11 Wiki
- Left: page tree/list. Right: markdown-style editor + rendered preview. Version/last-edited-by shown.

### 4.12 Chat
- Standard chat UI: message list (own messages right-aligned, others left-aligned), input box, edit/delete on own messages, unread divider.

### 4.13 GitHub Integration
- "Connect Repository" card if not connected (OAuth/token flow).
- Once connected: tabs for Commits / Branches / PRs / Issues / Contributors, each list linkable back to Task IDs where matched.

### 4.14 Evaluation / Marks (Faculty & Admin view)
- Criteria breakdown table (criteria name, weight, marks given, subtotal), auto-computed total at bottom, locked-state indicator once submitted.
- Admin's "Evaluation Criteria" settings page: editable list of criteria + weight, with a live-updating "Total: X/100" validator (blocks save if not summing correctly).

### 4.15 Analytics (role-specific)
- Reuses stat-card + chart components consistently; only data scope changes per role (own project / assigned projects / department / institution).

### 4.16 Notifications Panel
- Bell icon dropdown/drawer: list of notifications (icon per type, message, relative timestamp, unread dot), "Mark all as read".

### 4.17 Audit Log (Admin only)
- Table: Timestamp, Actor, Action, Target Entity, Details. Filters: date range, actor, action type.

---

## 5. Interaction & Feedback Patterns

- **Destructive actions** (delete task, reject proposal, deactivate account) → confirmation modal required.
- **Long operations** (AI recommendation generation, similarity check) → inline loading spinner + disabled trigger button, not full-page blocking unless unavoidable.
- **Form validation** → inline field-level errors, not just a top banner.
- **Optimistic updates** → Kanban drag/drop, marking notifications read; rollback with toast on API failure.
- **Empty states** → always include a short message + primary action (e.g., "No tasks yet" + "Create Task" button), never a blank page.

---

## 6. Responsive Behavior

| Breakpoint | Sidebar | Tables | Kanban |
|---|---|---|---|
| Desktop (≥1280px) | Full sidebar with labels | Full table | Full board, no scroll needed |
| Laptop (1024–1279px) | Full sidebar, narrower content | Full table, condensed columns | Full board |
| Tablet (768–1023px) | Collapsed to icons | Horizontally scrollable table | Horizontal scroll |
| Mobile (<768px) | Hidden, hamburger → slide-over drawer | Card-list view instead of table | Horizontal scroll, one column visible at a time (swipeable) |

---

## 7. Accessibility Baseline

- All interactive elements keyboard-navigable and focus-visible.
- Color is never the only status indicator — badges include text label, not just color.
- Form inputs have associated `<label>`s.
- Sufficient contrast ratio (WCAG AA) for text on backgrounds.

---

## 8. Deliverable Note for Antigravity

- Build the component library (§2.4) first, before individual pages — every screen in §4 should compose from these shared components, not one-off markup.
- Status badge colors (§2.5) must be centralized in one config/mapping file, not hardcoded per page, so they stay consistent everywhere they're used (Kanban, tables, dashboards, detail views).

*Use this together with `TeamSync-PRD.md`, `TeamSync-Formal-PRD.md`, and `TeamSync-SRS.md`.*