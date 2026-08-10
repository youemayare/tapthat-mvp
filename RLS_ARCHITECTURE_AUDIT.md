# RLS Architecture Audit

## 1. Current Database Clients

| Client | File | Library | Runtime | Credential | Database role | RLS effective? | Usage |
|---|---|---|---|---|---|---|---|
| Drizzle | `src/lib/db/index.ts` | `drizzle-orm` | Node | `DATABASE_URL` | `postgres` | No | All database reads and writes. |
| Supabase Auth | `src/lib/supabase/server.ts` | `@supabase/ssr` | Node | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` | No | Used exclusively for session management (`getUser()`). |
| Supabase Service | `src/lib/supabase/server.ts` | `@supabase/ssr` | Node | `SUPABASE_SERVICE_ROLE_KEY` | `service_role` | No | Trusted server contexts (if used). |

## 2. Current Roles
- **Drizzle Role**: Connects as `postgres` using a connection pool string on port `6543`. This role is a superuser (or has `bypassrls`), meaning it bypasses Row-Level Security entirely.
- **Supabase Auth Role**: Fetches session info but does not run application queries.

## 3. Current RLS State
- **RLS Enabled?**: Blocked from live verification (requires staging environment). However, because Drizzle connects via `postgres`, any existing RLS policies are currently being bypassed.
- **Drizzle Access Paths**: All data access flows through Drizzle.
- **Supabase Access Paths**: Supabase JS is not used for data querying in the application, only for Auth.

## 4. Application Authorization Paths
- **Verification Strategy**: The app relies strictly on application-level checks. Example in `src/app/api/profile/route.ts`:
  ```typescript
  const { data: { user } } = await supabase.auth.getUser();
  await db.update(profiles).where(and(eq(profiles.id, body.profileId), eq(profiles.userId, user.id)))
  ```
- **Claim Action**: In `claim/actions.ts`, the code relies on `where: and(eq(cards.cardUid, sanitizedUid), eq(cards.status, 'unclaimed'), isNull(cards.userId))` to prevent overtaking an already claimed card.

## 5. Security Gaps
- **Privileged Connection Leak Risk**: If a developer forgets an `.where(eq(userId, user.id))` clause in a new query, the query will expose or modify all users' data, because the database enforces no boundaries on the `postgres` role.
- **No Defense-in-Depth**: The application has no secondary database-layer protection against logic bugs in the API routes.

## 6. Unknowns and Blocked Checks
- **Live Database State**: Cannot safely inspect whether RLS is actually enabled on the production tables or if policies exist. This requires a dedicated staging environment.
- **Transaction Pooling**: Port 6543 typically means Supabase's PgBouncer in transaction mode. This requires verifying that `SET LOCAL` is used correctly to avoid session state leaks between requests in the connection pool.
