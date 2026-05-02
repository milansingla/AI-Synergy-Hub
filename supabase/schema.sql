-- ============================================================
-- Synorlab — Supabase Schema
-- Run this in Supabase SQL Editor (Database → SQL Editor)
-- ============================================================

-- SETUP NOTES:
-- 1. Create a Supabase project at https://app.supabase.com
-- 2. Run this file in the SQL Editor
-- 3. Run policies.sql next
-- 4. In Clerk dashboard → JWT Templates → New template named "supabase":
--    {
--      "sub": "{{user.id}}",
--      "aud": "authenticated",
--      "role": "authenticated"
--    }
-- 5. In Supabase dashboard → Authentication → Sign In with → Add "Clerk"
--    Enter your Clerk domain (e.g. harmless-bee-42.clerk.accounts.dev)
--    This lets Supabase verify Clerk JWTs via JWKS
-- 6. Set env vars in your app / Netlify:
--    VITE_SUPABASE_URL=https://xxxx.supabase.co
--    VITE_SUPABASE_ANON_KEY=eyJ...
--    VITE_OPENAI_API_KEY=sk-...
--    VITE_CLERK_PUBLISHABLE_KEY=pk_...

-- ── Enums ─────────────────────────────────────────────────────────────────

CREATE TYPE user_role AS ENUM ('student', 'admin', 'facility');
CREATE TYPE interview_status AS ENUM ('in_progress', 'completed');

-- ── Tables ────────────────────────────────────────────────────────────────

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'student',
  full_name TEXT,
  university TEXT,
  department TEXT,
  year_of_study TEXT,
  profile_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE job_descriptions (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  company TEXT NOT NULL DEFAULT '',
  skills JSONB NOT NULL DEFAULT '[]',
  experience_level TEXT NOT NULL,
  responsibilities JSONB NOT NULL DEFAULT '[]',
  raw_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE interviews (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  jd_id BIGINT NOT NULL REFERENCES job_descriptions(id) ON DELETE CASCADE,
  status interview_status NOT NULL DEFAULT 'in_progress',
  question_set JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE interview_messages (
  id BIGSERIAL PRIMARY KEY,
  interview_id BIGINT NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('ai', 'user')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE evaluations (
  id BIGSERIAL PRIMARY KEY,
  interview_id BIGINT NOT NULL UNIQUE REFERENCES interviews(id) ON DELETE CASCADE,
  overall_score INTEGER NOT NULL,
  hiring_verdict TEXT,
  feedback TEXT NOT NULL,
  strengths JSONB NOT NULL DEFAULT '[]',
  improvements JSONB NOT NULL DEFAULT '[]',
  criteria_scores JSONB NOT NULL DEFAULT '[]',
  question_evals JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE invites (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (email)
);

CREATE TABLE access_codes (
  id BIGSERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'student',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  max_uses INTEGER NOT NULL DEFAULT 100,
  used_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ────────────────────────────────────────────────────────────────

CREATE INDEX idx_jd_user_id ON job_descriptions(user_id);
CREATE INDEX idx_interviews_user_id ON interviews(user_id);
CREATE INDEX idx_interviews_jd_id ON interviews(jd_id);
CREATE INDEX idx_messages_interview_id ON interview_messages(interview_id);
CREATE INDEX idx_evaluations_interview_id ON evaluations(interview_id);
CREATE INDEX idx_invites_email ON invites(email);
CREATE INDEX idx_access_codes_code ON access_codes(code);
