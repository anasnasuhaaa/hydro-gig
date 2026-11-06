import { test, expect } from "@playwright/test";

test("opt-in fixture routes and five frames use the backend", async ({
  page,
}) => {
  await page.goto("/pre-order");

  await expect(
    page.getByText("Simulasi / Dataset Belum Terverifikasi", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: /Pratinjau koordinat/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "Rute berbobot eksperimental",
      exact: true,
    }),
  ).toHaveAttribute("aria-pressed", "true");
  const response = page.waitForResponse(
    (r) =>
      r.url().includes("experimental/routes/screen") &&
      r.request().postDataJSON().step === "t4",
  );
  await page.getByRole("button", { name: "t4", exact: true }).click();
  const data = await (await response).json();
  expect(data.frame.step).toBe("t4");
  expect(Object.keys(data.frame.samples)).toHaveLength(20);
  await expect(
    page.getByRole("button", { name: "t4", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByText("Nilai bingkai dan perubahan belum terverifikasi", {
      exact: true,
    })
    .click();
  await expect(page.getByRole("table")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Kembali ke demo sintetis" }),
  ).toHaveCount(0);
});

test("navigation fixture failure is explicit", async ({ page }) => {
  await page.route("**/api/v1/experimental/**", (route) =>
    route.fulfill({ status: 503, body: "{}" }),
  );
  await page.goto("/navigation");

  await expect(
    page
      .getByRole("region", {
        name: "Pemutaran fixture eksperimental",
        exact: true,
      })
      .getByRole("alert"),
  ).toContainText("Data fixture tidak tersedia");
});

test("fixture validates responses and explains directed unreachable trips", async ({
  page,
}) => {
  await page.goto("/navigation");

  await expect(
    page.getByRole("img", { name: /Pratinjau koordinat/ }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Ubah perjalanan", exact: true })
    .first()
    .click();
  await page.getByLabel("Asal", { exact: true }).click();
  await page.getByRole("option", { name: "N12", exact: true }).click();
  await page.getByRole("button", { name: "Bandingkan rute" }).click();
  await page
    .getByRole("button", { name: "Urutan titik rute", exact: true })
    .first()
    .click();
  await expect(
    page
      .getByText(
        "Tidak terjangkau dalam jaringan berarah ini. Pilih titik lain.",
      )
      .first(),
  ).toBeVisible();
  await page.route("**/api/v1/experimental/routes/screen", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ replay_status: "observed" }),
    }),
  );
  await page.getByRole("button", { name: "t3", exact: true }).click();
  await expect(
    page
      .getByRole("region", {
        name: "Pemutaran fixture eksperimental",
        exact: true,
      })
      .getByRole("alert"),
  ).toContainText("Data fixture tidak tersedia");
});
