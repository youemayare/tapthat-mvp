# Project Scope: NFC Business Card Platform (MVP)

## Project Overview

**Project Name:** NFC Business Card Platform  
**Vision:** Build the leading professional identity and networking platform for the GCC, starting with premium NFC business cards.  
**Current Focus:** MVP launch (NFC + QR cards, editable profiles, basic analytics, admin portal).  
**Target Markets:** UAE (primary), Pakistan (secondary), GCC expansion (future).  

---

## Problem Statement

Traditional paper business cards have critical flaws:
- They get lost or discarded.
- Information becomes outdated quickly.
- People must manually save contact details.
- No analytics or follow-up capabilities.

Existing NFC card solutions often:
- Force app downloads on recipients (friction).
- Lack clear "Save Contact" functionality.
- Gate basic analytics behind paywalls.
- Feel like hardware companies, not software platforms.
- Lack localization for GCC markets (Arabic, AED pricing, WhatsApp support).

---

## Solution

A **professional identity platform** accessed via premium NFC cards:

- **One tap** → opens a fast, mobile-optimized profile page.
- **Instant "Save Contact"** → vCard download (no app required).
- **Editable forever** → update job title, company, links anytime.
- **Built-in analytics** → see taps, visitors, countries, devices.
- **Premium feel** → luxury packaging, minimalist design, Apple-like experience.
- **Future: Networking CRM** → track contacts, add notes, set follow-up reminders.

---

## Target Users

### Primary Personas (MVP)
1. **Consultants & Freelancers** (UAE/Pakistan) — Need to share contact info professionally at meetings, events, conferences.
2. **Real Estate Agents** — High-volume networking; need analytics to track lead sources.
3. **Lawyers & Doctors** — Premium branding; want to look polished and modern.
4. **Startup Founders** — Tech-savvy; appreciate NFC + analytics.
5. **Recruiters & Sales Teams** — High-volume sharing; need team features later.

### Secondary Personas (V2+)
- **Corporate Teams** (50–500 employees) — Bulk ordering, brand control, admin dashboard.
- **Event Organizers** — Event-specific profiles, badge scanning, attendee directories.
- **Agencies** — White-label platform for reselling under their own brand.

---

## MVP Scope (Phase 1)

### Core Features (Must-Have)
- **NFC + QR Card:** Each card ships with NTAG215 chip pre-programmed to a unique URL; QR code on back as fallback.
- **Instant Profile Page:** Fast-loading, mobile-optimized page with:
  - Profile picture
  - Name, job title, company name, company logo (optional fields)
  - Phone number, WhatsApp number, email
  - LinkedIn, Instagram, personal website links
  - CV/resume download button
  - **"Save Contact" button** (vCard download — no app required)
- **Editable Profile (Lifetime):** Users can update any field anytime via admin portal.
- **Basic Analytics Dashboard:**
  - Total taps
  - Unique visitors
  - Returning visitors
  - Country breakdown
  - Device type (mobile/desktop/tablet)
  - OS (iOS/Android/Windows/macOS)
  - Browser (Chrome/Safari/Firefox)
  - Daily/monthly graph
- **Admin Portal (Web Dashboard):**
  - User authentication (email/password + social login)
  - Profile management (edit fields, upload CV/logo)
  - Card registration (link NFC card to profile)
  - Analytics view
  - Order replacement cards
- **Apple/Google Wallet Integration:** Digital card stored in Wallet for instant sharing (even without physical card).
- **Premium Packaging:** Magnetic box, minimalist design, simple instructions, luxury photos.

### Out of Scope (V2+)
- Multiple profiles (Professional/Personal/Freelance modes).
- Advanced analytics (heatmaps, UTM tracking, export to CSV).
- Custom domains (e.g., `card.yourbrand.com/umar`).
- Lead capture forms on profile pages.
- CRM-lite (contact manager with notes, tags, follow-up reminders).
- Team templates (brand-locked templates for companies).
- White-label branding (remove platform branding).
- Priority support (WhatsApp/phone SLA).
- Enterprise features (SSO/SAML, API access, custom onboarding, compliance).

---

## Future Roadmap

### V2 (Post-MVP — 3–6 months after launch)
- **Multiple Profiles:** Switch between Professional, Personal, Freelance modes on one card.
- **Advanced Analytics:** Heatmaps, visitor trends, UTM tracking, CSV export.
- **Custom Domains:** Use your own domain instead of platform subdomain.
- **Lead Capture:** Optional form on profile (name, email, company, message).
- **CRM-lite:** Dashboard shows everyone who saved your contact; add notes, tags, follow-up reminders.
- **Team Templates:** Brand-locked templates for teams; enforce logo, colors, fonts.
- **White-Label Branding:** Remove platform branding from profile pages.
- **Priority Support:** WhatsApp/phone support; 24-hour response SLA.

### V3 (Enterprise — 6–12 months after launch)
- **Team Admin Dashboard:** Centralized control (create/disable employees, assign departments, manage branding, export analytics).
- **SSO/SAML Integration:** Single sign-on with corporate identity providers (Azure AD, Okta).
- **API Access:** REST API for profile creation, analytics export, team management.
- **Custom Onboarding:** Dedicated account manager; bulk CSV upload; training sessions.
- **Compliance (GDPR, SOC 2):** Data residency options; compliance certifications.
- **Custom Hardware:** Co-branded metal/wood cards with company logo, custom packaging.
- **White-Label Platform:** Full platform rebranding for agencies/resellers.
- **SLA & Support:** 99.9% uptime SLA; dedicated support channel; 4-hour response time.

### Future Vision (12+ months)
- **AI-Powered Networking:** AI suggests follow-ups, drafts messages, summarizes connections, recommends events.
- **CRM Integrations:** Deep sync with Salesforce, HubSpot, Pipedrive, Zoho.
- **Event Networking Mode:** Event-specific profiles; badge scanning; attendee directory; post-event analytics.
- **Marketplace for Templates:** User-designed templates; creators earn revenue; platform takes cut.
- **Public API & Ecosystem:** Third-party apps build on top (Calendly, Zapier, Slack).
- **Global Expansion:** Localized versions for GCC, APAC, Europe; multi-language support.

---

## Technical Requirements (High-Level)

### Performance Goals
- **Profile Page Load Time:** < 200ms globally (critical for NFC taps).
- **API Response Time:** < 100ms for all endpoints.
- **Uptime:** 99.9% (MVP); 99.99% (V3 enterprise).

### Scalability Goals
- **MVP:** Support 1,000 users (10k profile views/month).
- **V2:** Support 10,000 users (100k profile views/month).
- **V3:** Support 100,000+ users (1M+ profile views/month).

### Security & Compliance
- **HTTPS Everywhere:** TLS enforced on all endpoints.
- **Password Hashing:** bcrypt or managed auth provider (Clerk/Auth0).
- **Data Encryption:** Database TDE; file storage server-side encryption.
- **GDPR Compliance:** IP addresses hashed; user data export/delete endpoints.
- **Rate Limiting:** Prevent abuse on public endpoints.
- **Input Validation:** Schema validation on all API inputs.

### NFC Specifications
- **Chip Type:** NTAG215 (industry standard; works with iOS 13+ and all Android).
- **Memory:** 504 bytes (plenty for URL + NDEF metadata).
- **Pre-programming:** Each card stores unique URL: `https://yourdomain.com/n/{cardId}` (redirects to profile).
- **Fallback:** QR code printed on back (for phones without NFC or poor tap conditions).

---

## Success Metrics (MVP)

### Product Metrics
- **Profile Load Time:** < 200ms (global average).
- **Tap-to-Profile Conversion:** > 90% (users who tap card successfully open profile).
- **Save Contact Rate:** > 50% (users who open profile download vCard).
- **User Retention:** > 40% weekly active users (return to dashboard/analytics).

### Business Metrics
- **MVP Launch:** 100 paying customers in first 3 months.
- **Average Order Value:** AED 199–299 (metal card + Pro subscription).
- **Monthly Recurring Revenue (MRR):** AED 10,000+ by month 6.
- **Customer Acquisition Cost (CAC):** < AED 150 (via LinkedIn, corporate sales, events).

---

## Open Questions for Antigravity

1. **Tech Stack Recommendations:** What stack would you recommend for this MVP (given performance, scalability, and cost goals)? We're open to suggestions (Next.js, Hono, Cloudflare Workers, Supabase, etc.).
2. **Implementation Plan:** What's the optimal phased rollout (e.g., auth → profile pages → analytics → card registration)?
3. **Database Design:** Any recommendations for schema optimization (analytics events, contact tracking)?
4. **NFC Programming Workflow:** Best practices for pre-programming NTAG215 chips at scale?
5. **Deployment Strategy:** Managed services (Vercel, Supabase, Cloudflare) vs. self-hosted (Docker, Kubernetes)?
6. **Cost Optimization:** How to keep infrastructure costs < $200/month at 10k users?

---

## Next Steps

1. **Antigravity Review:** Share this scope doc with Antigravity for tech stack + implementation plan recommendations.
2. **Refinement:** Iterate on stack choice based on Antigravity's suggestions.
3. **Sprint Planning:** Break MVP into 2-week sprints (auth, profiles, analytics, card registration, packaging).
4. **Build:** Start development with MVP focus (ignore V2/V3 features for now).

---

**Goal:** Launch MVP in 6–8 weeks with a polished, fast, recipient-first experience. Future phases (V2, V3) will add premium features, team management, and enterprise capabilities.

Let's build something people actually choose over Popl, Linq, and Blinq. 🚀