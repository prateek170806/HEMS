"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Zap, Sun, Battery, ArrowDownToLine, ArrowUpFromLine, TrendingDown } from "lucide-react";
import { format } from "date-fns";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function DashboardClient({ schedules, powerLimitKw }: { schedules: any[], powerLimitKw: number }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [state, setState] = useState<any>(null);

  const abortRef = useRef<AbortController | null>(null);

  const fetchState = async () => {
    if (document.hidden) return;
    
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/energy/current", { signal: abortRef.current.signal });
      if (res.ok) {
        setState(await res.json());
      }
    } catch (error) {
      const e = error as Error;
      if (e.name !== "AbortError") {
        // fail silently on dashboard
      }
    }
  };

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 3000);
    
    const handleVisibilityChange = () => {
      if (!document.hidden) fetchState();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  if (!state) return <div className="p-8 text-center animate-pulse">Loading live dashboard...</div>;

  const upcomingSchedules = schedules.filter(s => new Date(s.startTime) >= new Date()).slice(0, 5);

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Current Power */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Power</CardTitle>
            <Zap className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{state.homeDemandKw.toFixed(2)} kW</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <TrendingDown className="h-3 w-3 mr-1 text-emerald-500" />
              <span className="text-emerald-500 font-medium mr-1">Dynamic</span> simulated
            </p>
          </CardContent>
        </Card>

        {/* Today's Cost */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Tariff Rate</CardTitle>
            <span className="text-lg">₹</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(state.currentCost / state.gridImportKw || 0).toFixed(2)} / kWh</div>
            <p className="text-xs text-muted-foreground mt-1">
              Live grid cost
            </p>
          </CardContent>
        </Card>

        {/* Peak Demand */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Peak Demand</CardTitle>
            <ArrowUpFromLine className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{state.homeDemandKw.toFixed(2)} kW</div>
            <p className="text-xs text-muted-foreground mt-1">
              Limit: {powerLimitKw} kW
            </p>
          </CardContent>
        </Card>

        {/* Solar & Battery */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">DER Status</CardTitle>
            <div className="flex gap-1">
              <Sun className="h-4 w-4 text-amber-400" />
              <Battery className="h-4 w-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent className="flex justify-between items-end">
            <div>
              <div className="text-2xl font-bold">{state.solarKw.toFixed(2)} kW</div>
              <p className="text-xs text-muted-foreground mt-1">Solar Gen</p>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold">{state.batterySoc.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground mt-1">Battery</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Energy Flow</CardTitle>
            <CardDescription>Simulated live distribution of energy.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center border-t bg-muted/5">
             <div className="flex flex-col items-center justify-center space-y-4 font-mono text-sm">
                <div className="text-amber-500 flex flex-col items-center">
                  <Sun className="h-6 w-6 mb-1" />
                  SOLAR {state.solarKw.toFixed(2)} kW
                </div>
                <ArrowDownToLine className="h-4 w-4 text-muted-foreground animate-bounce" />
                <div className="bg-card border shadow-sm rounded-lg p-6 font-bold text-lg text-center min-w-[200px]">
                  HOME<br />
                  <span className="text-primary">{state.homeDemandKw.toFixed(2)} kW</span>
                </div>
                <div className="flex justify-between w-full max-w-[300px] pt-4">
                  <div className="text-emerald-500 flex flex-col items-center">
                     <ArrowUpFromLine className="h-4 w-4 mb-1" />
                     BATTERY
                     <span className="text-xs">{state.batteryPowerKw > 0 ? '+' : ''}{state.batteryPowerKw.toFixed(2)} kW</span>
                  </div>
                  <div className="text-blue-500 flex flex-col items-center">
                     <ArrowUpFromLine className="h-4 w-4 mb-1" />
                     GRID
                     <span className="text-xs">{state.gridImportKw.toFixed(2)} kW</span>
                  </div>
                </div>
             </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Optimized Digital Schedule</CardTitle>
            <CardDescription>Upcoming automated simulated tasks.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingSchedules.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No upcoming schedules.<br />
                  Run the optimizer to generate a schedule.
                </div>
              ) : (
                upcomingSchedules.map(schedule => {
                  const timeStr = format(new Date(schedule.startTime), "HH:mm");
                  
                  let bgClass = "bg-primary/10";
                  let textClass = "text-primary";
                  
                  if (schedule.appliance?.category === 'ev') {
                     bgClass = "bg-amber-500/10";
                     textClass = "text-amber-600";
                  } else if (schedule.appliance?.category === 'water_heater' || schedule.appliance?.category === 'battery') {
                     bgClass = "bg-emerald-500/10";
                     textClass = "text-emerald-600";
                  }

                  return (
                    <div key={schedule.id} className="flex items-center">
                      <div className="w-16 text-sm font-medium text-muted-foreground">{timeStr}</div>
                      <div className={`flex-1 ${bgClass} rounded-md p-2`}>
                        <p className="text-sm font-medium">{schedule.appliance?.name || 'Unknown Appliance'}</p>
                        <p className={`text-xs ${textClass} flex justify-between`}>
                          <span>Scheduled</span>
                          <span>Est: ₹{schedule.estimatedCost?.toFixed(2) || '0.00'}</span>
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
