import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Battery as BatteryIcon, Zap } from "lucide-react";

export default function BatteryPage() {
  const batterySoc = 74;
  const capacity = 10.0;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Battery Management</h2>
          <p className="text-muted-foreground">
            Monitor state of charge and storage health.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>Battery Status</CardTitle>
            <CardDescription>Current State of Charge</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="relative w-48 h-48 flex items-center justify-center rounded-full border-[16px] border-muted">
              {/* Fake SVG circle representing SOC */}
              <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                <circle
                  cx="50%"
                  cy="50%"
                  r="42%"
                  className="stroke-emerald-500 fill-transparent"
                  strokeWidth="16"
                  strokeDasharray="264"
                  strokeDashoffset={264 - (264 * batterySoc) / 100}
                />
              </svg>
              <div className="text-center">
                <div className="text-4xl font-bold">{batterySoc}%</div>
                <div className="text-sm text-muted-foreground">SOC</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-8 mt-8 w-full max-w-sm">
              <div className="text-center">
                <div className="text-xl font-bold text-emerald-500">2.1 kW</div>
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
                <span className="text-muted-foreground">Health</span>
                <span className="font-medium text-emerald-600">Good (98%)</span>
              </li>
              <li className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Reserve Limit</span>
                <span className="font-medium">20%</span>
              </li>
              <li className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Today's Charge</span>
                <span className="font-medium">4.2 kWh</span>
              </li>
              <li className="flex justify-between pb-2">
                <span className="text-muted-foreground">Today's Discharge</span>
                <span className="font-medium">1.8 kWh</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
