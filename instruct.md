# MASTER PROMPT — BUILD THE COMPLETE HEMS WEB APPLICATION

You are an expert **full-stack software architect, senior React/Next.js engineer, UI/UX designer, data visualization engineer, IoT engineer, optimization engineer, QA engineer, security engineer, and Vercel deployment specialist**.

Your task is to **design, implement, test, debug, polish, and prepare for deployment a fully functioning Smart Home Energy Management & Tariff Scheduler (HEMS) web application** based on the project specification below.

This is NOT a request for a static UI mockup.

Build a **working end-to-end application** with:

* professional UI/UX;
* responsive design;
* functional navigation;
* realistic energy data;
* appliance management;
* tariff management;
* scheduling;
* optimization;
* forecasting;
* solar integration;
* battery simulation;
* EV integration;
* analytics;
* notifications;
* user preferences;
* explainable optimization decisions;
* simulation mode;
* IoT/device abstraction;
* API/backend;
* database persistence;
* validation;
* error handling;
* automated tests;
* seed/demo data;
* production build;
* Vercel deployment readiness.

Do not leave major features as placeholders.

If a physical hardware integration cannot be performed in the web environment, implement a **realistic device simulator/mock IoT layer** behind a clean abstraction so that actual devices can later replace the simulator without redesigning the application.

---

# 1. PROJECT CONTEXT

Project:

**Smart Home Energy Management & Tariff Scheduler (HEMS)**

Formal academic title:

**Design and Development of a Tariff-Aware Smart Home Energy Management System for Optimal Residential Load Scheduling and Demand-Side Energy Management**

Research focus:

**Forecast-informed, comfort-constrained, tariff-aware optimization of flexible residential electricity loads with optional solar, battery, and EV integration.**

The application must demonstrate the central concept:

> Do not merely monitor electricity consumption. Automatically make intelligent decisions about WHEN flexible electricity consumption should occur.

The system should demonstrate how household electricity consumption can be:

* monitored;
* forecast;
* priced according to tariffs;
* optimized;
* scheduled;
* controlled;
* explained;
* analyzed.

The system should be suitable for:

1. academic demonstration;
2. project evaluation;
3. research experimentation;
4. portfolio presentation;
5. future IoT integration.

---

# 2. IMPORTANT DEVELOPMENT PRINCIPLE

Do NOT build a fake dashboard where buttons only change visual state.

Every important interaction should perform a meaningful operation.

Examples:

* Adding an appliance should persist it.
* Editing appliance constraints should affect scheduling.
* Changing tariff periods should affect optimization results.
* Running optimization should calculate a schedule.
* Changing optimization preferences should change the objective.
* Manual override should modify the schedule.
* Battery SOC should influence battery decisions.
* Solar forecast should influence scheduling.
* EV departure requirements should constrain charging.
* Analytics should be calculated from stored/simulated data.
* Notifications should correspond to actual system events.

Where real-world data or hardware is unavailable, use a deterministic simulation engine.

---

# 3. RECOMMENDED TECHNOLOGY STACK

Use a modern Vercel-friendly architecture.

Preferred stack:

* Next.js with App Router
* TypeScript
* React
* Tailwind CSS
* shadcn/ui or an equivalent accessible component system
* Lucide icons
* Recharts or another reliable React charting library
* Zod for validation
* React Hook Form where appropriate
* PostgreSQL-compatible persistence
* Prisma ORM if appropriate
* API routes / server actions
* Vitest or Jest for unit tests
* Playwright for end-to-end testing
* ESLint
* Prettier
* Vercel-ready build configuration

For optimization:

* Prefer a server-side optimization service/module.
* If a native MILP solver is impractical in the Vercel runtime, create a clean optimization abstraction and implement a deterministic browser/server-compatible scheduling solver for the deployed demo.
* The architecture must make it possible to replace that solver with OR-Tools, PuLP, Pyomo, Gurobi, CPLEX, or another MILP service later.

Do NOT make the application dependent on a local Python server for the deployed version.

The Vercel deployment must work without requiring the user to manually run another backend server.

---

# 4. APPLICATION ARCHITECTURE

Build the application using clear layers:

```text
UI / Presentation
        ↓
Application / Server Actions / API
        ↓
Domain Services
        ↓
Optimization / Forecasting / Tariff Engine
        ↓
Persistence
        ↓
Device / IoT Abstraction
        ↓
Simulator OR Real Device
```

Recommended conceptual modules:

```text
/auth
/dashboard
/appliances
/schedules
/tariffs
/forecast
/solar
/battery
/ev
/analytics
/demand-response
/devices
/notifications
/settings
/simulation
```

Keep business logic separate from UI components.

Do not put optimization calculations directly inside random React components.

---

# 5. CORE USER PERSONA

Design primarily for a household user who wants:

* lower electricity bills;
* visibility into consumption;
* automated scheduling;
* control over appliances;
* comfort protection;
* solar/battery utilization;
* understandable recommendations.

The user should NOT need to understand optimization theory.

The interface should translate technical concepts into understandable language.

For example:

Instead of:

> MILP objective coefficient β = 0.4

show:

> Peak reduction priority: Medium

Instead of:

> Binary decision x(i,t) = 1

show:

> Washing machine scheduled for 2:00 PM–4:00 PM

---

# 6. DESIGN DIRECTION

Create a **premium, modern energy-tech dashboard**.

Do NOT create a generic admin dashboard.

Visual inspiration should be conceptually similar to:

* modern smart-home applications;
* premium energy dashboards;
* EV charging interfaces;
* climate-tech products;
* fintech dashboards.

The design should communicate:

**energy + intelligence + sustainability + control**

Use a sophisticated visual system with:

* clean cards;
* subtle gradients;
* rounded surfaces;
* excellent spacing;
* strong typography;
* clear hierarchy;
* meaningful iconography;
* elegant charts;
* subtle animations;
* dark/light theme support if practical.

Do not overuse glassmorphism.

Do not make the interface visually noisy.

Do not use excessive gradients.

Prioritize readability and information hierarchy.

---

# 7. COLOR SYSTEM

Create a professional semantic color system.

Suggested semantic meanings:

* Green → renewable energy / savings / healthy system
* Amber → warnings / upcoming peak
* Red → critical issue / failed device / excessive demand
* Blue → grid / information
* Purple → optimization / intelligence
* Neutral → general UI

Do not hard-code colors throughout components.

Create reusable design tokens.

Make the design accessible and ensure sufficient contrast.

---

# 8. GLOBAL APP SHELL

Create:

### Desktop

Left sidebar:

```text
HEMS
Smart Energy

Overview
Live Energy
Appliances
Schedule
Tariffs
Forecast
Solar
Battery
EV
Analytics
Demand Response
Devices
Notifications
Simulation
Settings
```

Bottom/sidebar profile area:

```text
Home
Green Valley Residence

System:
● Online
```

Top bar:

* page title;
* date;
* current tariff;
* system status;
* notification icon;
* user/profile menu.

### Mobile

Use a responsive mobile navigation system.

Do not simply shrink the desktop UI.

Create proper mobile layouts.

---

# 9. DASHBOARD / OVERVIEW

Create an impressive home dashboard.

Top summary cards:

### Current Power

Example:

```text
3.42 kW
Current household demand
↓ 8.2% vs yesterday
```

### Today's Energy

```text
18.7 kWh
```

### Estimated Today's Cost

```text
₹126.40
```

### Peak Demand

```text
4.8 kW
```

### Solar

```text
2.7 kW
Generating
```

### Battery

```text
74%
```

Use demo values initially, but calculate them from the application state.

---

# 10. LIVE ENERGY VISUALIZATION

Create a live energy chart.

Display:

* household load;
* solar generation;
* grid import;
* battery charge/discharge.

Time ranges:

* 1 hour
* 6 hours
* 24 hours
* 7 days

The chart should update in simulation mode.

Use realistic but deterministic demo data.

Avoid meaningless random values that change every render.

---

# 11. ENERGY FLOW VISUALIZATION

Create a visually impressive energy-flow component.

Example:

```text
                 ☀ SOLAR
                 3.2 kW
                    │
                    ▼
             ┌─────────────┐
             │    HOME     │
             │   2.1 kW    │
             └─────────────┘
               ▲         ▲
               │         │
          BATTERY       GRID
           +0.8 kW      0.0 kW
```

Represent:

* solar → home;
* solar → battery;
* solar → grid;
* grid → home;
* battery → home.

Animate flows subtly.

The visualization must respond to simulated system state.

---

# 12. CURRENT TARIFF WIDGET

Show:

```text
CURRENT TARIFF

₹8.00 / kWh

PEAK

18:00–22:00

Next cheaper period:
22:00
```

Add a 24-hour tariff timeline.

Use clearly differentiated periods:

* Off-peak
* Normal
* Solar/low-price
* Peak

Important:

The report specifies illustrative tariff periods only.

Treat these as **demo tariff data**, not official utility tariffs.

Make the tariff engine configurable.

---

# 13. PEAK ALERT

If current/projected demand approaches the household power limit:

Display:

```text
⚠ Peak Demand Risk

Projected demand: 5.1 kW
Household limit: 5.5 kW

HEMS recommends delaying:
Dishwasher
```

Include:

**Apply Recommendation**

and

**Ignore**

buttons.

The actions must work.

---

# 14. TODAY'S OPTIMIZED SCHEDULE

Create a timeline showing:

```text
13:00
Washing Machine
Scheduled

14:00
Water Heater
Scheduled

16:00
Battery Charging
Scheduled

17:00
EV Charging
Paused

18:00
Peak Period
HVAC Optimized

22:00
EV Charging
Resumed
```

Each item should show:

* appliance;
* start;
* end;
* status;
* estimated cost;
* reason.

---

# 15. OPTIMIZATION CENTER

Create a dedicated `/schedules` or `/optimization` page.

Header:

```text
Optimization Center

Create the lowest-cost schedule while respecting
your appliances, deadlines, comfort, and power limits.
```

Controls:

### Optimization horizon

* 6 hours
* 12 hours
* 24 hours

### Strategy

* Economic
* Balanced
* Comfort
* Green

### Objectives

Sliders:

```text
Cost
Peak Reduction
Comfort
Carbon
```

### Constraints

* Household power limit
* Appliance deadlines
* Minimum runtimes
* Battery reserve
* EV departure SOC
* HVAC comfort range

Button:

**Run Optimization**

While running:

```text
Analyzing tariff...
Forecasting demand...
Checking appliance constraints...
Optimizing schedule...
Validating result...
```

Do not fake an endless loading state.

---

# 16. OPTIMIZATION ENGINE

Implement a real scheduling engine.

Use the mathematical concepts from the report.

Time discretization:

```text
t = 1 ... T
```

For binary appliances:

```text
x(i,t) ∈ {0,1}
```

For variable-power appliances:

```text
0 ≤ P(i,t) ≤ P_i
```

Household load:

```text
L(t) = B(t) + Σ P(i,t)
```

With solar:

```text
GridImport(t) = max(0, L(t) - Solar(t))
```

With battery:

```text
GridImport(t) =
max(0, L(t) - Solar(t) - BatteryDischarge(t) + BatteryCharge(t))
```

Cost:

```text
Cost = Σ Price(t) × GridImport(t) × Δt
```

Peak:

```text
Peak = max(GridImport(t))
```

Objective concept:

```text
J =
α × Cost
+ β × Peak
+ γ × Discomfort
+ δ × CarbonImpact
+ ε × SwitchingPenalty
```

Implement the deployed demo using a solver that is practical in the selected runtime.

The result must actually depend on:

* tariff;
* base load;
* appliance constraints;
* solar;
* battery;
* EV;
* user preferences.

---

# 17. APPLIANCE MANAGEMENT

Create `/appliances`.

Show appliance cards/table.

Each appliance should contain:

* name;
* category;
* rated power;
* status;
* flexibility;
* runtime;
* allowed window;
* priority;
* interruptibility;
* next scheduled time.

Example:

```text
Washing Machine

0.50 kW
Flexible
2h runtime

Allowed:
13:00–20:00

Priority:
Medium

[Edit]
[Run Now]
[Disable Automation]
```

---

# 18. APPLIANCE FORM

Allow creation/editing of:

```text
Name
Rated Power
Minimum Runtime
Maximum Runtime
Earliest Start
Latest Finish
Interruptible
Priority
Comfort Level
Automation Enabled
```

Validation must be implemented.

Examples:

* runtime cannot be negative;
* earliest start cannot be after latest finish;
* power must be positive;
* required fields must be present.

---

# 19. APPLIANCE FLEXIBILITY

Support these categories:

### Non-flexible

Must operate immediately/fixed.

### Shiftable

Can move within a window.

### Interruptible

Can pause/resume.

### Thermostatically controlled

Can vary within comfort limits.

### Energy storage

Battery/EV.

### Critical

Should not be automatically interrupted.

Display these clearly in the UI.

---

# 20. TARIFF MANAGEMENT

Create `/tariffs`.

Allow users to configure tariff periods.

Fields:

```text
Period name
Start time
End time
Price per kWh
Period type
Effective date
Expiry date
```

Support:

* flat tariff;
* TOU;
* ToD;
* seasonal periods;
* peak;
* off-peak;
* solar hours.

Create a visual 24-hour tariff timeline.

---

# 21. TARIFF DATA STRUCTURE

Use a structure conceptually similar to:

```json
{
  "currency": "INR",
  "periods": [
    {
      "start": "00:00",
      "end": "06:00",
      "price": 4.0,
      "type": "off_peak"
    },
    {
      "start": "06:00",
      "end": "17:00",
      "price": 6.0,
      "type": "normal"
    },
    {
      "start": "17:00",
      "end": "22:00",
      "price": 8.0,
      "type": "peak"
    },
    {
      "start": "22:00",
      "end": "24:00",
      "price": 5.0,
      "type": "normal"
    }
  ]
}
```

Again, these are **demo values only**.

Never represent them as an actual utility tariff.

---

# 22. FORECASTING PAGE

Create `/forecast`.

Show:

### Load Forecast

* actual load;
* predicted load;
* confidence/uncertainty visualization if implemented.

### Forecast horizon

* next 6 hours;
* next 12 hours;
* next 24 hours.

Implement a baseline forecasting model first.

Use:

* historical average;
* same-hour historical data;
* moving average.

Optionally provide a more advanced statistical/ML model.

The application must calculate forecast metrics:

* MAE;
* RMSE;
* MAPE where appropriate.

Do not claim accuracy values that were not actually measured.

---

# 23. SOLAR PAGE

Create `/solar`.

Show:

* current solar generation;
* today's generation;
* solar forecast;
* solar self-consumption;
* solar-to-home;
* solar-to-battery;
* solar-to-grid.

Example:

```text
Solar Today
14.8 kWh

Self Consumption
82%

Current
3.2 kW
```

Show a solar generation chart.

---

# 24. BATTERY PAGE

Create `/battery`.

Show:

* SOC;
* capacity;
* charge power;
* discharge power;
* reserve SOC;
* efficiency;
* today's charging;
* today's discharging.

Visual:

Large circular SOC indicator.

Show battery timeline:

```text
00:00  62%
06:00  58%
12:00  81%
18:00  73%
22:00  55%
```

Implement battery equations from the project report.

Include:

```text
SOCmin ≤ SOC(t) ≤ SOCmax
```

and configurable reserve.

---

# 25. EV PAGE

Create `/ev`.

Show:

* EV connected/disconnected;
* current SOC;
* battery capacity;
* arrival time;
* departure time;
* charging power;
* required departure SOC;
* current charging state.

Example:

```text
EV

67%
Current SOC

Departure
07:00

Required
90%

Charging
Paused

Reason:
Peak tariff
```

The optimizer must ensure:

```text
SOC(departure) ≥ SOC_required
```

---

# 26. ANALYTICS PAGE

Create `/analytics`.

Sections:

### Energy

* daily;
* weekly;
* monthly.

### Cost

* total cost;
* cost by tariff period;
* projected bill.

### Peak

* peak demand;
* peak timeline;
* peak reduction.

### Appliance Contribution

Pie/bar chart.

### Savings

Show:

```text
Baseline Cost
₹4,820

HEMS Cost
₹4,130

Estimated Saving
₹690

Saving %
14.3%
```

These values must be calculated from application data.

Do not hard-code fake KPI results.

---

# 27. BASELINE COMPARISON

Create a dedicated comparison component.

Compare:

```text
User-Driven
Rule-Based
HEMS Optimization
```

Metrics:

* total cost;
* peak demand;
* energy;
* solar self-consumption;
* comfort violation;
* task completion;
* optimization time.

This is especially important for the academic research aspect.

---

# 28. SAVINGS CALCULATION

Implement:

```text
Cost Saving (%) =
((Baseline Cost - HEMS Cost) / Baseline Cost) × 100
```

Energy:

```text
Energy Saving (%) =
((Baseline Energy - HEMS Energy) / Baseline Energy) × 100
```

Peak:

```text
Peak Reduction (%) =
((Baseline Peak - HEMS Peak) / Baseline Peak) × 100
```

Solar:

```text
Solar Self-Consumption (%) =
(Solar Used Locally / Solar Generated) × 100
```

Display formulas in an optional "How calculated?" dialog.

---

# 29. EXPLAINABLE AI / EXPLAINABLE SCHEDULING

This is a key feature.

Every automatic scheduling decision should have an explanation.

Example:

```text
Why was the water heater moved?

HEMS moved it from 18:00 to 14:00 because:

✓ Electricity price is lower
✓ Solar generation is available
✓ Your 20:00 deadline is still satisfied
✓ Household power limit is respected

Estimated impact:

₹8.00 lower cost
0.0 kW comfort impact
```

Create a reusable `DecisionExplanation` component.

---

# 30. USER MODES

Implement:

### Eco Mode

Prioritize:

* cost;
* peak;
* efficiency.

### Balanced Mode

Balance:

* cost;
* peak;
* comfort.

### Comfort Mode

Prioritize:

* comfort;
* deadlines;
* convenience.

### Green Mode

Prioritize:

* renewable usage;
* solar;
* carbon-aware scheduling.

Changing modes must modify optimization weights.

---

# 31. DEMAND RESPONSE PAGE

Create `/demand-response`.

Allow simulation of a DR event:

```text
Demand Response Event

18:00–20:00
Target reduction: 2 kW
```

The system should determine what flexible loads can be shifted.

Possible actions:

* delay washing machine;
* pause EV;
* reduce HVAC;
* discharge battery;
* delay water heater.

Display:

```text
Target:
2.0 kW

Expected reduction:
2.4 kW

Status:
Target achieved
```

Allow:

**Simulate Event**

---

# 32. DEVICE MANAGEMENT

Create `/devices`.

Show:

* device;
* type;
* connection;
* protocol;
* last seen;
* state;
* controllability.

Example:

```text
Living Room Smart Plug
MQTT
● Online
2.4 kW
```

Support simulated protocols:

* MQTT;
* HTTP;
* Matter;
* generic device API.

Do not actually require physical hardware.

Create an abstraction:

```text
DeviceInterface
├── SimulatedDevice
├── MQTTDevice
├── HTTPDevice
└── FutureMatterDevice
```

---

# 33. SIMULATION MODE

Create `/simulation`.

This is extremely important for a deployable academic demo.

Allow users to simulate:

* household load;
* tariff changes;
* solar generation;
* appliance use;
* battery SOC;
* EV arrival;
* EV departure;
* demand response event;
* forecast error;
* network failure;
* sensor failure.

Create controls such as:

```text
Simulation Speed
[1x] [2x] [5x]

Solar
[Low] [Normal] [High]

Household Demand
[Low] [Normal] [High]

Tariff
[Normal] [Peak Heavy]
```

Include:

**Reset Simulation**

---

# 34. FORECAST ERROR EXPERIMENT

Create a research experiment tool.

Allow:

```text
Forecast Error

5%
10%
20%
30%
```

Run the scheduling algorithm against simulated forecast errors.

Show:

* cost;
* peak;
* comfort;
* schedule robustness.

This directly supports the experimental methodology from the report.

---

# 35. OPTIMIZATION EXPERIMENT LAB

Create a research-focused page.

Allow comparison:

```text
Baseline
Rule-Based
MILP-style Optimization
Rolling Horizon
```

For each algorithm show:

* cost;
* peak;
* comfort;
* runtime;
* completed tasks.

Generate charts.

Allow exporting experiment results to CSV/JSON if practical.

---

# 36. NOTIFICATIONS

Create notification center.

Notification types:

### High Projected Bill

```text
Projected bill is 12% higher than usual.
```

### Peak Risk

```text
Projected household demand may exceed 5 kW.
```

### Appliance Complete

```text
Washing machine completed.
```

### Device Failure

```text
EV charger did not acknowledge command.
```

### Low Battery

```text
Battery SOC below reserve.
```

### Unusual Consumption

```text
Consumption is significantly above the historical baseline.
```

Notifications should have:

* timestamp;
* severity;
* read/unread;
* action.

---

# 37. SETTINGS

Create `/settings`.

Sections:

### Household

* name;
* timezone;
* currency;
* contracted load.

### Energy Preferences

* optimization mode;
* maximum peak;
* comfort level;
* battery reserve.

### Automation

* enable automation;
* manual override;
* critical appliance protection.

### Notifications

Toggle notification categories.

### Security

* session;
* authentication;
* audit information.

---

# 38. MANUAL OVERRIDE

Users must always be able to override automation.

Example:

```text
EV Charging

HEMS:
Paused until 22:00

[Charge Now]
```

If the user chooses Charge Now:

* change state;
* log override;
* update schedule;
* recalculate projected cost;
* show impact.

Example:

```text
Manual override applied.

Estimated additional cost:
₹12.40
```

---

# 39. SCHEDULE VALIDATION

Every generated schedule must be validated before being accepted.

Check:

* operating windows;
* runtimes;
* deadlines;
* household power limit;
* mutual exclusion;
* battery SOC;
* EV departure requirement;
* comfort limits;
* device availability.

If invalid:

```text
Schedule validation failed.

Issues:
• EV departure SOC not satisfied

Attempting safe re-optimization...
```

Do not silently accept invalid schedules.

---

# 40. INFEASIBLE OPTIMIZATION

If constraints conflict:

Example:

```text
EV:
Required SOC = 90%

Departure:
06:00

Available charging:
3.3 kW

Current SOC:
20%
```

If impossible, clearly explain:

```text
No feasible schedule found.

Reason:
The EV cannot reach the required SOC before departure
under the current constraints.

Suggested actions:
• Lower required departure SOC
• Increase charging power
• Extend departure time
```

Never fabricate a feasible solution.

---

# 41. FAULT HANDLING

Implement simulated fault scenarios.

### Sensor failure

Use fallback data and show warning.

### Device failure

Retry and mark device unavailable.

### Network failure

Switch to local safe simulation behavior.

### Forecast failure

Fall back to baseline forecasting.

### Optimization failure

Fall back to rule-based scheduling.

The application must remain usable.

---

# 42. DATABASE MODEL

Create appropriate entities for:

```text
User
Household
Appliance
Device
MeterReading
Tariff
TariffPeriod
Forecast
SolarGeneration
BatteryState
EV
OptimizationRun
Schedule
ScheduleItem
ControlEvent
Notification
DemandResponseEvent
Simulation
AuditLog
UserPreference
```

Use proper relationships.

Avoid storing everything in one giant JSON object.

---

# 43. DEMO DATA

Create a polished demo household.

Example:

```text
Green Valley Residence
```

Appliances:

* Refrigerator
* LED Lighting
* Television
* Washing Machine
* Dishwasher
* Water Heater
* Air Conditioner
* EV Charger

Optional:

* Solar PV
* Home Battery
* EV

Use the illustrative power values from the project report as initial demo values.

Clearly identify these as demo/synthetic values.

---

# 44. DATA GENERATION

Generate deterministic realistic data for:

* 7 days;
* 24-hour profiles;
* 15-minute intervals.

For 24 hours:

```text
96 slots
```

Create realistic patterns:

Morning:

* rising demand.

Afternoon:

* moderate demand;
* solar production.

Evening:

* high household load;
* peak tariff.

Night:

* reduced demand.

Do not use pure random noise.

Use seeded generation so screenshots/tests remain stable.

---

# 45. DASHBOARD KPI LOGIC

Every KPI must have a source.

Example:

```text
Current Power
= current meter reading

Today's Energy
= sum meter readings × interval duration

Today's Cost
= sum grid import × tariff × interval

Peak
= max grid import
```

Do not hard-code dashboard statistics.

---

# 46. BILLING ENGINE

Implement:

```text
Energy Charge
+ Demand Charge
+ Fixed Charge
+ Taxes/Other Charges
- Credits
```

For MVP, energy charge can be the primary implemented component.

Keep the architecture extensible for:

* demand charges;
* fixed charges;
* export credits.

Clearly label unsupported components.

---

# 47. RESPONSIVE UI

The application must work at:

* 320px mobile;
* 375px;
* 414px;
* tablet;
* 1366px desktop;
* 1920px desktop.

Test:

* navigation;
* tables;
* charts;
* dialogs;
* forms;
* dashboard cards.

No horizontal scrolling except where genuinely necessary.

---

# 48. ACCESSIBILITY

Implement:

* semantic HTML;
* keyboard navigation;
* visible focus states;
* ARIA labels where needed;
* accessible dialogs;
* sufficient color contrast;
* non-color indicators;
* accessible charts/tooltips where practical.

Do not rely only on red/green colors.

---

# 49. ANIMATIONS

Use subtle motion:

* page transitions;
* card hover;
* energy flow;
* chart transitions;
* optimization progress;
* success states.

Avoid excessive animations.

Respect reduced-motion preferences.

---

# 50. LOADING STATES

Every asynchronous operation needs an intentional loading state.

Examples:

```text
Loading energy data...
Running optimization...
Generating forecast...
Saving appliance...
Applying override...
```

Do not display blank screens.

---

# 51. EMPTY STATES

Create professional empty states.

Example:

```text
No appliances configured.

Add your first flexible appliance to start
optimizing your household energy.

[Add Appliance]
```

---

# 52. ERROR STATES

Errors must be user-friendly.

Do not show raw stack traces.

Example:

```text
Something went wrong while generating the schedule.

Your existing schedule has not been changed.

[Try Again]
```

Log technical details separately.

---

# 53. SECURITY

Implement reasonable web security:

* server-side validation;
* authorization checks;
* safe API endpoints;
* secure handling of credentials;
* no secrets in frontend;
* environment variables;
* input validation;
* audit logging for control actions;
* rate limiting where appropriate;
* safe error messages.

Never expose:

* API keys;
* database credentials;
* private environment variables.

---

# 54. PRIVACY

Treat household energy data as sensitive.

Provide architecture for:

* data minimization;
* user-owned data;
* deletion;
* anonymization for research exports;
* secure storage.

Do not expose household-level raw data unnecessarily.

---

# 55. API DESIGN

Implement appropriate endpoints/server actions.

Conceptually:

```text
GET    /api/dashboard
GET    /api/appliances
POST   /api/appliances
PATCH  /api/appliances/:id
DELETE /api/appliances/:id

GET    /api/meters/latest
GET    /api/meters/history

GET    /api/tariffs
POST   /api/tariffs
PATCH  /api/tariffs/:id

POST   /api/optimization/run
GET    /api/optimization/:id

GET    /api/schedule/today
POST   /api/schedule/override

GET    /api/analytics
GET    /api/forecast

GET    /api/solar
GET    /api/battery
GET    /api/ev

GET    /api/devices
POST   /api/devices/:id/command

GET    /api/notifications

POST   /api/simulation/start
POST   /api/simulation/reset
```

Use consistent API response structures.

---

# 56. TYPESCRIPT TYPES

Create strong domain types.

Example:

```ts
type ApplianceFlexibility =
  | "non_flexible"
  | "shiftable"
  | "interruptible"
  | "thermostatic"
  | "storage"
  | "critical";

type OptimizationMode =
  | "economic"
  | "balanced"
  | "comfort"
  | "green";

type DeviceStatus =
  | "online"
  | "offline"
  | "error";
```

Do not use `any` unnecessarily.

---

# 57. COMPONENT ARCHITECTURE

Create reusable components.

Examples:

```text
EnergyKpiCard
EnergyFlow
LoadChart
TariffTimeline
PeakAlert
ScheduleTimeline
ApplianceCard
ApplianceForm
OptimizationPanel
OptimizationResult
DecisionExplanation
BatteryGauge
SolarCard
EVCard
NotificationCenter
DeviceStatus
ForecastChart
SavingsCard
ComparisonChart
SimulationControls
```

Avoid duplicating UI logic.

---

# 58. CHARTS

Use professional charts.

Required:

### Load chart

Line/area chart.

### Tariff chart

24-hour stepped timeline.

### Energy breakdown

Bar/donut.

### Cost breakdown

Bar chart.

### Solar generation

Area chart.

### Battery SOC

Line chart.

### Baseline comparison

Grouped bars.

### Forecast

Actual vs predicted.

Tooltips should show:

* time;
* value;
* unit;
* relevant context.

---

# 59. UNITS

Always show units:

* kW = instantaneous power;
* kWh = energy;
* ₹/kWh = tariff;
* ₹ = cost;
* % = percentage;
* °C = temperature;
* SOC = battery state of charge.

Do not confuse kW and kWh.

---

# 60. INDIA-ORIENTED EXPERIENCE

The project is India-oriented.

Use:

* INR / ₹;
* configurable tariff structure;
* Indian-style date/number formatting where appropriate.

However:

**Do not claim that demo tariff values are official Indian utility tariffs.**

Allow the user to configure actual tariff data later.

---

# 61. RESEARCH DOCUMENTATION INSIDE THE APP

Create an optional `/about` or `/research` page explaining:

### Problem

Residential energy is often consumed without considering tariff periods or grid conditions.

### Solution

HEMS monitors, forecasts, optimizes, and schedules flexible loads.

### Method

Tariff-aware constrained optimization.

### Research comparison

* User-driven baseline
* Rule-based
* MILP
* MPC/advanced future work

### Metrics

* cost;
* peak;
* energy;
* comfort;
* forecast error;
* optimization time.

This makes the application suitable for an academic demonstration.

---

# 62. RESEARCH DASHBOARD

Create a special academic/research section.

Display:

```text
Research Evaluation

Baseline vs HEMS

Cost
Peak
Comfort
Solar
Forecast
Runtime
```

Include experiment configuration.

Allow selecting:

```text
Scenario 1: Flat Tariff
Scenario 2: TOU
Scenario 3: Solar + TOU
Scenario 4: Solar + Battery + TOU
Scenario 5: Peak Constraint
Scenario 6: Forecast Error
Scenario 7: User Override
```

These scenarios come from the project report.

---

# 63. SCENARIO SIMULATOR

Implement all report scenarios.

### Scenario 1

Flat tariff.

### Scenario 2

Time-of-use tariff.

### Scenario 3

Solar + TOU.

### Scenario 4

Solar + battery + TOU.

### Scenario 5

Peak constraint.

### Scenario 6

Forecast error.

### Scenario 7

User override.

Each scenario should produce actual measurable results.

---

# 64. BASELINE SCHEDULER

Implement a simple baseline.

User-driven:

Appliances run at default/preferred times.

Use this as the reference.

---

# 65. RULE-BASED SCHEDULER

Implement rules such as:

```text
IF appliance is flexible
AND current period is peak
AND a cheaper valid period exists
THEN delay appliance
```

Use it as the second benchmark.

---

# 66. OPTIMIZATION SCHEDULER

Implement the more advanced constrained scheduler.

It should jointly consider:

* cost;
* peak;
* appliance constraints;
* solar;
* battery;
* EV;
* comfort.

---

# 67. ROLLING HORIZON

Implement an optional rolling optimization mode.

Conceptually:

```text
08:00 → optimize 08:00–20:00
09:00 → optimize 09:00–21:00
10:00 → optimize 10:00–22:00
```

Only the first control action should be committed.

For the demo, allow the user to simulate this process rather than requiring a real-time backend worker.

---

# 68. EXPLAINABILITY

For every optimization run store:

```text
optimization_id
timestamp
objective
cost
peak
comfort
carbon
constraints
decisions
reasons
```

Allow viewing:

**Why did HEMS make this decision?**

---

# 69. AUDIT LOG

Create an audit trail.

Record:

```text
timestamp
user
action
entity
old value
new value
result
```

Examples:

```text
19:42
User
Manual override
EV charger
Paused → Charging
Success
```

---

# 70. DEMO LOGIN

For a deployed demo, create a safe demo authentication experience.

If full authentication is unnecessary for the first deployment, provide:

```text
Demo Mode
```

with a clearly seeded demo household.

Do not hard-code real passwords or secrets.

---

# 71. VERCEL DEPLOYMENT

The project MUST be deployable to Vercel.

Requirements:

* production build succeeds;
* no dependency on localhost;
* no hardcoded absolute URLs;
* environment variables documented;
* database configuration documented;
* proper Next.js configuration;
* static assets work;
* API routes work in production;
* no server process that must remain permanently running;
* no unsupported long-running background worker requirement.

If persistent PostgreSQL is required, structure it for a Vercel-compatible PostgreSQL provider.

Provide:

```text
.env.example
README.md
```

with all required environment variables.

---

# 72. DATABASE STRATEGY

Use a development fallback if no external database is configured.

For example:

```text
Development:
seed/demo repository

Production:
PostgreSQL
```

The application should clearly indicate demo mode.

Do not make the UI fail completely because no external database credentials exist during local evaluation.

---

# 73. SEED DATA

Create a seed mechanism.

Seed:

* household;
* appliances;
* devices;
* tariff;
* meter readings;
* solar readings;
* battery state;
* EV;
* schedules;
* notifications.

Make the seed deterministic.

---

# 74. TESTING REQUIREMENTS

Do NOT stop after writing code.

You must test the application.

Run:

```text
npm install
npm run lint
npm run typecheck
npm run test
npm run build
```

If using different scripts, create equivalent scripts.

Also run Playwright or equivalent E2E tests.

---

# 75. UNIT TESTS

Test at minimum:

### Tariff Engine

* correct tariff selection;
* boundary times;
* midnight crossover.

### Cost Engine

* correct energy cost;
* solar offset;
* battery offset.

### Peak Engine

* correct maximum grid import.

### Appliance Constraints

* runtime;
* operating window;
* deadline.

### Battery

* SOC update;
* min/max SOC;
* charge/discharge limits.

### EV

* departure SOC requirement.

### Optimization

* feasible scenario;
* infeasible scenario;
* peak constraint.

### Savings

* baseline vs HEMS formulas.

---

# 76. E2E TESTS

Create browser tests for:

### Test 1

Open dashboard.

Expected:

* dashboard loads;
* KPI cards visible;
* no console-breaking errors.

### Test 2

Add appliance.

Expected:

* appliance appears;
* data persists.

### Test 3

Edit tariff.

Expected:

* tariff timeline changes.

### Test 4

Run optimization.

Expected:

* optimization completes;
* schedule changes;
* results displayed.

### Test 5

Manual override.

Expected:

* schedule changes;
* audit event appears;
* projected cost updates.

### Test 6

Battery.

Expected:

* SOC display updates.

### Test 7

EV.

Expected:

* departure requirement influences charging.

### Test 8

Simulation.

Expected:

* scenario runs;
* metrics appear.

### Test 9

Responsive.

Expected:

* mobile layout works.

---

# 77. TEST THE ACTUAL USER JOURNEY

The following journey MUST work:

```text
Open application
        ↓
Open dashboard
        ↓
Inspect current energy
        ↓
Open appliances
        ↓
Edit washing machine
        ↓
Open tariff
        ↓
Modify peak price
        ↓
Run optimization
        ↓
View optimized schedule
        ↓
Open decision explanation
        ↓
Apply manual override
        ↓
View updated cost
        ↓
Open analytics
        ↓
Compare baseline vs HEMS
```

Do not consider the project complete until this journey works.

---

# 78. BUILD QUALITY GATE

Before declaring completion, verify:

```text
[ ] No TypeScript errors
[ ] No ESLint errors
[ ] Production build succeeds
[ ] All major routes load
[ ] Forms validate
[ ] Data persists
[ ] Optimization works
[ ] Schedule validation works
[ ] Dashboard KPIs calculate
[ ] Charts render
[ ] Mobile layout works
[ ] E2E tests pass
[ ] Unit tests pass
[ ] No broken buttons
[ ] No dead navigation links
[ ] No placeholder TODOs for core functionality
[ ] No exposed secrets
[ ] .env.example exists
[ ] README exists
[ ] Vercel deployment configuration is correct
```

---

# 79. NO FAKE FEATURES

Do NOT create buttons that only show:

```text
Coming Soon
```

for core functionality.

If an advanced feature cannot be fully implemented, provide a functional simulation.

For example:

Instead of:

```text
Connect Solar API
Coming Soon
```

implement:

```text
Solar Data Source
○ Simulation
○ Manual
○ API Adapter
```

The simulator must actually work.

---

# 80. PROFESSIONAL UX DETAILS

Add:

* skeleton loading;
* toast notifications;
* confirmation dialogs for destructive actions;
* undo where useful;
* empty states;
* error recovery;
* contextual help;
* tooltips;
* keyboard accessibility;
* responsive tables;
* sticky actions where appropriate.

Use concise microcopy.

Avoid overly technical terminology in primary user flows.

---

# 81. PERFORMANCE

Optimize for:

* fast initial load;
* minimal unnecessary re-renders;
* lazy loading for heavy research pages;
* efficient charts;
* server-side data fetching where appropriate;
* caching where useful.

Do not load huge datasets into the browser unnecessarily.

---

# 82. SEO / METADATA

Create professional metadata:

Title:

**HEMS — Smart Home Energy Management**

Description:

**Tariff-aware smart home energy management for intelligent residential load scheduling, energy optimization, solar, battery and EV coordination.**

Use appropriate favicon/app icon.

---

# 83. README

Create a professional README containing:

## Project Overview

## Features

## Architecture

## Tech Stack

## Installation

## Environment Variables

## Database Setup

## Seed Data

## Running Locally

## Testing

## Production Build

## Vercel Deployment

## Optimization Method

## Simulation Mode

## API

## Project Structure

## Research Methodology

## Limitations

## Future Work

---

# 84. PROJECT STRUCTURE

Prefer a structure similar to:

```text
app/
├── page.tsx
├── dashboard/
├── appliances/
├── schedule/
├── tariffs/
├── forecast/
├── solar/
├── battery/
├── ev/
├── analytics/
├── demand-response/
├── devices/
├── notifications/
├── simulation/
├── research/
├── settings/
└── api/

components/
├── dashboard/
├── appliances/
├── charts/
├── optimization/
├── energy-flow/
├── battery/
├── solar/
├── ev/
├── devices/
├── notifications/
└── ui/

lib/
├── db/
├── tariff/
├── forecasting/
├── optimization/
├── scheduling/
├── battery/
├── ev/
├── analytics/
├── simulation/
├── devices/
└── validation/

types/
tests/
e2e/
prisma/
public/
```

Adapt the structure if necessary, but preserve modularity.

---

# 85. DOMAIN LOGIC REQUIREMENT

Keep domain calculations testable independently of React.

For example:

```text
calculateGridImport()
calculateEnergyCost()
calculatePeakDemand()
calculateBatterySOC()
validateSchedule()
generateBaselineSchedule()
generateRuleBasedSchedule()
optimizeSchedule()
calculateSavings()
generateForecast()
```

These functions should be independently testable.

---

# 86. OPTIMIZATION RESULT UI

After optimization, show:

```text
Optimization Complete ✓

Estimated cost
₹118.40

Baseline
₹142.60

Savings
₹24.20

Peak demand
4.1 kW

Baseline peak
5.2 kW

Peak reduction
21.2%

Comfort violations
0

Tasks completed
8/8
```

Again, calculate these values dynamically.

---

# 87. OPTIMIZATION BEFORE/AFTER VISUALIZATION

Create a strong visual comparison:

```text
BEFORE

Peak: 5.2 kW
Cost: ₹142.60

        ↓ HEMS

AFTER

Peak: 4.1 kW
Cost: ₹118.40
```

Animate the transition when appropriate.

---

# 88. SCHEDULE TIMELINE UX

Use a 24-hour horizontal timeline.

Show tariff background.

Overlay:

* appliance schedules;
* battery;
* EV;
* solar;
* peak period.

Allow clicking an item to open details.

---

# 89. APPLIANCE DETAILS DRAWER

When a user clicks an appliance:

Show:

```text
Washing Machine

Power
0.50 kW

Runtime
2 h

Status
Scheduled

Today's energy
1.0 kWh

Today's cost
₹4.80

Schedule
14:00–16:00

Why?
Moved from peak period.

[Run Now]
[Change Schedule]
```

---

# 90. ENERGY SAVINGS STORY

Create a polished dashboard section:

```text
Your home saved

₹690 this month

because HEMS shifted

42.5 kWh

away from expensive periods.
```

Only calculate and display this from actual simulation/demo data.

---

# 91. RESEARCH EXPORT

Allow exporting experiment data.

Formats:

* CSV;
* JSON.

Export:

```text
scenario
algorithm
date
cost
energy
peak
comfort
solar_self_consumption
forecast_error
optimization_time
```

This supports academic analysis.

---

# 92. DARK MODE

If practical, implement polished dark mode.

Ensure charts and semantic colors remain readable.

Persist theme preference.

---

# 93. RESPONSIVE MOBILE DASHBOARD

Mobile priority:

```text
Current Power
Today's Cost
Peak Risk
Energy Flow
Today's Schedule
Solar/Battery
Quick Controls
```

Use bottom navigation if appropriate.

---

# 94. QUICK ACTIONS

Dashboard quick actions:

```text
Optimize Now
Run Simulation
Charge EV
Pause EV
Run Washing Machine
View Tariff
```

All actions must work.

---

# 95. SAFE CONTROL

Never imply that this web application can safely control arbitrary household mains equipment.

In the device page include:

> Physical high-power appliance control requires appropriately rated, certified hardware and qualified installation. This demo uses simulated device control unless an approved device adapter is configured.

This is a web application safety boundary.

---

# 96. FUTURE HARDWARE EXTENSIBILITY

Design the system so the simulator can later be replaced by:

```text
ESP32
MQTT
Smart Plug
Smart Meter
Solar Inverter
Battery
EV Charger
Matter Device
```

without rewriting the scheduling engine.

The scheduler should issue abstract commands such as:

```ts
setDevicePower(deviceId, power)
turnDeviceOn(deviceId)
turnDeviceOff(deviceId)
pauseDevice(deviceId)
resumeDevice(deviceId)
```

---

# 97. DEMO EXPERIENCE

When a reviewer opens the application for the first time, they should immediately understand:

1. Current energy consumption.
2. Current tariff.
3. What HEMS is doing.
4. How much it may save.
5. Which appliances are scheduled.
6. Why those decisions were made.
7. What happens if the user changes the tariff.
8. How optimization compares with normal scheduling.

The first screen should tell the product story visually.

---

# 98. ACADEMIC PRESENTATION MODE

Add an optional "Presentation Mode".

When enabled:

* hide unnecessary settings;
* emphasize KPI cards;
* show live energy flow;
* show optimization decisions;
* show baseline vs HEMS;
* show savings;
* show research scenario.

This should be useful for a college project viva/demo.

---

# 99. PROJECT COMPLETION CRITERIA

The project is complete ONLY when:

### Functional

The main HEMS workflow works end-to-end.

### Visual

The UI looks like a polished professional energy-tech product.

### Technical

The code is modular and type-safe.

### Research

The application demonstrates the optimization methodology described in the report.

### Testing

Automated tests pass.

### Deployment

Production build succeeds and is Vercel-ready.

### Demo

A fresh reviewer can understand and operate the system without developer assistance.

---

# 100. DEVELOPMENT PROCESS YOU MUST FOLLOW

Do NOT attempt to blindly generate everything in one pass.

Work iteratively.

## STEP 1 — ANALYZE

Inspect the repository.

Determine:

* existing files;
* framework;
* package manager;
* current architecture;
* reusable code;
* missing functionality.

Do not unnecessarily rewrite working code.

## STEP 2 — PLAN

Create an implementation plan covering:

* architecture;
* database;
* UI;
* domain logic;
* optimization;
* tests;
* deployment.

## STEP 3 — IMPLEMENT FOUNDATION

Build:

* application shell;
* theme;
* navigation;
* database/domain types;
* demo data;
* core services.

## STEP 4 — IMPLEMENT CORE HEMS

Build:

* meter data;
* tariff engine;
* appliance model;
* baseline scheduler;
* rule scheduler;
* optimization scheduler;
* schedule validation.

## STEP 5 — IMPLEMENT DER

Build:

* solar;
* battery;
* EV.

## STEP 6 — IMPLEMENT UI

Build:

* dashboard;
* charts;
* schedules;
* appliance pages;
* tariff pages;
* analytics;
* simulation.

## STEP 7 — IMPLEMENT RESEARCH

Build:

* experiments;
* baseline comparison;
* forecast metrics;
* forecast error scenarios;
* research dashboard.

## STEP 8 — TEST

Run unit tests, integration tests, E2E tests, lint and typecheck.

## STEP 9 — DEBUG

Fix all discovered issues.

Do not merely report them.

## STEP 10 — POLISH

Improve:

* spacing;
* typography;
* animations;
* empty states;
* loading states;
* errors;
* mobile experience.

## STEP 11 — BUILD

Run production build.

Fix every build error.

## STEP 12 — FINAL AUDIT

Verify the complete user journey.

Only then declare the project complete.

---

# 101. IMPORTANT ANTI-PATTERNS

Do NOT:

* create a static HTML mockup;
* hard-code all dashboard numbers;
* use fake buttons;
* use fake optimization;
* claim measured savings without running the simulation;
* claim official tariff data for demo values;
* expose API keys;
* require localhost services for Vercel deployment;
* use arbitrary random data on every page refresh;
* ignore validation;
* ignore mobile;
* ignore accessibility;
* leave major TODOs;
* silently accept infeasible schedules;
* use `any` everywhere;
* duplicate business logic across components.

---

# 102. IF A TECHNICAL LIMITATION EXISTS

If the exact technology requested cannot run inside Vercel:

Do NOT abandon the feature.

Instead:

1. preserve the domain interface;
2. implement a deployment-compatible version;
3. provide an adapter interface for the more advanced implementation;
4. document how the advanced solver can be connected later.

For example:

```text
OptimizationEngine
        │
        ├── BrowserCompatibleOptimizer
        │
        ├── MILPServiceAdapter
        │
        └── FutureRemoteSolver
```

The application must still function completely in demo mode.

---

# 103. FINAL REPORT TO ME AFTER IMPLEMENTATION

When development is complete, provide a concise final report containing:

### 1. What was built

### 2. Main features

### 3. Technology stack

### 4. Optimization methodology

### 5. Database

### 6. Simulation

### 7. Testing performed

Include actual results such as:

```text
Unit tests:  XX passed
E2E tests:   XX passed
TypeScript:  PASS
Lint:        PASS
Build:       PASS
```

Do NOT fabricate these values.

### 8. Known limitations

### 9. Environment variables

### 10. Local run instructions

### 11. Vercel deployment instructions

### 12. Suggested next improvements

---

# 104. FINAL COMMAND

Now take ownership of the entire implementation.

**Do not stop at planning.**

Inspect the project, implement the application, create the required files, install/configure dependencies, build the UI, implement the domain logic, create the simulator, implement scheduling/optimization, create demo data, test everything, fix failures, run the production build, and leave the repository in a clean Vercel-deployable state.

Prioritize:

**FUNCTIONALITY → CORRECTNESS → TESTING → UX → VISUAL POLISH → DEPLOYMENT**

The final result should feel like a **real smart-energy SaaS product**, while simultaneously functioning as a credible **academic HEMS research prototype**.

The application must tell the following story clearly:

> **Monitor → Understand Tariff → Forecast → Optimize → Schedule → Control → Explain → Measure Savings**

Build the complete system.
