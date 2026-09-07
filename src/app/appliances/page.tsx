import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import prisma from "@/lib/prisma";
import { OverrideButton } from "@/components/appliances/OverrideButton";
import { EditApplianceDialog } from "@/components/appliances/EditApplianceDialog";
import { AddApplianceDialog } from "@/components/appliances/AddApplianceDialog";
import { DeleteApplianceButton } from "@/components/appliances/DeleteApplianceButton";

export default async function AppliancesPage() {
  const household = await prisma.household.findFirst();
  if (!household) return <div>No household configured. Run the demo first.</div>;

  const appliances = await prisma.appliance.findMany({
    where: { householdId: household.id },
    orderBy: { priority: 'desc' }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Appliances</h2>
          <p className="text-muted-foreground">Manage your flexible household loads.</p>
        </div>
        <AddApplianceDialog householdId={household.id} />
      </div>

      {appliances.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          No appliances configured. Add one above or run the Demo Scenario from the Overview page.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {appliances.map(app => (
            <Card key={app.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{app.name}</CardTitle>
                  <Badge variant={app.automationEnabled ? "default" : "secondary"}>
                    {app.automationEnabled ? "Auto" : "Manual"}
                  </Badge>
                </div>
                <CardDescription>{app.ratedPower.toFixed(2)} kW · {app.category.replace('_', ' ')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Flexibility</span>
                    <span className="capitalize">{app.flexibility.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Runtime</span>
                    <span>{app.minRuntime}h - {app.maxRuntime}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Allowed Window</span>
                    <span>{app.earliestStart || '00:00'} - {app.latestFinish || '23:59'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Priority</span>
                    <span className="capitalize">{app.priority}</span>
                  </div>

                  <div className="pt-4 flex gap-2">
                    <EditApplianceDialog appliance={app} />
                    <OverrideButton applianceId={app.id} />
                    <DeleteApplianceButton applianceId={app.id} applianceName={app.name} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
