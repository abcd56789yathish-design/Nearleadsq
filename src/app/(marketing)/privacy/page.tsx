import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How NearLeadsQ collects, uses and protects your data.",
};

export default function PrivacyPage() {
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: August 24, 2026</p>

      <div className="prose-sm mt-8 flex flex-col gap-6 text-sm leading-relaxed text-muted-foreground [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-foreground [&_li]:ml-5 [&_li]:list-disc">
        <section>
          <h2>1. What we collect</h2>
          <ul className="mt-2 space-y-1.5">
            <li><strong className="text-foreground">Account data:</strong> your email address, name (optional) and a securely hashed password.</li>
            <li><strong className="text-foreground">Usage data:</strong> searches you run, leads you save, templates you create and plan/usage information required to operate the service.</li>
            <li><strong className="text-foreground">Billing data:</strong> handled by Stripe. We never see or store your full card details; we only keep a Stripe customer reference.</li>
          </ul>
        </section>

        <section>
          <h2>2. Third-party services</h2>
          <p className="mt-2">
            To provide search results we query public OpenStreetMap services (Nominatim for
            geocoding, Overpass API for business data). When you run email enrichment, our
            servers fetch publicly accessible pages of the websites belonging to the
            businesses in your results. We do not sell this data or share it with anyone
            beyond the providers needed to operate the product.
          </p>
        </section>

        <section>
          <h2>3. What NearLeadsQ does not do</h2>
          <ul className="mt-2 space-y-1.5">
            <li>We do not send messages on your behalf — WhatsApp outreach happens manually from your own WhatsApp account via click-to-chat links.</li>
            <li>We do not scrape private accounts, bypass paywalls or access non-public data.</li>
            <li>We do not build profiles of individuals; the product deals exclusively with publicly listed business contact details.</li>
          </ul>
        </section>

        <section>
          <h2>4. Data retention & deletion</h2>
          <p className="mt-2">
            Your leads, searches and templates are retained while your account is active.
            Deleting your account permanently removes all associated data from our database.
          </p>
        </section>

        <section>
          <h2>5. Cookies</h2>
          <p className="mt-2">
            We use a single session cookie required to keep you signed in. We do not use
            advertising or cross-site tracking cookies.
          </p>
        </section>

        <section>
          <h2>6. Contact</h2>
          <p className="mt-2">
            Questions about this policy? Reach out through the in-app support channel or at
            the contact address listed on our Terms of Service.
          </p>
        </section>
      </div>
    </article>
  );
}
