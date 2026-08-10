# RLS Decision Report

## Options Analyzed

### Option A: RLS-aware Drizzle wrapper
Execute user-scoped queries inside a Drizzle transaction setting the `authenticated` role and JWT claims.
- **Security:** High. Enforces RLS cleanly.
- **Complexity:** Medium. Requires careful transaction management to avoid pooler session leaks (`SET LOCAL` is mandatory).
- **Performance:** Slightly lower due to the overhead of starting a transaction for every read.
- **Migration Risk:** Low. Drizzle remains the primary driver.

### Option B: Supabase JS for user-scoped queries
Use `@supabase/supabase-js` for reads and writes, replacing Drizzle.
- **Security:** High.
- **Complexity:** High. Requires rewriting large portions of the API and dashboard data fetching. Loss of Drizzle's tight schema type-safety and complex relational join capabilities without creating heavily typed Views.
- **Performance:** Good.
- **Migration Risk:** High.

### Option C: Hybrid approach
Use Supabase JS for basic CRUD and Drizzle for complex system workflows.
- **Security:** High.
- **Complexity:** High. Fragments the data-access layer into two completely different paradigms. Hard to maintain.

### Option D: Trusted Drizzle only (Status Quo)
Keep the current privileged Drizzle connection and application checks.
- **Security:** Medium/Low. Highly susceptible to developer error (missing `.where()` clause).
- **Complexity:** Low (Status Quo).
- **Long-term Suitability:** Poor for a scaling SaaS.

## Recommendation
**PROCEED WITH FULL RLS-AWARE DRIZZLE (Option A).**

### Reasons for Rejecting Alternatives
- **Reject Option B & C:** TapThat heavily leverages Drizzle for complex analytics, relational updates, and type safety. Ripping it out for Supabase JS would severely slow down development and fragment the codebase.
- **Reject Option D:** As the team and product scale, relying purely on application-level `eq(userId, user.id)` checks is a significant liability. RLS acts as a critical defense-in-depth mechanism.

By using a secure transaction wrapper (`withAuth`), we retain all of Drizzle's benefits while integrating seamlessly with PostgreSQL's Row-Level Security, satisfying the strict tenant-isolation requirements of the platform.
