import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const viewport = {
  userScalable: "no",
  initialScale: 1,
  maximumScale: 1,
  width: "device-width",
};

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "redbtn",
  description:
    "Redbtn.io offers expert digital consulting and development services for businesses, including web, native, APIs, automation, SEO, and marketing solutions.",
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
        <meta property="og:title" content="redbtn" />
        <meta
          property="og:description"
          content="Redbtn.io offers expert digital consulting and development services for businesses, including web, native, APIs, automation, SEO, and marketing solutions."
        />
        <meta property="og:url" content="https://redbtn.io/" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://redbtn.io/red.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="redbtn" />
        <meta
          name="twitter:description"
          content="Redbtn.io offers expert digital consulting and development services for businesses, including web, native, APIs, automation, SEO, and marketing solutions."
        />
        <meta name="twitter:image" content="https://redbtn.io/red.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
