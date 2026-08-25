import Link from "next/link";
import {
  Search,
  Mail,
  MessageCircle,
  SlidersHorizontal,
  Download,
  ListChecks,
  Building2,
  Globe2,
  Phone,
  ArrowRight,
  Check,
  AlertTriangle,
} from "lucide-react";
import { auth } from "@/auth";
import { PLANS } from "@/lib/plans";
import { Reveal } from "@/components/marketing/reveal";
import { TaglineReveal } from "@/components/marketing/tagline-reveal";

const BENEFITS = [
  {
    icon: SlidersHorizontal,
    title: "Spot the gap instantly",
    body: "Filter any search down to businesses with no website, a missing email or an unlisted phone number. The opportunity is visible before you read a single row.",
  },
  {
    icon: Mail,
    title: "Public emails without busywork",
    body: "The enrichment crawler reads each business website, including contact and about pages, and pulls publicly listed addresses in bulk while you watch progress.",
  },
  {
    icon: MessageCircle,
    title: "First contact in one click",
    body: "Every lead becomes a WhatsApp chat you open from your own number. Templates with variables personalize the message so outreach takes seconds, not minutes.",
  },
  {
    icon: ListChecks,
    title: "A pipeline that reminds you",
    body: "Track each lead from new to won, leave notes on every interaction and set follow up dates so warm replies never go cold.",
  },
  {
    icon: Building2,
    title: "Ready for client work",
    body: "Workspaces keep every client leads, templates and pipeline separate. One dashboard for your whole roster.",
  },
  {
    icon: Download,
    title: "Your data stays yours",
    body: "Import existing lists from CSV and export everything back out whenever you want. No lock in, ever.",
  },
];

const STEPS = [
  {
    icon: Search,
    title: "Search a territory",
    body: 'Type a location such as "Austin, TX", pick a category like dentists or restaurants and set your radius.',
  },
  {
    icon: Mail,
    title: "Enrich with emails",
    body: "Run bulk enrichment and watch NearLeadsQ find public emails across each business website in real time.",
  },
  {
    icon: MessageCircle,
    title: "Reach out and follow up",
    body: "Send personalized WhatsApp messages from your own number and track every reply through your pipeline.",
  },
];

const FAQS = [
  {
    q: "Where does the business data come from?",
    a: "OpenStreetMap, the collaborative world map used by millions. We query it live for every search, so results reflect the map as it exists today rather than a stale database.",
  },
  {
    q: "How fresh is the data?",
    a: "Every search runs against OpenStreetMap in real time. Nothing is cached between searches, so a listing added yesterday can appear in today's results.",
  },
  {
    q: "Is this compliant for cold outreach?",
    a: "NearLeadsQ only finds publicly listed contact details and generates WhatsApp click to chat links. Messages are sent manually by you from your own account. Always follow your local anti spam and privacy laws when contacting leads.",
  },
  {
    q: "Do I need the WhatsApp Business API?",
    a: "No. NearLeadsQ opens wa.me links and conversations happen in your normal WhatsApp app. There is nothing to integrate and no per message fees.",
  },
  {
    q: "What counts against the free plan limit?",
    a: "Leads stored in your account. The Starter plan includes up to 50 stored leads, one workspace and full access to search, enrichment and outreach features.",
  },
  {
    q: "What happens when I reach my lead limit?",
    a: "You can still search, preview results and export what you have. New saves unlock again when you delete leads or upgrade your plan for more storage.",
  },
  {
    q: "Can I import my existing lead lists?",
    a: "Yes. Upload a CSV with business names, websites, phones and emails. NearLeadsQ deduplicates against your current leads automatically.",
  },
  {
    q: "Can I manage multiple clients?",
    a: "Yes. Growth includes 3 client workspaces, and Agency includes unlimited workspaces — so agencies can keep each client's leads, templates and pipeline completely separate.",
  },
];

const MOCK_ROWS = [
  {
    name: "Bright Smile Dental",
    detail: "South Congress · dentist",
    badge: { label: "Missing email", tone: "warning" as const },
    status: { label: "New", tone: "muted" as const },
  },
  {
    name: "Austin Family Dentistry",
    detail: "East Austin · dentist",
    badge: { label: "Email found", tone: "success" as const },
    status: { label: "Contacted", tone: "primary" as const },
  },
  {
    name: "Lakeway Dental Studio",
    detail: "Lakeway · dentist",
    badge: { label: "No website", tone: "warning" as const },
    status: { label: "New", tone: "muted" as const },
  },
];

export default async function LandingPage() {
  const session = await auth();
  const ctaHref = session?.user ? "/dashboard" : "/signup";
  const ctaLabel = session?.user ? "Open dashboard" : "Start free, no card required";
  const cta = { href: ctaHref, label: ctaLabel };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden pb-16 md:pb-24">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center px-4 text-center">
          <p className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            Built for agencies, freelancers and local sales teams
          </p>
          <h1 className="mt-6 max-w-[680px] bg-gradient-to-r from-black to-[#666666] bg-clip-text text-4xl leading-tight font-bold tracking-tight text-transparent md:text-6xl dark:from-white dark:to-[#9b9b9b]">
            Find local businesses missing websites, emails.
          </h1>
          <p className="mt-6 max-w-[680px] text-base text-muted-foreground md:text-lg">
            NearLeadsQ scans every business around your chosen location, flags the ones
            with gaps you can sell to, uncovers public email addresses and opens a
            WhatsApp conversation in one click.
          </p>
          <Link
            href={cta.href}
            className="mt-8 inline-flex h-10 items-center gap-2 rounded-md bg-primary px-6 py-2 text-base font-semibold text-primary-foreground shadow-xs transition-all duration-300 ease-fluid hover:bg-primary/90 active:scale-[0.98]"
          >
            {cta.label}
            <ArrowRight />
          </Link>

          {/* Hero visual: product mock */}
          <Reveal className="mt-14 w-full max-w-3xl">
            <div className="rounded-lg border border-border bg-card p-4 text-left shadow-xs md:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4">
                <p className="text-sm font-semibold">Dentists within 5 km of Austin, TX</p>
                <div className="flex gap-2" aria-hidden>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/40 bg-warning/10 px-3 py-1 text-xs font-medium text-warning">
                    <Globe2 className="size-3.5" />
                    No website
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/40 bg-warning/10 px-3 py-1 text-xs font-medium text-warning">
                    <Mail className="size-3.5" />
                    Missing email
                  </span>
                  <span className="hidden items-center gap-1.5 rounded-full border border-warning/40 bg-warning/10 px-3 py-1 text-xs font-medium text-warning sm:inline-flex">
                    <Phone className="size-3.5" />
                    Unlisted phone
                  </span>
                </div>
              </div>
              <ul aria-hidden>
                {MOCK_ROWS.map((row) => (
                  <li
                    key={row.name}
                    className="flex items-center justify-between gap-3 border-b border-border/60 py-4 last:border-b-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{row.name}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{row.detail}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                          row.badge.tone === "warning"
                            ? "bg-warning/10 text-warning"
                            : "bg-success/10 text-success"
                        }`}
                      >
                        {row.badge.tone === "warning" && <AlertTriangle className="size-3" />}
                        {row.badge.label}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          row.status.tone === "primary"
                            ? "bg-accent text-accent-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {row.status.label}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="pt-4 text-xs text-muted-foreground">
                38 businesses found · 12 flagged with a gap you can sell to
              </p>
            </div>
          </Reveal>

          {/* Proof signal */}
          <dl className="mt-12 grid w-full max-w-3xl grid-cols-3 gap-4 text-center">
            {[
              ["25+", "curated categories"],
              [`${PLANS.FREE.leadLimit}`, "free stored leads"],
              ["Live", "OpenStreetMap data"],
            ].map(([value, label]) => (
              <Reveal key={label}>
                <div className="rounded-lg border border-border bg-card p-4 shadow-xs transition-colors duration-300 ease-fluid hover:bg-secondary/50">
                  <dt className="sr-only">{label}</dt>
                  <dd className="text-xl font-bold md:text-2xl">{value}</dd>
                  <dd className="mt-0.5 text-xs text-muted-foreground md:text-sm">{label}</dd>
                </div>
              </Reveal>
            ))}
          </dl>
        </div>
      </section>

      {/* Tagline reveal */}
      <section className="border-t border-border">
        <div className="mx-auto w-full max-w-4xl px-4 py-24 md:py-32">
          <TaglineReveal
            text="Every business on the map is somebody's next client. NearLeadsQ shows you which ones are already waiting for a call."
          />
        </div>
      </section>

      {/* Problem to solution */}
      <section id="problem" className="border-t border-border bg-card/40">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
          <Reveal>
            <h2 className="text-3xl font-bold tracking-tight">Prospecting by hand is a second job</h2>
            <ul className="mt-6 space-y-4 text-sm text-muted-foreground">
              {[
                "Hours lost copying listings from maps into spreadsheets.",
                "Generic lead dumps full of stale numbers and dead domains.",
                "Outreach tools that send messages you cannot control or personalize.",
                "Follow ups tracked in your head until they quietly disappear.",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={150}>
            <h2 className="text-3xl font-bold tracking-tight">One dashboard closes the loop</h2>
            <ul className="mt-6 space-y-4 text-sm">
              {[
                "Search a city and category, see matching businesses in seconds.",
                "Filter straight to the businesses with a gap you can fix.",
                "Bulk enrich public emails with progress you can watch.",
                "Message over WhatsApp from your own number and track every reply.",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Check className="mt-0.5 size-4 shrink-0 text-success" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href={cta.href}
              className="mt-8 inline-flex h-10 items-center gap-2 rounded-md bg-primary px-6 py-2 text-base font-semibold text-primary-foreground transition-all duration-300 ease-fluid hover:bg-primary/90 active:scale-[0.98]"
            >
              Try it free
              <ArrowRight />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* Benefits */}
      <section id="features" className="border-t border-border">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 md:py-24">
          <Reveal>
            <h2 className="text-center text-3xl font-bold tracking-tight">
              Everything between the question and the conversation
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
              Most tools stop at a scraped list. NearLeadsQ covers discovery, enrichment
              and first contact in one place.
            </p>
          </Reveal>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map(({ icon: Icon, title, body }, i) => (
              <Reveal key={title} delay={(i % 3) * 100}>
                <div className="h-full rounded-lg border border-border bg-card p-6 shadow-xs transition-all duration-500 ease-fluid hover:-translate-y-1 hover:border-primary/40">
                  <span className="flex size-9 items-center justify-center rounded-full bg-accent text-accent-foreground">
                    <Icon className="size-4" />
                  </span>
                  <h3 className="mt-4 font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t border-border bg-card/40">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 md:py-24">
          <Reveal>
            <h2 className="text-center text-3xl font-bold tracking-tight">How it works</h2>
          </Reveal>
          <div className="mt-12 grid gap-10 md:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, body }, i) => (
              <Reveal key={title} delay={i * 120}>
                <div className="flex flex-col items-start gap-4">
                  <span className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="font-semibold">{`${i + 1}. ${title}`}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-border">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 md:py-24">
          <Reveal>
            <h2 className="text-center text-3xl font-bold tracking-tight">Simple pricing, start free</h2>
            <p className="mx-auto mt-4 max-w-xl text-center text-muted-foreground">
              No credit card to sign up. Upgrade only when your pipeline outgrows the
              free plan.
            </p>
          </Reveal>
          <div className="mx-auto mt-12 grid max-w-5xl gap-4 md:grid-cols-3">
            {(["FREE", "GROWTH", "AGENCY"] as const).map((key, idx) => {
              const plan = PLANS[key];
              const isGrowth = key === "GROWTH";
              return (
                <Reveal key={key} delay={idx * 100} className="h-full">
                  <div
                    className={`relative h-full rounded-lg border bg-card p-6 shadow-xs transition-colors duration-500 ease-fluid ${
                      isGrowth ? "border-primary ring-1 ring-primary/30" : "border-border hover:bg-secondary/40"
                    }`}
                  >
                    {isGrowth && (
                      <span className="absolute top-0 right-6 -translate-y-1/2 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                        Most popular
                      </span>
                    )}
                    <p className="font-semibold">{plan.label}</p>
                    <p className="mt-3 flex items-baseline gap-1">
                      <span className="text-3xl font-bold tracking-tight">{plan.priceLabel}</span>
                      {key !== "FREE" && <span className="text-sm text-muted-foreground">per month</span>}
                    </p>
                    <ul className="mt-6 space-y-2.5 text-sm">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2">
                          <Check className="mt-0.5 size-4 shrink-0 text-success" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={key === "FREE" ? cta.href : plan.cta.href}
                      className={`mt-8 inline-flex h-10 w-full items-center justify-center rounded-md py-2 text-base font-semibold transition-all duration-300 ease-fluid active:scale-[0.98] ${
                        isGrowth
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : "border border-border bg-background hover:bg-secondary"
                      }`}
                    >
                      {key === "FREE" ? cta.label : plan.cta.label}
                    </Link>
                  </div>
                </Reveal>
              );
            })}
          </div>
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Free plan forever. Upgrade anytime, cancel anytime.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-border bg-card/40">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
        <div className="mx-auto w-full max-w-3xl px-4 py-16 md:py-24">
          <Reveal>
            <h2 className="text-center text-3xl font-bold tracking-tight">Frequently asked questions</h2>
          </Reveal>
          <Reveal delay={100}>
            <div className="mt-12 divide-y divide-border rounded-lg border border-border bg-card">
              {FAQS.map((item) => (
                <details
                  key={item.q}
                  className="group px-6 py-4 [&_summary::-webkit-details-marker]:hidden"
                >
                  <summary className="flex cursor-pointer items-center justify-between gap-4 text-sm font-medium transition-colors duration-300 ease-fluid group-open:text-primary">
                    {item.q}
                    <span className="text-muted-foreground transition-transform duration-500 ease-fluid group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
                </details>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center px-4 py-24 text-center md:py-32">
          <h2 className="max-w-[680px] bg-gradient-to-r from-black to-[#666666] bg-clip-text text-3xl font-bold tracking-tight text-transparent md:text-4xl dark:from-white dark:to-[#9b9b9b]">
            Your territory is already mapped. Claim it first.
          </h2>
          <p className="mt-4 max-w-xl text-muted-foreground">
            Run your first search in under a minute. Free forever plan, no credit card,
            cancel anytime.
          </p>
          <Link
            href={cta.href}
            className="mt-8 inline-flex h-10 items-center gap-2 rounded-md bg-primary px-6 py-2 text-base font-semibold text-primary-foreground shadow-xs transition-all duration-300 ease-fluid hover:bg-primary/90 active:scale-[0.98]"
          >
            {cta.label}
            <ArrowRight />
          </Link>
        </div>
      </section>
    </>
  );
}
