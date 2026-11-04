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
    const card = page.locator('[data-slot="card"]').filter({
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

test("late frame response cannot replace a newer timeline selection", async ({
  page,
}) => {
  await page.goto("/navigation");
  await expect(
    page.getByRole("heading", {
      name: "Route comparison · Initial condition",
      exact: true,
    }),
  ).toBeVisible();
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let started: () => void = () => {};
  const intercepted = new Promise<void>((resolve) => {
    started = resolve;
  });
  await page.route("**/api/v1/demo/screen", async (route) => {
    if (route.request().postDataJSON().step !== "t1") return route.continue();
    const response = await route.fetch();
    started();
    await gate;
    await route.fulfill({ response }).catch(() => {}); // The abandoned fetch may be aborted.
  });
  await page.getByRole("button", { name: en.Timeline.t1, exact: true }).click();
  await intercepted;
  await expect(
    page.getByRole("region", { name: en.Results.results }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: en.Timeline.t2, exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "Route comparison · 10 minutes later",
      exact: true,
    }),
  ).toBeVisible();
  release();
  await expect(
    page.getByText("Road costs decreased on BC, CD.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Route comparison · 10 minutes later",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: en.Timeline.t2, exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("editing during screening suppresses a late success and trip transfer", async ({
  page,
}) => {
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let complete: () => void = () => {};
  const fulfilled = new Promise<void>((resolve) => {
    complete = resolve;
  });
  await page.route("**/api/v1/demo/screen", async (route) => {
    const response = await route.fetch();
    await gate;
    await route.fulfill({ response });
    complete();
  });
  await page.goto("/pre-order");
  await page
    .getByRole("button", { name: en.Screen.example, exact: true })
    .click();
  await page
    .getByRole("button", { name: en.Screen.screen, exact: true })
    .click();
  await expect(
    page.getByRole("status", { name: en.Demo.loading, exact: true }),
  ).toBeVisible();
  await expect(page.getByText(en.Screen.success, { exact: true })).toHaveCount(
    0,
  );
  await page
    .getByRole("button", { name: en.Screen.changeLocations, exact: true })
    .click();
  await page
    .getByRole("combobox", { name: en.Screen.destination, exact: true })
    .click();
  await page.getByRole("option", { name: /^H ·/ }).click();
  release();
  await fulfilled;
  await expect(
    page.getByRole("region", { name: en.Results.results }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: en.Screen.open, exact: true }),
  ).toHaveCount(0);
  await expect(page.getByText(en.Screen.success, { exact: true })).toHaveCount(
    0,
  );
  expect(
    await page.evaluate(() => sessionStorage.getItem("hydrogig-demo-v1")),
  ).toBeNull();
});

test("previous snapshot failure has a retry without hiding the current route", async ({
  page,
}) => {
  await page.route("**/api/v1/demo/screen", (route) =>
    route.request().postDataJSON().step === "t1"
      ? route.fulfill({ status: 503 })
      : route.continue(),
  );
  await page.goto("/navigation");
  await expect(
    page.getByRole("heading", {
      name: "Route comparison · Initial condition",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: en.Timeline.t2, exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "Route comparison · 10 minutes later",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText(en.Navigation.comparisonUnavailable, { exact: true }),
  ).toBeVisible();
  await page.unroute("**/api/v1/demo/screen");
  await page
    .getByRole("button", { name: en.Navigation.retryComparison, exact: true })
    .click();
  await expect(
    page.getByText("Road costs decreased on BC, CD.", { exact: true }),
  ).toBeVisible();
});

for (const raw of [
  "{broken",
  JSON.stringify({
    routeChoice: "screened",
    request: {
      origin: "missing",
      pickup: "C",
      destination: "F",
      scenario_id: "synthetic-corridors-v1",
      step: "t1",
    },
    screenedTrip: null,
  }),
])
  test(`invalid saved demo selection falls back: ${raw.slice(0, 15)}`, async ({
    page,
  }) => {
    await page.addInitScript(
      (value) => sessionStorage.setItem("hydrogig-demo-v1", value),
      raw,
    );
    const requests: string[] = [];
    page.on("request", (request) => {
      if (request.url().endsWith("/api/v1/demo/screen"))
        requests.push(request.postData()!);
    });
    await page.goto("/navigation");
    await expect(
      page.getByRole("heading", {
        name: "Route comparison · Initial condition",
        exact: true,
      }),
    ).toBeVisible();
    expect(requests.length).toBeGreaterThan(0);
    expect(
      requests.every((request) => JSON.parse(request).origin === "A"),
    ).toBe(true);
  });

test("blocked session storage still allows timeline changes", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(window, "sessionStorage", {
      get() {
        throw new DOMException("Blocked", "SecurityError");
      },
    }),
  );
  await page.goto("/navigation");
  await expect(
    page.getByRole("heading", {
      name: "Route comparison · Initial condition",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: en.Timeline.t1, exact: true }).click();
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
});

test("example follows manifest defaults and comparison fits 320px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.route("**/api/v1/demo/manifest", async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    body.default_trip = { origin: "B", pickup: "C", destination: "H" };
    await route.fulfill({ json: body });
  });
  await page.goto("/pre-order");
  await page
    .getByRole("button", { name: en.Screen.example, exact: true })
    .click();
  const response = page.waitForResponse((r) =>
    r.url().endsWith("/api/v1/demo/screen"),
  );
  await page
    .getByRole("button", { name: en.Screen.screen, exact: true })
    .click();
  expect((await response).request().postDataJSON()).toMatchObject({
    origin: "B",
    pickup: "C",
    destination: "H",
  });
  await expect(
    page.getByRole("region", { name: en.Results.results }),
  ).toBeVisible();
  await expect(page.getByText(en.Results.risk, { exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /safe route|flood.free|low.risk/i }),
  ).toHaveCount(0);
  for (const dark of [false, true]) {
    if (dark)
      await page
        .getByRole("button", { name: en.Theme.toggle, exact: true })
        .click();
    await page.getByText(en.Results.details, { exact: true }).click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.getByText(en.Results.details, { exact: true }).click();
  }
});
