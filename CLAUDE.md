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

Route protection lives in `src/middleware.ts` and is re-checked in each API route via `getServerSession(authOptions)`. Role is read as `session.user.role` (the Session, User and JWT types are extended once in `src/types/index.ts`, so no casts are needed; keep new fields there).

## Member model

- `category`: `CORE` | `MEMBER` | `DANCER` | `FFCS_ONLY` (display: Core Member, Normal Member, Dancer, FFCS Only).
- `isFFCS`: boolean, independent of category. `FFCS_ONLY` always has `isFFCS = true`.
- `position` (nullable) and `team` (nullable) come ONLY from `src/lib/teams.ts`, the single source of truth. Don't create a separate positions file.
  - CORE: `position` from `CORE_TEAMS`, `team = null`
  - MEMBER: `position` from `MEMBER_TEAMS`, `team = null`
  - DANCER: `team` from `DANCER_TEAMS`, `position` from `DANCER_ROLES` ("Team Leader" | "Normal Dancer")
  - FFCS_ONLY: no position
- **`team` = dance team for ANY category.** Core members, the SuperAdmin, Normal and FFCS-only members can also dance in one team (`team != null`). Non-DANCER members in a team are always Normal Dancers; Team Leaders are always `category = DANCER`. `danceTeamFor(category, team)` in `teams.ts` validates it. "Dancers in team X" queries use `{ team }` (`inDanceTeam` in `lib/dance.ts`), never `{ category: "DANCER", team }`.
- `components/ui/TeamSelector.tsx` renders the dance-team radio list.
- `department` is typed by hand, so it is normalised by `normalizeDepartment()` in `src/lib/departments.ts` (e.g. "BBA Hons", "BBA HONS", "BBA Honours" -> "BBA (Hons)"; "B TECH : CSE-CORE" -> "B.Tech CSE (Core)"). It runs on member add/edit (`api/members`), on import, in search matching, and in analytics grouping (programme and degree). Add new programmes/branches there, then run `npx tsx src/lib/departments.check.ts`. Phone numbers are standardised the same way by `normalizePhone()` in `src/lib/phone.ts` (plain 10 digits; check with `npx tsx src/lib/phone.check.ts`). Existing rows are fixed with the "Tidy data" button on the Members page (`api/members/departments`: GET previews, POST applies; covers departments and phones).

## Features and where they live

| Feature | Pages | API |
|---|---|---|
| Login | `app/(auth)/login` | `api/auth/[...nextauth]`, `lib/auth.ts` |
| Admin shell (sidebar, mobile drawer) | `app/(dashboard)/layout.tsx`, `components/layout/Sidebar.tsx` | |
| Dashboard | `(dashboard)/dashboard` | |
| Members CRUD, Excel import/export | `(dashboard)/members`, `/add`, `/[id]/edit`, `/[id]/delete` | `api/members`, `/[id]`, `/import`, `/export` |
| Timetable | `app/timetable` (outside route groups so members can reach it; page splits by role and renders Sidebar itself for admins), `app/timetable/[memberId]` | `api/timetable/[memberId]` (members may only edit their own), `api/timetable/export` |
| Search (Search button, not live; category-dependent position/team filters; multi-slot "free on all selected slots") | `(dashboard)/search` | `api/search` |
| Analytics: four tabs (Availability, Membership, Dance Floor, Activity) with animated Recharts charts, count-up KPIs and an animated heatmap | `(dashboard)/analytics`, `components/analytics/*` (`parts.tsx` has CountUp, Kpi, ChartCard, Gauge, MeterRow, chart colours), `components/timetable/Heatmap.tsx` | `api/analytics` (force-dynamic, no cache; committee only; response type in `lib/analytics-types.ts`) |
| Reports: submit + OD tab | `app/reports/submit` (all roles) | `api/reports` (POST uploads image), `/mine`, `/approved` |
| Reports: review | `(dashboard)/reports/review` | `api/reports/[id]` (PATCH approve/reject) |
| Notifications on profile | `(member)/profile` | `api/notifications` |
| OD requests | submit tab above; SuperAdmin `(dashboard)/od` | `api/od`, `/[id]` |
| Dancer section (own purple layout `app/dance/layout.tsx` + `components/dance/DanceSidebar.tsx`): dashboard, roster, rehearsals, attendance, performances, timetable, report review | `app/dance`, `/roster`, `/rehearsals`, `/attendance`, `/attendance/[id]`, `/performances`, `/timetable`, `/reports` | `api/dance/*` (rehearsals, attendance, performances, members/[id]/skill); helper `lib/dance.ts` (`getCaller`, `getDanceUser`) |
| Member portal (Normal and FFCS-only members; violet top bar `components/member/MemberShell.tsx`): profile with updates and timetable, own timetable, My reports + OD | `(member)/profile`, `app/timetable` (member view), `app/reports/submit` (picks its frame by user type: dancers are sent to `/dance/my-reports`, committee get the console sidebar, members get the portal) | `components/reports/MyReports.tsx` (one component, `variant="member"` or `"stage"`, `showOd`) |
| Dance team insights for Leads (own team) / SuperAdmin (any team) | `app/dance/analytics`, `components/dance/TeamAnalyticsView.tsx` | `api/dance/analytics` |
| Dance roster Excel import / export / template: SUPERADMIN ONLY, one team at a time (the team tab on the Roster page). Import skips rows whose "Dance Team" is a different team, so one shared Google Form sheet is imported tab by tab; no skill-level column needed (defaults to Amateur, Leads set it later); temp password = register number | `components/dance/RosterClient.tsx` | `api/dance/roster/import`, `api/dance/roster/export` (`?template=1` for the blank template). Shared sheet parsing and account creation for BOTH imports live in `lib/member-import.ts` |
| Events | `(dashboard)/events` (SuperAdmin) | `api/events`, `/[id]` |
| FFCS grades | `(dashboard)/grades` (SuperAdmin) | `api/grades`, `/[id]` |

## Branding (Dance Club VIT Chennai)

- **Mark:** a dancer mid-leap (grand jete) inside a spotlight halo; the back leg breaks out of the halo. Paths live ONLY in `MARK` in `src/components/brand/Logo.tsx` (`LogoMark` gold/white/ink, `LogoLockup` mark + "DANCE CLUB / VIT CHENNAI"). Do not redraw it elsewhere.
- **Palette:** Stage Black `#0A0A0C`, Spotlight Gold `#FBBF24`, Ember `#F97316`, Champagne `#FFE7A8` (gradient champagne -> gold -> ember), Ivory `#F6F3EE`, Ink `#1C1917`, Console Violet `#8B5CF6` (Working Committee accent only). Wordmark font: Sora (`brandFont` in `lib/fonts.ts`), 600 with 0.24em tracking; "VIT CHENNAI" 300 with 0.5em tracking.
- **Usage:** gold mark on dark (login, Dance Floor), white mark on the violet console sidebar, ink mark on light backgrounds. Favicon is `src/app/icon.svg` (thicker strokes for small sizes). Files for posters and social media: `public/brand/` (SVG marks in gold/white/ink, `logo-icon-1024.png`, `logo-lockup-dark.png`, `logo-lockup-light.png`).
- **Intro splash** (`components/brand/Splash.tsx`, CSS under "Intro splash" in `globals.css`): about 3s before the login page, once per browser session (`sessionStorage` key `dc-intro-seen`), skippable by click, any key or the Skip button, and reduced to a brief still for reduced-motion users. The login form fades up as the splash dissolves.

## UI design: two sections, one base

- **Shared:** page background is `bg-base` (`#0a0a0c` neutral near-black, set in `tailwind.config.ts` and `globals.css`). Never use another page background in either section.
- **Working Committee** = violet "fintech console": grouped sidebar with a left-edge active marker (`components/layout/Sidebar.tsx`), squarer corners via the `.committee-ui` wrapper in `globals.css`, violet accent (Tailwind `purple-*` is remapped to `violet` and `gray-*` to neutral `zinc` in `tailwind.config.ts`), Plus Jakarta Sans (`consoleFont` in `lib/fonts.ts`), panels `#111014`, sidebar `#0d0c10`. Dashboard hero uses the `.console-halo` arch, a bar of key numbers, a card grid with one highlighted card, and a full-width violet band of numbered tiles. Every committee page header uses `className="c-page-header ..." data-section="People"` (sticky bar plus "Working Committee / Section" breadcrumb, defined in `globals.css`). Dashboard = halo hero + numbers bar + card grid + violet band; Members = search, category filters, dense table; Search = left filter rail (Who / Availability, incl. dancer skill level) beside the results; queue pages (OD, Reports review, Events) use stripe cards and status tabs from `components/console/ui.tsx`; Grades = member list on the left, selected member's grades and an always-open add form on the right; reports review is ONE component with two skins (`components/reports/ReviewReports.tsx`, `variant="console"` for the committee and `"stage"` for Dance Leads); Add/Edit member share `components/members/MemberForm.tsx` (Identity / Club role / Account panels plus a live Summary card that shows the access level).
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
- "Committee" = SUPERADMIN or an ADMIN whose category is not DANCER (`isCommittee` in `lib/dance.ts`). Dance Leads (`position = "Team Leader"`) are ADMIN but NOT committee.
- **Dance team isolation: ONLY the SUPERADMIN sees and manages every dance team.** Core/committee rights never extend to dance teams. `canManage(team)` = SuperAdmin, or a Lead for their own team. `pageTeam()` ignores `?team=` for everyone but the SuperAdmin. A Core member in a team is a Normal Dancer there (own team, view only); a Core member with no team cannot open the Dance Floor (sent to `/dashboard`) and has no Dance Floor button (`showDanceFloor` prop on `Sidebar`). The committee Analytics "Dance Floor" tab (`dance` is null for non-SuperAdmins) and the "Dancer reports (view only)" list are SuperAdmin only.
- Leads add/remove dancers (Normal Dancer or Team Leader) in their own team, set `skillLevel` (PROFESSIONAL | AMATEUR, default AMATEUR), create rehearsals and performances, and mark attendance (PRESENT/ABSENT/EXCUSED; % = present / (present + absent)).
- Dancers (`category = DANCER`) have **Reports only, no OD**. Normal dancers' reports are reviewed ONLY by their team's Lead; Dance Leads' own reports are reviewed by the committee. Nobody reviews their own.
- Notifications (`lib/notify.ts`, `notifyTeam`): when a Lead (or committee) creates a rehearsal, creates a performance, or FIRST saves attendance for a rehearsal, every dancer in that team plus every SuperAdmin gets a `Notification` (types `REHEARSAL_ADDED`, `PERFORMANCE_ADDED`, `ATTENDANCE_MARKED`, with a `link`). The person who did the action is not notified. A failed notification never fails the request. There are TWO separate feeds, worked out in `lib/notify.ts` (`sectionWhere`, no extra DB column): **Dance Floor** = the three team types above, or anything sent to a `DANCER` member (e.g. a dancer's report decision), shown at `/dance/notifications` (stage style, orange badge in `DanceSidebar`); **Working Committee** = everything else, shown at `/notifications` (console style, violet badge in the committee `Sidebar`). New committee types: `REPORT_SUBMITTED` (any report except a normal dancer's, which goes to their Lead), `OD_REQUESTED`, and `MEMBERS_ADDED` (an Excel import finished, or a Dance Lead added a dancer), all sent to SuperAdmins by `notifySuperAdmins`. Adding dancers to an existing performance notifies just those dancers (`notifyMembers`). The SuperAdmin can also view normal dancers' reports read-only (`/reports/review`, "Dancer reports (view only)", `api/reports?scope=dancers`); only the team's Lead can decide them. `api/notifications` PATCH and `api/notifications/unread` accept `section=COMMITTEE|DANCE`. The SuperAdmin has a cross-link between the two pages.
- Every `/api/dance/*` and member/timetable/reports API re-checks the caller server-side with `getCaller()`. Never trust a team sent from the browser.
- Dance Floor access: the SuperAdmin, or anyone with a `team` (checked in `app/dance/layout.tsx`; middleware only requires login). The member portal shows a "Dance Floor" link to members with a team.
- Mixed teams: the roster shows non-dancers with a category badge. Leads can delete only pure dancers; for others the button is "Remove from team" (`PATCH api/dance/members/[id]/team`, sets `team = null`, keeps the account). Leads can read every teammate's timetable but edit only pure dancers'.
- Roster import/export/template (`api/dance/roster/import|export`) is SuperAdmin only, one team at a time. Import adds an existing account with no team to the team instead of skipping it.
- **Report topic** `Report.area` (`COMMITTEE` | `DANCE`, nullable for old reports). Pure dancers are always DANCE, members without a team always COMMITTEE, members with both pick on the form. "Lead-reviewed" = DANCE (or null from a pure dancer) and the submitter is not a Lead (`leadReviewedWhere` / `isLeadReviewed` in `lib/dance.ts`); those go to the team's Lead, everything else to the committee.

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

- `SaturdayPlanner` model exists, but there is no UI or logic yet (Saturday follows a chosen weekday's timetable). Not part of any current request; the timetable only covers Monday to Friday.
- `seed.ts` now reads `SUPERADMIN_PASSWORD` from `.env` (local only, not needed in Vercel). The OLD plaintext password is still in git history, so the real password must stay changed.
- `seed.ts` is the only script in the project root (run with `npx tsx seed.ts`). The old one-off scripts were deleted; they are still in git history if ever needed.
