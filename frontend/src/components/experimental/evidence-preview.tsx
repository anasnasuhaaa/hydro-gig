"use client";
import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { experimentalApi, getEvidencePreview } from "@/lib/api/experimental";
import { useExperimentalSession } from "./session";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
export function EvidencePreviewWorkspace({
  children,
}: {
  children: ReactNode;
}) {
  const session = useExperimentalSession();
  const t = useTranslations("Evidence");
  const locale = useLocale();
  const request = session.request;
  const query = useQuery({
    queryKey: ["experimental", "routes", request],
    queryFn: ({ signal }) => experimentalApi.screen(request, signal),
    enabled: session.ready && session.enabled,
  });
  const mutation = useMutation({ mutationFn: getEvidencePreview });
  const [exportFailed, setExportFailed] = useState(false);
  const result = query.data;
  const preview = mutation.data;
  const matches =
    preview &&
    JSON.stringify(preview.content.calculation.request) ===
      JSON.stringify(request);
  const format = (value: string) =>
    new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Jakarta",
    }).format(new Date(value));
  if (!session.ready || !session.enabled)
    return (
      <>
        {children}
        <Button asChild className="mt-4">
          <Link href="/pre-order">{t("start")}</Link>
        </Button>
      </>
    );
  return (
    <section className="space-y-4" aria-label={t("title")}>
      <h1 className="text-xl font-semibold">{t("title")}</h1>
      <p className="font-semibold">{t("label")}</p>
      <p>{t("submission")}</p>
      <p>{t("limitations")}</p>
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <Link href="/navigation">{t("back")}</Link>
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            mutation.reset();
            session.reset();
            setExportFailed(false);
          }}
        >
          {t("reset")}
        </Button>
      </div>
      {query.isError ? (
        <p role="alert">{t("error")}</p>
      ) : !result ? (
        <p role="status">{t("loading")}</p>
      ) : (
        <>
          <Card>
            <CardContent className="space-y-2 pt-6">
              <h2>{t("trip")}</h2>
              <p>
                {t("stops", {
                  origin: request.origin,
                  pickup: request.pickup,
                  destination: request.destination,
                })}
              </p>
              <p>
                {t("scenario")}: {request.step} · {result.scenario_id}
              </p>
              <p>
                {t("validTime")}: {format(result.frame.timestamp)}
              </p>
              <p>{t("valuesHelp")}</p>
              {(["origin_to_pickup", "pickup_to_destination"] as const).map(
                (leg) => (
                  <div key={leg}>
                    <h3>{t(leg)}</h3>
                    <p className="break-words">
                      {result[leg].weighted.status === "unreachable"
                        ? t("unreachable")
                        : result[leg].weighted.node_ids.join(" → ")}
                    </p>
                  </div>
                ),
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <caption>{t("segments")}</caption>
                  <thead>
                    <tr>
                      {["edge", "depth", "u", "v", "weight", "affected"].map(
                        (k) => (
                          <th className="p-2" key={k}>
                            {t(k)}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from(
                      new Set([
                        ...result.origin_to_pickup.weighted.edge_ids,
                        ...result.pickup_to_destination.weighted.edge_ids,
                      ]),
                    ).map((edge) => {
                      const s = result.frame.samples[edge];
                      return (
                        <tr key={edge}>
                          <td>{edge}</td>
                          {[s?.h_m, s?.u_ms, s?.v_ms, s?.weight].map((v, i) => (
                            <td className="p-2" key={i}>
                              {v ?? t("unknown")}
                            </td>
                          ))}
                          <td>
                            {t(
                              result.frame.changed_edge_ids.includes(edge)
                                ? "yes"
                                : "no",
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          <Button
            disabled={mutation.isPending}
            onClick={() => {
              setExportFailed(false);
              mutation.mutate(request);
            }}
          >
            {t(mutation.isPending ? "generating" : "generate")}
          </Button>
          {mutation.isError && <p role="alert">{t("error")}</p>}
          {matches && (
            <Card>
              <CardContent className="space-y-3 pt-6">
                <h2>{t("ready")}</h2>
                <p>
                  {t("createdTime")}: {format(preview.created_at)}
                </p>
                <p>{t("digestHelp")}</p>
                <p className="break-all">{preview.sha256}</p>
                <Button
                  onClick={() => {
                    try {
                      const url = URL.createObjectURL(
                        new Blob([JSON.stringify(preview, null, 2) + "\n"], {
                          type: "application/json",
                        }),
                      );
                      const link = document.createElement("a");
                      link.href = url;
                      link.download = "hydrogig-experimental-evidence.json";
                      link.click();
                      setTimeout(() => URL.revokeObjectURL(url), 1000);
                    } catch {
                      setExportFailed(true);
                    }
                  }}
                >
                  {t("export")}
                </Button>
                {exportFailed && <p role="alert">{t("error")}</p>}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </section>
  );
}
