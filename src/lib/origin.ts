import { DEMOS } from "@/demos/registry";

/**
 * Origin allowlist for the endpoints that cost money.
 *
 * The extract routes are meant to be called by the demo pages, not by
 * scripts elsewhere on the internet spending the Anthropic key. Browsers send
 * `Origin` on every POST (and `Referer` on most), so a request whose origin is
 * not one of the demos' hosts is refused with 403. A determined caller can
 * forge these headers from a server, so this is a cheap filter that sits in
 * front of the per-IP rate limit, not authentication.
 *
 * Allowed:
 * - every demo's production hosts (src/demos/registry.ts);
 * - this deployment's own Vercel URLs (VERCEL_URL, VERCEL_BRANCH_URL,
 *   VERCEL_PROJECT_PRODUCTION_URL), so preview deployments work;
 * - any extra hosts in ALLOWED_ORIGINS (comma-separated hostnames);
 * - localhost / 127.0.0.1 when NODE_ENV is not "production" (`next dev`).
 */
const PRODUCTION_HOSTS = DEMOS.flatMap((d) => d.hosts);

function allowedHosts(): Set<string> {
  const hosts = new Set<string>(PRODUCTION_HOSTS);
  for (const v of [
    process.env.VERCEL_URL,
    process.env.VERCEL_BRANCH_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    ...(process.env.ALLOWED_ORIGINS ?? "").split(","),
  ]) {
    const host = v?.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "").toLowerCase();
    if (host) hosts.add(host);
  }
  return hosts;
}

function hostOf(value: string | null): string | null {
  if (!value) return null;
  try {
    return new URL(value).host.toLowerCase();
  } catch {
    return null;
  }
}

export function isAllowedOrigin(request: Request): boolean {
  const host =
    hostOf(request.headers.get("origin")) ?? hostOf(request.headers.get("referer"));
  if (!host) return false;

  if (process.env.NODE_ENV !== "production") {
    const hostname = host.replace(/:\d+$/, "");
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]") {
      return true;
    }
  }
  return allowedHosts().has(host);
}
