"use client";

import { Database, RefreshCw, Server, Waves } from "lucide-react";
import { toast } from "sonner";
import { useSystemStatus } from "@/hooks/use-system-status";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
      detail: "FastAPI · versioned REST API",
      label: isError ? "Unavailable" : data ? "Connected" : "Checking",
      good: !!data && !isError,
    },
    {
      icon: Database,
      name: "Spatial database",
      detail: "PostgreSQL + PostGIS",
      label: isError ? "Unknown" : databaseLabel,
      good: !isError && data?.database.reachable,
    },
    {
      icon: Waves,
      name: "Flood data",
      detail: "No validated dataset connected",
      label: "Unavailable",
      good: false,
    },
  ];
  return (
    <Card id="system-status" className="scroll-mt-6 shadow-none">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div>
          <CardTitle className="text-base">System connectivity</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Infrastructure status, checked against the API.
          </p>
        </div>
        <Button
          aria-label="Refresh system status"
          variant="outline"
          className="min-h-11"
          disabled={isFetching}
          onClick={refresh}
        >
          <RefreshCw className={isFetching ? "animate-spin" : ""} />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isError && (
          <Alert variant="destructive">
            <AlertTitle>Backend connection unavailable</AlertTitle>
            <AlertDescription>
              Start the backend or check its configured address, then refresh.
              Previous status is not shown as current.
            </AlertDescription>
          </Alert>
        )}
        <div className="grid gap-4 md:grid-cols-3" aria-live="polite">
          {items.map(({ icon: Icon, name, detail, label, good }, i) => (
            <div
              key={name}
              className="flex min-w-0 items-center gap-3 rounded-xl border p-4"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Icon className="size-5 text-muted-foreground" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
                {isPending && i < 2 ? (
                  <Skeleton className="mt-2 h-5 w-20" />
                ) : (
                  <Badge variant="outline" className="mt-2 gap-1.5">
                    <span
                      className={
                        good
                          ? "size-1.5 rounded-full bg-risk-low"
                          : "size-1.5 rounded-full bg-risk-unknown"
                      }
                    />
                    {label}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
        {data && !isError && (
          <p className="text-xs text-muted-foreground">
            Last checked:{" "}
            <time dateTime={data.checked_at}>
              {new Date(data.checked_at).toLocaleString()}
            </time>
            {isFetching ? " · Refreshing…" : " · Updates every minute"}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
