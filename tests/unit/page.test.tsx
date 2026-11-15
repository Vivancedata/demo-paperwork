// @vitest-environment jsdom
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Home from "@/app/page";
import { SAMPLE_DELIVERY_SLIP, SAMPLE_INVOICE } from "@/lib/samples";
import type { ExtractedRecord } from "@/lib/schema";

const RECORD: ExtractedRecord = {
  document_type: "delivery_slip",
  vendor_or_issuer: "NORTHGATE BUILDING SUPPLY",
  document_number: "DT-88214",
  date: "2026-03-14",
  job_or_site_reference: "Job #4471 — Harwood St duplex",
  total_amount: "",
  line_items: [
    { description: "2x6x12 SPF #2", quantity: "40", unit: "", amount: "" },
    { description: "Simpson HDU4 holdown", quantity: "12", unit: "", amount: "" },
  ],
  flagged_as_unreadable: ["6? — quantity smudged"],
  notes: "Damaged bundle noted on arrival (cut off).",
};

function mockFetch(status: number, body: unknown) {
  const fetchMock = vi.fn<typeof fetch>(async () =>
    new Response(typeof body === "string" ? body : JSON.stringify(body), { status }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const submit = () => screen.getByRole("button", { name: /extract the record/i });
const docBox = () => screen.getByRole("textbox", { name: /document text/i });

async function extractSample(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /sample delivery slip/i }));
  await user.click(submit());
  await screen.findByRole("heading", { name: /the record/i });
}

describe("paperwork page", () => {
  it("renders the pitch and a disabled submit with a hint", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { level: 1, name: /your document, as a record/i })).toBeVisible();
    expect(submit()).toBeDisabled();
    expect(screen.getByText(/add a photo of a slip, or paste its text/i)).toBeVisible();
  });

  it("loads either sample into the document box", async () => {
    const user = userEvent.setup();
    render(<Home />);
    await user.click(screen.getByRole("button", { name: /sample delivery slip/i }));
    expect(docBox()).toHaveValue(SAMPLE_DELIVERY_SLIP);
    await user.click(screen.getByRole("button", { name: /sample invoice/i }));
    expect(docBox()).toHaveValue(SAMPLE_INVOICE);
    expect(submit()).toBeEnabled();
  });

  it("posts the text and renders the record, line items, flags and notes", async () => {
    const user = userEvent.setup();
    const fetchMock = mockFetch(200, { record: RECORD });
    render(<Home />);
    await extractSample(user);

    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({ text: SAMPLE_DELIVERY_SLIP });
    expect(screen.getByText("delivery slip")).toBeVisible();
    expect(screen.getByText("NORTHGATE BUILDING SUPPLY")).toBeVisible();
    expect(screen.getByText("DT-88214")).toBeVisible();

    const table = screen.getByRole("table");
    expect(within(table).getAllByRole("row")).toHaveLength(3);
    expect(within(table).getByText("Simpson HDU4 holdown")).toBeVisible();

    expect(screen.getByRole("heading", { name: /flagged, not guessed/i })).toBeVisible();
    expect(screen.getByText("6? — quantity smudged")).toBeVisible();
    expect(screen.getByText(RECORD.notes)).toBeVisible();
    // An empty field shows a dash rather than a blank cell.
    expect(screen.getByText("Total").nextElementSibling).toHaveTextContent("—");
  });

  it("downloads the record as CSV named after the document number", async () => {
    const user = userEvent.setup();
    mockFetch(200, { record: RECORD });
    const createObjectURL = vi.fn<(blob: Blob) => string>(() => "blob:record");
    // jsdom has no object URLs; the page only needs the two static methods.
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      expect(this.download).toBe("DT-88214.csv");
    });
    render(<Home />);
    await extractSample(user);

    await user.click(screen.getByRole("button", { name: /download csv/i }));
    expect(click).toHaveBeenCalledOnce();
    const csv = await createObjectURL.mock.calls[0][0].text();
    expect(csv.split("\n")).toHaveLength(3);
    expect(csv).toContain('"Simpson HDU4 holdown","12"');
  });

  it("clears a stale record as soon as the text is edited", async () => {
    const user = userEvent.setup();
    mockFetch(200, { record: RECORD });
    render(<Home />);
    await extractSample(user);
    await user.type(docBox(), "!");
    expect(screen.queryByRole("heading", { name: /the record/i })).not.toBeInTheDocument();
  });

  it("shows the server's error message, or a status fallback for non-JSON", async () => {
    const user = userEvent.setup();
    mockFetch(413, { error: "Text too long (20k characters max)." });
    render(<Home />);
    await user.click(screen.getByRole("button", { name: /sample invoice/i }));
    await user.click(submit());
    expect(await screen.findByText("Text too long (20k characters max).")).toBeVisible();

    mockFetch(504, "<html>Gateway Timeout</html>");
    await user.click(submit());
    expect(await screen.findByText(/request failed \(504\)/i)).toBeVisible();
  });

  describe("photo capture", () => {
    const fileInput = (container: HTMLElement) =>
      container.querySelector<HTMLInputElement>('input[type="file"]')!;
    const jpeg = () => new File([new Uint8Array([0xff, 0xd8, 0xff])], "slip.jpg", { type: "image/jpeg" });

    it("rejects unsupported file types", async () => {
      const user = userEvent.setup({ applyAccept: false });
      const { container } = render(<Home />);
      await user.upload(fileInput(container), new File(["%PDF"], "slip.pdf", { type: "application/pdf" }));
      expect(await screen.findByText(/file type is not supported/i)).toBeVisible();
    });

    it("swaps the text box for the photo and sends only the image", async () => {
      const user = userEvent.setup();
      const fetchMock = mockFetch(200, { record: RECORD });
      const { container } = render(<Home />);
      await user.upload(fileInput(container), jpeg());

      expect(await screen.findByText("slip.jpg")).toBeVisible();
      expect(screen.queryByRole("textbox", { name: /document text/i })).not.toBeInTheDocument();
      await user.click(submit());
      await screen.findByRole("heading", { name: /the record/i });

      expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
        image: { media_type: "image/jpeg", data: btoa(String.fromCharCode(0xff, 0xd8, 0xff)) },
      });
    });

    it("lets the same photo be chosen again after removing it", async () => {
      const user = userEvent.setup();
      const { container } = render(<Home />);
      const file = jpeg();
      await user.upload(fileInput(container), file);
      await user.click(await screen.findByRole("button", { name: "Remove slip.jpg" }));
      expect(docBox()).toBeVisible();

      await user.upload(fileInput(container), file);
      expect(await screen.findByText("slip.jpg")).toBeVisible();
    });

    it("clears the previous record when a new photo is chosen", async () => {
      const user = userEvent.setup();
      mockFetch(200, { record: RECORD });
      const { container } = render(<Home />);
      await extractSample(user);

      await user.upload(fileInput(container), jpeg());
      await screen.findByText("slip.jpg");
      await waitFor(() =>
        expect(screen.queryByRole("heading", { name: /the record/i })).not.toBeInTheDocument(),
      );
    });
  });
});
