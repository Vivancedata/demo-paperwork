"use client";

import { useRef, useState } from "react";
import { SAMPLE_DELIVERY_SLIP, SAMPLE_INVOICE } from "@/lib/samples";
import { toCsv, type ExtractedRecord } from "@/lib/schema";

type ImagePayload = { media_type: "image/jpeg" | "image/png" | "image/webp"; data: string };

const MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export default function Home() {
  const [text, setText] = useState("");
  const [image, setImage] = useState<{ payload: ImagePayload; name: string } | null>(null);
  const [record, setRecord] = useState<ExtractedRecord | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  async function onFile(file: File) {
    if (!MEDIA_TYPES.includes(file.type as (typeof MEDIA_TYPES)[number])) {
      setError("JPEG, PNG or WebP only.");
      return;
    }
    const buf = await file.arrayBuffer();
    let binary = "";
    const bytes = new Uint8Array(buf);
    for (let i = 0; i < bytes.length; i += 0x8000) {
      binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    }
    setImage({
      payload: { media_type: file.type as ImagePayload["media_type"], data: btoa(binary) },
      name: file.name,
    });
    setText("");
    setError(null);
  }

  async function extract() {
    setBusy(true);
    setError(null);
    setRecord(null);
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(image ? { image: image.payload } : { text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
      setRecord(data.record);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Extraction failed.");
    } finally {
      setBusy(false);
    }
  }

  function downloadCsv() {
    if (!record) return;
    const blob = new Blob([toCsv(record)], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${record.document_number || "record"}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const canExtract = !busy && (text.trim().length > 0 || image !== null);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-label uppercase text-mute">
        Vivancedata demo — paperwork typed once
      </p>
      <h1 className="mt-4 font-display text-serif-lg text-balance">
        Your document, as a record
      </h1>
      <p className="mt-4 max-w-prose text-muted-foreground">
        Paste the text of a delivery slip, invoice or permit — or photograph one —
        and it becomes a structured record you can export. Anything illegible is
        flagged, not guessed at. Nothing you submit here is stored.
      </p>

      <div className="mt-10 rounded-md border border-border bg-card p-6">
        <div className="flex flex-wrap items-center gap-3">
          <button
            className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent"
            onClick={() => { setText(SAMPLE_DELIVERY_SLIP); setImage(null); setRecord(null); }}
          >
            Sample delivery slip
          </button>
          <button
            className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent"
            onClick={() => { setText(SAMPLE_INVOICE); setImage(null); setRecord(null); }}
          >
            Sample invoice
          </button>
          <button
            className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent"
            onClick={() => fileInput.current?.click()}
          >
            Photo of your own…
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
          />
        </div>

        {image ? (
          <p className="mt-4 font-mono text-sm text-muted-foreground">
            {image.name}{" "}
            <button className="text-foreground underline decoration-rule underline-offset-4 hover:decoration-current" onClick={() => setImage(null)}>
              remove
            </button>
          </p>
        ) : (
          <textarea
            className="mt-4 h-56 w-full resize-y rounded-md border border-border bg-background p-4 font-mono text-sm"
            placeholder="Paste document text here…"
            value={text}
            onChange={(e) => { setText(e.target.value); setRecord(null); }}
          />
        )}

        <button
          className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          disabled={!canExtract}
          onClick={extract}
        >
          {busy ? "Reading…" : "Extract the record"}
        </button>
        {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
      </div>

      {record ? (
        <section className="mt-10">
          <div className="flex items-baseline justify-between">
            <h2 className="text-heading-2">The record</h2>
            <button
              className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent"
              onClick={downloadCsv}
            >
              Download CSV
            </button>
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-x-8 gap-y-4 text-sm sm:grid-cols-3">
            {[
              ["Type", record.document_type.replace("_", " ")],
              ["Vendor / issuer", record.vendor_or_issuer],
              ["Number", record.document_number],
              ["Date", record.date],
              ["Job / site", record.job_or_site_reference],
              ["Total", record.total_amount],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
                <dd className="mt-1">{value || "—"}</dd>
              </div>
            ))}
          </dl>

          {record.line_items.length > 0 ? (
            <div className="mt-6 overflow-x-auto rounded-md border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="p-3">Item</th>
                    <th className="p-3">Qty</th>
                    <th className="p-3">Unit</th>
                    <th className="p-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {record.line_items.map((li, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="p-3">{li.description}</td>
                      <td className="p-3 tabular-nums">{li.quantity}</td>
                      <td className="p-3">{li.unit}</td>
                      <td className="p-3 text-right tabular-nums">{li.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {record.flagged_as_unreadable.length > 0 ? (
            <div className="mt-6 rounded-md border border-border p-4">
              <h3 className="text-label uppercase text-foreground">
                Flagged, not guessed
              </h3>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                {record.flagged_as_unreadable.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {record.notes ? (
            <p className="mt-4 text-sm text-muted-foreground">{record.notes}</p>
          ) : null}
        </section>
      ) : null}

      <footer className="mt-16 border-t border-border pt-6 text-sm text-muted-foreground">
        Built by{" "}
        <a className="text-foreground underline decoration-rule underline-offset-4 hover:decoration-current" href="https://www.vivancedata.com">
          Vivancedata
        </a>{" "}
        — the same extraction, run on your paperwork before you pay for a build.
      </footer>
    </main>
  );
}
