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

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "NearLeadsQ", template: "%s | NearLeadsQ" },
  description:
    "Find local business leads, discover public emails, and reach out on WhatsApp — all from one dashboard.",
  keywords: [
    "local lead generation",
    "business leads",
    "email finder",
    "WhatsApp outreach",
    "OpenStreetMap",
    "prospecting tool",
  ],
  openGraph: {
    type: "website",
    siteName: "NearLeadsQ",
    title: "NearLeadsQ — Find local businesses missing websites, emails",
    description:
      "Search a location + category, spot businesses with gaps you can sell to, find public emails on their websites, and reach out via WhatsApp click-to-chat.",
  },
  twitter: {
    card: "summary_large_image",
    title: "NearLeadsQ — Find local businesses missing websites, emails",
    description:
      "Local business search + email finder + WhatsApp outreach in one dashboard. Free to start.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
