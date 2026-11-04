import { expect, test, type Page } from "@playwright/test";

function weather(overrides = {}) {
  return {
    provider: "open-meteo",
    provenance: "model_predicted",
    model_time: new Date().toISOString(),
    fetched_at: new Date().toISOString(),
    timezone: "Asia/Jakarta",
    interval_seconds: 900,
    temperature: 27.5,
    humidity: 81,
    precipitation: 1.2,
    wind_speed: 8.4,
    weather_code: 61,
    is_day: true,
    units: {
      temperature: "°C",
      humidity: "%",
      precipitation: "mm",
      wind_speed: "km/h",
    },
    attribution: "Weather data by Open-Meteo (CC BY 4.0)",
    source_url: "https://open-meteo.com/",
    ...overrides,
  };
}
async function gps(
  page: Page,
  result: "success" | "denied" | "timeout" | "unsupported",
) {
  await page.addInitScript((result) => {
    Object.assign(window, { gpsCalls: 0 });
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value:
        result === "unsupported"
          ? undefined
          : {
              getCurrentPosition: (
                success: PositionCallback,
                error: PositionErrorCallback,
              ) => {
                Object.assign(window, {
                  gpsCalls:
                    (window as unknown as { gpsCalls: number }).gpsCalls + 1,
                });
                if (result === "success")
                  success({
                    coords: { latitude: -6.601234, longitude: 106.801234 },
                  } as GeolocationPosition);
                else
                  error({
                    code: result === "denied" ? 1 : 3,
                  } as GeolocationPositionError);
              },
            },
    });
  }, result);
}

test("location is requested only by action; manual selection, cache and locale stay honest", async ({
  page,
}) => {
  let requests = 0;
  await gps(page, "success");
  await page.route("**/api/v1/weather/current?**", (route) => {
    requests++;
    return route.fulfill({ json: weather() });
  });
  await page.goto("/dashboard");
  expect(
    await page.evaluate(
      () => (window as unknown as { gpsCalls: number }).gpsCalls,
    ),
  ).toBe(0);
  expect(requests).toBe(0);
  await page
    .getByRole("button", { name: "Pilih Bogor manual", exact: true })
    .click();
  await expect(
    page.getByText("Bogor (pilihan manual)", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("27,5", { exact: false })).toBeVisible();
  expect(
    await page.evaluate(
      () => (window as unknown as { gpsCalls: number }).gpsCalls,
    ),
  ).toBe(0);
  await expect(
    page.getByRole("link", { name: "Open-Meteo", exact: true }),
  ).toHaveAttribute("href", "https://open-meteo.com/");
  await expect(
    page.getByRole("button", { name: "Perbarui cuaca" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "English", exact: true }).click();
  await expect(
    page.getByText("Bogor (manual selection)", { exact: true }),
  ).toBeVisible();
  expect(requests).toBe(1);
  await page
    .getByRole("button", { name: "Use my location", exact: true })
    .click();
  await expect(page.getByText(/Device location · approx/)).toContainText(
    "-6.60",
  );
  expect(
    await page.evaluate(
      () => (window as unknown as { gpsCalls: number }).gpsCalls,
    ),
  ).toBe(1);
  await page.reload();
  await expect(
    page.getByText("Choose a weather location", { exact: true }),
  ).toBeVisible();
});

for (const result of ["denied", "timeout", "unsupported"] as const)
  test(`GPS ${result} has manual fallback`, async ({ page }) => {
    await gps(page, result);
    await page.route("**/api/v1/weather/current?**", (route) =>
      route.fulfill({ json: weather() }),
    );
    await page.goto("/dashboard");
    await page
      .getByRole("button", { name: "Gunakan lokasi saya", exact: true })
      .click();
    await expect(
      page.locator('[aria-labelledby="weather-title"]').getByRole("alert"),
    ).toContainText(
      result === "denied"
        ? "Izin lokasi ditolak"
        : result === "timeout"
          ? "kehabisan waktu"
          : "Lokasi perangkat tidak tersedia",
    );
    await page
      .getByRole("button", { name: "Pilih Bogor manual", exact: true })
      .click();
    await expect(page.getByText("27,5", { exact: false })).toBeVisible();
  });

test("weather loading, unavailable provider and interval retry", async ({
  page,
}) => {
  await page.clock.install();
  let requests = 0;
  let release: () => void = () => {};
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/v1/weather/current?**", async (route) => {
    requests++;
    if (requests === 1) {
      await pending;
      await route.fulfill({ status: 503 });
    } else await route.fulfill({ json: weather() });
  });
  await page.goto("/dashboard");
  await page
    .getByRole("button", { name: "Pilih Bogor manual", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Memuat cuaca");
  release();
  await expect(
    page.locator('[aria-labelledby="weather-title"]').getByRole("alert"),
  ).toContainText("Cuaca belum tersedia");
  expect(requests).toBe(1);
  await page.clock.fastForward(11 * 60_000);
  await expect(page.getByText("27,5", { exact: false })).toBeVisible();
  expect(requests).toBe(2);
});

test("stale model time and partial fields are explicit, malformed provider is unavailable", async ({
  page,
}) => {
  await page.route("**/api/v1/weather/current?**", (route) =>
    route.fulfill({
      json: weather({
        model_time: new Date(Date.now() - 60 * 60_000).toISOString(),
        precipitation: null,
      }),
    }),
  );
  await page.goto("/dashboard");
  await page
    .getByRole("button", { name: "Pilih Bogor manual", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("kedaluwarsa");
  await expect(
    page.getByText("Tidak tersedia mm", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(/Total presipitasi selama 15 menit/),
  ).toBeVisible();
  await page.unroute("**/api/v1/weather/current?**");
  await page.route("**/api/v1/weather/current?**", (route) =>
    route.fulfill({ json: { temperature: 0 } }),
  );
  await page.reload();
  await page
    .getByRole("button", { name: "Pilih Bogor manual", exact: true })
    .click();
  await expect(
    page.locator('[aria-labelledby="weather-title"]').getByRole("alert"),
  ).toContainText("Cuaca belum tersedia");
});

test("offline device location reports an actionable state", async ({
  page,
  context,
}) => {
  await page.goto("/dashboard");
  await context.setOffline(true);
  await page
    .getByRole("button", { name: "Gunakan lokasi saya", exact: true })
    .click();
  await expect(
    page.locator('[aria-labelledby="weather-title"]').getByRole("alert"),
  ).toContainText("offline");
  await context.setOffline(false);
});
