# Vivancedata demos

Three live demos of Vivancedata services in one Next.js app. Each is one page
and one API route, and each shows how the model handles what it *can't* be
sure of, because that is the product.

| Demo | Route | Domain | What it shows |
|---|---|---|---|
| Paperwork | `/paperwork` | paperwork.vivancedata.com | A delivery slip, invoice or permit (text or photo) becomes a structured record with CSV export. Illegible parts are flagged verbatim, not guessed at. |
| Missed call | `/missed-call` | calls.vivancedata.com | An after-hours voicemail transcript becomes a triaged job with an urgency and a suggested SMS reply. Garbled details are flagged, and the reply never promises a time. |
| Field photos | `/field-photos` | field.vivancedata.com | A site photo or scrawled field note is matched to the right job from the day's list, with the evidence quoted. No confident match means no match. |

On a demo's own domain, `/` shows that demo (see `src/proxy.ts`), so the old
links keep working. Anywhere else `/` is an index of all three.

## What this is and isn't

- It is the same extraction approach used in client builds, on small
  harnesses, so a prospect can try it on their own material before paying for
  anything.
- It is **not** a product. There are no accounts and no storage: input goes to
  the Anthropic API and the result comes back to the browser. Nothing is kept
  server-side.
- The bundled samples are fictional, and deliberately defective (a smudged
  quantity, a cut-off callback number) so the flagging shows on the first
  click.

## Run it

```bash
npm install
cp .env.example .env.local   # add a real ANTHROPIC_API_KEY
npm run dev                  # http://localhost:3000 lists the three demos
```

The key stays server-side; each page only talks to its own
`/api/<demo>/extract` route. Those routes refuse other origins and allow 10
requests per visitor per 10 minutes, counted per demo.

## Deploying

One Vercel project can serve all three: add the three domains to it. To keep
a project per demo instead, point each at this repo and set `DEMO` to
`paperwork`, `missed-call` or `field-photos`, so `/` on its `.vercel.app`
address opens that demo.

## How it works

Each route (`src/app/api/<demo>/extract/route.ts`) sends the input to Claude
(`claude-haiku-5-5`) with a JSON Schema enforced through `output_config`, so
the response always parses against that demo's `src/demos/<demo>/schema.ts`.
The system prompts make flagging a requirement: a guessed vendor, callback
number or job match is a defect, not a best effort.

Each demo's product and design notes are in `docs/demos/<demo>/`. The UI uses
the [@vivancedata/ui](https://github.com/Vivancedata/ui) design system, the
same one the [main site](https://www.vivancedata.com) uses.
