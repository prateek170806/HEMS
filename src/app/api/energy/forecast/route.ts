import { getCurrentHousehold } from "@/lib/server/auth";
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { simulateDay } from "@/lib/simulation/engine";
import { startOfDay } from "date-fns";

export async function GET() {
  try {
    const household = await getCurrentHousehold();
    if (!household) return NextResponse.json({ error: 'Household not found' }, { status: 404 });

    const appliances = await prisma.appliance.findMany({ where: { householdId: household.id } });
    const schedules = await prisma.schedule.findMany({ where: { householdId: household.id } });
    const tariff = await prisma.tariff.findFirst({
      where: { householdId: household.id, isActive: true },
      include: { periods: true }
    });

    const simTime = household.simulationTime;
    
    // Simulate from the start of the virtual day to get the continuous array
    const simResults = simulateDay(startOfDay(simTime), household, appliances, schedules, tariff?.periods || []);

    // Filter to only future intervals up to the end of the day
    const futureResults = simResults.filter(slot => new Date(slot.timestamp) > simTime);

    // Calculate basic forecast metrics
    const forecastedCost = futureResults.reduce((sum, slot) => sum + (slot.currentCost || 0), 0);
    const forecastedPeak = futureResults.length > 0 ? Math.max(0, ...futureResults.map(s => s.homeDemandKw)) : 0;
    const forecastedGridImport = futureResults.reduce((sum, slot) => sum + slot.gridImportKw * 0.25, 0);
    const forecastedGridExport = futureResults.reduce((sum, slot) => sum + slot.gridExportKw * 0.25, 0);
    const expectedSolarGeneration = futureResults.reduce((sum, slot) => sum + slot.solarKw * 0.25, 0);
    const expectedBatteryDischarge = futureResults.reduce((sum, slot) => sum + Math.max(0, slot.batteryPowerKw) * 0.25, 0);

    return NextResponse.json({
      forecastedCost,
      forecastedPeak,
      forecastedGridImport,
      forecastedGridExport,
      expectedSolarGeneration,
      expectedBatteryDischarge,
      intervals: futureResults // Rest of the day
    });
  } catch (e) {
    console.error("Forecast error:", e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
