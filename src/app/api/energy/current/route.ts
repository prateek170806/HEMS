import { getCurrentHousehold } from "@/lib/server/auth";
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { evaluateTick } from "@/lib/simulation/tick";

export async function GET() {
  try {
    const household = await getCurrentHousehold();
    if (!household) return NextResponse.json({ error: 'Household not found' }, { status: 404 });

    const now = new Date();
    
    // Calculate elapsed real time since last tick
    const elapsedMs = now.getTime() - household.simulationLastTick.getTime();
    
    let newSimTime = household.simulationTime;
    
    // Advance virtual time if LIVE
    if (household.simulationStatus === "LIVE") {
      newSimTime = new Date(household.simulationTime.getTime() + elapsedMs * household.simulationSpeed);
    }
    
    const appliances = await prisma.appliance.findMany({ where: { householdId: household.id } });
    const schedules = await prisma.schedule.findMany({ where: { householdId: household.id } });
    const tariff = await prisma.tariff.findFirst({
      where: { householdId: household.id, isActive: true },
      include: { periods: true }
    });

    const tariffPeriods = tariff?.periods || [];

    // Evaluate authoritative state at new virtual time
    // We calculate the actual virtual time elapsed to scale the battery charge/discharge accurately.
    // If paused (elapsed = 0), we use a tiny non-zero interval to avoid division by zero while returning instantaneous rates.
    // We cap at 0.25 hours (15 mins) per tick to prevent massive single-tick SOC jumps if the tab was closed for hours.
    const virtualElapsedMs = newSimTime.getTime() - household.simulationTime.getTime();
    const intervalHours = Math.min(Math.max(virtualElapsedMs / (1000 * 3600), 0.0001), 0.25);

    const tickResult = evaluateTick(newSimTime, household, appliances, schedules, tariffPeriods, intervalHours);

    // Compute EV specifics for UI
    const evs = appliances.filter(a => a.category === "ev");
    let evPowerKw = 0;
    let evActive = false;
    if (evs.length > 0) {
      const ev = evs[0];
      const activeSchedule = schedules.find(s => s.applianceId === ev.id && newSimTime >= s.startTime && newSimTime < s.endTime);
      if (activeSchedule) {
        evActive = true;
        evPowerKw = ev.ratedPower;
      }
    }

    // Persist new state back to household
    await prisma.household.update({
      where: { id: household.id },
      data: {
        simulationTime: newSimTime,
        simulationLastTick: now,
        currentBatterySoc: tickResult.batterySoc
      }
    });

    // Optionally save historical reading if crossed a 15-min boundary (omitted for now to prevent spam, or we can check time)
    // For simplicity, we just return the authoritative tick state to the frontend
    
    // The frontend expects these fields for live flow:
    return NextResponse.json({
      timestamp: tickResult.timestamp,
      homeDemandKw: tickResult.homeDemandKw,
      solarKw: tickResult.solarKw,
      batterySoc: tickResult.batterySoc,
      batteryPowerKw: tickResult.batteryPowerKw,
      gridImportKw: tickResult.gridImportKw,
      gridExportKw: tickResult.gridExportKw,
      baseLoadKw: tickResult.baseLoadKw,
      applianceLoadKw: tickResult.applianceLoadKw,
      currentCost: tickResult.currentCost,
      status: household.simulationStatus,
      speed: household.simulationSpeed,
      evsCount: evs.length,
      evPowerKw,
      evActive
    });

  } catch (e) {
    console.error("Error in energy tick:", e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
