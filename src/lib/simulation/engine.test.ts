import { describe, it, expect } from 'vitest';
import { simulateDay } from './engine';
import { Household, Appliance, Schedule } from '@prisma/client';
import { startOfDay } from 'date-fns';

describe('Simulation Engine', () => {
  const mockHousehold: Household = {
    id: '1',
    userId: 'dummy_user',
    name: 'Test Home',
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
    createdAt: new Date(),
    updatedAt: new Date(),
    simulationStatus: 'LIVE',
    simulationSpeed: 1,
    simulationTime: new Date(),
    simulationLastTick: new Date(),
    currentBatterySoc: 20
  };

  const mockAppliance: Appliance = {
    id: 'a1',
    householdId: '1',
    name: 'Washing Machine',
    category: 'washing_machine',
    ratedPower: 2.0,
    status: 'offline',
    flexibility: 'shiftable',
    minRuntime: 1,
    maxRuntime: 1,
    earliestStart: '10:00',
    latestFinish: '16:00',
    priority: 'medium',
    automationEnabled: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  it('should generate 96 slots for a full day', () => {
    const today = startOfDay(new Date());
    const results = simulateDay(today, mockHousehold, [], []);
    expect(results.length).toBe(96);
  });

  it('should integrate appliances into total demand', () => {
    const today = startOfDay(new Date());
    
    const schedule: Schedule = {
      id: 's1',
      householdId: '1',
      applianceId: 'a1',
      optimizationId: null,
      startTime: new Date(today.getTime() + 10 * 3600 * 1000),
      endTime: new Date(today.getTime() + 11 * 3600 * 1000),
      status: 'scheduled',
      reason: null,
      reasonCategory: null,
      impact: null,
      affectedMetric: null,
      originalStart: null,
      originalEnd: null,
      estimatedCost: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const results = simulateDay(today, mockHousehold, [mockAppliance], [schedule]);
    
    expect(results[40].applianceLoadKw).toBe(2.0);
    expect(results[43].applianceLoadKw).toBe(2.0);
    expect(results[44].applianceLoadKw).toBe(0.0);
  });

  it('should not let battery drop below reserve SOC', () => {
    const today = startOfDay(new Date());
    const results = simulateDay(today, { ...mockHousehold, solarIrradiance: 0, baseLoad: 500 }, [], []);
    
    for (const slot of results) {
      expect(slot.batterySoc).toBeGreaterThanOrEqual(20);
    }
  });

  it('should correctly balance grid import when demand exceeds solar + battery', () => {
    const today = startOfDay(new Date());
    const results = simulateDay(today, { ...mockHousehold, solarIrradiance: 0, baseLoad: 200 }, [], []);
    
    const slot = results[0]; 
    expect(slot.homeDemandKw).toBeGreaterThan(5);
    expect(slot.batteryPowerKw).toBeLessThanOrEqual(5);
    expect(slot.gridImportKw).toBeCloseTo(slot.homeDemandKw - slot.batteryPowerKw, 1);
  });
});
