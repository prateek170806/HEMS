import { Bell, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Topbar() {
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
          <Button variant="ghost" size="icon" className="relative">
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive"></span>
            <Bell className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            <span className="sr-only">View notifications</span>
          </Button>
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-border" aria-hidden="true" />
          <Button variant="ghost" size="icon">
            <UserCircle className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
            <span className="sr-only">User profile</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
