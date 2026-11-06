"use client";
import { Disclosure } from "@/components/ui/disclosure";
import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowLeft,
  Download,
  FileText,
  FileWarning,
  RotateCcw,
} from "lucide-react";
import { experimentalApi, getEvidencePreview } from "@/lib/api/experimental";
import { useExperimentalSession } from "./session";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
export function EvidencePreviewWorkspace() {
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
  const result = query.data,
    preview = mutation.data;
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
  const exportPreview = () => {
    if (!matches) return;
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
  };
  if (!session.ready) return <Skeleton className="h-80 rounded-2xl" />;
  return (
    <section aria-label={t("title")} className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="mb-2 text-xs font-semibold tracking-wide text-primary">
            {t("label")}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {t("title")}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            {t("reviewHelp")}
          </p>
        </div>
        <Button
          variant="ghost"
          className="min-h-11"
          onClick={() => {
            mutation.reset();
            session.reset();
            setExportFailed(false);
          }}
        >
          <RotateCcw className="size-4" />
          {t("reset")}
        </Button>
      </div>
      {query.isError ? (
        <div role="alert" className="rounded-2xl border p-5">
          <p>{t("error")}</p>
          <Button
            variant="outline"
            className="mt-3 min-h-11"
            onClick={() => {
              void query.refetch();
            }}
          >
            {t("retry")}
          </Button>
        </div>
      ) : !result ? (
        <div role="status">
          <p className="mb-3 text-sm text-muted-foreground">{t("loading")}</p>
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      ) : (
        <>
          <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)]">
            <section className="min-w-0 rounded-2xl border bg-card p-4 sm:p-6">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <FileText className="size-5 text-primary" />
                {t("trip")}
              </h2>
              <p className="mt-4 rounded-xl bg-muted px-4 py-3 text-sm font-medium">
                {t("stops", {
                  origin: request.origin,
                  pickup: request.pickup,
                  destination: request.destination,
                })}
              </p>
              <dl className="my-5 grid gap-4 border-b pb-5 sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-muted-foreground">
                    {t("scenario")}
                  </dt>
                  <dd className="mt-1 text-2xl font-semibold">
                    {request.step}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">
                    {t("validTime")}
                  </dt>
                  <dd className="mt-1 text-sm font-medium">
                    {format(result.frame.timestamp)}
                  </dd>
                </div>
              </dl>
              {(["origin_to_pickup", "pickup_to_destination"] as const).map(
                (leg) => (
                  <div key={leg} className="mt-5">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      {t(leg)}
                    </h3>
                    <p className="mt-2 break-words font-semibold">
                      {result[leg].weighted.status === "unreachable"
                        ? t("unreachable")
                        : result[leg].weighted.node_ids.join(" → ")}
                    </p>
                    <p className="mt-2 break-words font-mono text-xs text-muted-foreground">
                      {result[leg].weighted.edge_ids.join(" · ") ||
                        t("noEdges")}
                    </p>
                  </div>
                ),
              )}
            </section>
            <aside
              className="min-w-0 space-y-4 rounded-2xl border bg-card p-4 sm:p-6"
              aria-label={t("statusTitle")}
            >
              <FileWarning className="size-7 text-primary" />
              <h2 className="text-lg font-semibold">{t("unsigned")}</h2>
              <div className="space-y-2 text-sm">
                <p className="rounded-lg bg-secondary px-3 py-2 font-medium text-secondary-foreground">
                  {t("unverified")}
                </p>
                <p className="rounded-lg border px-3 py-2 font-medium">
                  {t("submission")}
                </p>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t("limitations")}
              </p>
              <Button
                className="h-auto min-h-12 w-full whitespace-normal"
                disabled={mutation.isPending}
                onClick={() => {
                  setExportFailed(false);
                  mutation.mutate(request);
                }}
              >
                <FileText className="size-4 shrink-0" />
                {t(mutation.isPending ? "generating" : "generate")}
              </Button>
              {mutation.isError && (
                <p role="alert" className="text-sm">
                  {t("error")}
                </p>
              )}
              {matches && (
                <div className="space-y-3 border-t pt-4" aria-live="polite">
                  <h3 className="font-semibold">{t("ready")}</h3>
                  <p className="text-xs text-muted-foreground">
                    {t("createdTime")}: {format(preview.created_at)}
                  </p>
                  <Button
                    className="h-auto min-h-11 w-full whitespace-normal"
                    variant="outline"
                    onClick={exportPreview}
                  >
                    <Download className="size-4 shrink-0" />
                    {t("export")}
                  </Button>
                  <Disclosure title={<>{t("digestTitle")}</>}>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {t("digestHelp")}
                    </p>
                    <p className="mt-3 break-all font-mono text-xs">
                      {preview.sha256}
                    </p>
                  </Disclosure>
                </div>
              )}
              {exportFailed && (
                <p role="alert" className="text-sm">
                  {t("error")}
                </p>
              )}
            </aside>
          </div>
          <Disclosure
            className="min-w-0 rounded-2xl border bg-card p-4 sm:p-6"
            title={t("segments")}
          >
            <p className="my-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              {t("valuesHelp")}
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">{t("segments")}</caption>
                <thead>
                  <tr>
                    {["edge", "depth", "u", "v", "weight", "affected"].map(
                      (k) => (
                        <th
                          scope="col"
                          className="p-3 text-xs text-muted-foreground"
                          key={k}
                        >
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
                      <tr key={edge} className="border-t">
                        <th
                          scope="row"
                          className="p-3 font-mono text-xs font-medium"
                        >
                          {edge}
                        </th>
                        {[s?.h_m, s?.u_ms, s?.v_ms, s?.weight].map((v, i) => (
                          <td key={i} className="p-3 tabular-nums">
                            {v ?? t("unknown")}
                          </td>
                        ))}
                        <td className="p-3">
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
            <Disclosure
              className="mt-4 border-t pt-2"
              title={<>{t("sourceDetails")}</>}
            >
              <dl className="grid gap-3 text-xs sm:grid-cols-2">
                {Object.entries({
                  dataset: result.dataset_id,
                  dataset_version: result.dataset_version,
                  network: result.network_id,
                  scenario: result.scenario_id,
                  algorithm: result.algorithm_version,
                  weighting: result.weighting_version,
                }).map(([key, value]) => (
                  <div key={key}>
                    <dt className="text-muted-foreground">
                      {t(`sourceLabels.${key}`)}
                    </dt>
                    <dd className="mt-1 break-words font-mono">{value}</dd>
                  </div>
                ))}
              </dl>
            </Disclosure>
          </Disclosure>
        </>
      )}
      <Button asChild variant="outline" className="min-h-11">
        <Link href="/navigation">
          <ArrowLeft className="size-4" />
          {t("back")}
        </Link>
      </Button>
    </section>
  );
}
