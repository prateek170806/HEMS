import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import prisma from "@/lib/prisma";
import { simulateDay } from "@/lib/simulation/engine";

export default async function BatteryPage() {
  const household = await prisma.household.findFirst();
  const appliances = household
    ? await prisma.appliance.findMany({ where: { householdId: household.id } })
    : [];
  const schedules = household
    ? await prisma.schedule.findMany({ where: { householdId: household.id } })
    : [];

  const today = new Date();
  const simResults = household
    ? simulateDay(today, household, appliances, schedules, 1.0, 1.0)
    : [];

  const currentHour = today.getHours();
  const currentMinute = today.getMinutes();
  const currentSlotIndex = currentHour * 4 + Math.floor(currentMinute / 15);
  const currentSlot = simResults[currentSlotIndex] || simResults[0];

  const batterySoc = currentSlot?.batterySoc ?? 50;
  const batteryPower = currentSlot?.batteryPowerKw ?? 0;
  const reservePct = household?.batteryReserve ?? 20;

  // Daily charge/discharge totals
  let todayCharge = 0;
  let todayDischarge = 0;
  for (const slot of simResults) {
    if (slot.batteryPowerKw > 0) todayCharge += slot.batteryPowerKw * 0.25;
    else todayDischarge += Math.abs(slot.batteryPowerKw) * 0.25;
  }

  const capacity = 10.0; // kWh nominal battery capacity
  const isCharging = batteryPower > 0.01;
  const isDischarging = batteryPower < -0.01;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Battery Management</h2>
          <p className="text-muted-foreground">
            State of charge and storage from the deterministic simulation. Reserve: {reservePct}%
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>Battery Status</CardTitle>
            <CardDescription>Current State of Charge — simulated</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="relative w-48 h-48 flex items-center justify-center rounded-full border-[16px] border-muted">
              <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                <circle
                  cx="50%"
                  cy="50%"
                  r="42%"
                  className={`fill-transparent ${batterySoc <= reservePct ? 'stroke-amber-500' : 'stroke-emerald-500'}`}
                  strokeWidth="16"
                  strokeDasharray="264"
                  strokeDashoffset={264 - (264 * batterySoc) / 100}
                />
              </svg>
              <div className="text-center">
                <div className="text-4xl font-bold">{batterySoc.toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">
                  {isCharging ? "Charging" : isDischarging ? "Discharging" : "Idle"}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mt-8 w-full max-w-sm">
              <div className="text-center">
                <div className={`text-xl font-bold ${isCharging ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                  {isCharging ? `+${batteryPower.toFixed(2)}` : '0.00'} kW
                </div>
                <div className="text-xs text-muted-foreground uppercase mt-1">Charging Power</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold">{capacity} kWh</div>
                <div className="text-xs text-muted-foreground uppercase mt-1">Total Capacity</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              <li className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Mode</span>
                <span className="font-medium capitalize">{isCharging ? 'Charging' : isDischarging ? 'Discharging' : 'Idle'}</span>
              </li>
              <li className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Reserve Limit</span>
                <span className="font-medium">{reservePct}%</span>
              </li>
              <li className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Power Flow</span>
                <span className="font-medium">{batteryPower > 0 ? '+' : ''}{batteryPower.toFixed(2)} kW</span>
              </li>
              <li className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Today&apos;s Charge</span>
                <span className="font-medium">{todayCharge.toFixed(2)} kWh</span>
              </li>
              <li className="flex justify-between pb-2">
                <span className="text-muted-foreground">Today&apos;s Discharge</span>
                <span className="font-medium">{todayDischarge.toFixed(2)} kWh</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
