CREATE TABLE "connection_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"connection_id" uuid NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_connection_notes_owner_conn" UNIQUE("connection_id","owner_user_id")
);
--> statement-breakpoint
ALTER TABLE "connection_notes" ADD CONSTRAINT "connection_notes_connection_id_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connection_notes" ADD CONSTRAINT "connection_notes_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_connection_notes_conn" ON "connection_notes" USING btree ("connection_id");--> statement-breakpoint
CREATE INDEX "idx_connection_notes_owner" ON "connection_notes" USING btree ("owner_user_id");--> statement-breakpoint
ALTER TABLE "connection_notes" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "Users can manage their own connection notes"
ON "connection_notes"
FOR ALL
USING (auth.uid() = owner_user_id)
WITH CHECK (auth.uid() = owner_user_id);
