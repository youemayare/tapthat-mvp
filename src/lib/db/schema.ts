import { pgTable, uuid, text, boolean, timestamp, jsonb, index, unique } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ─── Users ───────────────────────────────────────────────────────────────────
// Mirrors Supabase auth.users — populated via webhook trigger on signup
export const users = pgTable('users', {
  id: uuid('id').primaryKey(), // matches auth.users.id
  email: text('email').notNull().unique(),
  fullName: text('full_name'),
  avatarUrl: text('avatar_url'),
  authProvider: text('auth_provider').default('email'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── Profiles ────────────────────────────────────────────────────────────────
export const profiles = pgTable('profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  slug: text('slug').unique(), // vanity URL: /p/{slug}

  // Personal info
  firstName: text('first_name'),
  lastName: text('last_name'),
  jobTitle: text('job_title'),
  companyName: text('company_name'),
  bio: text('bio'),
  profileLayout: text('profile_layout').$type<'classic' | 'identity' | 'canvas'>().notNull().default('classic'),
  layoutBackgroundColor: text('layout_background_color'),
  layoutBackgroundImageUrl: text('layout_background_image_url'),
  layoutFont: text('layout_font').default('geist'),

  // Media (stored in Cloudflare R2)
  profilePhotoUrl: text('profile_photo_url'),
  companyLogoUrl: text('company_logo_url'),
  cvUrl: text('cv_url'),

  // Contact
  phone: text('phone'),
  whatsapp: text('whatsapp'),
  email: text('email'),

  // Social links (structured)
  linkedinUrl: text('linkedin_url'),
  instagramUrl: text('instagram_url'),
  websiteUrl: text('website_url'),

  // Extra social links (flexible JSONB: { platform: string, url: string }[])
  socialLinks: jsonb('social_links').$type<{ platform: string; url: string }[]>().default([]),

  // Settings
  theme: text('theme').default('default'),
  isPublished: boolean('is_published').default(false).notNull(),

  // ── Multi-Profile (added in feat/multi-profile-personas) ─────────────────
  // Human-readable label for this persona, e.g. "Business", "Student"
  // Nullable: existing single-profile users will have null here (treated as default profile)
  label: text('label'),
  // Marks which profile is the primary/fallback for this user.
  // Exactly one profile per user should have is_default=true.
  // False for all existing rows until the backfill migration runs.
  isDefault: boolean('is_default').default(false).notNull(),
  // Optional: if set, the profile is archived (hidden from public) but its URL
  // still resolves to an archived-profile page rather than 404/redirect.
  archivedAt: timestamp('archived_at', { withTimezone: true }),

  // ── Google Wallet Appearance ──────────────────────────────────────────────
  // Optional hex background color for the Wallet pass, e.g. "#1a1a2e".
  // When null, Google Wallet uses its dominant-color fallback automatically.
  walletThemeColor: text('wallet_theme_color'),
  // Optional hero image URL (JPG/PNG, approx 5:4 / 1032×812). Must be HTTPS.
  // Maps to GenericObject.heroImage in the Google Wallet API.
  walletHeroImageUrl: text('wallet_hero_image_url'),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('idx_profiles_slug').on(t.slug),
  index('idx_profiles_user_id').on(t.userId),
]);

// ─── Cards ───────────────────────────────────────────────────────────────────
export const cards = pgTable('cards', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  profileId: uuid('profile_id').references(() => profiles.id, { onDelete: 'set null' }),

  // The factory UID from the NFC chip (e.g. "045BD2AA1B1291")
  cardUid: text('card_uid').notNull().unique(),

  // "pvc" | "metal" | "wood"
  cardType: text('card_type').default('pvc'),

  // "unclaimed" | "active" | "deactivated" | "replaced" | "revoked"
  status: text('status').default('unclaimed').notNull(),

  activatedAt: timestamp('activated_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('idx_cards_card_uid').on(t.cardUid),
  index('idx_cards_user_id').on(t.userId),
  // PostgreSQL check constraint to enforce allowed statuses at the DB level
  sql`CHECK (status IN ('unclaimed', 'active', 'deactivated', 'revoked'))`
]);

// ─── Card Status Events (Audit Log) ──────────────────────────────────────────
export const cardStatusEvents = pgTable('card_status_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  cardId: uuid('card_id').references(() => cards.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  previousStatus: text('previous_status').notNull(),
  newStatus: text('new_status').notNull(),
  reason: text('reason'),
  // ── Multi-Profile audit: track profile switches ───────────────────────────
  previousProfileId: uuid('previous_profile_id').references(() => profiles.id, { onDelete: 'set null' }),
  newProfileId: uuid('new_profile_id').references(() => profiles.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('idx_card_events_card_id').on(t.cardId),
]);

// ─── Tap Events ──────────────────────────────────────────────────────────────
// High-write table — indexed for fast aggregation queries
export const tapEvents = pgTable('tap_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  cardId: uuid('card_id').references(() => cards.id, { onDelete: 'cascade' }),
  profileId: uuid('profile_id').references(() => profiles.id, { onDelete: 'cascade' }),

  // GDPR-compliant: SHA-256 hash of (IP + YYYY-MM-DD), never raw IP
  ipHash: text('ip_hash'),

  // Geolocation (from Vercel edge headers)
  country: text('country'),

  // Device info (parsed from User-Agent)
  deviceType: text('device_type'), // "mobile" | "tablet" | "desktop"
  os: text('os'),                  // "iOS" | "Android" | "Windows" | "macOS" | "Linux"
  browser: text('browser'),        // "Chrome" | "Safari" | "Firefox" | "Edge" | "Other"

  // Session tracking
  referrer: text('referrer'),
  sessionId: text('session_id'),   // cookie-based session fingerprint
  isUnique: boolean('is_unique').default(true).notNull(),

  tappedAt: timestamp('tapped_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  // Primary analytics queries
  index('idx_tap_events_card_time').on(t.cardId, t.tappedAt),
  index('idx_tap_events_profile_time').on(t.profileId, t.tappedAt),
  // Breakdown aggregations
  index('idx_tap_events_country').on(t.profileId, t.country),
  index('idx_tap_events_device').on(t.profileId, t.deviceType),
]);

// ─── Contact Saves ───────────────────────────────────────────────────────────
// Tracks when a visitor successfully generates/downloads a profile's vCard.
export const contactSaves = pgTable('contact_saves', {
  id: uuid('id').defaultRandom().primaryKey(),
  profileId: uuid('profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  savedAt: timestamp('saved_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('idx_contact_saves_profile').on(t.profileId),
  index('idx_contact_saves_profile_time').on(t.profileId, t.savedAt, sql`DESC`),
]);

// ─── Connections ─────────────────────────────────────────────────────────────
// One-sided: a logged-in user saves another user's profile.
// Clicking a saved connection routes through /n/[uid] to log a tap event.
export const connections = pgTable('connections', {
  id: uuid('id').defaultRandom().primaryKey(),
  // The user who saved the connection
  viewerUserId: uuid('viewer_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  // The profile that was saved
  profileId: uuid('profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('idx_connections_viewer').on(t.viewerUserId),
  index('idx_connections_profile').on(t.profileId),
]);

// ─── Type exports ────────────────────────────────────────────────────────────
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type Card = typeof cards.$inferSelect;
export type NewCard = typeof cards.$inferInsert;
export type TapEvent = typeof tapEvents.$inferSelect;
export type NewTapEvent = typeof tapEvents.$inferInsert;
export type Connection = typeof connections.$inferSelect;
export type NewConnection = typeof connections.$inferInsert;
export type ContactSave = typeof contactSaves.$inferSelect;
export type NewContactSave = typeof contactSaves.$inferInsert;

export const connectionNotes = pgTable('connection_notes', {
  id: uuid('id').defaultRandom().primaryKey(),
  connectionId: uuid('connection_id').notNull().references(() => connections.id, { onDelete: 'cascade' }),
  ownerUserId: uuid('owner_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('idx_connection_notes_conn').on(t.connectionId),
  index('idx_connection_notes_owner').on(t.ownerUserId),
  unique('uq_connection_notes_owner_conn').on(t.connectionId, t.ownerUserId),
]);

export type ConnectionNote = typeof connectionNotes.$inferSelect;
export type NewConnectionNote = typeof connectionNotes.$inferInsert;


