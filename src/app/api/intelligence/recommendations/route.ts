import { getCurrentHousehold } from "@/lib/server/auth";
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { optimizeSchedule, generateBaselineSchedule } from "@/lib/optimization/schedulers";
import { simulateDay } from "@/lib/simulation/engine";
import { startOfDay, format } from "date-fns";
import { Schedule } from "@prisma/client";

export async function GET() {
  try {
    const household = await getCurrentHousehold();
    if (!household) return NextResponse.json({ error: 'Household not found' }, { status: 404 });

    const appliances = await prisma.appliance.findMany({ 
      where: { householdId: household.id },
      orderBy: { createdAt: 'asc' }
    });
    
    const tariff = await prisma.tariff.findFirst({
      where: { householdId: household.id, isActive: true },
      include: { periods: true }
    });

    if (!tariff || !tariff.periods || tariff.periods.length === 0) {
      return NextResponse.json({ 
        recommendations: [], 
        tariffRequired: true,
        message: 'Configure an active tariff to generate optimization opportunities.'
      });
    }

    if (appliances.length === 0) {
      return NextResponse.json({ recommendations: [], tariffRequired: false });
    }

    const date = startOfDay(household.simulationTime);

    // 1. Authoritative baseline schedule & simulation
    const baselineResults = generateBaselineSchedule(appliances, date, tariff.periods);
    const baselineSchedules: Schedule[] = baselineResults.map(b => ({
      id: `baseline_${b.applianceId}`,
      householdId: household.id,
      applianceId: b.applianceId,
      optimizationId: null,
      startTime: b.startTime,
      endTime: b.endTime,
      status: 'scheduled',
      reason: b.explanation,
      reasonCategory: b.reasonCategory ?? null,
      impact: b.impact ?? null,
      affectedMetric: b.affectedMetric ?? null,
      originalStart: b.originalStart ?? null,
      originalEnd: b.originalEnd ?? null,
      estimatedCost: b.cost,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    const baselineSim = simulateDay(date, household, appliances, baselineSchedules, tariff.periods);
    const baselinePeak = Math.max(0, ...baselineSim.map(s => s.homeDemandKw));

    // 2. Authoritative optimized schedule & simulation
    const optimizedResults = optimizeSchedule(appliances, date, tariff.periods, household);
    const optimizedSchedules: Schedule[] = optimizedResults.map(opt => ({
      id: `opt_${opt.applianceId}`,
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
    const optimizedSim = simulateDay(date, household, appliances, optimizedSchedules, tariff.periods);
    const optimizedPeak = Math.max(0, ...optimizedSim.map(s => s.homeDemandKw));

    // 3. True Peak Reduction: baselinePeak - optimizedPeak
    const overallPeakReduction = Number(Math.max(0, baselinePeak - optimizedPeak).toFixed(2));

    const recommendations = [];

    for (const result of optimizedResults) {
      if (!result.reasonCategory || result.reasonCategory === 'NO_CHANGE_NEEDED' || result.reasonCategory === 'INFEASIBLE') {
        continue;
      }

      const appliance = appliances.find(a => a.id === result.applianceId);
      if (!appliance) continue;

      const baseline = baselineResults.find(b => b.applianceId === result.applianceId);
      
      let expectedSavings = 0;
      if (baseline) {
        expectedSavings = Math.max(0, baseline.cost - result.cost);
      }

      // Check impact string if present
      if (result.impact?.includes('Saved ₹')) {
        const match = result.impact.match(/Saved ₹([\d.]+)/);
        if (match) {
          const parsed = parseFloat(match[1]);
          if (!isNaN(parsed) && parsed > 0) expectedSavings = parsed;
        }
      }

      // Peak impact per recommendation: actual peak reduction from simulation
      const peakReduction = overallPeakReduction;

      // Only recommend if there is a real shift or meaningful impact
      const originalStartStr = result.originalStart 
        ? format(result.originalStart, 'HH:mm') 
        : (appliance.earliestStart || '00:00');
      const proposedStartStr = format(result.startTime, 'HH:mm');

      recommendations.push({
        id: `rec_${result.applianceId}`,
        type: result.reasonCategory,
        appliance: appliance.name,
        originalStart: originalStartStr,
        proposedStart: proposedStartStr,
        reason: result.explanation,
        expectedSavings: Number(expectedSavings.toFixed(2)),
        peakReduction: Number(peakReduction.toFixed(1)),
        confidence: 'HIGH',
        impact: result.impact ?? 'Optimized schedule'
      });
    }

    return NextResponse.json({ recommendations, tariffRequired: false });
  } catch (e) {
    console.error("Recommendations error:", e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
