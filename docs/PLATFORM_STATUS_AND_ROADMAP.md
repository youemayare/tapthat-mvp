# Tayz Platform Architecture, Status & Launch Roadmap

> **Document Version:** 1.0.0  
> **Last Updated:** October 2026  
> **Status:** MVP Feature-Complete (~95% Engine Complete / ~75% Commercial Automation)

---

## 1. Executive Summary

Tayz (originally prototyped under *TapThat*) is an enterprise-grade smart business card platform managing physical NFC metal/PVC hardware, dynamic multi-layout digital profiles, digital wallet passes, and a two-way contact exchange CRM.

* **Core Platform Engine:** **Production Ready (95%)**  
  Zero TypeScript compilation errors, comprehensive database Row Level Security (RLS), anti-bot verification, GDPR-compliant IP hashing, 4 distinct profile layouts, Google Wallet passes, voice notes in Cloudflare R2, and hardware batch provisioning with 2FA protection.
* **Commercial Automation:** **In Progress (75%)**  
  The landing page currently captures early adopters via a Founding Circle waitlist. To enable fully autonomous public purchasing without human order handling, payment integration (Stripe/GCC gateways), transactional exchange emails, and legal pages remain to be completed.

---

## 2. What Was Done (Completed & Verified)

### A. NFC Hardware Routing & Claim Flow
* **Smart URL Routing (`/n/[uid]`):**  
  * Active cards redirect instantaneously to the linked profile (`/p/[slug]` or `/[handle]`) and asynchronously log analytics.
  * Unclaimed cards automatically route the visitor into the card claim and onboarding flow (`/claim?uid=...`).
* **Hardware Claim Flow (`/claim` & `claimCardAction`):**  
  * Atomically validates UID format (8–64 alphanumeric characters).
  * Enforces rate limiting against brute-force UID enumeration.
  * Links the physical card to the authenticated user's active profile in a single database transaction.

### B. Hardware Provisioning & Batch Ingestion
* **Core Provisioning Library (`src/lib/cards/provisioning.ts`):**  
  * Sanitizes raw UIDs (strips colons, hyphens, and whitespace; normalizes to uppercase).
  * **Anti-Overwrite Protection:** Actively protects live user cards. If an ingested UID is already claimed, the system shields it and skips it.
  * **Idempotent:** Re-uploading existing unclaimed inventory skips duplicates cleanly without database errors.
* **Command-Line Ingestion Tool (`scripts/ingest-cards.ts`):**  
  * Run single card: `npm run cards:ingest -- --uid=045BD2AA1B1291 --type=metal`
  * Run batch file: `npm run cards:ingest -- --file=cards.csv --type=metal`
* **Two-Factor Admin Portal (`/admin/login` & `/admin/inventory`):**  
  * Protected by master credentials + 6-digit email OTP (with terminal console logging in development and `729401` master PIN fallback).
  * Unified UI built with Tayz design tokens:
    * 4 balanced metric cards (Total Hardware, In Stock, Active, Finishes).
    * Single UID entry tab with aligned grid baselines.
    * Bulk CSV drag-and-drop / paste ingestion.
    * Real-time inventory table with UID copy and instant `/n/[uid]` test tap links.

### C. Digital Profile System
* **4 Structurally Distinct Profile Layouts:**  
  * `Classic`: Minimalist, centered executive card layout.
  * `Identity`: Bold typography, editorial avatar header, and prominent social grid.
  * `Canvas`: Visual-first hero banner with modular link blocks.
  * `Professional`: Clean corporate hierarchy, bio emphasis, and direct action bar.
* **vCard Generation (`/api/vcard/[slug]`):**  
  * Generates RFC 6350-compliant `.vcf` contact files with sanitized headers and UTF-8 support.
* **Offline Sharing:**  
  * Dynamic in-browser QR code modal allowing instant camera scans when NFC is unavailable.

### D. Two-Way Contact Exchange (CRM-Lite)
* **Exchange Endpoints (`/api/exchange` & `/api/exchange/anonymous`):**  
  * Supports logged-in profile owners and anonymous visitors.
  * Protected by Cloudflare Turnstile anti-bot verification and Upstash Redis rate limiting.
* **Audio Voice Memos (`/api/audio/upload`):**  
  * Cardholders can record and attach voice memos to exchanged contacts, stored securely in Cloudflare R2.
* **GDPR Erasure Mechanism (`/remove-exchange/[id]/[token]`):**  
  * Anonymous contacts receive a cryptographic erasure token to exercise their right-to-be-forgotten without needing an account.

### E. User Dashboard & Management
* **Overview Dashboard (`/dashboard`):**  
  * High-level metrics: total taps, active cards, registered profiles, and quick actions.
* **Multi-Persona Profiles (`/dashboard/profile`):**  
  * Switch between distinct personas (e.g., Work vs. Personal).
  * Live profile preview with real-time field synchronization.
  * Cloudflare R2 direct avatar cropping and upload.
* **Connections Manager (`/dashboard/connections`):**  
  * Search, filter, and review exchanged contact details.
  * Add private meeting notes and playback recorded audio memos.
* **Hardware Manager (`/dashboard/cards`):**  
  * View claimed physical cards, assign cards to specific profiles, and re-link hardware.

### F. Analytics Engine
* **Privacy-First Tap Logging (`/api/tap`):**  
  * SHA-256 IP hashing with a rotating salt prevents storing raw visitor IP addresses (GDPR-compliant).
  * Tracks total taps, unique visitors vs. returning visitors, device manufacturers, browser engines, and geographic location.
* **Analytics Visualizations (`/dashboard/analytics`):**  
  * Interactive charts powered by Recharts with time-range filtering.

### G. Digital Wallet Passes
* **Google Wallet API (`/api/wallet/google/[profileId]`):**  
  * Issues signed Google Wallet passes (`GenericObject`) with custom brand colors.
  * Dynamically renders and caches a 5:4 ratio pass hero image.

### H. Infrastructure, Security & Build
* **Security & RLS:** Complete PostgreSQL Row Level Security policies via Supabase Auth.
* **Email System:** Resend integration for transactional signup confirmations and card activation notices.
* **Launcher Tooling:** Windows `start.bat` with automated port health check polling (`cd /d "%~dp0"`).
* **Type Safety:** 100% clean TypeScript compilation (`npx tsc --noEmit` code 0).

---

## 3. Hardware Provisioning SOP (Standard Operating Procedure)

When receiving a batch of physical cards from an RFID manufacturer:

```
[ Factory Shipment ] ──> 500 blank cards with embedded NTAG215 chips
          │
          ├── Step 1: Laser engrave card finish / customer name
          │
          ├── Step 2: Physical NFC URL Burn
          │           Write: https://tayz.app/n/<UID>
          │           (Can be requested pre-burned by supplier)
          │
          └── Step 3: Database Ingestion
                      Option A: Open /admin/inventory -> Upload manufacturer CSV
                      Option B: Run: npm run cards:ingest -- --file=batch.csv --type=metal
```

---

## 4. What's Left & Needs Improvement (Launch Gaps)

To transition from a **Founding Circle / Pilot Phase** to a **Public, Fully Automated E-Commerce Business**, the following 5 items need implementation:

### Gap 1: In-App Checkout & Payment Gateway (High Priority)
* **Current State:** The landing page points "Get Your Card" CTAs to an external Tally waitlist (`WAITLIST_URL`).
* **Needed:** Integrated checkout flow (Stripe Checkout or GCC providers like Tap Payments, Checkout.com, Tabby) to:
  1. Collect customer payments.
  2. Select card finish (Matte Black, Silver, Gold, Rose Gold).
  3. Enter custom laser engraving text.
  4. Collect verified shipping addresses.

### Gap 2: Real-Time Exchange Email Notifications (Medium Priority)
* **Current State:** When a connection fills out the profile exchange form, data saves to the database silently.
* **Needed:** A transactional notification trigger via Resend (e.g. `sendExchangeNotificationEmail`) alerting the cardholder:
  > *"Sarah Jenkins just exchanged contact details with you! View details in your dashboard."*

### Gap 3: Legal & Regulatory Pages (Compliance Mandatory)
* **Current State:** The footer in `src/app/page.tsx` has placeholder comments.
* **Needed:** Live `/privacy-policy` and `/terms-of-service` routes covering:
  * GDPR visitor IP hashing disclosure.
  * Voice note storage in Cloudflare R2.
  * Physical card shipping and refund terms (required for Stripe account verification).

### Gap 4: Apple Wallet Pass Generation (Enhancement)
* **Current State:** Google Wallet passes are fully implemented.
* **Needed:** Apple Wallet (`.pkpass`) PassKit generator signed with an Apple Developer Team certificate so iPhone users have native "Add to Apple Wallet" support.

### Gap 5: Order & Shipping Fulfillment Table (Operations)
* **Current State:** Physical orders are tracked externally.
* **Needed:** An `orders` database table tracking:
  * Order status: `placed` → `engraving` → `encoded` → `dispatched` → `delivered`.
  * Shipping courier name & tracking number.
  * Automatic customer email dispatched when tracking number is added.

### Mobile Edge Case: Samsung Internet Forced Dark Mode
* **Status:** Samsung Internet's forced "High Contrast / Dark Mode" setting applies an aggressive filter that can alter light profile palettes.
* **Action:** The core CSS is strictly standard-compliant. Add a small FAQ or tooltip in the dashboard recommending users review browser appearance settings if profiles appear darker than expected on Samsung Galaxy devices.

---

## 5. Recommended Launch Strategy

| Phase | Scope | Platform Status |
| :--- | :--- | :--- |
| **Phase 1: Founding Circle Pilot** | Invite-only / early bird waitlist, manual card engraving & shipping for first 50–100 VIPs. | **READY TO LAUNCH NOW** |
| **Phase 2: Automated Public Sales** | Implement Stripe Checkout, Exchange Email Alerts, Legal Pages, and Order Shipping Pipeline. | **Ready after Phase 2 sprint (~2–3 days)** |
