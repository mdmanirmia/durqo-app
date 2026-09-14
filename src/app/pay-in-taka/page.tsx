import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Landmark,
  Smartphone,
  Rocket as RocketGlyph,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Minus,
  Info,
} from "lucide-react";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import { BkashIcon } from "@/components/icons/PaymentIcons";

export const metadata: Metadata = {
  title: "Pay in Taka | Durqo",
  description:
    "Durqo is the first digital-business marketplace built to accept Bangladeshi Taka directly from Bangladeshi buyers — by bank transfer, bKash, Nagad, Rocket or card. See how that compares to Escrow.com, Flippa and Acquire.com.",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "Durqo",
    title: "Pay in Taka | Durqo",
    description:
      "The first marketplace built to accept Bangladeshi Taka directly from Bangladeshi buyers — bank transfer, bKash, Nagad, Rocket and card.",
    url: "https://www.durqo.com/pay-in-taka",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pay in Taka | Durqo",
    description:
      "The first marketplace built to accept Bangladeshi Taka directly from Bangladeshi buyers — bank transfer, bKash, Nagad, Rocket and card.",
  },
  alternates: { canonical: "https://www.durqo.com/pay-in-taka" },
};

function DashEyebrow({
  children,
  onDark = false,
  center = false,
}: {
  children: React.ReactNode;
  onDark?: boolean;
  center?: boolean;
}) {
  return (
    <p
      className={`mono mb-4 flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wider ${
        onDark ? "text-white/70" : "text-ink-soft"
      } ${center ? "justify-center" : ""}`}
    >
      <span className="h-px w-6 bg-brand" aria-hidden />
      {children}
    </p>
  );
}

function Inner({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-[1200px] ${className}`}>{children}</div>;
}

const RAILS = [
  { icon: Landmark, title: "Bank Transfer", body: "Straight to Durqo's BDT account, no foreign-currency wire.", tint: "text-brand-strong" },
  { icon: BkashIcon, title: "bKash", body: "Pay from your bKash balance in Taka.", tint: "text-[#E2136E]" },
  { icon: Smartphone, title: "Nagad", body: "Pay from your Nagad balance in Taka.", tint: "text-[#ED1C24]" },
  { icon: RocketGlyph, title: "Rocket", body: "Dutch-Bangla Bank's mobile wallet, in Taka.", tint: "text-[#7B1E3F]" },
  { icon: CreditCard, title: "Card", body: "Local or international card, converted to BDT at checkout.", tint: "text-brand-strong" },
];

type Cell = "yes" | "no" | "unpublished";

function StatusCell({ status, note }: { status: Cell; note?: string }) {
  if (status === "yes") {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-strong">
        <CheckCircle2 size={16} className="text-brand" />
        Yes{note ? <span className="text-ink-faint">&nbsp;({note})</span> : null}
      </span>
    );
  }
  if (status === "unpublished") {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-ink-faint">
        <Minus size={16} />
        Not published
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-ink-faint">
      <Minus size={16} />
      No
    </span>
  );
}

const COMPARISON_ROWS: { method: string; durqo: Cell; escrow: Cell; flippa: Cell; acquire: Cell; note?: string }[] = [
  { method: "Bank transfer in BDT", durqo: "yes", escrow: "no", flippa: "no", acquire: "no" },
  { method: "bKash", durqo: "yes", escrow: "no", flippa: "no", acquire: "no" },
  { method: "Nagad", durqo: "yes", escrow: "no", flippa: "no", acquire: "no" },
  { method: "Rocket", durqo: "yes", escrow: "no", flippa: "no", acquire: "no" },
  { method: "Card & wire in USD", durqo: "yes", escrow: "yes", flippa: "yes", acquire: "yes" },
  { method: "PayPal", durqo: "no", escrow: "yes", flippa: "yes", acquire: "unpublished", note: "≤$5,000" },
  { method: "Crypto (BTC / ETH / USDC)", durqo: "no", escrow: "no", flippa: "yes", acquire: "unpublished", note: "≥$10,000" },
];

const STEPS = [
  {
    title: "Buyer confirms the exact BDT amount",
    body: "At checkout, a Bangladeshi buyer paying by bKash, Nagad, Rocket, bank transfer or card sees the precise Taka amount and exchange rate before confirming — no guessing what a USD price converts to.",
  },
  {
    title: "SSLCommerz processes up to $2,000-equivalent online",
    body: "Durqo's payment partner for these four rails, SSLCommerz, can only clear the BDT equivalent of the first $2,000 of a purchase online.",
  },
  {
    title: "Durqo collects the rest by wire or card",
    body: "For any balance above that, Durqo emails the buyer instructions to pay the remainder by wire transfer, credit card or debit card directly.",
  },
  {
    title: "The sale completes once the full amount is verified",
    body: "The purchase isn't marked complete until Durqo has received and verified the entire balance — the seller is never paid out on a partial amount.",
  },
];

export default function PayInTakaPage() {
  return (
    <main>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-rule bg-brand-strong py-16 sm:py-20 lg:py-24">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand/10 blur-3xl"
          aria-hidden
        />
        <p
          className="pointer-events-none absolute -bottom-10 right-6 select-none font-display text-[13rem] font-bold leading-none text-white/[0.04] sm:text-[17rem]"
          aria-hidden
        >
          ৳
        </p>
        <Container className="relative">
          <Inner>
            <div className="mx-auto max-w-[62ch] text-center">
              <DashEyebrow onDark center>
                Payments in Bangladesh
              </DashEyebrow>
              <h1 className="text-4xl leading-[1.1] text-white sm:text-5xl">
                Built for buyers who pay <span className="text-brand">in Taka.</span>
              </h1>
              <p className="mx-auto mt-5 max-w-[54ch] text-lg leading-relaxed text-white/70">
                Durqo is the first digital-business marketplace that lets a Bangladeshi buyer pay in BDT directly
                &mdash; by bank transfer, bKash, Nagad, Rocket or card &mdash; instead of routing every purchase
                through a foreign-currency wire.
              </p>
            </div>
          </Inner>
        </Container>
      </section>

      {/* FIVE RAILS */}
      <section className="border-b border-rule py-14 sm:py-16">
        <Container>
          <Inner>
            <div className="mb-10 max-w-[64ch]">
              <DashEyebrow>Five ways to pay</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">Every rail a Bangladeshi buyer already uses.</h2>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
                No new app, no foreign card required. Pay the way you already pay everyone else.
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
              {RAILS.map(({ icon: Icon, title, body, tint }) => (
                <div key={title} data-reveal className="rounded-xl border border-rule bg-paper-raised p-6">
                  <span className={`mb-3 grid h-11 w-11 place-items-center rounded-lg bg-brand-soft ${tint}`}>
                    <Icon size={19} />
                  </span>
                  <h4 className="text-base font-semibold text-ink">{title}</h4>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{body}</p>
                </div>
              ))}
            </div>
          </Inner>
        </Container>
      </section>

      {/* COMPARISON TABLE */}
      <section className="border-b border-rule bg-paper-sunk py-14 sm:py-16">
        <Container>
          <Inner>
            <div className="mb-10 max-w-[68ch]">
              <DashEyebrow>How this compares</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">Against other well-known marketplaces.</h2>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
                What Escrow.com, Flippa and Acquire.com each publish as their own accepted payment methods, checked
                against their own support documentation.
              </p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-rule">
              <table className="w-full min-w-[720px] border-collapse bg-paper-raised text-left">
                <thead>
                  <tr className="border-b border-rule bg-paper-sunk">
                    <th scope="col" className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-ink-soft">
                      Payment method
                    </th>
                    <th scope="col" className="bg-brand-soft px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-brand-strong">
                      Durqo
                    </th>
                    <th scope="col" className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-ink-soft">
                      Escrow.com
                    </th>
                    <th scope="col" className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-ink-soft">
                      Flippa
                    </th>
                    <th scope="col" className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-ink-soft">
                      Acquire.com
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_ROWS.map((row, i) => (
                    <tr key={row.method} className={i !== COMPARISON_ROWS.length - 1 ? "border-b border-rule" : ""}>
                      <th scope="row" className="px-5 py-4 text-sm font-medium text-ink">
                        {row.method}
                      </th>
                      <td className="bg-brand-soft/40 px-5 py-4">
                        <StatusCell status={row.durqo} />
                      </td>
                      <td className="px-5 py-4">
                        <StatusCell status={row.escrow} note={row.method === "PayPal" ? row.note : undefined} />
                      </td>
                      <td className="px-5 py-4">
                        <StatusCell status={row.flippa} note={row.method.startsWith("Crypto") ? row.note : undefined} />
                      </td>
                      <td className="px-5 py-4">
                        <StatusCell status={row.acquire} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-4 max-w-[70ch] text-xs leading-relaxed text-ink-faint">
              &ldquo;Not published&rdquo; means that company&rsquo;s own support documentation didn&rsquo;t confirm or
              rule out the method at the time of writing &mdash; not a claim that it&rsquo;s unavailable. This reflects
              what we could verify across these three well-known platforms, not an audit of every marketplace or
              broker in the category. See sources below.
            </p>
          </Inner>
        </Container>
      </section>

      {/* HOW A TAKA PAYMENT CLEARS */}
      <section className="border-b border-rule py-14 sm:py-16">
        <Container>
          <Inner className="max-w-[860px]">
            <DashEyebrow center>Behind the scenes</DashEyebrow>
            <h2 className="mb-3 text-center text-2xl sm:text-3xl">How a Taka payment actually clears.</h2>
            <p className="mx-auto mb-10 max-w-[56ch] text-center text-[0.95rem] leading-relaxed text-ink-soft">
              Bank transfer, bKash, Nagad, Rocket and card payments in BDT all run through Durqo&rsquo;s payment
              partner, SSLCommerz, which has one limit worth knowing about.
            </p>

            <ol className="grid gap-5 sm:grid-cols-2">
              {STEPS.map((step, i) => (
                <li key={step.title} className="flex gap-4 rounded-xl border border-rule bg-paper-raised p-5">
                  <span className="mono mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-semibold text-brand-strong">
                    {i + 1}
                  </span>
                  <div>
                    <h4 className="text-sm font-semibold text-ink">{step.title}</h4>
                    <p className="mt-1 text-sm leading-relaxed text-ink-soft">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-6 flex items-start gap-3 rounded-xl border border-rule bg-paper-sunk p-5">
              <Info size={18} className="mt-0.5 shrink-0 text-brand-strong" />
              <p className="text-sm leading-relaxed text-ink-soft">
                <span className="font-semibold text-ink">Card through Stripe, or Escrow.com:</span> always charges
                the full price in one payment, with no cap and no split &mdash; the $2,000-equivalent cap applies
                only to SSLCommerz&rsquo;s four Taka rails. Full detail on{" "}
                <Link href="/payments" className="font-medium text-brand-strong underline underline-offset-2 hover:text-brand">
                  the Payment &amp; Withdrawal page
                </Link>
                .
              </p>
            </div>
          </Inner>
        </Container>
      </section>

      {/* SOURCES */}
      <section className="border-b border-rule bg-paper-sunk py-12 sm:py-14">
        <Container>
          <Inner className="max-w-[860px]">
            <DashEyebrow>How this was checked</DashEyebrow>
            <ul className="mt-2 grid gap-2 text-sm text-ink-soft sm:grid-cols-2">
              <li>
                
                  href="https://www.escrow.com/support/payment-options"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-brand-strong"
                >
                  Escrow.com &mdash; Payment Options for Buyers
                  <ArrowUpRight size={13} />
                </a>
              </li>
              <li>
                
                  href="https://support.flippa.com/hc/en-us/articles/202470084-Payment-options"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-brand-strong"
                >
                  Flippa &mdash; Payment options
                  <ArrowUpRight size={13} />
                </a>
              </li>
              <li>
                
                  href="https://blog.acquire.com/acquire-partners-with-escrow-com-for-safe-transactions/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-brand-strong"
                >
                  Acquire.com &mdash; partnership with Escrow.com
                  <ArrowUpRight size={13} />
                </a>
              </li>
              <li className="flex items-center gap-1.5">
                <ShieldCheck size={13} className="shrink-0 text-brand-strong" />
                Durqo&rsquo;s own rails: <Link href="/payments" className="hover:text-brand-strong underline underline-offset-2">Payment &amp; Withdrawal</Link>
              </li>
            </ul>
          </Inner>
        </Container>
      </section>

      {/* FINAL CTA */}
      <section className="py-10 sm:py-12">
        <Container>
          <Inner>
            <div className="flex flex-wrap items-center justify-between gap-6 rounded-2xl bg-brand-soft p-8 sm:p-10">
              <div className="flex items-start gap-4">
                <span className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-paper-raised text-brand-strong">
                  <Landmark size={20} />
                </span>
                <div>
                  <h2 className="text-xl font-semibold text-ink sm:text-2xl">Ready to pay in Taka?</h2>
                  <p className="mt-1 max-w-[46ch] text-sm text-ink-soft">
                    Browse listings and check out with bKash, Nagad, Rocket, bank transfer or card.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button href="/buy" size="lg">
                  Browse the marketplace
                  <ArrowRight size={16} />
                </Button>
              </div>
            </div>
          </Inner>
        </Container>
      </section>
    </main>
  );
}
