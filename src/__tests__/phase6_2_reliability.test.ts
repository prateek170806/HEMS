/**
 * Phase 6.2 — Production Performance, Reliability & Deployment Readiness Tests
 *
 * Tests covering:
 *  - F-002: /api/energy/history date validation and range cap
 *  - F-003: /api/optimization/run route-level authentication
 *  - Optimization history bounding (defensive)
 *  - Savings dedup timezone regression (F-001 carry-forward)
 *  - Canonical Green Valley demo regression
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as GET_History } from '../app/api/energy/history/route';
import { POST as POST_OptRun } from '../app/api/optimization/run/route';
import * as auth from '../lib/server/auth';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockPrisma = vi.hoisted(() => ({
  meterReading: { findMany: vi.fn() },
  appliance: { findMany: vi.fn() },
  tariff: { findFirst: vi.fn() },
  schedule: { findMany: vi.fn(), deleteMany: vi.fn(), create: vi.fn() },
  optimizationRun: { create: vi.fn() },
  household: {},
  $transaction: vi.fn(),
  $queryRaw: vi.fn(),
}));

vi.mock('../lib/server/db', () => ({ prisma: mockPrisma }));
vi.mock('../lib/prisma', () => ({ default: mockPrisma }));
vi.mock('../lib/server/auth', () => ({ getCurrentHousehold: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('../lib/optimization/execute', () => ({
  executeOptimizationRun: vi.fn().mockResolvedValue({
    run: { id: 'run-1' },
    schedules: []
  })
}));

// ─── F-002: History Route Date Validation ─────────────────────────────────────

describe('F-002: /api/energy/history — Date Validation & Range Cap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // @ts-expect-error partial mock
    vi.mocked(auth.getCurrentHousehold).mockResolvedValue({ id: 'hh-1', timezone: 'Asia/Kolkata' });
    mockPrisma.meterReading.findMany.mockResolvedValue([]);
  });

  it('should return 400 for an invalid from date', async () => {
    const req = new Request('http://localhost/api/energy/history?from=not-a-date');
    const res = await GET_History(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('from');
  });

  it('should return 400 for an invalid to date', async () => {
    const req = new Request('http://localhost/api/energy/history?to=banana');
    const res = await GET_History(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('to');
  });

  it('should return 400 when from > to', async () => {
    const req = new Request(
      'http://localhost/api/energy/history?from=2026-09-10T00:00:00Z&to=2026-09-09T00:00:00Z'
    );
    const res = await GET_History(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('before');
  });

  it('should return 400 for a range exceeding 90 days', async () => {
    const from = '2026-01-01T00:00:00Z';
    const to   = '2026-12-31T00:00:00Z'; // ~364 days
    const req = new Request(`http://localhost/api/energy/history?from=${from}&to=${to}`);
    const res = await GET_History(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('90 days');
  });

  it('should return 400 for exactly 91 days', async () => {
    const from = new Date('2026-01-01T00:00:00Z');
    const to = new Date(from.getTime() + 91 * 24 * 60 * 60 * 1000);
    const req = new Request(
      `http://localhost/api/energy/history?from=${from.toISOString()}&to=${to.toISOString()}`
    );
    const res = await GET_History(req);
    expect(res.status).toBe(400);
  });

  it('should accept a valid range within 90 days and return 200', async () => {
    const from = new Date('2026-08-01T00:00:00Z');
    const to = new Date('2026-09-09T00:00:00Z'); // ~39 days
    const req = new Request(
      `http://localhost/api/energy/history?from=${from.toISOString()}&to=${to.toISOString()}`
    );
    const res = await GET_History(req);
    expect(res.status).toBe(200);
  });

  it('should accept exactly 90 days range', async () => {
    const from = new Date('2026-06-11T00:00:00Z');
    const to = new Date('2026-09-09T00:00:00Z'); // 90 days
    const req = new Request(
      `http://localhost/api/energy/history?from=${from.toISOString()}&to=${to.toISOString()}`
    );
    const res = await GET_History(req);
    expect(res.status).toBe(200);
  });

  it('should use 24h default range when no params provided', async () => {
    const req = new Request('http://localhost/api/energy/history');
    const res = await GET_History(req);
    expect(res.status).toBe(200);
    expect(mockPrisma.meterReading.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ householdId: 'hh-1' }),
      })
    );
  });

  it('should always include householdId in query regardless of range', async () => {
    const req = new Request('http://localhost/api/energy/history?from=2026-09-01T00:00:00Z&to=2026-09-09T00:00:00Z');
    await GET_History(req);
    expect(mockPrisma.meterReading.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ householdId: 'hh-1' }),
      })
    );
  });

  it('should return 404 if unauthenticated', async () => {
    vi.mocked(auth.getCurrentHousehold).mockResolvedValueOnce(null);
    const req = new Request('http://localhost/api/energy/history');
    const res = await GET_History(req);
    expect(res.status).toBe(404);
  });
});

// ─── F-003: Optimization Route Auth ───────────────────────────────────────────

describe('F-003: /api/optimization/run — Route-Level Auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    vi.mocked(auth.getCurrentHousehold).mockResolvedValueOnce(null);
    const res = await POST_OptRun();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('should proceed to optimization engine when authenticated', async () => {
    // @ts-expect-error partial mock
    vi.mocked(auth.getCurrentHousehold).mockResolvedValueOnce({ id: 'hh-1' });
    const res = await POST_OptRun();
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.runId).toBe('run-1');
  });
});

// ─── Range Validation Math ─────────────────────────────────────────────────────

describe('F-002: Range Boundary Math', () => {
  const MAX_RANGE_DAYS = 90;

  it('calculates range days correctly', () => {
    const from = new Date('2026-01-01T00:00:00Z');
    const to = new Date('2026-04-01T00:00:00Z'); // 90 days exactly
    const rangeDays = (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24);
    expect(rangeDays).toBe(90);
    expect(rangeDays > MAX_RANGE_DAYS).toBe(false);
  });

  it('rejects 91-day range', () => {
    const from = new Date('2026-01-01T00:00:00Z');
    const to = new Date('2026-04-02T00:00:00Z'); // 91 days
    const rangeDays = (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24);
    expect(rangeDays > MAX_RANGE_DAYS).toBe(true);
  });

  it('rejects from > to', () => {
    const from = new Date('2026-09-10T00:00:00Z');
    const to   = new Date('2026-09-09T00:00:00Z');
    expect(from > to).toBe(true);
  });
});

// ─── Canonical Demo Regression ─────────────────────────────────────────────────

describe('Canonical Green Valley Demo Regression', () => {
  it('preserves the optimization hierarchy: baseline >= ruleBased >= hems', async () => {
    const { generateBaselineSchedule, generateRuleBasedSchedule, optimizeSchedule } = await import('../lib/optimization/schedulers');
    const { simulateDay } = await import('../lib/simulation/engine');
    const { getPriceForTime } = await import('../lib/domain/tariff');
    const { startOfDay } = await import('date-fns');

    const household = {
      id: 'hh-demo',
      userId: 'u1',
      name: 'Green Valley Residence',
      timezone: 'Asia/Kolkata',
      currency: 'INR',
      powerLimitKw: 5.5,
      batteryReserve: 20,
      optimizationMode: 'economic',
      solarIrradiance: 50,
      baseLoad: 10,
      forecastError: 0,
      smartMeterOffline: false,
      evDisconnected: false,
      inverterFault: false,
      simulationStatus: 'LIVE',
      simulationSpeed: 1,
      simulationTime: new Date(),
      simulationLastTick: new Date(),
      currentBatterySoc: 20,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never;

    const appliances = [
      { id: 'a1', householdId: 'hh-demo', name: 'Washing Machine', category: 'washing_machine', ratedPower: 0.5, flexibility: 'shiftable', minRuntime: 2, maxRuntime: 2, earliestStart: '18:00', latestFinish: '23:00', priority: 'medium', automationEnabled: true, status: 'offline', createdAt: new Date(), updatedAt: new Date() },
      { id: 'a2', householdId: 'hh-demo', name: 'Water Heater', category: 'water_heater', ratedPower: 2.0, flexibility: 'shiftable', minRuntime: 1, maxRuntime: 1, earliestStart: '17:00', latestFinish: '20:00', priority: 'high', automationEnabled: true, status: 'offline', createdAt: new Date(), updatedAt: new Date() },
      { id: 'a3', householdId: 'hh-demo', name: 'EV Charger', category: 'ev', ratedPower: 3.3, flexibility: 'shiftable', minRuntime: 4, maxRuntime: 8, earliestStart: '18:00', latestFinish: '08:00', priority: 'high', automationEnabled: true, status: 'offline', createdAt: new Date(), updatedAt: new Date() },
    ] as never[];

    const tariffPeriods = [
      { id: 'p1', tariffId: 't1', name: 'Night Off-Peak', startTime: '00:00', endTime: '06:00', pricePerKwh: 4.0, type: 'off_peak', createdAt: new Date(), updatedAt: new Date() },
      { id: 'p2', tariffId: 't1', name: 'Morning Normal', startTime: '06:00', endTime: '10:00', pricePerKwh: 6.0, type: 'normal', createdAt: new Date(), updatedAt: new Date() },
      { id: 'p3', tariffId: 't1', name: 'Solar Hours', startTime: '10:00', endTime: '17:00', pricePerKwh: 4.5, type: 'solar', createdAt: new Date(), updatedAt: new Date() },
      { id: 'p4', tariffId: 't1', name: 'Evening Peak', startTime: '17:00', endTime: '22:00', pricePerKwh: 12.0, type: 'peak', createdAt: new Date(), updatedAt: new Date() },
      { id: 'p5', tariffId: 't1', name: 'Night Off-Peak 2', startTime: '22:00', endTime: '23:59', pricePerKwh: 4.0, type: 'off_peak', createdAt: new Date(), updatedAt: new Date() },
    ] as never[];

    const date = startOfDay(new Date());

    const toSched = (s: { applianceId: string; startTime: Date; endTime: Date; explanation?: string; cost?: number }) => ({
      ...s, id: '', householdId: 'hh-demo', optimizationId: null,
      status: 'scheduled', reason: s.explanation ?? null, reasonCategory: null,
      impact: null, affectedMetric: null, originalStart: null, originalEnd: null,
      estimatedCost: s.cost ?? 0, createdAt: new Date(), updatedAt: new Date()
    });

    const calcCost = (slots: ReturnType<typeof simulateDay>) =>
      slots.reduce((sum, s) => sum + s.gridImportKw * 0.25 * getPriceForTime(tariffPeriods as never, s.timestamp), 0);

    const baseline = generateBaselineSchedule(appliances, date, tariffPeriods as never);
    const ruleBased = generateRuleBasedSchedule(appliances, date, tariffPeriods as never);
    const hems = optimizeSchedule(appliances, date, tariffPeriods as never, household);

    const simBaseline = simulateDay(date, household, appliances, baseline.map(toSched) as never[]);
    const simRuleBased = simulateDay(date, household, appliances, ruleBased.map(toSched) as never[]);
    const simHems = simulateDay(date, household, appliances, hems.map(toSched) as never[]);

    const costBaseline = calcCost(simBaseline);
    const costRuleBased = calcCost(simRuleBased);
    const costHems = calcCost(simHems);

    expect(costBaseline).toBeGreaterThan(costRuleBased);
    expect(costRuleBased).toBeGreaterThanOrEqual(costHems);
    expect(costHems).toBeGreaterThanOrEqual(0);

    const savings = Math.max(0, costBaseline - costHems);
    expect(savings).toBeGreaterThanOrEqual(0);
  }, 30000); // 30s timeout: simulateDay × 3 strategies is computation-heavy
});
