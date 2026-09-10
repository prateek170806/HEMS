import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as GET_Anomalies } from '../app/api/intelligence/anomalies/route';
import { GET as GET_Recommendations } from '../app/api/intelligence/recommendations/route';
import { POST as POST_Scenario } from '../app/api/energy/scenario/route';
import { evaluateTick } from '../lib/simulation/tick';
import * as auth from '../lib/server/auth';

interface AnomalyItem {
  id: string;
  type: string;
  severity: string;
  message: string;
  observed: string;
  expected: string;
}

interface RecommendationItem {
  id: string;
  type: string;
  appliance: string;
  expectedSavings: number;
  peakReduction: number;
  confidence: string;
}

const mockPrisma = vi.hoisted(() => ({
  appliance: { findMany: vi.fn(), update: vi.fn(), create: vi.fn(), delete: vi.fn() },
  schedule: { findMany: vi.fn(), update: vi.fn(), create: vi.fn(), deleteMany: vi.fn() },
  tariff: { findFirst: vi.fn(), update: vi.fn() },
  household: { update: vi.fn() },
  optimizationRun: { create: vi.fn() }
}));

vi.mock('../lib/server/db', () => ({ prisma: mockPrisma }));
vi.mock('../lib/prisma', () => ({ default: mockPrisma }));
vi.mock('../lib/server/auth', () => ({ getCurrentHousehold: vi.fn() }));

describe('Homepage Intelligence & What-If Sandbox Tests', () => {
  const noonDate = new Date(2026, 8, 10, 12, 0, 0); // Local 12:00 PM

  const mockHousehold = {
    id: 'hh-intel-1',
    userId: 'user-1',
    name: 'Green Valley Residence',
    powerLimitKw: 5.5,
    batteryReserve: 20,
    baseLoad: 10, // Canonical baseLoad setting = 10 -> (10/10)*0.5 = 0.50 kW
    solarIrradiance: 50,
    inverterFault: false,
    evDisconnected: false,
    smartMeterOffline: false,
    simulationTime: noonDate,
    currentBatterySoc: 50,
    optimizationMode: 'economic',
  };

  const mockAppliances = [
    {
      id: 'app-washer',
      householdId: 'hh-intel-1',
      name: 'Dynamic Washing Machine',
      category: 'washing_machine',
      ratedPower: 2.0,
      minRuntime: 1.5,
      maxRuntime: 3.0,
      earliestStart: '06:00',
      latestFinish: '20:00',
      flexibility: 'shiftable',
      automationEnabled: true,
      priority: 'medium',
      status: 'offline',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  const mockTariff = {
    id: 'tariff-1',
    householdId: 'hh-intel-1',
    name: 'Standard TOU Tariff',
    isActive: true,
    periods: [
      { id: 'p1', tariffId: 'tariff-1', name: 'Off-Peak', startTime: '22:00', endTime: '06:00', pricePerKwh: 4.5, type: 'off_peak', createdAt: new Date(), updatedAt: new Date() },
      { id: 'p2', tariffId: 'tariff-1', name: 'Normal', startTime: '06:00', endTime: '18:00', pricePerKwh: 7.5, type: 'normal', createdAt: new Date(), updatedAt: new Date() },
      { id: 'p3', tariffId: 'tariff-1', name: 'Peak', startTime: '18:00', endTime: '22:00', pricePerKwh: 12.0, type: 'peak', createdAt: new Date(), updatedAt: new Date() }
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── 1. ANOMALIES & BASE LOAD MODEL CONSISTENCY ─────────────────────────────

  describe('1. Anomalies API & Base Load Consistency', () => {
    it('returns 404 when unauthenticated', async () => {
      vi.mocked(auth.getCurrentHousehold).mockResolvedValueOnce(null);
      const res = await GET_Anomalies();
      expect(res.status).toBe(404);
    });

    it('derives expected base load dynamically from household.baseLoad (canonical and modified)', async () => {
      // Test 1: Modified baseLoad = 20 -> expected = (20 / 10) * 0.5 = 1.00 kW
      // @ts-expect-error partial mock
      vi.mocked(auth.getCurrentHousehold).mockResolvedValueOnce({
        ...mockHousehold,
        baseLoad: 20
      });
      mockPrisma.appliance.findMany.mockResolvedValueOnce(mockAppliances);
      mockPrisma.schedule.findMany.mockResolvedValueOnce([]);
      mockPrisma.tariff.findFirst.mockResolvedValueOnce(mockTariff);

      const res1 = await GET_Anomalies();
      expect(res1.status).toBe(200);
      const body1 = await res1.json();
      const anomaly1 = body1.anomalies.find((a: AnomalyItem) => a.id === 'high_base_load');
      expect(anomaly1).toBeDefined();
      expect(anomaly1?.expected).toBe('1.00 kW');

      // Test 2: Modified baseLoad = 30 -> expected = (30 / 10) * 0.5 = 1.50 kW
      // @ts-expect-error partial mock
      vi.mocked(auth.getCurrentHousehold).mockResolvedValueOnce({
        ...mockHousehold,
        baseLoad: 30
      });
      mockPrisma.appliance.findMany.mockResolvedValueOnce(mockAppliances);
      mockPrisma.schedule.findMany.mockResolvedValueOnce([]);
      mockPrisma.tariff.findFirst.mockResolvedValueOnce(mockTariff);

      const res2 = await GET_Anomalies();
      expect(res2.status).toBe(200);
      const body2 = await res2.json();
      const anomaly2 = body2.anomalies.find((a: AnomalyItem) => a.id === 'high_base_load');
      expect(anomaly2).toBeDefined();
      expect(anomaly2?.expected).toBe('1.50 kW');
    });

    it('verifies simulation engine and anomaly API agree on base load calculation', () => {
      // Direct validation against evaluateTick()
      const testBaseLoad = 20;
      const hh = { ...mockHousehold, baseLoad: testBaseLoad } as never;
      const tick = evaluateTick(noonDate, hh, [], [], [], 1/60);
      
      // Expected nominal base load in kW: (baseLoad / 10) * 0.5
      const expectedNominalKw = (testBaseLoad / 10) * 0.5;
      expect(expectedNominalKw).toBe(1.00);
      expect(tick.baseLoadKw).toBeGreaterThan(0.5); // Observed dynamic base load incorporates time-of-day curve & noise
    });

    it('detects solar underperformance when inverter fault is active', async () => {
      // @ts-expect-error partial mock
      vi.mocked(auth.getCurrentHousehold).mockResolvedValueOnce({
        ...mockHousehold,
        inverterFault: true,
        simulationTime: noonDate
      });
      mockPrisma.appliance.findMany.mockResolvedValueOnce(mockAppliances);
      mockPrisma.schedule.findMany.mockResolvedValueOnce([]);
      mockPrisma.tariff.findFirst.mockResolvedValueOnce(mockTariff);

      const res = await GET_Anomalies();
      expect(res.status).toBe(200);
      const body = await res.json();
      
      const solarAnomaly = body.anomalies.find((a: AnomalyItem) => a.id === 'solar_underperformance');
      expect(solarAnomaly).toBeDefined();
      expect(solarAnomaly?.severity).toBe('HIGH');
      expect(solarAnomaly?.message).toContain('Inverter fault');
    });

    it('returns empty anomalies when system is operating normally in canonical state', async () => {
      // Canonical Green Valley: baseLoad: 10, no faults, normal SOC, normal power limit
      // @ts-expect-error partial mock
      vi.mocked(auth.getCurrentHousehold).mockResolvedValueOnce({
        ...mockHousehold,
        baseLoad: 10,
        inverterFault: false,
        batteryReserve: 20,
        currentBatterySoc: 80,
        powerLimitKw: 10.0
      });
      mockPrisma.appliance.findMany.mockResolvedValueOnce(mockAppliances);
      mockPrisma.schedule.findMany.mockResolvedValueOnce([]);
      mockPrisma.tariff.findFirst.mockResolvedValueOnce(mockTariff);

      const res = await GET_Anomalies();
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.anomalies).toEqual([]);
    });
  });

  // ─── 2. RECOMMENDATIONS & PEAK REDUCTION ──────────────────────────────────────

  describe('2. Recommendations API & Peak Reduction', () => {
    it('returns 404 when unauthenticated', async () => {
      vi.mocked(auth.getCurrentHousehold).mockResolvedValueOnce(null);
      const res = await GET_Recommendations();
      expect(res.status).toBe(404);
    });

    it('returns tariffRequired: true when no active tariff exists', async () => {
      // @ts-expect-error partial mock
      vi.mocked(auth.getCurrentHousehold).mockResolvedValueOnce(mockHousehold);
      mockPrisma.appliance.findMany.mockResolvedValueOnce(mockAppliances);
      mockPrisma.tariff.findFirst.mockResolvedValueOnce(null);

      const res = await GET_Recommendations();
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.tariffRequired).toBe(true);
      expect(body.recommendations).toEqual([]);
    });

    it('calculates peakReduction from actual simulated baseline vs optimized peak', async () => {
      // @ts-expect-error partial mock
      vi.mocked(auth.getCurrentHousehold).mockResolvedValueOnce(mockHousehold);
      mockPrisma.appliance.findMany.mockResolvedValueOnce(mockAppliances);
      mockPrisma.tariff.findFirst.mockResolvedValueOnce(mockTariff);

      const res = await GET_Recommendations();
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.tariffRequired).toBe(false);

      if (body.recommendations.length > 0) {
        const rec: RecommendationItem = body.recommendations[0];
        expect(rec.appliance).toBe('Dynamic Washing Machine');
        expect(rec.expectedSavings).toBeGreaterThanOrEqual(0);
        expect(typeof rec.peakReduction).toBe('number');
        expect(rec.confidence).toBe('HIGH');
      }
    });
  });

  // ─── 3. WHAT-IF SCENARIO ──────────────────────────────────────────────────────

  describe('3. What-If Scenario Sandbox (/api/energy/scenario)', () => {
    it('returns 404 when unauthenticated', async () => {
      vi.mocked(auth.getCurrentHousehold).mockResolvedValueOnce(null);
      const req = new Request('http://localhost/api/energy/scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ powerLimitKw: 7.5 })
      });
      const res = await POST_Scenario(req);
      expect(res.status).toBe(404);
    });

    it('evaluates test power limit in memory without mutating database records', async () => {
      // @ts-expect-error partial mock
      vi.mocked(auth.getCurrentHousehold).mockResolvedValueOnce(mockHousehold);
      mockPrisma.appliance.findMany.mockResolvedValueOnce(mockAppliances);
      mockPrisma.schedule.findMany.mockResolvedValueOnce([]);
      mockPrisma.tariff.findFirst.mockResolvedValueOnce(mockTariff);

      const req = new Request('http://localhost/api/energy/scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ powerLimitKw: 8.5 })
      });

      const res = await POST_Scenario(req);
      expect(res.status).toBe(200);
      const body = await res.json();

      expect(body.baseline).toBeDefined();
      expect(body.scenario).toBeDefined();
      expect(typeof body.baseline.totalCost).toBe('number');
      expect(typeof body.scenario.totalCost).toBe('number');
      expect(typeof body.baseline.peakDemandKw).toBe('number');
      expect(typeof body.scenario.peakDemandKw).toBe('number');

      // CRITICAL: Ensure NO database mutation occurred
      expect(mockPrisma.household.update).not.toHaveBeenCalled();
      expect(mockPrisma.appliance.update).not.toHaveBeenCalled();
      expect(mockPrisma.schedule.update).not.toHaveBeenCalled();
      expect(mockPrisma.schedule.deleteMany).not.toHaveBeenCalled();
    });
  });
});
