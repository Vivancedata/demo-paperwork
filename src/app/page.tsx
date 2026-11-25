import Link from "next/link";
import { DEMOS } from "@/demos/registry";

// Shown at `/` only when the host is not one of the demos' own domains and no
// DEMO env var is set (see src/proxy.ts), e.g. on a preview deployment.
export default function Index() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-label uppercase text-mute">
        <span translate="no">Vivancedata</span> demos
      </p>
      <h1 className="mt-4 font-display text-serif-lg text-balance">Pick a demo</h1>
      <ul className="mt-10 space-y-6">
        {DEMOS.map((demo) => (
          <li key={demo.id} className="border-t border-border pt-6">
            <Link
              className="text-lg text-foreground underline decoration-rule underline-offset-4 hover:decoration-current"
              href={`/${demo.id}`}
            >
              {demo.title.replace(/ — Vivancedata$/, "")}
            </Link>
            <p className="mt-2 max-w-prose text-muted-foreground">{demo.description}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
