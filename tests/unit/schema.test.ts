import { describe, expect, expectTypeOf, it } from "vitest";
import { SAMPLE_DELIVERY_SLIP, SAMPLE_INVOICE } from "@/lib/samples";
import { EXTRACTION_SCHEMA, toCsv, type ExtractedRecord, type LineItem } from "@/lib/schema";

const RECORD: ExtractedRecord = {
  document_type: "invoice",
  vendor_or_issuer: "APEX MECHANICAL WHOLESALE",
  document_number: "INV-2026-0392",
  date: "2026-02-27",
  job_or_site_reference: "Job 118 / Kessler warehouse retrofit",
  total_amount: "$769.95",
  line_items: [
    { description: "Condensate pump, 1/3 HP", quantity: "2", unit: "ea", amount: "$214.00" },
    { description: '3/4" copper, type L', quantity: "60", unit: "ft", amount: "$312.60" },
  ],
  flagged_as_unreadable: [],
  notes: "",
};

const rows = (csv: string) => csv.split("\n");

describe("EXTRACTION_SCHEMA", () => {
  it("requires exactly the fields of ExtractedRecord and allows nothing else", () => {
    expect(EXTRACTION_SCHEMA.additionalProperties).toBe(false);
    expect([...EXTRACTION_SCHEMA.required].sort()).toEqual(Object.keys(EXTRACTION_SCHEMA.properties).sort());
    expectTypeOf<(typeof EXTRACTION_SCHEMA.required)[number]>().toEqualTypeOf<keyof ExtractedRecord>();
  });

  it("describes line items with the LineItem shape", () => {
    const items = EXTRACTION_SCHEMA.properties.line_items.items;
    expect(items.additionalProperties).toBe(false);
    expect([...items.required].sort()).toEqual(Object.keys(items.properties).sort());
    expectTypeOf<(typeof items.required)[number]>().toEqualTypeOf<keyof LineItem>();
  });

  it("keeps the document_type enum in step with the TypeScript union", () => {
    expectTypeOf<(typeof EXTRACTION_SCHEMA.properties.document_type.enum)[number]>()
      .toEqualTypeOf<ExtractedRecord["document_type"]>();
  });
});

describe("toCsv", () => {
  it("writes a header and one row per line item, repeating the document fields", () => {
    expect(rows(toCsv(RECORD))).toEqual([
      '"document_type","vendor_or_issuer","document_number","date","job_or_site_reference","line_description","quantity","unit","amount"',
      '"invoice","APEX MECHANICAL WHOLESALE","INV-2026-0392","2026-02-27","Job 118 / Kessler warehouse retrofit","Condensate pump, 1/3 HP","2","ea","$214.00"',
      '"invoice","APEX MECHANICAL WHOLESALE","INV-2026-0392","2026-02-27","Job 118 / Kessler warehouse retrofit","3/4"" copper, type L","60","ft","$312.60"',
    ]);
  });

  it("falls back to a single row carrying the total when there are no line items", () => {
    const csv = toCsv({ ...RECORD, line_items: [] });
    expect(rows(csv)).toHaveLength(2);
    expect(rows(csv)[1]).toBe(
      '"invoice","APEX MECHANICAL WHOLESALE","INV-2026-0392","2026-02-27","Job 118 / Kessler warehouse retrofit","","","","$769.95"',
    );
  });

  it("keeps commas, quotes and newlines inside their cell", () => {
    const csv = toCsv({
      ...RECORD,
      line_items: [{ description: 'Tube "A",\nsecond line', quantity: "1", unit: "", amount: "" }],
    });
    expect(csv).toContain('"Tube ""A"",\nsecond line"');
  });

  it("neutralises cells a spreadsheet would run as a formula", () => {
    const csv = toCsv({
      ...RECORD,
      vendor_or_issuer: '=HYPERLINK("https://evil.example","Click")',
      line_items: [
        { description: "+1+cmd|' /C calc'!A0", quantity: "@SUM(A1:A2)", unit: "-2+3", amount: "-$12.50" },
      ],
    });
    const [, row] = rows(csv);
    expect(row).toContain(`"'=HYPERLINK(""https://evil.example"",""Click"")"`);
    expect(row).toContain(`"'+1+cmd|' /C calc'!A0"`);
    expect(row).toContain(`"'@SUM(A1:A2)"`);
    expect(row).toContain(`"'-2+3"`);
    // A plain negative amount is data, not a formula, and stays as written.
    expect(row).toContain(`"-$12.50"`);
  });
});

describe("samples", () => {
  it("are labelled fictional in their first line", () => {
    for (const sample of [SAMPLE_DELIVERY_SLIP, SAMPLE_INVOICE]) {
      expect(sample.split("\n")[0]).toMatch(/SAMPLE DOCUMENT.*fictional/);
    }
  });

  it("keep the deliberate defects that make flagging show on first click", () => {
    expect(SAMPLE_DELIVERY_SLIP).toMatch(/qty smudged/);
    expect(SAMPLE_DELIVERY_SLIP).toMatch(/illegible/);
    expect(SAMPLE_DELIVERY_SLIP.trimEnd()).toMatch(/—$/);
  });
});
