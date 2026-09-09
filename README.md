# WattWise HEMS

**WattWise** is a 100% software-based Home Energy Management System (HEMS) designed to digitally simulate household energy behavior, forecast demand, and provide deterministic, explainable optimization without relying on physical hardware.

Built for the Smart India Hackathon (SIH) 2026, WattWise transforms fragmented energy data into an intelligent, predictive, and cost-saving digital experience.

## The Problem
Households have limited visibility into their energy consumption and almost no ability to predict the financial impact of their scheduling decisions. Without physical smart meters or advanced IoT infrastructure, users are left guessing how to optimize against complex, time-of-use tariffs.

## The Solution
WattWise provides a **Digital Energy Simulation** platform that:
1. Simulates realistic household load, solar generation, and battery storage without physical sensors.
2. Forecasts energy demand deterministically.
3. Optimizes appliance schedules automatically against time-of-use tariffs and peak demand thresholds.
4. Provides a "What-If" scenario sandbox to safely test configuration changes digitally.

## Features
- **Digital Household Simulation:** Models continuous energy flow (Grid, Solar, Battery, Home Load).
- **Time-of-Use Optimization:** Shifts flexible loads away from peak pricing.
- **Peak Shaving:** Automatically prevents household demand from exceeding soft limits.
- **Explainable Intelligence:** Algorithmic detection of anomalies and cost-saving opportunities.
- **Scenario Sandbox:** Test what happens to your bill if you change your power limit.
- **Multi-Tenant Architecture:** Securely isolates users, households, and simulation states.

## Technology Stack
- **Framework**: Next.js (App Router)
- **Database**: PostgreSQL (Neon Serverless)
- **ORM**: Prisma
- **Auth**: NextAuth.js (Auth.js v5)
- **UI**: Tailwind CSS, shadcn/ui, Recharts
- **Deployment**: Vercel

## Architecture
WattWise relies on a purely digital energy engine. Instead of polling physical hardware, the system executes a deterministic `simulateDay` math model based on user-configured baseloads, appliance schedules, solar irradiance, and battery reserves. This ensures the SIH demonstration is 100% reliable, fast, and secure.

## Security
- **Tenant Isolation:** Every API route and server action enforces strict `householdId` isolation.
- **Mass Assignment Protection:** Prisma queries explicitly allowlist editable fields to prevent IDOR and privilege escalation.
- **Authentication:** Enforced at the middleware and route layer via secure JWT sessions.

## Quick Start (Local Development)

### 1. Prerequisites
- Node.js 18+
- npm or pnpm
- A PostgreSQL database URL

### 2. Environment Setup
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Update the `DATABASE_URL` and `AUTH_SECRET` (generate one via `npx auth secret`).

### 3. Install & Initialize
```bash
npm install
npx prisma generate
npx prisma db push
```

### 4. Run Development Server
```bash
npm run dev
```
Navigate to `http://localhost:3000`.

## Demo Flow
1. **Reset Demo:** Navigate to the Dashboard, click "Demo Reset", and load the canonical Green Valley configuration.
2. **Dashboard:** View the digital live simulation.
3. **Intelligence Center:** Review the algorithmic optimization opportunities and run a What-If scenario.
4. **Optimization Center:** Run the optimizer and view the explainable cost savings.
5. **Analytics:** View historical optimization runs.

## Limitations & Future Roadmap
- **Current Limitation:** WattWise is entirely software-based. It does not connect to real physical smart meters or MQTT brokers.
- **Future Integration:** The deterministic energy engine is designed to seamlessly accept physical telemetry adapters in the future. Real sensor data will simply override the simulated state without requiring a rewrite of the optimization or intelligence layers.

---
*Developed for Smart India Hackathon (SIH) 2026.*
