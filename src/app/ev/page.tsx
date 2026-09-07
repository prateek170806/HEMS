import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Car, ZapOff, Clock } from "lucide-react";

export default function EVPage() {
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
              <span className="font-medium flex items-center text-emerald-600">
                <span className="w-2 h-2 rounded-full bg-emerald-600 mr-2"></span>
                Connected
              </span>
            </div>
            <div className="flex items-center justify-between border-t pt-4">
              <span className="text-muted-foreground">Current SOC</span>
              <span className="text-2xl font-bold">67%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Charging Plan</CardTitle>
            <CardDescription>Optimization targets</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center"><Clock className="w-4 h-4 mr-2"/> Departure</span>
              <span className="font-bold">07:00 AM</span>
            </div>
            <div className="flex items-center justify-between border-t pt-4">
              <span className="text-muted-foreground">Required SOC</span>
              <span className="font-bold">90%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="text-amber-700">HEMS Action</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center justify-center py-2">
              <ZapOff className="h-8 w-8 text-amber-500 mb-2" />
              <span className="font-bold text-lg">Paused</span>
              <span className="text-sm text-muted-foreground mt-1 text-center">
                Reason: Peak Tariff Period<br/>
                Will resume at 22:00
              </span>
            </div>
            <Button className="w-full" variant="outline">Force Charge Now</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
