import Container from "@/components/ui/Container";

export const metadata = { title: "Terms and Conditions | Durqo" };

const EFFECTIVE_DATE = "September 2, 2026";

const SECTIONS = [
  { id: "acceptance", num: "01", title: "Acceptance of These Terms" },
  { id: "definitions", num: "02", title: "Definitions" },
  { id: "eligibility", num: "03", title: "Eligibility & Account Registration" },
  { id: "buying-selling", num: "04", title: "The Buying and Selling Process" },
  { id: "payment-fees", num: "05", title: "Payment, Fees & Escrow" },
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
      <div className="flex max-w-[70ch] flex-col gap-3.5 text-justify leading-relaxed text-ink-soft">{children}</div>
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
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

function FeeTable() {
  const rows = [
    ["$1 to $50,000", "10%"],
    ["$50,000 to $100,000", "8%"],
    ["$100,000 to $500,000", "5%"],
    ["Over $500,000", "3%"],
  ];
  return (
    <div className="overflow-hidden rounded-lg border border-rule">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-paper-sunk text-left text-xs uppercase tracking-wide text-ink-faint">
            <th className="px-4 py-2.5 font-semibold">Final Sale Price</th>
            <th className="px-4 py-2.5 font-semibold">Durqo Success Fee</th>
          </tr>
        </thead>
        <tbody className="mono">
          {rows.map(([range, fee]) => (
            <tr key={range} className="border-t border-rule">
              <td className="px-4 py-2.5 text-ink-soft">{range}</td>
              <td className="px-4 py-2.5 text-ink">{fee}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
              <p className="max-w-[52ch] text-justify text-ink-soft">
                These Terms and Conditions (&ldquo;Terms&rdquo;) govern your access to and use of Durqo&rsquo;s
                website, marketplace, and related services (together, the &ldquo;Platform&rdquo;). Please read
                them carefully before you create an account, list a business, or make a purchase.
              </p>
            </div>
            <div className="rounded-xl border border-rule-strong bg-paper-raised p-8">
              <p className="mono mb-2 text-xs text-ink-faint">EFFECTIVE {EFFECTIVE_DATE.toUpperCase()}</p>
              <h3 className="mb-1 text-2xl">Questions about these Terms?</h3>
              <p className="mb-4 text-justify text-ink-soft">Our team is happy to walk through any clause before you sign off on a listing or a purchase.</p>
              <a href="mailto:support@durqo.com" className="inline-block text-sm font-semibold text-brand-hover">
                support@durqo.com
              </a>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[240px_1fr]">
            {/* Table of contents */}
            <nav aria-label="Table of contents" className="hidden lg:block">
              <div className="sticky top-24 flex flex-col gap-1 border-l border-rule pl-4">
                <p className="mono mb-2 text-xs uppercase tracking-wide text-ink-faint">On this page</p>
                {SECTIONS.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="rounded-md px-2 py-1.5 text-sm text-ink-soft transition-colors hover:bg-paper-sunk hover:text-brand-hover"
                  >
                    {s.num}. {s.title}
                  </a>
                ))}
              </div>
            </nav>

            <div className="flex flex-col gap-10">
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
                      <strong className="text-ink">Escrow Provider:</strong> the independent third-party
                      escrow or payment service used to hold and release funds for a transaction.
                    </>,
                    <>
                      <strong className="text-ink">Success Fee:</strong> the commission Durqo charges a Seller
                      when a Listing successfully sells, calculated as set out in Section 5.
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
                  verification, communication, and payment through the Platform.
                </p>
                <SubHeading>4.1 Sellers</SubHeading>
                <List
                  items={[
                    "Sellers must provide accurate, complete, and non-misleading details about the business being listed, including financial data, website traffic, and revenue.",
                    "Listings must not contain false, exaggerated, or misleading claims, and any supporting screenshots or documents submitted for verification must genuinely belong to the listed business.",
                    "Once a sale is agreed and payment has cleared through the Escrow Provider, the Seller must transfer all assets, accounts, and access included in the sale within the timeframe agreed with the Buyer.",
                    "A Success Fee is charged only when a sale is completed; there is no charge simply for creating or maintaining a listing.",
                  ]}
                />
                <SubHeading>4.2 Buyers</SubHeading>
                <List
                  items={[
                    "Buyers are responsible for conducting their own due diligence on a business before committing to purchase it, including independently verifying any figures or claims that matter to their decision.",
                    "Payments must be made only through the payment methods approved on the Platform (for example, escrow or another Durqo-approved processor), never by paying a Seller directly outside the Platform.",
                    "Buyers acknowledge that acquiring an online business carries inherent risk, and that Durqo does not guarantee the future performance of any business purchased through the Platform.",
                  ]}
                />
              </Section>

              <Section id="payment-fees" num="05" title="Payment, Fees & Escrow">
                <p>
                  There are no listing fees for Sellers: creating and publishing a Listing is always free. Durqo
                  earns its Success Fee only when a Listing actually sells, calculated as a percentage of the
                  final sale price:
                </p>
                <FeeTable />
                <p>
                  Buyers paying by credit or debit card will incur an additional 3% payment processing fee,
                  charged by our payment processor rather than by Durqo directly. Where a transaction uses our
                  Escrow Provider, escrow fees are typically split evenly between the Buyer and the Seller unless
                  the parties agree otherwise before the transaction begins.
                </p>
                <p>
                  Funds for a purchase are held by the Escrow Provider until the agreed transfer conditions are
                  met, and are released to the Seller only once the Buyer has confirmed receipt of the assets
                  described in the Listing.
                </p>
              </Section>

              <Section id="disputes" num="06" title="Cancellations, Refunds & Disputes">
                <List
                  items={[
                    "Once a business has been transferred and the Buyer has confirmed receipt, the sale is final.",
                    "Refunds are granted only in cases of confirmed fraud, material misrepresentation, or a Seller's breach of the agreed transfer terms.",
                    "Any dispute relating to a transaction must be reported to Durqo within 7 days of the transaction's completion; disputes reported after this window may not be eligible for resolution through the Platform.",
                    "Where a dispute cannot be resolved directly between the Buyer and Seller, Durqo may, at its discretion and without obligation to do so, review the available evidence and help mediate a resolution, including via the Escrow Provider's own dispute process.",
                  ]}
                />
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
                  These Terms are governed by the laws applicable to Durqo&rsquo;s place of business, without
                  regard to conflict-of-law principles, except where mandatory local consumer-protection law
                  provides otherwise. If any provision of these Terms is found unenforceable, the remaining
                  provisions will continue in full force, and these Terms, together with our Privacy Policy,
                  constitute the entire agreement between you and Durqo regarding your use of the Platform.
                </p>
                <p>
                  If you have any questions about these Terms, please reach out; we&rsquo;re glad to explain any
                  clause in plain language before you rely on it.
                </p>
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
