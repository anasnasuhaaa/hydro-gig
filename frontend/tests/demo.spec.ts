import { expect, test, type Page } from "@playwright/test";

async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
}

test.beforeEach(async ({ context, baseURL }) => {
  await context.addCookies([
    { name: "hydrogig_locale", value: "en", url: baseURL! },
  ]);
});

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

// Public route regression cases now exercise the experimental contract.
for (const invalid of [false, true])
  test(`screening failure and recovery (malformed=${invalid})`, async ({
    page,
  }) => {
    await page.route("**/api/v1/experimental/routes/screen", (route) =>
      route.fulfill(
        invalid ? { json: { replay_status: "observed" } } : { status: 503 },
      ),
    );
    await page.goto("/pre-order");
    await expect(
      page.getByRole("alert").filter({
        hasText:
          "Fixture data is unavailable or invalid. Check your connection and retry.",
      }),
    ).toBeVisible();
    await expect(page.locator("svg[data-frame]")).toHaveCount(0);
    await page.unroute("**/api/v1/experimental/routes/screen");
    await page.getByRole("button", { name: "Retry", exact: true }).click();
    await expect(page.locator("svg[data-frame]")).toBeVisible();
  });
test("failed frame removes stale routes", async ({ page }) => {
  await page.goto("/navigation");
  await expect(page.locator("svg[data-frame]")).toHaveAttribute(
    "data-frame",
    "t0",
  );
  await page.route("**/api/v1/experimental/routes/screen", (route) =>
    route.fulfill({ status: 503 }),
  );
  await page.getByRole("button", { name: "t1", exact: true }).click();
  await expect(
    page.getByRole("alert").filter({
      hasText:
        "Fixture data is unavailable or invalid. Check your connection and retry.",
    }),
  ).toBeVisible();
  await expect(page.locator("svg[data-frame]")).toHaveCount(0);
});
test("legacy synthetic backend remains available independently", async ({
  request,
}) => {
  const response = await request.post(
    "http://localhost:8100/api/v1/demo/screen",
    {
      data: {
        origin: "A",
        pickup: "C",
        destination: "F",
        scenario_id: "synthetic-corridors-v1",
        step: "t1",
      },
    },
  );
  expect(response.ok()).toBe(true);
  const body = await response.json();
  expect(body.origin_to_pickup.demonstration_weighted.node_ids).toEqual([
    "A",
    "G",
    "C",
  ]);
});
