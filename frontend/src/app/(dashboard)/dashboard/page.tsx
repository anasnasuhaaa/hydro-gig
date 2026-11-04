import { useTranslations } from "next-intl";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Droplets,
  Navigation,
  Route,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WeatherCard } from "@/components/weather/weather-card";
import { SystemStatus } from "@/components/dashboard/system-status";
export { dashboardMetadata as generateMetadata } from "@/i18n/metadata";

export default function Dashboard() {
  const t = useTranslations("Dashboard");
  const workflows = [
    {
      icon: Route,
      title: t("preOrder"),
      description: t("preOrderDesc"),
      href: "/pre-order",
    },
    {
      icon: Navigation,
      title: t("navigation"),
      description: t("navigationDesc"),
      href: "/navigation",
    },
    {
      icon: BookOpen,
      title: t("guide"),
      description: t("guideDesc"),
      href: "/guide",
    },
  ];
  return (
    <>
      <section
        className="climate-hero relative overflow-hidden rounded-3xl p-6 shadow-sm sm:p-9"
        aria-labelledby="dashboard-title"
      >
        <div className="relative z-10 max-w-2xl space-y-5">
          <Badge
            variant="outline"
            className="h-auto min-h-7 border-current/30 px-3 py-1 text-current"
          >
            <Droplets className="size-4" />
            {t("prototype")}
          </Badge>
          <h1
            id="dashboard-title"
            className="text-3xl leading-tight font-semibold tracking-tight sm:text-5xl"
          >
            {t("title")}
          </h1>
          <p className="max-w-lg text-base opacity-95">{t("subtitle")}</p>
          <Button asChild className="hero-action min-h-12 px-5 text-base">
            <Link href="/pre-order">
              {t("screen")}
              <ArrowRight />
            </Link>
          </Button>
        </div>
        <Droplets
          className="pointer-events-none absolute -right-9 -bottom-10 size-64 opacity-10"
          strokeWidth={1}
          aria-hidden="true"
        />
      </section>
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <WeatherCard />
        <section className="space-y-3" aria-label={t("workflows")}>
          {workflows.map(({ icon: Icon, title, description, href }) => (
            <Link
              key={href}
              href={href}
              className="group flex min-w-0 items-center gap-4 rounded-2xl border bg-card p-5 shadow-sm transition-colors hover:border-primary/50 hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent text-primary">
                <Icon className="size-6" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold">{title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {description}
                </p>
              </div>
              <ArrowUpRight className="size-5 shrink-0 text-muted-foreground group-hover:text-primary" />
            </Link>
          ))}
          <p
            role="note"
            className="px-1 pt-2 text-sm leading-relaxed text-muted-foreground"
          >
            {t("limits")}
          </p>
        </section>
      </div>
      <details
        id="system-status"
        className="group scroll-mt-4 rounded-2xl border bg-card"
      >
        <summary className="min-h-12 cursor-pointer rounded-2xl p-4 text-sm font-medium focus-visible:ring-2 focus-visible:ring-ring">
          {t("diagnostics")}
        </summary>
        <div className="px-4 pb-4">
          <SystemStatus />
        </div>
      </details>
    </>
  );
}
