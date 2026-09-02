import Container from "@/components/ui/Container";

export const metadata = { title: "Privacy Policy — Durqo" };

const EFFECTIVE_DATE = "September 2, 2026";

const SECTIONS = [
  { id: "introduction", num: "01", title: "Introduction & Scope" },
  { id: "information-we-collect", num: "02", title: "Information We Collect" },
  { id: "how-we-use", num: "03", title: "How We Use Your Information" },
  { id: "how-we-share", num: "04", title: "How We Share Your Information" },
  { id: "cookies", num: "05", title: "Cookies & Tracking Technologies" },
  { id: "security", num: "06", title: "Data Security" },
  { id: "retention", num: "07", title: "Data Retention" },
  { id: "rights", num: "08", title: "Your Privacy Rights & Choices" },
  { id: "children", num: "09", title: "Children's Privacy" },
  { id: "international", num: "10", title: "International Users" },
  { id: "third-party-links", num: "11", title: "Third-Party Links" },
  { id: "changes", num: "12", title: "Changes to This Policy & Contact" },
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
      <div className="flex max-w-[70ch] flex-col gap-3.5 leading-relaxed text-ink-soft">{children}</div>
    </section>
  );
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

function DataTable() {
  const rows: [string, string, string][] = [
    ["Account & identity", "Name, email address, phone number, verification documents", "Creating and securing your account, identity verification for Sellers"],
    ["Payment information", "Billing details processed by our payment provider", "Processing purchases, Success Fees, and payouts"],
    ["Business & listing data", "Listing details, financial figures, traffic data, Google Analytics data you connect", "Publishing and verifying listings, showing accurate data to Buyers"],
    ["Technical data", "IP address, browser type, device information, cookies", "Keeping the Platform secure and working correctly"],
    ["Usage data", "Pages viewed, searches, messages sent through the Platform", "Improving the Platform and responding to support requests"],
  ];
  return (
    <div className="overflow-x-auto rounded-lg border border-rule">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="bg-paper-sunk text-left text-xs uppercase tracking-wide text-ink-faint">
            <th className="px-4 py-2.5 font-semibold">Category</th>
            <th className="px-4 py-2.5 font-semibold">Examples</th>
            <th className="px-4 py-2.5 font-semibold">Why we collect it</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([category, examples, purpose]) => (
            <tr key={category} className="border-t border-rule align-top">
              <td className="px-4 py-3 font-semibold text-ink">{category}</td>
              <td className="px-4 py-3 text-ink-soft">{examples}</td>
              <td className="px-4 py-3 text-ink-soft">{purpose}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PrivacyPage() {
  return (
    <main>
      <section className="border-b border-rule bg-paper-sunk py-16 sm:py-24">
        <Container>
          <div className="grid gap-10 md:grid-cols-2 md:items-start">
            <div>
              <p className="eyebrow mb-3">Legal</p>
              <h1 className="mb-4 text-4xl">Privacy Policy</h1>
              <p className="max-w-[52ch] text-ink-soft">
                At Durqo, we know you&rsquo;re trusting us with sensitive business and financial information. This
                policy explains, in plain language, what we collect, how we use it, and the choices you have.
              </p>
            </div>
            <div className="rounded-xl border border-rule-strong bg-paper-raised p-8">
              <p className="mono mb-2 text-xs text-ink-faint">EFFECTIVE {EFFECTIVE_DATE.toUpperCase()}</p>
              <h3 className="mb-1 text-2xl">Questions about your data?</h3>
              <p className="mb-4 text-ink-soft">Reach out any time — we&rsquo;ll answer directly, no ticket queue.</p>
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
              <Section id="introduction" num="01" title="Introduction & Scope">
                <p>
                  This Privacy Policy explains how Durqo (&ldquo;Durqo,&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;)
                  collects, uses, shares, and protects information when you visit our website, create an
                  account, list a business for sale, or purchase a business through our marketplace (together,
                  the &ldquo;Platform&rdquo;). It applies to Buyers, Sellers, and visitors alike. By using the
                  Platform, you agree to the collection and use of information as described here — if you
                  don&rsquo;t agree, please don&rsquo;t use the Platform.
                </p>
              </Section>

              <Section id="information-we-collect" num="02" title="Information We Collect">
                <p>We collect the following categories of information in order to operate the Platform:</p>
                <DataTable />
                <p>
                  Where you connect a Google Analytics 4 property to a Listing, we only ever access aggregated,
                  read-only traffic metrics through Google&rsquo;s own authorization flow — we never request
                  access to edit your property, and you can revoke that access from your Google Account at any
                  time.
                </p>
              </Section>

              <Section id="how-we-use" num="03" title="How We Use Your Information">
                <p>We use the information described above to:</p>
                <List
                  items={[
                    "Create, secure, and manage your account, including verifying Seller identity where required.",
                    "Process transactions, Success Fees, and payouts, and connect Buyers and Sellers through escrow.",
                    "Display listing data accurately to prospective Buyers, and independently verify figures a Seller has submitted.",
                    "Maintain and improve the security, reliability, and performance of the Platform.",
                    "Respond to support requests and send you service communications, such as order updates or verification results.",
                    "Send occasional product updates or promotional content — always with the option to opt out.",
                  ]}
                />
              </Section>

              <Section id="how-we-share" num="04" title="How We Share Your Information">
                <p>
                  We do not sell your personal data. We share information only with the parties needed to
                  operate the Platform and complete your transactions, including:
                </p>
                <List
                  items={[
                    <>
                      <strong className="text-ink">Payment and escrow providers</strong> (such as Stripe and our
                      Escrow Provider) — to process payments and hold funds securely during a transaction.
                    </>,
                    <>
                      <strong className="text-ink">Infrastructure and hosting providers</strong> (such as
                      Supabase) — to securely store account, listing, and messaging data.
                    </>,
                    <>
                      <strong className="text-ink">Other Platform users</strong> — a Buyer and Seller in an
                      active transaction see the information reasonably necessary to complete that transaction
                      (for example, contact details once a deal is agreed).
                    </>,
                    <>
                      <strong className="text-ink">Legal and regulatory authorities</strong> — when required to
                      comply with the law, enforce these policies, or protect the rights and safety of Durqo or
                      our users.
                    </>,
                  ]}
                />
              </Section>

              <Section id="cookies" num="05" title="Cookies & Tracking Technologies">
                <p>The Platform uses cookies and similar technologies to keep you signed in, remember your preferences, and understand how the Platform is used:</p>
                <List
                  items={[
                    <>
                      <strong className="text-ink">Essential cookies</strong> — required for core functionality
                      such as staying logged in and securing your session; the Platform will not work correctly
                      without these.
                    </>,
                    <>
                      <strong className="text-ink">Functional cookies</strong> — remember preferences such as
                      your saved searches or wishlist.
                    </>,
                    <>
                      <strong className="text-ink">Analytics cookies</strong> — help us understand how the
                      Platform is used, so we can improve it.
                    </>,
                  ]}
                />
                <p>You can disable non-essential cookies at any time through your browser settings.</p>
              </Section>

              <Section id="security" num="06" title="Data Security">
                <p>
                  We use encryption in transit and at rest, secure hosting infrastructure, and authentication
                  safeguards to protect your data. Access to sensitive information — such as payment details and
                  connected analytics credentials — is restricted to what is strictly necessary to operate the
                  Platform. However, no method of transmission or storage is 100% secure, and we cannot guarantee
                  absolute security.
                </p>
              </Section>

              <Section id="retention" num="07" title="Data Retention">
                <p>
                  We retain personal information for as long as your account is active, and for a reasonable
                  period afterward as needed to comply with legal, tax, and accounting obligations, resolve
                  disputes, and enforce our agreements. Listing and transaction records connected to a completed
                  sale may be retained longer where needed to support both parties in the event of a future
                  dispute.
                </p>
              </Section>

              <Section id="rights" num="08" title="Your Privacy Rights & Choices">
                <p>Depending on where you live, you may have some or all of the following rights over your personal data:</p>
                <List
                  items={[
                    "Access — request a copy of the personal data we hold about you.",
                    "Correction — ask us to correct inaccurate or incomplete data.",
                    "Deletion — ask us to delete your personal data, subject to our legal and contractual retention needs.",
                    "Restriction & objection — ask us to limit how we use your data, or object to certain uses.",
                    "Portability — request your data in a portable format.",
                    "Opt-out — unsubscribe from marketing communications at any time using the link in any email, or by contacting us directly.",
                  ]}
                />
                <p>
                  To exercise any of these rights, contact us at{" "}
                  <a href="mailto:support@durqo.com" className="font-semibold text-brand-hover">
                    support@durqo.com
                  </a>{" "}
                  — we&rsquo;ll respond as quickly as we can.
                </p>
              </Section>

              <Section id="children" num="09" title="Children's Privacy">
                <p>
                  The Platform is intended for users aged 18 and older, consistent with the eligibility
                  requirement in our{" "}
                  <a href="/terms" className="font-semibold text-brand-hover">
                    Terms and Conditions
                  </a>
                  . We do not knowingly collect personal information from anyone under 18. If you believe a
                  minor has provided us with personal information, please contact us and we will take steps to
                  delete it.
                </p>
              </Section>

              <Section id="international" num="10" title="International Users">
                <p>
                  Durqo serves Buyers and Sellers in multiple countries, which means your information may be
                  processed and stored in a country other than your own. Where this happens, we rely on our
                  service providers&rsquo; own safeguards for cross-border data transfers, and take reasonable
                  steps to ensure your data continues to receive an appropriate level of protection wherever it
                  is processed.
                </p>
              </Section>

              <Section id="third-party-links" num="11" title="Third-Party Links">
                <p>
                  The Platform may contain links to third-party websites — including a Seller&rsquo;s own
                  business or website. We are not responsible for the privacy practices or content of any
                  third-party site, and we encourage you to review the privacy policy of any site you visit.
                </p>
              </Section>

              <Section id="changes" num="12" title="Changes to This Policy & Contact">
                <p>
                  We may update this Privacy Policy from time to time to reflect changes to the Platform or
                  applicable law. When we make material changes, we will update the effective date at the top of
                  this page, and where appropriate, notify you directly.
                </p>
                <p>If you have any questions about this policy or how your data is handled, reach out — we&rsquo;re glad to explain.</p>
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
