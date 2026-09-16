import type { Metadata } from "next";
import AppsGrid from "./AppsGrid";

export const metadata: Metadata = {
  title: "apps | redbtn",
  description: "Every redbtn app, partner platform, site and service.",
  robots: { index: false, follow: false },
};

export default function AppsPage() {
  return <AppsGrid />;
}
