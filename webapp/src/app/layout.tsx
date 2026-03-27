import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport = {
  userScalable: "no",
  initialScale: 1,
  maximumScale: 1,
  width: "device-width",
};

export const metadata: Metadata = {
  title: "redbtn — AI-powered tools, infrastructure, and automation",
  description:
    "One platform, one AI assistant, everything connected. Build automations, deploy apps, and manage infrastructure with Red — the universal AI that lives across every redbtn app.",
  keywords: [
    "redbtn",
    "AI",
    "automation",
    "infrastructure",
    "Red",
    "LangChain",
    "LangGraph",
    "serverless",
    "FaaS",
    "deploy",
  ],
  authors: [{ name: "redbtn", url: "https://redbtn.io" }],
  openGraph: {
    title: "redbtn — AI-powered tools, infrastructure, and automation",
    description:
      "Meet Red, the universal AI assistant. Build graphs, deploy apps, create documents, manage fleets — all through conversation.",
    url: "https://redbtn.io/",
    siteName: "redbtn",
    type: "website",
    images: [
      {
        url: "https://redbtn.io/red.png",
        width: 512,
        height: 512,
        alt: "redbtn",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "redbtn — AI-powered tools, infrastructure, and automation",
    description:
      "Meet Red, the universal AI assistant. Build graphs, deploy apps, create documents, manage fleets — all through conversation.",
    images: ["https://redbtn.io/red.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="canonical" href="https://redbtn.io/" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
