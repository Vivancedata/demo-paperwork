import { expect, test } from "@playwright/test";

test("the demo page renders and a sample enables extraction", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));

  await page.goto("/");
  await expect(page).toHaveTitle(/Paperwork demo/i);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/your document, as a record/i);

  const submit = page.getByRole("button", { name: /extract the record/i });
  await expect(submit).toBeDisabled();
  await page.getByRole("button", { name: /sample delivery slip/i }).click();
  await expect(page.getByRole("textbox", { name: /document text/i })).toHaveValue(/NORTHGATE BUILDING SUPPLY/);
  await expect(submit).toBeEnabled();

  expect(errors).toEqual([]);
});
