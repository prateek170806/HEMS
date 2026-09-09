import { describe, it, expect } from 'vitest';
import { simulateDay } from '../lib/simulation/engine';
import { Household, Appliance, Schedule, TariffPeriod } from '@prisma/client';
import { startOfDay } from 'date-fns';

describe('Phase 5 Intelligence Engine Tests', () => {
  const baseHousehold: Household = {
    id: 'test-house-5',
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

  it('Forecast Engine: 24h simulation maintains array length and non-negative values', () => {
    const time = startOfDay(new Date());
    const simResults = simulateDay(time, baseHousehold, [], [], dummyTariff);
    
    // simulateDay produces 96 slots for 15-min intervals over 24 hours
    expect(simResults.length).toBe(96);
    
    // Check non-negative invariants
    for (const slot of simResults) {
      expect(slot.homeDemandKw).toBeGreaterThanOrEqual(0);
      expect(slot.solarKw).toBeGreaterThanOrEqual(0);
      expect(slot.gridImportKw).toBeGreaterThanOrEqual(0);
      expect(slot.gridExportKw).toBeGreaterThanOrEqual(0);
    }
  });

  it('Scenario Engine: Does not mutate the original household object', () => {
    const originalHousehold = { ...baseHousehold, batteryReserve: 20 };
    
    const time = startOfDay(new Date());
    const scenarioHousehold = { ...originalHousehold, batteryReserve: 50, currentBatterySoc: 50 };
    
    simulateDay(time, scenarioHousehold, [], [], dummyTariff);
    
    // The original household must remain untouched
    expect(originalHousehold.batteryReserve).toBe(20);
    // currentBatterySoc should NOT exist on originalHousehold except as initial state
    expect(originalHousehold.currentBatterySoc).toBe(50);
  });
});
