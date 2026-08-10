# RLS Policy Plan

## Tables Requiring RLS
- `users`
- `profiles`
- `cards`
- `card_status_events`
- `tap_events`
- `connections`

## Intended Policies by Operation

### 1. `profiles`
- **SELECT (Public/Anon):** 
  - `USING (is_published = true AND archived_at IS NULL)`
  - Allows public resolution of `slug` to profile data.
- **SELECT (Authenticated):** 
  - `USING (user_id = auth.uid() OR (is_published = true AND archived_at IS NULL))`
- **INSERT / UPDATE / DELETE (Authenticated):**
  - `USING (user_id = auth.uid())`
  - `WITH CHECK (user_id = auth.uid())`
  - For Delete: App-level logic enforces `is_default = false`.

### 2. `cards`
- **SELECT (Public/Anon):**
  - `USING (status = 'active')` 
  - (Used during `/n/[uid]` resolution to find the associated profile).
- **SELECT (Authenticated):**
  - `USING (user_id = auth.uid() OR status = 'active')`
- **UPDATE (Authenticated):**
  - `USING (user_id = auth.uid())`
  - System operations (like claiming an `unclaimed` card) will run via a privileged server action, not via user RLS context.

### 3. `tap_events`
- **INSERT (Public/Anon):**
  - `WITH CHECK (true)` (Anyone tapping a card can generate an event).
- **SELECT (Authenticated):**
  - `USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))`
  - Allows users to see analytics for their own profiles.

### 4. `connections`
- **SELECT (Authenticated):**
  - `USING (viewer_user_id = auth.uid())`
- **INSERT (Authenticated):**
  - `WITH CHECK (viewer_user_id = auth.uid())`
- **DELETE (Authenticated):**
  - `USING (viewer_user_id = auth.uid())`

### 5. `users`
- **SELECT (Authenticated):**
  - `USING (id = auth.uid())`

## System-Operation Policies
System operations like `claimCardAction` (which transitions a card from `unclaimed` and `userId IS NULL` to a specific user) will be executed using the Drizzle `postgres` / `service_role` connection to bypass RLS. This ensures atomic claims without needing to grant unauthenticated users UPDATE privileges on cards.

## Public-Field Exposure Concerns
- Public profile reads (`SELECT` on `profiles`) expose all columns if the row matches the policy.
- **Mitigation:** The application MUST continue to select only safe fields in the query (e.g., omitting `phone` if hidden, though presently all fields in `profiles` seem intended for public consumption when published). A dedicated Postgres View could be created if column-level security becomes necessary.
