import { test, expect } from "@playwright/test";
const key = "hydrogig-experimental-v1";
test("experimental trip survives navigation, reload and reset", async ({
  page,
}) => {
  await page.goto("/pre-order");

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

  await page.getByRole("button", { name: "t4", exact: true }).click();
  await page
    .getByRole("link", { name: "Lanjut ke navigasi", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "t4", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("complete experimental journey exports matching unsigned evidence", async ({
  page,
}) => {
  await page.goto("/pre-order");

  await page.getByLabel("Penjemputan", { exact: true }).click();
  await page.getByRole("option", { name: "N04", exact: true }).click();
  await page.getByRole("button", { name: "Bandingkan rute" }).click();
  await page
    .getByRole("link", { name: "Lanjut ke navigasi", exact: true })
    .click();
  for (const step of ["t0", "t1", "t2", "t3", "t4"]) {
    await page.getByRole("button", { name: step, exact: true }).click();
    await expect(
      page.getByRole("link", { name: "Lanjut ke pratinjau bukti" }),
    ).toBeVisible();
  }
  await page.getByRole("link", { name: "Lanjut ke pratinjau bukti" }).click();
  await expect(page).toHaveURL(/claims/);
  await expect(
    page.getByText("Asal N01 → penjemputan N04 → tujuan N12"),
  ).toBeVisible();
  await expect(
    page.getByText("Tidak Dikirim ke Platform Mana Pun", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Buat pratinjau bukti" }).click();
  await expect(
    page.getByText("Pratinjau siap ditinjau", { exact: true }),
  ).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Ekspor pratinjau JSON" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe(
    "hydrogig-experimental-evidence.json",
  );
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream!) chunks.push(chunk);
  const data = JSON.parse(Buffer.concat(chunks).toString());
  expect(data.content.calculation.request.pickup).toBe("N04");
  expect(data.content.calculation.frame.step).toBe("t4");
  expect(data.content.token).toBeNull();
  expect(data.content.signature).toBeNull();
  expect(data.content.submission_status).toBe("not_submitted");
  const { createHash } = await import("node:crypto");
  expect(
    createHash("sha256").update(data.canonical_content).digest("hex"),
  ).toBe(data.sha256);
  expect(JSON.parse(data.canonical_content)).toEqual(data.content);
  await page
    .getByRole("button", { name: "Atur ulang demonstrasi", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Ekspor pratinjau JSON" }),
  ).toHaveCount(0);
  await page.getByRole("link", { name: "Kembali ke navigasi" }).click();
  await expect(
    page.getByRole("button", { name: "t0", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("invalid evidence digest cannot be exported", async ({ page }) => {
  await page.goto("/pre-order");

  await page
    .getByRole("link", { name: "Lanjut ke navigasi", exact: true })
    .click();
  await page.getByRole("link", { name: "Lanjut ke pratinjau bukti" }).click();
  await page.route("**/api/v1/experimental/evidence/preview", async (route) => {
    const response = await route.fetch();
    const data = await response.json();
    data.sha256 = "0".repeat(64);
    await route.fulfill({ response, json: data });
  });
  await page.getByRole("button", { name: "Buat pratinjau bukti" }).click();
  await expect(
    page.getByText(
      "Data bukti tidak tersedia atau tidak valid. Kembali ke navigasi dan coba lagi.",
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Ekspor pratinjau JSON" }),
  ).toHaveCount(0);
});
