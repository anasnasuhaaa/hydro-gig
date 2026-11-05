import { test, expect } from "@playwright/test";

test("network layers and keyboard segment inspection use returned values", async ({
  page,
}) => {
  await page.goto("/pre-order");
  const response = page.waitForResponse(
    (r) =>
      r.url().includes("/experimental/routes/screen") &&
      r.request().postDataJSON().step === "t0",
  );
  await page
    .getByRole("button", { name: "Gunakan dataset eksperimental", exact: true })
    .click();
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
    name: "Periksa ruas",
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
  await svg
    .locator(`[data-edge-id="${another}"] line`)
    .last()
    .click({ force: true });
  await expect(inspector).toContainText(another);
});
