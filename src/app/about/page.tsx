import Link from "next/link";
import { ShieldCheck, Lock, TrendingUp, Headphones, ArrowRight } from "lucide-react";
import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";
import { CATEGORIES } from "@/lib/categories";

const PROCESS = [
  {
    num: "01",
    title: "List Your Business",
    body: "Create a listing in minutes at no cost. Publishing is always free, and our team reviews the details before it goes live to buyers.",
  },
  {
    num: "02",
    title: "Connect with Buyers",
    body: "Interested buyers reach out directly through the platform to ask questions and express interest, so you always know who you're talking to.",
  },
  {
    num: "03",
    title: "Secure Payment Handling",
    body: "For transactions over $2,000, payment runs through a structured process: an initial payment via the website, followed by the remainder through wire transfer, credit card, or debit card, with funds protected by escrow throughout.",
  },
  {
    num: "04",
    title: "Smooth Transfer Process",
    body: "Once payment clears, the seller transfers all assets, accounts, and access included in the sale within the agreed timeframe, and the deal is complete.",
  },
] as const;

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
              <p className="mono mb-2 text-xs text-ink-faint">OUR MISSION</p>
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
            {PROCESS.map((step) => (
              <div key={step.num} className="border-t border-rule pt-6">
                <span className="mono mb-2 block text-xs font-semibold text-brand-strong">{step.num}</span>
                <h4 className="mb-1.5 text-base">{step.title}</h4>
                <p className="text-justify text-sm leading-relaxed text-ink-soft">{step.body}</p>
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
            <div>
              <h3 className="mb-1 text-xl">Ready to get started?</h3>
              <p className="text-ink-soft">List a business for free, or browse what&rsquo;s already for sale.</p>
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
