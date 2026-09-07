import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { optimizeSchedule } from '@/lib/optimization/schedulers';
import { startOfDay } from 'date-fns';

export async function POST(req: Request) {
  try {
    const household = await prisma.household.findFirst();
    if (!household) return NextResponse.json({ error: 'Household not found' }, { status: 404 });

    const appliances = await prisma.appliance.findMany({ where: { householdId: household.id } });
    
    const tariff = await prisma.tariff.findFirst({
      where: { householdId: household.id, isActive: true },
      include: { periods: true }
    });
    
    if (!tariff) return NextResponse.json({ error: 'Active tariff not found' }, { status: 404 });

    const date = startOfDay(new Date());
    
    // Run the optimization logic strictly in the backend
    const schedules = optimizeSchedule(
      appliances,
      date,
      tariff.periods,
      household.powerLimitKw,
      0.5 // Default base load for now
    );

    // Persist optimization run
    const run = await prisma.optimizationRun.create({
      data: {
        householdId: household.id,
        horizonHours: 24,
        status: "success",
        mode: household.optimizationMode,
        explanation: `Optimized ${schedules.length} appliances successfully.`
      }
    });

    // Clean up future pending schedules before inserting new ones
    await prisma.schedule.deleteMany({
      where: {
        householdId: household.id,
        status: "scheduled"
      }
    });

    // Insert new schedules
    const persistedSchedules = [];
    for (const s of schedules) {
      const persisted = await prisma.schedule.create({
        data: {
          householdId: household.id,
          applianceId: s.applianceId,
          optimizationId: run.id,
          startTime: s.startTime,
          endTime: s.endTime,
          estimatedCost: s.cost,
          reason: s.explanation,
          status: "scheduled"
        }
      });
      persistedSchedules.push(persisted);
    }

    return NextResponse.json({ 
      success: true, 
      runId: run.id,
      schedules: persistedSchedules 
    }, { status: 201 });
  } catch (error) {
    console.error("Optimization failed:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
