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

## UI design: two sections, one base

- **Shared:** page background is `bg-base` (`#0a0a0c` neutral near-black, set in `tailwind.config.ts` and `globals.css`). Never use another page background in either section.
- **Working Committee** = violet "fintech console": grouped sidebar with a left-edge active marker (`components/layout/Sidebar.tsx`), squarer corners via the `.committee-ui` wrapper in `globals.css`, violet accent (Tailwind `purple-*` is remapped to `violet` and `gray-*` to neutral `zinc` in `tailwind.config.ts`), Plus Jakarta Sans (`consoleFont` in `lib/fonts.ts`), panels `#111014`, sidebar `#0d0c10`. Dashboard hero uses the `.console-halo` arch, a bar of key numbers, a card grid with one highlighted card, and a full-width violet band of numbered tiles. Every committee page header uses `className="c-page-header ..." data-section="People"` (sticky bar plus "Working Committee / Section" breadcrumb, defined in `globals.css`). Dashboard = KPI strip + panels + right rail; Members = search, category filters, dense table.
- **Dance Floor** (`app/dance`, `components/dance`) = stage look: floating glass sidebar with pill nav (`DanceSidebar.tsx`), orange glow accents, `rounded-3xl` glass cards, pill buttons, light large headings with gold-gradient accent words, Sora font, ambient `.stage-glow` background plus an animated golden wave (`components/dance/WaveBackdrop.tsx`, canvas, in `app/dance/layout.tsx`), twinkling stars, `Orbit.tsx`, and a fade-up on every page change (`app/dance/template.tsx`). All motion must respect `prefers-reduced-motion` (see `globals.css`). Do not reuse committee components or the blue accent here.
- Keep the two looks distinct in structure, not just colour. Don't use emojis; use lucide-react outline icons.

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

**Passwords**
- Accounts made by the Excel/Google-Form import use the (capitalised) register number as a TEMPORARY password; accounts added through the Add form use the password the admin/Lead typed. Both set `User.mustChangePassword = true`.
- Middleware sends any user with that flag to `/change-password` until they pick their own (min 8 chars, not their register number). After changing, they are signed out and log in again. Anyone can also change it later from the key icon in either sidebar.
- Login is case-insensitive on email. Import accepts our template columns AND Google Form columns (`Email Address`, `Core Position`, `Member Position`, `Dance Team`, `Dancer Role`); duplicate email or register number (any case) is skipped.

**Dancer section** (`/dance`, `category = DANCER`)
- Login sends dancers and Dance Leads to `/dance`; middleware keeps them out of committee pages (`/dashboard`, `/members`, `/search`, `/analytics`, `/reports/review`).
- "Committee" = SUPERADMIN or an ADMIN whose category is not DANCER (`isCommittee` in `lib/dance.ts`). Dance Leads (`position = "Team Leader"`) are ADMIN but NOT committee. They manage only their own `team` (`canManage(team)`); committee manages all teams.
- Leads add/remove dancers (Normal Dancer or Team Leader) in their own team, set `skillLevel` (PROFESSIONAL | AMATEUR, default AMATEUR), create rehearsals and performances, and mark attendance (PRESENT/ABSENT/EXCUSED; % = present / (present + absent)).
- Dancers have **Reports only, no OD**. Normal dancers' reports are reviewed ONLY by their team's Lead; Dance Leads' own reports are reviewed by the committee. Nobody reviews their own.
- Notifications (`lib/notify.ts`, `notifyTeam`): when a Lead (or committee) creates a rehearsal, creates a performance, or FIRST saves attendance for a rehearsal, every dancer in that team plus every SuperAdmin gets a `Notification` (types `REHEARSAL_ADDED`, `PERFORMANCE_ADDED`, `ATTENDANCE_MARKED`, with a `link`). The person who did the action is not notified. A failed notification never fails the request. There are TWO separate feeds, worked out in `lib/notify.ts` (`sectionWhere`, no extra DB column): **Dance Floor** = the three team types above, or anything sent to a `DANCER` member (e.g. a dancer's report decision), shown at `/dance/notifications` (stage style, orange badge in `DanceSidebar`); **Working Committee** = everything else, shown at `/notifications` (console style, violet badge in the committee `Sidebar`). New committee types: `REPORT_SUBMITTED` (any report except a normal dancer's, which goes to their Lead) and `OD_REQUESTED`, both sent to SuperAdmins by `notifySuperAdmins`. `api/notifications` PATCH and `api/notifications/unread` accept `section=COMMITTEE|DANCE`. The SuperAdmin has a cross-link between the two pages.
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
- `seed.ts` is the only script in the project root (run with `npx tsx seed.ts`). The old one-off scripts were deleted; they are still in git history if ever needed.
- `(session.user as any)` casts are used throughout. `src/types/index.ts` extends the Session type, and could replace them.
