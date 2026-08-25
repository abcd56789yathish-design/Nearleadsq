import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Data Sources & Attribution",
  description:
    "Where NearLeadsQ business data comes from (OpenStreetMap), licensing requirements and responsible-use notes.",
};

export default function DataSourcesPage() {
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Data sources &amp; attribution</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Transparency about where NearLeadsQ data comes from and what you can do with it.
      </p>

      <div className="mt-8 flex flex-col gap-6 text-sm leading-relaxed text-muted-foreground [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-foreground [&_li]:ml-5 [&_li]:list-disc">
        <section>
          <h2>Business listings — OpenStreetMap</h2>
          <p className="mt-2">
            All business listings come live from{" "}
            <a
              href="https://www.openstreetmap.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              OpenStreetMap
            </a>
            , the free, editable map of the world maintained by a community of millions of
            contributors. We query its public geocoding service (Nominatim) and data API
            (Overpass) on every search.
          </p>
          <p className="mt-2 rounded-md border border-border bg-card p-3">
            Map data © OpenStreetMap contributors, available under the{" "}
            <a
              href="https://opendatacommons.org/licenses/odbl/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Open Database License (ODbL)
            </a>
            .
          </p>
          <p className="mt-2">
            If you redistribute NearLeadsQ exports that contain substantial amounts of
            OSM-derived data, the ODbL requires you to credit &ldquo;© OpenStreetMap
            contributors&rdquo; and share alike under the same license.
          </p>
        </section>

        <section>
          <h2>Email addresses — public websites</h2>
          <p className="mt-2">
            The email finder visits publicly accessible pages of business websites that
            appear in your search results (typically the homepage and contact/about pages)
            and extracts email addresses published there for visitors. It does not access
            private accounts, bypass authentication or collect personal data beyond what a
            business has chosen to display publicly.
          </p>
        </section>

        <section>
          <h2>Responsible outreach</h2>
          <ul className="mt-2 space-y-1.5">
            <li>NearLeadsQ generates WhatsApp click-to-chat links only — messages are always sent manually by you, from your own account.</li>
            <li>Identify yourself honestly, respect opt-out requests immediately, and check your jurisdiction&apos;s rules on business-to-business electronic contact.</li>
            <li>When a lead asks not to be contacted again, record it in NearLeadsQ and honor it.</li>
          </ul>
        </section>
      </div>
    </article>
  );
}
