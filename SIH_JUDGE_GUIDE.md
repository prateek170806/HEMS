# WattWise — SIH Judge Presentation Guide

This guide is designed for the presentation team to quickly navigate questions from the Smart India Hackathon (SIH) judges. It outlines the core value proposition, the architecture, and handles common technical inquiries.

## 1. Core Value Proposition
- **Problem:** Households are blind to the financial mechanics of Time-of-Use (TOU) energy tariffs. They don't know *when* to run high-load appliances or *how* to maximize solar self-consumption.
- **Solution:** WattWise is a software-first Home Energy Management System (HEMS).
- **Differentiation:** Instead of requiring immediate, expensive hardware installations, WattWise acts as a predictive **Digital Energy Simulation** platform that tells users what their bill *will* be and *how* to lower it algorithmically.

## 2. Key Concepts for Presentation
- **Digital Simulation:** We are not polling fake IoT sensors. We are mathematically simulating the energy curve based on configuration constraints (baseload, appliance duration, solar irradiance).
- **Predictive Intelligence:** Our recommendations are algorithmic and deterministic. This is **Explainable Intelligence**, ensuring users understand exactly *why* an appliance was shifted (e.g., "Shifted to 02:00 to avoid ₹12 peak pricing").
- **What-If Scenarios:** The ability to experiment with configurations (e.g., lowering the power limit or turning off solar) without changing the actual baseline.
- **Security:** Fully multi-tenant SaaS architecture. Secure JWT sessions, encrypted passwords, and rigorous `householdId` isolation on every database query.

## 3. Frequently Asked Questions (FAQ)

### Q1: Why is this software-only? Where are the smart meters?
**A:** "For this prototype, we focused exclusively on the predictive intelligence layer. The hardest part of HEMS isn't reading a meter; it's the algorithm that calculates *what to do* with that data against a dynamic tariff. By building a software-only digital simulator, we proved the optimization math works. Future integration with physical smart meters simply means injecting real telemetry instead of simulated data."

### Q2: Is the energy data real?
**A:** "No, we do not fabricate claims of real-world telemetry. The current engine uses a deterministic digital simulation. If you tell WattWise your washing machine uses 0.5 kW for 2 hours, it simulates exactly that impact across your home's energy grid, calculating the precise financial outcome."

### Q3: How does the optimization engine work? Is it AI?
**A:** "It is algorithmic, not a black-box LLM. It generates candidate schedules for every flexible appliance, evaluates them against the Time-of-Use tariff and the household's power limits, and mathematically selects the schedule with the lowest projected cost that satisfies user constraints."

### Q4: How is security handled?
**A:** "We implemented strict tenant isolation. Authentication runs via Auth.js (JWT cookies) at the Edge. Every database read and write is scoped via a server-side `getCurrentHousehold()` check, preventing IDOR (Insecure Direct Object Reference) and ensuring Customer A cannot see Customer B's energy data."

### Q5: How does it scale?
**A:** "The system uses Next.js serverless functions and a Neon PostgreSQL database with connection pooling. The optimization algorithm is stateless and deterministic, meaning it scales horizontally without requiring heavy infrastructure like Kubernetes or Redis."

### Q6: Why is the historical analytics chart empty initially?
**A:** "Our digital simulation generates the predicted day instantaneously, but we intentionally avoid spamming the database with high-frequency dummy `MeterReading` records. Historical optimization run analytics are tracked accurately whenever the optimizer completes."

## 4. Demo Flow Reminder
1. Log in.
2. Show the **Dashboard** and **Live Energy** to establish the "status quo."
3. Open **Intelligence** to reveal the system's analysis.
4. Execute **Optimization** to prove the system can solve the problem automatically.
5. Review the **Savings** to demonstrate financial impact.
6. Run a **What-If** scenario to highlight predictive power.
