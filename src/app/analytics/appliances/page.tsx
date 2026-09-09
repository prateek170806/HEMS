import { getCurrentHousehold } from "@/lib/server/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import prisma from "@/lib/prisma";
import { Server, Zap } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ApplianceAnalyticsPage() {
  const household = await getCurrentHousehold();
  if (!household) return <div>No household configured.</div>;

  // We can derive appliance analytics from the schedules table or appliances table.
  // We'll calculate the expected usage based on their minRuntime if no historical data is robustly preserved.
  const appliances = await prisma.appliance.findMany({
    where: { householdId: household.id },
    include: {
      schedules: true
    }
  });

  // Calculate stats
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stats: any[] = [];
  let totalEnergyKwH = 0;

  appliances.forEach(app => {
    // Determine typical daily consumption. If schedules exist, we could sum their duration, 
    // but the system often deletes future schedules on re-run.
    // A robust estimate is their minimum configured daily runtime * rated power.
    const dailyEnergyKwH = app.minRuntime * app.ratedPower;
    
    // Attempt to aggregate cost from schedules if any exist for this appliance.
    const projectedCost = app.schedules.reduce((sum, s) => sum + (s.estimatedCost || 0), 0);
    const hasSchedules = app.schedules.length > 0;

    totalEnergyKwH += dailyEnergyKwH;

    stats.push({
      id: app.id,
      name: app.name,
      category: app.category,
      ratedPower: app.ratedPower,
      dailyEnergyKwH,
      projectedCost,
      operatingDuration: app.minRuntime,
      hasSchedules
    });
  });

  // Sort by highest energy consumer
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stats.sort((a: any, b: any) => b.dailyEnergyKwH - a.dailyEnergyKwH);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Appliance Analytics</h2>
          <p className="text-muted-foreground">Understand what is driving your energy consumption.</p>
        </div>
      </div>

      {appliances.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center h-[300px] text-center space-y-4">
            <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center">
              <Server className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">No appliances configured.</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mt-2">
                Add appliances in the Appliances tab to start tracking their simulated energy footprint.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="col-span-1 md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle>Daily Energy Contribution</CardTitle>
              <CardDescription>
                Estimated breakdown based on configured runtime and rated power draw.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {stats.map((stat: any) => {
                  const percentage = totalEnergyKwH > 0 ? (stat.dailyEnergyKwH / totalEnergyKwH) * 100 : 0;
                  
                  return (
                    <div key={stat.id} className="space-y-2">
                      <div className="flex justify-between items-end">
                        <div>
                          <span className="font-semibold">{stat.name}</span>
                          <span className="text-xs text-muted-foreground ml-2 capitalize">
                            {stat.category.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="text-sm font-bold">
                          {percentage.toFixed(1)}%
                        </div>
                      </div>
                      
                      <div className="h-4 w-full bg-muted/50 rounded-full overflow-hidden flex">
                        <div 
                          className="h-full bg-primary transition-all duration-500 ease-in-out" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      
                      <div className="flex justify-between text-xs text-muted-foreground pt-1">
                        <div className="flex items-center">
                          <Zap className="w-3 h-3 mr-1 text-amber-500" />
                          {stat.ratedPower.toFixed(2)} kW rated
                        </div>
                        <div>
                          {stat.operatingDuration}h expected runtime
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
        </div>
      )}
    </div>
  );
}
