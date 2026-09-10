"use client";

import { UserCircle, Settings, Monitor, LogOut, ChevronsUpDown, Home } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { logoutAction } from "@/app/auth.actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

interface UserProfileWidgetProps {
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

export function UserProfileWidget({ user, household }: UserProfileWidgetProps) {
  const router = useRouter();
  const { setTheme } = useTheme();

  if (!user) {
    return (
      <Link
        href="/login"
        className="flex items-center space-x-3 p-2.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground text-sm font-medium"
      >
        <UserCircle className="h-5 w-5" />
        <span>Sign In</span>
      </Link>
    );
  }

  const initials =
    user.avatarInitials ||
    (user.name
      ? user.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)
      : "U");
  const householdName = household?.name || "My Home";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg group"
        aria-label="User profile menu"
      >
        <div className="flex items-center justify-between w-full p-2.5 rounded-lg hover:bg-accent/80 transition-colors text-left border border-transparent hover:border-border cursor-pointer">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold flex-shrink-0 shadow-sm">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium leading-tight truncate text-foreground group-hover:text-foreground">
                {user.name || "Customer"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate flex items-center gap-1">
                <Home className="h-3 w-3 inline-block shrink-0 text-muted-foreground" />
                <span className="truncate">{householdName}</span>
              </p>
            </div>
          </div>
          <ChevronsUpDown className="h-4 w-4 text-muted-foreground shrink-0 ml-1 group-hover:text-foreground transition-colors" />
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        side="top"
        sideOffset={8}
        className="w-64 p-2 shadow-lg rounded-xl border bg-popover"
      >
        <DropdownMenuLabel className="font-normal p-2.5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shadow-sm shrink-0">
              {initials}
            </div>
            <div className="flex flex-col space-y-0.5 min-w-0 flex-1">
              <p className="text-sm font-semibold leading-none truncate text-foreground">
                {user.name || "Customer"}
              </p>
              <p className="text-xs leading-none text-muted-foreground truncate pt-0.5">
                {user.email}
              </p>
              <div className="pt-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground border">
                  <Home className="h-2.5 w-2.5" />
                  {householdName}
                </span>
              </div>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="my-1" />

        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => router.push("/profile")}
            className="cursor-pointer py-2 px-2.5 text-sm rounded-md"
          >
            <UserCircle className="mr-2.5 h-4 w-4 text-muted-foreground" />
            <span>My Profile</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => router.push("/settings")}
            className="cursor-pointer py-2 px-2.5 text-sm rounded-md"
          >
            <Settings className="mr-2.5 h-4 w-4 text-muted-foreground" />
            <span>Household Settings</span>
          </DropdownMenuItem>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="py-2 px-2.5 text-sm rounded-md">
              <Monitor className="mr-2.5 h-4 w-4 text-muted-foreground" />
              <span>Theme</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent className="w-36">
                <DropdownMenuItem
                  onClick={() => setTheme("light")}
                  className="cursor-pointer"
                >
                  Light
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setTheme("dark")}
                  className="cursor-pointer"
                >
                  Dark
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setTheme("system")}
                  className="cursor-pointer"
                >
                  System
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="my-1" />

        <DropdownMenuItem
          className="cursor-pointer py-2 px-2.5 text-sm rounded-md text-destructive focus:text-destructive focus:bg-destructive/10"
          onClick={() => {
            logoutAction();
          }}
        >
          <LogOut className="mr-2.5 h-4 w-4 text-destructive" />
          <span className="font-medium">Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
