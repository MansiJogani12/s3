# 🎓 TeamSync — Complete Faculty Portal Prompt

**Redesign and implement the complete FACULTY role for the existing College SGP Portal / TeamSync system.**

The Student Portal is already implemented. Now build the **Faculty Portal** with proper multi-group management, strict access control, proposal review, project monitoring, evaluation, and notifications.

---

# 1. Core Faculty Assignment Rule ⭐

## Coordinator Assigns Groups to Faculty

Faculty members must **NOT assign groups to themselves**.

Only the **Department Coordinator** can:

* Create/manage group assignments
* Assign a Faculty Guide to a group
* Reassign a group to another Faculty
* Remove/change a Faculty assignment

### Relationship

```text
COORDINATOR
      ↓
Assigns Group
      ↓
FACULTY GUIDE
      ↓
Manages Multiple Groups
```

Example:

```text
Coordinator
│
├── Faculty A
│     ├── Group 1
│     ├── Group 2
│     └── Group 3
│
├── Faculty B
│     ├── Group 4
│     └── Group 5
│
└── Faculty C
      ├── Group 6
      └── Group 7
```

---

# 2. Strict Group Assignment Rules 🔐

A Faculty member can manage:

```text
ONE FACULTY → MANY GROUPS
```

Example:

```text
Prof. Hitesh Patel
├── GRP-001
├── GRP-002
├── GRP-003
└── GRP-004
```

But one group can have only **one primary Faculty Guide**.

```text
ONE GROUP → ONE FACULTY GUIDE
```

Therefore:

```text
GRP-001 → Prof. Hitesh Patel ✅

GRP-001 → Prof. Hitesh Patel
GRP-001 → Prof. Another Faculty ❌
```

If the Coordinator changes the Faculty assignment:

```text
Coordinator
      ↓
Remove Faculty A
      ↓
Assign Faculty B
```

Then immediately:

```text
Faculty A ❌ loses access
Faculty B ✅ receives access
```

---

# 3. Faculty Access Control

This is a critical security requirement.

A Faculty member must only access groups explicitly assigned by the Coordinator.

Every request must verify:

```text
currentUser.role === FACULTY
```

And:

```text
group.guideId === currentFaculty.id
```

If the faculty is not assigned:

```text
❌ Do not return project data
❌ Do not return student data
❌ Do not return files
❌ Do not return tasks
❌ Do not return marks
```

Show:

```text
Access Denied

You are not assigned to this project.
```

Do not allow changing the URL manually to access another Faculty's group.

---

# 4. Faculty Portal Sidebar

Use the following sidebar:

```text
📊 Dashboard
👤 Profile

👥 My Groups

📄 Proposal Reviews
📋 Requirements

📊 Work Management
🐞 Bugs
🎯 Milestones

📁 Files
💬 Chat

📅 Calendar
📝 Reviews & Marks

🔔 Notifications
```

Do not show student-only actions that allow Faculty to create groups or assign themselves to groups.

---

# 5. Faculty Dashboard 📊

The dashboard should provide an overview of **all groups assigned to the currently logged-in Faculty**.

Example:

```text
Good Morning, Prof. Hitesh Patel 👋

FACULTY GUIDE

You are currently managing:

👥 5 Groups
👨‍🎓 18 Students
📁 4 Active Projects
📄 3 Pending Proposal Reviews
⚠️ 6 Overdue Tasks
```

---

## Dashboard Summary Cards

```text
┌──────────────────────┐
│ 👥 Assigned Groups   │
│          5           │
└──────────────────────┘

┌──────────────────────┐
│ 👨‍🎓 Total Students  │
│         18           │
└──────────────────────┘

┌──────────────────────┐
│ 📄 Pending Reviews   │
│          3           │
└──────────────────────┘

┌──────────────────────┐
│ ⚠️ Overdue Tasks     │
│          6           │
└──────────────────────┘
```

All counts must come from real assigned-group data.

---

# 6. My Assigned Groups 👥 ⭐

This is the main Faculty management page.

Display only groups assigned by the Coordinator.

```text
# My Assigned Groups

Search Groups...

[All Groups]
[Proposal Pending]
[Active Projects]
[Completed]
```

Each group card should display:

```text
GRP-2026-A12

Project:
College SGP Portal

Students: 4

Progress:
████████░░ 80%

Status:
🟢 Active

Pending:
📄 1 Review
⚠️ 2 Overdue Tasks

[ Open Workspace → ]
```

---

# 7. Complete Group Workspace ⭐⭐⭐

When Faculty clicks:

```text
Open Workspace
```

Open the complete workspace for that specific group.

Example:

```text
← Back to My Groups

GRP-2026-A12

College SGP Portal

👥 4 Students

👨‍🏫 Faculty Guide:
Prof. Hitesh Patel

Project Progress:
████████░░ 80%
```

---

## Group Workspace Navigation

```text
Overview
Members
Permissions
Proposal
Requirements
Features
Tasks
Bugs
Milestones
Files
GitHub
Activity
```

Every tab must use the **same `groupId` and `projectId`**.

Never mix data from another group.

---

# 8. Group Overview

The Overview should summarize the complete project.

Display:

```text
PROJECT STATUS
🟢 DEVELOPMENT ACTIVE

PROJECT PROGRESS
████████░░ 80%

FEATURES
8 Total
6 Completed

TASKS
32 Total
24 Completed
5 In Progress
3 Pending

BUGS
2 Open
5 Resolved

NEXT MILESTONE
Mid-Term Review

DUE DATE
15 September 2026
```

---

# 9. Group Members 👨‍🎓

Each group can contain multiple students.

Example:

```text
GROUP MEMBERS

👤 Aarav Mehta
24IT003
Leader

Assigned Tasks: 8
Completed: 6

────────────────

👤 Priya Verma
24IT002
Member

Assigned Tasks: 7
Completed: 5

────────────────

👤 Rahul Shah
24IT004
Member

Assigned Tasks: 6
Completed: 4
```

Faculty can:

* View members
* View enrollment numbers
* View roles
* View assigned tasks
* View student activity
* Contact/message students

Faculty cannot add themselves or another faculty to the group.

---

# 10. Proposal Reviews 📄

Faculty sees proposal submissions from only assigned groups.

Support the existing **3-slot proposal system**.

Example:

```text
PROPOSAL REVIEWS

GRP-001
Proposal 1
College SGP Portal
🟣 UNDER REVIEW

[Review]

GRP-002
Proposal 2
AI Smart Attendance
🔵 SUBMITTED

[Review]
```

---

## Faculty Proposal Actions

Faculty can:

```text
[ APPROVE ]
[ REQUEST REVISION ]
[ REJECT ]
```

Rules:

### Approve

```text
Proposal → APPROVED
Project → DEVELOPMENT ACTIVE
Other pending proposals → ARCHIVED
```

### Request Revision

```text
Proposal → REVISION_REQUIRED
Student editing → UNLOCKED
```

Faculty feedback is mandatory.

### Reject

```text
Proposal → REJECTED
Submission slot → REFUNDED
```

Students can submit a new idea if a slot becomes available.

---

# 11. Approved Project Change Requests

Students cannot directly edit approved projects.

When students request changes, Faculty receives:

```text
PROJECT CHANGE REQUEST

Group:
GRP-001

Requested Fields:

☑ Tech Stack
☑ Problem Statement

Reason:

[Student Reason]
```

Faculty can:

```text
[ APPROVE EDITING ]
[ REJECT REQUEST ]
```

If approved:

```text
Only requested fields → UNLOCKED
```

After students submit changes:

```text
Updated fields → LOCKED
Faculty → Reviews again
```

Faculty can:

```text
[ APPROVE CHANGES ]
[ REQUEST REVISION ]
```

After approval:

```text
Project → LOCKED AGAIN 🔒
```

---

# 12. Requirements 📋

Faculty can monitor the Requirements/SRS of each assigned project.

Show:

```text
FUNCTIONAL REQUIREMENTS

FR-001
FR-002
FR-003
```

```text
NON-FUNCTIONAL REQUIREMENTS

NFR-001
NFR-002
```

Faculty can:

* View requirements
* Verify requirements
* Add comments
* Request clarification
* View linked Features
* View linked Tasks
* View linked Bugs
* View Traceability Matrix

Traceability:

```text
Requirement
      ↓
Feature
      ↓
Task
      ↓
Bug
```

Faculty should not casually modify student requirements directly.

---

# 13. Work Management 📊

Faculty can monitor all work from assigned groups.

At the top:

```text
Select Group:

[ All Groups ▼ ]
```

or:

```text
[ GRP-001 ▼ ]
```

Display Kanban:

```text
TO DO
IN PROGRESS
IN REVIEW
DONE
```

Each task should show:

* Task Title
* Feature
* Assigned Student
* Priority
* Start Date
* Due Date

Faculty can:

* View tasks
* Monitor progress
* Move tasks between statuses
* Return incorrect DONE tasks to IN_PROGRESS
* Create tasks when necessary
* Edit task details
* Assign tasks to students within that group

Faculty must never assign tasks to students outside the selected group.

---

# 14. Features

Faculty can view all Features of the selected group.

Example:

```text
🔐 User Authentication

Progress: 75%

☑ Login UI
☑ Login API
☑ Database Integration
☐ Security Testing
```

Progress must calculate dynamically:

```text
Completed Checklist Items
──────────────────────── × 100
Total Checklist Items
```

Faculty can:

* View Features
* Monitor progress
* Add comments
* Request improvements

---

# 15. Bugs 🐞

Faculty can monitor Bugs from assigned projects.

Faculty can also report bugs found during reviews.

Example:

```text
🐞 Login API Authentication Error

Priority: 🔴 Critical

Status:
IN PROGRESS

Assigned To:
Aarav Mehta

Linked Task:
Create Login API
```

Faculty can:

* Create Bugs
* Edit Bugs
* Change status
* Assign Bugs
* Link Bugs to Tasks
* Link Bugs to Features

Strict rule:

Only students from the selected group can be assigned.

---

# 16. Milestones 🎯

Faculty can monitor all project milestones.

Example:

```text
Milestone 1
Proposal & Approval
██████████ 100%

Milestone 2
SRS & Architecture
██████░░░░ 60%

Milestone 3
Development
████░░░░░░ 40%
```

Faculty can:

* View milestone progress
* Add comments
* Monitor delays
* Receive overdue alerts

---

# 17. Files 📁

Faculty sees files only from assigned groups.

Categories:

```text
📄 SRS Documents
📄 Design Documents
📊 Presentations
📄 Progress Reports
📄 Final Report
📎 Other
```

Faculty can:

```text
[View]
[Download]
[Comment]
[Request Re-upload]
```

---

# 18. GitHub Integration 🐙

Faculty can view the connected GitHub repository of each assigned project.

Display:

* Repository information
* Branches
* Commits
* Contributors
* Languages
* Issues
* Pull Requests
* Releases
* Repository activity
* File/folder structure graph

Faculty must only access repositories connected to their assigned projects.

---

# 19. Group Activity Timeline

Each group should have an audit/activity timeline.

Example:

```text
TODAY

10:30 AM
Aarav created Task:
"Login API"

11:15 AM
Priya completed Feature:
"User Authentication"

01:30 PM
Rahul uploaded:
"SRS Document"

03:00 PM
Faculty moved Task:
"Database Design"
to IN REVIEW
```

Track:

```text
Who
Action
Module
Date
Time
```

---

# 20. Chat 💬

Faculty communication must be separated by groups.

Example:

```text
CHATS

💬 GRP-001
💬 GRP-002
💬 GRP-003
```

When Faculty opens:

```text
GRP-001
```

Only members of that group participate.

Faculty cannot accidentally access another unassigned group.

---

# 21. Faculty Calendar 📅

The Faculty Calendar combines dates from **all groups assigned to that Faculty**.

Include:

* Task Due Dates
* Feature Target Dates
* Milestone Dates
* Review Dates
* Release Dates
* Bug Deadlines

Each event should show its group.

Example:

```text
05 SEP

🔴 [GRP-001] Login API Due

06 SEP

🟡 [GRP-002] SRS Review

08 SEP

🟢 [GRP-003] Milestone Completed
```

Every event title must be prefixed with `[GroupCode]` so the Faculty can distinguish events across multiple assigned groups at a glance.

Clicking an event opens complete details.

---

# 22. Calendar Color Rules

Use the existing TeamSync rules:

```text
🔴 Red
Overdue

🩷 Pink
Completed Late

⚪ Gray / Strike-through
Completed On Time

🟤 Brown / Amber
Release

⚪ Hidden
Draft Releases
```

---

# 23. Reviews & Marks 📝 ⭐

Review Types are defined by the **Coordinator**.

Faculty cannot create random review types.

Available examples:

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

---

## Faculty Evaluation Flow

Faculty selects:

```text
Review Type:
[ Mid-Term Review ▼ ]

Group:
[ GRP-001 ▼ ]
```

Then all group members appear.

```text
Aarav Mehta
24IT003

Marks:
[ 85 ]

Feedback:
[ Excellent contribution ]

[Save Draft]
```

Repeat for each student.

Marks are assigned **per student**, not one mark for the entire group.

---

# 24. Marks Privacy 🔒

Students must not immediately see marks.

Faculty can:

```text
SAVE DRAFT
```

or:

```text
FINALIZE
```

Even after Faculty finalizes:

```text
Students can see:
Review Submitted

Students cannot see:
❌ Marks
❌ Scores
❌ Private Faculty Notes
```

The **Coordinator controls publication**.

Only after Coordinator publishes:

```text
Students → Can see marks
```

---

# 25. Notifications 🔔

Faculty receives real-time notifications only for assigned groups.

Examples:

```text
🔔 New Proposal Submitted

GRP-001 submitted Proposal 2.
```

```text
🔔 Task Completed

Aarav completed:
Database Design
```

```text
⚠️ Overdue Task

GRP-002 has an overdue task.
```

```text
🔔 Project Change Request

GRP-003 requested changes to the Tech Stack.
```

### Actionable & Click-Through Notifications

When a notification (such as a GitHub Repo Change Request or Permission Request) is generated for a Faculty member:
1. It contains direct link metadata (`linkUrl: /faculty/group/:groupId`).
2. Clicking the notification card or the **"Go to Page →"** button immediately navigates the Faculty member to the target Group Workspace and Permissions tab.

---

# 26. Group Notification Rules

Whenever something changes:

```text
Student creates Task
Student edits Feature
Student deletes Task
Student uploads File
Student changes Bug status
Student submits Proposal
```

Notify:

```text
All members of THAT group
+
Assigned Faculty
```

Never notify:

```text
❌ Other groups
❌ Other faculty
❌ Students outside the project
```

---

# 27. Faculty Profile 👤

Faculty Profile should contain:

### Institutional Information

```text
Full Name
Faculty ID
Department
Designation
Email
```

These fields may be locked if managed by Admin.

### Professional Information

Faculty can update:

* Profile Photo
* Bio
* Specialization
* Technical Expertise
* Research Interests
* Contact Preferences

---

# 28. Coordinator Assignment Integration ⭐⭐⭐

The Faculty Portal must automatically update based on Coordinator assignments.

Example:

```text
Coordinator assigns:

GRP-001 → Prof. Hitesh Patel
```

Immediately:

```text
Prof. Hitesh Patel Dashboard
→ My Groups
→ GRP-001 appears
```

If Coordinator reassigns:

```text
GRP-001

Old Faculty:
Prof. Hitesh Patel

New Faculty:
Prof. Ravi Shah
```

Then:

```text
Prof. Hitesh Patel
❌ Cannot access GRP-001 anymore

Prof. Ravi Shah
✅ Can access GRP-001 immediately
```

Keep an audit log:

```text
Coordinator changed Faculty Guide

Group:
GRP-001

Old:
Prof. Hitesh Patel

New:
Prof. Ravi Shah

Date:
01 Sep 2026
```

---

# 29. Faculty Must NOT Have These Permissions ❌

Faculty cannot:

```text
❌ Create groups
❌ Delete groups
❌ Assign themselves to groups
❌ Assign another faculty
❌ Access another faculty's groups
❌ Change department-wide rules
❌ Publish marks to students
❌ Manage review types
```

These actions belong to:

```text
Coordinator / Admin
```

---

# 30. Complete Faculty Data Flow

```text
COORDINATOR
       ↓
Assigns Group to Faculty
       ↓
FACULTY DASHBOARD
       ↓
My Assigned Groups
       ↓
Faculty Selects Group
       ↓
Complete Group Workspace
       ↓
┌──────────────────────────┐
│ Overview                 │
│ Members                  │
│ Permissions              │
│ Proposal                 │
│ Requirements             │
│ Features                 │
│ Tasks                    │
│ Bugs                     │
│ Milestones               │
│ Files                    │
│ GitHub                   │
│ Activity                 │
└──────────────────────────┘
       ↓
Faculty Reviews & Monitors
       ↓
Students Receive Notifications
```

---

# 31. Final Security & Database Rules 🔐

Implement strict relational ownership.

Conceptually:

```text
Faculty
   │
   └── assignedGroups[]
          │
          ├── Students[]
          └── Project
                 ├── Proposals
                 ├── Requirements
                 ├── Features
                 ├── Tasks
                 ├── Bugs
                 ├── Milestones
                 ├── Files
                 ├── GitHub
                 └── Reviews
```

Every API request must validate:

```text
Current Faculty
        ↓
Is Faculty assigned to Group?
        ↓
YES → Return Data
NO  → Access Denied
```

Do not rely only on frontend filtering.

**Backend/database-level authorization is mandatory.**

---

# Final Faculty Portal Principle

The Faculty Portal should work like this:

```text
ONE FACULTY
      ↓
MANY ASSIGNED GROUPS
      ↓
SELECT A GROUP
      ↓
VIEW COMPLETE PROJECT WORKSPACE
      ↓
REVIEW / MONITOR / EVALUATE
```

## Important Final Rule

> **The Coordinator controls which Faculty gets which Group. Faculty only manages the groups assigned to them.**

The UI must be modern, clean, responsive, and consistent with the existing **TeamSync Student Portal**, while providing Faculty with a powerful multi-group management dashboard.
