# RLS Staging Setup

To safely test the new RLS architecture without impacting production, you must manually provision an isolated staging environment.

## 1. Create Supabase Staging Project
1. Log in to the Supabase Dashboard.
2. Create a new Project named `TapThat-Staging`.
3. Save the Database Password securely.

## 2. Obtain Credentials
1. Go to **Project Settings -> API**.
2. Copy the **Project URL** and **anon public key**.
3. Go to **Project Settings -> Database**.
4. Copy the **Connection string (URI)**. Ensure you use the connection pooler URL (usually port `6543`).

## 3. Configure Local Environment
Create a `.env.staging` file locally (do not commit it):
```env
NEXT_PUBLIC_SUPABASE_URL=your_staging_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_staging_anon_key
DATABASE_URL=your_staging_db_url
SUPABASE_SERVICE_ROLE_KEY=your_staging_service_role_key
```

## 4. Configure Auth & Callbacks
1. In Supabase Dashboard -> **Authentication -> URL Configuration**.
2. Set the Site URL to `http://localhost:3000` (or your staging Vercel URL).
3. Add any necessary redirect URIs.

## 5. Configure Storage (Optional but Recommended)
1. If you are testing image uploads, use your existing Cloudflare R2 staging bucket or create a new one `tapthat-files-staging`.
2. Update `CLOUDFLARE_ACCOUNT_ID` and `R2_BUCKET_NAME` in `.env.staging`.

## 6. Configure Redis (Rate Limiting)
1. Create a new database in Upstash named `TapThat-Staging`.
2. Update `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in `.env.staging`.

## 7. Run Migrations on Staging
1. Ensure your local terminal uses the staging environment: `set -a && source .env.staging && set +a`.
2. Run `npm run db:push` to construct the baseline schema in the staging database.

## 8. Seed Test Accounts
1. Sign up two test users via the application running locally against staging:
   - `userA@example.com`
   - `userB@example.com`
2. Manually insert a few `unclaimed` cards into the staging database using Drizzle Studio (`npm run db:studio`).

## 9. Verify Environment Isolation
1. Double-check that no operations on your local machine affect production data.
2. Ensure Vercel Preview deployments use these new staging variables, NOT the production variables.
