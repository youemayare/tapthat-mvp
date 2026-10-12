# Tayz Smart & Digital Business Card Platform

Tayz is a full-stack web application built to manage physical NFC-enabled & digital-only smart business cards. It provides users with a web dashboard to customize their public profiles, configure their Google Wallet passes, and track real-time analytics.

*(Note: The platform was developed under the working title "TapThat" during the prototyping phase and is now officially named Tayz.)*

For detailed architecture, implemented feature inventory, and remaining public launch milestones, see [Platform Status & Roadmap](docs/PLATFORM_STATUS_AND_ROADMAP.md).

---

## Tech Stack

* **Framework:** Next.js (App Router, Turbopack)
* **Language:** TypeScript
* **Styling:** Tailwind CSS (v4) with shadcn design system
* **Database:** PostgreSQL (Drizzle ORM)
* **Authentication:** Supabase Auth (JWT & Row Level Security)
* **Storage:** Cloudflare R2 (Avatars & Audio Voice Notes)
* **Caching & Rate Limiting:** Upstash Redis
* **Transactional Email:** Resend
* **Bot Protection:** Cloudflare Turnstile

---

## Core Engineering Modules

### 1. NFC Hardware & Claim Routing
* `/n/[uid]` smart routing: active cards redirect instantly to public profiles; unclaimed chips route into the activation claim engine (`/claim`).
* Rate-limited claiming protects against UID enumeration attacks.

### 2. Hardware Provisioning & Batch Ingestion
* **Web Admin Portal (`/admin/login` & `/admin/inventory`):** Two-factor authentication (email OTP + master PIN fallback `729401`) protecting live stock statistics, single UID typing/scanning, and bulk CSV drag-and-drop ingestion.
* **CLI Tool (`scripts/ingest-cards.ts`):** Ingest raw chips via terminal:
  ```bash
  # Single card
  npm run cards:ingest -- --uid=045BD2AA1B1291 --type=metal

  # Bulk CSV file
  npm run cards:ingest -- --file=cards.csv --type=metal
  ```
* **Anti-Overwrite Protection:** Idempotent ingestion automatically shields and skips active user cards to prevent accidental reassignment.

### 3. Modular Public Profiles (4 Structurally Distinct Layouts)
* `Classic`: Centered executive card with quick vCard action.
* `Identity`: Bold typography with editorial avatar layout.
* `Canvas`: Visual-first hero banner with modular link blocks.
* `Professional`: Clean corporate hierarchy and bio emphasis.
* vCard instant download (`/api/vcard/[slug]`) with RFC 6350 character sanitization.
* Dynamic offline QR code modal for instant scan fallback.

### 4. Two-Way Contact Exchange CRM
* Visitors exchange details via `/api/exchange` (authenticated) or `/api/exchange/anonymous` (Turnstile verified).
* Audio voice memos attached to contacts stored in Cloudflare R2.
* Cryptographic erasure links (`/remove-exchange/[id]/[token]`) for GDPR compliance.

### 5. Privacy-First Analytics Engine
* Tap tracking via `/api/tap` with SHA-256 IP hashing (no raw visitor IPs stored).
* Tracks total taps, unique visitors, devices, browsers, and countries.

### 6. Digital Wallet Passes
* Google Wallet API integration (`/api/wallet/google/[profileId]`) with custom 5:4 pass hero image rendering.

---

## Local Setup

### Option 1: One-Click Windows Launcher (Recommended)
Double-click `start.bat`:
* Checks dependencies and sets the working directory.
* Starts the Next.js server in a dedicated `"Tayz Server Console"` window.
* Actively tests port `3000` and automatically opens `http://localhost:3000` when ready.
* Server terminal displays real-time 2FA OTP codes for `/admin/login`.

### Option 2: Manual Setup

1. **Clone repository:**
   ```bash
   git clone https://github.com/youemayare/tapthat-mvp.git
   cd tapthat-mvp
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**  
   Create a `.env.local` file with Supabase, PostgreSQL, Cloudflare R2, and Admin credentials.

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Access points:**
   * Main App: `http://localhost:3000`
   * User Dashboard: `http://localhost:3000/dashboard`
   * Hardware Admin: `http://localhost:3000/admin/login`  
     *(Default: `admin@tayz.app` / `TayzAdmin2026!SecureKey` / Master PIN: `729401`)*

---

## Documentation

* [Platform Architecture, Status & Launch Roadmap](docs/PLATFORM_STATUS_AND_ROADMAP.md) — Comprehensive inventory of implemented features and remaining launch milestones.