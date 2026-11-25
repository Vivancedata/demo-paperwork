import type { Metadata } from "next";
import { getDemo } from "@/demos/registry";

// The page is a client component, so its title and description live here.
const demo = getDemo("paperwork");

export const metadata: Metadata = { title: demo.title, description: demo.description };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
