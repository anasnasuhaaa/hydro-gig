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

test("timeline keeps internal steps, compares API snapshots and resets", async ({
  page,
}) => {
  await page.goto("/navigation");
  await expect(
    page.getByRole("heading", {
      name: "Route comparison · Initial condition",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: en.Navigation.previous, exact: true }),
  ).toBeDisabled();
  for (const [step, label, first, second] of [
    ["t1", en.Timeline.t1, ["A", "G", "C"], ["C", "E", "F"]],
    ["t2", en.Timeline.t2, ["A", "B", "C"], ["C", "E", "F"]],
  ] as const) {
    const response = page.waitForResponse(
      (r) =>
        r.url().endsWith("/api/v1/demo/screen") &&
        r.request().postDataJSON()?.step === step,
    );
    await page.getByRole("button", { name: label, exact: true }).click();
    const actual = await response;
    expect(actual.status()).toBe(200);
    const body = await actual.json();
    expect(body.request.step).toBe(step);
    expect(body.origin_to_pickup.demonstration_weighted.node_ids).toEqual(
      first,
    );
    expect(body.pickup_to_destination.demonstration_weighted.node_ids).toEqual(
      second,
    );
    const card = page
      .locator('[data-slot="card"]')
      .filter({
        has: page.getByRole("heading", {
          name: en.Results.weighted,
          exact: true,
        }),
      });
    await expect(
      card.getByText(first.join(" → "), { exact: true }),
    ).toBeVisible();
    await expect(
      card.getByText(second.join(" → "), { exact: true }),
    ).toBeVisible();
    if (step === "t1") {
      expect(body.frame.edge_costs.BC).toBe(900);
      expect(body.frame.edge_costs.CD).toBe(900);
      await expect(
        page.getByText("Road costs increased on BC, CD.", { exact: true }),
      ).toBeVisible();
    } else {
      expect(body.frame.edge_costs.DF).toBe(900);
      expect(body.frame.edge_costs.BC).toBe(100);
      expect(body.frame.edge_costs.CD).toBe(100);
      await expect(
        page.getByText("Road costs decreased on BC, CD.", { exact: true }),
      ).toBeVisible();
      await expect(
        page.getByText("Road costs increased on DF.", { exact: true }),
      ).toBeVisible();
    }
  }
  await page.reload();
  await expect(
    page.getByRole("button", { name: en.Timeline.t2, exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("button", { name: en.Navigation.next, exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: en.Navigation.previous, exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Route comparison · 5 minutes later",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: en.Navigation.reset, exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Route comparison · Initial condition",
      exact: true,
    }),
  ).toBeVisible();
  const saved = await page.evaluate(() =>
    JSON.parse(sessionStorage.getItem("hydrogig-demo-v1")!),
  );
  expect(saved.screenedTrip).toBeNull();
  expect(saved.request).toMatchObject({
    origin: "A",
    pickup: "C",
    destination: "F",
    step: "t0",
  });
});

test("custom screened trip survives navigation and refresh", async ({
  page,
}) => {
  await page.goto("/pre-order");
  await page
    .getByRole("button", { name: en.Screen.example, exact: true })
    .click();
  await page
    .getByRole("button", { name: en.Screen.changeLocations, exact: true })
    .click();
  await page
    .getByRole("combobox", { name: en.Screen.origin, exact: true })
    .click();
  await page.getByRole("option", { name: /^B ·/ }).click();
  await page
    .getByRole("button", { name: en.Screen.screen, exact: true })
    .click();
  await page.getByRole("link", { name: en.Screen.open, exact: true }).click();
  await expect(
    page.getByText("Central approach → Pickup hub → Destination", {
      exact: true,
    }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Central approach → Pickup hub → Destination", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Route comparison · Initial condition",
      exact: true,
    }),
  ).toBeVisible();
});
