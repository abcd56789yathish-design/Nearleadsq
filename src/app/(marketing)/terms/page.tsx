import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that govern your use of NearLeadsQ.",
};

export default function TermsPage() {
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: August 24, 2026</p>

      <div className="mt-8 flex flex-col gap-6 text-sm leading-relaxed text-muted-foreground [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-foreground [&_li]:ml-5 [&_li]:list-disc">
        <section>
          <h2>1. The service</h2>
          <p className="mt-2">
            NearLeadsQ is a software tool that searches public OpenStreetMap data for local
            business listings, enriches them with publicly listed contact details found on
            business websites, and helps you organize outreach. You are responsible for how
            you use the results.
          </p>
        </section>

        <section>
          <h2>2. Acceptable use</h2>
          <ul className="mt-2 space-y-1.5">
            <li>Do not use NearLeadsQ to spam, harass or mislead anyone.</li>
            <li>You must comply with all applicable laws when contacting leads, including anti-spam legislation (e.g. CAN-SPAM, CASL, GDPR ePrivacy rules) and WhatsApp&apos;s own Terms of Service.</li>
            <li>Do not resell raw data exports as a standalone dataset.</li>
            <li>Do not attempt to overload, reverse-engineer or abuse the service or the upstream OpenStreetMap APIs it depends on.</li>
          </ul>
        </section>

        <section>
          <h2>3. Data source & licensing</h2>
          <p className="mt-2">
            Business listings are sourced from OpenStreetMap and are licensed under the
            Open Database License (ODbL). If you redistribute substantial portions of the
            data you export, you must attribute OpenStreetMap contributors. See our{" "}
            <a href="/data-sources" className="text-primary hover:underline">
              Data sources &amp; attribution
            </a>{" "}
            page.
          </p>
        </section>

        <section>
          <h2>4. Accounts & billing</h2>
          <p className="mt-2">
            You are responsible for keeping your credentials secure. Paid subscriptions
            renew monthly until cancelled and are billed through Dodo Payments; cancellations take
            effect at the end of the current billing period. We may change pricing with
            reasonable notice; active subscriptions keep their rate until renewal after the
            change.
          </p>
        </section>

        <section>
          <h2>5. Availability & changes</h2>
          <p className="mt-2">
            The service depends on third-party public APIs (OpenStreetMap) that may rate-limit
            or experience downtime. We aim for high availability but provide the service
            &ldquo;as is&rdquo; without warranty of uninterrupted operation.
          </p>
        </section>

        <section>
          <h2>6. Limitation of liability</h2>
          <p className="mt-2">
            To the maximum extent permitted by law, NearLeadsQ is not liable for indirect,
            incidental or consequential damages, lost profits or lost data arising from your
            use of the service, including outcomes of outreach performed using data provided
            by the tool.
          </p>
        </section>

        <section>
          <h2>7. Termination</h2>
          <p className="mt-2">
            We may suspend accounts that violate these terms. You may delete your account at
            any time, which permanently removes your data.
          </p>
        </section>
      </div>
    </article>
  );
}
