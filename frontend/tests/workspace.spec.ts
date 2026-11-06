import { expect, test } from "@playwright/test";
import en from "../messages/en.json";

test.beforeEach(async ({ context, baseURL }) => {
  await context.addCookies([
    { name: "hydrogig_locale", value: "en", url: baseURL! },
  ]);
});

test("routes, navigation, and responsive workspace", async ({
  page,
  isMobile,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.getByText("Technical diagnostics", { exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Navigate with flood awareness.",
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
      .getByRole("link", { name: "Pre-order" })
      .click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
  } else {
    await page.getByRole("button", { name: "Collapse sidebar" }).click();
    await page.getByRole("link", { name: "Pre-order", exact: true }).click();
    await page.getByRole("button", { name: "Expand sidebar" }).click();
  }
  for (const route of [
    {
      path: "/pre-order",
      heading: "Plan a sample trip.",
      action: "Compare routes",
    },
    {
      path: "/navigation",
      heading: "See the scenario change.",
      action: "Next frame",
    },
    {
      path: "/claims",
      heading: "Experimental Evidence Preview",
      action: "Create evidence token",
    },
  ]) {
    const response = await page.goto(route.path);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      route.heading,
    );
    await expect(
      page.getByText(
        route.path === "/claims" ? en.Evidence.label : en.Experimental.label,
        { exact: true },
      ),
    ).toBeVisible();
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
  await page.getByText("Technical diagnostics", { exact: true }).click();
  await expect(page.getByText("Connected", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Toggle color theme" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.reload();
  await page.getByText("Technical diagnostics", { exact: true }).click();
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
  await page.getByText("Technical diagnostics", { exact: true }).click();
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
  await page.getByText("Technical diagnostics", { exact: true }).click();
  await expect(
    page.getByText("Backend connection unavailable", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Connected", { exact: true })).not.toBeVisible();
});

test("compact screens remain usable at 320px in both themes", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const theme of ["light", "dark"]) {
    await page.goto("/dashboard");
    await page.getByText("Technical diagnostics", { exact: true }).click();
    if (theme === "dark")
      await page.getByRole("button", { name: "Toggle color theme" }).click();
    for (const path of ["/dashboard", "/pre-order", "/navigation", "/claims"]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      if (path === "/navigation") {
        await expect(
          page.getByRole("img", { name: /coordinate preview/ }),
        ).toBeVisible();
        await expect(
          page.getByText("Directed network schematic · No verified road map"),
        ).toBeVisible();
      }
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
      await expect(
        page.getByRole("button", { name: "Open navigation" }),
      ).toHaveCount(1);
    }
  }
});

test("demo loading is explicit before real results arrive", async ({
  page,
}) => {
  let release: () => void = () => {};
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/v1/experimental/network", async (route) => {
    await pending;
    await route.continue();
  });
  await page.goto("/pre-order");
  await expect(
    page.getByText("Loading simulation…", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Compare routes", exact: true }),
  ).not.toBeVisible();
  release();
  await expect(
    page.getByRole("button", { name: "Compare routes", exact: true }),
  ).toBeEnabled();
});
