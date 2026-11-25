/**
 * Synthetic sample documents, and clearly labelled as such in each header
 * line. Every name here is invented; no real vendor, job or amount appears.
 * The deliberate defects (smudged quantity, cut-off line) exist so the demo
 * can show flagging behaviour on first click.
 */
export const SAMPLE_DELIVERY_SLIP = `[SAMPLE DOCUMENT — fictional vendor and job]

NORTHGATE BUILDING SUPPLY
Delivery ticket: DT-88214
Date: 03/14/2026    Driver: R.M.

Deliver to: Job #4471 — Harwood St duplex
Received by: (signature illegible)

QTY   ITEM
40    2x6x12 SPF #2
12    Simpson HDU4 holdown
6?    Tube sandpaper 80grit  (qty smudged)
1     Delivery fee

Balance due net 30. Damaged bundle noted on arr—`;

export const SAMPLE_INVOICE = `[SAMPLE DOCUMENT — fictional vendor and job]

APEX MECHANICAL WHOLESALE          INVOICE
INV-2026-0392                      Date: 2026-02-27

Bill to: Job 118 / Kessler warehouse retrofit

Description                          Qty    Unit     Amount
Condensate pump, 1/3 HP               2     ea       $214.00
3/4" copper, type L                   60    ft       $312.60
Refrigerant recovery svc              1     lot      $185.00
                                          Subtotal   $711.60
                                          Tax (8.2%)  $58.35
                                          TOTAL      $769.95`;
