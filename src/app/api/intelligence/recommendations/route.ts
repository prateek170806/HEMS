import { getCurrentHousehold } from "@/lib/server/auth";
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { optimizeSchedule } from "@/lib/optimization/schedulers";
import { startOfDay, format } from "date-fns";

export async function GET() {
  try {
    const household = await getCurrentHousehold();
    if (!household) return NextResponse.json({ error: 'Household not found' }, { status: 404 });

    const appliances = await prisma.appliance.findMany({ where: { householdId: household.id } });
    const tariff = await prisma.tariff.findFirst({
      where: { householdId: household.id, isActive: true },
      include: { periods: true }
    });

    if (!tariff) return NextResponse.json({ recommendations: [] });

    // Generate intelligent recommendations starting from today
    const date = startOfDay(household.simulationTime);
    const optimizedResults = optimizeSchedule(appliances, date, tariff.periods, household);

    const recommendations = [];

    for (const result of optimizedResults) {
      if (!result.reasonCategory || result.reasonCategory === 'NO_CHANGE_NEEDED' || result.reasonCategory === 'INFEASIBLE') {
        continue;
      }

      const appliance = appliances.find(a => a.id === result.applianceId);
      if (!appliance) continue;

      let expectedSavings = 0;
      let peakReduction = 0;

      // Extract precise numbers from the explanation if available (we saved them during optimization)
      // We know our optimization logic produces exact impact strings.
      if (result.impact?.includes('Saved ₹')) {
        const match = result.impact.match(/Saved ₹([\d.]+)/);
        if (match) expectedSavings = parseFloat(match[1]);
      }
      if (result.impact === 'Avoided power limit violation') {
        peakReduction = 0.5; // Estimated conservative impact based on typical shift
      }

      recommendations.push({
        id: `rec_${result.applianceId}`,
        type: result.reasonCategory,
        appliance: appliance.name,
        originalStart: result.originalStart ? format(result.originalStart, 'HH:mm') : null,
        proposedStart: format(result.startTime, 'HH:mm'),
        reason: result.explanation,
        expectedSavings,
        peakReduction,
        confidence: 'HIGH', // Deterministic schedules provide high confidence
        impact: result.impact
      });
    }

    return NextResponse.json({ recommendations });
  } catch (e) {
    console.error("Recommendations error:", e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
