import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { RunOptimizationButton } from "@/components/optimization/RunOptimizationButton";
import prisma from "@/lib/prisma";

export default async function SchedulesPage() {
  const household = await prisma.household.findFirst();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Optimization Center</h2>
          <p className="text-muted-foreground">
            Create the lowest-cost schedule while respecting your appliances, deadlines, and power limits.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Optimization Strategy</CardTitle>
            <CardDescription>Configure how HEMS schedules your flexible loads.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Mode</span>
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-md text-sm font-medium capitalize">
                  {household?.optimizationMode || "Economic"}
                </span>
              </div>
            </div>

            <div className="space-y-6 pt-4 border-t">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <label className="text-sm font-medium leading-none">Cost Reduction</label>
                  <span className="text-sm text-muted-foreground">High</span>
                </div>
                <Slider defaultValue={[80]} max={100} step={1} disabled />
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <label className="text-sm font-medium leading-none">Peak Reduction</label>
                  <span className="text-sm text-muted-foreground">Medium</span>
                </div>
                <Slider defaultValue={[50]} max={100} step={1} disabled />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <label className="text-sm font-medium leading-none">Comfort Protection</label>
                  <span className="text-sm text-muted-foreground">High</span>
                </div>
                <Slider defaultValue={[75]} max={100} step={1} disabled />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <label className="text-sm font-medium leading-none">Carbon Impact</label>
                  <span className="text-sm text-muted-foreground">Low</span>
                </div>
                <Slider defaultValue={[20]} max={100} step={1} disabled />
              </div>
            </div>

            <RunOptimizationButton />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Constraints Active</CardTitle>
            <CardDescription>Rules that the optimizer must follow.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              <li className="flex justify-between p-3 border rounded-md bg-muted/20">
                <span className="font-medium">Household Power Limit</span>
                <span className="text-amber-600 font-bold">{household?.powerLimitKw || 5.5} kW</span>
              </li>
              <li className="flex justify-between p-3 border rounded-md bg-muted/20">
                <span className="font-medium">Battery Reserve</span>
                <span className="text-emerald-600 font-bold">{household?.batteryReserve || 20}%</span>
              </li>
              <li className="flex justify-between p-3 border rounded-md bg-muted/20">
                <span className="font-medium">EV Departure SOC</span>
                <span className="text-blue-600 font-bold">90%</span>
              </li>
              <li className="flex justify-between p-3 border rounded-md bg-muted/20">
                <span className="font-medium">Appliance Deadlines</span>
                <span className="text-primary font-bold">Strict</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
