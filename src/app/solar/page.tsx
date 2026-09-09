import { getCurrentHousehold } from "@/lib/server/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sun, ArrowRight } from "lucide-react";
import prisma from "@/lib/prisma";
import { simulateDay } from "@/lib/simulation/engine";
import { startOfDay } from "date-fns";

export default async function SolarPage() {
  const household = await getCurrentHousehold();
  const appliances = household
    ? await prisma.appliance.findMany({ where: { householdId: household.id } })
    : [];
  const schedules = household
    ? await prisma.schedule.findMany({ where: { householdId: household.id } })
    : [];

  const today = startOfDay(new Date());
  const simResults = household ? simulateDay(today, household, appliances, schedules) : [];

  const currentHour = today.getHours();
  const currentMinute = today.getMinutes();
  const currentSlotIndex = currentHour * 4 + Math.floor(currentMinute / 15);
  const currentSlot = simResults[currentSlotIndex] || simResults[0];

  const currentGen = currentSlot?.solarKw ?? 0;
  const gridExport = currentSlot?.gridExportKw ?? 0;
  const batteryCharge = Math.max(0, (currentSlot?.batteryPowerKw ?? 0));
  const homeUse = Math.max(0, currentGen - gridExport - batteryCharge);

  // Daily totals
  let todayGen = 0;
  let todaySelfConsum = 0;
  for (const slot of simResults) {
    todayGen += slot.solarKw * 0.25;
    todaySelfConsum += (slot.solarKw - slot.gridExportKw) * 0.25;
  }
  const selfConsumptionPct = todayGen > 0 ? Math.round((todaySelfConsum / todayGen) * 100) : 0;
  const gridExportKwh = todayGen - todaySelfConsum;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Solar PV</h2>
          <p className="text-muted-foreground">Monitor solar generation from the deterministic simulation.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Current Generation</CardTitle>
            <Sun className="h-4 w-4 text-amber-500 absolute top-6 right-6" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{currentGen.toFixed(2)} kW</div>
            <p className="text-xs text-muted-foreground mt-1">Simulated — right now</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Generation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{todayGen.toFixed(1)} kWh</div>
            <p className="text-xs text-muted-foreground mt-1">Total simulated today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Self Consumption</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{selfConsumptionPct}%</div>
            <p className="text-xs text-muted-foreground mt-1">Used in home / battery</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Grid Export</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{gridExportKwh.toFixed(1)} kWh</div>
            <p className="text-xs text-muted-foreground mt-1">Exported to grid today</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Power Routing</CardTitle>
          <CardDescription>Where your solar power is going right now (simulated)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-48 space-x-8">
            <div className="flex flex-col items-center">
              <Sun className="h-10 w-10 text-amber-500 mb-2" />
              <span className="font-bold">{currentGen.toFixed(2)} kW</span>
              <span className="text-xs text-muted-foreground">Solar</span>
            </div>

            <ArrowRight className="h-6 w-6 text-muted-foreground" />

            <div className="space-y-3">
              <div className="flex items-center gap-4 bg-muted/30 p-3 rounded-lg border">
                <span className="w-16 text-sm font-medium">Home</span>
                <div className="w-32 bg-secondary h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full" style={{ width: currentGen > 0 ? `${Math.round((homeUse / currentGen) * 100)}%` : '0%' }}></div>
                </div>
                <span className="font-bold w-16">{homeUse.toFixed(2)} kW</span>
              </div>

              <div className="flex items-center gap-4 bg-muted/30 p-3 rounded-lg border">
                <span className="w-16 text-sm font-medium">Battery</span>
                <div className="w-32 bg-secondary h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full" style={{ width: currentGen > 0 ? `${Math.round((batteryCharge / currentGen) * 100)}%` : '0%' }}></div>
                </div>
                <span className="font-bold w-16">{batteryCharge.toFixed(2)} kW</span>
              </div>

              <div className="flex items-center gap-4 bg-muted/30 p-3 rounded-lg border">
                <span className="w-16 text-sm font-medium">Grid</span>
                <div className="w-32 bg-secondary h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full" style={{ width: currentGen > 0 ? `${Math.round((gridExport / currentGen) * 100)}%` : '0%' }}></div>
                </div>
                <span className="font-bold w-16">{gridExport.toFixed(2)} kW</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
