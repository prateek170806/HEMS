import { getCurrentHousehold } from "@/lib/server/auth";
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { simulateDay } from "@/lib/simulation/engine";
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

    // Run baseline simulation (using current settings)
    const baselineResults = simulateDay(virtualDay, household, appliances, schedules, tariff?.periods || []);
    
    // Prepare scenario schedules
    let scenarioSchedules = [...schedules];
    if (scenarioOverrides.scheduleOverrides && scenarioOverrides.scheduleOverrides.length > 0) {
      scenarioSchedules = scenarioSchedules.map(sch => {
        const override = scenarioOverrides.scheduleOverrides!.find(o => o.applianceId === sch.applianceId);
        if (override) {
          return { ...sch, startTime: new Date(override.startTime), endTime: new Date(override.endTime) };
        }
        return sch;
      });
    }

    // Run scenario simulation
    const scenarioHousehold = { ...household, ...scenarioOverrides, currentBatterySoc: scenarioOverrides.batteryReserve ?? household.batteryReserve };
    const scenarioResults = simulateDay(virtualDay, scenarioHousehold, appliances, scenarioSchedules, tariff?.periods || []);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const calcTotalCost = (results: any[]) => results.reduce((sum, slot) => sum + (slot.currentCost || 0), 0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const calcPeak = (results: any[]) => Math.max(0, ...results.map(s => s.homeDemandKw));

    return NextResponse.json({
      baseline: {
        totalCost: calcTotalCost(baselineResults),
        peakDemandKw: calcPeak(baselineResults)
      },
      scenario: {
        totalCost: calcTotalCost(scenarioResults),
        peakDemandKw: calcPeak(scenarioResults)
      },
      savings: calcTotalCost(baselineResults) - calcTotalCost(scenarioResults)
    });
  } catch (e) {
    console.error("Scenario error:", e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
