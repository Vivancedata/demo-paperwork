/**
 * The three demos this app serves, one route each (/paperwork, /missed-call,
 * /field-photos), plus the hosts that land on each one.
 *
 * `hosts` does two jobs: src/proxy.ts sends a visitor on that host from `/` to
 * the demo's route, so the old per-demo domains keep working unchanged, and
 * src/lib/origin.ts accepts POSTs from those hosts.
 */
export type DemoId = "paperwork" | "missed-call" | "field-photos";

export type Demo = {
  id: DemoId;
  title: string;
  description: string;
  hosts: readonly string[];
};

export const DEMOS: readonly Demo[] = [
  {
    id: "paperwork",
    title: "Paperwork demo — Vivancedata",
    description:
      "Drop a delivery slip, invoice or permit and watch it become a structured record. Illegible parts get flagged, not guessed at.",
    hosts: ["paperwork.vivancedata.com", "demo-paperwork.vercel.app"],
  },
  {
    id: "missed-call",
    title: "Missed-call demo — Vivancedata",
    description:
      "The 9pm voicemail becomes a triaged, bookable job instead of a lost customer. Browser simulation of the phone-line service.",
    hosts: ["calls.vivancedata.com", "demo-missed-call.vercel.app"],
  },
  {
    id: "field-photos",
    title: "Field photos demo — Vivancedata",
    description:
      "A site photo or scrawled note, matched to the right job. No confident match means no match — never the wrong job.",
    hosts: ["field.vivancedata.com", "demo-field-photos.vercel.app"],
  },
];

export function getDemo(id: DemoId): Demo {
  const demo = DEMOS.find((d) => d.id === id);
  if (!demo) throw new Error(`Unknown demo: ${id}`);
  return demo;
}

/**
 * Which demo `/` should show for this request: the one whose host it is, else
 * the DEMO environment variable (so a Vercel project can be pinned to one demo
 * whatever its domain), else none, and `/` shows the index of all three.
 */
export function demoForHost(host: string | null, envDemo = process.env.DEMO): DemoId | null {
  const h = host?.toLowerCase().replace(/:\d+$/, "") ?? "";
  const byHost = DEMOS.find((d) => d.hosts.includes(h));
  if (byHost) return byHost.id;
  const byEnv = DEMOS.find((d) => d.id === envDemo?.trim());
  return byEnv ? byEnv.id : null;
}
