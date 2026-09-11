import type { Metadata } from "next";
import Container from "@/components/ui/Container";
import PrivacyToc from "./PrivacyToc";

// Sep 6, 2026 Privacy-page rebuild — see claude/build-plan-and-decisions.md
// and this session's Terms-page audit (src/app/terms/page.tsx) for the
// fuller trail. This page had three real inaccuracies, found by checking
// this claim against the actual codebase rather than assuming the existing
// copy was already correct:
//
// 1. Section 04 ("How We Use Your Information") and the old provider list
//    both described Durqo sharing data with "our Escrow Provider" and
//    "connecting Buyers and Sellers through escrow." No escrow integration
//    exists anywhere in this codebase (no escrow SDK dependency, no escrow
//    env vars, no escrow API route) — Stripe Checkout pays straight into
//    Durqo's own Stripe balance, and seller payout is a manual admin step.
//    Same finding as the Terms-page audit; fixed the same way.
// 2. The old Cookies section claimed "Functional cookies... remember your
//    saved searches or wishlist." The wishlist feature is actually backed
//    by a Supabase table (`wishlists`, RLS-scoped to the signed-in user —
//    see src/lib/data/wishlist.client.ts), not a cookie. A full repo grep
//    turned up exactly one cookie-writing code path in this app: the
//    Supabase auth session cookie set by @supabase/ssr in
//    src/lib/supabase/server.ts and src/proxy.ts. There is no separate
//    functional, analytics, or marketing cookie anywhere in the codebase,
//    and no localStorage usage either.
// 3. This page only exported `{ title: "Privacy Policy | Durqo" }`, so
//    Next.js fell back to the root layout's homepage-tuned
//    description/OpenGraph copy ("Buy What's Already Working...") on a
//    legal page that has nothing to do with it. Given full page-specific
//    metadata below, same fix already applied to /terms.
//
// The effective date was bumped because these are substantive corrections
// to what the policy actually says, not a cosmetic redesign — flagged in
// the implementation report for the owner's/a lawyer's final sign-off,
// same as the Terms-page date bump.
//
// Update — Sep 11, 2026: re-checked against the current codebase (mirroring
// the same-day Terms-page re-check, src/app/terms/page.tsx) and updated
// because the Platform has shipped real integrations the Sep 6 copy above
// still described as not-yet-built:
// 1. Escrow.com (src/lib/escrow.ts) is a live, independent, licensed
//    escrow provider as of Sep 10, 2026. The provider table's old
//    "Independent escrow provider — not yet integrated" row is replaced
//    with a real "Escrow.com" row describing what it actually receives.
// 2. SSLCommerz has processed live Bangladeshi Buyer payments since
//    Sep 9, 2026 (src/components/BuyNowButton.tsx) — its row flips from
//    "planned" to "live," and its purpose text is corrected: it collects a
//    Buyer's BDT payment, not a Seller's Success Fee (that mechanism was
//    never built — see the Terms-page Sep 11 update for what replaced it).
// 3. Stripe's row is corrected the same way — its purpose text no longer
//    claims a planned Stripe-based Seller Success Fee payment.
// 4. A new provider-table row discloses the payout-method data flow added
//    by the seller withdrawal system (supabase/migrations 028-033,
//    src/app/dashboard/seller/earnings): the structured payout account
//    details (bank account number, bKash/Rocket/Nagad number, PayPal/Wise
//    email) a Seller enters to request a withdrawal. Section 02's
//    "Payment & transaction" row is updated to mention this too.
// Same discipline as the Sep 6 rebuild: a row is only marked "In use
// today" once the integration is actually confirmed live in the codebase.
const EFFECTIVE_DATE = "September 11, 2026";

export const metadata: Metadata = {
  title: "Privacy Policy | Durqo",
  description: "Learn how Durqo collects, uses, stores and protects personal information.",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "Durqo",
    title: "Privacy Policy | Durqo",
    description: "Learn how Durqo collects, uses, stores and protects personal information.",
    url: "https://www.durqo.com/privacy",
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy | Durqo",
    description: "Learn how Durqo collects, uses, stores and protects personal information.",
  },
  alternates: { canonical: "https://www.durqo.com/privacy" },
};

const SECTIONS = [
  { id: "scope", num: "01", title: "Scope and Who We Are" },
  { id: "information-we-collect", num: "02", title: "Information We Collect" },
  { id: "sources", num: "03", title: "Sources of Information" },
  { id: "how-we-use", num: "04", title: "How We Use Information" },
  { id: "consent", num: "05", title: "Consent and Applicable Processing Grounds" },
  { id: "how-we-disclose", num: "06", title: "How We Disclose Information" },
  { id: "providers", num: "07", title: "Payments, Escrow and Service Providers" },
  { id: "cookies", num: "08", title: "Cookies and Analytics" },
  { id: "retention", num: "09", title: "Data Retention" },
  { id: "security", num: "10", title: "Security and Privacy Incidents" },
  { id: "international", num: "11", title: "International Processing and Transfers" },
  { id: "rights", num: "12", title: "Privacy Rights and Choices" },
  { id: "children", num: "13", title: "Children's Privacy" },
  { id: "changes", num: "14", title: "Changes, Complaints and Contact" },
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

// A small, unmissable status tag — same component/reasoning as
// src/app/terms/page.tsx's StatusBadge — so a reader can't mistake a
// planned integration for something operational today.
function StatusBadge({ tone, children }: { tone: "live" | "planned"; children: React.ReactNode }) {
  return (
    <span
      className={`mono inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide ${
        tone === "live" ? "bg-brand-soft text-brand-strong" : "bg-paper-sunk text-ink-faint"
      }`}
    >
      {children}
    </span>
  );
}

function SummaryCard({ icon, eyebrow, children }: { icon: React.ReactNode; eyebrow: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-rule bg-paper-raised p-5">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-soft text-brand-strong" aria-hidden>
        {icon}
      </span>
      <div>
        <p className="mono mb-1.5 text-xs font-semibold uppercase tracking-wide text-brand-strong">{eyebrow}</p>
        <p className="text-left text-sm leading-relaxed text-ink-soft">{children}</p>
      </div>
    </div>
  );
}

// Desktop: category / examples / purpose columns. Mobile: the same data
// stacks as labelled rows instead of squeezing a wide table — Section 19 of
// the brief explicitly calls out not shipping a squeezed desktop table to
// mobile.
type InfoCategory = { category: string; examples: string; purpose?: string };

function InfoCategoryTable({ rows }: { rows: InfoCategory[] }) {
  return (
    <div className="rounded-lg border border-rule">
      {/* Desktop */}
      <table className="hidden w-full text-sm sm:table">
        <caption className="sr-only">Categories of personal information Durqo collects</caption>
        <thead>
          <tr className="bg-paper-sunk text-left text-xs uppercase tracking-wide text-ink-faint">
            <th scope="col" className="px-4 py-2.5 font-semibold">Category</th>
            <th scope="col" className="px-4 py-2.5 font-semibold">Examples</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.category} className="border-t border-rule align-top">
              <td className="w-[220px] px-4 py-3 font-semibold text-ink">{row.category}</td>
              <td className="px-4 py-3 text-ink-soft">{row.examples}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Mobile: stacked cards, no horizontal scroll */}
      <div className="flex flex-col divide-y divide-rule sm:hidden">
        {rows.map((row) => (
          <div key={row.category} className="flex flex-col gap-1 p-4">
            <p className="text-sm font-semibold text-ink">{row.category}</p>
            <p className="text-left text-sm text-ink-soft">{row.examples}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const INFO_CATEGORIES: InfoCategory[] = [
  { category: "Account & identity", examples: "Name, email address, account credentials, and, where required, seller identity-verification information." },
  { category: "Business & listing", examples: "Information about the businesses you list, inquire about, or transact on, including business details and supporting documents." },
  { category: "Payment & transaction", examples: "Payment details, transaction records, offers, and payout status, processed by our payment providers; and, if you request a withdrawal as a Seller, the payout account details you provide (such as a bank account number, mobile financial service number, or PayPal/Wise email — see Section 07)." },
  { category: "Messages & support", examples: "Messages with other users and with our support team, and related records." },
  { category: "Device & usage", examples: "Information about your device, browser, IP address, and how you use the Platform (pages viewed, features used)." },
  { category: "Connected analytics", examples: "If a Seller connects a Google Analytics 4 property to their own Listing, we access aggregated, read-only performance metrics for that property only (see Section 08)." },
];

// Provider table: every row's status reflects what's actually confirmed in
// the codebase today. See src/lib/escrow.ts, src/components/BuyNowButton.tsx,
// and src/app/terms/page.tsx (Sep 11, 2026 update) for the fuller citation
// trail. Escrow.com and SSLCommerz are both confirmed live integrations as
// of that update; a row is only marked "live" once it's actually confirmed
// operational this way, same discipline as the original Sep 6, 2026 audit.
type Provider = { name: string; purpose: React.ReactNode; tone: "live" | "planned" };

const PROVIDERS: Provider[] = [
  {
    name: "Escrow.com",
    purpose:
      "In use today when a Buyer and Seller choose to complete a transaction through Escrow.com instead of paying through Durqo directly. Escrow.com receives the Buyer's and Seller's email addresses, the transaction description and amount, and information related to funding, asset transfer, inspection, and release of the transaction. Escrow.com is a genuine, independent, licensed escrow provider, not part of Durqo, and its own privacy policy governs the information it holds directly.",
    tone: "live",
  },
  {
    name: "Stripe",
    purpose:
      "In use today to process a Buyer's card payment for a purchase on the Platform. Stripe is a payment processor, not an escrow provider.",
    tone: "live",
  },
  {
    name: "SSLCommerz",
    purpose:
      "In use today to process a Bangladeshi Buyer's payment, in Bangladeshi Taka via bKash, Rocket, Nagad, or bank transfer, for a purchase on the Platform. SSLCommerz is a payment gateway/processor, not an escrow provider.",
    tone: "live",
  },
  {
    name: "Payout providers (Bank Transfer, bKash, Rocket, Nagad, PayPal, Wise)",
    purpose:
      "In use today when a Seller requests a withdrawal of their sale proceeds. We share the payout account details the Seller provides (such as a bank account number, mobile financial service number, or PayPal/Wise email) with the relevant bank or payment service needed to complete that specific payout.",
    tone: "live",
  },
  {
    name: "Supabase",
    purpose: "Database, authentication, and storage services for the Platform.",
    tone: "live",
  },
  {
    name: "Vercel",
    purpose: "Website hosting and delivery for the Platform.",
    tone: "live",
  },
  {
    name: "Google",
    purpose:
      "OAuth authorization and read-only Google Analytics 4 metrics, only for a Listing whose Seller has chosen to connect their own GA4 property.",
    tone: "live",
  },
];

function ProviderTable() {
  return (
    <div className="flex flex-col divide-y divide-rule rounded-lg border border-rule bg-paper-raised">
      {PROVIDERS.map((p) => (
        <div key={p.name} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="flex items-center gap-2 sm:w-[200px] sm:shrink-0">
            <p className="text-sm font-semibold text-ink">{p.name}</p>
            <StatusBadge tone={p.tone}>{p.tone === "live" ? "In use today" : "Not yet available"}</StatusBadge>
          </div>
          <p className="text-left text-sm leading-relaxed text-ink-soft">{p.purpose}</p>
        </div>
      ))}
    </div>
  );
}

// Cookie inventory: this is the actual, complete list from a full repo
// grep for cookie-writing code (`cookies(`, `.cookies.set(`), not a
// generic four-category template. Today there is exactly one cookie in
// this app — the Supabase auth session cookie set by @supabase/ssr in
// src/lib/supabase/server.ts (server components) and src/proxy.ts
// (middleware, keeps the session refreshed). There is no functional,
// analytics, or marketing cookie, and no localStorage usage, anywhere in
// the codebase — the wishlist and cart features are both backed by
// Supabase database tables tied to the signed-in user, not cookies.
function CookieTable() {
  const rows: { name: string; provider: string; purpose: string; category: string; duration: string }[] = [
    {
      name: "Supabase authentication session",
      provider: "Supabase (first-party)",
      purpose: "Keeps you signed in and secures your session across page loads.",
      category: "Strictly necessary",
      duration: "Session, refreshed automatically while you're signed in; cleared on sign-out or expiry.",
    },
  ];
  return (
    <div className="overflow-x-auto rounded-lg border border-rule">
      <table className="w-full min-w-[640px] text-sm">
        <caption className="sr-only">Cookies used by the Durqo Platform</caption>
        <thead>
          <tr className="bg-paper-sunk text-left text-xs uppercase tracking-wide text-ink-faint">
            <th scope="col" className="px-4 py-2.5 font-semibold">Name</th>
            <th scope="col" className="px-4 py-2.5 font-semibold">Provider</th>
            <th scope="col" className="px-4 py-2.5 font-semibold">Purpose</th>
            <th scope="col" className="px-4 py-2.5 font-semibold">Category</th>
            <th scope="col" className="px-4 py-2.5 font-semibold">Duration</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name} className="border-t border-rule align-top">
              <td className="px-4 py-3 font-semibold text-ink">{r.name}</td>
              <td className="px-4 py-3 text-ink-soft">{r.provider}</td>
              <td className="px-4 py-3 text-ink-soft">{r.purpose}</td>
              <td className="px-4 py-3 text-ink-soft">{r.category}</td>
              <td className="px-4 py-3 text-ink-soft">{r.duration}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const RETENTION_ROWS: { category: string; criteria: string }[] = [
  { category: "Account information", criteria: "For as long as your account is active, plus a reasonable period afterward to meet legal, tax, and accounting obligations and to resolve disputes." },
  { category: "Verification documents", criteria: "For as long as needed to complete and support the verification they relate to, and afterward where needed for fraud prevention or legal compliance." },
  { category: "Listings & supporting evidence", criteria: "For as long as the listing is active, and for a reasonable period after removal to support dispute resolution or legal requirements." },
  { category: "Messages", criteria: "For as long as needed to support the transaction or support request they relate to, and afterward where needed for dispute resolution." },
  { category: "Transaction & payment records", criteria: "Retained longer than most other categories where needed to meet accounting, tax, or legal recordkeeping obligations, or to support a dispute." },
  { category: "Connected GA4 metrics & OAuth tokens", criteria: "Retained only while a Listing's Google Analytics connection is active; deleted when the Seller disconnects it (see Section 08)." },
  { category: "Support records", criteria: "For as long as reasonably necessary to resolve your request and maintain a record of our support history." },
];

export default function PrivacyPage() {
  return (
    <main>
      <section className="border-b border-rule bg-brand-strong py-16 text-white sm:py-20">
        <Container>
          <p className="eyebrow mb-3 text-brand">Legal</p>
          <h1 className="mb-4 text-4xl text-white">Privacy Policy</h1>
          <p className="max-w-[70ch] text-left text-white/70">
            This Privacy Policy explains how Durqo collects, uses, shares and protects your information when you
            use our marketplace. We aim to be clear and transparent about your data and your choices.
          </p>
          <div className="mt-6 flex flex-col gap-1 text-sm text-white/60 sm:flex-row sm:items-center sm:gap-4">
            <p className="mono">Effective date: {EFFECTIVE_DATE}</p>
            <p>
              Questions? Contact us at{" "}
              <a href="mailto:support@durqo.com" className="font-semibold text-brand hover:text-white">
                support@durqo.com
              </a>
            </p>
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container>
          <div className="mb-12 grid gap-4 sm:grid-cols-3">
            <SummaryCard eyebrow="Purpose limited" icon={<span aria-hidden>◎</span>}>
              We collect and use personal information only for identified and permitted purposes.
            </SummaryCard>
            <SummaryCard eyebrow="No data sales" icon={<span aria-hidden>⊘</span>}>
              We do not sell personal information.
            </SummaryCard>
            <SummaryCard eyebrow="User control" icon={<span aria-hidden>◐</span>}>
              You may have choices and rights over your information, subject to applicable law.
            </SummaryCard>
          </div>

          {/* grid-cols use minmax(0, 1fr) rather than plain 1fr — without the
              explicit 0 minimum, a CSS Grid track's automatic minimum size
              is based on its content's min-content width, so the wide
              (min-w-[640px]) cookie table a few levels down would otherwise
              stretch this whole column (and everything sharing its track,
              including the mobile TOC button) past the viewport instead of
              scrolling inside its own overflow-x-auto wrapper. */}
          <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-12">
            <PrivacyToc items={SECTIONS.map((s) => ({ id: s.id, num: s.num, title: s.title }))} />

            <div className="flex min-w-0 max-w-[760px] flex-col gap-10">
              <Section id="scope" num="01" title="Scope and Who We Are">
                <p>
                  This Privacy Policy applies to the Durqo website, marketplace, and related services (together,
                  the &ldquo;Services&rdquo;). Durqo is a digital-business marketplace that connects Buyers and
                  Sellers. For the purposes of applicable data protection laws, Durqo is the controller of personal
                  information collected through the Services, unless otherwise stated. This Policy applies to
                  Buyers, Sellers, and visitors alike, and should be read together with our{" "}
                  <a href="/terms" className="font-semibold text-brand-hover">
                    Terms and Conditions
                  </a>
                  .
                </p>
              </Section>

              <Section id="information-we-collect" num="02" title="Information We Collect">
                <p>We collect information you provide to us, information related to your use of the Services, and information from third-party sources. The categories we collect include:</p>
                <InfoCategoryTable rows={INFO_CATEGORIES} />
              </Section>

              <Section id="sources" num="03" title="Sources of Information">
                <p>
                  We may collect information directly from you (for example, when you create an account or submit
                  a Listing), from your use of the Services (for example, device and usage data), from third-party
                  service providers who help us operate the Platform, and, where permitted, from other sources such
                  as public records.
                </p>
              </Section>

              <Section id="how-we-use" num="04" title="How We Use Information">
                <p>We use information to:</p>
                <List
                  items={[
                    "Provide, operate, and improve the Services, including creating and securing your account and verifying Seller identity where required.",
                    "Facilitate transactions between Buyers and Sellers, including processing payments through the providers listed in Section 07.",
                    "Communicate with you, including responding to support requests and sending service communications such as order or verification updates.",
                    "Comply with legal obligations, and protect the security and integrity of the Platform.",
                    "With your consent or opt-out, send occasional product updates or promotional content.",
                  ]}
                />
              </Section>

              <Section id="consent" num="05" title="Consent and Applicable Processing Grounds">
                <p>
                  Where applicable, we rely on legal bases such as your consent, the performance of a contract with
                  you, our legitimate interests in operating and securing the Platform, and compliance with legal
                  obligations. Which basis applies can depend on where you live and the specific processing
                  activity; you may have the right to withdraw consent at any time where consent is the basis we
                  rely on, without affecting processing already carried out.
                </p>
              </Section>

              <Section id="how-we-disclose" num="06" title="How We Disclose Information">
                <p>We do not sell your personal information. We may share information with:</p>
                <List
                  items={[
                    "Service providers who help us operate the Platform, including the payment, hosting, database, and analytics providers described in Section 07.",
                    "Other Platform users, limited to what's reasonably necessary to complete a transaction you're party to (for example, contact details once a deal is agreed).",
                    "Professional advisers, such as legal, accounting, or insurance advisers, where necessary.",
                    "Regulators and other third parties where required or permitted by law, to enforce our agreements, or to protect the rights and safety of Durqo or our users.",
                  ]}
                />
              </Section>

              <Section id="providers" num="07" title="Payments, Escrow and Service Providers">
                <p>We use the following providers for payments, escrow, payouts, hosting, and analytics. The status shown reflects what is actually operational today:</p>
                <ProviderTable />
                <p className="text-left text-xs leading-relaxed text-ink-faint">
                  Durqo itself is not an escrow provider and does not directly hold or control Escrow.com&rsquo;s
                  funds. Stripe is a payment processor, not an escrow provider. SSLCommerz is a payment
                  gateway/processor, not an escrow provider. We will only describe an integration above as
                  &ldquo;In use today&rdquo; once it has actually been implemented and verified in production —
                  see our{" "}
                  <a href="/terms#payment-fees" className="font-semibold text-brand-hover">
                    Terms, Section 05
                  </a>{" "}
                  for the fuller description of today&rsquo;s real payment flow.
                </p>
              </Section>

              <Section id="cookies" num="08" title="Cookies and Analytics">
                <p>
                  The Platform currently uses a single cookie, described below, to keep you signed in. We do not
                  currently set functional, analytics, or marketing cookies of any kind.
                </p>
                <CookieTable />
                <p>
                  Because we don&rsquo;t currently set non-essential cookies, there is nothing beyond your
                  browser&rsquo;s own cookie controls for you to opt out of. If that changes, we will add an
                  in-page cookie-preference control here before any non-essential cookie is set.
                </p>
                <SubHeading>Google Analytics — two distinct things</SubHeading>
                <p>
                  Durqo does not currently run its own site-wide analytics tracking of durqo.com visitors beyond the
                  session cookie above. Separately, a Seller can optionally connect their own Listing to their own
                  Google Analytics 4 property:
                </p>
                <List
                  items={[
                    "The connection uses Google's OAuth flow with a single, read-only scope (analytics.readonly) — we never request permission to edit your GA4 property.",
                    "We store the resulting access and refresh tokens in our database, accessible only through server-side, administrative code paths — never returned to any browser.",
                    "We only ever display aggregated, read-only traffic metrics (page views, sessions, bounce rate, and similar) for the connected property, shown publicly on that Listing's page.",
                    "A Seller can disconnect at any time from their listing dashboard; disconnecting revokes the Google token and deletes both the stored connection and the displayed metrics.",
                    "A Seller can also revoke Durqo's access directly from their Google Account's third-party access settings at any time, independently of our own disconnect option.",
                  ]}
                />
              </Section>

              <Section id="retention" num="09" title="Data Retention">
                <p>
                  We retain personal information only for as long as reasonably necessary for the purposes
                  described in this Policy, including providing the Platform, completing transactions, meeting
                  legal and accounting obligations, preventing fraud, resolving disputes, and enforcing our
                  agreements. We then delete or de-identify the information unless continued retention is required
                  or permitted by law. We can&rsquo;t promise immediate deletion of records we&rsquo;re legally
                  required to keep.
                </p>
                <div className="overflow-x-auto rounded-lg border border-rule">
                  <table className="w-full min-w-[560px] text-sm">
                    <caption className="sr-only">Retention criteria by information category</caption>
                    <thead>
                      <tr className="bg-paper-sunk text-left text-xs uppercase tracking-wide text-ink-faint">
                        <th scope="col" className="px-4 py-2.5 font-semibold">Category</th>
                        <th scope="col" className="px-4 py-2.5 font-semibold">Retention criteria</th>
                      </tr>
                    </thead>
                    <tbody>
                      {RETENTION_ROWS.map((r) => (
                        <tr key={r.category} className="border-t border-rule align-top">
                          <td className="w-[240px] px-4 py-3 font-semibold text-ink">{r.category}</td>
                          <td className="px-4 py-3 text-ink-soft">{r.criteria}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Section>

              <Section id="security" num="10" title="Security and Privacy Incidents">
                <p>
                  We use administrative, technical, and organizational safeguards appropriate to the sensitivity of
                  the personal information we handle. Traffic to the Platform is encrypted in transit (HTTPS), and
                  our hosting and database providers encrypt stored data at rest as a standard feature of their
                  infrastructure. Access to sensitive information, such as payment details and connected-analytics
                  credentials, is restricted to what is strictly necessary to operate the Platform. However, no
                  method of transmission or storage is completely secure, and we cannot guarantee absolute
                  security.
                </p>
                <p>
                  If we become aware of a security incident affecting your personal information, we will assess it
                  and, where required by applicable law, notify affected individuals and/or the relevant regulator
                  within the timeframe that law requires, and keep an internal record of the incident and our
                  response.
                </p>
              </Section>

              <Section id="international" num="11" title="International Processing and Transfers">
                <p>
                  Durqo serves Buyers and Sellers in multiple countries, so your information may be processed and
                  stored in a country other than your own. Different privacy laws may apply there, and foreign
                  courts, regulators, or authorities may lawfully be able to access information in that country.
                  Where this happens, we use reasonable contractual, technical, and organizational safeguards,
                  where appropriate, in addition to relying on our service providers&rsquo; own safeguards for
                  cross-border data transfers.
                </p>
              </Section>

              <Section id="rights" num="12" title="Privacy Rights and Choices">
                <p>Depending on where you live, you may have some or all of the following rights over your personal information:</p>
                <div className="rounded-lg border border-rule bg-brand-soft/40 p-5">
                  <p className="mb-3 text-sm font-semibold text-ink">Your privacy choices</p>
                  <List
                    items={[
                      "Access — request a copy of your information.",
                      "Correction — ask us to correct inaccurate or incomplete information.",
                      "Deletion — request deletion of your information, subject to our legal and contractual retention needs.",
                      "Objection / restriction — object to certain processing, or ask us to limit how we use your information.",
                      "Portability — request your information in a portable format, where applicable.",
                      "Marketing opt-out — unsubscribe from marketing communications at any time, using the link in any email or by contacting us.",
                      "Complaints — where applicable, lodge a complaint with your local data protection authority.",
                    ]}
                  />
                  <a
                    href="mailto:support@durqo.com?subject=Privacy%20request"
                    className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover"
                  >
                    Submit a privacy request
                  </a>
                </div>
                <p>
                  We may need to verify your identity before acting on a request, and an authorized representative
                  submitting a request on your behalf may need to provide proof of that authorization. Some
                  requests may be limited by law, and certain transaction or legal records may need to be retained
                  even after a deletion request. We will respond within the timeframe required by applicable law.
                </p>
              </Section>

              <Section id="children" num="13" title="Children's Privacy">
                <p>
                  The Platform is intended only for individuals who are at least 18 years old, consistent with the
                  eligibility requirement in our{" "}
                  <a href="/terms" className="font-semibold text-brand-hover">
                    Terms and Conditions
                  </a>
                  . Durqo does not knowingly collect personal information from anyone under 18. If you believe a
                  minor has provided personal information, please contact us at{" "}
                  <a href="mailto:support@durqo.com" className="font-semibold text-brand-hover">
                    support@durqo.com
                  </a>
                  .
                </p>
              </Section>

              <Section id="changes" num="14" title="Changes, Complaints and Contact">
                <p>
                  We may update this Privacy Policy from time to time to reflect changes to the Platform or
                  applicable law. When we make material changes, we will update the effective date at the top of
                  this page, and where appropriate, notify you directly. If you have concerns about how we&rsquo;ve
                  handled your information that we haven&rsquo;t resolved, you may have the right to lodge a
                  complaint with your local data protection authority, in addition to contacting us directly.
                </p>
                <p>If you have any questions about this Policy, please reach out.</p>
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
