import type { Metadata } from "next";
import AppsGrid from "./AppsGrid";

export const metadata: Metadata = {
  title: "apps | redbtn",
  description: "Every redbtn app, partner platform, site and service.",
  alternates: { canonical: "https://redbtn.io/apps" },
  openGraph: {
    title: "apps | redbtn",
    description: "Every redbtn app, partner platform, site and service.",
    url: "https://redbtn.io/apps",
    siteName: "redbtn",
    type: "website",
  },
};

export default function AppsPage() {
  return <AppsGrid />;
}
