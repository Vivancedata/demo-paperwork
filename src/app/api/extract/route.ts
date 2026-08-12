import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { EXTRACTION_SCHEMA } from "@/lib/schema";

export const maxDuration = 120;

const SYSTEM = `You extract structured records from construction, trades and
logistics paperwork: delivery slips, invoices, permits, submittals, work orders.

Rules that are the product, not suggestions:
- Transcribe only what the document actually says. Never infer a vendor,
  amount, date or job number that is not on the page.
- Anything illegible, ambiguous or cut off goes in flagged_as_unreadable,
  verbatim as best you can render it, with a location hint. Flagging is
  correct behaviour; guessing is a defect.
- If a required field is simply absent from the document, use an empty string.
- Keep amounts exactly as written (currency symbols, separators) — no
  normalisation, since downstream accounting systems disagree about formats.`;

type Payload = {
  text?: string;
  image?: { media_type: "image/jpeg" | "image/png" | "image/webp"; data: string };
};

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured on the server." },
      { status: 503 },
    );
  }

  const limit = rateLimit(request);
  if (!limit.ok) {
    return NextResponse.json(
      { error: `Rate limited — try again in ${limit.retryAfterSec}s. This demo allows 10 extractions per 10 minutes.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    );
  }

  let payload: Payload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON." }, { status: 400 });
  }

  if (typeof payload.text === "string" && payload.text.length > 20_000) {
    return NextResponse.json({ error: "Text too long (20k characters max)." }, { status: 413 });
  }
  const hasText = typeof payload.text === "string" && payload.text.trim().length > 0;
  const hasImage = Boolean(payload.image?.data && payload.image.media_type);
  if (!hasText && !hasImage) {
    return NextResponse.json(
      { error: "Provide `text` or `image` to extract from." },
      { status: 400 },
    );
  }
  // ~7MB base64 ≈ 5MB image, Claude's per-image ceiling.
  if (hasImage && payload.image!.data.length > 7_000_000) {
    return NextResponse.json({ error: "Image too large (5MB max)." }, { status: 413 });
  }

  const content: Anthropic.ContentBlockParam[] = hasImage
    ? [
        {
          type: "image",
          source: {
            type: "base64",
            media_type: payload.image!.media_type,
            data: payload.image!.data,
          },
        },
        { type: "text", text: "Extract this document into the record schema." },
      ]
    : [
        {
          type: "text",
          text: `Extract this document into the record schema.\n\n<document>\n${payload.text}\n</document>`,
        },
      ];

  const client = new Anthropic();
  try {
    const response = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 8000,
      system: SYSTEM,
      messages: [{ role: "user", content }],
      output_config: {
        format: { type: "json_schema", schema: EXTRACTION_SCHEMA },
      },
    });

    const text = response.content.find((b) => b.type === "text");
    if (!text || text.type !== "text") {
      return NextResponse.json({ error: "Model returned no output." }, { status: 502 });
    }
    // output_config guarantees the text parses against EXTRACTION_SCHEMA.
    return NextResponse.json({ record: JSON.parse(text.text) });
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      const friendly =
        error instanceof Anthropic.AuthenticationError
          ? "The server's API key was rejected."
          : error instanceof Anthropic.RateLimitError
            ? "Rate limited — try again in a moment."
            : `Extraction failed (${error.status}).`;
      return NextResponse.json({ error: friendly }, { status: 502 });
    }
    throw error;
  }
}
