import { pgTable, uuid, text, boolean, timestamp, jsonb, integer, index } from 'drizzle-orm/pg-core';

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

  // "unclaimed" | "active" | "deactivated" | "replaced"
  status: text('status').default('unclaimed').notNull(),

  activatedAt: timestamp('activated_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('idx_cards_card_uid').on(t.cardUid),
  index('idx_cards_user_id').on(t.userId),
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
  city: text('city'),

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

// ─── Type exports ────────────────────────────────────────────────────────────
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type Card = typeof cards.$inferSelect;
export type NewCard = typeof cards.$inferInsert;
export type TapEvent = typeof tapEvents.$inferSelect;
export type NewTapEvent = typeof tapEvents.$inferInsert;
