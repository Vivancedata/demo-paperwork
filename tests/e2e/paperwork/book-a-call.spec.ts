import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 } });

test("after the sample slip is extracted, a phone visitor is offered a call", async ({ page }) => {
  await page.route("**/api/paperwork/extract", (route) =>
    route.fulfill({
      json: {
        record: {
          document_type: "delivery_slip",
          vendor_or_issuer: "NORTHGATE BUILDING SUPPLY",
          document_number: "DT-88214",
          date: "2026-03-14",
          job_or_site_reference: "Job #4471",
          total_amount: "",
          line_items: [{ description: "2x6x12 SPF #2", quantity: "40", unit: "", amount: "" }],
          flagged_as_unreadable: ["6? — quantity smudged"],
          notes: "",
        },
      },
    }),
  );

  await page.goto("/paperwork");
  await page.getByRole("button", { name: /sample delivery slip/i }).click();
  await page.getByRole("button", { name: /extract the record/i }).click();
  await expect(page.getByRole("heading", { name: /the record/i })).toBeVisible();

  const cta = page.getByRole("link", { name: /book a call/i });
  await cta.scrollIntoViewIfNeeded();
  await expect(cta).toBeVisible();
  await expect(cta).toHaveAttribute("href", "https://www.vivancedata.com/contact?utm_source=demo-paperwork");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
