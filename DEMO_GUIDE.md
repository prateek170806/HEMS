# WattWise Demonstration Guide

This guide outlines the canonical presentation flow for the Smart India Hackathon (SIH) demonstration. It tells a cohesive 5-7 minute story highlighting problem, digital simulation, explainable intelligence, optimization, and financial savings.

## 1. Demo Preparation

### Demo Account
Use the canonical SIH demo account:
- **Email:** `demo@wattwise.local`
- **Password:** `demo123`

### Reset Procedure
**Before the demo begins, you MUST reset the environment to its canonical state:**
1. Log in as `demo@wattwise.local`.
2. Navigate to the **Dashboard**.
3. Scroll to the bottom and click the **Reset Demo** button.
4. This ensures the Green Valley Residence configuration (3 appliances, specific TOU tariff, and baseload) is restored to default, clearing any previous optimization runs or scenario changes.

### Fallback Procedure
If the live production deployment fails (e.g., Vercel outage):
1. **Primary Fallback:** Launch `npm start` on a local machine pointing to a backup Neon database.
2. **Emergency Fallback:** Use the pre-recorded video presentation (which demonstrates exactly this flow). NEVER fake results.

---

## 2. Demonstration Sequence (5-7 Minutes)

### Phase 1: Problem & Digital Dashboard (1 min)
- **Action:** Show the main Dashboard.
- **Talking Point:** Explain that households have zero visibility into their actual energy costs based on complex Time-of-Use tariffs.
- **Highlight:** WattWise solves this with a **Digital Energy Simulation** engine. Point out the live simulated metrics (Power Demand, Grid Import vs Solar, Battery Status). Emphasize this is 100% software-based without requiring physical meters.

### Phase 2: Live Energy Simulation (1 min)
- **Action:** Navigate to **Live Energy**.
- **Talking Point:** Demonstrate how the system models energy flows dynamically. Show the baseload, the real-time cost calculator, and how solar offsets grid consumption during the day.

### Phase 3: Intelligence & Recommendations (1 min)
- **Action:** Navigate to the **Intelligence Center**.
- **Talking Point:** Show how WattWise analyzes the simulated baseline. It detects anomalies (e.g., "Washing Machine running during Peak hours") and proposes algorithmic, deterministic recommendations. Emphasize that this is explainable math, not black-box "AI magic."

### Phase 4: Optimization (1 min)
- **Action:** Navigate to **Optimization** and hit **Run Optimizer**.
- **Talking Point:** Explain that the engine evaluates candidate schedules against the tariff structure, power limits, and appliance constraints.
- **Highlight:** Show the before-and-after schedule graph. The EV and Washing Machine shift to off-peak hours!

### Phase 5: Financial Impact & Analytics (1 min)
- **Action:** Open the **Savings Center**.
- **Talking Point:** Point out the actual financial impact (e.g., Baseline Cost vs Optimized Cost). WattWise proves its value mathematically.
- **Highlight:** Show the **Analytics** page for historical optimization runs, proving the system logs and learns over time.

### Phase 6: What-If Scenario Sandbox (1 min)
- **Action:** Open the **What-If** tool.
- **Talking Point:** Explain how users can test decisions. "What if I add more solar panels?" or "What if the grid tariff prices jump by 20%?" WattWise will resimulate the household and project the new optimization outcome.

### Phase 7: Architecture & Security (30s)
- **Action:** Show the **Profile** page or discuss the backend.
- **Talking Point:** Explain that WattWise is a secure, multi-tenant SaaS. Household data is rigorously isolated using JWT sessions and explicit database boundaries. Concurrency locking handles simultaneous optimizations flawlessly.

---

## Expected Canonical Results
When running the optimizer on the reset Green Valley Residence:
- **Baseline Cost:** ~₹82.55
- **Optimized Cost:** ~₹6.65
- **Peak Load:** Kept under the 5.5 kW threshold.
- The Water Heater stays at its 10:00-20:00 required window.
- The EV and Washing machine shift entirely into the cheaper Night/Morning off-peak bands.
