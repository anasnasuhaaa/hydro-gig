import { type Page } from "@playwright/test";

// Curved paths' bounding-box centers need not lie on their hit strokes.
export async function inspectSegment(
  page: Page,
  edgeId: string,
  action: "hover" | "tap" | "click" = "click",
) {
  const hit = page
    .locator("[data-edge-id]")
    .filter({ has: page.locator("[data-edge-hit]") });
  const path = hit.locator("[data-edge-hit]");
  const target = await path.evaluateAll((elements, id) => {
    const element = elements.find(
      (el) => el.parentElement?.getAttribute("data-edge-id") === id,
    ) as SVGPathElement;
    element.scrollIntoView({ block: "center", behavior: "instant" });
    const point = element.getPointAtLength(element.getTotalLength() / 2);
    const screen = new DOMPoint(point.x, point.y).matrixTransform(
      element.getScreenCTM()!,
    );
    return { x: screen.x, y: screen.y };
  }, edgeId);
  if (action === "tap") await page.touchscreen.tap(target.x, target.y);
  else if (action === "hover") await page.mouse.move(target.x, target.y);
  else await page.mouse.click(target.x, target.y);
}
