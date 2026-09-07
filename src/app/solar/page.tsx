import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sun, ArrowRight, ArrowDown } from "lucide-react";

export default function SolarPage() {
  const currentGen = 3.2;
  const todayGen = 14.8;
  const selfConsumption = 82;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Solar PV</h2>
          <p className="text-muted-foreground">
            Monitor solar generation and usage.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Current Generation</CardTitle>
            <Sun className="h-4 w-4 text-amber-500 absolute top-6 right-6" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{currentGen} kW</div>
            <p className="text-xs text-muted-foreground mt-1">Generating right now</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Generation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{todayGen} kWh</div>
            <p className="text-xs text-muted-foreground mt-1">Total today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Self Consumption</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{selfConsumption}%</div>
            <p className="text-xs text-muted-foreground mt-1">Used locally in home/battery</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Power Routing</CardTitle>
          <CardDescription>Where your solar power is going right now</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-48 space-x-8">
            <div className="flex flex-col items-center">
              <Sun className="h-10 w-10 text-amber-500 mb-2" />
              <span className="font-bold">{currentGen} kW</span>
            </div>
            
            <ArrowRight className="h-6 w-6 text-muted-foreground" />
            
            <div className="space-y-6">
              <div className="flex items-center gap-4 bg-muted/30 p-3 rounded-lg border">
                <span className="w-16 text-sm font-medium">Home</span>
                <div className="w-32 bg-secondary h-2 rounded-full overflow-hidden">
                   <div className="bg-primary h-full" style={{ width: '65%' }}></div>
                </div>
                <span className="font-bold">2.1 kW</span>
              </div>
              
              <div className="flex items-center gap-4 bg-muted/30 p-3 rounded-lg border">
                <span className="w-16 text-sm font-medium">Battery</span>
                <div className="w-32 bg-secondary h-2 rounded-full overflow-hidden">
                   <div className="bg-emerald-500 h-full" style={{ width: '35%' }}></div>
                </div>
                <span className="font-bold">1.1 kW</span>
              </div>

              <div className="flex items-center gap-4 bg-muted/30 p-3 rounded-lg border opacity-50">
                <span className="w-16 text-sm font-medium">Grid</span>
                <div className="w-32 bg-secondary h-2 rounded-full overflow-hidden">
                   <div className="bg-blue-500 h-full" style={{ width: '0%' }}></div>
                </div>
                <span className="font-bold">0.0 kW</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
