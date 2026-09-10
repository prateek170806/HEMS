import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import prisma from "@/lib/prisma";
import { EditTariffDialog } from "@/components/tariffs/EditTariffDialog";
import { getCurrentHousehold } from "@/lib/server/auth";
import { TariffRepository } from "@/lib/server/repositories/tariff.repository";

export default async function TariffsPage() {
  const household = await getCurrentHousehold();
  if (!household) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tariff Management</h2>
          <p className="text-muted-foreground">No household configured. Please log in first.</p>
        </div>
      </div>
    );
  }

  let tariff = await prisma.tariff.findFirst({
    where: { householdId: household.id, isActive: true },
    include: { periods: { orderBy: { startTime: 'asc' } } }
  });

  // If no active tariff exists for this household, safely initialize default tenant tariff
  if (!tariff) {
    tariff = await TariffRepository.createDefault(household.id, "Standard TOU Tariff");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tariff Management</h2>
          <p className="text-muted-foreground">Configure your Time-of-Use electricity pricing structure.</p>
        </div>
        <EditTariffDialog tariff={tariff} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Current Tariff: {tariff.name}</CardTitle>
              <CardDescription>24-hour timeline — hover over segments to see prices</CardDescription>
            </div>
            <Badge variant={tariff.isActive ? "default" : "secondary"}>
              {tariff.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            <div className="relative h-24 w-full rounded-md border overflow-hidden flex">
              {tariff.periods.map((period) => {
                const startH = parseInt(period.startTime.split(':')[0]);
                const endH = parseInt(period.endTime.split(':')[0]) || 24;
                const widthPercent = Math.max(5, ((endH - startH) / 24) * 100);

                let bgColor = "bg-green-100 dark:bg-green-900/30";
                if (period.type === 'normal') bgColor = "bg-blue-100 dark:bg-blue-900/30";
                if (period.type === 'peak') bgColor = "bg-red-100 dark:bg-red-900/30";
                if (period.type === 'solar') bgColor = "bg-yellow-100 dark:bg-yellow-900/30";

                return (
                  <div
                    key={period.id}
                    style={{ width: `${widthPercent}%` }}
                    className={`${bgColor} h-full border-r last:border-r-0 relative group flex flex-col justify-end p-2`}
                  >
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-background/80 transition-opacity font-medium">
                      ₹{period.pricePerKwh.toFixed(2)} / kWh
                    </div>
                    <div className="text-xs font-medium truncate">{period.name}</div>
                    <div className="text-[10px] text-muted-foreground truncate">
                      {period.startTime}-{period.endTime}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {tariff.periods.map(period => (
                <div key={period.id} className="border rounded-lg p-4 bg-card">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-semibold">{period.name}</div>
                    <Badge variant={period.type === 'peak' ? 'destructive' : 'outline'} className="uppercase text-[10px]">
                      {period.type.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold">₹{period.pricePerKwh.toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {period.startTime} - {period.endTime}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
