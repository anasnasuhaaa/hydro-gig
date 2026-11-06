import { test, expect } from "@playwright/test";
import id from "../messages/id.json";
// Shared trip, reset, invalid storage, export and previous-frame recovery are
// covered by experimental-journey and interactive-demo after unifying the UI.
test("late frame response cannot replace a newer selection", async ({
  page,
}) => {
  await page.goto("/navigation");
  await expect(page.locator("svg[data-frame]")).toHaveAttribute(
    "data-frame",
    "t0",
  );
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let started: () => void = () => {};
  const intercepted = new Promise<void>((resolve) => {
    started = resolve;
  });
  await page.route("**/api/v1/experimental/routes/screen", async (route) => {
    if (route.request().postDataJSON().step !== "t1") return route.continue();
    const response = await route.fetch();
    started();
    await gate;
    await route.fulfill({ response }).catch(() => {});
  });
  await page.getByRole("button", { name: "t1", exact: true }).click();
  await intercepted;
  await page.getByRole("button", { name: "t2", exact: true }).click();
  await expect(page.locator("svg[data-frame]")).toHaveAttribute(
    "data-frame",
    "t2",
  );
  release();
  await expect(page.locator("svg[data-frame]")).toHaveAttribute(
    "data-frame",
    "t2",
  );
});
test("legacy disabled selection is normalized without losing a valid trip", async ({
  page,
}) => {
  await page.goto("/navigation");
  await page.getByRole("button", { name: "t3", exact: true }).click();
  await expect(page.locator("svg[data-frame]")).toHaveAttribute(
    "data-frame",
    "t3",
  );
  await page.evaluate(() => {
    const key = "hydrogig-experimental-v1";
    const value = JSON.parse(sessionStorage.getItem(key)!);
    value.enabled = false;
    sessionStorage.setItem(key, JSON.stringify(value));
  });
  await page.reload();
  await expect(page.locator("svg[data-frame]")).toHaveAttribute(
    "data-frame",
    "t3",
  );
  await expect(
    page.getByRole("button", { name: id.Experimental.enable }),
  ).toHaveCount(0);
});
test("hover previews, selection pins, keyboard clears and disclosures work", async ({
  page,
  isMobile,
}) => {
  await page.goto("/navigation");
  const edge = page.locator('[data-edge-id="E_01_02"]');
  await expect(edge).toBeVisible();
  if (!isMobile) {
    await edge.locator("line").last().hover({ force: true });
    await expect(page.getByRole("tooltip")).toContainText("E_01_02");
    await expect(page.getByTestId("edge-inspector")).toHaveCount(0);
  }
  if (isMobile) await edge.locator("line").last().tap();
  else await edge.locator("line").last().click();
  await page.getByRole("heading", { level: 1 }).hover();
  await expect(page.getByTestId("edge-inspector")).toContainText("E_01_02");
  const clear = page.getByRole("button", {
    name: id.Experimental.clearSelection,
  });
  await clear.focus();
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("edge-inspector")).toHaveCount(0);
  const disclosure = page.getByRole("button", {
    name: id.Experimental.values,
    exact: true,
  });
  await disclosure.focus();
  await page.keyboard.press("Enter");
  await expect(disclosure).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("table")).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(disclosure).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("details")).toHaveCount(0);
});

test("a delayed calculation cannot publish results for edited stops", async ({
  page,
}) => {
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let started: () => void = () => {};
  const pending = new Promise<void>((resolve) => {
    started = resolve;
  });
  await page.route("**/api/v1/experimental/routes/screen", async (route) => {
    const response = await route.fetch();
    started();
    await gate;
    await route.fulfill({ response });
  });
  await page.goto("/pre-order");
  await pending;
  await page.getByLabel(id.Experimental.destination, { exact: true }).click();
  await page.getByRole("option", { name: "N11", exact: true }).click();
  release();
  await expect(
    page.getByText(id.Experimental.pendingEdits, { exact: true }),
  ).toBeVisible();
  await expect(page.locator("svg[data-frame]")).toHaveCount(0);
  await expect(
    page.getByRole("link", {
      name: id.Experimental.continueNavigation,
      exact: true,
    }),
  ).toHaveCount(0);
});

test("blocked reads use in-memory state and reset", async ({ page }) => {
  await page.addInitScript(() =>
    Object.defineProperty(window, "sessionStorage", {
      get() {
        throw new DOMException("Blocked", "SecurityError");
      },
    }),
  );
  await page.goto("/navigation");
  await page.getByRole("button", { name: "t1", exact: true }).click();
  await expect(page.locator("svg[data-frame]")).toHaveAttribute(
    "data-frame",
    "t1",
  );
  await page
    .getByRole("button", { name: id.Experimental.resetTrip, exact: true })
    .click();
  await expect(page.locator("svg[data-frame]")).toHaveAttribute(
    "data-frame",
    "t0",
  );
});
