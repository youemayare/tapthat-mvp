# Analytics User-Facing Simplification Report

## Files Changed
- `src/app/(dashboard)/dashboard/analytics/page.tsx`
- `src/components/analytics/analytics-charts.tsx`

## User-Facing Labels and Copy Changed
- **Total Taps** ➔ **Profile Views**
  - Subtitle updated from "All time interactions" to "Every time your profile was opened."
- **Unique Visitors** ➔ **Estimated Unique Visitors**
  - Subtitle updated from "Distinct devices" to "An estimate of distinct visitors based on anonymous browser sessions."
- **Profile Saves** (Retained)
  - Subtitle updated from "Saved to Anoya accounts" to "Times your profile was saved to another Anoya user’s Connections."
- **Daily Tap Activity** chart ➔ **Profile Views Over Time**
  - Time series data keys renamed to "Profile Views" and "Estimated Unique Visitors".

## Metrics Removed from the User-Facing Dashboard
The following metrics were removed from the user-facing analytics UI:
- **Returning Visitors** (top-level stat card removed)
- **Connections Saved** (top-level stat card removed)
- **Top Locations** (bar chart removed)
- **Devices Breakdown** (donut chart removed)
- **Browsers Breakdown** (donut chart removed)

## Where "Connections Saved" Now Appears
The "Connections Saved" metric and feature were removed only from the Analytics dashboard. The underlying data and functionality remain intact, and users can continue to view and manage their outbound saved profiles on the dedicated **My Connections** page (`/dashboard/connections`).

## Confirmation of Raw Collection
Raw data collection for device types, browsers, operating systems, and locations was **not** removed. The underlying database schema, tracking events, cookies, and backend ingestion logic remain completely untouched. The raw data queries are still being executed in the backend (within `page.tsx`), meaning internal/admin/debugging functionality relying on these queries will continue to work normally, but they are no longer passed down to or rendered by the UI charts.

## Ambiguities and Limitations in the Data Model
1. **Profile Saves vs. Contact Saves**: The current "Profile Saves" metric exclusively tracks inbound saves where another authenticated Anoya user saves the profile to their Anoya Connections list. It does not currently track or reflect "Contact Saves" (i.e., when a visitor downloads the vCard to save directly to their phone's address book).
2. **Estimated Unique Visitors**: This metric relies on anonymous session cookies (e.g., `_tap_sid`). As a result, it is an estimate and not definitively unique. Cross-device visits by the same person, or a single person clearing their cookies, will artificially inflate this number. It cannot guarantee confirmed individual visitors.
