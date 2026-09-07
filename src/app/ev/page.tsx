import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, ZapOff, Zap } from "lucide-react";
import prisma from "@/lib/prisma";
import { EVOverrideButton } from "@/components/ev/EVOverrideButton";

export default async function EVPage() {
  const household = await prisma.household.findFirst();

  const evAppliance = household
    ? await prisma.appliance.findFirst({
        where: { householdId: household.id, category: 'ev' }
      })
    : null;

  const evSchedule = evAppliance
    ? await prisma.schedule.findFirst({
        where: {
          householdId: household!.id,
          applianceId: evAppliance.id,
        },
        orderBy: { startTime: 'asc' }
      })
    : null;

  const isConnected = evAppliance !== null;
  const isOverridden = evSchedule?.status === 'overridden';
  const departureTime = evAppliance?.latestFinish || '07:00';
  const scheduledStart = evSchedule?.startTime;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Electric Vehicle</h2>
          <p className="text-muted-foreground">
            Manage smart EV charging based on your departure needs.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>EV Status</CardTitle>
            <CardDescription>Current vehicle connection</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Connection</span>
              <span className={`font-medium flex items-center ${isConnected ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                <span className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-emerald-600' : 'bg-gray-400'}`}></span>
                {isConnected ? `${evAppliance!.name}` : 'No EV configured'}
              </span>
            </div>
            {evAppliance && (
              <div className="flex items-center justify-between border-t pt-4">
                <span className="text-muted-foreground">Charging Power</span>
                <span className="text-xl font-bold">{evAppliance.ratedPower.toFixed(1)} kW</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Charging Plan</CardTitle>
            <CardDescription>Optimization targets from database</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center">
                <Clock className="w-4 h-4 mr-2" /> Departure by
              </span>
              <span className="font-bold">{departureTime}</span>
            </div>
            {evAppliance && (
              <div className="flex items-center justify-between border-t pt-4">
                <span className="text-muted-foreground">Min Charge Time</span>
                <span className="font-bold">{evAppliance.minRuntime}h</span>
              </div>
            )}
            {scheduledStart && (
              <div className="flex items-center justify-between border-t pt-4">
                <span className="text-muted-foreground">Scheduled Start</span>
                <span className="font-bold">
                  {scheduledStart.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className={isOverridden ? "border-emerald-500/20 bg-emerald-500/5" : "border-amber-500/20 bg-amber-500/5"}>
          <CardHeader>
            <CardTitle className={isOverridden ? "text-emerald-700" : "text-amber-700"}>HEMS Action</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {evAppliance ? (
              <>
                <div className="flex flex-col items-center justify-center py-2">
                  {isOverridden ? (
                    <Zap className="h-8 w-8 text-emerald-500 mb-2" />
                  ) : (
                    <ZapOff className="h-8 w-8 text-amber-500 mb-2" />
                  )}
                  <span className="font-bold text-lg">{isOverridden ? 'Force Charging' : 'Scheduled'}</span>
                  <span className="text-sm text-muted-foreground mt-1 text-center">
                    {isOverridden
                      ? 'User override active — charging now'
                      : scheduledStart
                        ? `Optimally scheduled for off-peak`
                        : 'Run optimization to schedule EV charging'}
                  </span>
                </div>
                {!isOverridden && (
                  <EVOverrideButton applianceId={evAppliance.id} />
                )}
              </>
            ) : (
              <div className="text-center py-4 text-sm text-muted-foreground">
                No EV appliance configured. Add an EV Charger in the Appliances page.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
