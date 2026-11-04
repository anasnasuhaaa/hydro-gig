import { expect, test } from "@playwright/test";
import en from "../messages/en.json";
import id from "../messages/id.json";
for (const locale of ["id", "en"] as const)
  test(`guide and navigation paths in ${locale}`, async ({
    page,
    context,
    baseURL,
    isMobile,
  }, testInfo) => {
    const m = locale === "id" ? id : en;
    await context.addCookies([
      { name: "hydrogig_locale", value: locale, url: baseURL! },
    ]);
    await page.goto("/guide");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      m.Guide.title,
    );
    await expect(page.getByRole("heading", { level: 2 })).toHaveCount(4);
    await expect(
      page.getByRole("list", { name: m.Guide.flow }).getByRole("listitem"),
    ).toHaveCount(3);
    await expect(
      page.getByText(m.Guide.weather, { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText(m.Guide.planned, { exact: true }),
    ).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath(`guide-${locale}.png`),
      fullPage: true,
    });
    await page.getByRole("link", { name: m.Guide.try, exact: true }).click();
    await expect(page).toHaveURL(/\/pre-order$/);
    await page.getByRole("link", { name: m.Guide.help, exact: true }).click();
    await page.getByRole("link", { name: m.Guide.open, exact: true }).click();
    await expect(page).toHaveURL(/\/navigation$/);
    await page.getByRole("link", { name: m.Guide.help, exact: true }).click();
    const nav = page.getByRole("navigation", {
      name: isMobile ? m.Shell.quick : m.Shell.main,
      exact: true,
    });
    for (const [name, path] of [
      [m.Shell.dashboard, "dashboard"],
      [m.Shell.preOrder, "pre-order"],
      [m.Shell.navigation, "navigation"],
      [m.Shell.guide, "guide"],
    ]) {
      await nav.getByRole("link", { name, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`/${path}$`));
    }
  });
