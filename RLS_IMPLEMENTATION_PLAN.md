# RLS Implementation Plan

## Current Architecture
The application currently uses Drizzle ORM connecting via a privileged `DATABASE_URL` (the `postgres` role). This bypasses Row Level Security (RLS). All authorization logic is handled at the application level via `.where()` conditions in Drizzle queries, using the authenticated user ID fetched from `@supabase/ssr`.

## Verified Assumptions
- **Drizzle uses `DATABASE_URL`:** Yes, in `src/lib/db/index.ts`.
- **Bypasses RLS:** Yes, it uses a superuser connection.
- **Supabase Auth usage:** Used only for `supabase.auth.getUser()`.
- **Application-level ownership filters:** Yes, consistently applied across routes (e.g., `eq(profiles.userId, user.id)`).
- **Public URL routing:** `profiles.slug` and `cards.cardUid` are used for public profile views and tap events.
- **Multi-profile support:** Yes, `profiles.isDefault` and `profiles.label` exist.

## Recommended Target Architecture: Option A (RLS-Aware Drizzle Wrapper)
**PROCEED WITH FULL RLS-AWARE DRIZZLE.**
Since TapThat relies heavily on Drizzle for complex relationships, updates, and type-safety, keeping Drizzle as the single query engine is optimal. 
We will wrap user-scoped queries in a Drizzle transaction that sets the Postgres session variables (`request.jwt.claims`) and sets the role to `authenticated`. This establishes a trusted execution context within the transaction, relying on PostgreSQL's `SET LOCAL` to prevent leakage in a transaction-mode connection pooler.

## Phased Implementation

### Phase 1: Environment & Staging (No Code Changes)
1. Provision a staging database.
2. Ensure `.env.local` points to staging.
3. Migrate schema to staging.

### Phase 2: RLS Enabling & Policies (Database Layer)
1. Write raw SQL migrations to `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`.
2. Write policies for `profiles`, `cards`, `tap_events`, and `connections`.
3. Apply migrations to staging.

### Phase 3: Drizzle Wrapper Creation
1. Create a secure wrapper `withAuth(db, user, callback)` in `src/lib/db/auth-wrapper.ts`.
2. The wrapper will execute:
   ```typescript
   await db.transaction(async (tx) => {
     await tx.execute(sql`SELECT set_config('role', 'authenticated', true)`);
     await tx.execute(sql`SELECT set_config('request.jwt.claims', '${JSON.stringify({ sub: user.id })}', true)`);
     return callback(tx);
   });
   ```

### Phase 4: Route Refactoring
1. **Authenticated Routes:** Refactor dashboard reads, profile updates, and settings to use `withAuth`.
2. **Public Routes:** Create a `withAnon(db, callback)` for public profile reads (`/p/[slug]`) and tap logging (`/n/[uid]`).
3. **System Workflows:** Background jobs, atomic card claiming, and webhooks will continue using the raw `db` (superuser) or a specific `service_role`.

### Phase 5: Testing & QA
1. Run automated integration tests against the staging DB to ensure RLS doesn't break app-level logic.
2. Verify pooler safety (load test to ensure no cross-user session leak).

### Phase 6: Production Rollout
1. Run RLS migrations on production. (Safe because Drizzle currently uses superuser, so existing queries won't break immediately).
2. Deploy the refactored Next.js app that starts utilizing the `withAuth` wrapper.

## Exact Files Likely to Change
- `src/lib/db/index.ts` (Add wrappers)
- `src/lib/db/schema.ts` (No changes needed directly, but policies will be added via SQL)
- `src/app/api/profile/route.ts` (Refactor to use wrapper)
- `src/app/api/cards/[id]/route.ts`
- `src/app/api/connections/route.ts`
- `src/app/(dashboard)/claim/actions.ts` (System workflow, may stay privileged but with strict checks)
- All dashboard `page.tsx` files executing direct `db.select()`

## Rollback Plan
Since the database schema itself isn't structurally changing (only policies added), if the application code rollout fails, we can immediately revert the Vercel deployment to the previous commit. The previous commit uses the `postgres` role, which bypasses RLS and will continue to function normally.
