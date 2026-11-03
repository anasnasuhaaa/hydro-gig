"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Activity,
  ArrowUpRight,
  Droplets,
  LayoutDashboard,
  MapPin,
  Menu,
  Navigation,
  PanelLeftClose,
  PanelLeftOpen,
  Route,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/pre-order", label: "Pre-order screening", icon: Route },
  { href: "/navigation", label: "Navigation", icon: Navigation },
  { href: "/claims", label: "Evidence & claims", icon: ShieldCheck },
];

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/dashboard"
      aria-label="HydroGig-Mesh overview"
      className="flex items-center gap-3"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <Droplets className="size-6" />
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className="block text-base font-semibold tracking-tight">
            HydroGig<span className="text-primary">-Mesh</span>
          </span>
          <span className="text-[10px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
            Climate intelligence
          </span>
        </span>
      )}
    </Link>
  );
}

function NavLinks({
  compact = false,
  onNavigate,
}: {
  compact?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main navigation" className="space-y-2">
      {links.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={onNavigate}
          title={compact ? label : undefined}
          aria-label={compact ? label : undefined}
          aria-current={pathname === href ? "page" : undefined}
          className={cn(
            "flex min-h-11 items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            pathname === href
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground",
            compact && "justify-center px-0",
          )}
        >
          <Icon className="size-[18px] shrink-0" />
          {!compact && label}
        </Link>
      ))}
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const title =
    links.find((link) => link.href === pathname)?.label ?? "Workspace";
  return (
    <div className="min-h-screen">
      <a
        href="#main-content"
        className="sr-only fixed z-50 rounded-md bg-primary p-3 text-primary-foreground focus:not-sr-only"
      >
        Skip to content
      </a>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden flex-col border-r bg-card p-5 lg:flex",
          collapsed ? "w-20 px-3" : "w-64",
        )}
      >
        <Brand compact={collapsed} />
        <Separator className="my-7" />
        {!collapsed && (
          <p className="mb-4 px-3 text-[10px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            Driver workspace
          </p>
        )}
        <NavLinks compact={collapsed} />
        <div className="mt-auto space-y-5">
          {!collapsed && (
            <div className="rounded-xl border bg-muted/40 p-4">
              <Activity className="mb-3 size-5 text-primary" />
              <p className="text-sm font-medium">Built for safer journeys.</p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                A research foundation for flood-aware mobility in Bogor.
              </p>
              <Badge variant="outline" className="mt-3">
                Phase 01 · Foundation
              </Badge>
            </div>
          )}
          <Button
            variant="ghost"
            className="min-h-11 w-full justify-start"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setCollapsed((value) => !value)}
          >
            {collapsed ? (
              <PanelLeftOpen />
            ) : (
              <>
                <PanelLeftClose />
                Collapse sidebar
              </>
            )}
          </Button>
        </div>
      </aside>
      <div className={cn(collapsed ? "lg:pl-20" : "lg:pl-64")}>
        <header className="flex min-h-20 items-center justify-between gap-3 border-b bg-card/80 px-4 sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-11 lg:hidden"
                  aria-label="Open navigation"
                >
                  <Menu />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-5">
                <SheetHeader className="px-0">
                  <SheetTitle>HydroGig-Mesh</SheetTitle>
                  <SheetDescription>
                    Driver workspace navigation
                  </SheetDescription>
                </SheetHeader>
                <NavLinks onNavigate={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>
            <div className="flex items-center gap-2 text-sm">
              <span className="hidden text-muted-foreground sm:inline">
                Workspace
              </span>
              <span className="hidden text-muted-foreground/50 sm:inline">
                /
              </span>
              <span className="truncate font-medium">{title}</span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
              <MapPin className="size-3.5" />
              Bogor, Indonesia
            </span>
            <ThemeToggle />
          </div>
        </header>
        <main
          id="main-content"
          className="mx-auto max-w-[1500px] space-y-7 px-4 py-7 sm:px-8 sm:py-9"
        >
          {children}
        </main>
        <footer className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3 px-4 pb-7 text-xs text-muted-foreground sm:px-8">
          <span>HydroGig-Mesh · Research & development</span>
          <Link
            href="/dashboard#system-status"
            className="inline-flex min-h-11 items-center gap-1 hover:text-primary"
          >
            System status
            <ArrowUpRight className="size-3" />
          </Link>
        </footer>
      </div>
    </div>
  );
}
