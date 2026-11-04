import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  CloudSun,
  FlaskConical,
  Navigation,
  Route,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeading } from "@/components/shared/page-heading";
export { guideMetadata as generateMetadata } from "@/i18n/metadata";

export default function Guide() {
  const t = useTranslations("Guide");
  const steps = [
    { key: "screen", icon: Route, href: "/pre-order", action: "try" },
    { key: "explore", icon: Navigation, href: "/navigation", action: "open" },
    { key: "evidence", icon: ShieldCheck, href: null, action: null },
  ] as const;
  return (
    <>
      <PageHeading title={t("title")} description={t("subtitle")} />
      <ol className="grid gap-4 lg:grid-cols-3" aria-label={t("flow")}>
        {steps.map(({ key, icon: Icon, href, action }, index) => (
          <li key={key} className="relative min-w-0">
            <Card className="h-full border-primary/15 shadow-sm">
              <CardHeader className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="flex size-11 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
                    {index + 1}
                  </span>
                  <Icon className="size-7 text-primary" aria-hidden="true" />
                </div>
                <CardTitle>
                  <h2>{t(`${key}.title`)}</h2>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t(`${key}.description`)}
                </p>
                <p className="rounded-xl bg-accent/50 p-3 text-center font-mono text-sm">
                  {t(`${key}.diagram`)}
                </p>
                {href && action ? (
                  <Button asChild className="min-h-11 w-full">
                    <Link href={href}>
                      {t(action)}
                      <ArrowRight />
                    </Link>
                  </Button>
                ) : (
                  <Badge variant="secondary" className="px-3 py-2 text-sm">
                    {t("planned")}
                  </Badge>
                )}
              </CardContent>
            </Card>
          </li>
        ))}
      </ol>
      <section
        className="space-y-4 rounded-2xl border bg-card p-5 sm:p-6"
        aria-labelledby="guide-data-title"
      >
        <h2 id="guide-data-title" className="text-lg font-semibold">
          {t("dataTitle")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <p className="flex gap-3 text-sm leading-relaxed">
            <CloudSun className="size-6 shrink-0 text-primary" />
            {t("weather")}
          </p>
          <p className="flex gap-3 text-sm leading-relaxed">
            <FlaskConical className="size-6 shrink-0 text-primary" />
            {t("simulation")}
          </p>
        </div>
        <p role="note" className="border-t pt-4 text-sm font-medium">
          {t("safety")}
        </p>
      </section>
    </>
  );
}
