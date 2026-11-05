import { test, expect } from "@playwright/test";
import en from "../messages/en.json";
import id from "../messages/id.json";

for (const locale of ["id", "en"] as const)
  test(`experimental journey fits phones, tablet and desktop in ${locale}`, async ({
    page,
    context,
    baseURL,
    isMobile,
  }, info) => {
    test.setTimeout(90000);
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
      { name: "hydrogig_locale", value: locale, url: baseURL! },
    ]);
    for (const width of isMobile ? [320, 375] : [768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/dashboard");
      await page
        .getByRole("link", { name: m.Dashboard.explore, exact: true })
        .click();
      for (const theme of ["light", "dark"]) {
        const dark = await page
          .locator("html")
          .evaluate((el) => el.classList.contains("dark"));
        if (dark !== (theme === "dark"))
          await page
            .getByRole("button", { name: m.Theme.toggle, exact: true })
            .click();
        for (const path of ["pre-order", "navigation", "claims"]) {
          await page.goto(`/${path}`);
          await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
          if (path !== "claims") {
            await expect(
              page.getByRole("img", { name: m.Experimental.preview }),
            ).toBeVisible();
            if (path === "navigation") {
              await page
                .getByRole("button", { name: "t2", exact: true })
                .click();
              await expect(
                page.getByText(m.Experimental.unchanged, { exact: true }),
              ).toBeVisible();
            }
          } else {
            await expect(
              page.getByText(m.Evidence.unverified, { exact: true }),
            ).toBeVisible();
          }
          expect(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
          ).toBe(true);
          const journey = page.getByRole("navigation", {
            name: m.Journey.label,
            exact: true,
          });
          await expect(journey.getByRole("link")).toHaveCount(3);
          for (const link of await journey.getByRole("link").all())
            expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(
              44,
            );
          await page.evaluate(() => scrollTo(0, 0));
          await page.screenshot({
            path: info.outputPath(`${path}-${locale}-${theme}-${width}.png`),
            fullPage: true,
          });
        }
      }
    }
    expect(errors).toEqual([]);
  });
