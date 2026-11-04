import { useTranslations } from "next-intl";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Navigation,
  Route,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
      icon: ShieldCheck,
      title: t("claims"),
      description: t("claimsDesc"),
      href: "/claims",
    },
  ];
  return (
    <>
      <section
        className="rounded-2xl bg-[#0c4e49] px-6 py-10 text-white sm:px-10 sm:py-14"
        aria-labelledby="dashboard-title"
      >
        <div className="max-w-xl">
          <h1
            id="dashboard-title"
            className="text-3xl leading-tight font-semibold tracking-tight sm:text-5xl"
          >
            {t("title")}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-teal-50">
            {t("subtitle")}
          </p>
          <Button
            asChild
            className="mt-7 min-h-11 bg-white text-[#0c4e49] hover:bg-teal-50"
          >
            <Link href="/pre-order">
              {t("screen")} <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>
      <p className="text-sm leading-relaxed text-muted-foreground">
        <strong className="font-medium text-foreground">
          {t("prototype")}
        </strong>{" "}
        {t("limits")}
      </p>
      <section
        className="grid gap-3 md:grid-cols-3"
        aria-label={t("workflows")}
      >
        {workflows.map(({ icon: Icon, title, description, href }) => (
          <Link
            key={href}
            href={href}
            className="group flex min-w-0 items-center gap-4 rounded-xl border bg-card p-5 transition-colors hover:border-primary/50 hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
              <Icon className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold">{title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            </div>
            <ArrowUpRight className="size-4 shrink-0 text-muted-foreground group-hover:text-primary" />
          </Link>
        ))}
      </section>
      <SystemStatus />
    </>
  );
}
