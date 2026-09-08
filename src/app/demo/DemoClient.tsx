"use client";

import { Button } from "@/components/ui/button";
import { resetDemoStateAction, runOptimizationAction } from "@/app/actions";
import { useState } from "react";
import { Play, RotateCcw, Zap, Settings, TrendingDown, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function DemoClient({ 
  hasRun, 
  household,
  appliances,
  latestRun
}: { 
  hasRun: boolean, 
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  household: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  appliances: any[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  latestRun: any
}) {
  const [loadingOpt, setLoadingOpt] = useState(false);
  const [loadingReset, setLoadingReset] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRunOptimization = async () => {
    setLoadingOpt(true);
    setError(null);
    try {
      await runOptimizationAction();
      window.location.reload();
    } catch (e) {
      setError(`Optimization failed: ${e instanceof Error ? e.message : 'Unknown error. Check server logs.'}`);
    } finally {
      setLoadingOpt(false);
    }
  };

  const handleReset = async () => {
    setLoadingReset(true);
    setError(null);
    try {
      await resetDemoStateAction();
      window.location.reload();
    } catch (e) {
      setError(`Reset failed: ${e instanceof Error ? e.message : 'Unknown error. Check server logs.'}`);
    } finally {
      setLoadingReset(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <span className="text-emerald-500">HEMS</span> SIH Demonstration Mode
          </h1>
          <p className="text-muted-foreground mt-1">
            Controlled scenario runner to demonstrate the dynamic optimization engine.
          </p>
        </div>
        <Button 
          onClick={handleReset} 
          disabled={loadingOpt || loadingReset}
          variant="outline"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          {loadingReset ? "Resetting Scenario..." : "Reset Demo Data"}
        </Button>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 border border-destructive/40 bg-destructive/10 rounded-lg text-sm text-destructive">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-semibold mb-0.5">Error</div>
            <div>{error}</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* STEP 1: Household State */}
        <Card className="border-l-4 border-l-blue-500 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-blue-500 text-white px-3 py-1 rounded-bl-lg text-xs font-bold uppercase tracking-wider">Step 1</div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Settings className="w-5 h-5 text-blue-500"/> Household Configuration</CardTitle>
            <CardDescription>Initial constraints and active appliances</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-muted p-3 rounded-md">
                  <div className="text-muted-foreground text-xs uppercase font-bold">Power Limit</div>
                  <div className="text-lg font-bold">{household?.powerLimitKw} kW</div>
                </div>
                <div className="bg-muted p-3 rounded-md">
                  <div className="text-muted-foreground text-xs uppercase font-bold">Base Load</div>
                  <div className="text-lg font-bold">{(household?.baseLoad / 10 * 0.5).toFixed(2)} kW</div>
                </div>
                <div className="bg-muted p-3 rounded-md">
                  <div className="text-muted-foreground text-xs uppercase font-bold">Solar Irradiance</div>
                  <div className="text-lg font-bold">{household?.solarIrradiance} W/m²</div>
                </div>
                <div className="bg-muted p-3 rounded-md">
                  <div className="text-muted-foreground text-xs uppercase font-bold">Battery Reserve</div>
                  <div className="text-lg font-bold">{household?.batteryReserve}%</div>
                </div>
              </div>
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold mb-2">Flexible Appliances</h4>
                <div className="flex flex-wrap gap-2">
                  {appliances?.filter(a => a.flexibility === 'shiftable').map(app => (
                    <Badge key={app.id} variant="secondary">{app.name} ({app.ratedPower}kW)</Badge>
                  ))}
                  {appliances?.length === 0 && <span className="text-sm text-muted-foreground">No appliances found.</span>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* STEP 2: Before Optimization */}
        <Card className="border-l-4 border-l-amber-500 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-amber-500 text-white px-3 py-1 rounded-bl-lg text-xs font-bold uppercase tracking-wider">Step 2</div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-500"/> Unoptimized Baseline</CardTitle>
            <CardDescription>Simulated day with earliest-possible scheduling</CardDescription>
          </CardHeader>
          <CardContent>
             {latestRun ? (
               <div className="space-y-4">
                 <div className="grid grid-cols-2 gap-4 text-sm">
                   <div className="border border-border p-3 rounded-md">
                     <div className="text-muted-foreground text-xs uppercase font-bold">Baseline Cost</div>
                     <div className="text-xl font-bold text-destructive">₹{latestRun.baselineCost?.toFixed(2)}</div>
                   </div>
                   <div className="border border-border p-3 rounded-md">
                     <div className="text-muted-foreground text-xs uppercase font-bold">Peak Demand</div>
                     <div className="text-xl font-bold">{latestRun.baselinePeak?.toFixed(2)} kW</div>
                   </div>
                   <div className="border border-border p-3 rounded-md">
                     <div className="text-muted-foreground text-xs uppercase font-bold">Grid Import</div>
                     <div className="text-lg font-semibold">{latestRun.baselineGridImport?.toFixed(2)} kWh</div>
                   </div>
                   <div className="border border-border p-3 rounded-md">
                     <div className="text-muted-foreground text-xs uppercase font-bold">Solar Usage</div>
                     <div className="text-lg font-semibold">{latestRun.baselineSolarUsage?.toFixed(1)}%</div>
                   </div>
                 </div>
               </div>
             ) : (
               <div className="flex items-center justify-center h-32 bg-muted/50 rounded-lg border border-dashed">
                  <p className="text-sm text-muted-foreground">Run optimization to view baseline metrics.</p>
               </div>
             )}
          </CardContent>
        </Card>

        {/* STEP 3: Run Engine */}
        <Card className="md:col-span-2 border-2 border-emerald-500 shadow-md relative overflow-hidden">
          <div className="absolute top-0 left-0 bg-emerald-500 text-white px-3 py-1 rounded-br-lg text-xs font-bold uppercase tracking-wider">Step 3</div>
          <CardContent className="pt-10 pb-6">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <h3 className="text-xl font-bold">Dynamic Optimization Engine</h3>
              <p className="text-muted-foreground max-w-xl">
                The engine evaluates hundreds of possible schedule combinations against dynamic constraints (tariffs, solar, battery state) to mathematically determine the global optimum.
              </p>
              
              {!hasRun ? (
                <Button 
                  onClick={handleRunOptimization} 
                  disabled={loadingOpt || loadingReset || appliances.length === 0}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 px-8 py-6 text-lg mt-4"
                >
                  <Play className="mr-3 h-5 w-5" />
                  {loadingOpt ? "Computing Optimum Schedule..." : "Execute Global Optimization"}
                </Button>
              ) : (
                <div className="flex flex-col items-center gap-2 mt-4">
                  <div className="flex items-center gap-2 px-6 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-600 dark:text-emerald-400 font-bold text-lg">
                    <Zap className="w-5 h-5" />
                    Optimization Successful
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">Backend execution time: {latestRun.runtimeMs}ms</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* STEP 4: Decisions */}
        <Card className="md:col-span-2 border-l-4 border-l-indigo-500 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-indigo-500 text-white px-3 py-1 rounded-bl-lg text-xs font-bold uppercase tracking-wider">Step 4</div>
          <CardHeader>
            <CardTitle>Decision Log</CardTitle>
            <CardDescription>Mathematical justifications for every scheduled shift</CardDescription>
          </CardHeader>
          <CardContent>
            {hasRun ? (
              <div className="space-y-3">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {latestRun.schedules?.map((schedule: any) => {
                  const appName = schedule.appliance?.name || 'Unknown Appliance';
                  const isShifted = schedule.reasonCategory !== 'NO_CHANGE_NEEDED';
                  const isError = schedule.reasonCategory === 'INFEASIBLE';
                  
                  const origStart = schedule.originalStart ? new Date(schedule.originalStart).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--';
                  const newStart = new Date(schedule.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                  const newEnd = new Date(schedule.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', });

                  let badgeColor = "bg-muted text-muted-foreground";
                  if (isError) badgeColor = "bg-destructive/10 text-destructive";
                  else if (isShifted) badgeColor = "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300";

                  return (
                    <div key={schedule.id} className="p-3 border rounded-lg bg-card text-sm">
                      <div className="flex flex-col md:flex-row justify-between gap-4">
                        <div className="md:w-1/3">
                          <div className="font-semibold flex items-center gap-2">
                            {appName}
                            <span className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-full ${badgeColor}`}>
                              {schedule.reasonCategory || 'UNKNOWN'}
                            </span>
                          </div>
                          <div className="font-medium mt-1 text-muted-foreground flex items-center gap-2">
                            {isShifted ? (
                              <><span className="line-through">{origStart}</span><span className="text-foreground font-bold">{newStart}–{newEnd}</span></>
                            ) : (
                              <span>{newStart}–{newEnd}</span>
                            )}
                          </div>
                        </div>
                        <div className="md:w-2/3">
                          <p className="text-muted-foreground">{schedule.reason}</p>
                          {(schedule.impact || schedule.affectedMetric) && (
                            <div className="mt-1 font-medium text-emerald-600 dark:text-emerald-400 text-xs">
                              Impact: {schedule.impact}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground py-4 text-center">Run the optimizer to view decision explanations.</div>
            )}
          </CardContent>
        </Card>

        {/* STEP 5 & 6: After & Impact */}
        <Card className="md:col-span-2 border-l-4 border-l-emerald-500 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-emerald-500 text-white px-3 py-1 rounded-bl-lg text-xs font-bold uppercase tracking-wider">Step 5 & 6</div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingDown className="w-5 h-5 text-emerald-500"/> Final Impact Metrics</CardTitle>
            <CardDescription>Post-optimization performance versus baseline</CardDescription>
          </CardHeader>
          <CardContent>
            {hasRun ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-lg">
                  <div className="text-emerald-700 dark:text-emerald-400 text-xs uppercase font-bold">Cost Savings</div>
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">₹{latestRun.savings?.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground mt-1">Final Cost: ₹{latestRun.projectedCost?.toFixed(2)}</div>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <div className="text-muted-foreground text-xs uppercase font-bold">Peak Reduced</div>
                  <div className="text-xl font-bold mt-1">
                    {(latestRun.baselinePeak - latestRun.projectedPeak).toFixed(2)} kW
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Final Peak: {latestRun.projectedPeak?.toFixed(2)} kW</div>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <div className="text-muted-foreground text-xs uppercase font-bold">Grid Reduction</div>
                  <div className="text-xl font-bold mt-1">
                    {(latestRun.baselineGridImport - latestRun.gridImport).toFixed(2)} kWh
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Final Import: {latestRun.gridImport?.toFixed(2)} kWh</div>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <div className="text-muted-foreground text-xs uppercase font-bold">Solar Util. Growth</div>
                  <div className="text-xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                    +{(latestRun.solarUsage - latestRun.baselineSolarUsage).toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Final Util: {latestRun.solarUsage?.toFixed(1)}%</div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground py-4 text-center">Run the optimizer to view impact metrics.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
