"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";

import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

interface TopbarProps {
  user: { name: string; email: string };
}

export function Topbar({ user }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-sidebar-border bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-6">
      <SidebarTrigger className="-ml-1" />
      <div className="flex-1" />
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <UserMenu name={user.name} email={user.email} />
      </div>
    </header>
  );
}