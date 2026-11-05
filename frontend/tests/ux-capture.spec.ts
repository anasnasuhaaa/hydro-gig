import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
test("capture research demonstration", async ({ page }, info) => {
  const phase = process.env.UX_CAPTURE;
  const directory = phase
    ? `../docs/screenshots/interactive-demo/${phase}`
    : info.outputPath("screenshots");
  await mkdir(directory, { recursive: true });
  await page.setViewportSize({
    width: info.project.name === "mobile" ? 375 : 1440,
    height: 1000,
  });
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({
    path: `${directory}/${info.project.name}-dashboard.png`,
    fullPage: true,
  });
  await page.goto("/pre-order");
  await page
    .getByRole("button", { name: "Gunakan dataset eksperimental", exact: true })
    .click();
  await expect(
    page.getByRole("img", { name: /Pratinjau koordinat/ }),
  ).toBeVisible();
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({
    path: `${directory}/${info.project.name}-screening.png`,
    fullPage: true,
  });
  await page
    .getByRole("link", { name: "Lanjut ke navigasi", exact: true })
    .click();
  await page.getByRole("button", { name: "t1", exact: true }).click();
  await expect(
    page.getByText("Rute berbobot berubah dari bingkai sebelumnya.", {
      exact: true,
    }),
  ).toBeVisible();
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({
    path: `${directory}/${info.project.name}-navigation.png`,
    fullPage: true,
  });
  await page
    .getByRole("link", { name: "Lanjut ke pratinjau bukti", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Buat pratinjau bukti", exact: true })
    .click();
  await expect(
    page.getByText("Pratinjau siap ditinjau", { exact: true }),
  ).toBeVisible();
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({
    path: `${directory}/${info.project.name}-evidence.png`,
    fullPage: true,
  });
});
