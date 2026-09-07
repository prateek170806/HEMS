import { describe, it, expect } from 'vitest';
import { simulateDay } from './engine';
import { Household, Appliance, Schedule } from '@prisma/client';
import { startOfDay } from 'date-fns';

describe('Simulation Engine', () => {
  const mockHousehold: Household = {
    id: '1',
    name: 'Test Home',
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    powerLimitKw: 5.5,
    batteryReserve: 20,
    optimizationMode: 'economic',
    createdAt: new Date(),
    updatedAt: new Date()
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
    const results = simulateDay(today, mockHousehold, [], [], 1.0, 1.0);
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
      estimatedCost: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const results = simulateDay(today, mockHousehold, [mockAppliance], [schedule], 1.0, 1.0);
    
    expect(results[40].applianceLoadKw).toBe(2.0);
    expect(results[43].applianceLoadKw).toBe(2.0);
    expect(results[44].applianceLoadKw).toBe(0.0);
  });

  it('should not let battery drop below reserve SOC', () => {
    const today = startOfDay(new Date());
    const results = simulateDay(today, mockHousehold, [], [], 0.0, 50.0);
    
    for (const slot of results) {
      expect(slot.batterySoc).toBeGreaterThanOrEqual(20);
    }
  });

  it('should correctly balance grid import when demand exceeds solar + battery', () => {
    const today = startOfDay(new Date());
    const results = simulateDay(today, mockHousehold, [], [], 0.0, 20.0);
    
    const slot = results[0]; 
    expect(slot.homeDemandKw).toBeGreaterThan(5);
    expect(slot.batteryPowerKw).toBeLessThanOrEqual(5);
    expect(slot.gridImportKw).toBeCloseTo(slot.homeDemandKw - slot.batteryPowerKw, 1);
  });
});
