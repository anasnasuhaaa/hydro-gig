"use client";
import { useTranslations, useFormatter } from "next-intl";

import { Database, RefreshCw, Server, Waves } from "lucide-react";
import { toast } from "sonner";
import { useSystemStatus } from "@/hooks/use-system-status";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function SystemStatus() {
  const t = useTranslations("System");
  const format = useFormatter();
  const { data, isPending, isError, isFetching, refetch } = useSystemStatus();
  const databaseLabel =
    data?.database.state === "reachable"
      ? t("reachable")
      : data?.database.state === "not_configured"
        ? t("notConfigured")
        : data?.database.state === "unreachable"
          ? t("unreachable")
          : t("unknown");
  async function refresh() {
    const result = await refetch();
    if (result.isError) toast.error(t("failure"));
    else toast.success(t("success"));
  }
  const items = [
    {
      icon: Server,
      name: t("backend"),
      label: isError ? t("unavailable") : data ? t("connected") : t("checking"),
    },
    {
      icon: Database,
      name: t("database"),
      label: isError ? t("unknown") : databaseLabel,
    },
    { icon: Waves, name: t("flood"), label: t("unavailable") },
  ];
  return (
    <section
      aria-labelledby="system-status-title"
      className="scroll-mt-6 space-y-4 border-t pt-5"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="system-status-title" className="text-base font-semibold">
          {t("title")}
        </h2>
        <Button
          aria-label={t("refresh")}
          variant="ghost"
          className="min-h-11 min-w-11"
          disabled={isFetching}
          onClick={refresh}
        >
          <RefreshCw className={isFetching ? "animate-spin" : ""} />
          <span className="hidden sm:inline">{t("refreshText")}</span>
        </Button>
      </div>
      {isError && (
        <Alert variant="destructive">
          <AlertTitle>{t("error")}</AlertTitle>
          <AlertDescription>{t("retry")}</AlertDescription>
        </Alert>
      )}
      <dl className="grid gap-x-8 gap-y-4 md:grid-cols-3" aria-live="polite">
        {items.map(({ icon: Icon, name, label }, i) => (
          <div
            key={name}
            className="flex min-w-0 flex-wrap items-center justify-between gap-2 text-sm md:justify-start"
          >
            <dt className="flex items-center gap-2 text-muted-foreground">
              <Icon className="size-4" />
              {name}
            </dt>
            <dd className="font-medium">
              {isPending && i < 2 ? (
                <Skeleton aria-label={t("pending")} className="h-5 w-20" />
              ) : (
                label
              )}
            </dd>
          </div>
        ))}
      </dl>
      {data && !isError && (
        <p className="text-sm text-muted-foreground">
          {t("last")}{" "}
          <time dateTime={data.checked_at}>
            {format.dateTime(new Date(data.checked_at), {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </time>
          {isFetching ? t("refreshing") : ""}
        </p>
      )}
    </section>
  );
}
