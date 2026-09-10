"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";

interface AppShellProps {
  sidebar: React.ReactNode;
  topbar: React.ReactNode;
  children: React.ReactNode;
}

export function AppShell({ sidebar, topbar, children }: AppShellProps) {
  const pathname = usePathname();
  const isAuthRoute = pathname === "/login" || pathname === "/register";

  if (isAuthRoute) {
    return (
      <div className="relative min-h-screen w-full flex flex-col justify-center items-center bg-background selection:bg-primary selection:text-primary-foreground p-4">
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 rounded-full border border-border/60 bg-card/50 backdrop-blur-sm p-0.5 shadow-sm hover:border-border transition-colors">
          <ThemeToggle />
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {sidebar}
      <div className="flex flex-1 flex-col min-w-0">
        {topbar}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-muted/20">
          {children}
        </main>
      </div>
    </div>
  );
}
