import type { Metadata } from "next";
import Container from "@/components/ui/Container";
import TermsToc from "./TermsToc";
import { SUCCESS_FEE_TIERS, SUCCESS_FEE_RANGE_LABEL, computeSuccessFee, fmtRate } from "@/lib/fees";
import { fmtUSD } from "@/lib/format";

// Sep 6, 2026 Terms-page rebuild — see claude/build-plan-and-decisions.md and
// this session's own audit for the full trail. Two things changed here that
// are worth a reader's attention:
//
// 1. The fee table now matches the 10% / 7% / 5% schedule already used
//    consistently on /sell, the homepage's seller panel, and the /contact
//    FAQ (imported from the single shared src/lib/fees.ts module — see that
//    file's own comment for the two prior audits that flagged this
//    conflict and left it unresolved). The OLD 10%/8%/5%/3% table is gone.
// 2. Every "Escrow Provider" / held-in-escrow claim has been removed. The
//    codebase has no independent escrow integration anywhere (Stripe
//    Checkout pays straight into Durqo's own Stripe balance; seller payout
//    is a manual admin step — see build-plan-and-decisions.md, "Payments /
//    Escrow / Withdrawals"). The site owner explicitly confirmed (Sep 6,
//    2026) that this page should describe today's real flow rather than a
//    provider that doesn't exist yet. Same reasoning removed the old "3%
//    card processing fee" line — no such charge exists anywhere in the
//    checkout code.
//
// Effective date was bumped to today because these are substantive
// corrections to what the Terms actually say, not a cosmetic redesign —
// flagged in the implementation report for the owner/legal sign-off this
// kind of change should still get before it's treated as final.
const EFFECTIVE_DATE = "September 6, 2026";

export const metadata: Metadata = {
  title: "Terms and Conditions | Durqo",
  description: "Read the terms governing access to and use of the Durqo digital-business marketplace.",
  openGraph: {
    title: "Terms and Conditions | Durqo",
    description: "Read the terms governing access to and use of the Durqo digital-business marketplace.",
  },
  alternates: { canonical: "https://www.durqo.com/terms" },
};

const SECTIONS = [
  { id: "acceptance", num: "01", title: "Acceptance of These Terms" },
  { id: "definitions", num: "02", title: "Definitions" },
  { id: "eligibility", num: "03", title: "Eligibility & Account Registration" },
  { id: "buying-selling", num: "04", title: "The Buying and Selling Process" },
  { id: "payment-fees", num: "05", title: "Payment & Success Fee" },
  { id: "disputes", num: "06", title: "Cancellations, Refunds & Disputes" },
  { id: "conduct", num: "07", title: "Prohibited Conduct" },
  { id: "ip", num: "08", title: "Intellectual Property" },
  { id: "liability", num: "09", title: "Disclaimers & Limitation of Liability" },
  { id: "indemnification", num: "10", title: "Indemnification" },
  { id: "termination", num: "11", title: "Suspension & Termination" },
  { id: "changes", num: "12", title: "Changes to These Terms" },
  { id: "governing-law", num: "13", title: "Governing Law & Contact" },
] as const;

function Section({
  id,
  num,
  title,
  children,
}: {
  id: string;
  num: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28 border-t border-rule pt-10 first:border-t-0 first:pt-0">
      <div className="mb-4 flex items-baseline gap-3">
        <span className="mono text-xs font-semibold text-brand-strong">{num}</span>
        <h2 className="text-xl sm:text-2xl">{title}</h2>
      </div>
      <div className="flex max-w-[70ch] flex-col gap-3.5 text-left leading-relaxed text-ink-soft">{children}</div>
    </section>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="mt-2 text-sm font-semibold uppercase tracking-wide text-ink">{children}</h3>;
}

function List({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5 marker:text-rule-strong">
      {items.map((item, i) => (
        <li key={i} className="text-left">
          {item}
        </li>
      ))}
    </ul>
  );
}

// Renders the same three tiers computeSuccessFee() applies — desktop gets a
// real semantic <table>, mobile stacks each tier as labelled rows, so the
// numbers can never fall out of sync with the calculator further down the
// page (Section 10 of the brief: "table must use actual approved values only").
function FeeTable() {
  return (
    <div className="overflow-hidden rounded-lg border border-rule">
      <table className="w-full text-sm">
        <caption className="sr-only">Durqo Success Fee by final sale price</caption>
        <thead>
          <tr className="bg-paper-sunk text-left text-xs uppercase tracking-wide text-ink-faint">
            <th scope="col" className="px-4 py-2.5 font-semibold">
              Final Sale Price
            </th>
            <th scope="col" className="px-4 py-2.5 font-semibold">
              Durqo Success Fee
            </th>
          </tr>
        </thead>
        <tbody className="mono">
          {SUCCESS_FEE_TIERS.map((tier) => (
            <tr key={tier.id} className="border-t border-rule">
              <td className="px-4 py-2.5 text-ink-soft">{tier.label}</td>
              <td className="px-4 py-2.5 text-ink">{fmtRate(tier.rate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SummaryCard({ eyebrow, children }: { eyebrow: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-rule bg-paper-raised p-5">
      <p className="mono text-xs font-semibold uppercase tracking-wide text-brand-strong">{eyebrow}</p>
      <p className="text-left text-sm leading-relaxed text-ink-soft">{children}</p>
    </div>
  );
}

// A small, unmissable status tag so a reader can't confuse a planned
// integration with something they can actually use today. Sep 6, 2026: the
// site owner explicitly required this distinction — see the "Planned
// payment system" block below.
function StatusBadge({ tone, children }: { tone: "live" | "planned"; children: React.ReactNode }) {
  return (
    <span
      className={`mono inline-flex items-center rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide ${
        tone === "live" ? "bg-brand-soft text-brand-strong" : "bg-paper-sunk text-ink-faint"
      }`}
    >
      {children}
    </span>
  );
}

// Worked example — the exact numbers below come straight out of
// computeSuccessFee(1000), never typed by hand, so they can't silently
// drift from the calculator the rest of the page (and eventually real
// payout math) shares.
function FeeExample() {
  const price = 1000;
  const breakdown = computeSuccessFee(price);
  const feeUSD = breakdown.feeCents / 100;
  const netUSD = breakdown.netCents / 100;
  const rows: [string, string][] = [
    ["Final Sale Price", fmtUSD(price)],
    ["Applicable Success Fee", fmtRate(breakdown.rate)],
    ["Durqo Seller Success Fee", fmtUSD(feeUSD)],
    ["Seller receives", fmtUSD(netUSD)],
    ["Durqo Buyer Commission", "$0"],
    ["Standard transaction cost", "Included"],
  ];
  return (
    <div className="rounded-lg border border-rule-strong bg-paper-sunk p-5">
      <p className="mb-3 text-sm font-semibold text-ink">Example: A business sells for {fmtUSD(price)}</p>
      <dl className="mono flex flex-col gap-2 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-4">
            <dt className="text-ink-soft">{label}</dt>
            <dd className="text-ink">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-left text-xs leading-relaxed text-ink-faint">
        The Buyer funds only the agreed {fmtUSD(price)} purchase price. The {fmtUSD(feeUSD)} Success Fee is deducted
        from the Seller&rsquo;s proceeds, not charged to the Buyer.
      </p>
    </div>
  );
}

// Steps match the real flow: Stripe Checkout pays straight into Durqo's own
// balance (no third-party escrow, no Stripe Connect), and seller payout is
// a manual admin step today. See src/lib/fees.ts for the fuller citation of
// where this was confirmed in the codebase and the project's own decision
// log.
const PAYMENT_FLOW = [
  "Buyer and Seller agree on the transaction through the Platform.",
  "Buyer pays the agreed purchase price securely through Durqo's payment provider, Stripe.",
  "Durqo holds the payment until the Seller has transferred the agreed assets and the Buyer has confirmed receipt.",
  "Once confirmed, Durqo's Success Fee is deducted from the sale proceeds.",
  "The remaining balance is paid out to the Seller.",
];

// Sep 6, 2026: the site owner confirmed this describes Durqo's intended
// FINAL payment architecture — but repeated, twice, that no piece of it may
// be described as operational until it is actually built, integrated and
// verified (none of it exists in the codebase today: no escrow provider,
// no SSLCommerz code anywhere, no Stripe fee-only charge flow). Written in
// the future tense ("will") specifically so this reads as a roadmap even
// to someone who skims past the "Not yet available" badge.
const PLANNED_TRANSACTION_FLOW = [
  {
    title: "Buyer funds escrow",
    body: "Buyer will pay the full purchase price to an approved independent escrow provider.",
  },
  {
    title: "Assets transfer",
    body: "Once the escrow provider verifies receipt of funds, the Seller will transfer the agreed assets to the Buyer.",
  },
  {
    title: "Buyer inspects",
    body: "Buyer will complete inspection and confirm satisfaction with the assets received.",
  },
  {
    title: "Escrow releases funds",
    body: "The escrow provider will release the remaining proceeds to the Seller, after Durqo's Success Fee is deducted where supported.",
  },
];

const PLANNED_FEE_ROUTES = [
  {
    title: "International Seller → Stripe",
    body: "International Sellers will be able to pay their Durqo Success Fee through Stripe when a direct deduction through escrow isn't available.",
  },
  {
    title: "Bangladeshi Seller → SSLCommerz",
    body: "Bangladeshi Sellers will be able to pay their Durqo Success Fee through SSLCommerz when a direct deduction through escrow isn't available.",
  },
];

function StepFlow({ steps }: { steps: { title: string; body: string }[] }) {
  return (
    <ol className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {steps.map((step, i) => (
        <li key={step.title} className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="mono flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
              {i + 1}
            </span>
            {i < steps.length - 1 && <span aria-hidden className="hidden h-px flex-1 bg-rule-strong lg:block" />}
          </div>
          <p className="text-left text-sm font-semibold text-ink">{step.title}</p>
          <p className="text-left text-xs leading-relaxed text-ink-soft">{step.body}</p>
        </li>
      ))}
    </ol>
  );
}

export default function TermsPage() {
  return (
    <main>
      <section className="border-b border-rule bg-paper-sunk py-16 sm:py-24">
        <Container>
          <div className="grid gap-10 md:grid-cols-2 md:items-start">
            <div>
              <p className="eyebrow mb-3">Legal</p>
              <h1 className="mb-4 text-4xl">Terms and Conditions</h1>
              <p className="max-w-[52ch] text-left text-ink-soft">
                These Terms and Conditions (&ldquo;Terms&rdquo;) govern your access to and use of Durqo&rsquo;s
                website, marketplace, and related services (together, the &ldquo;Platform&rdquo;). Please read
                them carefully before you create an account, list a business, or make a purchase.
              </p>
            </div>
            <div className="rounded-xl border border-rule-strong bg-paper-raised p-8">
              <p className="mono mb-2 text-xs text-ink-faint">EFFECTIVE {EFFECTIVE_DATE.toUpperCase()}</p>
              <h3 className="mb-1 text-2xl">Questions about these Terms?</h3>
              <p className="mb-4 text-left text-ink-soft">
                Contact us if you need help locating or understanding information about the Platform.
              </p>
              <a href="mailto:support@durqo.com" className="inline-block text-sm font-semibold text-brand-hover">
                support@durqo.com
              </a>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[240px_1fr] lg:gap-12">
            <TermsToc items={SECTIONS.map((s) => ({ id: s.id, num: s.num, title: s.title }))} />

            <div className="flex max-w-[760px] flex-col gap-10">
              <Section id="acceptance" num="01" title="Acceptance of These Terms">
                <p>
                  Welcome to Durqo. By creating an account, browsing listings, submitting a listing for sale, or
                  otherwise accessing or using our website, marketplace, and services, you agree to be bound by
                  these Terms and by our{" "}
                  <a href="/privacy" className="font-semibold text-brand-hover">
                    Privacy Policy
                  </a>
                  , which is incorporated into these Terms by reference. If you do not agree to these Terms in
                  full, you must not access or use the Platform.
                </p>
                <p>
                  You may use the Platform on behalf of a company or other legal entity, in which case you
                  represent that you have the authority to bind that entity to these Terms, and &ldquo;you&rdquo;
                  refers to both you individually and that entity.
                </p>
              </Section>

              <Section id="definitions" num="02" title="Definitions">
                <List
                  items={[
                    <>
                      <strong className="text-ink">Platform:</strong> the Durqo website, marketplace, and any
                      associated apps, APIs, or services operated by Durqo.
                    </>,
                    <>
                      <strong className="text-ink">Listing:</strong> a business, website, or digital asset
                      offered for sale by a Seller on the Platform.
                    </>,
                    <>
                      <strong className="text-ink">Seller:</strong> a user who creates a Listing to sell a
                      business, website, or digital asset.
                    </>,
                    <>
                      <strong className="text-ink">Buyer:</strong> a user who browses, inquires about, or
                      purchases a Listing.
                    </>,
                    <>
                      <strong className="text-ink">Success Fee:</strong> the commission Durqo charges a Seller
                      when a Listing successfully sells, calculated as a percentage of the final sale price set
                      out in Section 5. Buyers are never charged a Durqo commission.
                    </>,
                  ]}
                />
              </Section>

              <Section id="eligibility" num="03" title="Eligibility & Account Registration">
                <List
                  items={[
                    "You must be at least 18 years old to register an account or use the Platform.",
                    "You must provide accurate, current, and complete information when registering an account, and keep that information up to date.",
                    "You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account.",
                    "We reserve the right to refuse registration, or to suspend or terminate any account, that we reasonably believe violates these Terms.",
                  ]}
                />
              </Section>

              <Section id="buying-selling" num="04" title="The Buying and Selling Process">
                <p>
                  Durqo provides a marketplace that connects Sellers of online businesses, websites, and digital
                  assets with prospective Buyers. Durqo is not a party to the underlying sale; the agreement to
                  buy or sell a business is between the Buyer and the Seller. Durqo facilitates discovery,
                  listing review, communication, and payment through the Platform.
                </p>
                <SubHeading>4.1 Sellers</SubHeading>
                <List
                  items={[
                    "Sellers must provide accurate, complete, and non-misleading details about the business being listed, including financial data, website traffic, and revenue.",
                    "Listings must not contain false, exaggerated, or misleading claims, and any supporting screenshots or documents submitted for review must genuinely belong to the listed business.",
                    "Once a sale is agreed and payment has been made through Durqo's payment provider, the Seller must transfer all assets, accounts, and access included in the sale within the timeframe agreed with the Buyer.",
                    "A Success Fee is charged only when a sale is completed; there is no charge simply for creating or maintaining a listing.",
                  ]}
                />
                <SubHeading>4.2 Buyers</SubHeading>
                <List
                  items={[
                    "Buyers are responsible for conducting their own due diligence on a business before committing to purchase it, including independently verifying any figures or claims that matter to their decision.",
                    "Payments must be made only through the payment methods approved on the Platform, never by paying a Seller directly outside the Platform.",
                    "Buyers acknowledge that acquiring an online business carries inherent risk, and that Durqo does not guarantee the future performance of any business purchased through the Platform.",
                  ]}
                />
              </Section>

              <Section id="payment-fees" num="05" title="Payment & Success Fee">
                <p className="text-left font-medium text-ink">
                  List for free. Pay a {SUCCESS_FEE_RANGE_LABEL} Success Fee only when your business sells.
                  Standard transaction costs included. Buyers pay no Durqo marketplace commission.
                </p>

                <div className="grid gap-3 sm:grid-cols-3">
                  <SummaryCard eyebrow="Success Fee">{SUCCESS_FEE_RANGE_LABEL}, based on the Final Sale Price.</SummaryCard>
                  <SummaryCard eyebrow="Standard costs included">
                    Standard transaction costs are covered within the applicable Success Fee.
                  </SummaryCard>
                  <SummaryCard eyebrow="No buyer commission">Buyers pay no Durqo marketplace commission.</SummaryCard>
                </div>

                <p>
                  There are no listing fees for Sellers: creating and publishing a Listing is always free. Durqo
                  earns its Success Fee only when a Listing actually sells, calculated as a flat percentage of
                  the full final sale price (not a marginal or progressive calculation):
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="mb-2 text-left text-xs font-semibold uppercase tracking-wide text-ink-faint">
                      Success Fee Tiers
                    </p>
                    <FeeTable />
                  </div>
                  <div>
                    <p className="mb-2 text-left text-xs font-semibold uppercase tracking-wide text-ink-faint">
                      Fee Calculation Example
                    </p>
                    <FeeExample />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <SubHeading>How payment works today</SubHeading>
                  <StatusBadge tone="live">Currently operational</StatusBadge>
                </div>
                <p>
                  Durqo does not currently use a third-party escrow provider. Payments are processed directly
                  through Durqo&rsquo;s payment provider, Stripe:
                </p>
                <ol className="list-decimal space-y-2 pl-5 marker:text-rule-strong">
                  {PAYMENT_FLOW.map((step, i) => (
                    <li key={i} className="text-left">
                      {step}
                    </li>
                  ))}
                </ol>
                <p className="text-left text-xs leading-relaxed text-ink-faint">
                  Stripe is an independent payment processor, not an escrow provider — Stripe does not hold
                  funds on Durqo&rsquo;s behalf pending a separate release condition, and this section will be
                  updated if that changes.
                </p>

                <div className="mt-2 flex items-center gap-2">
                  <SubHeading>Planned transaction flow</SubHeading>
                  <StatusBadge tone="planned">Not yet available</StatusBadge>
                </div>
                <p>
                  This is Durqo&rsquo;s intended final payment architecture. No part of it is built or available
                  to Buyers or Sellers today — this page will be updated to describe each piece as operational
                  only once it has actually been integrated and verified:
                </p>
                <StepFlow steps={PLANNED_TRANSACTION_FLOW} />
                <p className="text-left text-xs leading-relaxed text-ink-faint">
                  Once available, Durqo itself will not hold escrow funds, act as an escrow provider, or act as a
                  bank, trustee, custodian, or guarantor. Nothing in these Terms limits any right or remedy that
                  cannot lawfully be limited or excluded under applicable law.
                </p>

                <div className="mt-2 flex items-center gap-2">
                  <SubHeading>Planned alternative Success Fee payment</SubHeading>
                  <StatusBadge tone="planned">Not yet available</StatusBadge>
                </div>
                <p>
                  Where deducting Durqo&rsquo;s Success Fee directly through escrow isn&rsquo;t available, Sellers
                  will be able to pay it directly instead:
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {PLANNED_FEE_ROUTES.map((route) => (
                    <div key={route.title} className="rounded-lg border border-rule bg-paper-raised p-5">
                      <p className="text-left text-sm font-semibold text-ink">{route.title}</p>
                      <p className="mt-1 text-left text-sm leading-relaxed text-ink-soft">{route.body}</p>
                    </div>
                  ))}
                </div>
                <p className="text-left text-xs leading-relaxed text-ink-faint">
                  Stripe and SSLCommerz are independent payment processors, not escrow providers. Neither will
                  hold or release a Buyer&rsquo;s purchase price, and a Buyer&rsquo;s full purchase price will
                  never be routed through Stripe or SSLCommerz &mdash; both are used only to collect the
                  Seller&rsquo;s Success Fee.
                </p>
              </Section>

              <Section id="disputes" num="06" title="Cancellations, Refunds & Disputes">
                <List
                  items={[
                    "Once a business has been transferred and the Buyer has confirmed receipt, the sale is final.",
                    "Refunds are granted only in cases of confirmed fraud, material misrepresentation, or a Seller's breach of the agreed transfer terms.",
                    "Any dispute relating to a transaction must be reported to Durqo within 7 days of the transaction's completion; disputes reported after this window may not be eligible for resolution through the Platform.",
                    "Where a dispute cannot be resolved directly between the Buyer and Seller, Durqo may, at its discretion and without obligation to do so, review the available evidence and help mediate a resolution, including through Stripe's own payment-dispute process where applicable.",
                  ]}
                />
                <p className="text-left text-sm text-ink-soft">
                  Nothing in these Terms limits any right or remedy that cannot lawfully be limited or excluded
                  under applicable law, including any non-waivable consumer-protection or payment-network
                  chargeback rights you may have.
                </p>
                <SubHeading>Once escrow is available</SubHeading>
                <p className="text-left text-sm text-ink-soft">
                  Section 5 describes a planned, not-yet-available escrow-based payment flow. Once it launches,
                  this section will be updated to separately address cancellation before a transaction is
                  funded, cancellation while funds are held in escrow, a Buyer&rsquo;s rejection at inspection,
                  a completed transfer, confirmed fraud or material misrepresentation, and disputes or
                  chargebacks raised with the escrow provider or a payment processor. Durqo does not control
                  escrow funds today and cannot itself order or guarantee a refund; that will remain true even
                  once an escrow provider is in place, since refund authority over escrowed funds will sit with
                  that provider under its own dispute process.
                </p>
              </Section>

              <Section id="conduct" num="07" title="Prohibited Conduct">
                <p>When using the Platform, you must not:</p>
                <List
                  items={[
                    "Use the Platform for any illegal, fraudulent, or deceptive purpose.",
                    "Submit a Listing that misrepresents ownership, financials, traffic, or any other material fact about the business being sold.",
                    "Attempt to circumvent the Platform to complete a transaction directly with another user in order to avoid Durqo's Success Fee.",
                    "Engage in unauthorized reselling, spamming, scraping, or hacking of the Platform or another user's account.",
                    "Post content that is offensive, misleading, defamatory, or that infringes another party's rights.",
                    "Interfere with the normal operation of the Platform, including through malware, denial-of-service attempts, or automated bulk access.",
                  ]}
                />
              </Section>

              <Section id="ip" num="08" title="Intellectual Property">
                <p>
                  All content on the Platform, including the Durqo name, logo, trademarks, design, text, and
                  underlying software, is the property of Durqo or its licensors, and is protected by
                  applicable intellectual property laws. Nothing in these Terms grants you any right to use
                  Durqo&rsquo;s branding or content beyond what is necessary to use the Platform as intended, and
                  none of it may be copied, reproduced, or distributed without our prior written permission.
                </p>
                <p>
                  You retain ownership of any content you submit to the Platform (such as a Listing description
                  or verification documents), but you grant Durqo a limited, non-exclusive license to host,
                  display, and process that content for the purpose of operating the marketplace.
                </p>
              </Section>

              <Section id="liability" num="09" title="Disclaimers & Limitation of Liability">
                <p>
                  The Platform is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. To the
                  fullest extent permitted by law:
                </p>
                <List
                  items={[
                    "Durqo is not responsible for any losses resulting from a business transaction conducted through the Platform, including losses arising from a Seller's or Buyer's own misrepresentation, negligence, or breach of agreement.",
                    "Durqo does not guarantee the profits, growth, or future performance of any business listed or sold on the Platform.",
                    "Users assume full responsibility for their own transactions, including their own due diligence, and for complying with any laws applicable to their purchase or sale.",
                    "Durqo's total liability arising out of or relating to the Platform will not exceed the total Success Fees actually paid by you to Durqo in the twelve months preceding the claim.",
                  ]}
                />
                <p className="text-left text-sm text-ink-soft">
                  Nothing in these Terms limits any right or remedy that cannot lawfully be limited or excluded
                  under applicable law.
                </p>
              </Section>

              <Section id="indemnification" num="10" title="Indemnification">
                <p>
                  You agree to indemnify and hold Durqo, its officers, employees, and affiliates harmless from
                  any claim, loss, liability, or expense (including reasonable legal fees) arising out of your
                  use of the Platform, your breach of these Terms, or the accuracy of any information you submit
                  in connection with a Listing or a purchase.
                </p>
              </Section>

              <Section id="termination" num="11" title="Suspension & Termination">
                <p>
                  We reserve the right to suspend or terminate any account that violates these Terms, including
                  for fraudulent activity, repeated misrepresentation in a Listing, or abuse of other users or
                  the Platform. Where reasonably possible, we will provide notice and an opportunity to respond
                  before taking this step; in cases of suspected fraud or a risk to other users, we may act
                  immediately.
                </p>
                <p>You may close your own account at any time by contacting us, subject to any obligations from transactions already in progress.</p>
              </Section>

              <Section id="changes" num="12" title="Changes to These Terms">
                <p>
                  We may update these Terms from time to time to reflect changes to the Platform or applicable
                  law. When we make material changes, we will update the effective date at the top of this page.
                  Your continued use of the Platform after a change takes effect constitutes your acceptance of
                  the revised Terms.
                </p>
              </Section>

              <Section id="governing-law" num="13" title="Governing Law & Contact">
                <p>
                  These Terms are governed by the laws of Newfoundland and Labrador and the applicable federal
                  laws of Canada, without regard to conflict-of-law principles, except where mandatory local
                  consumer-protection law provides otherwise. If any provision of these Terms is found
                  unenforceable, the remaining provisions will continue in full force, and these Terms, together
                  with our Privacy Policy, constitute the entire agreement between you and Durqo regarding your
                  use of the Platform.
                </p>
                <p>If you have any questions about these Terms, please reach out.</p>
                <a href="mailto:support@durqo.com" className="inline-block w-fit font-semibold text-brand-hover">
                  support@durqo.com
                </a>
              </Section>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
