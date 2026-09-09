import { describe, it, expect } from 'vitest';
import { evaluateTick } from '../lib/simulation/tick';
import { Household, Appliance, Schedule, TariffPeriod } from '@prisma/client';
import { startOfDay, addHours } from 'date-fns';

describe('Phase 4 Mathematical Audit Tests', () => {
  const baseHousehold: Household = {
    id: 'test-house',
    userId: 'u1',
    name: 'Audit House',
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    powerLimitKw: 10,
    batteryReserve: 20,
    optimizationMode: 'economic',
    solarIrradiance: 50,
    baseLoad: 0, 
    forecastError: 0,
    smartMeterOffline: false,
    evDisconnected: false,
    inverterFault: false,
    simulationStatus: 'LIVE',
    simulationSpeed: 1,
    simulationTime: new Date(),
    simulationLastTick: new Date(),
    currentBatterySoc: 50,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const dummyTariff: TariffPeriod[] = [{
    id: 't1', tariffId: 't1', name: 'Standard', startTime: '00:00', endTime: '23:59', pricePerKwh: 10, type: 'normal', createdAt: new Date(), updatedAt: new Date()
  }];

  it('Energy Balance: Grid Only (solar=0, battery=unavail)', () => {
    // Night time (02:00) so solar is 0
    const time = addHours(startOfDay(new Date()), 2);
    const hh = { ...baseHousehold, currentBatterySoc: 20, baseLoad: 10 }; // 20% is reserve -> unavailable

    const result = evaluateTick(time, hh, [], [], dummyTariff, 1);
    
    expect(result.solarKw).toBe(0);
    expect(result.batteryPowerKw).toBe(0);
    expect(result.homeDemandKw).toBeGreaterThan(0);
    expect(result.gridImportKw).toBeCloseTo(result.homeDemandKw, 3);
    expect(result.gridExportKw).toBe(0);
  });

  it('Energy Balance: Solar covers load exactly', () => {
    // Midday (12:00)
    const time = addHours(startOfDay(new Date()), 12);
    // Base load = 0, no appliances. Net = -solarKw.
    const result = evaluateTick(time, { ...baseHousehold, currentBatterySoc: 100, baseLoad: 0 }, [], [], dummyTariff, 1);
    
    // The load is artificially set to 0.1 minimum in tick.ts
    expect(result.solarKw).toBeGreaterThan(result.homeDemandKw);
    expect(result.gridImportKw).toBe(0);
  });

  it('Energy Balance: Battery Discharge', () => {
    // Night (02:00)
    const time = addHours(startOfDay(new Date()), 2);
    // Battery has 100% capacity
    const hh = { ...baseHousehold, currentBatterySoc: 100, baseLoad: 20 };

    const result = evaluateTick(time, hh, [], [], dummyTariff, 1);
    
    expect(result.solarKw).toBe(0);
    expect(result.batteryPowerKw).toBeGreaterThan(0); // discharging
    expect(result.gridImportKw).toBeCloseTo(Math.max(0, result.homeDemandKw - result.batteryPowerKw), 3);
  });

  it('Non-Negative Values', () => {
    const time = addHours(startOfDay(new Date()), 12);
    const result = evaluateTick(time, baseHousehold, [], [], dummyTariff, 1);
    
    expect(result.solarKw).toBeGreaterThanOrEqual(0);
    expect(result.gridImportKw).toBeGreaterThanOrEqual(0);
    expect(result.gridExportKw).toBeGreaterThanOrEqual(0);
    expect(result.homeDemandKw).toBeGreaterThanOrEqual(0);
  });
});
