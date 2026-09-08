"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Zap, Server, CalendarClock, Sun, Battery, Car, BarChart3, Bell, Settings, Activity, Beaker } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Overview", href: "/", icon: Home },
  { name: "Live Energy", href: "/live-energy", icon: Zap },
  { name: "Appliances", href: "/appliances", icon: Server },
  { name: "Schedule", href: "/schedules", icon: CalendarClock },
  { name: "Tariffs", href: "/tariffs", icon: BarChart3 },
  { name: "Solar", href: "/solar", icon: Sun },
  { name: "Battery", href: "/battery", icon: Battery },
  { name: "EV", href: "/ev", icon: Car },
  { name: "Analytics", href: "/analytics", icon: Activity },
  { name: "Simulation", href: "/simulation", icon: Beaker },
  { name: "Notifications", href: "/notifications", icon: Bell },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card text-card-foreground">
      <div className="p-6">
        <h1 className="text-2xl font-bold tracking-tight text-primary">HEMS</h1>
        <p className="text-sm text-muted-foreground">Smart Energy</p>
      </div>
      <nav className="flex-1 space-y-1 px-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
              )}
            >
              <item.icon className="mr-3 h-5 w-5 flex-shrink-0" aria-hidden="true" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-4">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
            <Home className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium leading-none">Green Valley</p>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Online
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
