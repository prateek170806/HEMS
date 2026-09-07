import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { RefreshCcw, CloudRain, Sun, ZapOff } from "lucide-react";

export default function SimulationPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Simulation Mode</h2>
          <p className="text-muted-foreground">
            Test the HEMS system under different scenarios without real hardware.
          </p>
        </div>
        <Button variant="outline">
          <RefreshCcw className="w-4 h-4 mr-2" />
          Reset Simulation
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Environment</CardTitle>
            <CardDescription>Adjust weather and external factors.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Sun className="w-4 h-4 text-amber-500" />
                  Solar Irradiance
                </label>
                <span className="text-sm text-muted-foreground">Normal</span>
              </div>
              <Slider defaultValue={[50]} max={100} step={1} />
            </div>

            <div className="space-y-3 pt-4">
              <div className="flex justify-between">
                <label className="text-sm font-medium flex items-center gap-2">
                  <CloudRain className="w-4 h-4 text-blue-500" />
                  Forecast Error
                </label>
                <span className="text-sm text-muted-foreground">0%</span>
              </div>
              <Slider defaultValue={[0]} max={50} step={5} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Grid & Household</CardTitle>
            <CardDescription>Simulate grid events and base load.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Demand Response Event</label>
              <Button size="sm" variant="outline">Trigger Event</Button>
            </div>
            
            <div className="space-y-3 pt-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium">Household Base Load</label>
                <span className="text-sm text-muted-foreground">0.5 kW</span>
              </div>
              <Slider defaultValue={[10]} max={50} step={1} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fault Injection</CardTitle>
            <CardDescription>Test system resilience and error recovery.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-2">
                <ZapOff className="w-4 h-4 text-destructive" />
                <label className="text-sm font-medium">Smart Meter Offline</label>
              </div>
              <Switch />
            </div>
            
            <div className="flex items-center justify-between border-b pb-4">
              <label className="text-sm font-medium">EV Charger Disconnected</label>
              <Switch />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Inverter Comms Failure</label>
              <Switch />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
