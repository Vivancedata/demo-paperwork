/**
 * One schema for the three document types the homepage names: delivery slips,
 * invoices, and permits/submittals. A single shape keeps the demo honest —
 * the point is "your document becomes a record you can export", not a
 * per-format parser a prospect might suspect was tuned to the sample.
 */
export interface LineItem {
  description: string;
  quantity: string;
  unit: string;
  amount: string;
}

export interface ExtractedRecord {
  document_type: "delivery_slip" | "invoice" | "permit" | "work_order" | "other";
  vendor_or_issuer: string;
  document_number: string;
  date: string;
  job_or_site_reference: string;
  total_amount: string;
  line_items: LineItem[];
  /** Verbatim text the model could not read or was unsure about. Surfacing
   * uncertainty is the feature: the pitch is "illegible gets flagged rather
   * than guessed at", so the demo must do exactly that. */
  flagged_as_unreadable: string[];
  notes: string;
}

/** JSON Schema enforced server-side via output_config.format — the API
 * guarantees the response parses to ExtractedRecord, so the UI never sees
 * malformed output. */
export const EXTRACTION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "document_type",
    "vendor_or_issuer",
    "document_number",
    "date",
    "job_or_site_reference",
    "total_amount",
    "line_items",
    "flagged_as_unreadable",
    "notes",
  ],
  properties: {
    document_type: {
      type: "string",
      enum: ["delivery_slip", "invoice", "permit", "work_order", "other"],
    },
    vendor_or_issuer: { type: "string" },
    document_number: { type: "string" },
    date: { type: "string", description: "ISO 8601 if determinable, else as written" },
    job_or_site_reference: { type: "string" },
    total_amount: { type: "string" },
    line_items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["description", "quantity", "unit", "amount"],
        properties: {
          description: { type: "string" },
          quantity: { type: "string" },
          unit: { type: "string" },
          amount: { type: "string" },
        },
      },
    },
    flagged_as_unreadable: { type: "array", items: { type: "string" } },
    notes: { type: "string" },
  },
} as const;

export function toCsv(record: ExtractedRecord): string {
  const esc = (s: string) => `"${s.replaceAll('"', '""')}"`;
  const head = [
    "document_type", "vendor_or_issuer", "document_number", "date",
    "job_or_site_reference", "line_description", "quantity", "unit", "amount",
  ];
  const base = [
    record.document_type, record.vendor_or_issuer, record.document_number,
    record.date, record.job_or_site_reference,
  ];
  const rows = record.line_items.length
    ? record.line_items.map((li) => [...base, li.description, li.quantity, li.unit, li.amount])
    : [[...base, "", "", "", record.total_amount]];
  return [head, ...rows].map((r) => r.map(esc).join(",")).join("\n");
}
