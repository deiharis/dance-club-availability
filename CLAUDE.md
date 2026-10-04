# Dance Club Availability Management System

A web app for a VIT college dance club. Core Team members use it to manage members, their weekly academic timetables (who is free when), work reports, OD (On Duty) requests, events, and FFCS grades.

The owner (Haris) is a beginner. Explain what each change does and why, give exact commands for Windows PowerShell, and say what output to expect.

## Stack (versions are pinned on purpose)

- Next.js **14.2.35** (App Router, `src/` dir), React 18, TypeScript, Tailwind CSS 3
- Prisma **5.22** with PostgreSQL on **Supabase**. Do NOT upgrade to Prisma 7 (its config format broke our setup).
- NextAuth v4, Credentials provider, JWT sessions, bcryptjs password hashing
- Supabase Storage (bucket `report-images`) for temporary report proof images
- lucide-react icons, recharts charts, xlsx for Excel import/export
- Hosted on **Vercel**, auto-deploys from GitHub `deiharis/dance-club-availability` branch `main`

## Rules that cost us hours before

- **Never run `npm audit fix --force`.** It downgraded Next.js to v9 and broke everything. Ignore audit warnings.
- The project lives at `C:\Projects_DC\dance-club-availability`. Never put it in OneDrive (sync locks `.next` files).
- Terminal is **PowerShell**: use `;` not `&&`, and quote paths containing `(` `)` or `[` `]`, e.g. `mkdir "src\app\(dashboard)\x"`.
- After any `prisma/schema.prisma` change: `npx prisma db push` then `npx prisma generate`, then in VS Code "TypeScript: Restart TS Server".
- If the dev server acts strangely: `Remove-Item -Recurse -Force .next` then `npm run dev`.
- `package.json` build script is `prisma generate && next build` (required on Vercel). Keep it.
- `next.config.mjs` has `eslint.ignoreDuringBuilds: true`. TypeScript errors still fail the Vercel build, so run `npx tsc --noEmit` before pushing.
- Two route groups must never contain a page that resolves to the same URL (e.g. `(dashboard)/timetable` and `(member)/timetable`), or the build fails.
- Don't use emojis anywhere in the UI. Use lucide-react outline icons.

## Environment variables (`.env`, gitignored; same keys set in Vercel)

`DATABASE_URL` (Supabase pooler, port 6543, `?pgbouncer=true`), `DIRECT_URL` (port 5432), `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. Never commit values. A new env var must also be added in Vercel → Settings → Environment Variables, then redeploy.

## Roles and permissions

`User.role`: `SUPERADMIN` | `ADMIN` | `MEMBER`.

- **SUPERADMIN**: only `harisahamed.b2024@vitstudent.ac.in`. Everything admins can do, plus exclusive FFCS Grades, OD approval, and Events. `seed.ts` re-asserts this role (run `npx tsx seed.ts`).
- **ADMIN**: given automatically to `category = CORE`, and to `DANCER` with `position = "Team Leader"`. Role is recalculated on member create/edit in `api/members`.
- **MEMBER**: everyone else. Can view profile, edit **their own** timetable, submit reports, request OD.

Route protection lives in `src/middleware.ts` and is re-checked in each API route via `getServerSession(authOptions)`. Role is read as `(session.user as any).role`.

## Member model

- `category`: `CORE` | `MEMBER` | `DANCER` | `FFCS_ONLY` (display: Core Member, Normal Member, Dancer, FFCS Only).
- `isFFCS`: boolean, independent of category. `FFCS_ONLY` always has `isFFCS = true`.
- `position` (nullable) and `team` (nullable) come ONLY from `src/lib/teams.ts`, the single source of truth. Don't create a separate positions file.
  - CORE: `position` from `CORE_TEAMS`, `team = null`
  - MEMBER: `position` from `MEMBER_TEAMS`, `team = null`
  - DANCER: `team` from `DANCER_TEAMS`, `position` from `DANCER_ROLES` ("Team Leader" | "Normal Dancer")
  - FFCS_ONLY: neither
- `components/ui/TeamSelector.tsx` renders the dance-team radio list.

## Features and where they live

| Feature | Pages | API |
|---|---|---|
| Login | `app/(auth)/login` | `api/auth/[...nextauth]`, `lib/auth.ts` |
| Admin shell (sidebar, mobile drawer) | `app/(dashboard)/layout.tsx`, `components/layout/Sidebar.tsx` | |
| Dashboard | `(dashboard)/dashboard` | |
| Members CRUD, Excel import/export | `(dashboard)/members`, `/add`, `/[id]/edit`, `/[id]/delete` | `api/members`, `/[id]`, `/import`, `/export` |
| Timetable | `app/timetable` (outside route groups so members can reach it; page splits by role and renders Sidebar itself for admins), `app/timetable/[memberId]` | `api/timetable/[memberId]` (members may only edit their own), `api/timetable/export` |
| Search (Search button, not live; category-dependent position/team filters; multi-slot "free on all selected slots") | `(dashboard)/search` | `api/search` |
| Analytics (heatmap, best slot, per-member %) | `(dashboard)/analytics`, `components/timetable/Heatmap.tsx` | `api/analytics` (force-dynamic, no cache) |
| Reports: submit + OD tab | `app/reports/submit` (all roles) | `api/reports` (POST uploads image), `/mine`, `/approved` |
| Reports: review | `(dashboard)/reports/review` | `api/reports/[id]` (PATCH approve/reject) |
| Notifications on profile | `(member)/profile` | `api/notifications` |
| OD requests | submit tab above; SuperAdmin `(dashboard)/od` | `api/od`, `/[id]` |
| Dancer section (own purple layout `app/dance/layout.tsx` + `components/dance/DanceSidebar.tsx`): dashboard, roster, rehearsals, attendance, performances, timetable, report review | `app/dance`, `/roster`, `/rehearsals`, `/attendance`, `/attendance/[id]`, `/performances`, `/timetable`, `/reports` | `api/dance/*` (rehearsals, attendance, performances, members/[id]/skill); helper `lib/dance.ts` (`getCaller`, `getDanceUser`) |
| Events | `(dashboard)/events` (SuperAdmin) | `api/events`, `/[id]` |
| FFCS grades | `(dashboard)/grades` (SuperAdmin) | `api/grades`, `/[id]` |

## Timetable

`src/lib/timetable.ts`: days MONDAY–FRIDAY (no Saturday), slots T1–T12 plus a non-editable `Lunch` column (01:25–02:00 PM). Status is only `FREE` (green) or `CLASS` (red). One `TimetableEntry` row per member+day+slot, unique on `[memberId, day, slot]`. A missing row means FREE. `components/timetable/TimetableGrid.tsx` is a spreadsheet layout: days are rows, slots are columns, the day column is sticky, and it scrolls horizontally inside its own container only.

## Business rules

**Reports**
- A report needs a description, a work date, and a proof image (required).
- Reports start as PENDING.
- An ADMIN or SUPERADMIN approves or rejects (rejection reason is optional). Nobody can review their own report.
- Images are stored privately in Supabase. `imagePath` is saved, and signed URLs (30 min) are generated when admins view the report. The image is deleted from storage after review.
- Reviewing creates a Notification for the member.
- The reviewer's name and position are shown on the report.

**Dancer section** (`/dance`, `category = DANCER`)
- Login sends dancers and Dance Leads to `/dance`; middleware keeps them out of committee pages (`/dashboard`, `/members`, `/search`, `/analytics`, `/reports/review`).
- "Committee" = SUPERADMIN or an ADMIN whose category is not DANCER (`isCommittee` in `lib/dance.ts`). Dance Leads (`position = "Team Leader"`) are ADMIN but NOT committee. They manage only their own `team` (`canManage(team)`); committee manages all teams.
- Leads add/remove dancers (Normal Dancer or Team Leader) in their own team, set `skillLevel` (PROFESSIONAL | AMATEUR, default AMATEUR), create rehearsals and performances, and mark attendance (PRESENT/ABSENT/EXCUSED; % = present / (present + absent)).
- Dancers have **Reports only, no OD**. Normal dancers' reports are reviewed ONLY by their team's Lead; Dance Leads' own reports are reviewed by the committee. Nobody reviews their own.
- Every `/api/dance/*` and member/timetable/reports API re-checks the caller server-side with `getCaller()`. Never trust a team sent from the browser.

**OD**
- Only CORE and MEMBER categories can request OD (dancers cannot).
- An OD must be based on the member's own APPROVED report. One OD per report (`reportId` is unique).
- The member must pick an Event (`eventId`). Events are created by the SuperAdmin.
- Slots are stored as time-range strings. The member must pick an even number of slots, minimum 2.
- Status is PENDING, then APPROVED, set only by the SuperAdmin after the college grants the OD.

**FFCS grades**
- Grades are S/A/B/C/D/E (enum `FFCSGrade_Enum`).
- Only members with `isFFCS = true` appear on the grades page. Only the SuperAdmin can create, edit or delete grades.

## Git and deploy

```
git add .
git commit -m "<what changed>"
git push
```

Pushing to `main` triggers a Vercel build. Before pushing, run `npx tsc --noEmit` and fix any errors. If the Vercel build fails, read the log for the first `Type error` or `Error:` line.

## Not built yet / known debt

- The SuperAdmin cannot see normal dancers' reports in the committee review queue (Leads only). Add a read-only view if wanted.
- `SaturdayPlanner` model exists, but there is no UI or logic yet (Saturday follows a chosen weekday's timetable).
- `seed.ts` now reads `SUPERADMIN_PASSWORD` from `.env` (local only, not needed in Vercel). The OLD plaintext password is still in git history, so the real password must stay changed.
- One-off scripts in the project root (`seed.ts`, `migrate.ts`, `fix-*.ts`, `clear-*.ts`) are run with `npx tsx <file>`. Everything except `seed.ts` can be deleted.
- `(session.user as any)` casts are used throughout. `src/types/index.ts` extends the Session type, and could replace them.
- Empty leftover folders: `src/app/(member)/timetable`, `src/app/(member)/reports/submit`.
