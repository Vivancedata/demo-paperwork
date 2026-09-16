# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The owner or office manager of a trade or local-services business —
construction, HVAC and plumbing, logistics, small manufacturing — who is
evaluating Vivancedata and has not paid for anything. They arrive from a link
on vivancedata.com, often on a phone between jobs, and they have usually been
sold software before that never got installed. They give this page under a
minute before deciding it is either real or another demo video.

The second reader is the person whose week this replaces: the one re-keying
delivery slips and invoices into an accounting system by hand.

## Product Purpose

A one-page trial harness for a single Vivancedata service: **paperwork read
once, typed never.** A visitor pastes the text of a delivery slip, invoice or
permit, or photographs one, and gets back a structured record with a CSV
export.

Success is not "the extraction was accurate". Success is that the visitor
believes the system will behave honestly on their own messy paperwork, and
books a call. The demo is a sales instrument whose credibility rests on
showing a real system doing a real job on the visitor's own document.

## Positioning

**What is unreadable gets flagged verbatim, never guessed at.** That is the
whole differentiator and the reason the demo exists in this shape. Anyone can
show a clean invoice parsing correctly; the bundled samples are deliberately
defective — a smudged quantity, a cut-off line — so the flagging behaviour is
visible on the first click rather than described in a claim.

The second position is trial before payment: this is the same extraction
approach used in client builds, run on a one-page harness, so a prospect can
try it on their own paperwork before paying for a build.

## Operating Context

- Reached from the marketing site's feature tiles and from
  `paperwork.vivancedata.com`. It is one of three sibling demos, alongside
  the after-hours call demo and the field-capture demo.
- Read on a phone, frequently outdoors, often on a poor connection.
- The document a visitor tries is usually a photograph taken on the spot, not
  clean text.
- The visitor is trying to answer one question: "would this cope with *my*
  paperwork, which is worse than your samples?"

## Capabilities and Constraints

- Whole surface is one route (`src/app/page.tsx`) plus one API route
  (`src/app/api/extract/route.ts`). Around 600 lines total.
- Next.js App Router, React, Tailwind, `@anthropic-ai/sdk`. All design tokens
  and components come from `@vivancedata/ui`; `src/app/globals.css` adds
  nothing but the Tailwind component and utility layers.
- Accepts pasted text or an uploaded JPEG, PNG or WebP.
- Output is a typed record (type, vendor or issuer, number, date, job or site
  reference, total, line items, flagged-unreadable list, notes) plus CSV
  download.
- **It is not a product.** No accounts, no database, no server-side
  persistence. A document round-trips through the extraction API and the
  result returns to the browser.
- Rate limited to 10 requests per IP per 10 minutes, in memory. This is
  deliberately not a billing guarantee — a cold start or a second instance
  resets the counter. It exists to make running up the bill boring.
- The extraction API key lives in `.env.local` locally and in the Vercel
  project environment. It is never read, printed or committed.
- Deployed on Vercel.

## Brand Commitments

- The name is **Vivancedata**, one word, capital V. The older "VivanceData"
  spelling survives in this app's page title, eyebrow and footer link and is
  a defect, not a variant.
- Voice is first person singular and names the job rather than the
  technology, matching the marketing site's hero register. The demo is
  described as something that runs on the visitor's own paperwork, not as an
  "AI-powered document intelligence solution".
- Visual language is the shared `@vivancedata/ui` contract: ink on a sheet,
  depth as a hairline, one green accent. This app ships **dark only** —
  `layout.tsx` hard-codes `class="dark"` and there is no toggle.
- Each of the three demos takes one hue from the chart ramp for its page mark
  so they read as siblings rather than three unrelated pages. This one is
  `--chart-2`.

## Evidence on Hand

- Two bundled sample documents in `src/lib/samples.ts`: a delivery slip and
  an invoice. Both are fictional, both declare that in their first line, and
  both are deliberately defective so the flagging behaviour shows.
- The live deployment at `paperwork.vivancedata.com`.

**Absences that must never be fabricated:** no client documents, no accuracy
percentage, no processing-time claim, no volume or customer count, no
testimonial, no certification. The practice has no client who has agreed to
be named. If a number is ever printed on this page it must be derived from
what the visitor just submitted.

## Product Principles

1. **Flagged beats guessed.** The failure the product is designed around is
   a confident wrong value, not a gap. Everything in the interface should
   make the flagging visible rather than tucking it away.
2. **Prove on their document, not ours.** The samples exist to get a visitor
   to the result state fast; the persuasive moment is when they paste their
   own.
3. **Say what happens to their data.** A visitor pasting a real invoice needs
   to know nothing is stored, at the moment they paste it.
4. **A demo that never converts is decoration.** The visitor is most
   convinced immediately after a good result; that moment should offer the
   next step.
5. **Cheap to run, boring to abuse.** Cost control is a product constraint,
   not an afterthought.

## Accessibility & Inclusion

WCAG 2.1 AA is the floor. Two constraints bind harder than usual: the page is
read on a phone in daylight, and it ships dark-only, so contrast on the dark
sheet carries the whole burden. Per the shared token contract, the `mute` and
`faint` greys are decorative and must never carry copy a visitor has to read
— including hint copy explaining why a control is disabled.
