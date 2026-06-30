# Dance Club Availability System

## Project Overview

The Dance Club Availability System is a web application built to help the Dance Club management team efficiently manage member information and determine member availability based on their academic timetable.

The primary objective of this project is to eliminate the need to manually ask members whether they are free. Instead, administrators can search the database and instantly determine which members are available during any academic time slot.

This application is intended for internal use by the Dance Club.

---

# Main Objectives

The application should allow administrators to:

* Manage all club members.
* Store each member's academic timetable.
* Search for members who are available during a specific day and time.
* View overall club statistics.
* Maintain member information in one centralized system.

Regular members should only be able to view their own profile and timetable.

---

# Technology Stack

## Frontend

* Next.js (App Router)
* React
* TypeScript
* Tailwind CSS

## Backend

* Next.js API Routes

## Database

* PostgreSQL (Supabase)

## ORM

* Prisma

## Authentication

* NextAuth

## Deployment

* Vercel

---

# User Roles

There are only two user roles.

## Administrator

Administrators represent the Core Team.

Administrators have permission to:

* Login
* View Dashboard
* Add Members
* Edit Members
* Delete Members
* Manage Timetables
* Search Members
* View Analytics

Administrators have full access to the system.

---

## Member

Regular members can only:

* Login
* View their own profile
* View their own timetable

Members cannot edit information or access administrator pages.

---

# Member Categories

There are exactly three categories.

* Core Members
* Normal Members
* FFCS

These categories are fixed throughout the application.

Internally they are stored as:

```text
CORE
MEMBER
FFCS
```

No additional categories should exist.

---

# Positions

Positions are **not predefined**.

The Position field is a simple text value entered manually when creating or editing a member.

Examples include:

* President
* Vice President
* Secretary
* Joint Secretary
* Dance Captain
* Volunteer
* Member

There is **no Position table** in the database.

There is **no Position dropdown**.

---

# Timetable System

Each member has an academic timetable consisting of:

* Monday
* Tuesday
* Wednesday
* Thursday
* Friday

Saturday and Sunday are intentionally excluded.

Each timetable slot can contain only one of the following values:

* Free
* Theory Class
* Lab Class

No other statuses should exist.

---

# Search System

One of the primary features of this application is the availability search.

Administrators should be able to search members using filters such as:

* Name
* Register Number
* Department
* Academic Year
* Category
* Position
* Day
* Time Slot
* Availability Status

Example:

Find all Core Members who are Free on Wednesday during the 2:00 PM slot.

---

# Analytics

The Analytics page should provide a simple overview of the club.

Statistics include:

* Total Members
* Core Members
* Normal Members
* FFCS Members

No unnecessary analytics are required.

---

# Design Guidelines

The application should maintain a clean and professional appearance.

Requirements:

* Dark theme
* Minimalistic design
* Rounded components
* Professional spacing
* Modern typography
* Responsive layout

Do **not** use emojis anywhere in the interface.

Use **Lucide React** icons only.

The design should resemble modern applications such as:

* Vercel Dashboard
* GitHub
* Linear
* Notion

---

# Project Structure Philosophy

The project should remain modular and maintainable.

Business logic, database logic, UI components, and API routes should remain separated whenever possible.

Avoid placing database queries directly inside UI components when a reusable service layer is more appropriate.

---

# Development Principles

Whenever modifying this project:

1. Analyze the existing implementation before making changes.
2. Keep the database schema and application code synchronized.
3. Update every affected file when changing a model or API.
4. Maintain consistency across the entire project.
5. Avoid duplicate code.
6. Prefer reusable components.
7. Keep the project production-ready rather than tutorial-style.

---

# Important Rules

* Do not recreate features that already exist.
* Do not introduce unnecessary complexity.
* Do not add features unless explicitly requested.
* Preserve the existing project architecture.
* Follow the current coding style.
* Ensure all generated code is TypeScript compatible.
* Ensure Prisma schema, API routes, frontend pages, and database queries always remain consistent.

---

# Current Goal

The objective is to build a stable, scalable, and maintainable Dance Club Availability Management System that can be deployed to Vercel and used by the Dance Club for day-to-day operations.
