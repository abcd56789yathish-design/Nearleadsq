import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";
import { IslandNav } from "@/components/marketing/island-nav";

export const metadata: Metadata = {
  title: {
    default: "NearLeadsQ — Find local businesses missing websites, emails",
    template: "%s | NearLeadsQ",
  },
  description:
    "Search any location + category, spot businesses with gaps you can sell to, find public emails on their websites, and reach out via WhatsApp click-to-chat.",
};

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[70] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <IslandNav authed={Boolean(session?.user)} />

      <main id="main-content" className="flex-1 pt-24">
        {children}
      </main>

      <footer className="mt-16 border-t border-border">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 text-sm sm:grid-cols-2 md:grid-cols-4">
          <div>
            <p className="flex items-center gap-2 font-semibold">
              <span className="flex h-6 items-center rounded-md bg-white p-0.5 shadow-xs ring-1 ring-border">
                <Image
                  src="/logo.png"
                  alt=""
                  width={1408}
                  height={768}
                  className="h-4 w-auto object-contain"
                />
              </span>
              NearLeadsQ
            </p>
            <p className="mt-2 text-muted-foreground">
              Local lead generation for small businesses, agencies and solo sales teams.
            </p>
          </div>
          <div>
            <p className="font-medium">Product</p>
            <ul className="mt-2 space-y-1.5 text-muted-foreground">
              <li><Link href="/#features" className="transition-colors duration-300 ease-fluid hover:text-foreground">Features</Link></li>
              <li><Link href="/#pricing" className="transition-colors duration-300 ease-fluid hover:text-foreground">Pricing</Link></li>
              <li><Link href="/signup" className="transition-colors duration-300 ease-fluid hover:text-foreground">Create account</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-medium">Legal</p>
            <ul className="mt-2 space-y-1.5 text-muted-foreground">
              <li><Link href="/privacy" className="transition-colors duration-300 ease-fluid hover:text-foreground">Privacy policy</Link></li>
              <li><Link href="/terms" className="transition-colors duration-300 ease-fluid hover:text-foreground">Terms of service</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-medium">Data</p>
            <ul className="mt-2 space-y-1.5 text-muted-foreground">
              <li><Link href="/data-sources" className="transition-colors duration-300 ease-fluid hover:text-foreground">Data sources & attribution</Link></li>
              <li>
                <a
                  href="https://www.openstreetmap.org/copyright"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors duration-300 ease-fluid hover:text-foreground"
                >
                  © OpenStreetMap contributors
                </a>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
