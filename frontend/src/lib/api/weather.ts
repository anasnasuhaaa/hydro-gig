import { z } from "zod";
import { apiRequest } from "./client";
const nullableNumber = z.number().finite().nullable();
export const weatherSchema = z.object({
  provider: z.literal("open-meteo"),
  provenance: z.literal("model_predicted"),
  model_time: z.iso.datetime({ offset: true }),
  fetched_at: z.iso.datetime({ offset: true }),
  timezone: z.literal("Asia/Jakarta"),
  interval_seconds: z.number().int().positive(),
  temperature: nullableNumber,
  humidity: z.number().min(0).max(100).nullable(),
  precipitation: z.number().nonnegative().nullable(),
  wind_speed: z.number().nonnegative().nullable(),
  weather_code: z.number().int().nonnegative().nullable(),
  is_day: z.boolean().nullable(),
  units: z.object({
    temperature: z.literal("°C"),
    humidity: z.literal("%"),
    precipitation: z.literal("mm"),
    wind_speed: z.literal("km/h"),
  }),
  attribution: z.literal("Weather data by Open-Meteo (CC BY 4.0)"),
  source_url: z.literal("https://open-meteo.com/"),
});
export function getWeather(
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
) {
  const params = new URLSearchParams({
    latitude: latitude.toFixed(2),
    longitude: longitude.toFixed(2),
  });
  return apiRequest(
    `/current?${params}`,
    weatherSchema,
    { signal },
    "/api/v1/weather",
  );
}
