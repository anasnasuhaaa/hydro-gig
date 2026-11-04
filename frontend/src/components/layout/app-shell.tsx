"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  ArrowUpRight,
  Droplets,
  LayoutDashboard,
  MapPin,
  Navigation,
  Route,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const links = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/pre-order", label: "Pre-order screening", icon: Route },
  { href: "/navigation", label: "Navigation", icon: Navigation },
  { href: "/claims", label: "Evidence & claims", icon: ShieldCheck },
];

function Workspace({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const title =
    links.find((link) => link.href === pathname)?.label ?? "Workspace";
  return (
    <>
      <a
        href="#main-content"
        className="sr-only fixed z-50 rounded-md bg-primary p-3 text-primary-foreground focus:not-sr-only"
      >
        Skip to content
      </a>
      <Sidebar collapsible="icon">
        <SidebarHeader className="gap-3 border-b px-3 py-4 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-1">
          <div className="flex w-full items-center justify-between gap-1 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-2">
            <Link
              href="/dashboard"
              aria-label="HydroGig-Mesh overview"
              onClick={() => setOpenMobile(false)}
              className="flex min-h-11 items-center gap-2 rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Droplets className="size-6" />
              </span>
              <span className="leading-tight group-data-[collapsible=icon]:hidden">
                <span className="block text-sm font-semibold tracking-tight">
                  HydroGig<span className="text-primary">-Mesh</span>
                </span>
                <span className="text-[9px] tracking-[0.14em] text-muted-foreground uppercase">
                  Climate intelligence
                </span>
              </span>
            </Link>
            <SidebarTrigger
              className="size-11 shrink-0"
              aria-label={
                isMobile
                  ? "Close navigation"
                  : state === "collapsed"
                    ? "Expand sidebar"
                    : "Collapse sidebar"
              }
              aria-expanded={isMobile ? true : state === "expanded"}
            />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Driver workspace</SidebarGroupLabel>
            <nav aria-label="Main navigation">
              <SidebarMenu className="gap-2">
                {links.map(({ href, label, icon: Icon }) => (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === href}
                      tooltip={label}
                      className="min-h-11 min-w-11 gap-3"
                    >
                      <Link
                        href={href}
                        aria-label={label}
                        aria-current={pathname === href ? "page" : undefined}
                        onClick={() => setOpenMobile(false)}
                      >
                        <Icon />
                        <span>{label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </nav>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="p-4 group-data-[collapsible=icon]:hidden">
          <div className="rounded-xl border bg-muted/40 p-4">
            <Activity className="mb-3 size-5 text-primary" />
            <p className="text-sm font-medium">
              Flood-aware mobility research.
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              An experimental workspace for motorcycle journeys.
            </p>
            <Badge variant="outline" className="mt-3">
              Phase 1.5 · Demo preparation
            </Badge>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset id="main-content" className="min-w-0">
        <header className="flex min-h-20 items-center justify-between gap-3 border-b bg-card/80 px-4 sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <SidebarTrigger
              className="size-11 md:hidden"
              aria-label="Open navigation"
            />
            <div className="flex items-center gap-2 text-sm">
              <span className="hidden text-muted-foreground sm:inline">
                Workspace /
              </span>
              <span className="truncate font-medium">{title}</span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
              <MapPin className="size-3.5" />
              Bogor research project
            </span>
            <ThemeToggle />
          </div>
        </header>
        <div className="mx-auto w-full max-w-[1500px] flex-1 space-y-7 px-4 py-7 sm:px-8 sm:py-9">
          {children}
        </div>
        <footer className="mx-auto flex w-full max-w-[1500px] flex-wrap items-center justify-between gap-3 px-4 pb-7 text-xs text-muted-foreground sm:px-8">
          <span>HydroGig-Mesh · Research & development</span>
          <Link
            href="/dashboard#system-status"
            className="inline-flex min-h-11 items-center gap-1 hover:text-primary"
          >
            System status
            <ArrowUpRight className="size-3" />
          </Link>
        </footer>
      </SidebarInset>
    </>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider
      style={{ "--sidebar-width-icon": "4rem" } as React.CSSProperties}
    >
      <Workspace>{children}</Workspace>
    </SidebarProvider>
  );
}
