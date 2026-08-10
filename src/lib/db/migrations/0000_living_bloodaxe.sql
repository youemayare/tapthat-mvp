CREATE TABLE "card_status_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"card_id" uuid NOT NULL,
	"user_id" uuid,
	"previous_status" text NOT NULL,
	"new_status" text NOT NULL,
	"reason" text,
	"previous_profile_id" uuid,
	"new_profile_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"profile_id" uuid,
	"card_uid" text NOT NULL,
	"card_type" text DEFAULT 'pvc',
	"status" text DEFAULT 'unclaimed' NOT NULL,
	"activated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cards_card_uid_unique" UNIQUE("card_uid")
);
--> statement-breakpoint
CREATE TABLE "connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"viewer_user_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"slug" text,
	"first_name" text,
	"last_name" text,
	"job_title" text,
	"company_name" text,
	"bio" text,
	"profile_photo_url" text,
	"company_logo_url" text,
	"cv_url" text,
	"phone" text,
	"whatsapp" text,
	"email" text,
	"linkedin_url" text,
	"instagram_url" text,
	"website_url" text,
	"social_links" jsonb DEFAULT '[]'::jsonb,
	"theme" text DEFAULT 'default',
	"is_published" boolean DEFAULT false NOT NULL,
	"label" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "tap_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"card_id" uuid,
	"profile_id" uuid,
	"ip_hash" text,
	"country" text,
	"city" text,
	"device_type" text,
	"os" text,
	"browser" text,
	"referrer" text,
	"session_id" text,
	"is_unique" boolean DEFAULT true NOT NULL,
	"tapped_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"full_name" text,
	"avatar_url" text,
	"auth_provider" text DEFAULT 'email',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "card_status_events" ADD CONSTRAINT "card_status_events_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_status_events" ADD CONSTRAINT "card_status_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_status_events" ADD CONSTRAINT "card_status_events_previous_profile_id_profiles_id_fk" FOREIGN KEY ("previous_profile_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_status_events" ADD CONSTRAINT "card_status_events_new_profile_id_profiles_id_fk" FOREIGN KEY ("new_profile_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cards" ADD CONSTRAINT "cards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cards" ADD CONSTRAINT "cards_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connections" ADD CONSTRAINT "connections_viewer_user_id_users_id_fk" FOREIGN KEY ("viewer_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connections" ADD CONSTRAINT "connections_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tap_events" ADD CONSTRAINT "tap_events_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tap_events" ADD CONSTRAINT "tap_events_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_card_events_card_id" ON "card_status_events" USING btree ("card_id");--> statement-breakpoint
CREATE INDEX "idx_cards_card_uid" ON "cards" USING btree ("card_uid");--> statement-breakpoint
CREATE INDEX "idx_cards_user_id" ON "cards" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_connections_viewer" ON "connections" USING btree ("viewer_user_id");--> statement-breakpoint
CREATE INDEX "idx_connections_profile" ON "connections" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "idx_profiles_slug" ON "profiles" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_profiles_user_id" ON "profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_tap_events_card_time" ON "tap_events" USING btree ("card_id","tapped_at");--> statement-breakpoint
CREATE INDEX "idx_tap_events_profile_time" ON "tap_events" USING btree ("profile_id","tapped_at");--> statement-breakpoint
CREATE INDEX "idx_tap_events_country" ON "tap_events" USING btree ("profile_id","country");--> statement-breakpoint
CREATE INDEX "idx_tap_events_device" ON "tap_events" USING btree ("profile_id","device_type");