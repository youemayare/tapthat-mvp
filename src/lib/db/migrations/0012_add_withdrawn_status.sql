-- Migration: Add 'withdrawn' to ce_status_check constraint
-- Purpose: Distinguish between 'rejected' (recipient dismissed the request)
--          and 'withdrawn' (sender voluntarily erased their own data via revoke access link).

-- Drop the old constraint
ALTER TABLE contact_exchanges
  DROP CONSTRAINT ce_status_check;
--> statement-breakpoint

-- Recreate it with 'withdrawn' included
ALTER TABLE contact_exchanges
  ADD CONSTRAINT ce_status_check
  CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked', 'withdrawn'));
--> statement-breakpoint
