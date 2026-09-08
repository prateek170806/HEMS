import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Zap, Sun, Battery, Car, ArrowDownToLine, ArrowUpFromLine, Server } from "lucide-react";
import prisma from "@/lib/prisma";
import { format, startOfDay } from "date-fns";
import { simulateDay } from "@/lib/simulation/engine";
import { getPriceForTime } from "@/lib/domain/tariff";
import { AutoRefresh } from "./AutoRefresh";

export default async function LiveEnergyPage() {
  const household = await prisma.household.findFirst();
  if (!household) return <div>No household configured.</div>;
  
  const appliances = await prisma.appliance.findMany({ where: { householdId: household.id } });
  
  const schedules = await prisma.schedule.findMany({
    where: { householdId: household.id },
    include: { appliance: true },
    orderBy: { startTime: 'asc' }
  });

  const tariff = await prisma.tariff.findFirst({
    where: { householdId: household.id, isActive: true },
    include: { periods: true }
  });

  const today = new Date();
  const simResults = simulateDay(startOfDay(today), household, appliances, schedules);
  
  const currentHour = today.getHours();
  const currentMinute = today.getMinutes();
  const currentSlotIndex = currentHour * 4 + Math.floor(currentMinute / 15);
  const currentSlot = simResults[currentSlotIndex] || simResults[0];

  const currentPower = currentSlot.homeDemandKw;
  const solarGen = currentSlot.solarKw;
  const batterySoc = currentSlot.batterySoc;
  const gridImport = currentSlot.gridImportKw;
  const batteryPower = currentSlot.batteryPowerKw;

  const currentPrice = tariff ? getPriceForTime(tariff.periods, currentSlot.timestamp) : 0;
  const currentTariffPeriod = tariff?.periods.find(p => 
    format(currentSlot.timestamp, "HH:mm") >= p.startTime && 
    format(currentSlot.timestamp, "HH:mm") < p.endTime
  )?.name || "Standard";

  const evs = appliances.filter(a => a.category === "ev");

  return (
    <div className="space-y-8">
      <AutoRefresh intervalMs={10000} />
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Live Energy</h2>
          <p className="text-muted-foreground flex items-center gap-2">
            Real-time household energy metrics. 
            <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full dark:bg-emerald-900 dark:text-emerald-300">Simulated</span>
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Home Load</CardTitle>
            <Zap className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentPower.toFixed(2)} kW</div>
            <p className="text-xs text-muted-foreground mt-1">
              Base: {household.baseLoad.toFixed(2)} kW
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Grid Import</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gridImport.toFixed(2)} kW</div>
            <p className="text-xs text-muted-foreground mt-1 text-red-500">
              {gridImport > 0 ? "Importing from grid" : "No grid import"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solar Generation</CardTitle>
            <Sun className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{solarGen.toFixed(2)} kW</div>
            <p className="text-xs text-muted-foreground mt-1 text-emerald-500">
              {solarGen > 0 ? "Generating" : "Inactive"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Battery Storage</CardTitle>
            <Battery className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{batterySoc.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {batteryPower > 0 ? `Discharging ${batteryPower.toFixed(2)} kW` : batteryPower < 0 ? `Charging ${Math.abs(batteryPower).toFixed(2)} kW` : "Idle"}
            </p>
          </CardContent>
        </Card>

        {evs.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">EV Status</CardTitle>
              <Car className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{evs[0].status === "active" ? evs[0].ratedPower.toFixed(2) : "0.00"} kW</div>
              <p className="text-xs text-muted-foreground mt-1">
                {evs[0].status === "active" ? "Charging" : "Plugged in, Idle"}
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Tariff</CardTitle>
            <span className="text-lg">₹</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{currentPrice.toFixed(2)} / kWh</div>
            <p className="text-xs text-muted-foreground mt-1">
              Period: {currentTariffPeriod}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Live Energy Flow</CardTitle>
          <CardDescription>Real-time distribution of power in your household at {format(today, "HH:mm:ss")}.</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] flex flex-col items-center justify-center border-t bg-muted/5 relative">
          <div className="grid grid-cols-3 gap-8 w-full max-w-4xl text-center">
            {/* Top row */}
            <div className="flex flex-col items-center justify-center p-4">
              <div className="h-16 w-16 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center mb-2">
                <Sun className="h-8 w-8 text-amber-500" />
              </div>
              <h3 className="font-bold text-lg">Solar</h3>
              <p className="text-xl font-mono text-amber-600">{solarGen.toFixed(2)} kW</p>
            </div>
            
            <div className="flex flex-col items-center justify-center">
               <ArrowDownToLine className={`h-8 w-8 text-muted-foreground ${solarGen > 0 ? "animate-bounce" : "opacity-30"}`} />
            </div>

            <div className="flex flex-col items-center justify-center p-4">
              <div className="h-16 w-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-2">
                <Server className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="font-bold text-lg">Grid</h3>
              <p className="text-xl font-mono text-blue-600">{gridImport.toFixed(2)} kW</p>
            </div>

            {/* Middle row */}
            <div></div>
            
            <div className="flex flex-col items-center justify-center p-6 bg-card border-2 shadow-lg rounded-2xl relative z-10 min-h-[150px]">
              <Zap className="h-10 w-10 text-primary mb-2" />
              <h3 className="font-bold text-2xl">HOME</h3>
              <p className="text-3xl font-mono font-bold text-primary">{currentPower.toFixed(2)} kW</p>
            </div>
            
            <div></div>

            {/* Bottom row */}
            <div className="flex flex-col items-center justify-center p-4">
              <div className="h-16 w-16 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center mb-2">
                <Battery className="h-8 w-8 text-emerald-500" />
              </div>
              <h3 className="font-bold text-lg">Battery</h3>
              <p className="text-xl font-mono text-emerald-600">
                {batteryPower > 0 ? `+${batteryPower.toFixed(2)}` : batteryPower < 0 ? `${batteryPower.toFixed(2)}` : "0.00"} kW
              </p>
              <p className="text-sm font-medium mt-1">{batterySoc.toFixed(1)}%</p>
            </div>

            <div className="flex flex-col items-center justify-center">
               <ArrowUpFromLine className={`h-8 w-8 text-muted-foreground ${(batteryPower !== 0 || gridImport > 0) ? "animate-pulse" : "opacity-30"}`} />
            </div>
            
            {evs.length > 0 && (
              <div className="flex flex-col items-center justify-center p-4">
                <div className="h-16 w-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mb-2">
                  <Car className="h-8 w-8 text-purple-500" />
                </div>
                <h3 className="font-bold text-lg">EV</h3>
                <p className="text-xl font-mono text-purple-600">{evs[0].status === "active" ? evs[0].ratedPower.toFixed(2) : "0.00"} kW</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
