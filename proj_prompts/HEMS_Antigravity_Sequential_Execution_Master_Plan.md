# HEMS — Antigravity Sequential Execution Master Plan

## Purpose

This document contains the complete sequence of implementation, audit, validation, and SIH-readiness prompts for the existing HEMS (Home Energy Management System).

The prompts are intentionally separated into phases.

**IMPORTANT:** Do not execute all phases blindly. Antigravity must execute them sequentially, inspect the result of each phase, and only proceed when the current phase satisfies its acceptance criteria.

---

# GLOBAL RULES FOR ANTIGRAVITY

These rules apply to every phase.

1. Treat the existing HEMS codebase as the source of truth.
2. Inspect the repository before changing anything.
3. Do not rewrite working architecture unnecessarily.
4. Do not introduce unrelated features during an audit/fix phase.
5. Do not use hardcoded/demo values where real backend values are required.
6. Do not claim PASS merely because the project compiles.
7. Numerical behavior and runtime behavior take priority over status labels.
8. Preserve existing:
   - authentication
   - database architecture
   - Prisma schema
   - optimization architecture
   - theme system
   - responsive layout
   - Live Energy Flow behavior
   - existing working APIs
9. Do not use `suppressHydrationWarning` to hide genuine hydration problems.
10. Frontend must not duplicate backend optimization calculations.
11. Never silently fabricate successful optimization results.
12. If a hard constraint is infeasible, explicitly identify infeasibility.
13. Before changing a subsystem, identify its actual files and dependencies.
14. After implementation, run the appropriate quality checks.
15. Do not mark a phase complete if a CRITICAL or HIGH functional issue remains.
16. When a phase changes code, inspect the diff and ensure unrelated files were not modified unnecessarily.
17. Keep a clear record of:
   - files inspected
   - files changed
   - tests run
   - results
   - remaining issues

## Standard quality commands

Use these where applicable:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npx prisma validate
```

If one of these commands does not exist in the repository, report that fact rather than inventing a replacement.

---

# PHASE 1 — CRITICAL POWER-LIMIT ENFORCEMENT AUDIT

## Objective

Determine whether the existing household power-limit implementation is actually correct.

Do NOT add new features.
Do NOT redesign the UI.
Do NOT modify unrelated functionality.

## Critical issue

A previous Dynamic Optimization audit reported:

- Household power limit = 2.0 kW
- Actual simulated household peak = 3.56 kW
- Test H was nevertheless marked PASS.

This is potentially a serious functional inconsistency.

If the household power limit is a HARD CONSTRAINT, then:

    Actual household peak <= configured power limit

must be true for a feasible optimized schedule.

A system that merely detects or logs a violation is NOT enforcing the constraint.

## STEP 1 — Trace the complete data flow

Inspect the actual implementation.

Trace:

Database
→ Household configuration
→ API
→ Optimization Engine
→ Solver
→ Appliance Scheduling
→ Simulation
→ Peak Calculation
→ OptimizationRun persistence
→ Analytics/API
→ Frontend

Inspect at minimum:

- Prisma schema
- Household model
- power-limit field
- optimization engine
- solver
- schedule generation
- simulateDay
- peak calculation
- optimization API route
- validation schemas
- analytics data flow

Do not assume filenames. Search the repository.

## STEP 2 — Determine power-limit semantics

Determine from the implementation/product behavior whether the power limit is:

A. HARD CONSTRAINT

B. SOFT OPTIMIZATION PENALTY

C. MONITORING/REPORTING VALUE ONLY

Explain exactly how this was determined.

Do not silently change the semantics.

## STEP 3 — Trace the mathematics

Document exactly how household peak is calculated.

Determine whether:

- base household load is included
- solar generation is accounted for correctly
- battery charging/discharging is accounted for correctly
- simultaneous appliance loads are summed
- EV load is included
- water heater load is included
- all 96 daily time slots are evaluated
- peak means maximum household load/import according to the project's definition
- power-limit comparison uses the same quantity as the reported peak

Show formulas or pseudocode.

## STEP 4 — Reproduce the 2.0 kW case

Create a deterministic test scenario:

Household power limit = 2.0 kW

Use enough appliance demand to exceed 2.0 kW if appliances overlap.

Run optimization.

Record:

- configured power limit
- baseline peak
- rule-based peak
- optimized peak
- baseline cost
- optimized cost
- appliance schedules
- maximum total household load
- maximum grid import
- whether the limit is violated

Use actual simulation output.

## STEP 5 — Multi-appliance test

Create a scenario where:

Base load
+
Appliance A
+
Appliance B

would exceed the configured limit if scheduled simultaneously.

Example:

Power limit = 3 kW
Appliance A = 2 kW
Appliance B = 2 kW

If both operate together:

    total = 4 kW

If the limit is hard, the optimizer should avoid the overlap.

## STEP 6 — Infeasible scenario

Create a deliberately impossible scenario.

Example:

Power limit = 1 kW
Required appliance demand = 3 kW
Operating window = only one available time slot

Determine what the system does.

It must NOT falsely claim successful optimization if no feasible schedule exists.

Clearly distinguish:

FEASIBLE
INFEASIBLE
FEASIBLE WITH SOFT VIOLATION

## STEP 7 — Limit sweep

Test:

- 1.5 kW
- 2.0 kW
- 3.0 kW
- sufficiently high limit

For each record:

Configured Limit
Baseline Peak
Optimized Peak
Constraint Satisfied?
Feasible?
Cost
Grid Import

## STEP 8 — Do not modify unnecessarily

During this phase, prefer investigation over implementation.

If a bug is found, explain:

1. where it occurs
2. why it occurs
3. what behavior it causes
4. smallest correct fix

## Phase 1 report

Return exactly:

1. Executive Summary
2. Current Power-Limit Semantics
3. Data Flow
4. Peak Calculation Logic
5. Root Cause of 2.0 kW vs 3.56 kW
6. Reproduction Results
7. Multi-Appliance Results
8. Infeasible Scenario Results
9. Limit-Sweep Results
10. Files Inspected
11. Recommended Fix
12. Risk Assessment
13. Final Verdict

Final verdict must be one of:

PASS — HARD CONSTRAINT CORRECTLY ENFORCED

PASS — POWER LIMIT INTENTIONALLY SOFT CONSTRAINT

FAIL — POWER LIMIT NOT CORRECTLY IMPLEMENTED

Do not use PASS merely because the system logs or tracks violations.

## Phase 1 gate

Proceed to Phase 2 only if the report identifies an actual implementation defect requiring correction.

If the power limit is already intentionally a soft constraint, do not force a hard-constraint redesign. Document the result and proceed to Phase 3.

---

# PHASE 2 — POWER-LIMIT ENFORCEMENT CORRECTION

Run this only if Phase 1 identified a genuine implementation problem.

## Objective

Correct ONLY the identified power-limit problem.

Do not redesign unrelated optimization logic.

If the household power limit is intended to be a HARD CONSTRAINT:

    maximum household demand <= configured power limit

must hold for every feasible optimized schedule.

## STEP 1 — Preserve architecture

Preserve:

- existing Prisma models
- OptimizationRun persistence
- existing simulation system
- tariff logic
- solar logic
- battery logic
- appliance configuration
- explainability where possible

Make the smallest correct architectural change.

## STEP 2 — Enforce during optimization

Do NOT merely calculate the violation after optimization.

The power constraint must influence schedule generation.

For each candidate schedule, calculate total household demand using the project's existing definitions.

Conceptually:

total household demand(t)
=
base load(t)
+
sum(appliance demand(t))
+
battery charging demand(t)
-
solar contribution(t)

Do not invent an incompatible formula.

If hard:

- reject infeasible candidate schedules, or
- otherwise enforce the constraint within the existing solver architecture.

## STEP 3 — Multi-appliance enforcement

The constraint must operate on aggregate household demand.

Example:

Appliance A = 2 kW
Appliance B = 2 kW
Limit = 3 kW

A+B simultaneously = 4 kW.

The optimizer must recognize combined demand.

## STEP 4 — Infeasibility

If no valid schedule exists:

- do not silently violate the hard constraint
- return meaningful infeasibility information
- identify affected appliance(s)
- identify violated constraint
- do not fabricate savings
- do not report an invalid schedule as fully optimized

## STEP 5 — Numerical verification

Run:

- 1.5 kW limit
- 2.0 kW limit
- 3.0 kW limit
- high/no practical limit

For every feasible hard-limit scenario:

    optimized peak <= limit

Record cost, grid import, schedules, and feasibility.

## STEP 6 — Regression

Repeat existing optimization scenarios:

- tariff change
- runtime change
- appliance power change
- operating-window change
- EV deadline
- solar increase
- battery reserve
- multi-appliance scenario
- deterministic repeated run

## STEP 7 — Quality

Run:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npx prisma validate
```

## Phase 2 report

Return:

1. Root Cause
2. Files Changed
3. Algorithmic Change
4. Constraint Enforcement Logic
5. Feasible Scenario Results
6. Infeasible Scenario Results
7. Regression Results
8. Before/After Numerical Comparison
9. Quality Checks
10. Final Verdict

Final verdict:

PASS — POWER LIMIT CORRECTLY ENFORCED

or

FAIL — POWER LIMIT STILL VIOLATED

## Phase 2 gate

Do not proceed if a feasible hard-limit scenario still violates the configured limit.

---

# PHASE 3 — BEFORE vs AFTER OPTIMIZATION UI

## Objective

Expose the real value of the existing Dynamic Optimization Engine.

Do NOT rewrite the optimization engine.

Do NOT create fake frontend calculations.

The UI must use actual persisted backend optimization results.

## Data-source rule

Frontend must NOT independently run:

- optimizeSchedule
- simulateDay
- heuristic solver
- optimization calculations

Backend remains the single source of truth.

Use the existing OptimizationRun/API architecture.

## UI

Create a polished comparison section.

### BEFORE OPTIMIZATION

Show:

- Energy Cost
- Peak Demand
- Grid Import
- Solar Usage

### AFTER OPTIMIZATION

Show the same metrics.

### IMPACT

Show:

- ₹ saved
- percentage cost reduction
- peak reduction
- grid-import reduction
- solar-utilization improvement

Only display mathematically valid percentages.

For example:

cost saving:

baselineCost - optimizedCost

percentage saving:

((baselineCost - optimizedCost) / baselineCost) × 100

Only calculate when baselineCost > 0.

Use the project's actual definitions.

## Design

Use the existing HEMS design system.

Keep:

- professional energy-dashboard appearance
- clean layout
- responsive behavior
- accessibility
- dark/light compatibility

Reuse existing Card, Badge, Button and typography components where appropriate.

## No hardcoding

Do NOT use hardcoded values such as:

"₹42 saved"
"32% reduction"

unless they come from real backend data.

## States

Handle:

- no optimization run
- optimization running
- optimization failed
- incomplete metrics
- zero baseline values
- no savings

Do not display misleading "0% savings" when data is absent.

## Responsive verification

Test:

375px
390px
430px
768px
1024px
1440px+

Check:

- no horizontal overflow
- no clipping
- no text collision
- no broken charts
- no layout shift

## Theme

Test light and dark mode.

Do not introduce hydration issues.

## Accessibility

Verify:

- semantic structure
- meaningful labels
- keyboard accessibility
- screen-reader-readable metrics
- information is not conveyed by color alone

## Tests

Test:

1. real optimization result
2. no optimization result
3. zero baseline cost
4. no savings
5. actual savings
6. large numerical values
7. dark mode
8. light mode
9. mobile widths

Run:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Phase 3 report

Return:

1. UI Architecture
2. Data Sources
3. Files Changed
4. Calculation Logic
5. Empty/Error States
6. Responsive Verification
7. Accessibility Verification
8. Theme Verification
9. Test Results
10. Final Verdict

Final verdict:

PASS — BEFORE/AFTER OPTIMIZATION UI COMPLETE

## Phase 3 gate

Do not proceed if the UI contains fabricated optimization data or independently recalculates backend optimization results.

---

# PHASE 4 — OPTIMIZATION EXPLAINABILITY / DECISION LOG

## Objective

Build an explainability layer for the existing Dynamic Optimization Engine.

DO NOT replace the optimization algorithm.

DO NOT create generic AI-generated explanations disconnected from actual decisions.

Every explanation must correspond to an actual optimization decision or measurable system condition.

## STEP 1 — Identify real decisions

Inspect the optimization engine and determine what decisions it actually makes.

Possible categories:

- appliance start-time shift
- scheduling-window selection
- EV charging shift
- battery charging/discharging
- solar utilization
- peak avoidance
- tariff avoidance
- power-limit avoidance

Do not claim decisions the algorithm does not actually make.

## STEP 2 — Structured decision data

Prefer structured decision records over raw strings.

Conceptually:

```text
{
  appliance,
  previousSchedule,
  optimizedSchedule,
  reasonCategory,
  reason,
  impact,
  affectedMetric
}
```

Use the existing architecture/types where possible.

Do not duplicate optimization calculations in the frontend.

## STEP 3 — Reason categories

Possible categories:

- LOWER_TARIFF
- SOLAR_AVAILABILITY
- PEAK_AVOIDANCE
- POWER_LIMIT
- BATTERY_SUPPORT
- DEADLINE_CONSTRAINT
- OPERATING_WINDOW
- NO_CHANGE_NEEDED

Only use a category when actual data supports it.

## STEP 4 — Decision Log UI

Create a user-facing section such as:

"Optimization Decisions"

Each decision should communicate:

WHAT CHANGED
WHY
IMPACT

Example:

Water Heater
17:00 → 10:00

Reason:
Solar generation available during the selected period.

Impact:
Lower grid consumption and lower energy cost.

These are examples only. Generate actual explanations from actual data.

## STEP 5 — No-change explanations

If an appliance did not move, do not imply optimization failed.

A valid explanation may be:

"Water Heater remained at 10:00 because the current schedule was already optimal under the configured tariff and solar conditions."

Only display this when supported by actual optimizer data.

## STEP 6 — Summary

Add an actual summary such as:

"Optimization analyzed X appliances and changed Y schedules."

Then show actual:

- cost impact
- peak impact
- grid impact
- solar impact

## STEP 7 — Responsive

Verify:

375px
390px
430px
768px
1024px
1440px

## STEP 8 — Theme

Verify both themes.

Ensure no hydration mismatch.

## STEP 9 — Tests

Test:

- appliance moved
- appliance unchanged
- EV shifted
- solar-driven decision
- tariff-driven decision
- power-limit decision
- infeasible scenario
- optimization failure

Do not fabricate reasons.

Run:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Phase 4 report

Return:

1. Decision Model
2. Data Flow
3. Decision Categories
4. UI Components
5. Example Real Decisions
6. Edge Cases
7. Responsive Verification
8. Accessibility Verification
9. Test Results
10. Final Verdict

Final verdict:

PASS — EXPLAINABILITY LAYER COMPLETE

## Phase 4 gate

No fabricated or unsupported explanations are allowed.

---

# PHASE 5 — SIH DEMONSTRATION MODE

## Objective

Create a controlled, repeatable demonstration mode for the HEMS.

Do NOT replace the real optimization engine.

Do NOT fake optimization results.

Do NOT hardcode fake "AI" claims.

## Demo scenario

Create a clearly labelled demo scenario with valid project ranges for:

- household base load
- solar generation
- battery capacity
- battery reserve
- EV
- water heater
- appliance windows
- tariffs
- household power limit

Use actual schema-supported values.

## Demo flow

### Step 1 — Household State

Show:

Solar
Battery
Grid
EV
Water Heater
Other Appliances

### Step 2 — Before Optimization

Display:

- cost
- peak demand
- grid import
- solar usage

### Step 3 — Run Optimization

Show actual optimization state.

Do not fake progress percentages.

If backend returns runtime, use it.

### Step 4 — Explain Decisions

Show actual decisions generated by the optimization engine.

### Step 5 — After Optimization

Show:

- optimized cost
- optimized peak
- optimized grid import
- optimized solar usage

### Step 6 — Impact

Highlight actual:

- ₹ savings
- cost reduction %
- peak reduction
- grid reduction
- solar utilization

## Demo reset

Provide a safe reset mechanism.

Reset must affect only demo state/data.

Do not destroy production household data.

## Identification

Clearly show:

"Demo Mode"

## Error handling

If optimization fails:

- show actual error state
- do not pretend success
- provide recovery/reset where appropriate

## Responsive

Verify:

375px
390px
430px
768px
1024px
1440px

## Theme

Verify light and dark.

## Performance

Measure actual optimization runtime.

Do not add artificial delays merely to make the demo look impressive.

## Repeatability

Run the demo from a clean state multiple times.

Verify deterministic behavior where deterministic inputs are expected.

Verify reset restores the expected initial scenario.

## Quality

Run:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npx prisma validate
```

## Phase 5 report

Return:

1. Demo Architecture
2. Demo Scenario
3. Demo Flow
4. Data Sources
5. Reset Mechanism
6. Error Handling
7. Performance
8. Responsive Verification
9. Test Results
10. Final Verdict

Final verdict:

PASS — SIH DEMO MODE COMPLETE

---

# PHASE 6 — FULL END-TO-END SYSTEM AUDIT

## Objective

Act as a strict QA engineer and technical auditor.

Do not add features unless required to fix a verified defect.

Verify the complete HEMS from user input to persisted optimization result and final UI.

## Core flow

Verify:

USER INPUT
↓
FRONTEND
↓
API
↓
DATABASE
↓
OPTIMIZATION ENGINE
↓
SCHEDULE
↓
SIMULATION
↓
METRICS
↓
OptimizationRun
↓
ANALYTICS/API
↓
FRONTEND

Every step must use current correct data.

## Test matrix

### Household

- base load
- power limit
- battery
- solar

### Appliances

- add
- edit
- delete
- power
- runtime
- operating window
- priority
- EV deadline

### Tariff

- modification
- peak period
- off-peak period
- solar period

### Optimization

- baseline
- rule-based
- optimized
- multi-appliance
- power-limit constraint
- infeasible case

### Analytics

Verify displayed values correspond to persisted backend results.

## Stale-data test

Change an appliance.

Run optimization.

Verify result reflects the new configuration.

Change it again.

Verify the second run does not reuse stale values.

## Repeatability

Run the same deterministic scenario at least 5 times.

Compare:

- cost
- peak
- grid import
- solar usage
- schedule

Investigate unexpected nondeterminism.

## Error testing

Test:

- invalid appliance
- missing data
- invalid tariff
- API failure
- database failure where safely testable
- optimization failure
- infeasible schedule

Frontend must not display false success.

## Responsive

Test:

375px
390px
430px
768px
1024px
1440px

Check all major routes.

## Theme

Test:

Light
Dark
Refresh
Navigation
Direct route load

Verify no hydration warnings.

## Browser console

Verify:

- no hydration errors
- no React errors
- no uncaught exceptions
- no repeated API failures

Ignore only clearly identified harmless development-only messages.

## Quality

Run:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npx prisma validate
```

## Phase 6 report

Return:

1. System Architecture
2. E2E Data Flow
3. Test Matrix
4. Passed Tests
5. Failed Tests
6. Bugs Found
7. Severity
8. Fix Recommendations
9. Quality Checks
10. Final Verdict

Classify bugs:

CRITICAL
HIGH
MEDIUM
LOW

Final verdict:

PASS — E2E VALIDATED

or

FAIL — CRITICAL/HIGH ISSUES REMAIN

## Phase 6 gate

Any unresolved CRITICAL or HIGH issue blocks the next phase.

---

# PHASE 7 — PERFORMANCE + SECURITY AUDIT

## Objective

Perform a production-oriented audit.

Do not redesign the application.

Do not add unnecessary infrastructure.

Identify actual risks from the repository.

## Performance

Measure:

- optimization runtime
- API response time
- database query behavior
- repeated queries
- unnecessary renders
- unnecessary optimization executions
- payload size
- repeated calculations

Verify optimization does not execute unexpectedly on page render.

## Database

Inspect:

- indexes
- query patterns
- N+1 behavior
- unnecessary findMany calls
- transaction boundaries
- validation

Do not create indexes without evidence.

## API security

Inspect:

- authentication
- authorization
- API validation
- input validation
- error handling
- sensitive information in errors
- unrestricted mutation endpoints
- server/client trust boundaries

Verify client cannot manipulate server-controlled values improperly.

## Optimization input validation

Test invalid values including:

- negative power
- negative runtime
- impossible windows
- absurd appliance values
- invalid tariffs
- invalid battery percentages
- invalid household limits

Use existing validation architecture.

## Secrets

Search for:

- API keys
- passwords
- tokens
- database credentials
- private secrets

Do not print actual secret values.

## Frontend

Check:

- unsafe HTML rendering
- untrusted dynamic content
- client-side trust assumptions
- sensitive data exposure

## Phase 7 report

Return:

1. Performance Findings
2. Database Findings
3. API Findings
4. Validation Findings
5. Authentication/Authorization Findings
6. Secret Exposure Findings
7. Frontend Security Findings
8. Severity Classification
9. Recommended Fixes
10. Quality Checks
11. Final Verdict

Use:

PASS — NO HIGH/CRITICAL ISSUES FOUND

or

FAIL — HIGH/CRITICAL ISSUES REQUIRE FIXING

Do not claim "secure" merely because no obvious issue was found.

## Phase 7 gate

Fix and retest all CRITICAL/HIGH findings before Phase 8.

---

# PHASE 8 — FINAL SIH READINESS AUDIT

## Objective

Perform final product polish after all functional, explainability, E2E, performance and security validation.

Do NOT introduce major architecture changes.

Do NOT add features merely for visual complexity.

Prioritize reliability, clarity and demonstration quality.

## 1. User journey

Verify:

Login
→ Dashboard
→ Household state
→ Energy flow
→ Appliances
→ Tariff
→ Optimization
→ Before/After
→ Decisions
→ Analytics

The user should understand:

- current state
- what happened
- what optimization changed
- why it changed
- what benefit resulted

## 2. Navigation

Verify every major route:

- loads correctly
- correct navigation state
- no overflow
- no console errors
- respects theme

## 3. Visual consistency

Check:

- typography
- spacing
- cards
- buttons
- badges
- icons
- charts
- empty states
- loading states
- error states

Do not unnecessarily redesign working components.

## 4. Live Energy Flow

Re-verify the previously fixed component.

DO NOT alter its layout unless a regression is actually discovered.

Check:

- Solar
- Grid
- Home
- Battery
- EV
- arrows
- animations
- mobile layout

## 5. Optimization

Verify:

- optimization is real
- results are persisted
- before/after numbers are real
- explanations correspond to actual decisions
- power limit is correctly handled
- infeasible scenarios are handled honestly

## 6. Hydration

Hard refresh all major routes in:

Light mode
Dark mode

Verify:

NO hydration mismatch warnings.

## 7. Mobile

Explicitly test:

375px
390px
430px

No:

- horizontal scrolling
- clipping
- overlapping
- unreadable text
- inaccessible controls

## 8. Final quality

Run:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npx prisma validate
```

## 9. Final report

Return:

1. Product Journey
2. Route Verification
3. UI Consistency
4. Live Energy Flow Verification
5. Optimization Verification
6. Explainability Verification
7. Hydration Verification
8. Mobile Verification
9. Performance
10. Security
11. Remaining Issues
12. SIH Demo Readiness
13. Final Verdict

Final verdict must be:

SIH READY

or

NOT SIH READY

If NOT SIH READY, list exact blockers and severity.

---

# MASTER STOP / GO RULES

At the end of every phase:

1. Stop.
2. Generate the phase report.
3. Compare results against the acceptance criteria.
4. Do not silently continue if the gate failed.
5. If a blocker exists, fix it only when the current phase authorizes fixing.
6. Re-run affected tests after a fix.
7. Only then continue.

## Never do this

Do NOT:

- skip Phase 1 because the previous report said PASS
- assume a numerical constraint is enforced because it is logged
- fabricate optimization savings
- hardcode dashboard results
- generate fake explainability
- suppress hydration warnings
- redesign working components unnecessarily
- mark an infeasible optimization as successful
- declare SIH READY with unresolved HIGH/CRITICAL defects

---

# FINAL SUCCESS CONDITION

The HEMS is considered ready only when all applicable phases satisfy their gates and the final audit returns:

SIH READY

with:

- no unresolved CRITICAL issues
- no unresolved HIGH issues
- real backend-driven optimization results
- verified power-limit behavior
- verified before/after impact
- data-driven explainability
- repeatable SIH demo
- successful E2E validation
- no unresolved hydration issues
- acceptable performance
- no unresolved high/critical security issues
- clean lint/typecheck/test/build/Prisma validation
