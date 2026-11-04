import { expect, test, type Page } from "@playwright/test";

async function select(page: Page, label: string, option: string | RegExp) {
  await page.getByRole("combobox", { name: label, exact: true }).click();
  await page
    .getByRole("option", { name: option, exact: typeof option === "string" })
    .click();
}
async function trip(page: Page, origin = "A") {
  await select(page, "Origin", new RegExp(`^${origin} ·`));
  await select(page, "Pickup", /^C ·/);
  await select(page, "Destination", /^F ·/);
}
async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
}

test("sidebar header trigger, icon tooltips, resizing and keyboard controls", async ({
  page,
  isMobile,
}, testInfo) => {
  test.skip(isMobile, "Desktop collapse behavior");
  await page.goto("/dashboard");
  const trigger = page.getByRole("button", { name: "Collapse sidebar" });
  const header = page.locator('[data-slot="sidebar-header"]');
  await expect(
    header.getByRole("button", { name: "Collapse sidebar" }),
  ).toBeVisible();
  const triggerBox = (await trigger.boundingBox())!;
  expect(triggerBox.y).toBeLessThan(100);
  const brandBox = (await page
    .getByRole("link", { name: "HydroGig-Mesh overview" })
    .boundingBox())!;
  expect(brandBox.x + brandBox.width).toBeLessThanOrEqual(triggerBox.x);
  await expect(
    page.locator('[data-slot="sidebar-footer"] [data-slot="sidebar-trigger"]'),
  ).toHaveCount(0);
  const before = (await page
    .locator('[data-slot="sidebar-inset"]')
    .boundingBox())!.x;
  await trigger.click();
  await expect(
    page.locator('[data-slot="sidebar"][data-state="collapsed"]'),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Expand sidebar" }),
  ).toBeVisible();
  const navigation = page.getByRole("navigation", { name: "Main navigation" });
  for (const label of ["Dashboard", "Pre-order", "Navigation", "Claims"])
    await expect(
      navigation.getByRole("link", { name: label, exact: true }),
    ).toBeVisible();
  await navigation
    .getByRole("link", { name: "Pre-order", exact: true })
    .hover();
  await expect(page.getByRole("tooltip")).toHaveText("Pre-order");
  const railBox = (await page
    .locator('[data-slot="sidebar-container"]')
    .boundingBox())!;
  expect(railBox.width).toBe(64);
  const expandBox = (await page
    .getByRole("button", { name: "Expand sidebar" })
    .boundingBox())!;
  expect(expandBox.x).toBeGreaterThanOrEqual(railBox.x);
  expect(expandBox.x + expandBox.width).toBeLessThanOrEqual(
    railBox.x + railBox.width,
  );
  const active = navigation.getByRole("link", {
    name: "Dashboard",
    exact: true,
  });
  await expect(active).toHaveAttribute("aria-current", "page");
  await expect(active).toHaveAttribute("data-active", "true");
  await page.screenshot({
    path: testInfo.outputPath("sidebar-collapsed.png"),
    fullPage: true,
  });
  for (const icon of await navigation.locator("a svg").all()) {
    const box = (await icon.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(railBox.x);
    expect(box.x + box.width).toBeLessThanOrEqual(railBox.x + railBox.width);
  }
  await expect
    .poll(
      async () =>
        (await page.locator('[data-slot="sidebar-inset"]').boundingBox())!.x,
    )
    .toBeLessThan(before);
  await page.getByRole("button", { name: "Expand sidebar" }).focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("button", { name: "Collapse sidebar" }),
  ).toBeVisible();
  await page.keyboard.press("Control+b");
  await expect(
    page.getByRole("button", { name: "Expand sidebar" }),
  ).toBeVisible();
  await noOverflow(page);
});

test("mobile sidebar closes on selection and Escape with focus restored", async ({
  page,
  isMobile,
}, testInfo) => {
  test.skip(!isMobile, "Mobile sheet behavior");
  await page.goto("/pre-order");
  const open = page.getByRole("button", { name: "Open navigation" });
  await open.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(1);
  await page.screenshot({
    path: testInfo.outputPath("mobile-navigation.png"),
    fullPage: true,
  });
  expect(
    await dialog.evaluate((element) =>
      element.contains(document.activeElement),
    ),
  ).toBe(true);
  await dialog.getByRole("button", { name: "Close navigation" }).click();
  await expect(dialog).not.toBeVisible();
  await open.click();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(open).toBeFocused();
  await open.click();
  await dialog.getByRole("link", { name: "Navigation", exact: true }).click();
  await expect(page).toHaveURL(/\/navigation$/);
  await expect(dialog).not.toBeVisible();
  await expect(open).toBeFocused();
});

test("form validates selections and distinct nodes without requesting screening", async ({
  page,
}) => {
  let requests = 0;
  page.on("request", (request) => {
    if (request.url().endsWith("/api/v1/demo/screen")) requests++;
  });
  await page.goto("/pre-order");
  await page.getByRole("button", { name: "Screen route", exact: true }).click();
  await expect(page.locator('#origin[aria-invalid="true"]')).toBeVisible();
  await trip(page);
  await select(page, "Destination", /^C ·/);
  await page.getByRole("button", { name: "Screen route", exact: true }).click();
  await expect(
    page.getByText(
      "Choose three different nodes for origin, pickup and destination.",
    ),
  ).toBeVisible();
  expect(requests).toBe(0);
});

test("real screening, shared trip and frames, schematic warnings and themes", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/pre-order");
  await trip(page);
  await select(page, "Simulation frame", "t1");
  const response = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/v1/demo/screen") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Screen route", exact: true }).click();
  expect((await response).status()).toBe(200);
  await expect(
    page.getByRole("heading", { name: "Route comparison · t1" }),
  ).toBeVisible();
  await expect(
    page.getByText("Segments: AG, GC", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Demo route screening completed.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Scientific risk: unavailable for all segments."),
  ).toBeVisible();
  const details = page.locator("details");
  await expect(details).not.toHaveAttribute("open", "");
  await details.locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect(details).toHaveAttribute("open", "");
  await expect(details.getByText(/Scenario:/)).toBeVisible();
  await details.locator("summary").click();
  await noOverflow(page);
  await page.screenshot({
    path: testInfo.outputPath("pre-order-light.png"),
    fullPage: true,
  });
  await page.getByRole("link", { name: "Open navigation" }).click();
  await expect(
    page.getByRole("button", { name: "t1", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByText("Simulated warning · t1", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: "Synthetic directed road network at t1" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Next frame" }).click();
  await expect(
    page.getByRole("heading", { name: "Route comparison · t2" }),
  ).toBeVisible();
  await expect(
    page.getByText("Affected segments: DF.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Segments: AG, GC", { exact: true }),
  ).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Next frame" })).toBeDisabled();
  await page.getByRole("button", { name: "t0", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Route comparison · t0" }),
  ).toBeVisible();
  await expect(
    page.getByText(/No authored cost changes in t0/).first(),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("navigation-light.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Toggle color theme" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await noOverflow(page);
  await page.screenshot({
    path: testInfo.outputPath("navigation-dark.png"),
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test("unreachable directed journey is explicit", async ({ page }) => {
  await page.goto("/pre-order");
  await trip(page, "H");
  await page.getByRole("button", { name: "Screen route", exact: true }).click();
  await expect(
    page
      .getByText("Route unavailable — no directed path connects these nodes.")
      .first(),
  ).toBeVisible();
});

test("screening failure has no success toast and retry recovers", async ({
  page,
}) => {
  await page.route("**/api/v1/demo/screen", (route) =>
    route.fulfill({ status: 503, body: "unavailable" }),
  );
  await page.goto("/pre-order");
  await trip(page);
  await page.getByRole("button", { name: "Screen route", exact: true }).click();
  await expect(
    page.getByText("Demonstration unavailable", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Demo route screening completed.", { exact: true }),
  ).not.toBeVisible();
  await page.unroute("**/api/v1/demo/screen");
  await page.getByRole("button", { name: "Retry" }).click();
  await expect(
    page.getByRole("heading", { name: "Route comparison · t0" }),
  ).toBeVisible();
  await select(page, "Simulation frame", "t2");
  await expect(
    page.getByRole("region", { name: "Screening results" }),
  ).not.toBeVisible();
});

test("malformed demo responses are rejected", async ({ page }) => {
  await page.route("**/api/v1/demo/screen", (route) =>
    route.fulfill({ json: { experimental: true, provenance: "observed" } }),
  );
  await page.goto("/navigation");
  await expect(
    page.getByText("Demonstration unavailable", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: /Synthetic directed/ }),
  ).not.toBeVisible();
});

test("failed frame switch removes stale route results", async ({ page }) => {
  await page.goto("/navigation");
  await expect(
    page.getByRole("heading", { name: "Route comparison · t0" }),
  ).toBeVisible();
  await page.route("**/api/v1/demo/screen", (route) =>
    route.fulfill({ status: 503 }),
  );
  await page.getByRole("button", { name: "t1", exact: true }).click();
  await expect(
    page.getByText("Demonstration unavailable", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Route comparison · t0" }),
  ).not.toBeVisible();
  await expect(
    page.getByRole("img", { name: /Synthetic directed/ }),
  ).not.toBeVisible();
});
