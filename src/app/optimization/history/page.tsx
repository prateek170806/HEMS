import { getCurrentHousehold } from "@/lib/server/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import prisma from "@/lib/prisma";
import { CalendarClock, ArrowRight, Zap, PiggyBank } from "lucide-react";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function OptimizationHistoryPage() {
  const household = await getCurrentHousehold();
  if (!household) return <div>No household configured.</div>;

  const runs = await prisma.optimizationRun.findMany({
    where: { householdId: household.id },
    orderBy: { createdAt: 'desc' },
    take: 50, // Bound to prevent unbounded deep-include load as history grows
    include: {
      schedules: {
        include: { appliance: true }
      }
    }
  });


  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Optimization History</h2>
        <p className="text-muted-foreground">Review past automated scheduling decisions.</p>
      </div>

      {runs.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No optimization runs found.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {runs.map(run => {
            const dateStr = format(run.createdAt, "dd MMM yyyy · HH:mm");
            const isSuccess = run.status === "success";
            
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const decisions = run.schedules.filter((s: any) => s.reasonCategory !== 'NO_CHANGE_NEEDED');

            return (
              <Card key={run.id} className="overflow-hidden">
                <CardHeader className="bg-muted/30 pb-4 border-b">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg flex items-center">
                        <CalendarClock className="w-5 h-5 mr-2 text-primary" />
                        Optimization Run
                      </CardTitle>
                      <CardDescription>{dateStr}</CardDescription>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${isSuccess ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700'}`}>
                      {run.status}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-6">
                  {isSuccess ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-3 bg-card border rounded-lg shadow-sm">
                          <div className="text-xs uppercase text-muted-foreground font-semibold mb-1">Baseline Cost</div>
                          <div className="font-mono text-lg text-muted-foreground line-through decoration-muted-foreground/50">
                            ₹{run.baselineCost?.toFixed(2) || '0.00'}
                          </div>
                        </div>
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-lg shadow-sm">
                          <div className="text-xs uppercase text-emerald-700 dark:text-emerald-500 font-semibold mb-1">Optimized Cost</div>
                          <div className="font-mono text-lg font-bold text-emerald-700 dark:text-emerald-400">
                            ₹{run.projectedCost?.toFixed(2) || '0.00'}
                          </div>
                        </div>
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-lg shadow-sm">
                          <div className="text-xs uppercase text-blue-700 dark:text-blue-500 font-semibold mb-1 flex items-center">
                            <PiggyBank className="w-3 h-3 mr-1" />
                            Estimated Savings
                          </div>
                          <div className="font-mono text-lg font-bold text-blue-700 dark:text-blue-400">
                            ₹{run.savings?.toFixed(2) || '0.00'}
                          </div>
                        </div>
                        <div className="p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-lg shadow-sm">
                          <div className="text-xs uppercase text-amber-700 dark:text-amber-500 font-semibold mb-1 flex items-center">
                            <Zap className="w-3 h-3 mr-1" />
                            Peak Reduction
                          </div>
                          <div className="font-mono text-lg font-bold text-amber-700 dark:text-amber-400 flex items-center">
                            {run.baselinePeak?.toFixed(1) || '0.0'}
                            <ArrowRight className="w-3 h-3 mx-1" />
                            {run.projectedPeak?.toFixed(1) || '0.0'} kW
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                          Scheduling Decisions ({decisions.length})
                        </h4>
                        
                        {decisions.length === 0 ? (
                          <div className="text-sm text-muted-foreground p-4 bg-muted/20 rounded-md border">
                            No schedules were shifted in this run. Existing configuration was already optimal.
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {decisions.map((s: any) => {
                              const origStart = s.originalStart ? format(new Date(s.originalStart), "HH:mm") : '--:--';
                              const origEnd = s.originalEnd ? format(new Date(s.originalEnd), "HH:mm") : '--:--';
                              const newStart = format(new Date(s.startTime), "HH:mm");
                              const newEnd = format(new Date(s.endTime), "HH:mm");
                              const isError = s.reasonCategory === 'INFEASIBLE';

                              return (
                                <div key={s.id} className={`p-3 border rounded-md text-sm ${isError ? 'bg-destructive/5 border-destructive/20' : 'bg-card'}`}>
                                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                                    <div className="font-medium flex items-center">
                                      {s.appliance?.name || 'Unknown Appliance'}
                                      <span className={`ml-2 px-1.5 py-0.5 text-[9px] uppercase font-bold tracking-wider rounded ${isError ? 'bg-destructive/20 text-destructive' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'}`}>
                                        {s.reasonCategory}
                                      </span>
                                    </div>
                                    <div className="flex items-center text-muted-foreground font-mono text-xs">
                                      <span className="line-through">{origStart} - {origEnd}</span>
                                      <ArrowRight className="w-3 h-3 mx-2 text-foreground" />
                                      <span className="text-foreground font-bold">{newStart} - {newEnd}</span>
                                    </div>
                                  </div>
                                  <p className="text-muted-foreground text-xs">{s.reason}</p>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-destructive font-medium">
                      Optimization failed or was aborted. {run.explanation}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
