import { expect, test } from "@playwright/test";
import en from "../messages/en.json";
import id from "../messages/id.json";

for (const locale of ["id", "en"] as const)
  test(`responsive screens, themes and focus in ${locale}`, async ({
    page,
    context,
    isMobile,
  }, testInfo) => {
    test.setTimeout(120_000);
    const m = locale === "id" ? id : en;
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (
        message.type() === "error" &&
        /hydrat|MISSING_MESSAGE|INVALID_MESSAGE/.test(message.text())
      )
        errors.push(message.text());
    });
    await context.addCookies([
      {
        name: "hydrogig_locale",
        value: locale,
        url: testInfo.project.use.baseURL ?? "http://localhost:3100",
      },
    ]);
    for (const width of isMobile ? [320, 375] : [1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/dashboard");
      for (const theme of ["light", "dark"]) {
        const dark = await page
          .locator("html")
          .evaluate((element) => element.classList.contains("dark"));
        if (dark !== (theme === "dark"))
          await page
            .getByRole("button", { name: m.Theme.toggle, exact: true })
            .click();
        for (const path of [
          "dashboard",
          "pre-order",
          "navigation",
          "claims",
          "guide",
        ]) {
          await page.goto(`/${path}`);
          await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
          await expect(page.locator("html")).toHaveAttribute("lang", locale);
          if (path === "navigation")
            await expect(
              page.getByRole("img", {
                name: /Pratinjau koordinat|coordinate preview/,
              }),
            ).toBeVisible();
          expect(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
          ).toBe(true);
          if (width < 768) {
            const nav = page.getByRole("navigation", {
              name: m.Shell.quick,
              exact: true,
            });
            await expect(nav).toBeVisible();
            const links = await nav.getByRole("link").all();
            for (const link of links)
              expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(
                44,
              );
            await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
            const footer = (await page
              .getByRole("link", { name: m.Shell.status, exact: true })
              .boundingBox())!;
            const bottom = (await nav.boundingBox())!;
            expect(footer.y + footer.height).toBeLessThanOrEqual(bottom.y);
          }
          if (
            (width === 375 || width === 1280) &&
            ["dashboard", "navigation", "claims"].includes(path)
          )
            await page.screenshot({
              path: testInfo.outputPath(
                `${path}-${locale}-${theme}-${width}.png`,
              ),
              fullPage: true,
            });
        }
      }
    }
    expect(errors).toEqual([]);
  });

test("sidebar cookie restores collapsed state and keyboard focus remains visible", async ({
  page,
  context,
  baseURL,
  isMobile,
}) => {
  test.skip(isMobile, "Desktop cookie state");
  await context.addCookies([
    { name: "hydrogig_locale", value: "en", url: baseURL! },
  ]);
  await page.goto("/dashboard");
  await page
    .getByRole("button", { name: "Collapse sidebar", exact: true })
    .click();
  await page.reload();
  const trigger = page.getByRole("button", {
    name: "Expand sidebar",
    exact: true,
  });
  await expect(trigger).toBeVisible();
  await trigger.focus();
  expect(
    await trigger.evaluate((element) => element.matches(":focus-visible")),
  ).toBe(true);
  await expect(trigger).not.toHaveCSS("box-shadow", "none");
});
