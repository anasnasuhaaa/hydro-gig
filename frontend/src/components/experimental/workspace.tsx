"use client";
import { type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useExperimentalSession } from "./session";
import { useQuery } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DemoSelect } from "@/components/demo/shared";
import {
  experimentalApi,
  requestSchema,
  type FixtureRequest,
} from "@/lib/api/experimental";

export function DatasetMode({ children }: { children: ReactNode }) {
  const t = useTranslations("Experimental");
  const { enabled, setEnabled, ready, invalid } = useExperimentalSession();
  return (
    <div className="space-y-4">
      <Button
        variant="outline"
        aria-pressed={enabled}
        onClick={() => setEnabled(!enabled)}
      >
        {t(enabled ? "synthetic" : "enable")}
      </Button>
      {invalid && <p role="status">{t("sessionInvalid")}</p>}
      {ready && enabled ? <Workspace /> : children}
    </div>
  );
}
function Workspace() {
  const t = useTranslations("Experimental");
  const locale = useLocale();
  const session = useExperimentalSession();
  const { request, setRequest } = session;
  const pathname = usePathname();
  const form = useForm<FixtureRequest>({
    resolver: zodResolver(requestSchema),
    values: request,
  });
  const network = useQuery({
    queryKey: ["experimental", "network"],
    queryFn: ({ signal }) => experimentalApi.network(signal),
  });
  const query = useQuery({
    queryKey: ["experimental", "routes", request],
    queryFn: ({ signal }) => experimentalApi.screen(request, signal),
  });
  const index = Number(request.step.slice(1));
  const previous = useQuery({
    queryKey: ["experimental", "routes", { ...request, step: `t${index - 1}` }],
    queryFn: ({ signal }) =>
      experimentalApi.screen(
        { ...request, step: requestSchema.shape.step.parse(`t${index - 1}`) },
        signal,
      ),
    enabled: index > 0,
  });
  const result = query.data;
  const graph = network.data;
  const signature = (r: NonNullable<typeof result>) =>
    JSON.stringify([
      r.origin_to_pickup.weighted.edge_ids,
      r.pickup_to_destination.weighted.edge_ids,
    ]);
  const changed =
    result && previous.data
      ? signature(result) !== signature(previous.data)
      : false;
  const weighted = new Set(
    result
      ? [
          ...result.origin_to_pickup.weighted.edge_ids,
          ...result.pickup_to_destination.weighted.edge_ids,
        ]
      : [],
  );
  const baseline = new Set(
    result
      ? [
          ...result.origin_to_pickup.baseline.edge_ids,
          ...result.pickup_to_destination.baseline.edge_ids,
        ]
      : [],
  );
  const error = network.isError || query.isError;
  return (
    <section className="space-y-4" aria-label={t("title")}>
      <h1 className="text-xl font-semibold">{t("title")}</h1>
      <p className="font-semibold">{t("label")}</p>
      <p>{t("limitations")}</p>
      <Button variant="outline" onClick={session.reset}>
        {t("resetTrip")}
      </Button>
      {graph && (
        <form
          className="grid gap-4 sm:grid-cols-3"
          onSubmit={form.handleSubmit((values) =>
            setRequest({ ...values, step: request.step }),
          )}
        >
          {(["origin", "pickup", "destination"] as const).map((name) => (
            <Controller
              key={name}
              name={name}
              control={form.control}
              render={({ field }) => (
                <DemoSelect
                  id={`experimental-${name}`}
                  label={t(name)}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  inputRef={field.ref}
                  options={graph.nodes.map((n) => ({
                    value: n.node_id,
                    label: n.node_id,
                  }))}
                />
              )}
            />
          ))}
          <Button type="submit">{t("screen")}</Button>
        </form>
      )}
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label={t("frames")}
      >
        {requestSchema.shape.step.options.map((step) => (
          <Button
            key={step}
            variant={step === request.step ? "default" : "outline"}
            aria-pressed={step === request.step}
            onClick={() => setRequest({ ...request, step })}
          >
            {step}
          </Button>
        ))}
      </div>
      {error ? (
        <div role="alert">
          <p>{t("error")}</p>
          <Button
            onClick={() => {
              void network.refetch();
              void query.refetch();
            }}
          >
            {t("retry")}
          </Button>
        </div>
      ) : !result || !graph ? (
        <p role="status">{t("loading")}</p>
      ) : (
        <>
          <Button asChild onClick={() => session.remember([...weighted])}>
            <Link href={pathname === "/navigation" ? "/claims" : "/navigation"}>
              {t(
                pathname === "/navigation"
                  ? "continueClaims"
                  : "continueNavigation",
              )}
            </Link>
          </Button>
          <p>
            {t("time")}:{" "}
            {new Intl.DateTimeFormat(locale, {
              dateStyle: "medium",
              timeStyle: "short",
              timeZone: "Asia/Jakarta",
            }).format(new Date(result.frame.timestamp))}{" "}
            {t("timezone")}
          </p>
          <p>
            {t("source")}: {result.dataset_id} / {result.dataset_version} ·{" "}
            {result.network_id} · {result.weighting_version}
          </p>
          <Card>
            <CardContent className="pt-6">
              <h2>{t("preview")}</h2>
              <p>{t("legend")}</p>
              <svg
                viewBox="0 0 600 400"
                role="img"
                aria-label={t("preview")}
                className="max-h-96 w-full"
              >
                <defs>
                  <marker
                    id="arrow"
                    viewBox="0 0 10 10"
                    refX="9"
                    refY="5"
                    markerWidth="5"
                    markerHeight="5"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
                  </marker>
                </defs>
                {(() => {
                  const xs = graph.nodes.map((n) => n.x),
                    ys = graph.nodes.map((n) => n.y);
                  const minX = Math.min(...xs),
                    minY = Math.min(...ys);
                  const dx = Math.max(...xs) - minX || 1,
                    dy = Math.max(...ys) - minY || 1;
                  const points = Object.fromEntries(
                    graph.nodes.map((n) => [
                      n.node_id,
                      {
                        x: 30 + (540 * (n.x - minX)) / dx,
                        y: 370 - (340 * (n.y - minY)) / dy,
                      },
                    ]),
                  );
                  return (
                    <>
                      {graph.edges.map((e) => (
                        <g key={e.edge_id}>
                          <line
                            x1={points[e.source_node].x}
                            y1={points[e.source_node].y}
                            x2={points[e.target_node].x}
                            y2={points[e.target_node].y}
                            stroke={
                              baseline.has(e.edge_id) ? "#2563eb" : "#94a3b8"
                            }
                            strokeWidth={baseline.has(e.edge_id) ? 7 : 2}
                            markerEnd="url(#arrow)"
                          />
                          {weighted.has(e.edge_id) && (
                            <line
                              x1={points[e.source_node].x}
                              y1={points[e.source_node].y}
                              x2={points[e.target_node].x}
                              y2={points[e.target_node].y}
                              stroke="#f97316"
                              strokeWidth="3"
                              strokeDasharray="7 3"
                            />
                          )}
                        </g>
                      ))}
                      {graph.nodes.map((n) => (
                        <g key={n.node_id}>
                          <circle
                            {...{
                              cx: points[n.node_id].x,
                              cy: points[n.node_id].y,
                            }}
                            r="5"
                            fill="currentColor"
                          />
                          <text
                            x={points[n.node_id].x + 8}
                            y={points[n.node_id].y - 6}
                            fontSize="13"
                            fill="currentColor"
                          >
                            {n.node_id}
                          </text>
                        </g>
                      ))}
                    </>
                  );
                })()}
              </svg>
            </CardContent>
          </Card>
          <div aria-live="polite">
            <p>
              {index === 0
                ? t("initial")
                : previous.isError
                  ? t("comparisonUnavailable")
                  : previous.data
                    ? t(changed ? "changed" : "unchanged")
                    : t("loading")}
            </p>
            <p>
              {t("affected")}:{" "}
              {result.frame.changed_edge_ids.join(", ") || t("none")}
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {(["origin_to_pickup", "pickup_to_destination"] as const).map(
              (leg) => (
                <Card key={leg}>
                  <CardContent className="space-y-3 pt-6">
                    <h2>{t(leg)}</h2>
                    {(["baseline", "weighted"] as const).map((mode) => {
                      const path = result[leg][mode];
                      return (
                        <div key={mode}>
                          <h3 className="font-semibold">{t(mode)}</h3>
                          {path.status === "unreachable" ? (
                            <p>{t("unreachable")}</p>
                          ) : (
                            <>
                              <p className="break-words">
                                {path.node_ids.join(" → ")}
                              </p>
                              <p>
                                {t("distance")}: {path.distance_m?.toFixed(2)} m
                              </p>
                              <p>
                                {t("objective")}:{" "}
                                {path.objective_cost?.toFixed(3)}{" "}
                                {mode === "baseline" ? "m" : t("units")}
                              </p>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              ),
            )}
          </div>
          <details>
            <summary>{t("values")}</summary>
            <p>{t("unitsCaveat")}</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    {["edge", "h_m", "u_ms", "v_ms", "weight", "delta"].map(
                      (k) => (
                        <th className="p-2" key={k}>
                          {t(k)}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(result.frame.samples).map(([edge, s]) => (
                    <tr key={edge}>
                      <td>{edge}</td>
                      {[
                        s.h_m,
                        s.u_ms,
                        s.v_ms,
                        s.weight,
                        result.frame.weight_deltas[edge] ?? null,
                      ].map((v, i) => (
                        <td className="p-2" key={i}>
                          {v ?? t("unknown")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
    </section>
  );
}
