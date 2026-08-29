"use client";

import { useRef, useState } from "react";
import { SAMPLE_DELIVERY_SLIP, SAMPLE_INVOICE } from "@/lib/samples";
import { toCsv, type ExtractedRecord } from "@/lib/schema";

type ImagePayload = { media_type: "image/jpeg" | "image/png" | "image/webp"; data: string };

const MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

/**
 * The page mark is this demo's signature. All three VivanceData demos share one
 * shell -- black ground, green mono eyebrow, a paste box -- which made them
 * indistinguishable from each other in a tab strip. The mark names the input
 * (a document), and `--chart-2` tints it: the chart ramp is the same
 * green-to-cyan family as the brand and the hero mesh, so the three demos read
 * as siblings rather than as three unrelated pages.
 */
const PageMark = () => (
  <svg viewBox="0 0 20 20" className="h-5 w-5 shrink-0 text-chart-2" fill="none" aria-hidden="true">
    <path d="M5 2.5h6.5L15.5 6.5V17.5H5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    <path d="M11.5 2.5v4h4" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    <path d="M7.5 7h2M7.5 10.5h5M7.5 13.5h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

const Spinner = () => (
  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 animate-spin" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity="0.35" strokeWidth="2" />
    <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

/**
 * The primary action carries the brand green the eyebrow already uses.
 *
 * It used to be `bg-primary ... disabled:opacity-50`. In dark mode `--primary`
 * is a near-white pill, so at 50% on a black sheet it landed as flat mid-grey --
 * and because the page loads with an empty box, that half-dead grey was the
 * FIRST thing anyone saw. The control was not broken, but it looked it.
 *
 * Six states, each distinguishable from the others by more than opacity:
 *   idle      solid brand green fill
 *   hover     brightened
 *   active    dimmed, nudged 1px down
 *   focus     a light ring, offset clear of the card
 *   busy      still green but dimmed, with a spinner -- work in flight
 *   disabled  hollow: hairline border, no fill, muted label, plus a line of
 *             copy saying what would turn it on
 */
const ACTION_BASE =
  "mt-4 inline-flex min-h-10 items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-card";
const ACTION_IDLE =
  "bg-brand text-brand-foreground hover:brightness-110 active:translate-y-px active:brightness-95";
const ACTION_BUSY = "cursor-progress bg-brand/70 text-brand-foreground";
const ACTION_OFF = "cursor-not-allowed border border-border bg-transparent text-mute";

/* Sample chips are real buttons and were already tabbable, but had no focus
 * style at all -- keyboard users could not see where they were. */
const CHIP =
  "rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card";

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

  const hasInput = text.trim().length > 0 || image !== null;

  return (
    <>
      {/* flex-1 + justify-center: the card used to sit in the top third with
          the rest of the viewport left as void. Centring it and pinning the
          footer as a band makes the page look composed rather than truncated.
          `flex-1` in a column will not shrink below its content, so a long
          result still lays out top-down and scrolls normally. */}
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-16">
      <div className="flex items-center gap-2.5">
        <PageMark />
        <p className="font-mono text-xs uppercase tracking-widest text-brand">
          VivanceData demo — paperwork typed once
        </p>
      </div>
      <h1 className="mt-4 text-display text-balance">
        Your document, as a record
      </h1>
      <p className="mt-4 max-w-prose text-muted-foreground">
        Paste the text of a delivery slip, invoice or permit — or photograph one —
        and it becomes a structured record you can export. Anything illegible is
        flagged, not guessed at. Nothing you submit here is stored.
      </p>

      <div className="mt-10 rounded-md border border-t-2 border-border border-t-chart-2/60 bg-card p-6">
        <div className="flex flex-wrap items-center gap-3">
          <button
            className={CHIP}
            onClick={() => { setText(SAMPLE_DELIVERY_SLIP); setImage(null); setRecord(null); }}
          >
            Sample delivery slip
          </button>
          <button
            className={CHIP}
            onClick={() => { setText(SAMPLE_INVOICE); setImage(null); setRecord(null); }}
          >
            Sample invoice
          </button>
          <button
            className={CHIP}
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
            <button
              className="rounded-sm text-brand underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
              onClick={() => setImage(null)}
            >
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
          className={`${ACTION_BASE} ${busy ? ACTION_BUSY : hasInput ? ACTION_IDLE : ACTION_OFF}`}
          disabled={busy || !hasInput}
          aria-busy={busy}
          onClick={extract}
        >
          {busy ? <Spinner /> : null}
          {busy ? "Reading…" : "Extract the record"}
        </button>
        {!busy && !hasInput ? (
          <p className="mt-3 text-sm text-mute">
            Paste a document, or take one of the samples above, and this turns on.
          </p>
        ) : null}
        {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
      </div>

      {record ? (
        <section className="mt-10">
          <div className="flex items-baseline justify-between">
            <h2 className="text-heading-2">The record</h2>
            <button
              className={CHIP}
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
              <h3 className="font-mono text-xs uppercase tracking-wider text-brand">
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

      </main>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto max-w-3xl px-6 py-8 text-sm text-muted-foreground">
          Built by{" "}
          <a
            className="rounded-sm text-brand underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
            href="https://www.vivancedata.com"
          >
            VivanceData
          </a>{" "}
          — the same extraction, run on your paperwork before you pay for a build.
        </div>
      </footer>
    </>
  );
}
