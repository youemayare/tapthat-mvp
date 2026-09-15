CREATE TABLE "contact_exchanges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipient_user_id" uuid NOT NULL,
	"recipient_profile_id" uuid NOT NULL,
	"source_type" text DEFAULT 'manual' NOT NULL,
	"source_user_id" uuid,
	"source_profile_id" uuid,
	"source_channel" text DEFAULT 'unknown' NOT NULL,
	"name" text,
	"email" text,
	"phone" text,
	"job_title" text,
	"company" text,
	"message" text,
	"email_hash" text,
	"phone_hash" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"recipient_note" text,
	"recipient_note_updated_at" timestamp with time zone,
	"consent_version" text,
	"consented_at" timestamp with time zone,
	"erasure_token_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contact_exchanges_erasure_token_hash_unique" UNIQUE("erasure_token_hash")
);
--> statement-breakpoint
ALTER TABLE "contact_exchanges" ADD CONSTRAINT "contact_exchanges_recipient_user_id_users_id_fk" FOREIGN KEY ("recipient_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_exchanges" ADD CONSTRAINT "contact_exchanges_recipient_profile_id_profiles_id_fk" FOREIGN KEY ("recipient_profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_exchanges" ADD CONSTRAINT "contact_exchanges_source_user_id_users_id_fk" FOREIGN KEY ("source_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_exchanges" ADD CONSTRAINT "contact_exchanges_source_profile_id_profiles_id_fk" FOREIGN KEY ("source_profile_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_ce_recipient" ON "contact_exchanges" USING btree ("recipient_user_id","status");--> statement-breakpoint
ALTER TABLE "connections" ADD CONSTRAINT "uq_connections_viewer_profile" UNIQUE("viewer_user_id","profile_id");
--> statement-breakpoint

-- 1. Database Constraints (Full Defense in Depth)

-- source_type enumeration
ALTER TABLE contact_exchanges
  ADD CONSTRAINT ce_source_type_check
  CHECK (source_type IN ('anoya_profile', 'manual'));
--> statement-breakpoint

-- status enumeration
ALTER TABLE contact_exchanges
  ADD CONSTRAINT ce_status_check
  CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked'));
--> statement-breakpoint

-- source_channel enumeration
ALTER TABLE contact_exchanges
  ADD CONSTRAINT ce_source_channel_check
  CHECK (source_channel IN ('nfc', 'qr', 'direct_link', 'unknown'));
--> statement-breakpoint

-- Shape integrity: anoya_profile exchanges must have source ids; manual must not
ALTER TABLE contact_exchanges
  ADD CONSTRAINT ce_source_shape_check
  CHECK (
    (source_type = 'anoya_profile'
      AND source_user_id IS NOT NULL
      AND source_profile_id IS NOT NULL
      AND name IS NULL AND email IS NULL AND phone IS NULL)
    OR
    (source_type = 'manual'
      AND source_user_id IS NULL
      AND source_profile_id IS NULL)
  );
--> statement-breakpoint

-- Field length constraints
ALTER TABLE contact_exchanges
  ADD CONSTRAINT ce_name_length    CHECK (name IS NULL OR char_length(name) <= 100),
  ADD CONSTRAINT ce_email_length   CHECK (email IS NULL OR char_length(email) <= 254),
  ADD CONSTRAINT ce_phone_length   CHECK (phone IS NULL OR char_length(phone) <= 32),
  ADD CONSTRAINT ce_job_title_length CHECK (job_title IS NULL OR char_length(job_title) <= 100),
  ADD CONSTRAINT ce_company_length CHECK (company IS NULL OR char_length(company) <= 100),
  ADD CONSTRAINT ce_message_length CHECK (message IS NULL OR char_length(message) <= 500),
  ADD CONSTRAINT ce_recipient_note_length
    CHECK (recipient_note IS NULL OR char_length(recipient_note) <= 2000);
--> statement-breakpoint

-- 2. Triggers (Cross-Table Consistency)

-- Trigger 1: recipient_profile_id must belong to recipient_user_id
CREATE OR REPLACE FUNCTION check_exchange_recipient_consistency()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = NEW.recipient_profile_id
      AND user_id = NEW.recipient_user_id
  ) THEN
    RAISE EXCEPTION 'recipient_profile_id does not belong to recipient_user_id';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint

CREATE TRIGGER trg_check_exchange_recipient
  BEFORE INSERT OR UPDATE ON contact_exchanges
  FOR EACH ROW EXECUTE FUNCTION check_exchange_recipient_consistency();
--> statement-breakpoint

-- Trigger 2: source_profile_id must belong to source_user_id (for anoya_profile type)
CREATE OR REPLACE FUNCTION check_exchange_source_consistency()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.source_type = 'anoya_profile' AND NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = NEW.source_profile_id
      AND user_id = NEW.source_user_id
  ) THEN
    RAISE EXCEPTION 'source_profile_id does not belong to source_user_id';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint

CREATE TRIGGER trg_check_exchange_source
  BEFORE INSERT OR UPDATE ON contact_exchanges
  FOR EACH ROW EXECUTE FUNCTION check_exchange_source_consistency();
--> statement-breakpoint

-- 3. Indexes

CREATE INDEX idx_ce_source_user      ON contact_exchanges(source_user_id)
  WHERE source_user_id IS NOT NULL;
--> statement-breakpoint

CREATE INDEX idx_ce_email_hash       ON contact_exchanges(recipient_user_id, email_hash)
  WHERE email_hash IS NOT NULL;
--> statement-breakpoint

CREATE INDEX idx_ce_phone_hash       ON contact_exchanges(recipient_user_id, phone_hash)
  WHERE phone_hash IS NOT NULL;
--> statement-breakpoint

-- One pending/accepted exchange per logged-in user pair
CREATE UNIQUE INDEX uq_ce_anoya_pair
  ON contact_exchanges(recipient_user_id, source_user_id)
  WHERE source_user_id IS NOT NULL AND status IN ('pending', 'accepted');
--> statement-breakpoint

-- 4. RLS Policies

ALTER TABLE contact_exchanges ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint

-- Recipients can SELECT their own inbound exchanges
CREATE POLICY "Recipients can view own exchanges"
  ON contact_exchanges FOR SELECT TO authenticated
  USING (recipient_user_id = auth.uid());
--> statement-breakpoint

-- Recipients can UPDATE (accept/reject/block/add note) their own exchanges
CREATE POLICY "Recipients can update own exchanges"
  ON contact_exchanges FOR UPDATE TO authenticated
  USING (recipient_user_id = auth.uid());
--> statement-breakpoint

-- Recipients can DELETE their own exchanges
CREATE POLICY "Recipients can delete own exchanges"
  ON contact_exchanges FOR DELETE TO authenticated
  USING (recipient_user_id = auth.uid());