-- ============================================================
-- Synorlab — Supabase RLS Policies & Functions
-- Run AFTER schema.sql
-- ============================================================

-- ── Enable RLS ────────────────────────────────────────────────────────────

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_descriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_codes ENABLE ROW LEVEL SECURITY;

-- ── Helper: current user's role ───────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE AS $$
  SELECT role::text FROM users WHERE id = (auth.jwt() ->> 'sub')
$$;

-- ── Function: upsert user with invite check ───────────────────────────────

CREATE OR REPLACE FUNCTION upsert_user_profile(p_user_id TEXT, p_email TEXT)
RETURNS SETOF users
LANGUAGE plpgsql
SECURITY DEFINER AS $$
DECLARE
  v_role TEXT := 'student';
  v_invite_id BIGINT;
BEGIN
  SELECT id, role::text INTO v_invite_id, v_role
  FROM invites
  WHERE email = LOWER(TRIM(p_email)) AND used = FALSE
  LIMIT 1;

  IF v_invite_id IS NULL THEN
    v_role := 'student';
  END IF;

  INSERT INTO users (id, email, role)
  VALUES (p_user_id, LOWER(TRIM(p_email)), v_role::user_role)
  ON CONFLICT (id) DO NOTHING;

  IF v_invite_id IS NOT NULL THEN
    UPDATE invites SET used = TRUE WHERE id = v_invite_id;
  END IF;

  RETURN QUERY SELECT * FROM users WHERE id = p_user_id;
END;
$$;

-- ── Function: redeem access code ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION redeem_access_code(p_code TEXT, p_user_id TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER AS $$
DECLARE
  v_role TEXT;
  v_id BIGINT;
BEGIN
  SELECT id, role::text INTO v_id, v_role
  FROM access_codes
  WHERE code = UPPER(TRIM(p_code))
    AND active = TRUE
    AND used_count < max_uses;

  IF v_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired code';
  END IF;

  UPDATE users SET role = v_role::user_role WHERE id = p_user_id;
  UPDATE access_codes SET used_count = used_count + 1 WHERE id = v_id;

  RETURN v_role;
END;
$$;

-- ── Function: admin update user role ──────────────────────────────────────

CREATE OR REPLACE FUNCTION admin_update_user_role(p_target_user_id TEXT, p_role TEXT)
RETURNS SETOF users
LANGUAGE plpgsql
SECURITY DEFINER AS $$
BEGIN
  IF get_my_role() != 'admin' THEN
    RAISE EXCEPTION 'Forbidden: admin role required';
  END IF;
  UPDATE users SET role = p_role::user_role WHERE id = p_target_user_id;
  RETURN QUERY SELECT * FROM users WHERE id = p_target_user_id;
END;
$$;

-- ── Function: admin delete user ───────────────────────────────────────────

CREATE OR REPLACE FUNCTION admin_delete_user(p_target_user_id TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER AS $$
BEGIN
  IF get_my_role() != 'admin' THEN
    RAISE EXCEPTION 'Forbidden: admin role required';
  END IF;
  DELETE FROM users WHERE id = p_target_user_id;
END;
$$;

-- ── Function: admin create invite ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION admin_create_invite(p_email TEXT, p_role TEXT)
RETURNS SETOF invites
LANGUAGE plpgsql
SECURITY DEFINER AS $$
DECLARE
  v_token TEXT;
BEGIN
  IF get_my_role() != 'admin' THEN
    RAISE EXCEPTION 'Forbidden: admin role required';
  END IF;
  v_token := encode(gen_random_bytes(16), 'hex');
  INSERT INTO invites (email, role, token)
  VALUES (LOWER(TRIM(p_email)), p_role::user_role, v_token)
  ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role, used = FALSE, token = EXCLUDED.token;
  RETURN QUERY SELECT * FROM invites WHERE token = v_token;
END;
$$;

-- ── Function: admin delete invite ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION admin_delete_invite(p_id BIGINT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER AS $$
BEGIN
  IF get_my_role() != 'admin' THEN RAISE EXCEPTION 'Forbidden'; END IF;
  DELETE FROM invites WHERE id = p_id;
END;
$$;

-- ── Function: admin create access code ────────────────────────────────────

CREATE OR REPLACE FUNCTION admin_create_access_code(p_role TEXT, p_code TEXT, p_max_uses INT)
RETURNS SETOF access_codes
LANGUAGE plpgsql
SECURITY DEFINER AS $$
BEGIN
  IF get_my_role() != 'admin' THEN RAISE EXCEPTION 'Forbidden'; END IF;
  INSERT INTO access_codes (code, role, max_uses)
  VALUES (UPPER(TRIM(p_code)), p_role::user_role, p_max_uses);
  RETURN QUERY SELECT * FROM access_codes WHERE code = UPPER(TRIM(p_code));
END;
$$;

-- ── Function: admin delete access code ────────────────────────────────────

CREATE OR REPLACE FUNCTION admin_delete_access_code(p_id BIGINT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER AS $$
BEGIN
  IF get_my_role() != 'admin' THEN RAISE EXCEPTION 'Forbidden'; END IF;
  DELETE FROM access_codes WHERE id = p_id;
END;
$$;

-- ── Function: admin bulk invite ───────────────────────────────────────────

CREATE OR REPLACE FUNCTION admin_bulk_invite(p_invites JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER AS $$
DECLARE
  v_entry JSONB;
  v_email TEXT;
  v_role TEXT;
  v_token TEXT;
  v_created INT := 0;
  v_skipped INT := 0;
BEGIN
  IF get_my_role() != 'admin' THEN RAISE EXCEPTION 'Forbidden'; END IF;

  FOR v_entry IN SELECT * FROM jsonb_array_elements(p_invites) LOOP
    v_email := LOWER(TRIM(v_entry->>'email'));
    v_role  := LOWER(TRIM(v_entry->>'role'));
    v_token := encode(gen_random_bytes(16), 'hex');
    BEGIN
      INSERT INTO invites (email, role, token)
      VALUES (v_email, v_role::user_role, v_token)
      ON CONFLICT DO NOTHING;
      IF FOUND THEN v_created := v_created + 1;
      ELSE v_skipped := v_skipped + 1;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      v_skipped := v_skipped + 1;
    END;
  END LOOP;

  RETURN jsonb_build_object('created', v_created, 'skipped', v_skipped, 'errors', '[]'::jsonb);
END;
$$;

-- ── Function: admin delete interview ──────────────────────────────────────

CREATE OR REPLACE FUNCTION admin_delete_interview(p_id BIGINT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER AS $$
BEGIN
  IF get_my_role() != 'admin' THEN RAISE EXCEPTION 'Forbidden'; END IF;
  DELETE FROM interviews WHERE id = p_id;
END;
$$;

-- ── RLS Policies — users ──────────────────────────────────────────────────

CREATE POLICY "users_select" ON users FOR SELECT
  USING (
    id = (auth.jwt() ->> 'sub')
    OR get_my_role() = 'admin'
    OR get_my_role() = 'facility'
  );

CREATE POLICY "users_insert" ON users FOR INSERT
  WITH CHECK (id = (auth.jwt() ->> 'sub'));

CREATE POLICY "users_update" ON users FOR UPDATE
  USING (id = (auth.jwt() ->> 'sub') OR get_my_role() = 'admin');

CREATE POLICY "users_delete" ON users FOR DELETE
  USING (get_my_role() = 'admin');

-- ── RLS Policies — job_descriptions ──────────────────────────────────────

CREATE POLICY "jd_select" ON job_descriptions FOR SELECT
  USING (user_id = (auth.jwt() ->> 'sub') OR get_my_role() = 'admin');

CREATE POLICY "jd_insert" ON job_descriptions FOR INSERT
  WITH CHECK (user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "jd_update" ON job_descriptions FOR UPDATE
  USING (user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "jd_delete" ON job_descriptions FOR DELETE
  USING (user_id = (auth.jwt() ->> 'sub') OR get_my_role() = 'admin');

-- ── RLS Policies — interviews ─────────────────────────────────────────────

CREATE POLICY "interviews_select" ON interviews FOR SELECT
  USING (
    user_id = (auth.jwt() ->> 'sub')
    OR get_my_role() = 'admin'
    OR (
      get_my_role() = 'facility'
      AND EXISTS (SELECT 1 FROM users WHERE id = interviews.user_id AND role = 'student')
    )
  );

CREATE POLICY "interviews_insert" ON interviews FOR INSERT
  WITH CHECK (user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "interviews_update" ON interviews FOR UPDATE
  USING (user_id = (auth.jwt() ->> 'sub') OR get_my_role() = 'admin');

CREATE POLICY "interviews_delete" ON interviews FOR DELETE
  USING (get_my_role() = 'admin');

-- ── RLS Policies — interview_messages ────────────────────────────────────

CREATE POLICY "messages_select" ON interview_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM interviews i WHERE i.id = interview_id AND (
        i.user_id = (auth.jwt() ->> 'sub')
        OR get_my_role() = 'admin'
        OR (get_my_role() = 'facility' AND EXISTS (SELECT 1 FROM users WHERE id = i.user_id AND role = 'student'))
      )
    )
  );

CREATE POLICY "messages_insert" ON interview_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM interviews i
      WHERE i.id = interview_id AND i.user_id = (auth.jwt() ->> 'sub')
    )
  );

CREATE POLICY "messages_delete" ON interview_messages FOR DELETE
  USING (get_my_role() = 'admin');

-- ── RLS Policies — evaluations ────────────────────────────────────────────

CREATE POLICY "evals_select" ON evaluations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM interviews i WHERE i.id = interview_id AND (
        i.user_id = (auth.jwt() ->> 'sub') OR get_my_role() = 'admin'
      )
    )
  );

CREATE POLICY "evals_insert" ON evaluations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM interviews i
      WHERE i.id = interview_id AND i.user_id = (auth.jwt() ->> 'sub')
    )
  );

CREATE POLICY "evals_delete" ON evaluations FOR DELETE
  USING (get_my_role() = 'admin');

-- ── RLS Policies — invites ────────────────────────────────────────────────

CREATE POLICY "invites_admin" ON invites FOR ALL
  USING (get_my_role() = 'admin');

-- ── RLS Policies — access_codes ───────────────────────────────────────────

CREATE POLICY "codes_select" ON access_codes FOR SELECT
  USING (get_my_role() = 'admin' OR (active = TRUE AND (auth.jwt() ->> 'sub') IS NOT NULL));

CREATE POLICY "codes_insert" ON access_codes FOR INSERT
  WITH CHECK (get_my_role() = 'admin');

CREATE POLICY "codes_update" ON access_codes FOR UPDATE
  USING (get_my_role() = 'admin');

CREATE POLICY "codes_delete" ON access_codes FOR DELETE
  USING (get_my_role() = 'admin');
