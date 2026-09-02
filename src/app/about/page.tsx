import Link from "next/link";
import { ShieldCheck, Lock, TrendingUp, Headphones, ArrowRight, FilePlus2, MessagesSquare, CreditCard, ArrowRightLeft } from "lucide-react";
import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";
import { CATEGORIES } from "@/lib/categories";

const PROCESS = [
  {
    num: "01",
    icon: FilePlus2,
    title: "List Your Business",
    body: "Create a listing in minutes at no cost. Publishing is always free, and our team reviews the details before it goes live to buyers.",
  },
  {
    num: "02",
    icon: MessagesSquare,
    title: "Connect with Buyers",
    body: "Interested buyers reach out directly through the platform to ask questions and express interest, so you always know who you're talking to.",
  },
  {
    num: "03",
    icon: CreditCard,
    title: "Secure Payment Handling",
    body: "For transactions over $2,000, payment runs through a structured process: an initial payment via the website, followed by the remainder through wire transfer, credit card, or debit card, with funds protected by escrow throughout.",
  },
  {
    num: "04",
    icon: ArrowRightLeft,
    title: "Smooth Transfer Process",
    body: "Once payment clears, the seller transfers all assets, accounts, and access included in the sale within the agreed timeframe, and the deal is complete.",
  },
] as const;

// Abstract, on-brand line illustration of a marketplace exchange — a
// listing card handed off to a verified/escrow badge — used in place of a
// stock or fabricated "team" photo, since no real product/team photography
// exists yet. Pure decoration: colors resolve via currentColor from the
// Tailwind text-* classes on each wrapping <g>, so it follows the same
// design tokens (and dark mode) as the rest of the page.
function ExchangeIllustration() {
  return (
    <svg viewBox="0 0 440 240" fill="none" className="h-auto w-full" aria-hidden="true">
      {/* scattered dots for texture */}
      <g className="text-rule-strong" fill="currentColor">
        <circle cx="24" cy="24" r="2.5" />
        <circle cx="410" cy="200" r="2.5" />
        <circle cx="60" cy="200" r="2" />
        <circle cx="250" cy="30" r="2" />
      </g>

      {/* dashed connecting path from listing card to escrow badge */}
      <path
        d="M172 118 C 230 118, 250 90, 300 90"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="5 7"
        strokeLinecap="round"
        className="text-rule-strong"
      />
      <circle cx="236" cy="106" r="4" className="text-brand" fill="currentColor" />

      {/* listing card */}
      <g className="text-rule-strong">
        <rect x="24" y="58" width="148" height="120" rx="14" fill="var(--paper-raised)" stroke="currentColor" strokeWidth="1.5" />
      </g>
      <rect x="42" y="78" width="52" height="10" rx="5" className="text-brand" fill="currentColor" opacity="0.55" />
      <rect x="42" y="100" width="112" height="8" rx="4" className="text-rule-strong" fill="currentColor" />
      <rect x="42" y="114" width="80" height="8" rx="4" className="text-rule-strong" fill="currentColor" opacity="0.6" />
      <rect x="42" y="140" width="60" height="20" rx="10" className="text-brand-soft" fill="currentColor" />
      <text x="72" y="154" textAnchor="middle" className="mono fill-brand-hover" fontSize="11" fontWeight="700">
        $
      </text>

      {/* escrow / verified badge */}
      <circle cx="356" cy="90" r="40" className="text-brand-soft" fill="currentColor" />
      <circle cx="356" cy="90" r="40" className="text-brand" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M340 90 L 351 101 L 373 78"
        className="text-brand-strong"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* buyer glyph, bottom right */}
      <g className="text-ink-faint" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round">
        <circle cx="356" cy="176" r="12" />
        <path d="M332 216 c0 -15 11 -24 24 -24 s24 9 24 24" />
      </g>
    </svg>
  );
}

const OFFERINGS = [
  {
    icon: ShieldCheck,
    title: "Verified Listings",
    body: "Every listing goes through review before it's published, with financial and traffic claims checked against source data where possible.",
  },
  {
    icon: Lock,
    title: "Secure Transactions",
    body: "Every payment runs through escrow, so funds are only released once both sides have held up their end of the deal.",
  },
  {
    icon: TrendingUp,
    title: "Accurate Valuation",
    body: "Quick Statistics and connected Google Analytics data give buyers a clear, data-driven view of a business's real performance.",
  },
  {
    icon: Headphones,
    title: "Dedicated Support",
    body: "Our team is reachable throughout a deal to answer questions, from your first message through to the final transfer.",
  },
] as const;

export default function AboutPage() {
  return (
    <main>
      <section className="border-b border-rule bg-paper-sunk py-16 sm:py-24">
        <Container>
          <div className="grid gap-10 md:grid-cols-2 md:items-start">
            <div>
              <p className="eyebrow mb-3">About Durqo</p>
              <h1 className="mb-4 text-4xl">The marketplace built for buying and selling digital businesses</h1>
              <p className="max-w-[52ch] text-justify text-ink-soft">
                Durqo is built by a team of experienced professionals specializing in digital acquisitions,
                online business valuation, and marketplace transactions. We built the platform we wished existed:
                a simple, secure, and efficient way for buyers and sellers to trade high-value digital assets.
              </p>
            </div>
            <div className="rounded-xl border border-rule-strong bg-paper-raised p-8">
              <ExchangeIllustration />
              <p className="mono mb-2 mt-4 text-xs text-ink-faint">OUR MISSION</p>
              <h3 className="mb-1 text-2xl">Simple, secure, efficient</h3>
              <p className="text-justify text-ink-soft">
                Make buying and selling an online business as straightforward and safe as any other major
                purchase, with verification, escrow, and support built in at every step.
              </p>
            </div>
          </div>
        </Container>
      </section>

      <section className="border-b border-rule py-16 sm:py-20">
        <Container>
          <SectionHeader eyebrow="Who we are" title="A team built around digital acquisitions" className="mb-8" />
          <div className="max-w-[70ch] text-justify leading-relaxed text-ink-soft">
            <p>
              Durqo is built by a team of experienced professionals specializing in digital acquisitions, online
              business valuation, and marketplace transactions. Our backgrounds span escrow and payments,
              financial verification, and building software that removes friction from a deal rather than adding
              to it.
            </p>
            <p className="mt-3.5">
              We built Durqo to simplify buying and selling digital assets: a platform where a seller can list a
              business without friction, a buyer can evaluate it with real data, and both sides can complete a
              transaction knowing the process is simple, secure, and efficient from the first message to the
              final transfer.
            </p>
          </div>
        </Container>
      </section>

      <section className="border-b border-rule py-16 sm:py-20">
        <Container>
          <SectionHeader
            eyebrow="Our value"
            title="The ultimate marketplace for high-value digital assets"
            subtitle="Durqo connects buyers and sellers across a wide range of business types, and the range continues to grow as more categories of online business come to market."
            className="mb-10"
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((c) => (
              <div key={c.id} className="rounded-lg border border-rule bg-paper-raised p-5">
                <h4 className="mb-1 text-sm font-semibold text-ink">{c.name}</h4>
                <p className="text-sm text-ink-soft">{c.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-b border-rule py-16 sm:py-20">
        <Container>
          <SectionHeader eyebrow="Our process" title="How a sale moves from listing to close" className="mb-10" />
          <div className="grid gap-6 sm:grid-cols-2">
            {PROCESS.map(({ num, icon: Icon, title, body }) => (
              <div key={num} className="border-t border-rule pt-6">
                <div className="mb-3 flex items-center gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-rule-strong bg-brand-soft text-brand">
                    <Icon size={17} />
                  </div>
                  <span className="mono text-xs font-semibold text-brand-strong">{num}</span>
                </div>
                <h4 className="mb-1.5 text-base">{title}</h4>
                <p className="text-justify text-sm leading-relaxed text-ink-soft">{body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-b border-rule py-16 sm:py-20">
        <Container>
          <SectionHeader eyebrow="What we offer" title="Four things every deal on Durqo gets" className="mb-10" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {OFFERINGS.map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-xl border border-rule bg-paper-raised p-6">
                <div className="mb-3 grid h-11 w-11 place-items-center rounded-full border border-rule-strong bg-brand-soft text-brand">
                  <Icon size={18} />
                </div>
                <h4 className="mb-1.5 text-sm font-semibold text-ink">{title}</h4>
                <p className="text-xs leading-relaxed text-ink-faint">{body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container>
          <div className="flex flex-col items-start gap-6 rounded-xl border border-rule-strong bg-paper-sunk p-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="hidden h-12 w-12 shrink-0 place-items-center rounded-full border border-rule-strong bg-brand-soft text-brand sm:grid">
                <ArrowRightLeft size={20} />
              </div>
              <div>
                <h3 className="mb-1 text-xl">Ready to get started?</h3>
                <p className="text-ink-soft">List a business for free, or browse what&rsquo;s already for sale.</p>
              </div>
            </div>
            <div className="flex shrink-0 gap-3">
              <Link
                href="/sell"
                className="inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover"
              >
                Sell a Business <ArrowRight size={15} />
              </Link>
              <Link
                href="/buy"
                className="inline-flex items-center gap-1.5 rounded-md border border-rule-strong px-4 py-2.5 text-sm font-semibold text-ink hover:border-brand-strong"
              >
                Browse Listings
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
