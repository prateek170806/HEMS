"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertTriangle, Lightbulb, TrendingDown, ShieldAlert, Sparkles, SlidersHorizontal, Calculator, LineChart as LineChartIcon } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format } from "date-fns";

export function IntelligenceCenter() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [anomalies, setAnomalies] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [recommendations, setRecommendations] = useState<any[]>([]);
  
  // Forecast state
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [forecast, setForecast] = useState<any>(null);
  const [forecastLoading, setForecastLoading] = useState(true);
  const [forecastError, setForecastError] = useState(false);

  // Scenario sandbox state
  const [scenarioPowerLimit, setScenarioPowerLimit] = useState(5.5);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [scenarioResult, setScenarioResult] = useState<any>(null);
  const [scenarioLoading, setScenarioLoading] = useState(false);

  // Abort controller refs
  const intelAbortRef = useRef<AbortController | null>(null);
  const forecastAbortRef = useRef<AbortController | null>(null);

  const fetchIntelligence = async () => {
    if (document.hidden) return;
    
    if (intelAbortRef.current) intelAbortRef.current.abort();
    intelAbortRef.current = new AbortController();
    
    try {
      const [resAnomalies, resRecs] = await Promise.all([
        fetch("/api/intelligence/anomalies", { signal: intelAbortRef.current.signal }),
        fetch("/api/intelligence/recommendations", { signal: intelAbortRef.current.signal })
      ]);
      if (resAnomalies.ok) setAnomalies((await resAnomalies.json()).anomalies);
      if (resRecs.ok) setRecommendations((await resRecs.json()).recommendations);
    } catch (error) {
      const e = error as Error;
      if (e.name !== "AbortError") console.error("Failed to fetch intelligence", e);
    }
  };

  const fetchForecast = async () => {
    if (document.hidden) return;

    if (forecastAbortRef.current) forecastAbortRef.current.abort();
    forecastAbortRef.current = new AbortController();
    
    setForecastLoading(true);
    try {
      const res = await fetch("/api/energy/forecast", { signal: forecastAbortRef.current.signal });
      if (res.ok) {
        setForecast(await res.json());
        setForecastError(false);
      } else {
        setForecastError(true);
      }
    } catch (error) {
      const e = error as Error;
      if (e.name !== "AbortError") {
        console.error("Failed to fetch forecast", e);
        setForecastError(true);
      }
    } finally {
      setForecastLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchIntelligence();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchForecast();
    
    // Polling intervals
    const intelInterval = setInterval(fetchIntelligence, 15000);
    const forecastInterval = setInterval(fetchForecast, 60000); // 60s for forecast
    
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchIntelligence();
        fetchForecast();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      clearInterval(intelInterval);
      clearInterval(forecastInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (intelAbortRef.current) intelAbortRef.current.abort();
      if (forecastAbortRef.current) forecastAbortRef.current.abort();
    };
  }, []);

  const runScenario = async () => {
    setScenarioLoading(true);
    try {
      const res = await fetch("/api/energy/scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ powerLimitKw: scenarioPowerLimit })
      });
      if (res.ok) {
        setScenarioResult(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setScenarioLoading(false);
    }
  };

  // Format forecast data for Recharts
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formatChartData = (intervals: any[]) => {
    if (!intervals) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return intervals.map((slot: any) => ({
      timeLabel: format(new Date(slot.timestamp), "HH:mm"),
      timestamp: slot.timestamp,
      Demand: Number(slot.homeDemandKw.toFixed(2)),
      Solar: Number(slot.solarKw.toFixed(2)),
      Grid: Number(slot.gridImportKw.toFixed(2))
    }));
  };

  const chartData = forecast?.intervals ? formatChartData(forecast.intervals) : [];

  return (
    <div className="space-y-4 mt-8">
      {/* 24-Hour Energy Forecast */}
      <Card className="w-full">
        <CardHeader className="pb-4 border-b">
          <CardTitle className="text-lg flex items-center">
            <LineChartIcon className="w-5 h-5 mr-2" />
            24-Hour Energy Forecast
          </CardTitle>
          <CardDescription>Predictive energy envelope based on deterministic baseline schedules.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {forecastLoading && !forecast ? (
            <div className="h-[300px] flex items-center justify-center bg-muted/20 animate-pulse rounded-md border">
              <span className="text-muted-foreground text-sm font-medium">Generating forecast model...</span>
            </div>
          ) : forecastError ? (
            <div className="h-[300px] flex items-center justify-center bg-red-50 dark:bg-red-900/10 rounded-md border border-red-100 dark:border-red-900/30">
              <div className="text-center text-red-600 dark:text-red-400">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium">Forecast generation failed</p>
                <p className="text-xs opacity-70 mt-1">Our predictive engine is temporarily offline.</p>
              </div>
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center bg-muted/20 rounded-md border">
              <span className="text-muted-foreground text-sm">Insufficient data to generate a forecast.</span>
            </div>
          ) : (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorSolar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorGrid" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="timeLabel" tick={{ fontSize: 12 }} tickMargin={10} minTickGap={30} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.4} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', fontSize: '13px', border: '1px solid hsl(var(--border))' }}
                    labelStyle={{ fontWeight: 'bold', color: 'hsl(var(--foreground))', marginBottom: '4px' }}
                  />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
                  <Area type="monotone" dataKey="Demand" stroke="#8884d8" fillOpacity={1} fill="url(#colorDemand)" activeDot={{ r: 4 }} />
                  <Area type="monotone" dataKey="Solar" stroke="#fbbf24" fillOpacity={1} fill="url(#colorSolar)" activeDot={{ r: 4 }} />
                  <Area type="monotone" dataKey="Grid" stroke="#3b82f6" fillOpacity={1} fill="url(#colorGrid)" activeDot={{ r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Anomalies */}
        <Card className="col-span-1 border-red-100 dark:border-red-900/30">
          <CardHeader className="bg-red-50/50 dark:bg-red-900/10 pb-4">
            <CardTitle className="text-lg flex items-center text-red-700 dark:text-red-400">
              <ShieldAlert className="w-5 h-5 mr-2" />
              Anomalies
            </CardTitle>
            <CardDescription>Real-time deviation detection</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {anomalies.length === 0 ? (
              <div className="text-center py-6 text-sm text-muted-foreground flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                </div>
                No anomalies detected. System is running optimally.
              </div>
            ) : (
              anomalies.map(a => (
                <div key={a.id} className="p-3 border rounded-lg bg-card">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-semibold text-sm flex items-center">
                      <AlertTriangle className={`w-4 h-4 mr-1 ${a.severity === 'HIGH' ? 'text-red-500' : 'text-amber-500'}`} />
                      {a.type}
                    </h4>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${a.severity === 'HIGH' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {a.severity}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{a.message}</p>
                  <div className="flex justify-between text-xs p-2 bg-muted/50 rounded">
                    <div><span className="text-muted-foreground">Expected:</span> <span className="font-mono">{a.expected}</span></div>
                    <div><span className="text-muted-foreground">Observed:</span> <span className="font-mono text-destructive">{a.observed}</span></div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card className="col-span-1 lg:col-span-1 border-blue-100 dark:border-blue-900/30">
          <CardHeader className="bg-blue-50/50 dark:bg-blue-900/10 pb-4">
            <CardTitle className="text-lg flex items-center text-blue-700 dark:text-blue-400">
              <Sparkles className="w-5 h-5 mr-2" />
              Optimization Opportunities
            </CardTitle>
            <CardDescription>Algorithmic optimization recommendations</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 max-h-[400px] overflow-y-auto">
            {recommendations.length === 0 ? (
              <div className="text-center py-6 text-sm text-muted-foreground flex flex-col items-center">
                  <Lightbulb className="w-8 h-8 text-muted/30 mb-2" />
                  No action required. Your current schedule is near-optimal.
              </div>
            ) : (
              recommendations.map(r => (
                <div key={r.id} className="p-4 border rounded-lg bg-card shadow-sm">
                  <h4 className="font-semibold text-sm flex items-center mb-2">
                    <Lightbulb className="w-4 h-4 mr-2 text-amber-500" />
                    Shift {r.appliance}
                  </h4>
                  <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                    {r.reason}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded flex flex-col">
                      <span className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider mb-0.5">Est. Savings</span>
                      <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">₹{r.expectedSavings.toFixed(2)}</span>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded flex flex-col">
                      <span className="text-[10px] text-blue-600 font-semibold uppercase tracking-wider mb-0.5">Peak Impact</span>
                      <span className="text-lg font-bold text-blue-700 dark:text-blue-400 flex items-center">
                        <TrendingDown className="w-3 h-3 mr-1" />
                        {r.peakReduction.toFixed(1)} kW
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded flex justify-between items-center">
                    <span>Confidence: <strong>{r.confidence}</strong></span>
                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[10px] font-medium">{r.type}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* What-If Analysis */}
        <Card className="col-span-1 lg:col-span-1">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center">
              <SlidersHorizontal className="w-5 h-5 mr-2" />
              What-If Sandbox
            </CardTitle>
            <CardDescription>Simulate digital configuration changes</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Test Power Limit (kW)</label>
              <div className="flex gap-2">
                <input 
                  type="range" 
                  min="2" max="10" step="0.5" 
                  value={scenarioPowerLimit} 
                  onChange={(e) => setScenarioPowerLimit(parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span className="font-mono text-sm w-12 text-right">{scenarioPowerLimit.toFixed(1)}</span>
              </div>
            </div>
            
            <button 
              onClick={runScenario} 
              disabled={scenarioLoading}
              className="w-full flex items-center justify-center p-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              {scenarioLoading ? 'Running Simulation...' : (
                <>
                  <Calculator className="w-4 h-4 mr-2" />
                  Run Scenario
                </>
              )}
            </button>
            
            {scenarioResult && (
              <div className="mt-4 p-4 rounded-lg bg-muted/30 border border-muted space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b pb-1">Impact Analysis</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground text-xs mb-1">Total Cost</div>
                    <div className="font-mono">₹{scenarioResult.scenario.totalCost.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs mb-1">Difference</div>
                    <div className={`font-mono font-medium ${scenarioResult.savings > 0 ? 'text-emerald-500' : scenarioResult.savings < 0 ? 'text-red-500' : ''}`}>
                      {scenarioResult.savings > 0 ? '-' : (scenarioResult.savings < 0 ? '+' : '')}₹{Math.abs(scenarioResult.savings).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs mb-1">Peak Demand</div>
                    <div className="font-mono">{scenarioResult.scenario.peakDemandKw.toFixed(2)} kW</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs mb-1">Baseline Peak</div>
                    <div className="font-mono text-muted-foreground">{scenarioResult.baseline.peakDemandKw.toFixed(2)} kW</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
    </div>
  );
}
