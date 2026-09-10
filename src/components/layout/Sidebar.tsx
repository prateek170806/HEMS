"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Zap, Server, CalendarClock, Sun, Battery, Car, BarChart3, Bell, Settings, Activity, Beaker, Play, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/layout/Logo";

const navGroups = [
  {
    title: "HOME",
    items: [
      { name: "Overview", href: "/", icon: Home },
      { name: "Live Energy", href: "/live-energy", icon: Zap },
    ]
  },
  {
    title: "ANALYTICS",
    items: [
      { name: "Energy & Cost", href: "/analytics/energy", icon: Activity },
      { name: "Appliances", href: "/analytics/appliances", icon: Server },
      { name: "Solar", href: "/solar", icon: Sun },
      { name: "Battery", href: "/battery", icon: Battery },
    ]
  },
  {
    title: "OPTIMIZATION",
    items: [
      { name: "Savings Center", href: "/optimization/savings", icon: TrendingDown },
      { name: "Strategy & Constraints", href: "/optimization/settings", icon: Settings },
      { name: "Run History", href: "/optimization/history", icon: CalendarClock },
    ]
  },
  {
    title: "INTELLIGENCE",
    items: [
      { name: "Simulation Sandbox", href: "/simulation", icon: Beaker },
      { name: "SIH Demo", href: "/demo", icon: Play },
    ]
  }
];

import { UserProfileWidget } from "@/components/layout/UserProfileWidget";

interface SidebarProps {
  user?: {
    name?: string | null;
    email?: string | null;
    avatarInitials?: string | null;
    customerId?: string | null;
  } | null;
  household?: {
    name?: string | null;
  } | null;
}

export function Sidebar({ user, household }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="md:sticky md:top-0 md:h-screen w-full md:w-64 flex flex-col border-b md:border-b-0 md:border-r bg-card text-card-foreground md:overflow-y-auto flex-shrink-0 z-20">
      <div className="flex flex-row md:flex-col items-center md:items-start p-3 md:p-6 md:pb-0 gap-4 md:gap-0">
        <div className="flex-shrink-0">
          <Logo className="h-10 w-auto text-primary" />
        </div>
        <nav className="flex md:flex-col flex-row md:flex-1 md:space-y-1 space-x-2 md:space-x-0 overflow-x-auto md:overflow-visible w-full md:mt-6 pb-2 md:pb-4 scrollbar-hide">
          {navGroups.map((group) => (
            <div key={group.title} className="w-full">
              <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 hidden md:block">
                {group.title}
              </h3>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground whitespace-nowrap",
                        isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                      )}
                    >
                      <item.icon className={cn("mr-3 h-5 w-5 flex-shrink-0", isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground")} aria-hidden="true" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
              <div className="h-4 md:h-6" />
            </div>
          ))}
        </nav>
      </div>
      <div className="mt-auto border-t p-3 hidden md:block">
        <UserProfileWidget user={user} household={household} />
      </div>
    </div>
  );
}
