import { getCurrentHousehold } from "@/lib/server/auth";
import prisma from "@/lib/prisma";
import { NotificationList } from "./NotificationList";

export default async function NotificationsPage() {
  const household = await getCurrentHousehold();
  
  if (!household) {
    return <div>No household configured.</div>;
  }

  const notifications = await prisma.notification.findMany({
    where: { householdId: household.id },
    orderBy: { timestamp: "desc" },
  });

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Notifications</h2>
        <p className="text-muted-foreground">Recent events and alerts from your smart home system.</p>
      </div>

      <NotificationList notifications={notifications} />
    </div>
  );
}
