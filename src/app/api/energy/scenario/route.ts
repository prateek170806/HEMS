import { getCurrentHousehold } from "@/lib/server/auth";
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { simulateDay } from "@/lib/simulation/engine";
import { optimizeSchedule } from "@/lib/optimization/schedulers";
import { startOfDay } from "date-fns";
import { z } from "zod";

const scenarioSchema = z.object({
  batteryReserve: z.number().optional(),
  solarIrradiance: z.number().optional(),
  powerLimitKw: z.number().optional(),
  scheduleOverrides: z.array(z.object({
    applianceId: z.string(),
    startTime: z.string(), // ISO string
    endTime: z.string() // ISO string
  })).optional()
});

export async function POST(req: Request) {
  try {
    const household = await getCurrentHousehold();
    if (!household) return NextResponse.json({ error: 'Household not found' }, { status: 404 });

    const body = await req.json();
    const parsed = scenarioSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid scenario payload' }, { status: 400 });
    }

    const scenarioOverrides = parsed.data;

    const appliances = await prisma.appliance.findMany({ where: { householdId: household.id } });
    const schedules = await prisma.schedule.findMany({ where: { householdId: household.id } });
    const tariff = await prisma.tariff.findFirst({
      where: { householdId: household.id, isActive: true },
      include: { periods: true }
    });

    const virtualDay = startOfDay(household.simulationTime);

    // 1. Run baseline simulation (using current settings and schedules)
    const baselineResults = simulateDay(virtualDay, household, appliances, schedules, tariff?.periods || []);
    
    // 2. Prepare scenario schedules
    let scenarioSchedules = [...schedules];
    const scenarioHousehold = { 
      ...household, 
      ...scenarioOverrides, 
      currentBatterySoc: scenarioOverrides.batteryReserve ?? household.batteryReserve 
    };

    if (scenarioOverrides.scheduleOverrides && scenarioOverrides.scheduleOverrides.length > 0) {
      scenarioSchedules = scenarioSchedules.map(sch => {
        const override = scenarioOverrides.scheduleOverrides!.find(o => o.applianceId === sch.applianceId);
        if (override) {
          return { ...sch, startTime: new Date(override.startTime), endTime: new Date(override.endTime) };
        }
        return sch;
      });
    } else if (scenarioOverrides.powerLimitKw !== undefined && tariff && tariff.periods.length > 0) {
      // If powerLimitKw is tested in What-If Sandbox, re-optimize in memory under the new power limit
      const optimizedResults = optimizeSchedule(appliances, virtualDay, tariff.periods, scenarioHousehold);
      scenarioSchedules = optimizedResults.map(opt => ({
        id: `scenario_${opt.applianceId}`,
        householdId: household.id,
        applianceId: opt.applianceId,
        optimizationId: null,
        startTime: opt.startTime,
        endTime: opt.endTime,
        status: 'scheduled',
        reason: opt.explanation,
        reasonCategory: opt.reasonCategory ?? null,
        impact: opt.impact ?? null,
        affectedMetric: opt.affectedMetric ?? null,
        originalStart: opt.originalStart ?? null,
        originalEnd: opt.originalEnd ?? null,
        estimatedCost: opt.cost,
        createdAt: new Date(),
        updatedAt: new Date()
      }));
    }

    // 3. Run scenario simulation in memory
    const scenarioResults = simulateDay(virtualDay, scenarioHousehold, appliances, scenarioSchedules, tariff?.periods || []);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const calcTotalCost = (results: any[]) => results.reduce((sum, slot) => sum + (slot.currentCost || 0), 0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const calcPeak = (results: any[]) => Math.max(0, ...results.map(s => s.homeDemandKw));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const calcGridImport = (results: any[]) => results.reduce((sum, slot) => sum + (slot.gridImportKw || 0) * 0.25, 0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const calcSolarGen = (results: any[]) => results.reduce((sum, slot) => sum + (slot.solarKw || 0) * 0.25, 0);

    const baselineTotalCost = calcTotalCost(baselineResults);
    const scenarioTotalCost = calcTotalCost(scenarioResults);
    const baselinePeak = calcPeak(baselineResults);
    const scenarioPeak = calcPeak(scenarioResults);

    return NextResponse.json({
      baseline: {
        totalCost: Number(baselineTotalCost.toFixed(2)),
        peakDemandKw: Number(baselinePeak.toFixed(2)),
        gridImportKwh: Number(calcGridImport(baselineResults).toFixed(2)),
        solarGenKwh: Number(calcSolarGen(baselineResults).toFixed(2)),
      },
      scenario: {
        totalCost: Number(scenarioTotalCost.toFixed(2)),
        peakDemandKw: Number(scenarioPeak.toFixed(2)),
        gridImportKwh: Number(calcGridImport(scenarioResults).toFixed(2)),
        solarGenKwh: Number(calcSolarGen(scenarioResults).toFixed(2)),
      },
      savings: Number((baselineTotalCost - scenarioTotalCost).toFixed(2)),
      peakReduction: Number((baselinePeak - scenarioPeak).toFixed(2))
    });
  } catch (e) {
    console.error("Scenario error:", e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
