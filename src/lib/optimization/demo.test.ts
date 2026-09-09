import { describe, it, expect } from 'vitest';
import { generateBaselineSchedule, generateRuleBasedSchedule, optimizeSchedule } from './schedulers';
import { simulateDay } from '../simulation/engine';
import { Appliance, TariffPeriod, Household } from '@prisma/client';
import { startOfDay } from 'date-fns';
import { getPriceForTime } from '../domain/tariff';

describe('Demo Scenario Verification', () => {
  const household: Household = {
    id: 'h1',
    userId: 'dummy_user',
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
    createdAt: new Date(),
    updatedAt: new Date(),
    simulationStatus: 'LIVE',
    simulationSpeed: 1,
    simulationTime: new Date(),
    simulationLastTick: new Date(),
    currentBatterySoc: 20
  };

  const mockPeriods: TariffPeriod[] = [
    { id: 'p1', tariffId: 't1', name: 'Night Off-Peak', startTime: '00:00', endTime: '06:00', pricePerKwh: 4.0, type: 'off_peak', createdAt: new Date(), updatedAt: new Date() },
    { id: 'p2', tariffId: 't1', name: 'Morning Normal', startTime: '06:00', endTime: '10:00', pricePerKwh: 6.0, type: 'normal', createdAt: new Date(), updatedAt: new Date() },
    { id: 'p3', tariffId: 't1', name: 'Solar Hours', startTime: '10:00', endTime: '17:00', pricePerKwh: 4.5, type: 'solar', createdAt: new Date(), updatedAt: new Date() },
    { id: 'p4', tariffId: 't1', name: 'Evening Peak', startTime: '17:00', endTime: '22:00', pricePerKwh: 12.0, type: 'peak', createdAt: new Date(), updatedAt: new Date() },
    { id: 'p5', tariffId: 't1', name: 'Night Off-Peak 2', startTime: '22:00', endTime: '23:59', pricePerKwh: 4.0, type: 'off_peak', createdAt: new Date(), updatedAt: new Date() }
  ];

  const appliances: Appliance[] = [
    { id: 'a1', householdId: 'h1', name: 'Washing Machine', category: 'washing_machine', ratedPower: 0.5, flexibility: 'shiftable', minRuntime: 2, maxRuntime: 2, earliestStart: '18:00', latestFinish: '23:00', priority: 'medium', automationEnabled: true, status: 'offline', createdAt: new Date(), updatedAt: new Date() },
    { id: 'a2', householdId: 'h1', name: 'Water Heater', category: 'water_heater', ratedPower: 2.0, flexibility: 'shiftable', minRuntime: 1, maxRuntime: 1, earliestStart: '17:00', latestFinish: '20:00', priority: 'high', automationEnabled: true, status: 'offline', createdAt: new Date(), updatedAt: new Date() },
    { id: 'a3', householdId: 'h1', name: 'EV Charger', category: 'ev', ratedPower: 3.3, flexibility: 'shiftable', minRuntime: 4, maxRuntime: 8, earliestStart: '18:00', latestFinish: '08:00', priority: 'high', automationEnabled: true, status: 'offline', createdAt: new Date(), updatedAt: new Date() }
  ];

  const today = startOfDay(new Date());

  const mapToSchedule = (s: { applianceId: string, startTime: Date, endTime: Date, explanation: string, cost: number }) => ({
    applianceId: s.applianceId,
    startTime: s.startTime,
    endTime: s.endTime,
    id: "s1",
    householdId: "h1",
    optimizationId: null,
    status: "scheduled",
    reason: s.explanation,
    estimatedCost: s.cost,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  const calculateTotalCost = (simResults: { gridImportKw: number, timestamp: Date }[]) => {
    let cost = 0;
    for (const slot of simResults) {
       cost += slot.gridImportKw * 0.25 * getPriceForTime(mockPeriods, slot.timestamp);
    }
    return cost;
  };

  it('Baseline should cost more than Rule-Based, which should cost more or equal to HEMS', () => {
    const baseline = generateBaselineSchedule(appliances, today, mockPeriods);
    const ruleBased = generateRuleBasedSchedule(appliances, today, mockPeriods);
    const schedules = optimizeSchedule(appliances, today, mockPeriods, household);
    
    const simBaseline = simulateDay(today, household, appliances, baseline.map(mapToSchedule) as never[]);
    const simRuleBased = simulateDay(today, household, appliances, ruleBased.map(mapToSchedule) as never[]);
    const simOpt = simulateDay(today, household, appliances, schedules.map(mapToSchedule) as never[]);

    const costBaseline = calculateTotalCost(simBaseline);
    const costRuleBased = calculateTotalCost(simRuleBased);
    const costOpt = calculateTotalCost(simOpt);

    // Assert mathematically logical ordering for the demo scenario
    expect(costBaseline).toBeGreaterThan(costRuleBased);
    expect(costRuleBased).toBeGreaterThanOrEqual(costOpt);
  });
});
