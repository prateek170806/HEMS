# WattWise Installation Guide

This guide will help you install and run WattWise locally for development and testing.

## Prerequisites
- **Node.js**: v18.17.0 or higher
- **Package Manager**: `npm` (v9+) or `pnpm`
- **Database**: PostgreSQL (A Neon serverless Postgres instance is recommended)
- **Git**

## 1. Clone the Repository
```bash
git clone https://github.com/wattwise/wattwise-hems.git
cd wattwise-hems
```

## 2. Environment Variables
WattWise requires specific environment variables to function correctly.

Copy the example environment file:
```bash
cp .env.example .env
```

Open `.env` and fill in the required values:
- `DATABASE_URL`: Connection string to your PostgreSQL instance. Example: `postgresql://user:password@localhost:5432/wattwise?schema=public`
- `AUTH_SECRET`: A secure random string for NextAuth.js. You can generate one by running `npx auth secret`.

## 3. Install Dependencies
Run the following command to install all necessary packages:
```bash
npm install
```

## 4. Initialize the Database
WattWise uses Prisma as its ORM. First, generate the Prisma Client, then push the schema to your database.

```bash
# Generate the Prisma client based on the schema
npx prisma generate

# Push the schema to create tables in the database
npx prisma db push
```

*(Note: In a production environment, use `npx prisma migrate deploy` instead of `db push`. `db push` is meant for local prototyping only).*

## 5. Run the Development Server
Start the Next.js development server:
```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## 6. Build for Production
To test the production build locally:
```bash
npm run build
npm start
```

## 7. Run the Test Suite
WattWise uses Vitest for unit and integration testing.
```bash
npm run test
```
