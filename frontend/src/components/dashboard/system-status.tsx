"use client";

import { Database, RefreshCw, Server, Waves } from "lucide-react";
import { toast } from "sonner";
import { useSystemStatus } from "@/hooks/use-system-status";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function SystemStatus() {
  const { data, isPending, isError, isFetching, refetch } = useSystemStatus();
  const databaseLabel =
    data?.database.state === "reachable"
      ? "Reachable"
      : data?.database.state === "not_configured"
        ? "Not configured"
        : data?.database.state === "unreachable"
          ? "Unreachable"
          : "Unknown";
  async function refresh() {
    const result = await refetch();
    if (result.isError)
      toast.error(
        "API status could not be refreshed. Check the backend connection.",
      );
    else toast.success("System connectivity checked.");
  }
  const items = [
    {
      icon: Server,
      name: "Backend API",
      label: isError ? "Unavailable" : data ? "Connected" : "Checking",
    },
    {
      icon: Database,
      name: "Spatial database",
      label: isError ? "Unknown" : databaseLabel,
    },
    { icon: Waves, name: "Live flood data", label: "Unavailable" },
  ];
  return (
    <section
      id="system-status"
      aria-labelledby="system-status-title"
      className="scroll-mt-6 space-y-4 border-t pt-5"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="system-status-title" className="text-base font-semibold">
          System connectivity
        </h2>
        <Button
          aria-label="Refresh system status"
          variant="ghost"
          className="min-h-11 min-w-11"
          disabled={isFetching}
          onClick={refresh}
        >
          <RefreshCw className={isFetching ? "animate-spin" : ""} />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>
      {isError && (
        <Alert variant="destructive">
          <AlertTitle>Backend connection unavailable</AlertTitle>
          <AlertDescription>
            Check the backend connection, then refresh.
          </AlertDescription>
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
                <Skeleton
                  aria-label="Checking connection"
                  className="h-5 w-20"
                />
              ) : (
                label
              )}
            </dd>
          </div>
        ))}
      </dl>
      {data && !isError && (
        <p className="text-sm text-muted-foreground">
          Last checked:{" "}
          <time dateTime={data.checked_at}>
            {new Date(data.checked_at).toLocaleString()}
          </time>
          {isFetching ? " · Refreshing…" : ""}
        </p>
      )}
    </section>
  );
}
