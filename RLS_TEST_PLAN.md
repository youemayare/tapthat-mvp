# RLS Test Plan

## Core Authorization Tests (Cross-User)
Using `User A` and `User B`:
- [ ] User A can read and update their own profile.
- [ ] User A cannot read User B's private (unpublished/archived) profile.
- [ ] User A cannot update User B's profile via direct API requests.
- [ ] User A cannot delete User B's profile.
- [ ] User A can read their own cards.
- [ ] User A cannot read User B's cards.
- [ ] User A cannot change User B's card status to revoked.
- [ ] User A cannot assign User B's profile to User A's card.
- [ ] User A can read their own connections and analytics.
- [ ] User A cannot read User B's connections and analytics.

## Public Access Tests
- [ ] Anonymous users can read published public profile fields via `/p/[slug]`.
- [ ] Anonymous users receive a 404/Not Found for unpublished profiles.
- [ ] Archived profiles resolve properly but do not redirect to an active profile.
- [ ] Tapping an active card (`/n/[uid]`) resolves to the correct profile and logs a tap event.
- [ ] Tapping a revoked/deactivated card does not expose profile data.

## System Workflow & Concurrency Tests
- [ ] **Card Claiming:** User A can claim an `unclaimed` card. The operation is atomic.
- [ ] **Concurrency:** If User A and User B attempt to claim the same card simultaneously, only one succeeds.
- [ ] **Tap Ingestion:** Anonymous tap events are correctly inserted into `tap_events` despite the anonymous context.
- [ ] **Profile Switching:** Changing the active profile on a card works correctly and logs a `card_status_events` row.

## Pooling and Session Leak Tests
- [ ] **Load Test:** Send simultaneous requests for User A and User B to the API. Verify that Drizzle transactions using `SET LOCAL` do not leak session identity, and User A never receives User B's data due to a reused pool connection.

## Migration & Rollback Tests
- [ ] Verify that enabling RLS and applying policies on staging does not break the existing fallback superuser queries.
- [ ] Validate that reverting the code to the previous commit restores full functionality without requiring a database rollback.
