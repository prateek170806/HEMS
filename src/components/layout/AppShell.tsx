"use client";

import React from "react";
import { usePathname } from "next/navigation";

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
      <div className="min-h-screen w-full flex flex-col justify-center items-center bg-background selection:bg-primary selection:text-primary-foreground">
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
