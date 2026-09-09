import { getCurrentHousehold } from "@/lib/server/auth";
import prisma from "@/lib/prisma";
import { DemoClient } from "./DemoClient";

export default async function DemoPage() {
  const household = await getCurrentHousehold();
  
  const appliances = household 
    ? await prisma.appliance.findMany({ where: { householdId: household.id } })
    : [];

  const latestRun = household
    ? await prisma.optimizationRun.findFirst({
        where: { householdId: household.id },
        orderBy: { timestamp: 'desc' },
        include: {
          schedules: {
            include: { appliance: true }
          }
        }
      })
    : null;

  const hasRun = !!latestRun && !!latestRun.savings && latestRun.schedules.length > 0;

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <DemoClient 
        hasRun={hasRun}
        household={household}
        appliances={appliances}
        latestRun={latestRun}
      />
    </div>
  );
}
