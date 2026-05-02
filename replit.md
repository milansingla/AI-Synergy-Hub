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

PostgreSQL via `DATABASE_URL`. Schema defined in `lib/db/src/schema.ts`:

- `users` — Clerk user IDs, email, role (student/admin)
- `job_descriptions` — raw JD text + AI-parsed fields (role, skills, experienceLevel)
- `interviews` — links user + JD, tracks status (in_progress/completed)
- `interview_messages` — per-message log (role: ai/user)
- `evaluations` — AI-scored evaluation per interview (overallScore, feedback, strengths, improvements, questionEvals)

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

## AI Prompts

Defined in `artifacts/api-server/src/lib/aiPrompts.ts`:

- `parseJD(text)` — Extract role, skills, experienceLevel from raw JD
- `generateQuestions(jd)` — Generate technical + behavioral questions for role
- `getNextQuestion(...)` — Get next question in conversation flow (returns `isComplete` when done)
- `evaluateInterview(...)` — Score all answers with detailed feedback per question

## Frontend Pages

| Route | Page | Auth |
|-------|------|------|
| `/` | Landing page | Public |
| `/sign-in` | Clerk sign-in | Public |
| `/sign-up` | Clerk sign-up | Public |
| `/dashboard` | Stats + recent interviews | Protected |
| `/jd/new` | Upload + parse JD, start interview | Protected |
| `/interviews` | List all interviews | Protected |
| `/interviews/:id` | Live chat interview session | Protected |
| `/interviews/:id/results` | Evaluation results + score | Protected |
| `/admin` | Admin panel (users + stats) | Protected (admin) |
| `/settings` | Account settings | Protected |

## Codegen

To regenerate API hooks after changing the OpenAPI spec:

```bash
pnpm --filter @workspace/api-spec exec orval --config ./orval.config.ts
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
