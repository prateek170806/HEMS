import { getCurrentHousehold } from "@/lib/server/auth";
import { DemoButton } from "@/components/demo/DemoButton";
import prisma from "@/lib/prisma";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { IntelligenceCenter } from "@/components/dashboard/IntelligenceCenter";

export default async function Home() {
  const household = await getCurrentHousehold();
  if (!household) return <div>No household configured.</div>;
  
  const schedules = await prisma.schedule.findMany({
    where: { householdId: household.id },
    include: { appliance: true },
    orderBy: { startTime: 'asc' }
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Overview</h2>
          <p className="text-muted-foreground">Monitor and control your digital energy simulation.</p>
        </div>
        <DemoButton />
      </div>

      <DashboardClient 
        schedules={schedules} 
        powerLimitKw={household.powerLimitKw} 
      />

      <IntelligenceCenter />
    </div>
  );
}
