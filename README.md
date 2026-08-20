# Anoya Smart & Digital Business Card Platform

Anoya is a full-stack web application built to manage physical NFC-enabled & digital-only smart business cards. It provides users with a web dashboard to customize their public profiles, configure their Google Wallet passes, and track real-time analytics.

*(Note: The platform was developed under the working title "TapThat" during the prototyping phase and is now officially named Anoya.)*

This repository demonstrates modern frontend engineering practices, modular component architecture, and practical API integration.

## Tech Stack

* Framework: Next.js (App Router)
* Language: TypeScript
* Styling: Tailwind CSS
* Database: PostgreSQL (Drizzle ORM)
* Authentication: Supabase Auth
* Infrastructure: Vercel (Hosting), Cloudflare R2 (Asset Storage)

## Core Engineering Focus

### Modular Frontend Architecture
The user interface is built using reusable React components. Interactive elements, such as the cross-platform color picker for Google Wallet customization, are encapsulated into independent modules. State management is handled strictly to ensure UI updates, like the live card preview, reflect changes instantly without unnecessary DOM re-renders.

### API Integration and Data Flow
The client-side interfaces connect directly to backend microservices and database endpoints. The frontend consumes RESTful API routes and server actions to handle secure profile updates, image uploads, and analytics tracking. Asynchronous JavaScript operations (Promises, async/await) are used to maintain a non-blocking user experience during data fetching and mutations.

### Responsive Design and Cross-Browser Optimization
The application is built for responsive performance across all viewports. Both the public-facing profile pages and the internal management dashboard adapt to mobile, tablet, and desktop environments. Layouts were audited for visual precision and cross-browser compatibility to ensure a consistent user experience.

### Security and Data Protection
Data access is restricted using Row Level Security policies at the database layer, ensuring users can only read and modify their own records. Authentication is managed via secure JSON Web Tokens. For the analytics engine, visitor IP addresses are cryptographically hashed to maintain privacy and GDPR compliance while still generating accurate unique visitor metrics.

### Web Performance Best Practices
The platform leverages Next.js server-side rendering and asset caching to maintain fast load times. Database queries are kept efficient, and image assets are served through a CDN to support core web vitals, lazy loading, and SEO-friendly semantic markup.

## Local Setup

1. Clone the repository
`git clone https://github.com/youemayare/tapthat-mvp.git`

2. Install dependencies
`npm install`

3. Configure environment variables
Create a `.env.local` file with the required Supabase, PostgreSQL, and Cloudflare R2 credentials.

4. Run the development server
`npm run dev`

Open `http://localhost:3000` to view the application in the browser.