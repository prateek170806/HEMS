import { getCurrentHousehold } from "@/lib/server/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import prisma from "@/lib/prisma";
import { OverrideButton } from "@/components/appliances/OverrideButton";
import { EditApplianceDialog } from "@/components/appliances/EditApplianceDialog";
import { AddApplianceDialog } from "@/components/appliances/AddApplianceDialog";
import { DeleteApplianceButton } from "@/components/appliances/DeleteApplianceButton";
import { Zap, Clock, ShieldAlert, Cpu, Layers, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AppliancesPage() {
  const household = await getCurrentHousehold();
  if (!household) {
    return (
      <div className="mx-auto max-w-4xl p-8 text-center bg-card rounded-xl border">
        <h2 className="text-xl font-bold">No Household Configured</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Please log in or initialize the demo household to manage appliances.
        </p>
      </div>
    );
  }

  const appliances = await prisma.appliance.findMany({
    where: { householdId: household.id },
    orderBy: [
      { priority: 'desc' },
      { createdAt: 'asc' }
    ]
  });

  const totalCapacityKw = appliances.reduce((sum, app) => sum + app.ratedPower, 0);
  const shiftableCount = appliances.filter(a => a.flexibility === 'shiftable').length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Cpu className="h-7 w-7 text-primary" />
            Appliance Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure flexible household loads, rated power consumption, and scheduling windows for dynamic optimization.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <AddApplianceDialog householdId={household.id} />
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl p-4 border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Appliances</p>
            <p className="text-2xl font-bold text-foreground mt-1">{appliances.length}</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Layers className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-card rounded-xl p-4 border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Peak Capacity</p>
            <p className="text-2xl font-bold text-foreground mt-1">{totalCapacityKw.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">kW</span></p>
          </div>
          <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
            <Zap className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-card rounded-xl p-4 border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Shiftable Loads</p>
            <p className="text-2xl font-bold text-foreground mt-1">{shiftableCount} <span className="text-sm font-normal text-muted-foreground">flexible</span></p>
          </div>
          <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <Sparkles className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Appliance Grid / Empty State */}
      {appliances.length === 0 ? (
        <div className="bg-card rounded-2xl border border-dashed border-border p-12 text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
            <Cpu className="h-8 w-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-lg font-semibold text-foreground">No appliances configured</h3>
            <p className="text-sm text-muted-foreground">
              Add appliances to start modeling your household&apos;s digital energy consumption and tariff-aware optimization.
            </p>
          </div>
          <div className="pt-2">
            <AddApplianceDialog householdId={household.id} />
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {appliances.map((app) => (
            <Card key={app.id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <CardTitle className="text-lg font-semibold text-foreground">{app.name}</CardTitle>
                    <p className="text-xs text-muted-foreground capitalize mt-0.5">
                      {app.category.replace('_', ' ')}
                    </p>
                  </div>
                  <Badge variant={app.automationEnabled ? "default" : "secondary"} className="shrink-0">
                    {app.automationEnabled ? "Auto" : "Manual"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 flex-1">
                <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/40 text-xs">
                  <div>
                    <span className="text-muted-foreground block">Rated Power</span>
                    <span className="font-bold text-sm text-foreground">{app.ratedPower.toFixed(2)} kW</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Flexibility</span>
                    <span className="font-medium capitalize text-foreground">{app.flexibility.replace('_', ' ')}</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" /> Runtime Window:
                    </span>
                    <span className="font-medium text-foreground">{app.minRuntime}h – {app.maxRuntime}h</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5 text-amber-500" /> Allowed Window:
                    </span>
                    <span className="font-medium text-foreground">{app.earliestStart || '00:00'} – {app.latestFinish || '23:59'}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <ShieldAlert className="h-3.5 w-3.5 text-blue-500" /> Priority:
                    </span>
                    <span className="font-medium capitalize text-foreground">{app.priority}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-border flex items-center gap-2">
                  <EditApplianceDialog appliance={app} />
                  <OverrideButton applianceId={app.id} />
                  <DeleteApplianceButton applianceId={app.id} applianceName={app.name} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
