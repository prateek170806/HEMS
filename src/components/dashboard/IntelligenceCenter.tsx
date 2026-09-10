"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  AlertTriangle, 
  Lightbulb, 
  TrendingDown, 
  ShieldAlert, 
  Sparkles, 
  SlidersHorizontal, 
  Calculator, 
  LineChart as LineChartIcon,
  RefreshCw
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format } from "date-fns";

interface IntelligenceCenterProps {
  initialPowerLimit?: number;
}

export function IntelligenceCenter({ initialPowerLimit = 5.5 }: IntelligenceCenterProps) {
  // Anomalies state
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [anomaliesLoading, setAnomaliesLoading] = useState(true);
  const [anomaliesError, setAnomaliesError] = useState(false);

  // Recommendations state
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(true);
  const [recommendationsError, setRecommendationsError] = useState(false);
  const [tariffRequired, setTariffRequired] = useState(false);
  
  // Forecast state
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [forecast, setForecast] = useState<any>(null);
  const [forecastLoading, setForecastLoading] = useState(true);
  const [forecastError, setForecastError] = useState(false);

  // Scenario sandbox state
  const [scenarioPowerLimit, setScenarioPowerLimit] = useState(initialPowerLimit);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [scenarioResult, setScenarioResult] = useState<any>(null);
  const [scenarioLoading, setScenarioLoading] = useState(false);
  const [scenarioError, setScenarioError] = useState(false);

  // Abort controller refs
  const intelAbortRef = useRef<AbortController | null>(null);
  const forecastAbortRef = useRef<AbortController | null>(null);
  const scenarioAbortRef = useRef<AbortController | null>(null);

  const fetchIntelligence = useCallback(async () => {
    if (document.hidden) return;
    
    if (intelAbortRef.current) intelAbortRef.current.abort();
    intelAbortRef.current = new AbortController();
    
    try {
      const [resAnomalies, resRecs] = await Promise.all([
        fetch("/api/intelligence/anomalies", { signal: intelAbortRef.current.signal }),
        fetch("/api/intelligence/recommendations", { signal: intelAbortRef.current.signal })
      ]);
      
      if (resAnomalies.ok) {
        const data = await resAnomalies.json();
        setAnomalies(data.anomalies || []);
        setAnomaliesError(false);
      } else {
        setAnomaliesError(true);
      }

      if (resRecs.ok) {
        const data = await resRecs.json();
        setRecommendations(data.recommendations || []);
        setTariffRequired(Boolean(data.tariffRequired));
        setRecommendationsError(false);
      } else {
        setRecommendationsError(true);
      }
    } catch (error) {
      const e = error as Error;
      if (e.name !== "AbortError") {
        console.error("Failed to fetch intelligence", e);
        setAnomaliesError(true);
        setRecommendationsError(true);
      }
    } finally {
      setAnomaliesLoading(false);
      setRecommendationsLoading(false);
    }
  }, []);

  const fetchForecast = useCallback(async () => {
    if (document.hidden) return;

    if (forecastAbortRef.current) forecastAbortRef.current.abort();
    forecastAbortRef.current = new AbortController();
    
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
  }, []);

  useEffect(() => {
    let mounted = true;
    
    const loadInitialData = async () => {
      if (!mounted) return;
      await Promise.all([fetchIntelligence(), fetchForecast()]);
    };

    loadInitialData();
    
    const intelInterval = setInterval(fetchIntelligence, 15000);
    const forecastInterval = setInterval(fetchForecast, 60000);
    
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchIntelligence();
        fetchForecast();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      mounted = false;
      clearInterval(intelInterval);
      clearInterval(forecastInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (intelAbortRef.current) intelAbortRef.current.abort();
      if (forecastAbortRef.current) forecastAbortRef.current.abort();
      if (scenarioAbortRef.current) scenarioAbortRef.current.abort();
    };
  }, [fetchIntelligence, fetchForecast]);

  const runScenario = async () => {
    if (scenarioAbortRef.current) scenarioAbortRef.current.abort();
    scenarioAbortRef.current = new AbortController();

    setScenarioLoading(true);
    setScenarioError(false);
    try {
      const res = await fetch("/api/energy/scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ powerLimitKw: scenarioPowerLimit }),
        signal: scenarioAbortRef.current.signal
      });
      if (res.ok) {
        setScenarioResult(await res.json());
      } else {
        setScenarioError(true);
      }
    } catch (e) {
      const err = e as Error;
      if (err.name !== "AbortError") {
        console.error("Scenario execution error:", err);
        setScenarioError(true);
      }
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
      Demand: Number((slot.homeDemandKw || 0).toFixed(2)),
      Solar: Number((slot.solarKw || 0).toFixed(2)),
      Grid: Number((slot.gridImportKw || 0).toFixed(2))
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
                <button 
                  onClick={fetchForecast}
                  className="mt-2 text-xs underline font-medium text-red-700 dark:text-red-300 hover:opacity-80"
                >
                  Retry
                </button>
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
        {/* 1. Anomalies Card */}
        <Card className="col-span-1 border-red-100 dark:border-red-900/30 flex flex-col">
          <CardHeader className="bg-red-50/50 dark:bg-red-900/10 pb-4">
            <CardTitle className="text-lg flex items-center text-red-700 dark:text-red-400">
              <ShieldAlert className="w-5 h-5 mr-2" />
              Anomalies
            </CardTitle>
            <CardDescription>Real-time deviation detection</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 flex-1">
            {anomaliesLoading && anomalies.length === 0 ? (
              <div className="py-8 text-center animate-pulse">
                <p className="text-sm text-muted-foreground">Analyzing current energy telemetry...</p>
              </div>
            ) : anomaliesError ? (
              <div className="py-6 text-center text-red-500">
                <AlertTriangle className="w-6 h-6 mx-auto mb-1 opacity-70" />
                <p className="text-xs font-medium">Unable to load anomaly status</p>
                <button 
                  onClick={fetchIntelligence} 
                  className="mt-2 text-xs underline font-medium hover:opacity-80"
                >
                  Retry
                </button>
              </div>
            ) : anomalies.length === 0 ? (
              <div className="text-center py-6 text-sm text-muted-foreground flex flex-col items-center justify-center h-full">
                <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                </div>
                <p className="font-medium text-foreground">No significant anomalies detected</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[220px]">
                  Simulated energy flow is operating within normal expected parameters.
                </p>
              </div>
            ) : (
              anomalies.map(a => (
                <div key={a.id} className="p-3 border rounded-lg bg-card shadow-sm">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-semibold text-sm flex items-center">
                      <AlertTriangle className={`w-4 h-4 mr-1 ${a.severity === 'HIGH' ? 'text-red-500' : 'text-amber-500'}`} />
                      {a.type}
                    </h4>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      a.severity === 'HIGH' 
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' 
                        : a.severity === 'MEDIUM'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    }`}>
                      {a.severity}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2 leading-relaxed">{a.message}</p>
                  <div className="flex justify-between text-xs p-2 bg-muted/50 rounded">
                    <div><span className="text-muted-foreground">Expected:</span> <span className="font-mono">{a.expected}</span></div>
                    <div><span className="text-muted-foreground">Observed:</span> <span className="font-mono font-medium text-destructive">{a.observed}</span></div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* 2. Optimization Opportunities Card */}
        <Card className="col-span-1 border-blue-100 dark:border-blue-900/30 flex flex-col">
          <CardHeader className="bg-blue-50/50 dark:bg-blue-900/10 pb-4">
            <CardTitle className="text-lg flex items-center text-blue-700 dark:text-blue-400">
              <Sparkles className="w-5 h-5 mr-2" />
              Optimization Opportunities
            </CardTitle>
            <CardDescription>Algorithmic optimization recommendations</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 max-h-[400px] overflow-y-auto flex-1">
            {recommendationsLoading && recommendations.length === 0 ? (
              <div className="py-8 text-center animate-pulse">
                <p className="text-sm text-muted-foreground">Calculating optimization opportunities...</p>
              </div>
            ) : recommendationsError ? (
              <div className="py-6 text-center text-red-500">
                <AlertTriangle className="w-6 h-6 mx-auto mb-1 opacity-70" />
                <p className="text-xs font-medium">Unable to load recommendations</p>
                <button 
                  onClick={fetchIntelligence} 
                  className="mt-2 text-xs underline font-medium hover:opacity-80"
                >
                  Retry
                </button>
              </div>
            ) : tariffRequired ? (
              <div className="text-center py-6 text-sm text-muted-foreground flex flex-col items-center justify-center h-full">
                <Lightbulb className="w-8 h-8 text-amber-500/40 mb-2" />
                <p className="font-medium text-foreground">Optimization unavailable</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[220px]">
                  Configure an active tariff to calculate scheduling opportunities.
                </p>
                <Link 
                  href="/tariffs"
                  className="mt-3 text-xs px-3 py-1 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  Configure Tariffs
                </Link>
              </div>
            ) : recommendations.length === 0 ? (
              <div className="text-center py-6 text-sm text-muted-foreground flex flex-col items-center justify-center h-full">
                <Lightbulb className="w-8 h-8 text-muted/40 mb-2" />
                <p className="font-medium text-foreground">No immediate optimization opportunities</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[220px]">
                  Your current digital schedule is already near-optimal for the active tariff and constraints.
                </p>
              </div>
            ) : (
              recommendations.map(r => (
                <div key={r.id} className="p-4 border rounded-lg bg-card shadow-sm">
                  <h4 className="font-semibold text-sm flex items-center mb-1.5">
                    <Lightbulb className="w-4 h-4 mr-2 text-amber-500" />
                    Shift {r.appliance}
                  </h4>
                  <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                    {r.reason}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded flex flex-col">
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider mb-0.5">Est. Savings</span>
                      <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">₹{r.expectedSavings.toFixed(2)}</span>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded flex flex-col">
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wider mb-0.5">Peak Impact</span>
                      <span className="text-lg font-bold text-blue-700 dark:text-blue-400 flex items-center">
                        <TrendingDown className="w-3 h-3 mr-1" />
                        {r.peakReduction.toFixed(1)} kW
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded flex justify-between items-center">
                    <span>Confidence: <strong>{r.confidence}</strong></span>
                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[10px] font-medium">
                      {r.type}
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* 3. What-If Sandbox */}
        <Card className="col-span-1 lg:col-span-1 flex flex-col">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center">
              <SlidersHorizontal className="w-5 h-5 mr-2" />
              What-If Sandbox
            </CardTitle>
            <CardDescription>Simulate digital configuration changes</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="power-limit-slider" className="text-sm font-medium">Test Power Limit (kW)</label>
                  <span className="font-mono text-sm font-bold text-primary">{scenarioPowerLimit.toFixed(1)} kW</span>
                </div>
                <input 
                  id="power-limit-slider"
                  type="range" 
                  min="2" 
                  max="12" 
                  step="0.5" 
                  value={scenarioPowerLimit} 
                  onChange={(e) => setScenarioPowerLimit(parseFloat(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>2.0 kW (Tight)</span>
                  <span>Default ({initialPowerLimit.toFixed(1)} kW)</span>
                  <span>12.0 kW (Relaxed)</span>
                </div>
              </div>
              
              <button 
                id="run-scenario-btn"
                onClick={runScenario} 
                disabled={scenarioLoading}
                className="w-full flex items-center justify-center p-2.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {scenarioLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Simulating Scenario...
                  </>
                ) : (
                  <>
                    <Calculator className="w-4 h-4 mr-2" />
                    Run Scenario
                  </>
                )}
              </button>

              {scenarioError && (
                <p className="text-xs text-red-500 text-center">Failed to evaluate scenario. Try again.</p>
              )}
            </div>
            
            {scenarioResult && (
              <div className="mt-4 p-4 rounded-lg bg-muted/30 border border-muted space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b pb-1">
                  Impact Analysis
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground text-xs mb-1">Total Cost</div>
                    <div className="font-mono font-medium">₹{scenarioResult.scenario.totalCost.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs mb-1">Difference</div>
                    <div className={`font-mono font-bold ${
                      scenarioResult.savings > 0 
                        ? 'text-emerald-500 dark:text-emerald-400' 
                        : scenarioResult.savings < 0 
                        ? 'text-red-500 dark:text-red-400' 
                        : ''
                    }`}>
                      {scenarioResult.savings > 0 ? '-' : scenarioResult.savings < 0 ? '+' : ''}₹{Math.abs(scenarioResult.savings).toFixed(2)}
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
