import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { generateBaselineSchedule, generateRuleBasedSchedule } from '@/lib/optimization/schedulers';
import { simulateDay } from '@/lib/simulation/engine';
import { getPriceForTime } from '@/lib/domain/tariff';
import { startOfDay } from 'date-fns';

export async function GET() {
  try {
    const household = await prisma.household.findFirst();
    if (!household) return NextResponse.json({ error: 'Household not found' }, { status: 404 });

    const appliances = await prisma.appliance.findMany({ where: { householdId: household.id } });
    const tariff = await prisma.tariff.findFirst({
      where: { householdId: household.id, isActive: true },
      include: { periods: true }
    });
    
    const optSchedules = await prisma.schedule.findMany({
      where: { householdId: household.id, status: 'scheduled' }
    });

    if (!tariff) return NextResponse.json({ error: 'Tariff not found' }, { status: 404 });

    const today = startOfDay(new Date());

    // Generate comparison schedules
    const baselineSchedules = generateBaselineSchedule(appliances, today, tariff.periods);
    const ruleBasedSchedules = generateRuleBasedSchedule(appliances, today, tariff.periods);

    // Simulate their results
    const mapToSchedule = (s: { applianceId: string, startTime: Date, endTime: Date, reason?: string | null, explanation?: string, cost?: number | null, estimatedCost?: number | null }) => ({
      ...s,
      applianceId: s.applianceId,
      startTime: s.startTime,
      endTime: s.endTime,
      id: "sim",
      householdId: household.id,
      optimizationId: null,
      status: "scheduled",
      reason: s.explanation,
      estimatedCost: s.cost,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const simBaseline = simulateDay(today, household, appliances, baselineSchedules.map(mapToSchedule) as never[], 1.0, 1.0);
    const simRuleBased = simulateDay(today, household, appliances, ruleBasedSchedules.map(mapToSchedule) as never[], 1.0, 1.0);
    
    // Use actual DB schedules for the HEMS optimization line
    const simOpt = simulateDay(today, household, appliances, optSchedules as never[], 1.0, 1.0);

    const calculateMetrics = (simResults: { homeDemandKw: number, gridImportKw: number, gridExportKw: number, solarKw: number, timestamp: Date }[]) => {
      let cost = 0;
      let peak = 0;
      let solarSelfConsum = 0;
      let solarGenTotal = 0;
      let gridImport = 0;
  
      for (const slot of simResults) {
        if (slot.homeDemandKw > peak) peak = slot.homeDemandKw;
        cost += slot.gridImportKw * 0.25 * getPriceForTime(tariff.periods, slot.timestamp);
        solarGenTotal += slot.solarKw * 0.25;
        solarSelfConsum += (slot.solarKw - slot.gridExportKw) * 0.25;
        gridImport += slot.gridImportKw * 0.25;
      }
      return { cost, peak, gridImport, solarUtil: solarGenTotal > 0 ? (solarSelfConsum / solarGenTotal) * 100 : 0 };
    };

    const metricsBaseline = calculateMetrics(simBaseline);
    const metricsRuleBased = calculateMetrics(simRuleBased);
    const metricsOpt = calculateMetrics(simOpt);

    return NextResponse.json({
      metricsBaseline,
      metricsRuleBased,
      metricsOpt,
      schedules: {
        baseline: baselineSchedules.length,
        ruleBased: ruleBasedSchedules.length,
        opt: optSchedules.length
      }
    });
  } catch (error) {
    console.error("Analytics Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
