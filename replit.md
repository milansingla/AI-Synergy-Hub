# Synorlab Interviewer

A B2B SaaS platform for universities where students upload job descriptions and practice AI-powered mock interviews. Fully static — runs on Netlify, GitHub Pages, or Cloudflare Pages with no backend server.

## Architecture

**Monorepo** managed by pnpm workspaces.

### Services (Replit dev environment)

| Artifact | Kind | Path | Port |
|----------|------|------|------|
| `artifacts/synorlab` | React+Vite web app | `/` | 25111 |
| `artifacts/api-server` | Legacy Express API (kept for reference) | `/api` | 8080 |
| `artifacts/mockup-sandbox` | Canvas mockup server | `/__mockup` | 8081 |

The `api-server` is **no longer used by the frontend**. The synorlab app talks directly to Supabase and OpenAI from the browser.

### Frontend-Only Architecture (production)

```
React/Vite (static)
  ├── Clerk       — authentication (JWT tokens)
  ├── Supabase    — PostgreSQL database via REST/JS client
  │     └── RLS policies enforce per-user data isolation
  └── OpenAI      — AI calls from the browser (gpt-4o)
        ├── parseJD()          — parse job descriptions
        ├── generateQuestions() — generate interview questions
        ├── getNextQuestion()   — manage interview flow
        └── evaluateInterview() — score the interview
```

## Tech Stack

- **Frontend**: React 19, Vite, Wouter (routing), TanStack Query, shadcn/ui, Tailwind CSS v4
- **Auth**: Clerk (`@clerk/react` v6) — JWT template "supabase" required
- **Database**: Supabase (PostgreSQL) — RLS + SECURITY DEFINER functions
- **AI**: OpenAI gpt-4o via browser SDK (`dangerouslyAllowBrowser: true`)
- **Deployment**: Netlify / static hosting

## Supabase Setup (required before deployment)

1. Create a Supabase project at https://app.supabase.com
2. Run `supabase/schema.sql` in the SQL Editor
3. Run `supabase/policies.sql` in the SQL Editor
4. In Supabase → Authentication → Sign In with → Add "Clerk", enter your Clerk domain
5. In Clerk Dashboard → JWT Templates → Create template named **"supabase"**:
   ```json
   {
     "sub": "{{user.id}}",
     "aud": "authenticated",
     "role": "authenticated"
   }
   ```
6. Set environment variables (in Netlify or `.env.local`):
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   VITE_OPENAI_API_KEY=sk-...
   VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
   ```

## Key Source Files

| File | Purpose |
|------|---------|
| `artifacts/synorlab/src/lib/supabase.ts` | Supabase client factory (uses Clerk JWT) |
| `artifacts/synorlab/src/lib/ai.ts` | All OpenAI functions (browser-safe) |
| `artifacts/synorlab/src/hooks/api.ts` | All TanStack Query hooks (replaces old generated hooks) |
| `supabase/schema.sql` | Full Supabase schema (tables, indexes, enums) |
| `supabase/policies.sql` | RLS policies + SECURITY DEFINER functions |
| `netlify.toml` | Netlify deployment config |
| `artifacts/synorlab/vite.static.config.ts` | Static build config (no PORT/BASE_PATH required) |

## Database Schema (Supabase)

- `users` — Clerk user IDs, email, role (student/facility/admin), profile fields
- `job_descriptions` — role, company, skills (jsonb), experienceLevel, responsibilities (jsonb), rawText
- `interviews` — links user + JD, status, `question_set` (jsonb — stored to avoid regenerating)
- `interview_messages` — per-message log (role: ai/user)
- `evaluations` — overallScore, hiringVerdict, feedback, criteriaScores (jsonb), questionEvals (jsonb)
- `invites` — email + role + token; checked at first sign-up to auto-assign role
- `access_codes` — redeemable codes with role + maxUses

## SECURITY DEFINER Functions (in policies.sql)

These run with elevated privileges for sensitive operations:
- `upsert_user_profile(user_id, email)` — creates user with invite check
- `redeem_access_code(code, user_id)` — validates + redeems code, updates role
- `admin_update_user_role(target_id, role)` — admin-only role change
- `admin_delete_user(target_id)` — admin-only user deletion
- `admin_create_invite(email, role)` — admin-only invite creation
- `admin_delete_invite(id)` — admin-only invite deletion
- `admin_create_access_code(role, code, max_uses)` — admin-only
- `admin_delete_access_code(id)` — admin-only
- `admin_bulk_invite(invites jsonb)` — CSV bulk invite upload
- `admin_delete_interview(id)` — admin-only interview deletion

## Static Build

```bash
cd artifacts/synorlab
pnpm run build:static   # uses vite.static.config.ts — no PORT/BASE_PATH required
```

Output: `artifacts/synorlab/dist/public/`

## Dev Build (Replit)

The Replit dev server uses `vite.config.ts` which requires `PORT` and `BASE_PATH` injected by the workflow runner.

## AI Interview System

Defined in `artifacts/synorlab/src/lib/ai.ts`:

### Question Generation — Structured Phases
`generateQuestions(jd: JDContext)` returns a `QuestionSet` stored in the `interviews.question_set` column:
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
| `/interviews` | List all interviews | Protected |
| `/interviews/:id` | Live voice interview session | Protected |
| `/interviews/:id/results` | Evaluation results | Protected |
| `/admin` | Admin panel (users, interviews, invites, codes) | Admin only |
| `/facility` | Facility overview + student list | Facility only |
| `/settings` | Account settings + code redemption | Protected |
| `/profile-setup` | First-time profile completion | Protected |

## Environment Variables

### Replit dev (existing)
- `SESSION_SECRET` — legacy Express session (not used by frontend)
- `DATABASE_URL` — legacy PostgreSQL (not used by frontend)

### New (Netlify / Supabase deployment)
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anon/public key (safe to expose)
- `VITE_OPENAI_API_KEY` — OpenAI API key (browser-exposed, restrict by domain in OpenAI dashboard)
- `VITE_CLERK_PUBLISHABLE_KEY` — Clerk publishable key

## Notes

- The Clerk `proxyUrl` (`/api/__clerk`) has been removed — not needed for static hosting
- `question_set` is stored in the `interviews` table on creation so `respond` calls don't re-generate it
- The anon key is safe to expose (Supabase RLS enforces access control)
- Restrict your OpenAI API key to specific domains in the OpenAI dashboard to prevent abuse
- The `@clerk/react` v6 API does not export `SignedIn`/`SignedOut` — route protection uses `ProtectedRoute` with `useAuth().isSignedIn`
