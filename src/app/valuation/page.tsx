import type { Metadata } from "next";
import { Ban, BarChart3, CheckCircle2, ClipboardList, Coins, Gauge, ShieldCheck, TrendingUp } from "lucide-react";
import Container from "@/components/ui/Container";
import ValuationForm from "./ValuationForm";

// Sep 27, 2026 build — real interactive valuation tool + lead capture,
// replacing the dead /contact?subject=valuation link every "Get a free
// valuation" button on /sell used to point to. See
// claude/free-valuation-lead-gen-addendum.md and src/lib/valuation.ts for
// the methodology, and 058_valuation_leads.sql for where submissions land.
export const metadata: Metadata = {
  title: "Free Business Valuation | Durqo",
  description: "Get a free, instant estimate of what your digital business could sell for on Durqo, based on your revenue, profit and business type.",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "Durqo",
    title: "Free Business Valuation | Durqo",
    description: "Get a free, instant estimate of what your digital business could sell for on Durqo.",
    url: "https://www.durqo.com/valuation",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Business Valuation | Durqo",
    description: "Get a free, instant estimate of what your digital business could sell for on Durqo.",
  },
  alternates: { canonical: "https://www.durqo.com/valuation" },
};

function Inner({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-[1200px] ${className}`}>{children}</div>;
}

// Sep 27, 2026: only real, factual claims here — no invented usage stats
// (e.g. a fake "X,000+ businesses valued" count) since this is the tool's
// first release and Durqo has no such number to point to yet.
const TRUST_POINTS = [
  { icon: TrendingUp, label: "Instant estimate" },
  { icon: Ban, label: "No obligation" },
  { icon: Coins, label: "Free, always" },
  { icon: ShieldCheck, label: "100% confidential" },
];

// Sep 27, 2026 (design pass): a few representative multiples pulled straight
// from CATEGORY_MULTIPLES in src/lib/valuation.ts - real numbers the
// calculator itself uses, not invented marketing figures - shown as a quick
// visual hook in the hero.
const MULTIPLE_HIGHLIGHTS = [
  { label: "Websites", range: "2.5–4x" },
  { label: "SaaS", range: "3–5x" },
  { label: "YouTube channels", range: "2–3.5x" },
];

const ESTIMATE_STEPS = [
  {
    icon: ClipboardList,
    title: "Share your numbers",
    body: "Revenue, profit, business category and age - takes under a minute, no account needed.",
  },
  {
    icon: BarChart3,
    title: "We apply real sale multiples",
    body: "We compare your numbers against typical multiples for similar businesses that sell on Durqo.",
  },
  {
    icon: Gauge,
    title: "Get your instant range",
    body: "A quick starting reference - not a formal appraisal, an offer, or a guarantee.",
  },
];

export default function ValuationPage() {
  return (
    <main>
      <section className="relative overflow-hidden border-b border-rule bg-brand-strong py-16 sm:py-20 lg:py-24">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand/10 blur-3xl"
          aria-hidden
        />
        <Container className="relative">
          <Inner>
            {/* items-center (not items-start): the form card's height grows
                with the category-specific field, so pinning the left copy
                to the top left a large dead gap under the trust checklist
                on desktop once the card got taller than the copy block.
                Sep 27, 2026: tried a fixed lg:-mt-16 nudge to settle the
                left column a bit higher, but ValuationForm's own height
                swings a lot between its three steps (tallest on "business",
                shortest on "contact") - a fixed offset calibrated against
                the tall step overcorrected badly on the short one, pushing
                the copy way above center. Plain items-center self-adjusts
                to whichever step is showing, so it stays back to that. */}
            <div className="grid items-center gap-10 lg:grid-cols-[0.46fr_0.54fr] lg:gap-x-14">
              <div>
                <p className="mono mb-4 flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wider text-white/70">
                  <span className="h-px w-6 bg-brand" aria-hidden />
                  Free valuation tool
                </p>
                <h1 className="max-w-[16ch] text-4xl leading-[1.1] text-white sm:text-5xl">
                  What could your business <span className="text-brand">sell for?</span>
                </h1>
                <p className="mt-5 max-w-[46ch] text-lg leading-relaxed text-white/70">
                  Share a few numbers and get an instant estimate of your business&rsquo;s value, based on how similar
                  businesses sell on Durqo.
                </p>

                <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2.5 border-t border-white/10 pt-6">
                  {["Takes under a minute", "No account required", "See real buyer demand after"].map((label) => (
                    <span key={label} className="flex items-center gap-1.5 text-xs font-medium text-white/70">
                      <CheckCircle2 size={14} className="text-brand" />
                      {label}
                    </span>
                  ))}
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  {MULTIPLE_HIGHLIGHTS.map((m) => (
                    <span
                      key={m.label}
                      className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/70"
                    >
                      {m.label} <span className="font-semibold text-white">{m.range}</span>
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-[0.68rem] text-white/40">Typical multiples of annual profit, by category</p>
              </div>

              <ValuationForm />
            </div>
          </Inner>
        </Container>
      </section>

      <section className="border-b border-rule bg-paper-sunk py-6">
        <Container>
          <Inner>
            <div className="grid grid-cols-2 divide-y divide-rule sm:grid-cols-4 sm:divide-x sm:divide-y-0">
              {TRUST_POINTS.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center justify-center gap-2.5 px-4 py-3 text-center sm:py-0">
                  <Icon size={16} className="shrink-0 text-brand" />
                  <span className="text-sm font-medium text-ink">{label}</span>
                </div>
              ))}
            </div>
          </Inner>
        </Container>
      </section>

      <section className="py-14 sm:py-16">
        <Container>
          <Inner className="max-w-[760px]">
            <h2 className="mb-6 text-2xl sm:text-3xl">How this estimate works.</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {ESTIMATE_STEPS.map(({ icon: Icon, title, body }, i) => (
                <div key={title} className="rounded-xl border border-rule bg-paper-raised p-5">
                  <div className="mb-3 flex items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-strong">
                      <Icon size={16} />
                    </span>
                    <span className="mono text-[0.68rem] font-semibold uppercase tracking-wide text-ink-faint">
                      Step {i + 1}
                    </span>
                  </div>
                  <h3 className="mb-1.5 text-sm font-semibold text-ink">{title}</h3>
                  <p className="text-sm leading-relaxed text-ink-soft">{body}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-col gap-4 text-sm leading-relaxed text-ink-soft">
              <p>
                Your final sale price depends on factors this quick tool can&rsquo;t see: verified financials, traffic
                quality, growth trend, and how many buyers are interested. The best way to find out your real market
                value is to <a href="/register?as=seller" className="font-semibold text-brand-strong hover:underline">create a listing</a> and
                let real buyers respond.
              </p>
              <p className="flex items-start gap-2 rounded-lg border border-rule bg-paper-sunk p-4 text-xs text-ink-faint">
                <Ban size={14} className="mt-0.5 shrink-0 text-ink-faint" />
                We never share the details you submit here with anyone outside Durqo. We may follow up by email to
                help you sell, and you can opt out of that at any time.
              </p>
            </div>
          </Inner>
        </Container>
      </section>
    </main>
  );
}
