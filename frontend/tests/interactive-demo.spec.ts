import { test, expect } from "@playwright/test";

test("network layers and keyboard segment inspection use returned values", async ({
  page,
}) => {
  const response = page.waitForResponse(
    (r) =>
      r.url().includes("/experimental/routes/screen") &&
      r.request().postDataJSON().step === "t0",
  );

  await page.goto("/pre-order");
  const data = await (await response).json();
  const svg = page.getByRole("img", { name: /Pratinjau koordinat/ });
  await expect(svg).toHaveAttribute("data-selected-route", "weighted");
  const weighted = [
    ...new Set([
      ...data.origin_to_pickup.weighted.edge_ids,
      ...data.pickup_to_destination.weighted.edge_ids,
    ]),
  ];
  await expect(svg.locator('[data-on-route="true"]')).toHaveCount(
    weighted.length,
  );
  await page.getByRole("button", { name: "Acuan jarak", exact: true }).click();
  await expect(svg).toHaveAttribute("data-selected-route", "baseline");
  const baseline = [
    ...new Set([
      ...data.origin_to_pickup.baseline.edge_ids,
      ...data.pickup_to_destination.baseline.edge_ids,
    ]),
  ];
  await expect(svg.locator('[data-on-route="true"]')).toHaveCount(
    baseline.length,
  );
  const edge = Object.keys(data.frame.samples).at(-1)!;
  const select = page.getByRole("combobox", {
    name: "Lihat detail ruas",
    exact: true,
  });
  await select.focus();
  await page.keyboard.press("Enter");
  await page.getByRole("option", { name: new RegExp(`^${edge}`) }).click();
  const inspector = page.getByTestId("edge-inspector");
  await expect(inspector).toContainText(edge);
  await expect(svg.locator(`[data-edge-id="${edge}"]`)).toHaveAttribute(
    "data-inspected",
    "true",
  );
  const expected = new Intl.NumberFormat("id", {
    maximumFractionDigits: 3,
  }).format(data.frame.samples[edge].weight);
  await expect(inspector).toContainText(expected);
  const another = Object.keys(data.frame.samples)[0];
  await svg.locator(`[data-edge-id="${another}"] line`).last().click();
  await expect(inspector).toContainText(another);
});

test("five-frame timeline reports actual changed and unchanged paths and costs", async ({
  page,
}) => {
  await page.goto("/navigation");

  const svg = page.getByRole("img", { name: /Pratinjau koordinat/ });
  await expect(svg).toHaveAttribute("data-frame", "t0");
  const initial = await page.request.post(
    "http://localhost:8100/api/v1/experimental/routes/screen",
    {
      data: {
        origin: "N01",
        pickup: "N03",
        destination: "N12",
        scenario_id: "small-inundation-v1",
        step: "t0",
      },
    },
  );
  let previous = await initial.json();
  for (const step of ["t1", "t2", "t3", "t4"]) {
    const response = page.waitForResponse(
      (r) =>
        r.url().includes("/experimental/routes/screen") &&
        r.request().postDataJSON().step === step,
    );
    await page.getByRole("button", { name: step, exact: true }).click();
    const data = await (await response).json();
    await expect(svg).toHaveAttribute("data-frame", step);
    const paths = (r: typeof data) =>
      JSON.stringify([
        r.origin_to_pickup.weighted.edge_ids,
        r.pickup_to_destination.weighted.edge_ids,
      ]);
    const changed = paths(data) !== paths(previous);
    expect(changed).toBe(step === "t1");
    await expect(
      page.getByText(
        changed
          ? "Rute berbobot berubah dari bingkai sebelumnya."
          : "Rute tetap sama; nilai skenario berubah.",
        { exact: true },
      ),
    ).toBeVisible();
    await expect(page.getByTestId("changed-count")).toHaveText(
      String(data.frame.changed_edge_ids.length),
    );
    await expect(svg.locator('[data-changed="true"]')).toHaveCount(
      data.frame.changed_edge_ids.length,
    );
    const cost = (r: typeof data) =>
      r.origin_to_pickup.weighted.objective_cost +
      r.pickup_to_destination.weighted.objective_cost;
    const delta = cost(data) - cost(previous);
    await expect(page.getByTestId("cost-delta")).toHaveText(
      new Intl.NumberFormat("id", { maximumFractionDigits: 3 }).format(delta),
    );
    const timestamp = new Intl.DateTimeFormat("id", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Jakarta",
    }).format(new Date(data.frame.timestamp));
    await expect(page.getByTestId("scenario-time")).toContainText(timestamp);
    previous = data;
  }
  await expect(
    page.getByRole("button", { name: "Bingkai berikutnya", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Bingkai sebelumnya", exact: true })
    .click();
  await expect(svg).toHaveAttribute("data-frame", "t3");
  await page.getByRole("button", { name: "t0", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Bingkai sebelumnya", exact: true }),
  ).toBeDisabled();
});

test("explicit simulation playback stops at the last frame", async ({
  page,
}) => {
  await page.goto("/navigation");

  const svg = page.getByRole("img", { name: /Pratinjau koordinat/ });
  await expect(svg).toHaveAttribute("data-frame", "t0");
  await expect(
    page.getByText("Kecepatan simulasi: 2 detik per bingkai", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Putar simulasi", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Jeda simulasi", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(svg).toHaveAttribute("data-frame", "t4", { timeout: 15000 });
  await expect(
    page.getByRole("button", { name: "Putar simulasi", exact: true }),
  ).toBeDisabled();
});

test("dashboard discovers the dataset and the three-stage journey includes evidence", async ({
  page,
  isMobile,
}) => {
  await page.goto("/dashboard");
  await page
    .getByRole("link", {
      name: "Mulai periksa rute",
      exact: true,
    })
    .click();
  await expect(page).toHaveURL(/pre-order$/);
  await expect(
    page.getByRole("button", { name: "Gunakan dataset eksperimental" }),
  ).toHaveCount(0);
  const journey = page.getByRole("navigation", {
    name: "Tiga tahap perjalanan",
    exact: true,
  });
  await expect(
    journey.getByRole("link", { name: "Langkah 1 dari 3: Periksa rute" }),
  ).toHaveAttribute("aria-current", "step");
  await page
    .getByRole("link", { name: "Lanjut ke navigasi", exact: true })
    .click();
  await expect(
    journey.getByRole("link", { name: "Langkah 2 dari 3: Jelajahi skenario" }),
  ).toHaveAttribute("aria-current", "step");
  if (isMobile) {
    await page
      .getByRole("navigation", { name: "Navigasi cepat", exact: true })
      .getByRole("link", { name: "Klaim", exact: true })
      .click();
  } else {
    await page
      .getByRole("link", { name: "Lanjut ke pratinjau bukti", exact: true })
      .click();
  }
  await expect(page).toHaveURL(/claims$/);
  await expect(
    journey.getByRole("link", { name: "Langkah 3 dari 3: Tinjau bukti" }),
  ).toHaveAttribute("aria-current", "step");
  await expect(
    page.getByText("Data Sumber Belum Terverifikasi", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Bukti tanpa tanda tangan",
      exact: true,
    }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Asal N01 → penjemputan N03 → tujuan N12", { exact: true }),
  ).toBeVisible();
});

test("unapplied stop changes cannot carry stale routes into the journey", async ({
  page,
}) => {
  await page.goto("/pre-order");

  await expect(
    page.getByRole("img", { name: /Pratinjau koordinat/ }),
  ).toBeVisible();
  await page.getByLabel("Penjemputan", { exact: true }).click();
  await page.getByRole("option", { name: "N04", exact: true }).click();
  await expect(page.getByText(/Titik perjalanan telah diubah/)).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Lanjut ke navigasi", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("img", { name: /Pratinjau koordinat/ }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "t1", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Bandingkan rute", exact: true })
    .click();
  await page
    .getByRole("link", { name: "Lanjut ke navigasi", exact: true })
    .click();
  await expect(
    page.getByText("N01 → N04 → N12", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Atur ulang perjalanan eksperimental",
      exact: true,
    })
    .click();
  await expect(
    page.getByText("N01 → N03 → N12", { exact: true }),
  ).toBeVisible();
});

test("previous frame failure never implies an unchanged path or a zero cost change", async ({
  page,
}) => {
  await page.goto("/navigation");

  await page.getByRole("button", { name: "t1", exact: true }).click();
  await expect(
    page.getByRole("img", { name: /Pratinjau koordinat/ }),
  ).toHaveAttribute("data-frame", "t1");
  await page.route("**/api/v1/experimental/routes/screen", (route) =>
    route.request().postDataJSON().step === "t0"
      ? route.fulfill({ status: 503, body: "{}" })
      : route.continue(),
  );
  await page.reload();
  await expect(
    page.getByText("Perbandingan bingkai sebelumnya tidak tersedia.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByTestId("cost-delta")).toHaveText("Tidak tersedia");
  await expect(
    page.getByRole("img", { name: /Pratinjau koordinat/ }),
  ).toHaveAttribute("data-frame", "t1");
  await page.unroute("**/api/v1/experimental/routes/screen");
  await page
    .getByRole("button", { name: "Coba lagi perbandingan", exact: true })
    .click();
  await expect(
    page.getByText("Rute berbobot berubah dari bingkai sebelumnya.", {
      exact: true,
    }),
  ).toBeVisible();
});
