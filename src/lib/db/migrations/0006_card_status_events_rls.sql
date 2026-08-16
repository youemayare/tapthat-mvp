-- Migration: Add RLS policies for card_status_events
--
-- Context:
--   card_status_events is an audit log table for card status changes and
--   profile switches. Previously, the application bypassed RLS by using the
--   global database client (db.insert instead of tx.insert) because this
--   INSERT policy was missing from the production database.
--
--   This migration adds the correct RLS policies:
--     - SELECT: users can only read audit events for cards they own.
--     - INSERT: users can only insert audit events for cards they own.
--     - UPDATE/DELETE: explicitly denied (audit events are immutable).
--
-- ⚠️  REVIEW BEFORE APPLYING TO PRODUCTION:
--   1. Run against a staging/test database first.
--   2. Verify that existing rows are still accessible to their owners.
--   3. Verify that cross-user SELECT is denied.
--   4. Verify that cross-user INSERT is denied (see tests in __tests__/security/).
--   5. Apply via a coordinated deploy — the application code in this branch
--      already uses tx.insert (RLS-scoped), so the code and migration must
--      be deployed together.
--
-- Requires: Supabase RLS enabled on the card_status_events table.

-- Enable RLS if not already enabled
ALTER TABLE public.card_status_events ENABLE ROW LEVEL SECURITY;

-- ─── SELECT Policy ────────────────────────────────────────────────────────────
-- Users can only read audit events for cards they own.
-- Admin/service role bypasses RLS and can see all rows.

DROP POLICY IF EXISTS "card_status_events_select_own" ON public.card_status_events;

CREATE POLICY "card_status_events_select_own"
  ON public.card_status_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.cards
      WHERE
        public.cards.id = public.card_status_events.card_id
        AND public.cards.user_id = auth.uid()
    )
  );

-- ─── INSERT Policy ────────────────────────────────────────────────────────────
-- Users can only insert audit events for cards they own.
-- The user_id in the inserted row must match the authenticated user.
-- This prevents User A from creating audit events attributed to User B's card.

DROP POLICY IF EXISTS "card_status_events_insert_own" ON public.card_status_events;

CREATE POLICY "card_status_events_insert_own"
  ON public.card_status_events
  FOR INSERT
  WITH CHECK (
    -- The user_id on the new row must be the authenticated user
    user_id = auth.uid()
    AND
    -- The card referenced must be owned by the authenticated user
    EXISTS (
      SELECT 1
      FROM public.cards
      WHERE
        public.cards.id = card_id
        AND public.cards.user_id = auth.uid()
    )
  );

-- ─── UPDATE/DELETE: explicitly deny ──────────────────────────────────────────
-- Audit events are immutable. No user (including the owner) may update or
-- delete them via application-role credentials.
-- Only the service role (Supabase service key) bypasses RLS and may modify rows.

DROP POLICY IF EXISTS "card_status_events_deny_update" ON public.card_status_events;
DROP POLICY IF EXISTS "card_status_events_deny_delete" ON public.card_status_events;

-- No UPDATE or DELETE policies created = these operations are denied by default
-- when RLS is enabled and no permissive policy exists.

-- ─── Verification queries (run after applying) ────────────────────────────────
-- 1. As user A: SELECT * FROM card_status_events should return only rows for A's cards.
-- 2. As user A: INSERT INTO card_status_events (card_id, ...) with B's card_id should be rejected.
-- 3. As user A: UPDATE / DELETE should be rejected (no policy).
-- 4. As service role: all operations should succeed (bypasses RLS).
