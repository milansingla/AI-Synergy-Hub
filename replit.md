# Synorlab Interviewer

A full-stack AI-powered B2B SaaS platform for universities where students upload job descriptions and practice mock interviews with an AI interviewer.

## Architecture

**Monorepo** managed by pnpm workspaces.

### Services

| Artifact | Kind | Path | Port |
|----------|------|------|------|
| `artifacts/synorlab` | React+Vite web app | `/` | 25111 |
| `artifacts/api-server` | Express 5 API | `/api` | 8080 |
| `artifacts/mockup-sandbox` | Canvas mockup server | `/__mockup` | 8081 |

### Shared Libraries

| Package | Purpose |
|---------|---------|
| `lib/api-spec` | OpenAPI spec + Orval codegen config |
| `lib/api-client-react` | Generated TanStack Query hooks |
| `lib/api-zod` | Generated Zod schemas |
| `lib/db` | Drizzle ORM schema + migrations |
| `lib/integrations-openai-ai-server` | OpenAI server SDK (via Replit AI Integrations) |
| `lib/integrations-openai-ai-react` | OpenAI React hooks |

## Tech Stack

- **Frontend**: React 19, Vite, Wouter (routing), TanStack Query, shadcn/ui, Tailwind CSS v4
- **Backend**: Express 5, Drizzle ORM, PostgreSQL
- **Auth**: Clerk (`@clerk/react` v6 + `@clerk/express`) — Replit-managed
- **AI**: OpenAI gpt-4o via Replit AI Integrations proxy
- **Codegen**: Orval (OpenAPI → React Query hooks + Zod schemas)

## Database

PostgreSQL via `DATABASE_URL`. Schema defined in `lib/db/src/schema/`:

- `users` — Clerk user IDs, email, role (student/facility/admin)
- `job_descriptions` — rawText, role, company, skills (jsonb), experienceLevel, responsibilities (jsonb)
- `interviews` — links user + JD, tracks status (in_progress/completed)
- `interview_messages` — per-message log (role: ai/user)
- `evaluations` — AI-scored evaluation: overallScore, feedback, strengths, improvements, criteriaScores (6-dim jsonb), questionEvals (jsonb)
- `invites` — email + role + token; checked on first sign-up to auto-assign role
- `access_codes` — shareable code + role + maxUses + usedCount; redeemable from Settings

## API Routes

All under `/api`:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/healthz` | Health check |
| POST | `/jd/upload` | Upload + parse JD text |
| GET | `/interviews` | List user's interviews |
| POST | `/interviews` | Create interview (AI generates first question) |
| GET | `/interviews/stats` | User stats |
| GET | `/interviews/:id` | Get interview with messages + evaluation |
| POST | `/interviews/:id/respond` | Submit answer (AI responds) |
| POST | `/interviews/:id/complete` | Finish interview + generate evaluation |
| GET | `/users/profile` | Get current user profile |
| PUT | `/users/profile` | Update user role |
| GET | `/admin/users` | List all users (admin only) |
| GET | `/admin/stats` | Platform stats (admin only) |
| PUT | `/admin/users/:userId/role` | Change a user's role (admin only) |
| DELETE | `/admin/users/:userId` | Delete user + all data (admin only) |
| GET | `/admin/all-interviews` | All interviews platform-wide (admin only) |
| DELETE | `/admin/interviews/:id` | Delete interview (admin only) |

## AI Interview System

Defined in `artifacts/api-server/src/lib/aiPrompts.ts`:

### Question Generation — Structured Phases
`generateQuestions(jd: JDContext)` returns a `QuestionSet` with distinct phases:
1. **Opener** (1 question): Warm greeting, name company + role, ask for self-introduction
2. **Technical** (4 questions): Each references a specific tool/technology/responsibility from the JD
3. **Behavioral** (3 questions): STAR-format anchored to key JD responsibilities
4. **Situational** (2 questions): Realistic scenarios specific to this role at this company
5. **Closer** (1 question): Wrap-up, invites candidate questions about the company

### Interviewer Persona
`getNextQuestion(jd, questionSet, history, answeredCount)` — AI interviewer persona "Priya Sharma, Senior HR Manager". Displays phase label and progress in UI. Tracks phases, acknowledges previous answers naturally, reminds of STAR method in Behavioral phase.

### Evaluation — 6-Dimension Framework
`evaluateInterview(jd, history)` — Aligned with FAANG + Indian corporate HR standards:
1. **Technical & Domain Knowledge** (25%)
2. **Communication & Articulation** (20%)
3. **Problem-Solving & Analytical Thinking** (20%)
4. **Behavioural Competencies** (15%)
5. **Cultural Fit & Professional Attitude** (10%)
6. **Role & Company Alignment** (10%)

Scoring: 90-100 Exceptional → 75-89 Strong → 60-74 Adequate → 40-59 Developing → 0-39 Insufficient

## Frontend Pages

| Route | Page | Auth |
|-------|------|------|
| `/` | Landing page | Public |
| `/sign-in` | Clerk sign-in | Public |
| `/sign-up` | Clerk sign-up | Public |
| `/dashboard` | Stats + recent interviews | Protected |
| `/jd/new` | Upload + parse JD (shows company, responsibilities, skills), start interview | Protected |
| `/interviews` | List all interviews | Protected |
| `/interviews/:id` | Live voice interview — phase indicator, End Interview button, Home button | Protected |
| `/interviews/:id/results` | Evaluation: 6-dim criteria bars, Q&A breakdown, ideal answers, Home button | Protected |
| `/admin` | Admin panel — 3 tabs: Overview, Users, Interviews | Protected (admin only) |
| `/settings` | Account settings | Protected |

## Interview Session UI Features
- Phase progress bar (Opening → Technical → Behavioural → Situational → Closing)
- Color-coded phase badge (cyan/violet/amber/emerald/rose)
- **End Interview** button — shows confirmation modal, then generates evaluation + navigates to results
- **Home** button — always visible in header and intro screen
- Transcript sidebar with interviewer/candidate labels
- Fullscreen enforcement (3-strike system)

## Codegen

After changing `lib/api-spec/openapi.yaml`, run:
```bash
pnpm --filter @workspace/api-spec exec orval --config ./orval.config.ts
```
Then fix `lib/api-zod/src/index.ts` — remove the `export * from "./generated/types"` line (codegen re-adds it each time, causing duplicate export errors). Keep only `export * from "./generated/api"`.

Then rebuild libs:
```bash
pnpm run typecheck:libs
```

Generated files:
- `lib/api-client-react/src/generated/api.ts` — React Query hooks
- `lib/api-client-react/src/generated/api.schemas.ts` — TypeScript types
- `lib/api-zod/src/generated/api.ts` — Zod schemas

## Environment Secrets

- `SESSION_SECRET` — Express session secret
- `CLERK_PUBLISHABLE_KEY` — auto-managed by Replit Clerk integration
- `CLERK_SECRET_KEY` — auto-managed by Replit Clerk integration
- `DATABASE_URL` — auto-managed by Replit PostgreSQL
- `OPENAI_API_KEY` — auto-managed by Replit AI Integrations

## Development Notes

- The Clerk proxy (`/api/__clerk`) only runs in **production**. In dev, Clerk loads from CDN directly. The `proxyUrl` in `ClerkProvider` is conditionally set only when `import.meta.env.PROD === true`.
- The `@clerk/react` v6 API does **not** export `SignedIn`/`SignedOut` components. Route protection is done via a `ProtectedRoute` component using `useAuth().isSignedIn`.
- Theme: dark navy (`--background: 216 42% 8%`) with electric cyan accent (`--primary: 189 100% 50%`). Font: Plus Jakarta Sans + Spline Sans Mono.
- After codegen, always fix `lib/api-zod/src/index.ts` to remove the `types` re-export (it causes TS2308 duplicate export errors).
