ALTER TABLE "connection_notes" ALTER COLUMN "content" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "connection_notes" ALTER COLUMN "content" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "connection_notes" ADD COLUMN "audio_storage_path" text;--> statement-breakpoint
ALTER TABLE "connection_notes" ADD COLUMN "audio_mime_type" text;--> statement-breakpoint
ALTER TABLE "connection_notes" ADD COLUMN "audio_size" integer;--> statement-breakpoint
ALTER TABLE "connection_notes" ADD COLUMN "audio_duration" integer;