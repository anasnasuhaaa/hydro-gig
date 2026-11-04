import { expect, test } from "@playwright/test";

test("official sidebar trigger, shortcut, focus and mobile sheet", async ({
  page,
  isMobile,
}) => {
  await page.goto("/dashboard");
  if (isMobile) {
    const trigger = page.getByRole("button", {
      name: "Open navigation",
      exact: true,
    });
    await trigger.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Quick navigation" }),
    ).not.toBeVisible();
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
    await expect(
      page.getByRole("navigation", { name: "Quick navigation" }),
    ).toBeVisible();
  } else {
    const trigger = page.getByRole("button", {
      name: "Collapse sidebar",
      exact: true,
    });
    await expect(trigger).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await trigger.hover();
    await expect(trigger).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(
      page.getByRole("button", { name: "Expand sidebar", exact: true }),
    ).toBeFocused();
    await page.keyboard.press("Control+b");
    await expect(trigger).toBeVisible();
  }
});
