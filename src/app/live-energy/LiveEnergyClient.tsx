"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Zap, Sun, Battery, Car, ArrowDownToLine, ArrowUpFromLine, Server, Play, Pause, FastForward } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LiveEnergyClient({ initialLimit, baseLoad }: { initialLimit: number, baseLoad: number }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [state, setState] = useState<any>(null);
  const [error, setError] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  const fetchState = async () => {
    if (document.hidden) return;

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/energy/current", { signal: abortRef.current.signal });
      if (res.ok) {
        const data = await res.json();
        setState(data);
        setError(false);
      } else {
        setError(true);
      }
    } catch (error) {
      const e = error as Error;
      if (e.name !== "AbortError") setError(true);
    }
  };

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 3000); // poll every 3s
    
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

  const sendControl = async (action: string, speed?: number) => {
    await fetch("/api/simulation/control", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, speed })
    });
    fetchState();
  };

  if (!state) return <div className="p-8 text-center animate-pulse">Connecting to Live Energy Engine...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error connecting to energy engine.</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Live Energy</h2>
          <div className="flex items-center gap-4 mt-1">
            <p className="text-muted-foreground flex items-center gap-2">
              Real-time authoritative engine state. 
              <span className={`text-xs px-2 py-0.5 rounded-full ${state.status === 'LIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                {state.status} ({state.speed}x)
              </span>
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant={state.status === "LIVE" && state.speed === 1 ? "default" : "outline"} onClick={() => sendControl("LIVE")}>
                <Play className="h-4 w-4 mr-1" /> Live
              </Button>
              <Button size="sm" variant={state.status === "PAUSED" ? "default" : "outline"} onClick={() => sendControl("PAUSE")}>
                <Pause className="h-4 w-4 mr-1" /> Pause
              </Button>
              <Button size="sm" variant={state.status === "LIVE" && state.speed > 1 ? "default" : "outline"} onClick={() => sendControl("SPEED", 60)}>
                <FastForward className="h-4 w-4 mr-1" /> Fast
              </Button>
            </div>
          </div>
        </div>
        <div className="text-right">
            <p className="text-sm font-mono text-muted-foreground">Virtual Time</p>
            <p className="text-xl font-bold">{new Date(state.timestamp).toLocaleTimeString()}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Home Load</CardTitle>
            <Zap className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{state.homeDemandKw.toFixed(2)} kW</div>
            <p className="text-xs text-muted-foreground mt-1">
              Base: {state.baseLoadKw.toFixed(2)} kW
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Grid Import</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{state.gridImportKw.toFixed(2)} kW</div>
            <p className="text-xs text-muted-foreground mt-1 text-red-500">
              {state.gridImportKw > 0 ? "Importing from grid" : "No grid import"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solar Generation</CardTitle>
            <Sun className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{state.solarKw.toFixed(2)} kW</div>
            <p className="text-xs text-muted-foreground mt-1 text-emerald-500">
              {state.solarKw > 0 ? "Generating" : "Inactive"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Battery Storage</CardTitle>
            <Battery className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{state.batterySoc.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {state.batteryPowerKw > 0 ? `Discharging ${state.batteryPowerKw.toFixed(2)} kW` : state.batteryPowerKw < 0 ? `Charging ${Math.abs(state.batteryPowerKw).toFixed(2)} kW` : "Idle"}
            </p>
          </CardContent>
        </Card>

        {state.evsCount > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">EV Status</CardTitle>
              <Car className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{state.evActive ? state.evPowerKw.toFixed(2) : "0.00"} kW</div>
              <p className="text-xs text-muted-foreground mt-1">
                {state.evActive ? "Charging" : "Plugged in, Idle"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Live Energy Flow</CardTitle>
          <CardDescription>Real-time distribution of power in your household at {new Date(state.timestamp).toLocaleTimeString()}.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center border-t bg-muted/5 relative p-6 sm:p-10">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-y-8 md:gap-y-12 gap-x-4 md:gap-x-8 w-full max-w-4xl text-center justify-items-center">
            
            <div className="flex flex-col items-center justify-start h-full col-span-1 md:col-start-1 w-full">
              <div className="h-16 w-16 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center mb-2">
                <Sun className="h-8 w-8 text-amber-500" />
              </div>
              <h3 className="font-bold text-lg">Solar</h3>
              <p className="text-xl font-mono text-amber-600 mb-6">{state.solarKw.toFixed(2)} kW</p>
              <ArrowDownToLine className={`mt-auto h-8 w-8 text-muted-foreground ${state.solarKw > 0 ? "animate-bounce" : "opacity-30"}`} />
            </div>

            <div className="flex flex-col items-center justify-start h-full col-span-1 md:col-start-3 w-full">
              <div className="h-16 w-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-2">
                <Server className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="font-bold text-lg">Grid</h3>
              <p className="text-xl font-mono text-blue-600 mb-6">{state.gridImportKw.toFixed(2)} kW</p>
              <ArrowDownToLine className={`mt-auto h-8 w-8 text-muted-foreground ${state.gridImportKw > 0 ? "animate-bounce" : "opacity-30"}`} />
            </div>

            <div className="flex flex-col items-center justify-center p-6 bg-card border-2 shadow-lg rounded-2xl relative z-10 w-full min-h-[150px] col-span-2 md:col-span-1 md:col-start-2 row-start-2">
              <Zap className="h-10 w-10 text-primary mb-2" />
              <h3 className="font-bold text-2xl">HOME</h3>
              <p className="text-3xl font-mono font-bold text-primary">{state.homeDemandKw.toFixed(2)} kW</p>
            </div>

            <div className="flex flex-col items-center justify-end h-full col-span-1 md:col-start-1 row-start-3 w-full">
              <ArrowUpFromLine className={`mb-auto h-8 w-8 text-muted-foreground ${state.batteryPowerKw !== 0 ? "animate-pulse" : "opacity-30"}`} />
              <div className="h-16 w-16 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center mb-2 mt-6">
                <Battery className="h-8 w-8 text-emerald-500" />
              </div>
              <h3 className="font-bold text-lg">Battery</h3>
              <p className="text-xl font-mono text-emerald-600">
                {state.batteryPowerKw > 0 ? `+${state.batteryPowerKw.toFixed(2)}` : state.batteryPowerKw < 0 ? `${state.batteryPowerKw.toFixed(2)}` : "0.00"} kW
              </p>
              <p className="text-sm font-medium mt-1">{state.batterySoc.toFixed(1)}%</p>
            </div>
            
            {state.evsCount > 0 ? (
              <div className="flex flex-col items-center justify-end h-full col-span-1 md:col-start-3 row-start-3 w-full">
                <ArrowUpFromLine className={`mb-auto h-8 w-8 text-muted-foreground ${state.evActive ? "animate-pulse" : "opacity-30"}`} />
                <div className="h-16 w-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mb-2 mt-6">
                  <Car className="h-8 w-8 text-purple-500" />
                </div>
                <h3 className="font-bold text-lg">EV</h3>
                <p className="text-xl font-mono text-purple-600">{state.evActive ? state.evPowerKw.toFixed(2) : "0.00"} kW</p>
              </div>
            ) : (
              <div className="col-span-1 md:col-start-3 row-start-3"></div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
