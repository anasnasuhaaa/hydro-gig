import { test, expect } from "@playwright/test";
const key = "hydrogig-experimental-v1";
test("experimental trip survives navigation, reload and reset", async ({
  page,
}) => {
  await page.goto("/pre-order");
  await page
    .getByRole("button", { name: "Gunakan dataset eksperimental" })
    .click();
  await page.getByRole("button", { name: "t2", exact: true }).click();
  await page
    .getByRole("link", { name: "Lanjut ke navigasi", exact: true })
    .click();
  await expect(page).toHaveURL(/navigation/);
  await expect(
    page.getByRole("button", { name: "t2", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(
    page.getByRole("button", { name: "t2", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("button", { name: "Atur ulang perjalanan eksperimental" })
    .click();
  await expect(
    page.getByRole("button", { name: "t0", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  const saved = await page.evaluate(
    (k) => JSON.parse(sessionStorage.getItem(k)!),
    key,
  );
  expect(saved.route_refs).toEqual([]);
  expect(saved.request.step).toBe("t0");
});
test("invalid and stale experimental selections fall back", async ({
  page,
}) => {
  for (const raw of [
    "{broken",
    JSON.stringify({ network_version: "obsolete" }),
  ]) {
    await page.goto("/pre-order");
    await page.evaluate(({ key, raw }) => sessionStorage.setItem(key, raw), {
      key,
      raw,
    });
    await page.reload();
    await expect(
      page.getByText(
        "Perjalanan tersimpan tidak valid atau berbeda versi fixture. Pilih contoh baru.",
      ),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Gunakan dataset eksperimental" })
      .click();
    await expect(
      page.getByRole("button", { name: "t0", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
  }
});
test("blocked session storage retains trip in memory across pages", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new Error("blocked");
    };
  });
  await page.goto("/pre-order");
  await page
    .getByRole("button", { name: "Gunakan dataset eksperimental" })
    .click();
  await page.getByRole("button", { name: "t4", exact: true }).click();
  await page
    .getByRole("link", { name: "Lanjut ke navigasi", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "t4", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});
