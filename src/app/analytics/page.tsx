import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, TrendingDown, Clock, Zap } from "lucide-react";
import prisma from "@/lib/server/db";
import { DemoButton } from "@/components/demo/DemoButton";

export default async function AnalyticsPage() {
  const household = await prisma.household.findFirst();
  if (!household) return <div>No household configured.</div>;
  
  const latestRun = (await prisma.optimizationRun.findFirst({
    where: { householdId: household.id, status: "success" },
    orderBy: { createdAt: 'desc' },
    include: {
      schedules: {
        include: { appliance: true }
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  })) as any;

  if (!latestRun) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Research & Analytics</h2>
            <p className="text-muted-foreground">
              Compare baseline usage against HEMS optimized schedules.
            </p>
          </div>
          <DemoButton />
        </div>
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No optimization run found. Please run the optimizer or initialize the demo scenario.
          </CardContent>
        </Card>
      </div>
    );
  }

  const baselineCost = latestRun.baselineCost || 0;
  const optCost = latestRun.projectedCost || 0;
  
  const baselinePeak = latestRun.baselinePeak || 0;
  const optPeak = latestRun.projectedPeak || 0;

  const baselineGridImport = latestRun.baselineGridImport || 0;
  const optGridImport = latestRun.gridImport || 0;

  const baselineSolarUtil = latestRun.baselineSolarUsage || 0;
  const optSolarUtil = latestRun.solarUsage || 0;

  // Impact calculations
  const costSavings = Math.max(0, baselineCost - optCost);
  const costSavingsPct = baselineCost > 0 ? (costSavings / baselineCost) * 100 : 0;
  
  const peakReduction = Math.max(0, baselinePeak - optPeak);
  const peakReductionPct = baselinePeak > 0 ? (peakReduction / baselinePeak) * 100 : 0;
  
  const gridReduction = Math.max(0, baselineGridImport - optGridImport);
  const gridReductionPct = baselineGridImport > 0 ? (gridReduction / baselineGridImport) * 100 : 0;
  
  const solarImprovement = optSolarUtil - baselineSolarUtil; // Absolute percentage points

  const optTime = latestRun.runtimeMs || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Research & Analytics</h2>
          <p className="text-muted-foreground">
            Compare baseline usage against HEMS optimized schedules.
          </p>
        </div>
        <DemoButton />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cost Savings</CardTitle>
            <TrendingDown className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{costSavingsPct.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">₹{costSavings.toFixed(2)} saved vs baseline</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Peak Reduction</CardTitle>
            <Zap className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{peakReductionPct.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">{optPeak.toFixed(1)} kW vs {baselinePeak.toFixed(1)} kW baseline</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Solar Self-Consumption</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{optSolarUtil.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {solarImprovement > 0 ? `+${solarImprovement.toFixed(0)}% vs baseline` : "No change"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Optimization Time</CardTitle>
            <Clock className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{optTime}ms</div>
            <p className="text-xs text-muted-foreground mt-1">Heuristic solver runtime</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Before vs After Optimization</CardTitle>
          <CardDescription>Evaluation of HEMS dynamic scheduling vs unmanaged baseline.</CardDescription>
        </CardHeader>
        <CardContent>
          {costSavings > 0 && (
             <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-md text-sm font-medium">
               ✨ HEMS reduced daily energy cost by {costSavingsPct.toFixed(1)}% without violating any hard comfort constraints.
             </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                <tr>
                  <th className="px-4 py-3">Metric</th>
                  <th className="px-4 py-3">Before (Baseline)</th>
                  <th className="px-4 py-3">After (HEMS)</th>
                  <th className="px-4 py-3">Impact</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">Energy Cost</td>
                  <td className="px-4 py-3 font-mono">₹{baselineCost.toFixed(2)}</td>
                  <td className="px-4 py-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">₹{optCost.toFixed(2)}</td>
                  <td className="px-4 py-3 font-medium text-emerald-600 dark:text-emerald-400">
                    {costSavingsPct > 0 ? `-${costSavingsPct.toFixed(1)}% (₹${costSavings.toFixed(2)})` : '-'}
                  </td>
                </tr>
                <tr className="border-b hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">Peak Demand</td>
                  <td className="px-4 py-3 font-mono">{baselinePeak.toFixed(2)} kW</td>
                  <td className="px-4 py-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">{optPeak.toFixed(2)} kW</td>
                  <td className="px-4 py-3 font-medium text-emerald-600 dark:text-emerald-400">
                    {peakReductionPct > 0 ? `-${peakReductionPct.toFixed(1)}%` : '-'}
                  </td>
                </tr>
                <tr className="border-b hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">Grid Import</td>
                  <td className="px-4 py-3 font-mono">{baselineGridImport > 0 ? `${baselineGridImport.toFixed(2)} kWh` : '-'}</td>
                  <td className="px-4 py-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">{optGridImport > 0 ? `${optGridImport.toFixed(2)} kWh` : '-'}</td>
                  <td className="px-4 py-3 font-medium text-emerald-600 dark:text-emerald-400">
                    {gridReductionPct > 0 ? `-${gridReductionPct.toFixed(1)}%` : '-'}
                  </td>
                </tr>
                <tr className="border-b hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">Solar Usage</td>
                  <td className="px-4 py-3 font-mono">{baselineSolarUtil > 0 ? `${baselineSolarUtil.toFixed(0)}%` : '-'}</td>
                  <td className="px-4 py-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">{optSolarUtil > 0 ? `${optSolarUtil.toFixed(0)}%` : '-'}</td>
                  <td className="px-4 py-3 font-medium text-emerald-600 dark:text-emerald-400">
                    {solarImprovement > 0 ? `+${solarImprovement.toFixed(0)}%` : '-'}
                  </td>
                </tr>
                <tr className="border-b hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">Power Limit Violation</td>
                  <td className="px-4 py-3 text-destructive">{baselinePeak > household.powerLimitKw ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">{optPeak > household.powerLimitKw ? 'Yes (Soft)' : 'No'}</td>
                  <td className="px-4 py-3 text-muted-foreground">-</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* DECISION LOG UI */}
      <Card>
        <CardHeader>
          <CardTitle>Optimization Decisions</CardTitle>
          <CardDescription>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            Analyzed {latestRun.schedules?.length || 0} appliances and identified {latestRun.schedules?.filter((s: any) => s.reasonCategory !== 'NO_CHANGE_NEEDED').length || 0} scheduling shifts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {latestRun.schedules?.map((schedule: any) => {
              const appName = schedule.appliance?.name || 'Unknown Appliance';
              const isShifted = schedule.reasonCategory !== 'NO_CHANGE_NEEDED';
              const isError = schedule.reasonCategory === 'INFEASIBLE';
              
              const origStart = schedule.originalStart ? new Date(schedule.originalStart).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--';
              const origEnd = schedule.originalEnd ? new Date(schedule.originalEnd).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--';
              const newStart = new Date(schedule.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
              const newEnd = new Date(schedule.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

              let badgeColor = "bg-muted text-muted-foreground";
              if (isError) badgeColor = "bg-destructive/10 text-destructive";
              else if (isShifted) badgeColor = "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";

              return (
                <div key={schedule.id} className="p-4 border rounded-lg bg-card text-card-foreground">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{appName}</h4>
                        <span className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-full ${badgeColor}`}>
                          {schedule.reasonCategory || 'UNKNOWN'}
                        </span>
                      </div>
                      
                      <div className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                        {isShifted ? (
                          <>
                            <span className="line-through opacity-70">{origStart} - {origEnd}</span>
                            <span className="text-primary font-bold">→</span>
                            <span className="text-foreground font-bold">{newStart} - {newEnd}</span>
                          </>
                        ) : (
                          <span>{newStart} - {newEnd}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="md:w-1/2 space-y-2 text-sm">
                      <div>
                        <span className="font-semibold text-xs uppercase text-muted-foreground">Reason</span>
                        <p>{schedule.reason || 'No detailed reason provided.'}</p>
                      </div>
                      {(schedule.impact || schedule.affectedMetric) && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-semibold uppercase text-muted-foreground">Impact:</span>
                          <span className={isShifted && !isError ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-muted-foreground"}>
                            {schedule.impact || 'None'}
                          </span>
                          {schedule.affectedMetric && (
                            <span className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-medium uppercase">
                              {schedule.affectedMetric}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {(!latestRun.schedules || latestRun.schedules.length === 0) && (
              <div className="text-sm text-muted-foreground text-center py-4">
                No scheduling decisions recorded for this run.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
