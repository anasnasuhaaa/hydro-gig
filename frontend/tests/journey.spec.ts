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
