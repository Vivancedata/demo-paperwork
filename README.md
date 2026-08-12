# demo-paperwork

A live demo of one VivanceData service: **paperwork read once, typed never**.
Paste the text of a delivery slip, invoice or permit — or photograph one — and
it becomes a structured record with a CSV export.

The behaviour that matters is what happens to the parts that *can't* be read:
they are **flagged verbatim, not guessed at**. The bundled sample documents are
deliberately defective (a smudged quantity, a cut-off line) so that behaviour
is visible on the first click.

## What this is and isn't

- It is the same extraction approach used in client builds, on a one-page
  harness, so a prospect can try it on their own paperwork before paying for
  anything.
- It is **not** a product. There are no accounts, no storage — documents are
  sent to the extraction API and the result is returned to your browser;
  nothing is persisted server-side.
- The sample documents are fictional. Every vendor, job and amount in them is
  invented, and they say so in their first line.

## Run it

```bash
npm install
cp .env.example .env.local   # add a real ANTHROPIC_API_KEY
npm run dev                  # http://localhost:3000
```

Requires an [Anthropic API key](https://console.anthropic.com/). The key stays
server-side; the browser only ever talks to `/api/extract`.

## How it works

One route handler (`src/app/api/extract/route.ts`) sends the document — text
or image — to Claude (`claude-opus-5`) with a JSON Schema enforced via
`output_config`, so the response is guaranteed to parse against
`src/lib/schema.ts`. The system prompt makes flagging a requirement:
transcribing only what the page says is the product, and a guessed vendor or
amount is a defect, not a best effort.

The UI is intentionally one page in the
[@vivancedata/ui](https://github.com/Vivancedata/ui) design system — the same
one the [main site](https://www.vivancedata.com) uses.
