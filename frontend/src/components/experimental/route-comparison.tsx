"use client";
import { useTranslations, useLocale } from "next-intl";
import { Disclosure } from "@/components/ui/disclosure";
import { Check, Route } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type FixtureResult } from "@/lib/api/experimental";
export type RouteMode = "baseline" | "weighted";
export function routeTotal(
  result: FixtureResult,
  mode: RouteMode,
  field: "distance_m" | "objective_cost",
) {
  const paths = [
    result.origin_to_pickup[mode],
    result.pickup_to_destination[mode],
  ];
  return paths.every((p) => p.status === "found" && p[field] !== null)
    ? paths.reduce((sum, p) => sum + p[field]!, 0)
    : null;
}
export function RouteComparison({
  result,
  selected,
  onSelect,
}: {
  result: FixtureResult;
  selected: RouteMode;
  onSelect: (mode: RouteMode) => void;
}) {
  const t = useTranslations("Experimental");
  const locale = useLocale();
  const number = (value: number | null, digits = 2) =>
    value === null
      ? t("unknown")
      : new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(
          value,
        );
  return (
    <section aria-label={t("compare")} className="min-w-0 space-y-3">
      <div>
        <h2 className="text-lg font-semibold">{t("compare")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("compareHelp")}</p>
      </div>
      {(["baseline", "weighted"] as const).map((mode) => (
        <article
          key={mode}
          data-route={mode}
          data-selected={selected === mode}
          className={`rounded-2xl border bg-card p-4 transition-colors ${selected === mode ? "border-primary ring-1 ring-primary" : ""}`}
        >
          <Button
            variant="ghost"
            aria-pressed={selected === mode}
            className="h-auto min-h-11 w-full justify-between whitespace-normal px-0 text-left"
            onClick={() => onSelect(mode)}
          >
            <span className="flex items-center gap-2">
              <Route
                className={
                  mode === "baseline" ? "text-route-baseline" : "text-primary"
                }
              />
              {t(mode)}
            </span>
            {selected === mode && <Check className="shrink-0 text-primary" />}
          </Button>
          <dl className="mt-2 grid grid-cols-2 gap-3 border-b pb-4">
            <div>
              <dt className="text-xs text-muted-foreground">
                {t("tripDistance")}
              </dt>
              <dd className="mt-1 text-xl font-semibold tabular-nums">
                {number(routeTotal(result, mode, "distance_m"))}{" "}
                <span className="text-xs font-normal">{t("metres")}</span>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">
                {t("objective")}
              </dt>
              <dd className="mt-1 break-words text-xl font-semibold tabular-nums">
                {number(routeTotal(result, mode, "objective_cost"), 3)}
              </dd>
              <p className="text-xs text-muted-foreground">
                {mode === "baseline" ? t("metres") : t("units")}
              </p>
            </div>
          </dl>
          <Disclosure title={t("routePath")}>
            {(["origin_to_pickup", "pickup_to_destination"] as const).map(
              (leg) => (
                <div key={leg} className="mt-3 text-sm">
                  <h3 className="text-xs text-muted-foreground">{t(leg)}</h3>
                  <h4 className="sr-only">{t(mode)}</h4>
                  <p className="mt-1 break-words font-medium">
                    {result[leg][mode].status === "unreachable"
                      ? t("unreachable")
                      : result[leg][mode].node_ids.join(" → ")}
                  </p>
                </div>
              ),
            )}
          </Disclosure>
        </article>
      ))}
      <p className="text-xs leading-relaxed text-muted-foreground">
        {t("distance")} · {t("costHelp")}
      </p>
    </section>
  );
}
