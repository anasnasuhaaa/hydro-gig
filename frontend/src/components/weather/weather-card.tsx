"use client";
import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useFormatter, useNow, useTranslations } from "next-intl";
import {
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Droplets,
  LocateFixed,
  MapPin,
  Moon,
  RefreshCw,
  Sun,
  Wind,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getWeather } from "@/lib/api/weather";

const TEN_MINUTES = 10 * 60 * 1000;
type Location = {
  latitude: number;
  longitude: number;
  kind: "manual" | "device";
};
type LocationError =
  "denied" | "timeout" | "unsupported" | "offline" | "position" | null;
export function WeatherCard() {
  const t = useTranslations("Weather");
  const format = useFormatter();
  const now = useNow({ updateInterval: 60_000 });
  const [location, setLocation] = useState<Location | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<LocationError>(null);
  const attempt = useRef(0);
  const query = useQuery({
    queryKey: ["weather", location?.latitude, location?.longitude],
    queryFn: ({ signal }) =>
      getWeather(location!.latitude, location!.longitude, signal),
    enabled: !!location,
    staleTime: TEN_MINUTES,
    gcTime: 0,
    retry: false,
    refetchInterval: TEN_MINUTES,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const weather = query.data;
  const stale =
    !!weather &&
    (query.isError ||
      now.getTime() - Date.parse(weather.model_time) > 30 * 60_000 ||
      now.getTime() - Date.parse(weather.fetched_at) > 15 * 60_000);
  // Refresh is throttled even after failures. This is client volume control, not a global quota.
  const lastAttempt = Math.max(query.dataUpdatedAt, query.errorUpdatedAt);
  const canRefresh =
    !query.isFetching &&
    (!lastAttempt || now.getTime() - lastAttempt >= TEN_MINUTES);
  function locate() {
    const token = ++attempt.current;
    if (!navigator.onLine) {
      setLocationError("offline");
      return;
    }
    if (!window.isSecureContext || !navigator.geolocation) {
      setLocationError("unsupported");
      return;
    }
    setLocationError(null);
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (token !== attempt.current) return;
        setLocation({
          latitude: Number(position.coords.latitude.toFixed(2)),
          longitude: Number(position.coords.longitude.toFixed(2)),
          kind: "device",
        });
        setLocating(false);
      },
      (error) => {
        if (token !== attempt.current) return;
        setLocationError(
          error.code === 1
            ? "denied"
            : error.code === 3
              ? "timeout"
              : "position",
        );
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 5 * 60_000 },
    );
  }
  const code = weather?.weather_code;
  const condition =
    code === 0
      ? "clear"
      : code === 1 || code === 2
        ? "partlyCloudy"
        : code === 3
          ? "overcast"
          : code === 45 || code === 48
            ? "fog"
            : code != null && [51, 53, 55, 56, 57].includes(code)
              ? "drizzle"
              : code != null && [61, 63, 65, 66, 67, 80, 81, 82].includes(code)
                ? "rain"
                : code != null && [71, 73, 75, 77, 85, 86].includes(code)
                  ? "snow"
                  : code != null && [95, 96, 97, 99].includes(code)
                    ? "storm"
                    : "unknown";
  const Icon =
    condition === "clear"
      ? weather?.is_day === false
        ? Moon
        : Sun
      : condition === "partlyCloudy"
        ? CloudSun
        : condition === "fog"
          ? CloudFog
          : condition === "drizzle" || condition === "rain"
            ? CloudRain
            : condition === "snow"
              ? CloudSnow
              : condition === "storm"
                ? CloudLightning
                : Cloud;
  const number = (value: number | null) =>
    value === null
      ? t("missing")
      : format.number(value, { maximumFractionDigits: 1 });
  return (
    <Card
      className="overflow-hidden border-primary/15 shadow-sm"
      aria-labelledby="weather-title"
    >
      <CardHeader className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <CardTitle>
            <h2 id="weather-title">{t("title")}</h2>
          </CardTitle>
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="size-4 shrink-0" />
            {!location
              ? t("choose")
              : location.kind === "manual"
                ? t("bogor")
                : t("device", {
                    latitude: format.number(location.latitude, {
                      minimumFractionDigits: 2,
                    }),
                    longitude: format.number(location.longitude, {
                      minimumFractionDigits: 2,
                    }),
                  })}
          </p>
        </div>
        {location && (
          <Button
            variant="ghost"
            size="icon"
            className="size-11"
            aria-label={t("refresh")}
            title={canRefresh ? t("refresh") : t("refreshLimit")}
            disabled={!canRefresh}
            onClick={() => void query.refetch()}
          >
            <RefreshCw className={query.isFetching ? "animate-spin" : ""} />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            className="min-h-11"
            disabled={locating}
            onClick={locate}
          >
            <LocateFixed />
            {locating ? t("locating") : t("locate")}
          </Button>
          <Button
            variant="outline"
            className="min-h-11"
            onClick={() => {
              ++attempt.current;
              setLocating(false);
              setLocationError(null);
              setLocation({ latitude: -6.6, longitude: 106.8, kind: "manual" });
            }}
          >
            {t("manual")}
          </Button>
        </div>
        {locationError && (
          <p role="alert" className="text-sm text-muted-foreground">
            {t(locationError)}
          </p>
        )}
        {!location && (
          <p className="text-sm text-muted-foreground">{t("privacy")}</p>
        )}
        {location && query.isPending && (
          <p role="status" className="text-sm">
            {query.fetchStatus === "paused" ? t("offline") : t("loading")}
          </p>
        )}
        {query.isError && !weather && (
          <p role="alert" className="text-sm">
            {t("unavailable")} {t("retry")}
          </p>
        )}
        {weather && (
          <>
            {stale && (
              <p role="status" className="rounded-lg bg-accent p-3 text-sm">
                {t("stale")}
              </p>
            )}
            <div className="flex items-center justify-between gap-4 rounded-2xl bg-accent/50 p-5">
              <div>
                <p className="text-5xl font-semibold tracking-tight">
                  {number(weather.temperature)}
                  <span className="align-top text-xl">
                    {" "}
                    {weather.units.temperature}
                  </span>
                </p>
                <p className="mt-2 font-medium">
                  {t(`conditions.${condition}`)}
                </p>
              </div>
              <Icon
                className="size-16 shrink-0 text-primary"
                aria-hidden="true"
              />
            </div>
            <dl className="grid grid-cols-3 gap-2 text-sm">
              {[
                {
                  key: "precipitation",
                  icon: CloudRain,
                  value: weather.precipitation,
                  unit: weather.units.precipitation,
                },
                {
                  key: "humidity",
                  icon: Droplets,
                  value: weather.humidity,
                  unit: weather.units.humidity,
                },
                {
                  key: "wind",
                  icon: Wind,
                  value: weather.wind_speed,
                  unit: weather.units.wind_speed,
                },
              ].map(({ key, icon: MetricIcon, value, unit }) => (
                <div key={key} className="min-w-0 space-y-1">
                  <dt className="flex flex-wrap items-center gap-1 text-muted-foreground">
                    <MetricIcon className="size-4" />
                    {t(key)}
                  </dt>
                  <dd className="font-semibold">
                    {number(value)} {unit}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>
                {t("modelTime")}{" "}
                <time dateTime={weather.model_time}>
                  {format.dateTime(new Date(weather.model_time), {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </time>{" "}
                WIB
              </p>
              <p>
                {t("retrieved")}{" "}
                <time dateTime={weather.fetched_at}>
                  {format.dateTime(new Date(weather.fetched_at), {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </time>{" "}
                WIB
              </p>
              <p>
                {t("interval", {
                  minutes: format.number(weather.interval_seconds / 60),
                })}
              </p>
            </div>
          </>
        )}
        <div className="space-y-1 border-t pt-3 text-sm text-muted-foreground">
          <p>{t("boundary")}</p>
          <p>
            <a
              href="https://open-meteo.com/"
              className="rounded-sm underline underline-offset-4 focus-visible:ring-2 focus-visible:ring-ring"
            >
              Open-Meteo
            </a>
            {" · "}
            <a
              href="https://creativecommons.org/licenses/by/4.0/"
              className="rounded-sm underline underline-offset-4 focus-visible:ring-2 focus-visible:ring-ring"
            >
              CC BY 4.0
            </a>
            {" · "}
            {t("model")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
