import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { DEMOS, demoForHost } from "@/demos/registry";
import { proxy } from "@/proxy";

describe("demoForHost", () => {
  it("maps each demo's own domains to that demo", () => {
    expect(demoForHost("paperwork.vivancedata.com", undefined)).toBe("paperwork");
    expect(demoForHost("demo-missed-call.vercel.app", undefined)).toBe("missed-call");
    expect(demoForHost("Field.Vivancedata.com:443", undefined)).toBe("field-photos");
  });

  it("falls back to the DEMO env var, then to no demo", () => {
    expect(demoForHost("preview-abc.vercel.app", "missed-call")).toBe("missed-call");
    expect(demoForHost("preview-abc.vercel.app", "nonsense")).toBeNull();
    expect(demoForHost(null, undefined)).toBeNull();
  });

  it("a host match wins over DEMO", () => {
    expect(demoForHost("calls.vivancedata.com", "paperwork")).toBe("missed-call");
  });

  it("gives every demo at least one host and no host to two demos", () => {
    const all = DEMOS.flatMap((d) => d.hosts);
    expect(new Set(all).size).toBe(all.length);
    for (const d of DEMOS) expect(d.hosts.length).toBeGreaterThan(0);
  });
});

describe("proxy", () => {
  it("rewrites / to the demo for that host, keeping the URL", () => {
    const res = proxy(new NextRequest("https://calls.vivancedata.com/", { headers: { host: "calls.vivancedata.com" } }));
    expect(res.headers.get("x-middleware-rewrite")).toBe("https://calls.vivancedata.com/missed-call");
  });

  it("leaves / alone on an unknown host so the index shows", () => {
    const res = proxy(new NextRequest("https://preview-abc.vercel.app/", { headers: { host: "preview-abc.vercel.app" } }));
    expect(res.headers.get("x-middleware-rewrite")).toBeNull();
  });
});
