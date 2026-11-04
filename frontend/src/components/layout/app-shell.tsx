"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  Droplets,
  LayoutDashboard,
  Navigation,
  Route,
  ShieldCheck,
} from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
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
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pre-order", label: "Pre-order", icon: Route },
  { href: "/navigation", label: "Navigation", icon: Navigation },
  { href: "/claims", label: "Claims", icon: ShieldCheck },
];

function Workspace({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { state, isMobile, openMobile, setOpenMobile } = useSidebar();
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
        <SidebarHeader className="h-20 justify-center border-b px-3 group-data-[collapsible=icon]:px-2.5">
          <div className="flex items-center justify-between gap-1">
            <Link
              href="/dashboard"
              aria-label="HydroGig-Mesh overview"
              onClick={() => setOpenMobile(false)}
              className="flex min-h-11 min-w-0 items-center gap-2 rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none group-data-[collapsible=icon]:hidden"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Droplets className="size-5" />
              </span>
              <span className="truncate text-sm font-semibold tracking-tight">
                HydroGig<span className="text-primary">-Mesh</span>
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
              aria-expanded={isMobile ? openMobile : state === "expanded"}
              title={
                isMobile ? "Close navigation" : "Toggle sidebar (Ctrl/⌘ B)"
              }
            />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="px-2.5 py-5">
            <SidebarGroupContent>
              <nav aria-label="Main navigation">
                <SidebarMenu className="gap-2">
                  {links.map(({ href, label, icon: Icon }) => (
                    <SidebarMenuItem key={href}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === href}
                        tooltip={label}
                        className="min-h-11 min-w-11 gap-3 group-data-[collapsible=icon]:justify-center"
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
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset className="min-w-0">
        <header className="flex min-h-16 items-center justify-between gap-3 border-b bg-card px-4 sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <SidebarTrigger
              className="size-11 md:hidden"
              aria-label="Open navigation"
              aria-expanded={openMobile}
            />
            <span className="truncate text-sm font-medium">{title}</span>
          </div>
          <ThemeToggle />
        </header>
        <div
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-[1440px] flex-1 space-y-6 px-4 py-6 outline-none sm:px-8 sm:py-8"
        >
          {children}
        </div>
        <footer className="mx-auto flex w-full max-w-[1440px] justify-end px-4 pb-5 text-sm text-muted-foreground sm:px-8">
          <Link
            href="/dashboard#system-status"
            className="inline-flex min-h-11 items-center gap-1 rounded-md hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            System status <ArrowUpRight className="size-4" />
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
