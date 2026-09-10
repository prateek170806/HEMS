import { getCurrentHousehold } from "@/lib/server/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import prisma from "@/lib/prisma";
import { AddApplianceDialog } from "@/components/appliances/AddApplianceDialog";
import { EditApplianceDialog } from "@/components/appliances/EditApplianceDialog";
import { DeleteApplianceButton } from "@/components/appliances/DeleteApplianceButton";
import { Zap, Clock, ShieldAlert, Cpu, Layers, Sparkles, BarChart3, Info } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ApplianceAnalyticsPage() {
  const household = await getCurrentHousehold();
  if (!household) {
    return (
      <div className="mx-auto max-w-4xl p-8 text-center bg-card rounded-xl border">
        <h2 className="text-xl font-bold">No Household Configured</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Please log in or initialize the demo household to view appliance analytics.
        </p>
      </div>
    );
  }

  const appliances = await prisma.appliance.findMany({
    where: { householdId: household.id },
    include: {
      schedules: true,
    },
    orderBy: [
      { priority: 'desc' },
      { createdAt: 'asc' }
    ]
  });

  // Calculate dynamic stats from actual PostgreSQL database records
  const stats = appliances.map((app) => {
    // Expected daily energy footprint = minimum runtime * rated power
    const dailyEnergyKwH = (app.minRuntime ?? 0) * (app.ratedPower ?? 0);
    const projectedCost = app.schedules.reduce((sum, s) => sum + (s.estimatedCost || 0), 0);
    const hasSchedules = app.schedules.length > 0;

    return {
      id: app.id,
      name: app.name,
      category: app.category,
      ratedPower: app.ratedPower,
      flexibility: app.flexibility,
      priority: app.priority,
      minRuntime: app.minRuntime,
      maxRuntime: app.maxRuntime,
      earliestStart: app.earliestStart,
      latestFinish: app.latestFinish,
      automationEnabled: app.automationEnabled,
      dailyEnergyKwH,
      projectedCost,
      operatingDuration: app.minRuntime,
      hasSchedules,
      rawAppliance: app,
    };
  });

  const totalEnergyKwH = stats.reduce((sum, s) => sum + s.dailyEnergyKwH, 0);

  // Sort stats by highest energy consumer for the analytics breakdown
  const sortedStats = [...stats].sort((a, b) => b.dailyEnergyKwH - a.dailyEnergyKwH);

  const totalCapacityKw = appliances.reduce((sum, app) => sum + app.ratedPower, 0);
  const shiftableCount = appliances.filter((a) => a.flexibility === 'shiftable').length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner with Add Appliance Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <BarChart3 className="h-7 w-7 text-primary" />
            Appliance Analytics &amp; Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Understand what is driving your household&apos;s energy consumption and manage configured loads for dynamic optimization.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <AddApplianceDialog householdId={household.id} />
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl p-4 border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Appliances</p>
            <p className="text-2xl font-bold text-foreground mt-1">{appliances.length}</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Layers className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-card rounded-xl p-4 border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Peak Capacity</p>
            <p className="text-2xl font-bold text-foreground mt-1">{totalCapacityKw.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">kW</span></p>
          </div>
          <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
            <Zap className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-card rounded-xl p-4 border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Flexible Loads</p>
            <p className="text-2xl font-bold text-foreground mt-1">{shiftableCount} <span className="text-sm font-normal text-muted-foreground">shiftable</span></p>
          </div>
          <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <Sparkles className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-card rounded-xl p-4 border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Est. Daily Footprint</p>
            <p className="text-2xl font-bold text-foreground mt-1">{totalEnergyKwH.toFixed(2)} <span className="text-sm font-normal text-muted-foreground">kWh/day</span></p>
          </div>
          <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
            <Cpu className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Main Content / Empty State */}
      {appliances.length === 0 ? (
        <Card className="border-dashed bg-card/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
            <div className="w-16 h-16 bg-muted/60 rounded-full flex items-center justify-center text-muted-foreground">
              <Cpu className="w-8 h-8" />
            </div>
            <div className="max-w-md space-y-1">
              <h3 className="text-lg font-semibold text-foreground">No appliances configured</h3>
              <p className="text-sm text-muted-foreground">
                Add appliances to understand and optimize your household loads.
              </p>
            </div>
            <div className="pt-2">
              <AddApplianceDialog householdId={household.id} />
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Energy Contribution Breakdown Card */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle className="text-lg">Daily Energy Contribution Breakdown</CardTitle>
                  <CardDescription>
                    Estimated footprint computed dynamically from configured runtime and rated power draw.
                  </CardDescription>
                </div>
                <div className="flex items-center text-xs text-muted-foreground bg-muted/50 px-2.5 py-1.5 rounded-md self-start sm:self-auto">
                  <Info className="w-3.5 h-3.5 mr-1.5 text-primary shrink-0" />
                  <span>Digital HEMS Simulation Model</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {sortedStats.map((stat) => {
                  const percentage = totalEnergyKwH > 0 ? (stat.dailyEnergyKwH / totalEnergyKwH) * 100 : 0;

                  return (
                    <div key={stat.id} className="space-y-2">
                      <div className="flex justify-between items-end">
                        <div>
                          <span className="font-semibold text-foreground">{stat.name}</span>
                          <span className="text-xs text-muted-foreground ml-2 capitalize">
                            {stat.category.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="text-sm font-bold text-foreground">
                          {percentage.toFixed(1)}%
                        </div>
                      </div>

                      <div className="h-3.5 w-full bg-muted/60 rounded-full overflow-hidden flex">
                        <div
                          className="h-full bg-primary transition-all duration-500 ease-in-out"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>

                      <div className="flex flex-wrap justify-between text-xs text-muted-foreground pt-0.5 gap-2">
                        <div className="flex items-center">
                          <Zap className="w-3 h-3 mr-1 text-amber-500" />
                          {stat.ratedPower.toFixed(2)} kW rated
                        </div>
                        <div>
                          {stat.operatingDuration}h configured daily runtime
                        </div>
                        <div className="font-mono text-foreground font-medium">
                          {stat.dailyEnergyKwH.toFixed(2)} kWh / day
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Configured Appliances Management Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-foreground">Configured Appliances</h2>
                <p className="text-xs text-muted-foreground">Manage and update appliance parameters in real time.</p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {appliances.map((app) => (
                <Card key={app.id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <CardTitle className="text-lg font-semibold text-foreground">{app.name}</CardTitle>
                        <p className="text-xs text-muted-foreground capitalize mt-0.5">
                          {app.category.replace('_', ' ')}
                        </p>
                      </div>
                      <Badge variant={app.automationEnabled ? "default" : "secondary"} className="shrink-0">
                        {app.automationEnabled ? "Auto" : "Manual"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 flex-1">
                    <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/40 text-xs">
                      <div>
                        <span className="text-muted-foreground block">Rated Power</span>
                        <span className="font-bold text-sm text-foreground">{app.ratedPower.toFixed(2)} kW</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Flexibility</span>
                        <span className="font-medium capitalize text-foreground">{app.flexibility.replace('_', ' ')}</span>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" /> Runtime Window:
                        </span>
                        <span className="font-medium text-foreground">{app.minRuntime}h – {app.maxRuntime}h</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <Zap className="h-3.5 w-3.5 text-amber-500" /> Allowed Window:
                        </span>
                        <span className="font-medium text-foreground">{app.earliestStart || '00:00'} – {app.latestFinish || '23:59'}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <ShieldAlert className="h-3.5 w-3.5 text-blue-500" /> Priority:
                        </span>
                        <span className="font-medium capitalize text-foreground">{app.priority}</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border flex items-center gap-2">
                      <EditApplianceDialog appliance={app} />
                      <DeleteApplianceButton applianceId={app.id} applianceName={app.name} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
