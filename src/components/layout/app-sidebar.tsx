"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, Home, ChevronRight } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AREAS, procesoHref } from "@/lib/navigation";

const OPEN_AREAS_KEY = "siico:sidebar-areas-open";

function readOpenAreas(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(OPEN_AREAS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const out: Record<string, boolean> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === "boolean") out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
}

function getInitials(name: string): string {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "U"
  );
}

interface AppSidebarProps {
  user: { name: string; email: string };
}

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();
  const [openAreas, setOpenAreas] = useState<Record<string, boolean>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setOpenAreas(readOpenAreas());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(OPEN_AREAS_KEY, JSON.stringify(openAreas));
  }, [openAreas, hydrated]);

  useEffect(() => {
    if (!pathname) return;
    const seg = pathname.split("/").filter(Boolean);
    const currentArea = seg[0];
    if (currentArea && AREAS.some((a) => a.slug === currentArea)) {
      setOpenAreas((prev) =>
        prev[currentArea] ? prev : { ...prev, [currentArea]: true },
      );
    }
  }, [pathname]);

  function toggleArea(slug: string) {
    setOpenAreas((prev) => ({ ...prev, [slug]: !prev[slug] }));
  }

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              tooltip="SIICO · Portal contable"
              className="data-[active=true]:bg-transparent"
            >
              <Link href="/dashboard">
                <span className="flex aspect-square size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <LayoutDashboard className="size-4" />
                </span>
                <div className="flex min-w-0 flex-col leading-tight">
                  <span className="truncate text-sm font-semibold">SIICO</span>
                  <span className="truncate text-[11px] text-sidebar-foreground/60">
                    Portal contable
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/dashboard"}
                  tooltip="Inicio"
                >
                  <Link href="/dashboard">
                    <Home />
                    <span>Inicio</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Áreas</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {AREAS.map((area) => {
                const isOpen = hydrated
                  ? openAreas[area.slug] ?? false
                  : false;
                const hasChildActive = area.procesos.some(
                  (p) => pathname === procesoHref(area.slug, p.slug),
                );

                return (
                  <Collapsible
                    key={area.slug}
                    asChild
                    open={isOpen}
                    onOpenChange={() => toggleArea(area.slug)}
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          tooltip={area.label}
                          data-child-active={hasChildActive}
                          className="data-[child-active=true]:bg-sidebar-accent/60 data-[child-active=true]:text-sidebar-accent-foreground"
                        >
                          <area.icon />
                          <span>{area.label}</span>
                          <ChevronRight className="ml-auto size-4 shrink-0 transition-transform duration-200 group-data-[state=open]/menu-item:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {area.procesos.map((proceso) => {
                            const href = procesoHref(area.slug, proceso.slug);
                            const active = pathname === href;
                            return (
                              <SidebarMenuSubItem key={proceso.slug}>
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={active}
                                  size="sm"
                                >
                                  <Link href={href}>
                                    <proceso.icon />
                                    <span>{proceso.label}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            );
                          })}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 px-2 py-1.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
              <Avatar className="size-7">
                <AvatarFallback className="text-[11px]">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-1 flex-col leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate text-xs font-medium text-sidebar-foreground">
                  {user.name}
                </span>
                <span className="truncate text-[11px] text-sidebar-foreground/55">
                  {user.email || "SIICO · v0.1"}
                </span>
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}