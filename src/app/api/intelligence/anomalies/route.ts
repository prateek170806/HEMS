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
    const tickResult = evaluateTick(
      household.simulationTime,
      household,
      appliances,
      schedules,
      tariff?.periods || [],
      1 / 60
    );

    const anomalies: Array<{
      id: string;
      type: string;
      severity: 'HIGH' | 'MEDIUM' | 'LOW';
      message: string;
      observed: string;
      expected: string;
      impact: string;
      timestamp?: string;
    }> = [];

    // Authoritative expected base-load power from Digital Energy Model: (baseLoad / 10) * 0.5 kW
    const baseLoadSetting = household.baseLoad ?? 10;
    const expectedBaseLoadKw = (baseLoadSetting / 10) * 0.5;

    // A. Unusual Consumption / High Base Load
    // Trigger if setting is elevated (> 15) or observed exceeds expected threshold significantly
    if (household.baseLoad > 15 || tickResult.baseLoadKw > expectedBaseLoadKw * 1.5) {
      anomalies.push({
        id: 'high_base_load',
        type: 'High Base Load',
        severity: household.baseLoad >= 25 ? 'HIGH' : 'MEDIUM',
        message: 'Base load is persistently elevated above normal historical baselines.',
        observed: `${tickResult.baseLoadKw.toFixed(2)} kW`,
        expected: `${expectedBaseLoadKw.toFixed(2)} kW`,
        impact: 'Continuous background energy waste and higher bills.',
        timestamp: household.simulationTime.toISOString()
      });
    }

    // B. Solar Underperformance (during sunlight window 06:00 - 18:00)
    const hour = household.simulationTime.getHours();
    if (hour >= 6 && hour <= 18) {
      const solarFactor = (household.solarIrradiance ?? 50) / 50;
      const expectedPeak = 5.0 * solarFactor * Math.max(0.1, 1 - Math.pow((hour - 12) / 6, 2));
      if (household.inverterFault || tickResult.solarKw < expectedPeak * 0.5) {
        anomalies.push({
          id: 'solar_underperformance',
          type: 'Solar Underperformance',
          severity: household.inverterFault ? 'HIGH' : 'MEDIUM',
          message: household.inverterFault 
            ? 'Inverter fault detected. Generation halted.' 
            : 'Solar generation is significantly below expected capacity for this time of day.',
          observed: `${tickResult.solarKw.toFixed(2)} kW`,
          expected: `${expectedPeak.toFixed(2)} kW`,
          impact: 'Reduced self-consumption and higher grid reliance.',
          timestamp: household.simulationTime.toISOString()
        });
      }
    }

    // C. Excessive Peak Demand
    if (tickResult.homeDemandKw >= household.powerLimitKw * 0.85) {
      const isBreached = tickResult.homeDemandKw > household.powerLimitKw;
      anomalies.push({
        id: 'excessive_peak',
        type: 'Excessive Peak Demand',
        severity: isBreached ? 'HIGH' : 'LOW',
        message: isBreached 
          ? 'Household demand has exceeded the configured power limit!' 
          : 'Household demand is approaching the optimization threshold.',
        observed: `${tickResult.homeDemandKw.toFixed(2)} kW`,
        expected: `< ${household.powerLimitKw.toFixed(2)} kW`,
        impact: 'May trigger peak demand charges or optimization overrides.',
        timestamp: household.simulationTime.toISOString()
      });
    }

    // D. Battery Reserve Depleted
    if (tickResult.batterySoc < household.batteryReserve - 0.5) {
      anomalies.push({
        id: 'battery_depleted',
        type: 'Battery Reserve Depleted',
        severity: tickResult.batterySoc < household.batteryReserve / 2 ? 'HIGH' : 'MEDIUM',
        message: 'Battery state of charge has fallen below the configured reserve.',
        observed: `${tickResult.batterySoc.toFixed(1)}%`,
        expected: `>= ${household.batteryReserve.toFixed(1)}%`,
        impact: 'Reduced backup capacity during grid outages.',
        timestamp: household.simulationTime.toISOString()
      });
    }

    // Sort anomalies by priority: HIGH > MEDIUM > LOW
    const severityWeight: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    anomalies.sort((a, b) => severityWeight[b.severity] - severityWeight[a.severity]);

    return NextResponse.json({ anomalies });
  } catch (e) {
    console.error("Anomaly detection error:", e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
