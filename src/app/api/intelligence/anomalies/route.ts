import { getCurrentHousehold } from "@/lib/server/auth";
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { evaluateTick } from "@/lib/simulation/tick";

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

    // We use a small interval since we're just probing the instantaneous state
    const tickResult = evaluateTick(household.simulationTime, household, appliances, schedules, tariff?.periods || [], 1/60);

    const anomalies = [];

    // A. Unusual Consumption / High Base Load
    // If the base load is significantly higher than the standard 10
    if (household.baseLoad > 15) {
      anomalies.push({
        id: 'high_base_load',
        type: 'High Base Load',
        severity: 'MEDIUM',
        message: 'Base load is persistently elevated above normal historical baselines.',
        observed: `${(household.baseLoad / 2).toFixed(2)} kW`, // approximation of baseLoad setting to kW
        expected: '0.50 kW',
        impact: 'Continuous background energy waste and higher bills.'
      });
    }

    // B. Solar Underperformance
    const hour = household.simulationTime.getHours();
    if (hour > 10 && hour < 15) {
      const expectedPeak = 5.0 * ((household.solarIrradiance ?? 50) / 50);
      if (household.inverterFault || tickResult.solarKw < expectedPeak * 0.5) {
        anomalies.push({
          id: 'solar_underperformance',
          type: 'Solar Underperformance',
          severity: household.inverterFault ? 'HIGH' : 'MEDIUM',
          message: household.inverterFault ? 'Inverter fault detected. Generation halted.' : 'Solar generation is significantly below expected capacity for this time of day.',
          observed: `${tickResult.solarKw.toFixed(2)} kW`,
          expected: `${expectedPeak.toFixed(2)} kW`,
          impact: 'Reduced self-consumption and higher grid reliance.'
        });
      }
    }

    // C. Excessive Peak Demand
    if (tickResult.homeDemandKw >= household.powerLimitKw * 0.9) {
      anomalies.push({
        id: 'excessive_peak',
        type: 'Excessive Peak Demand',
        severity: tickResult.homeDemandKw > household.powerLimitKw ? 'HIGH' : 'LOW',
        message: tickResult.homeDemandKw > household.powerLimitKw 
          ? 'Household demand has exceeded the soft optimization limit!' 
          : 'Household demand is approaching the optimization threshold.',
        observed: `${tickResult.homeDemandKw.toFixed(2)} kW`,
        expected: `< ${household.powerLimitKw.toFixed(2)} kW`,
        impact: 'May trigger peak demand charges or optimization overrides.'
      });
    }

    // D. Battery Reserve Depleted
    if (tickResult.batterySoc < household.batteryReserve - 1) {
      anomalies.push({
        id: 'battery_depleted',
        type: 'Battery Reserve Depleted',
        severity: 'MEDIUM',
        message: 'Battery state of charge has fallen below the configured reserve.',
        observed: `${tickResult.batterySoc.toFixed(1)}%`,
        expected: `>= ${household.batteryReserve.toFixed(1)}%`,
        impact: 'Reduced backup capacity during grid outages.'
      });
    }

    return NextResponse.json({ anomalies });
  } catch (e) {
    console.error("Anomaly detection error:", e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
