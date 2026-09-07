import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Battery, Sun, Zap, TrendingDown, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import prisma from "@/lib/prisma";
import { format } from "date-fns";

export default async function Home() {
  const household = await prisma.household.findFirst();
  
  // Fetch actual schedules from the database
  const schedules = await prisma.schedule.findMany({
    where: { householdId: household?.id },
    include: { appliance: true },
    orderBy: { startTime: 'asc' },
    take: 5
  });
  
  // Dashboard mock values based on spec - in a real app these would be calculated
  const currentPower = 3.42;
  const todaysEnergy = 18.7;
  const todaysCost = 126.40;
  const peakDemand = 4.8;
  const solarGen = 2.7;
  const batterySoc = 74;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Overview</h2>
        <p className="text-muted-foreground">Monitor and control your smart home energy.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Current Power */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Power</CardTitle>
            <Zap className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentPower} kW</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <TrendingDown className="h-3 w-3 mr-1 text-emerald-500" />
              <span className="text-emerald-500 font-medium mr-1">8.2%</span> vs yesterday
            </p>
          </CardContent>
        </Card>

        {/* Today's Energy & Cost */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Cost</CardTitle>
            <span className="text-lg">₹</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{todaysCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {todaysEnergy} kWh consumed
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
            <div className="text-2xl font-bold">{peakDemand} kW</div>
            <p className="text-xs text-muted-foreground mt-1">
              Limit: {household?.powerLimitKw || 5.5} kW
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
              <div className="text-2xl font-bold">{solarGen} kW</div>
              <p className="text-xs text-muted-foreground mt-1">Solar Gen</p>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold">{batterySoc}%</div>
              <p className="text-xs text-muted-foreground mt-1">Battery</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Energy Flow</CardTitle>
            <CardDescription>Live distribution of energy in your home.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center border-t bg-muted/5">
             <div className="flex flex-col items-center justify-center space-y-4 font-mono text-sm">
                <div className="text-amber-500 flex flex-col items-center">
                  <Sun className="h-6 w-6 mb-1" />
                  SOLAR {solarGen} kW
                </div>
                <ArrowDownToLine className="h-4 w-4 text-muted-foreground animate-bounce" />
                <div className="bg-card border shadow-sm rounded-lg p-6 font-bold text-lg text-center min-w-[200px]">
                  HOME<br />
                  <span className="text-primary">{currentPower} kW</span>
                </div>
                <div className="flex justify-between w-full max-w-[300px] pt-4">
                  <div className="text-emerald-500 flex flex-col items-center">
                     <ArrowUpFromLine className="h-4 w-4 mb-1" />
                     BATTERY
                     <span className="text-xs">+0.8 kW</span>
                  </div>
                  <div className="text-blue-500 flex flex-col items-center">
                     <ArrowUpFromLine className="h-4 w-4 mb-1" />
                     GRID
                     <span className="text-xs">0.0 kW</span>
                  </div>
                </div>
             </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Optimized Schedule</CardTitle>
            <CardDescription>Upcoming automated tasks.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {schedules.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No upcoming schedules.<br />
                  Run the optimizer in the Optimization Center.
                </div>
              ) : (
                schedules.map(schedule => {
                  const timeStr = format(schedule.startTime, "HH:mm");
                  
                  // Simple color picking based on category/name
                  let bgClass = "bg-primary/10";
                  let textClass = "text-primary";
                  
                  if (schedule.appliance.category === 'ev') {
                     bgClass = "bg-amber-500/10";
                     textClass = "text-amber-600";
                  } else if (schedule.appliance.category === 'water_heater' || schedule.appliance.category === 'battery') {
                     bgClass = "bg-emerald-500/10";
                     textClass = "text-emerald-600";
                  }

                  return (
                    <div key={schedule.id} className="flex items-center">
                      <div className="w-16 text-sm font-medium text-muted-foreground">{timeStr}</div>
                      <div className={`flex-1 ${bgClass} rounded-md p-2`}>
                        <p className="text-sm font-medium">{schedule.appliance.name}</p>
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
    </div>
  );
}
