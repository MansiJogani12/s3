# 🎓 TeamSync / College SGP Portal — Complete Coordinator Module Prompt

**Redesign and implement the complete Department Coordinator Portal for the existing TeamSync / College SGP Portal.**

The Coordinator is the **department-level academic administrator** responsible for managing the complete SGP lifecycle.

The Coordinator should have control over:

* Students
* Faculty
* Project Groups
* Projects
* Faculty Assignments
* Review Types
* Review Schedule
* Marks Configuration
* Department Rules
* Project Monitoring
* Analytics
* Notifications

The system must maintain **strict role-based access control and data isolation**.

---

# 1. Coordinator Sidebar

Create the following sidebar:

```text
📊 Dashboard

🎓 Students
👥 Groups
📁 Projects
👨‍🏫 Faculty Assignment

📋 Reviews Overview
📝 Review Management
⭐ Marks & Evaluation

📈 Department Analytics
📅 Calendar
🔔 Notifications

👤 Profile
```

Do not overload the Coordinator sidebar with student-specific modules such as:

```text
❌ My Group
❌ Features
❌ Work Management
❌ Bugs
❌ GitHub
❌ Files
```

The Coordinator accesses project details through:

```text
Projects
   ↓
Select Project / Group
   ↓
Open Project Workspace
```

---

# 2. Coordinator Dashboard 📊

Create a modern department-level dashboard.

The Coordinator should immediately see the complete department status.

## Top Summary Cards

```text
Total Students
128

Total Faculty
18

Total Groups
42

Active Projects
38

Pending Proposals
6

Reviews Pending
12
```

Additional cards:

```text
Projects At Risk
5

Overdue Tasks
17

Upcoming Reviews
3

Faculty Without Assigned Groups
2
```

---

## Dashboard Sections

### 📊 Project Status Overview

Display:

```text
Draft
Submitted
Revision Required
Approved
Development Active
Completed
```

Use a visual chart.

---

### ⚠️ Attention Required

Show important alerts:

```text
⚠️ Group Alpha has 5 overdue tasks

⚠️ Proposal for Group Beta is waiting for faculty review

⚠️ Faculty X has not submitted Mid-Term marks

⚠️ Review deadline is approaching
```

Each item should be clickable.

---

### 📅 Upcoming Academic Events

Show:

* Proposal deadlines
* Review dates
* Milestone deadlines
* Release dates
* Faculty evaluation deadlines

Example:

```text
05 Sep — Proposal Submission Deadline
10 Sep — SRS Review
20 Sep — Mid-Term Review
30 Oct — Final Evaluation
```

---

# 3. Students Management 🎓

The Coordinator manages all students in their department.

## Student List

Display:

| Student | Enrollment No. | Semester | Group | Project | Status |
| ------- | -------------- | -------- | ----- | ------- | ------ |

Example:

```text
Aarav Mehta
24IT003
Semester 5
Group Alpha
College SGP Portal
Active
```

---

## Student Actions

Coordinator can:

* Create Student
* Edit Student
* Delete/Deactivate Student
* Activate Student
* View Profile
* View Group
* Move Student between groups (with proper rules)
* Reset account access if supported

---

## Create Student Form

```text
Full Name *
Enrollment Number *
Email *
Department *
Academic Year / Semester *
Status

[Cancel] [Create Student]
```

Institutional information should be controlled by the Coordinator/Admin.

---

## Important Rules

A student can belong to:

```text
Maximum 1 active SGP group
```

The system must prevent:

```text
❌ Same student in multiple active groups
```

---

# 4. Groups Management 👥

This is one of the most important Coordinator modules.

The Coordinator controls:

* Minimum group size
* Maximum group size
* Group creation
* Group membership
* Faculty assignment

---

## Group Settings

Coordinator can define:

```text
Minimum Group Size: 2
Maximum Group Size: 4
```

These rules must be enforced throughout the student portal.

---

## Groups List

Display:

```text
Group Name
Group Code
Members
Assigned Faculty
Project Status
Group Status
```

Example:

```text
Group Alpha
GRP-2026-A001

Members: 3 / 4

Faculty:
Prof. Hitesh Patel

Project:
College SGP Portal

Status:
ACTIVE
```

---

## Group Actions

Coordinator can:

* Create Group
* Edit Group
* Delete Group
* Add Student
* Remove Student
* Change Group Leader
* Assign Faculty
* Reassign Faculty
* View Complete Workspace

---

## Group Detail Page

When Coordinator opens a group:

```text
GROUP ALPHA

Overview | Members | Project | Faculty | Activity
```

### Overview

Show:

* Group Code
* Group Status
* Number of Members
* Assigned Faculty
* Project Status
* Overall Progress

---

### Members

Display every member:

```text
👤 Aarav Mehta
24IT003
Leader

👤 Priya Verma
24IT002
Member

👤 Rahul Shah
24IT004
Member
```

Coordinator can manage members.

---

# 5. Faculty Management & Assignment 👨‍🏫

The Coordinator manages faculty assignments.

## Faculty List

Display:

| Faculty | Department | Assigned Groups | Active Projects | Workload |
| ------- | ---------- | --------------: | --------------: | -------- |

Example:

```text
Prof. Hitesh Patel
IT Department

Assigned Groups: 4
Active Projects: 4

Workload: Moderate
```

---

## Faculty Assignment Rules 🔐

### Important Rule

A group can have:

```text
ONE primary assigned Faculty Guide
```

The same group must **not** appear under multiple primary faculty members.

Example:

```text
Group Alpha → Prof. Hitesh Patel
```

Then:

```text
❌ Faculty B cannot access Group Alpha
❌ Faculty C cannot access Group Alpha
```

unless the Coordinator explicitly changes the assignment.

---

## Faculty Can Have Multiple Groups

Example:

```text
Prof. Hitesh Patel

├── Group Alpha
├── Group Beta
├── Group Gamma
└── Group Delta
```

Each group has completely separate:

* Students
* Project
* Proposal
* Requirements
* Features
* Tasks
* Bugs
* Files
* GitHub repository
* Reviews
* Marks

---

## Assign Faculty Modal

```text
Assign Faculty to Group

Group:
[ Group Alpha ▼ ]

Faculty:
[ Prof. Hitesh Patel ▼ ]

Assignment Type:
● Primary Guide

[Cancel] [Assign Faculty]
```

---

## Reassignment

Coordinator can reassign:

```text
Group Alpha

Previous Faculty:
Prof. A

New Faculty:
Prof. B
```

Before reassignment show confirmation:

> This will remove Group Alpha from the previous faculty workspace and grant access to the newly assigned faculty.

---

# 6. Projects Management 📁

Coordinator can view every project in the department.

## Projects Table

Display:

| Project | Group | Faculty | Status | Progress | Health |
| ------- | ----- | ------- | ------ | -------: | ------ |

Example:

```text
College SGP Portal

Group Alpha
Prof. Hitesh Patel

Development Active

72%

🟢 Healthy
```

---

## Project Statuses

```text
DRAFT
SUBMITTED
REVISION_REQUIRED
APPROVED
DEVELOPMENT_ACTIVE
COMPLETED
ARCHIVED
```

---

## Project Health

Automatically calculate:

```text
🟢 Healthy
🟡 Attention Needed
🔴 At Risk
```

Consider:

* Overdue tasks
* Pending bugs
* Missed milestones
* Delayed reviews
* Project progress

---

# 7. Coordinator Project Workspace 🔎

When the Coordinator clicks a project, open a complete **read-only / management workspace**.

Layout:

```text
PROJECT WORKSPACE

Overview
Members
Proposal
Requirements
Features
Tasks
Bugs
Milestones
Files
Wiki
GitHub
Releases
Calendar
Activity
Permissions
```

The Coordinator can inspect all project data.

---

# 8. Project Overview

Display:

```text
College SGP Portal

Group:
Group Alpha

Faculty Guide:
Prof. Hitesh Patel

Members:
3

Project Status:
Development Active

Overall Progress:
72%
```

Show summary cards:

```text
Requirements
12

Features
8

Tasks
32

Completed Tasks
24

Open Bugs
4

Upcoming Milestones
2
```

---

# 9. Proposal Management

The Coordinator oversees the existing **3-slot proposal system**.

## Proposal Slots

```text
Proposal 1 — APPROVED ✅

Proposal 2 — ARCHIVED

Proposal 3 — ARCHIVED
```

Coordinator can view:

* All submitted proposals
* Submission history
* Faculty comments
* Revision history
* Rejections
* Approval date

---

## Coordinator Override

In exceptional situations:

```text
Approve Proposal
Request Revision
Reject Proposal
Reassign Proposal Reviewer
```

All override actions must create an audit log.

---

# 10. Review Management 📋

The Coordinator controls the complete academic review structure.

## Review Types

Coordinator can create, edit, delete, and schedule review types.

Default examples:

```text
📄 Proposal Review

📘 SRS Review

🏗️ Design Review

💻 Development Review

🎤 Mid-Term Review

🧪 Testing Review

📑 Final Report Review

🎓 Final Evaluation
```

These should **not be hardcoded**.

The Coordinator decides:

* Which reviews exist
* Review order
* Review date
* Review deadline
* Maximum marks
* Weightage
* Applicable groups

---

# 11. Create Review Type

```text
Create Review

Review Name *
[_____________________]

Description
[_____________________]

Review Date *
[ Select Date ]

Start Time
[ Select Time ]

End Time
[ Select Time ]

Maximum Marks *
[ 100 ]

Weightage
[ 20% ]

Applicable To
[ All Groups ▼ ]

Assigned Faculty
[ Auto / Assigned Guide ]

Status
[ Scheduled ▼ ]

[Cancel] [Create Review]
```

---

# 12. Review Scheduling

Coordinator should be able to schedule reviews for:

```text
All Groups
Selected Groups
Specific Department
Specific Semester
```

Example:

```text
Mid-Term Review

Date:
20 October 2026

Groups:
☑ Group Alpha
☑ Group Beta
☑ Group Gamma

Maximum Marks:
50
```

---

# 13. Reviews Overview

Display all review activity.

Filters:

```text
Review Type
Faculty
Group
Status
Date Range
```

Status:

```text
SCHEDULED
IN_PROGRESS
PENDING_EVALUATION
COMPLETED
MARKS_SUBMITTED
OVERDUE
```

Example:

| Review | Group | Faculty | Marks Status |
| ------ | ----- | ------- | ------------ |

```text
Mid-Term Review
Group Alpha
Prof. Hitesh
Submitted ✅
```

---

# 14. Marks & Evaluation ⭐

Coordinator defines the marking structure.

Faculty enters marks.

Students **must not see marks until the Coordinator publishes them**, if that is the college rule.

---

## Mark Configuration

Example:

```text
Proposal Review       10 Marks
SRS Review            15 Marks
Design Review         10 Marks
Development Review    20 Marks
Mid-Term Review       20 Marks
Testing Review        10 Marks
Final Report          15 Marks
Final Evaluation      50 Marks
```

Coordinator can:

* Create mark schemes
* Edit marks
* Define maximum marks
* Define weightage
* Lock marks
* Publish marks

---

# 15. Faculty Marks Entry Workflow

The Coordinator creates the review.

```text
Coordinator
     ↓
Schedules Review
     ↓
Assigned Faculty receives notification
     ↓
Faculty evaluates students
     ↓
Faculty enters marks
     ↓
Faculty submits marks
     ↓
Coordinator reviews
     ↓
Coordinator publishes marks
```

---

# 16. Individual Student Marks

Marks should be assigned per student.

Example:

```text
MID-TERM REVIEW

Group Alpha

Aarav Mehta
Marks: 18 / 20

Priya Verma
Marks: 17 / 20

Rahul Shah
Marks: 19 / 20
```

Faculty can enter different marks for each student.

---

## Marks Status

```text
DRAFT
SUBMITTED_BY_FACULTY
LOCKED
PUBLISHED
```

Coordinator can:

```text
Return for Correction
Approve
Lock
Publish
```

---

# 17. Important Marks Visibility Rule 🔐

Students should see:

```text
Evaluation Pending
```

until marks are published.

After Coordinator publishes:

```text
Mid-Term Review

18 / 20

Faculty Feedback:
Good contribution to backend development.
```

Students must never see:

* Other students' marks
* Faculty internal notes
* Draft marks

---

# 18. Department Analytics 📈

Create a powerful Coordinator Analytics dashboard.

## Charts

### Project Status

```text
Draft
Submitted
Approved
Development
Completed
```

### Department Progress

Show average project completion.

### Faculty Workload

```text
Faculty A — 5 Groups
Faculty B — 3 Groups
Faculty C — 4 Groups
```

### Review Completion

```text
Completed
Pending
Overdue
```

### Task Status

```text
To Do
In Progress
In Review
Done
```

### Bug Statistics

```text
Open Bugs
Critical Bugs
Resolved Bugs
```

### Project Risk

Identify projects with:

```text
🔴 High Risk
🟡 Medium Risk
🟢 Healthy
```

---

# 19. Calendar 📅

Coordinator has a **department-wide Google Calendar-style calendar**.

Show all:

* Proposal deadlines
* Review dates
* Task deadlines
* Milestones
* Releases
* Project deadlines

---

## Calendar Filters

```text
All Events

Tasks
Features
Bugs
Milestones
Reviews
Releases

Faculty
Group
Project
```

Coordinator can click any event.

Example:

```text
📘 SRS Review

Group:
Group Alpha

Faculty:
Prof. Hitesh Patel

Date:
10 September 2026

Status:
Scheduled
```

---

# 20. Notifications 🔔

Coordinator receives notifications for important department activity.

Examples:

```text
🔔 New proposal submitted by Group Alpha

⚠️ Mid-Term marks are pending from Faculty A

🔴 Group Beta has 6 overdue tasks

✅ Faculty B completed SRS review

📝 Marks submitted for Group Gamma
```

Clicking a notification should open the exact related page.

---

# 21. Global Notification Broadcasting

When important Coordinator actions occur, send notifications to affected users.

Examples:

### Faculty Assignment

```text
🔔 You have been assigned as Faculty Guide for Group Alpha.
```

### Review Created

```text
📘 Mid-Term Review has been scheduled for 20 October 2026.
```

### Group Changed

```text
👥 A new member has been added to your project group.
```

### Marks Published

```text
⭐ Your Mid-Term Review result has been published.
```

---

# 22. Coordinator Notifications Must Be Targeted

Do not send every notification to every user.

Example:

```text
Group Alpha action
```

Only notify:

* Group Alpha students
* Assigned Faculty
* Coordinator

Do **not** notify:

```text
❌ Other groups
❌ Unassigned faculty
❌ Other department students
```

---

# 23. Strict Access Control 🔐

This is mandatory.

## Student

Can access only:

```text
their own groupId
their own projectId
```

---

## Faculty

Can access only:

```text
groups explicitly assigned by Coordinator
```

Example:

```text
Faculty A

Allowed:
Group Alpha
Group Beta

Blocked:
Group Gamma
Group Delta
```

---

## Coordinator

Can access:

```text
all students in their department
all groups in their department
all projects in their department
all faculty assignments
all reviews
all department analytics
```

---

# 24. Department Isolation

If there are multiple departments:

```text
IT Department
Computer Engineering
Mechanical Engineering
```

An IT Coordinator must not automatically access another department.

All queries must filter by:

```text
departmentId
```

unless the role is a global Admin.

---

# 25. Permissions & Requests System 🔐

Inside every Project Workspace, add:

> **Permissions & Requests**

Students may request actions that require Faculty/Coordinator permission.

Examples:

```text
✏️ Request Project Detail Change

🔗 Request GitHub Repository Change

👥 Request Group Member Change

📅 Request Deadline Extension

🔄 Request Faculty Reassignment
```

---

## Request Workflow

```text
Student Creates Request
        ↓
Assigned Faculty notified
        ↓
Faculty reviews
        ↓
Approve / Reject / Forward
        ↓
If Coordinator approval required
        ↓
Coordinator decides
        ↓
Permission granted
        ↓
Student notified
```

---

# 26. Audit Logs & Activity Timeline

Every important action must be recorded.

Example:

```text
31 Aug 2026 — Aarav submitted Proposal 1

01 Sep 2026 — Prof. Hitesh requested revision

02 Sep 2026 — Aarav updated Problem Statement

03 Sep 2026 — Prof. Hitesh approved proposal

05 Sep 2026 — Coordinator assigned Mid-Term Review
```

Track:

```text
Who
What
When
Previous Value
New Value
```

Important for academic accountability.

---

# 27. Coordinator Profile 👤

Coordinator can manage:

* Profile photo
* Contact information
* Department information
* Notification preferences

Institutional fields remain protected.

---

# 28. Coordinator Permissions Summary

| Feature                           | Coordinator |
| --------------------------------- | ----------- |
| Manage Students                   | ✅           |
| Manage Faculty                    | ✅           |
| Create Groups                     | ✅           |
| Delete Groups                     | ✅           |
| Assign Faculty                    | ✅           |
| Reassign Faculty                  | ✅           |
| View Projects                     | ✅           |
| Override Proposal                 | ✅           |
| Create Reviews                    | ✅           |
| Schedule Reviews                  | ✅           |
| Configure Marks                   | ✅           |
| Publish Marks                     | ✅           |
| View Analytics                    | ✅           |
| Manage Department Rules           | ✅           |
| View All Department Notifications | ✅           |

---

# 29. Complete Coordinator Workflow

```text
COORDINATOR
      ↓
Configure Academic Rules
      ↓
Manage Students
      ↓
Create / Monitor Groups
      ↓
Assign One Faculty Guide Per Group
      ↓
Students Form Project Ideas
      ↓
Faculty Reviews Proposals
      ↓
One Proposal Approved
      ↓
Project Development Starts
      ↓
Coordinator Creates Review Schedule
      ↓
Faculty Monitors Assigned Groups
      ↓
Faculty Enters Student Marks
      ↓
Coordinator Reviews / Locks / Publishes
      ↓
Coordinator Monitors Department Analytics
      ↓
Projects Completed
```

---

# 30. Final UI Requirements

Keep the existing **TeamSync / College SGP Portal SaaS design language**.

The Coordinator portal should feel like a professional academic management dashboard:

* Clean sidebar
* Modern cards
* Tables with filters
* Search functionality
* Status badges
* Progress bars
* Charts
* Modals for Create/Edit/Delete
* Responsive design
* Clickable drill-down navigation

Use consistent statuses:

```text
TO DO → Slate
IN PROGRESS → Blue
IN REVIEW → Purple
DONE → Green

OVERDUE → Red
PENDING → Amber
DRAFT → Gray
```

---

# ⭐ Most Important Architecture Rule

The Coordinator controls the **assignment and academic configuration**, but project data must remain properly isolated.

```text
Coordinator
   ↓
Department
   ↓
Faculty
   ↓
Assigned Groups
   ↓
Students
   ↓
Project
```

A Faculty can manage multiple assigned groups:

```text
Faculty A
 ├── Group Alpha
 ├── Group Beta
 └── Group Gamma
```

But one group has only one primary Faculty Guide:

```text
Group Alpha → Faculty A ✅

Group Alpha → Faculty B ❌
```

And students can only access their own group's data.

**All APIs, database queries, notifications, dashboards, and workspace pages must enforce these relationships using `departmentId`, `facultyId`, `groupId`, and `projectId`.**
