# Synorlab Interviewer

A B2B SaaS platform for Indian university placement departments. Students upload job descriptions and practice AI-powered mock interviews. Institutions (facility users) can bulk-upload students, upload JDs, schedule interviews, and download cohort reports.

## Architecture

**Monorepo** managed by pnpm workspaces.

### Services (Replit dev environment)

| Artifact | Kind | Path | Port |
|----------|------|------|------|
| `artifacts/synorlab` | React+Vite web app | `/` | 25111 |
| `artifacts/api-server` | Express API server | `/api` | 8080 |
| `artifacts/mockup-sandbox` | Canvas mockup server | `/__mockup` | 8081 |

### Architecture

```
React/Vite (frontend)
  ├── Clerk          — authentication (JWT tokens via @clerk/express + @clerk/react)
  ├── TanStack Query — data fetching (hooks in src/hooks/api.ts)
  └── Express API    — all data operations, AI calls, auth enforcement
        ├── lib/db (Drizzle ORM + PostgreSQL)
        └── lib/aiPrompts (OpenAI gpt-4o)
```

## Tech Stack

- **Frontend**: React 19, Vite, Wouter (routing), TanStack Query, shadcn/ui, Tailwind CSS v4
- **Auth**: Clerk (`@clerk/react` v6 + `@clerk/express`)
- **Database**: PostgreSQL via Drizzle ORM (`lib/db`)
- **AI**: OpenAI gpt-4o via server-side SDK (`lib/aiPrompts`)
- **API**: Express.js (`artifacts/api-server`)

## Key Source Files

| File | Purpose |
|------|---------|
| `artifacts/synorlab/src/hooks/api.ts` | All TanStack Query hooks + fetch helpers (1500+ lines) |
| `artifacts/api-server/src/routes/` | Express route handlers |
| `lib/db/src/schema/` | Drizzle schema definitions |
| `lib/db/src/index.ts` | DB client export |
| `lib/aiPrompts/src/index.ts` | All OpenAI prompt functions |

## Database Schema

- `users` — Clerk user IDs, email, role (student/facility/admin), profile fields
- `job_descriptions` — role, company, skills (jsonb), experienceLevel, responsibilities (jsonb), rawText
- `interviews` — links user + JD, status (`scheduled | in_progress | completed`), `question_set` (jsonb)
- `interview_messages` — per-message log (role: ai/user)
- `evaluations` — overallScore, hiringVerdict, feedback, criteriaScores (jsonb), questionEvals (jsonb)
- `invites` — email + role + token; checked at first sign-up to auto-assign role
- `access_codes` — redeemable codes with role + maxUses

## API Routes

### Auth / Users (`routes/users.ts`)
- `GET /api/users/profile` — get or create current user profile
- `POST /api/users/profile/complete` — complete profile setup
- `POST /api/users/redeem-code` — redeem access code

### Interviews (`routes/interviews.ts`)
- `POST /api/interviews` — create interview (enforces 1-interview free limit for students)
- `GET /api/interviews` — list user's interviews
- `GET /api/interviews/stats` — user interview stats
- `GET /api/interviews/:id` — get interview detail with messages
- `POST /api/interviews/:id/start` — start a scheduled interview (generate first question, set in_progress)
- `POST /api/interviews/:id/respond` — submit user answer, get next AI question
- `POST /api/interviews/:id/complete` — finalize + evaluate interview

### JD (`routes/jd.ts`)
- `POST /api/jd/upload` — parse JD with AI, store, return parsed fields

### Facility (`routes/facility.ts`)
- `GET /api/facility/students` — list all students with stats
- `GET /api/facility/stats` — cohort-level stats (totalStudents, activeThisWeek, avgScore, completionRate)
- `GET /api/facility/jds` — list JDs uploaded by this facility user
- `POST /api/facility/bulk-students` — bulk invite students by email (creates invites)
- `POST /api/facility/bulk-jds` — bulk upload + AI-parse JDs (max 20)
- `POST /api/facility/schedule` — create scheduled interviews for students with a JD
- `GET /api/facility/report` — download CSV cohort report

### Admin (`routes/admin.ts`)
- User management, interview management, invite management, access code management

## Roles & Access Control

| Role | Access |
|------|--------|
| `student` | Own interviews only; free plan limited to 1 interview; must have .edu/.ac.in email |
| `facility` | Read all students; upload JDs; bulk invite; schedule interviews; download reports |
| `admin` | Full access; bypass all limits |

## Interview Statuses

- `scheduled` — created by facility scheduling; no messages yet; starts when student clicks "Begin Interview"
- `in_progress` — active session; messages being generated
- `completed` — evaluated; score available

## AI Interview System

Defined in `lib/aiPrompts/src/index.ts`:

### Question Generation — Structured Phases
`generateQuestions(jd: JDContext)` returns a `QuestionSet` stored in `interviews.question_set`:
1. **Opener** (1): Warm greeting, company + role mention, self-introduction
2. **Technical** (4): Each references a specific tool/technology from the JD
3. **Behavioral** (3): STAR-format anchored to key responsibilities
4. **Situational** (2): Realistic scenarios for this specific role
5. **Closer** (1): Wrap-up, invites candidate questions

### Interviewer Persona
"Priya Sharma, Senior HR Manager" — warm, professional, structured. Phase-aware, STAR reminders in behavioral phase.

### Evaluation — 6-Dimension Framework
- Technical & Domain Knowledge (30%)
- Communication & Articulation (15%)
- Problem-Solving & Analytical Thinking (20%)
- Behavioural Competencies & STAR Quality (20%)
- Cultural Fit & Professional Attitude (10%)
- Role & Company Alignment (5%)

Hiring verdicts: Strong Hire (≥85) / Hire (70-84) / Hold (50-69) / No Hire (<50)

## Frontend Pages

| Route | Page | Auth |
|-------|------|------|
| `/` | Landing page | Public |
| `/sign-in` | Clerk sign-in | Public |
| `/sign-up` | Clerk sign-up | Public |
| `/dashboard` | Stats + recent interviews | Protected |
| `/jd/new` | Upload + parse JD, start interview | Protected |
| `/interviews` | List all interviews (scheduled/in_progress/completed badges) | Protected |
| `/interviews/:id` | Live voice interview session (handles scheduled start) | Protected |
| `/interviews/:id/results` | Evaluation results | Protected |
| `/admin` | Admin panel (users, interviews, invites, codes) | Admin only |
| `/facility` | Facility panel (overview, students, upload, schedule, reports) | Facility only |
| `/settings` | Account settings + code redemption | Protected |
| `/profile-setup` | First-time profile completion | Protected |

## Facility Panel Tabs

| Tab | Purpose |
|-----|---------|
| Overview | Stats cards + completion rate bar |
| Students | Table of all registered students with scores |
| Upload | Bulk invite students by email; bulk upload JDs (AI-parsed) |
| Schedule | Pick a JD + select students → create scheduled interviews |
| Reports | Download CSV cohort report (email, name, dept, year, scores, last active) |

## Business Model

- **Student Free**: 1 mock interview, requires .edu / .ac.in email
- **Professional**: $199/month for institutions — Contact us CTA, no free trial

## Environment Variables

- `DATABASE_URL` — PostgreSQL connection string (Replit managed)
- `SESSION_SECRET` — Express session secret
- `CLERK_SECRET_KEY` — Clerk server-side secret key
- `VITE_CLERK_PUBLISHABLE_KEY` — Clerk publishable key (frontend)
- `OPENAI_API_KEY` — OpenAI API key (server-side only)

## Notes

- `question_set` is stored in `interviews` table on creation so respond calls don't regenerate it
- Scheduled interviews have no messages until `POST /api/interviews/:id/start` is called
- The frontend `startInterview` callback in `interview-session.tsx` auto-calls `/start` when `localMessages` is empty
- Bulk JD upload processes JDs sequentially (max 20 per request) due to AI parsing latency
- `.edu`, `.ac.in`, `.edu.in`, `.ac.uk` etc. emails bypass the edu gate check; facility/admin bypass entirely
