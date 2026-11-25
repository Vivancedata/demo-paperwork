# Feature map

Everything a visitor can reach in the demo, from their side. The whole app is
one page (`/`) and one route behind it (`POST /api/extract`).

| Feature | Where | How to reach it | How to check it works |
|---|---|---|---|
| See what the demo does | `/` | Open the page | Title is "Paperwork demo …"; the heading reads "Your document, as a record" and the intro says nothing submitted is stored. |
| Told what to add before extracting | `/`, under the "Extract the record" button | Open the page with no text and no photo | "Extract the record" is disabled and the hint "Add a photo of a slip, or paste its text." shows under it. |
| Paste your own document text | `/`, "Document text" box | Type or paste into "Paste document text here…" | "Extract the record" becomes enabled. |
| Load the sample delivery slip | `/`, "Sample delivery slip" button | Click "Sample delivery slip" | The box fills with text starting `[SAMPLE DOCUMENT — fictional vendor and job]` and `NORTHGATE BUILDING SUPPLY` (one smudged quantity, a cut-off line) and extraction is enabled. |
| Load the sample invoice | `/`, "Sample invoice" button | Click "Sample invoice" | The box fills with text starting `[SAMPLE DOCUMENT …]` and `APEX MECHANICAL WHOLESALE`, `INV-2026-0392`, total `$769.95`, and extraction is enabled. |
| Attach a photo of your own | `/`, "Photo of your own…" button | Click it and choose a JPEG, PNG or WebP | The file name shows with a "remove" link, the text box is replaced by the file name, and extraction is enabled. |
| Remove an attached photo | `/`, "remove" next to the file name | Click "remove" | The file name goes away and the text box comes back. |
| Told a file type is unsupported | `/`, "Photo of your own…" | Choose a file that is not JPEG, PNG or WebP (e.g. a GIF) | The message "That file type is not supported. Choose a JPEG, PNG or WebP photo." appears and nothing is attached. |
| Extract a record | `/`, "Extract the record" button | Load a sample (or a photo), click "Extract the record" | Needs `ANTHROPIC_API_KEY` on the server. With it: the button shows "Reading…", then "The record" appears with Type, Vendor / issuer, Number, Date, Job / site and Total, a line-item table, and a "Flagged, not guessed" list for illegible parts (the sample slip flags the smudged quantity). Without the key: the message "The demo is offline: ANTHROPIC_API_KEY is not configured on the server…" appears instead. |
| Download the record as CSV | `/`, "Download CSV" button in "The record" | Extract a record, click "Download CSV" | A file named `<document number>.csv` (or `record.csv`) downloads with the record's fields and line items. |
| Book a call | `/`, "Book a call" link below the record | Extract a record, scroll to the end of it | The link points to `https://www.vivancedata.com/contact?utm_source=demo-paperwork`. |
| Visit Vivancedata | `/`, footer | Click "Vivancedata" in "Built by Vivancedata" | Opens `https://www.vivancedata.com`. |
