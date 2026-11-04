"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import type { StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Future data-driven workspace: caller must supply a licensed style and accessible context.
// Browser-only MapLibre code is loaded after mount; no tile requests without a supplied style.
export function MapCanvas({
  style,
  label,
}: {
  style: StyleSpecification;
  label: string;
}) {
  const t = useTranslations("Map");
  const container = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let map: import("maplibre-gl").Map | undefined;
    import("maplibre-gl")
      .then(({ Map, NavigationControl }) => {
        if (cancelled || !container.current) return;
        map = new Map({
          container: container.current,
          style,
          center: [106.797, -6.598],
          zoom: 12,
        });
        map.addControl(new NavigationControl(), "top-right");
        map.on("error", () => setFailed(true));
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [style]);

  return (
    <div className="space-y-3">
      {failed && (
        <Alert variant="destructive">
          <AlertTitle>{t("unavailable")}</AlertTitle>
          <AlertDescription>{t("error")}</AlertDescription>
        </Alert>
      )}
      <div
        ref={container}
        role="region"
        aria-label={label}
        className="h-96 w-full overflow-hidden rounded-xl border"
      />
    </div>
  );
}
