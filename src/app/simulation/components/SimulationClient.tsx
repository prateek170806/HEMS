"use client";

import { useState, useTransition, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { RefreshCcw, CloudRain, Sun, ZapOff, Loader2, AlertTriangle } from "lucide-react";
import { resetDemoStateAction, updateSimulationStateAction } from "@/app/actions";

interface SimulationClientProps {
  initialSolarIrradiance: number;
  initialBaseLoad: number;
  initialForecastError: number;
  initialSmartMeterOffline: boolean;
  initialEvDisconnected: boolean;
  initialInverterFault: boolean;
}

export default function SimulationClient({
  initialSolarIrradiance,
  initialBaseLoad,
  initialForecastError,
  initialSmartMeterOffline,
  initialEvDisconnected,
  initialInverterFault,
}: SimulationClientProps) {
  const [isPending, startTransition] = useTransition();
  const [isSaving, startSaving] = useTransition();
  const [resetStatus, setResetStatus] = useState<"idle" | "success" | "error">("idle");

  // Slider states
  const [irradiance, setIrradiance] = useState(initialSolarIrradiance);
  const [forecastError, setForecastError] = useState(initialForecastError);
  const [baseLoad, setBaseLoad] = useState(initialBaseLoad);

  // Fault states
  const [smartMeterOffline, setSmartMeterOffline] = useState(initialSmartMeterOffline);
  const [evDisconnected, setEvDisconnected] = useState(initialEvDisconnected);
  const [inverterFault, setInverterFault] = useState(initialInverterFault);

  // Derived simulation factors
  const solarFactor = irradiance / 50;
  const baseLoadKw = (baseLoad / 10) * 0.5;
  const forecastErrorPct = forecastError;

  const handleUpdate = useCallback((data: {
    solarIrradiance?: number;
    baseLoad?: number;
    forecastError?: number;
    smartMeterOffline?: boolean;
    evDisconnected?: boolean;
    inverterFault?: boolean;
  }) => {
    startSaving(() => {
      updateSimulationStateAction(data).catch(console.error);
    });
  }, []);

  const handleReset = () => {
    setResetStatus("idle");
    startTransition(async () => {
      try {
        await resetDemoStateAction();
        setResetStatus("success");
        setIrradiance(50);
        setForecastError(0);
        setBaseLoad(10);
        setSmartMeterOffline(false);
        setEvDisconnected(false);
        setInverterFault(false);
      } catch {
        setResetStatus("error");
      }
    });
  };

  const faultCount = [smartMeterOffline, evDisconnected, inverterFault].filter(Boolean).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            Simulation Mode 
            {isSaving && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
          </h2>
          <p className="text-muted-foreground">
            Test the WattWise system under different scenarios. Changes automatically affect the optimizer.
          </p>
        </div>
        <Button variant="outline" onClick={handleReset} disabled={isPending}>
          {isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCcw className="w-4 h-4 mr-2" />
          )}
          {isPending ? "Resetting..." : "Reset Simulation"}
        </Button>
      </div>

      {resetStatus === "success" && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-sm text-emerald-800 font-medium">
          ✓ Simulation reset — Demo Household and schedules restored.
        </div>
      )}
      {resetStatus === "error" && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive font-medium">
          ✗ Reset failed. Ensure the database is connected and try again.
        </div>
      )}

      {faultCount > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-300 rounded-md text-sm text-amber-800 font-medium flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          {faultCount} fault{faultCount > 1 ? 's' : ''} active: {[
            smartMeterOffline && "Smart Meter Offline",
            evDisconnected && "EV Charger Disconnected",
            inverterFault && "Inverter Comms Failure",
          ].filter(Boolean).join(', ')}. Optimization will account for available data.
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Environment */}
        <Card>
          <CardHeader>
            <CardTitle>Environment</CardTitle>
            <CardDescription>Adjust weather and external factors.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Sun className="w-4 h-4 text-amber-500" />
                  Solar Irradiance
                </label>
                <span className="text-sm font-medium text-amber-600">
                  {irradiance}% ({solarFactor.toFixed(2)}× factor)
                </span>
              </div>
              <Slider
                value={[irradiance]}
                onValueChange={(v: number | readonly number[]) => setIrradiance(Array.isArray(v) ? v[0] : v)}
                onValueCommitted={(v: number | readonly number[]) => handleUpdate({ solarIrradiance: Array.isArray(v) ? v[0] : v })}
                max={100}
                step={5}
              />
              <p className="text-xs text-muted-foreground">
                Affects solar generation on Overview and Solar pages. 50% = normal day.
              </p>
            </div>

            <div className="space-y-3 pt-4">
              <div className="flex justify-between">
                <label className="text-sm font-medium flex items-center gap-2">
                  <CloudRain className="w-4 h-4 text-blue-500" />
                  Forecast Error
                </label>
                <span className="text-sm font-medium text-blue-600">{forecastErrorPct}%</span>
              </div>
              <Slider
                value={[forecastError]}
                onValueChange={(v: number | readonly number[]) => setForecastError(Array.isArray(v) ? v[0] : v)}
                onValueCommitted={(v: number | readonly number[]) => handleUpdate({ forecastError: Array.isArray(v) ? v[0] : v })}
                max={50}
                step={5}
              />
              <p className="text-xs text-muted-foreground">
                Simulates forecast uncertainty. Higher = less accurate solar/demand predictions.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Grid & Household */}
        <Card>
          <CardHeader>
            <CardTitle>Grid & Household</CardTitle>
            <CardDescription>Simulate grid events and base load.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <label className="text-sm font-medium">Household Base Load</label>
                <span className="text-sm font-medium">{baseLoadKw.toFixed(2)} kW</span>
              </div>
              <Slider
                value={[baseLoad]}
                onValueChange={(v: number | readonly number[]) => setBaseLoad(Array.isArray(v) ? v[0] : v)}
                onValueCommitted={(v: number | readonly number[]) => handleUpdate({ baseLoad: Array.isArray(v) ? v[0] : v })}
                max={50}
                step={1}
              />
              <p className="text-xs text-muted-foreground">
                Background load from always-on devices (lighting, fridge, etc.)
              </p>
            </div>

            <div className="border-t pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Demand Response Event</label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Grid asking to reduce load
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const newVal = Math.min(50, baseLoad + 20);
                    setBaseLoad(newVal);
                    handleUpdate({ baseLoad: newVal });
                    alert("Demand Response event triggered! Base load increased to simulate peak demand. Run Optimization to re-schedule loads.");
                  }}
                >
                  Trigger Event
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fault Injection */}
        <Card>
          <CardHeader>
            <CardTitle>Fault Injection</CardTitle>
            <CardDescription>Test system resilience and error recovery.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-2">
                <ZapOff className="w-4 h-4 text-destructive" />
                <div>
                  <label className="text-sm font-medium">Smart Meter Offline</label>
                  {smartMeterOffline && (
                    <p className="text-xs text-amber-600">⚠ Using estimated readings</p>
                  )}
                </div>
              </div>
              <Switch
                checked={smartMeterOffline}
                onCheckedChange={(checked) => {
                  setSmartMeterOffline(checked);
                  handleUpdate({ smartMeterOffline: checked });
                }}
              />
            </div>

            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <label className="text-sm font-medium">EV Charger Disconnected</label>
                {evDisconnected && (
                  <p className="text-xs text-amber-600">⚠ EV excluded from schedule</p>
                )}
              </div>
              <Switch
                checked={evDisconnected}
                onCheckedChange={(checked) => {
                  setEvDisconnected(checked);
                  handleUpdate({ evDisconnected: checked });
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Inverter Comms Failure</label>
                {inverterFault && (
                  <p className="text-xs text-amber-600">⚠ Solar data unavailable</p>
                )}
              </div>
              <Switch
                checked={inverterFault}
                onCheckedChange={(checked) => {
                  setInverterFault(checked);
                  handleUpdate({ inverterFault: checked });
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Simulation Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Current Simulation Parameters</CardTitle>
          <CardDescription>These values affect the deterministic simulation engine across all pages.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="text-muted-foreground text-xs uppercase font-medium mb-1">Solar Factor</div>
              <div className="text-lg font-bold text-amber-600">{solarFactor.toFixed(2)}×</div>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="text-muted-foreground text-xs uppercase font-medium mb-1">Base Load</div>
              <div className="text-lg font-bold">{baseLoadKw.toFixed(2)} kW</div>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="text-muted-foreground text-xs uppercase font-medium mb-1">Forecast Error</div>
              <div className="text-lg font-bold text-blue-600">±{forecastErrorPct}%</div>
            </div>
            <div className={`p-3 rounded-lg ${faultCount > 0 ? 'bg-amber-50 border border-amber-200' : 'bg-muted/30'}`}>
              <div className="text-muted-foreground text-xs uppercase font-medium mb-1">Active Faults</div>
              <div className={`text-lg font-bold ${faultCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {faultCount === 0 ? 'None' : faultCount}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
