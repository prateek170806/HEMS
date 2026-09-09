# WattWise Deployment Guide

This guide provides instructions on deploying WattWise to a production environment. The recommended deployment stack is **Vercel** for hosting the Next.js application and **Neon** for the PostgreSQL database.

## 1. Prepare Database (Neon PostgreSQL)
1. Create a free or paid PostgreSQL database on [Neon.tech](https://neon.tech).
2. Obtain the pooled connection string (e.g., `postgresql://...`).
3. Note: Ensure you are using the pooled connection if your serverless functions might spike in concurrency.

## 2. Vercel Deployment

### Step A: Import Project
1. Log in to [Vercel](https://vercel.com) and click **Add New...** -> **Project**.
2. Import the WattWise repository from GitHub.

### Step B: Configure Environment Variables
Before clicking Deploy, expand the **Environment Variables** section and add the following:

- `DATABASE_URL`: Your Neon PostgreSQL connection string.
- `AUTH_SECRET`: Generate a secure 32+ character random string (e.g. via `npx auth secret` or `openssl rand -base64 32`). This is required by NextAuth.js to encrypt the session cookies.

### Step C: Build Command & Install Command
Vercel automatically detects Next.js.
- **Framework Preset**: Next.js
- **Build Command**: `next build` (Vercel uses this by default)
- **Install Command**: `npm install` (Vercel uses this by default)

Vercel will run the `postinstall` script defined in `package.json` (`prisma generate`), ensuring the Prisma client is built before the Next.js build runs.

### Step D: Deploy
Click **Deploy**. Wait for the build process to finish.

## 3. Database Migration
Once deployed, you must initialize the production database schema.

> **WARNING**: Do NOT run `prisma migrate reset` or `prisma db push` on a production database unless you explicitly accept complete data loss!

For production, WattWise relies on Prisma Migrations. However, if this is the absolute first deployment and you don't have migration history, you can sync the schema safely via the Vercel CLI or a local connection:

1. Locally, configure your `.env` to point to the production database.
2. Run: `npx prisma db push` (only for initial prototyping) OR `npx prisma migrate deploy` (for safe production migration).

## 4. Verification
1. Open the Vercel Production URL.
2. Ensure you are automatically redirected to `/login`.
3. Attempt to register a new user.
4. Verify that the Dashboard loads without 500 errors.
5. If errors occur, check the Vercel Runtime Logs for missing environment variables or database connection timeouts.

## 5. Troubleshooting
- **Prisma "Client not generated" Error**: Ensure `prisma generate` runs during the build step. It is currently placed in the `postinstall` hook in `package.json`.
- **NextAuth 500 Error**: Verify that `AUTH_SECRET` is set in the Vercel Environment Variables and that the Vercel URL aligns with any callback constraints.
- **Database Connection Limits**: Neon handles pooling automatically, but if you hit limits, ensure your `DATABASE_URL` is utilizing PgBouncer or connection pooling.
