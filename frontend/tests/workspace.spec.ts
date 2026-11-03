import { expect, test } from "@playwright/test";

test("routes, navigation, and responsive workspace", async ({
  page,
  isMobile,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Every journey",
  );
  await expect(page.getByText("Connected", { exact: true })).toBeVisible();
  await expect(page.getByText("Not configured", { exact: true })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("dashboard-light.png"),
    fullPage: true,
  });
  if (isMobile) {
    await page.getByRole("button", { name: "Open navigation" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page
      .getByRole("dialog")
      .getByRole("link", { name: "Pre-order screening" })
      .click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
  } else {
    await page.getByRole("button", { name: "Collapse sidebar" }).click();
    await page
      .getByRole("link", { name: "Pre-order screening", exact: true })
      .click();
    await page.getByRole("button", { name: "Expand sidebar" }).click();
  }
  for (const route of [
    {
      path: "/pre-order",
      heading: "Know the route before the ride.",
      action: "Screen a route",
    },
    {
      path: "/navigation",
      heading: "A clearer view of the road ahead.",
      action: "Start navigation",
    },
    {
      path: "/claims",
      heading: "Keep the context. Protect your journey.",
      action: "Create evidence token",
    },
  ]) {
    const response = await page.goto(route.path);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      route.heading,
    );
    await expect(
      page.getByRole("button", { name: route.action }),
    ).toBeDisabled();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  expect(errors).toEqual([]);
});

test("theme persists and status refresh reports a completed check", async ({
  page,
}, testInfo) => {
  await page.goto("/dashboard");
  await expect(page.getByText("Connected", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Toggle color theme" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.screenshot({
    path: testInfo.outputPath("dashboard-dark.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Refresh system status" }).click();
  await expect(
    page.getByText("System connectivity checked.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Toggle color theme" }).click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
});

test("API errors recover after a successful response", async ({ page }) => {
  await page.route("**/api/v1/system/status", (route) =>
    route.fulfill({ status: 503, body: "unavailable" }),
  );
  await page.goto("/dashboard");
  await expect(
    page.getByText("Backend connection unavailable", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Unknown", { exact: true })).toBeVisible();
  await expect(page.getByText("Connected", { exact: true })).not.toBeVisible();
  await page.unroute("**/api/v1/system/status");
  await page.getByRole("button", { name: "Refresh system status" }).click();
  await expect(page.getByText("Connected", { exact: true })).toBeVisible();
});

test("malformed API data never appears as connected", async ({ page }) => {
  await page.route("**/api/v1/system/status", (route) =>
    route.fulfill({ json: { application: "operational" } }),
  );
  await page.goto("/dashboard");
  await expect(
    page.getByText("Backend connection unavailable", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Connected", { exact: true })).not.toBeVisible();
});
