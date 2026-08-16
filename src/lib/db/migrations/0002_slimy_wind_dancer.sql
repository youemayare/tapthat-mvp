CREATE TABLE "contact_saves" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"saved_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contact_saves" ADD CONSTRAINT "contact_saves_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_contact_saves_profile" ON "contact_saves" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "idx_contact_saves_profile_time" ON "contact_saves" USING btree ("profile_id","saved_at" DESC);
--> statement-breakpoint
ALTER TABLE "contact_saves" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "Anyone can insert contact saves" 
  ON "contact_saves" FOR INSERT 
  WITH CHECK (true);
--> statement-breakpoint
CREATE POLICY "Users can view own contact saves" 
  ON "contact_saves" FOR SELECT TO authenticated 
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));