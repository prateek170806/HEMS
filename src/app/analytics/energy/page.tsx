import { getCurrentHousehold } from "@/lib/server/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import prisma from "@/lib/prisma";
import { Activity, Zap, Sun, Battery } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EnergyAnalyticsPage() {
  const household = await getCurrentHousehold();
  if (!household) return <div>No household configured.</div>;

  // Query historical meter readings for the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const readings = await prisma.meterReading.findMany({
    where: { 
      householdId: household.id,
      timestamp: { gte: thirtyDaysAgo }
    },
    orderBy: { timestamp: 'asc' }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Energy & Cost Analytics</h2>
          <p className="text-muted-foreground">Historical trends and performance tracking.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Daily Demand</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-- kWh</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Daily Grid Import</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-- kWh</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Solar Generation</CardTitle>
            <Sun className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-- kWh</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Battery Usage</CardTitle>
            <Battery className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-- kWh</div>
          </CardContent>
        </Card>
      </div>

      {readings.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center h-[400px] text-center space-y-4">
            <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center">
              <Activity className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Historical data is not available yet.</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mt-2">
                WattWise is currently using its digital simulation engine for real-time energy behavior and forecasting.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Historical Energy Trend</CardTitle>
            <CardDescription>Daily energy distribution for the last 30 days.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* If data existed, we would map readings into a Recharts AreaChart or BarChart here */}
            <div className="h-[400px] bg-muted/10 rounded-md flex items-center justify-center">
              Chart would render here
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
