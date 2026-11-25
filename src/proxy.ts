import { NextResponse, type NextRequest } from "next/server";
import { demoForHost } from "@/demos/registry";

/**
 * Keeps each demo's own domain working after the merge: a visit to `/` on
 * paperwork.vivancedata.com (or a project with DEMO=paperwork) is rewritten to
 * /paperwork, so the URL in the address bar does not change. Anywhere else,
 * `/` falls through to the index page.
 */
export function proxy(request: NextRequest) {
  const demo = demoForHost(request.headers.get("host"));
  if (!demo) return NextResponse.next();
  return NextResponse.rewrite(new URL(`/${demo}`, request.url));
}

export const config = { matcher: "/" };
