import { test, expect } from "@playwright/test";
import { inspectSegment } from "./network-helpers";
import {
  networkGeometry,
  orderedJourney,
  stopLabels,
} from "../src/components/experimental/network-geometry";
import {
  networkSchema,
  resultSchema,
  type FixtureResult,
} from "../src/lib/api/experimental";
import en from "../messages/en.json";
import id from "../messages/id.json";
import { mkdir } from "node:fs/promises";

const legs = ["origin_to_pickup", "pickup_to_destination"] as const;

test("ordered legs, stop identity and route selection agree with every API frame", async ({
  page,
}) => {
  await page.goto("/pre-order");
  // A non-default trip prevents assumptions about N01/N03/N12 entering rendering.
  await page.getByLabel(id.Experimental.pickup, { exact: true }).click();
  await page.getByRole("option", { name: "N04", exact: true }).click();
  const first = page.waitForResponse(
    (r) =>
      r.url().includes("/experimental/routes/screen") &&
      r.request().postDataJSON().pickup === "N04",
  );
  await page
    .getByRole("button", { name: id.Experimental.screen, exact: true })
    .click();
  let result: FixtureResult = await (await first).json();
  const svg = page.locator("svg[data-frame]");
  for (const step of ["t0", "t1", "t2", "t3", "t4"]) {
    if (step !== "t0") {
      const response = page.waitForResponse(
        (r) =>
          r.url().includes("/experimental/routes/screen") &&
          r.request().postDataJSON().step === step,
      );
      await page.getByRole("button", { name: step, exact: true }).click();
      result = await (await response).json();
    }
    await expect(svg).toHaveAttribute("data-frame", step);
    for (const role of ["origin", "pickup", "destination"] as const) {
      await expect(svg.locator(`[data-stop-role="${role}"]`)).toHaveAttribute(
        "data-node-id",
        result.request[role],
      );
      await expect(page.locator(`[data-stop-summary="${role}"]`)).toContainText(
        result.request[role],
      );
    }
    expect(
      new Set(
        await svg
          .locator("[data-stop-role] > svg")
          .evaluateAll((icons) => icons.map((icon) => icon.innerHTML)),
      ).size,
    ).toBe(3);
    for (const mode of ["baseline", "weighted"] as const) {
      let recalculations = 0;
      const count = (request: import("@playwright/test").Request) => {
        if (request.url().includes("/routes/screen")) recalculations++;
      };
      page.on("request", count);
      await page
        .getByRole("button", { name: id.Experimental[mode], exact: true })
        .click();
      await expect(svg).toHaveAttribute("data-selected-route", mode);
      await expect(page.locator(`[data-route="${mode}"]`)).toHaveAttribute(
        "data-selected",
        "true",
      );
      const ordered = [
        ...new Set(legs.flatMap((leg) => result[leg][mode].edge_ids)),
      ];
      expect(
        await svg
          .locator('[data-on-route="true"]')
          .evaluateAll((edges) =>
            edges.map((edge) => edge.getAttribute("data-edge-id")),
          ),
      ).toEqual(ordered);
      for (const leg of legs) {
        expect(
          await svg
            .locator(`[data-legs~="${leg}"]`)
            .evaluateAll((edges) =>
              edges.map((edge) => edge.getAttribute("data-edge-id")),
            ),
        ).toEqual([...new Set(result[leg][mode].edge_ids)]);
      }
      const alternative = mode === "baseline" ? "weighted" : "baseline";
      const alternateOnly = new Set(
        legs
          .flatMap((leg) => result[leg][alternative].edge_ids)
          .filter((edge) => !ordered.includes(edge)),
      );
      await expect(svg.locator('[data-alternative="true"]')).toHaveCount(
        alternateOnly.size,
      );
      for (const edge of await svg
        .locator('[data-alternative="true"] [data-edge-stroke]')
        .all())
        await expect(edge).toHaveAttribute("stroke-dasharray", "6 6");
      for (const edge of await svg.locator('[data-shared="true"]').all())
        await expect(edge.locator("[data-edge-stroke]")).toHaveCount(1);
      expect(recalculations).toBe(0);
      page.off("request", count);
    }
  }
});

test("reciprocal strokes are independently selectable and hover remains inside canvas", async ({
  page,
  isMobile,
}) => {
  await page.goto("/navigation");
  await expect(page.locator("svg[data-frame]")).toBeVisible();
  const forward = page.locator('[data-edge-id="E_01_02"] [data-edge-stroke]');
  const reverse = page.locator('[data-edge-id="E_02_01"] [data-edge-stroke]');
  expect(await forward.getAttribute("d")).not.toBe(
    await reverse.getAttribute("d"),
  );
  for (const edge of ["E_02_01", "E_01_02"]) {
    if (!isMobile) {
      await inspectSegment(page, edge, "hover");
      const preview = page.getByRole("tooltip");
      await expect(preview).toContainText(edge);
      const box = (await preview.boundingBox())!;
      const canvas = (await page.locator(".network-surface").boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(canvas.x);
      expect(box.y).toBeGreaterThanOrEqual(canvas.y);
      expect(box.x + box.width).toBeLessThanOrEqual(canvas.x + canvas.width);
      expect(box.y + box.height).toBeLessThanOrEqual(canvas.y + canvas.height);
    }
    await inspectSegment(page, edge, isMobile ? "tap" : "click");
    await expect(page.getByTestId("edge-inspector")).toContainText(edge);
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("edge-inspector")).toHaveCount(0);
    await expect(
      page.getByRole("combobox", {
        name: id.Experimental.inspect,
        exact: true,
      }),
    ).toBeFocused();
  }
  const select = page.getByRole("combobox", {
    name: id.Experimental.inspect,
    exact: true,
  });
  await select.press("Enter");
  await page.keyboard.press("Home");
  await page.keyboard.press("Enter");
  const inspector = page.getByTestId("edge-inspector");
  await expect(inspector).toBeVisible();
  await expect(
    inspector.getByText(id.Experimental.h_m, { exact: true }),
  ).toHaveCount(0);
  const technical = inspector.getByRole("button", {
    name: id.Experimental.technicalDetails,
  });
  await technical.press("Enter");
  await expect(
    inspector.getByText(id.Experimental.h_m, { exact: true }),
  ).toBeVisible();
  await inspector
    .getByRole("button", { name: id.Experimental.clearSelection })
    .click();
  await expect(select).toBeFocused();
});

test("a pinned segment follows fresh frame values and clears on reset", async ({
  page,
}) => {
  await page.goto("/navigation");
  await page
    .getByRole("combobox", { name: id.Experimental.inspect, exact: true })
    .click();
  await page.getByRole("option", { name: /^E_01_02 ·/ }).click();
  await expect(page.getByTestId("edge-inspector")).toContainText("E_01_02");
  const response = page.waitForResponse(
    (r) =>
      r.url().includes("/experimental/routes/screen") &&
      r.request().postDataJSON().step === "t1",
  );
  await page.getByRole("button", { name: "t1", exact: true }).click();
  const result: FixtureResult = await (await response).json();
  await expect(page.locator("svg[data-frame]")).toHaveAttribute(
    "data-frame",
    "t1",
  );
  await expect(page.getByTestId("edge-inspector")).toContainText(
    new Intl.NumberFormat("id", { maximumFractionDigits: 3 }).format(
      result.frame.samples.E_01_02.weight,
    ),
  );
  await expect(page.locator('[data-edge-id="E_01_02"]')).toHaveAttribute(
    "data-inspected",
    "true",
  );
  await page.getByRole("button", { name: id.Experimental.resetTrip }).click();
  await expect(page.getByTestId("edge-inspector")).toHaveCount(0);
});

test("missing samples and unreachable legs remain explicit", async ({
  page,
}) => {
  await page.route("**/api/v1/experimental/routes/screen", async (route) => {
    const response = await route.fetch();
    const result: FixtureResult = await response.json();
    delete result.frame.samples.E_01_02;
    result.origin_to_pickup.weighted = {
      status: "unreachable",
      node_ids: [],
      edge_ids: [],
      distance_m: null,
      objective_cost: null,
      cost_unit: "experimental_units",
    };
    await route.fulfill({ response, json: result });
  });
  await page.goto("/pre-order");
  await expect(
    page.getByRole("status").filter({ hasText: id.Experimental.unreachable }),
  ).toBeVisible();
  await expect(page.locator('[data-legs~="origin_to_pickup"]')).toHaveCount(0);
  await expect(page.locator('[data-route="weighted"]')).toContainText(
    id.Experimental.unknown,
  );
  await page
    .getByRole("combobox", { name: id.Experimental.inspect, exact: true })
    .click();
  await page.getByRole("option", { name: /^E_01_02 ·/ }).click();
  const inspector = page.getByTestId("edge-inspector");
  await expect(inspector).toContainText(id.Experimental.unknown);
  await inspector
    .getByRole("button", { name: id.Experimental.technicalDetails })
    .click();
  await expect(
    inspector.getByText(id.Experimental.unknown, { exact: true }),
  ).toHaveCount(4);
  expect(await inspector.innerText()).not.toMatch(
    /\b(low risk|dry|safe|risiko rendah|kering|aman)\b/i,
  );
});

test("geometry handles arbitrary identifiers, duplicate coordinates, parallel and short links", async ({
  request,
}) => {
  const graph = networkSchema.parse(
    await (
      await request.get("http://localhost:8100/api/v1/experimental/network")
    ).json(),
  );
  const result = resultSchema.parse(
    await (
      await request.post(
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
      )
    ).json(),
  );
  graph.nodes = [
    { node_id: "__proto__", x: 0, y: 0 },
    { node_id: "a:b", x: 0, y: 0 },
    { node_id: "b:c", x: 1e-8, y: 1e-8 },
    { node_id: "d", x: 100, y: 100 },
  ];
  graph.edges = [
    {
      edge_id: "a",
      source_node: "__proto__",
      target_node: "a:b",
      length_m: 1,
      oneway: true,
    },
    {
      edge_id: "reverse",
      source_node: "a:b",
      target_node: "__proto__",
      length_m: 1,
      oneway: true,
    },
    {
      edge_id: "parallel",
      source_node: "__proto__",
      target_node: "a:b",
      length_m: 1,
      oneway: true,
    },
    {
      edge_id: "short",
      source_node: "a:b",
      target_node: "b:c",
      length_m: 1,
      oneway: true,
    },
    {
      edge_id: "loop",
      source_node: "d",
      target_node: "d",
      length_m: 1,
      oneway: true,
    },
  ];
  const geometry = networkGeometry(graph);
  expect(geometry.points.get("__proto__")).toBeDefined();
  expect(geometry.paths.get("a")!.mid).not.toEqual(
    geometry.paths.get("reverse")!.mid,
  );
  expect(new Set([...geometry.paths.values()].map((path) => path.d)).size).toBe(
    graph.edges.length,
  );
  expect(JSON.stringify([...geometry.paths.values()])).not.toMatch(
    /NaN|Infinity/,
  );
  const reordered = networkGeometry({
    ...graph,
    edges: [...graph.edges].reverse(),
  });
  for (const [id, path] of geometry.paths)
    expect(reordered.paths.get(id)).toEqual(path);
  result.origin_to_pickup.weighted = {
    status: "found",
    node_ids: ["__proto__", "a:b", "b:c"],
    edge_ids: ["a", "short"],
    distance_m: 2,
    objective_cost: 2,
    cost_unit: "experimental_units",
  };
  expect(orderedJourney(graph, result, "weighted")[0].edgeIds).toEqual([
    "a",
    "short",
  ]);
  result.origin_to_pickup.weighted.edge_ids.reverse();
  expect(orderedJourney(graph, result, "weighted")[0].edgeIds).toEqual([]);
  const layout = stopLabels(
    geometry.points,
    ["origin", "pickup", "destination"].map((role) => ({
      role,
      nodeId: "__proto__",
      label: role,
    })),
    geometry.viewBox,
  );
  expect(
    new Set([...layout.labels.values()].map((p) => JSON.stringify(p))).size,
  ).toBe(3);
});

for (const locale of ["id", "en"] as const)
  test(`labels, reduced motion and pinned inspector fit in ${locale}`, async ({
    page,
    context,
    baseURL,
    isMobile,
  }, info) => {
    test.setTimeout(90000);
    const messages = locale === "id" ? id : en;
    await context.addCookies([
      { name: "hydrogig_locale", value: locale, url: baseURL! },
    ]);
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const width of isMobile ? [320, 375] : [768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto("/pre-order");
      await expect(page.locator("svg[data-frame]")).toBeVisible();
      for (const theme of ["light", "dark"]) {
        const dark = await page
          .locator("html")
          .evaluate((el) => el.classList.contains("dark"));
        if (dark !== (theme === "dark"))
          await page
            .getByRole("button", { name: messages.Theme.toggle, exact: true })
            .click();
        for (const path of ["pre-order", "navigation"]) {
          await page.goto(`/${path}`);
          await page.getByRole("button", { name: "t1", exact: true }).click();
          const svg = page.locator("svg[data-frame]");
          await expect(svg).toHaveAttribute("data-frame", "t1");
          await page
            .getByRole("combobox", {
              name: messages.Experimental.inspect,
              exact: true,
            })
            .click();
          await page.getByRole("option", { name: /^E_01_02 ·/ }).click();
          await expect(page.getByTestId("edge-inspector")).toContainText(
            "E_01_02",
          );
          expect(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
          ).toBe(true);
          const bounds = (await svg.boundingBox())!;
          const labels = await svg.locator("[data-stop-role] text").all();
          const boxes = [];
          for (const label of labels) {
            const box = (await label.boundingBox())!;
            expect(box.x).toBeGreaterThanOrEqual(bounds.x);
            expect(box.y).toBeGreaterThanOrEqual(bounds.y);
            expect(box.x + box.width).toBeLessThanOrEqual(
              bounds.x + bounds.width,
            );
            expect(box.y + box.height).toBeLessThanOrEqual(
              bounds.y + bounds.height,
            );
            boxes.push(box);
          }
          for (let i = 0; i < boxes.length; i++)
            for (let j = i + 1; j < boxes.length; j++) {
              const a = boxes[i],
                b = boxes[j];
              expect(
                a.x + a.width <= b.x ||
                  b.x + b.width <= a.x ||
                  a.y + a.height <= b.y ||
                  b.y + b.height <= a.y,
              ).toBe(true);
            }
          const transition = await svg
            .locator("[data-edge-stroke]")
            .first()
            .evaluate((el) => getComputedStyle(el).transitionDuration);
          expect(parseFloat(transition)).toBeLessThan(0.001);
          if (width === 375 || width === 1440) {
            const directory =
              (locale === "id" && theme === "light") ||
              (locale === "en" && theme === "dark")
                ? "../docs/screenshots/trip-network/after"
                : info.outputPath("screenshots");
            await mkdir(directory, { recursive: true });
            await page.evaluate(() =>
              scrollTo({ top: 0, behavior: "instant" }),
            );
            await page.screenshot({
              path: `${directory}/${isMobile ? "mobile" : "desktop"}-${path}-${locale}-${theme}-t1-pinned.png`,
              fullPage: true,
            });
          }
        }
      }
    }
  });
