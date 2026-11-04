import { expect, test } from "@playwright/test";
import en from "../messages/en.json";

test.beforeEach(async ({ context, baseURL }) => {
  await context.addCookies([
    { name: "hydrogig_locale", value: "en", url: baseURL! },
  ]);
});

test("dashboard leads to the first driver step", async ({ page }) => {
  await page.goto("/dashboard");
  await page
    .getByRole("link", { name: en.Dashboard.screen, exact: true })
    .click();
  await expect(page).toHaveURL(/\/pre-order$/);
  await expect(page.getByText("Step 1 of 2", { exact: false })).toBeVisible();
  await expect(
    page.getByRole("link", { name: en.Guide.help, exact: true }),
  ).toBeVisible();
});

test("example trip uses the manifest and real API, then edits invalidate results", async ({
  page,
}) => {
  await page.goto("/pre-order");
  await expect(page.getByRole("combobox")).toHaveCount(0);
  await page
    .getByRole("button", { name: en.Screen.example, exact: true })
    .click();
  const response = page.waitForResponse(
    (r) =>
      r.url().endsWith("/api/v1/demo/screen") &&
      r.request().method() === "POST",
  );
  await page
    .getByRole("button", { name: en.Screen.screen, exact: true })
    .click();
  const actual = await response;
  expect(actual.status()).toBe(200);
  expect(actual.request().postDataJSON()).toEqual({
    origin: "A",
    pickup: "C",
    destination: "F",
    scenario_id: "synthetic-corridors-v1",
    step: "t0",
  });
  await expect(
    page.getByRole("heading", { name: en.Results.baseline, exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: en.Results.weighted, exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: en.Screen.changeLocations, exact: true })
    .click();
  await expect(
    page.getByRole("combobox", { name: en.Screen.origin, exact: true }),
  ).toContainText("A ·");
  await page
    .getByRole("combobox", { name: en.Screen.destination, exact: true })
    .click();
  await page.getByRole("option", { name: /^H ·/ }).click();
  await expect(
    page.getByRole("region", { name: en.Results.results }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: en.Screen.open, exact: true }),
  ).toHaveCount(0);
});
