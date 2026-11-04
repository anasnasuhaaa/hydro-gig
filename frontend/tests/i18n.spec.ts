import { expect, test } from "@playwright/test";
import en from "../messages/en.json";
import id from "../messages/id.json";

function keys(value: object, prefix = ""): string[] {
  return Object.entries(value)
    .flatMap(([key, item]) =>
      typeof item === "string"
        ? [`${prefix}${key}`]
        : keys(item, `${prefix}${key}.`),
    )
    .sort();
}
test("translation catalogs have matching keys and placeholders", () => {
  expect(keys(en)).toEqual(keys(id));
  const flatten = (value: object): string[] =>
    Object.values(value).flatMap((item) =>
      typeof item === "string" ? [item] : flatten(item),
    );
  flatten(en).forEach((message, index) =>
    expect(message.match(/\{\w+\}/g) ?? []).toEqual(
      flatten(id)[index].match(/\{\w+\}/g) ?? [],
    ),
  );
});
test("Indonesian SSR default, invalid cookie fallback and English persistence", async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await context.addCookies([
    { name: "hydrogig_locale", value: "invalid", url: "http://localhost:3000" },
  ]);
  const response = await page.goto("/pre-order");
  expect(await response?.text()).toContain('lang="id"');
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    id.Screen.title,
  );
  await page
    .getByRole("combobox", { name: id.Screen.origin, exact: true })
    .click();
  await page.getByRole("option", { name: /^A ·/ }).click();
  await page.getByRole("button", { name: "English", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(
    page.getByRole("combobox", { name: "Origin", exact: true }),
  ).toContainText("A ·");
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    en.Screen.title,
  );
  for (const [path, title] of [
    ["/dashboard", en.Dashboard.title],
    ["/navigation", en.Navigation.title],
    ["/claims", en.Claims.title],
  ]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  }
  await page
    .getByRole("button", { name: "Bahasa Indonesia", exact: true })
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    id.Claims.title,
  );
  expect(
    (await context.cookies()).find(
      (cookie) => cookie.name === "hydrogig_locale",
    )?.sameSite,
  ).toBe("Lax");
  expect(errors).toEqual([]);
});

test("main UI text uses translation catalogs", async () => {
  const { readFile, readdir } = await import("node:fs/promises");
  const ts = await import("typescript");
  const walk = async (directory: string): Promise<string[]> =>
    (
      await Promise.all(
        (await readdir(directory, { withFileTypes: true })).map((entry) =>
          entry.isDirectory()
            ? walk(`${directory}/${entry.name}`)
            : [`${directory}/${entry.name}`],
        ),
      )
    ).flat();
  const untranslated: string[] = [];
  for (const file of (await walk("src")).filter((file) =>
    file.endsWith(".tsx"),
  )) {
    const source = ts.createSourceFile(
      file,
      await readFile(file, "utf8"),
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );
    const visit = (node: import("typescript").Node) => {
      if (
        ts.isJsxText(node) &&
        /[a-zA-Z]{3}/.test(node.text) &&
        !/^(HydroGig|-Mesh|HydroGig-Mesh · 404|Open-Meteo|CC BY 4.0|WIB)$/.test(
          node.text.trim(),
        )
      )
        untranslated.push(`${file}: ${node.text.trim()}`);
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  expect(untranslated).toEqual([]);
});
