import { getCurrentHousehold } from "@/lib/server/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RunOptimizationButton } from "@/components/optimization/RunOptimizationButton";
import { DecisionLog, DecisionLogProps } from "@/components/optimization/DecisionLog";
import prisma from "@/lib/prisma";
import { getPriceForTime } from "@/lib/domain/tariff";
import { setHours, setMinutes } from "date-fns";

function parseTime(baseDate: Date, timeStr: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return setMinutes(setHours(baseDate, hours), minutes);
}

import Link from "next/link";
import { AlertCircle } from "lucide-react";

export default async function SchedulesPage() {
  const household = await getCurrentHousehold();
  if (!household) return <div>No household configured.</div>;

  const tariff = await prisma.tariff.findFirst({
    where: { householdId: household.id, isActive: true },
    include: { periods: true }
  });

  const schedules = await prisma.schedule.findMany({
    where: { householdId: household.id },
    include: { appliance: true },
    orderBy: { startTime: 'asc' }
  });

  const latestRun = await prisma.optimizationRun.findFirst({
    where: { householdId: household.id },
    orderBy: { createdAt: 'desc' }
  });

  const today = new Date();

  const decisionLogs: DecisionLogProps['logs'] = schedules.map(s => {
    const baselineTimeStr = s.appliance?.earliestStart || '00:00';
    const baselineDate = parseTime(today, baselineTimeStr);
    
    let baselineCost = 0;
    if (tariff && tariff.periods.length > 0 && s.appliance) {
      baselineCost = getPriceForTime(tariff.periods, baselineDate) * (s.appliance.minRuntime ?? 0) * (s.appliance.ratedPower ?? 0);
    }

    return {
      scheduleId: s.id,
      applianceName: s.appliance?.name || 'Unknown Appliance',
      baselineTime: baselineTimeStr,
      optimizedTime: s.startTime,
      baselineCost: baselineCost,
      optimizedCost: s.estimatedCost || 0,
      reason: s.reason || "No explanation recorded.",
      isOverridden: s.status === "overridden"
    };
  });

  const hasValidTariff = Boolean(tariff && tariff.periods && tariff.periods.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Optimization Center</h2>
          <p className="text-muted-foreground">
            Create the lowest-cost schedule while respecting your appliances, deadlines, and power limits.
          </p>
        </div>
      </div>

      {!hasValidTariff && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold">Optimization Unavailable</p>
              <p className="text-xs text-muted-foreground">
                No active electricity tariff is configured for this household. Please configure a tariff to enable cost-aware scheduling.
              </p>
            </div>
          </div>
          <Link
            href="/tariffs"
            className="inline-flex items-center justify-center rounded-md text-xs font-medium bg-amber-600 text-white hover:bg-amber-700 px-3 py-2 shrink-0 transition-colors"
          >
            Configure Tariff
          </Link>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Optimization Strategy</CardTitle>
              <CardDescription>Configure how WattWise schedules your flexible loads.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Mode</span>
                  <span className="bg-primary/10 text-primary px-3 py-1 rounded-md text-sm font-medium capitalize">
                    {household.optimizationMode || "Economic"}
                  </span>
                </div>
              </div>

              {latestRun && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-muted/30 rounded-md border border-emerald-100">
                    <span className="text-sm font-medium">Estimated Cost</span>
                    <span className="text-sm font-semibold text-emerald-600">
                      ₹{latestRun.projectedCost?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/30 rounded-md border border-emerald-100">
                    <span className="text-sm font-medium">Estimated Savings</span>
                    <span className="text-sm font-semibold text-emerald-600">
                      ₹{latestRun.savings?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground text-center">
                    Last optimized: {latestRun.createdAt.toLocaleString()}
                  </div>
                </div>
              )}

              <RunOptimizationButton />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Constraints Active</CardTitle>
              <CardDescription>Rules that the optimizer must follow.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                <li className="flex justify-between p-3 border rounded-md bg-muted/20">
                  <span className="font-medium">Household Power Limit</span>
                  <span className="text-amber-600 font-bold">{household.powerLimitKw || 5.5} kW</span>
                </li>
                <li className="flex justify-between p-3 border rounded-md bg-muted/20">
                  <span className="font-medium">Battery Reserve</span>
                  <span className="text-emerald-600 font-bold">{household.batteryReserve || 20}%</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div>
          <DecisionLog logs={decisionLogs} />
        </div>
      </div>
    </div>
  );
}
