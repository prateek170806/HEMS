import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "./NotificationBell";
import { ProfileMenu } from "./ProfileMenu";

import { auth } from "../../../auth";

export async function Topbar() {
  const session = await auth();
  
  return (
    <header className="sticky top-0 z-10 flex h-16 flex-shrink-0 items-center gap-x-4 border-b bg-background px-4 sm:gap-x-6 sm:px-6 lg:px-8">
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex flex-1 items-center">
          <div className="flex items-center text-sm font-medium text-muted-foreground">
            <span className="hidden sm:inline-block">Current Tariff:</span>
            <span className="ml-2 inline-flex items-center rounded-md bg-green-500/10 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
              ₹6.00 / kWh (Normal)
            </span>
          </div>
        </div>
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <ThemeToggle />
          <NotificationBell />
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-border" aria-hidden="true" />
          <ProfileMenu user={session?.user} />
        </div>
      </div>
    </header>
  );
}
