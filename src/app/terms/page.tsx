import Container from "@/components/ui/Container";

export const metadata = { title: "Terms of Service — Durqo" };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10 border-t border-rule pt-8 first:mt-0 first:border-t-0 first:pt-0">
      <h2 className="mb-3 text-xl">{title}</h2>
      <div className="flex max-w-[70ch] flex-col gap-3 text-ink-soft">{children}</div>
    </section>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1.5 pl-5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export default function TermsPage() {
  return (
    <Container className="py-16 sm:py-20">
      <h1 className="text-3xl">Terms and Conditions</h1>
      <p className="mt-4 max-w-[65ch] leading-relaxed text-ink-soft">
        These Terms and Conditions govern your use of Durqo&rsquo;s website, marketplace, and services. By
        accessing or using Durqo, you agree to comply with them — if you don&rsquo;t agree, please refrain from
        using our services.
      </p>

      <div className="mt-10 flex flex-col">
        <Section title="1. Introduction">
          <p>
            Welcome to Durqo. By accessing and using our website, marketplace, and services, you agree to comply
            with these Terms and Conditions. If you do not agree, please refrain from using our services.
          </p>
        </Section>

        <Section title="2. Eligibility">
          <List
            items={[
              "You must be at least 18 years old to use our platform.",
              "You must provide accurate and truthful information when registering an account.",
              "We reserve the right to suspend or terminate accounts that violate our terms.",
            ]}
          />
        </Section>

        <Section title="3. Buying and Selling Process">
          <div>
            <h3 className="mb-1.5 text-sm font-semibold text-ink">3.1 Sellers</h3>
            <List
              items={[
                "Sellers must provide accurate details about the business, including financial data, website traffic, and revenue.",
                "Listings should not contain false or misleading information.",
                "Sellers must transfer the business within the agreed timeframe after receiving payment.",
                "A success fee (commission) is charged only when a sale is completed.",
              ]}
            />
          </div>
          <div className="mt-4">
            <h3 className="mb-1.5 text-sm font-semibold text-ink">3.2 Buyers</h3>
            <List
              items={[
                "Buyers must conduct due diligence before making a purchase.",
                "Payments should be made only through approved payment methods (e.g., escrow, wire transfer).",
                "Buyers are responsible for understanding the risks associated with digital business acquisitions.",
              ]}
            />
          </div>
        </Section>

        <Section title="4. Payment and Fees">
          <List
            items={[
              "There are no listing fees for sellers.",
              "The platform charges a commission on successful sales: $1 – $50,000: 10%; $50,000 – $100,000: 8%; $100,000 – $500,000: 5%; over $500,000: 3%.",
              "Buyers using credit/debit cards will incur a 3% processing fee.",
              "Escrow service fees are typically split between the buyer and seller.",
            ]}
          />
        </Section>

        <Section title="5. Refunds and Disputes">
          <List
            items={[
              "Once a business is transferred, all sales are final.",
              "Refunds are only granted in cases of fraud or breach of agreement.",
              "Any disputes must be reported within 7 days of transaction completion.",
            ]}
          />
        </Section>

        <Section title="6. User Conduct">
          <p>Users must not:</p>
          <List
            items={[
              "Use the platform for illegal or fraudulent activities.",
              "Engage in unauthorized reselling, spamming, or hacking.",
              "Post offensive, misleading, or defamatory content.",
            ]}
          />
        </Section>

        <Section title="7. Intellectual Property">
          <p>
            All content, logos, trademarks, and data on the platform belong to Durqo and cannot be copied or
            distributed without permission.
          </p>
        </Section>

        <Section title="8. Limitation of Liability">
          <List
            items={[
              "We are not responsible for any losses resulting from business transactions.",
              "We do not guarantee profits or future performance of businesses sold on the platform.",
              "Users assume full responsibility for their transactions.",
            ]}
          />
        </Section>

        <Section title="9. Termination of Accounts">
          <p>
            We reserve the right to suspend or terminate accounts that violate our terms, including fraudulent
            activity or abuse.
          </p>
        </Section>

        <Section title="10. Changes to Terms">
          <p>We may update these terms at any time. Continued use of the platform indicates acceptance of the latest terms.</p>
        </Section>
      </div>

      <p className="mt-10 border-t border-rule pt-8 text-sm text-ink-faint">
        Questions about these terms? Reach out at{" "}
        <a href="mailto:support@durqo.com" className="font-semibold text-brand-hover">
          support@durqo.com
        </a>
        .
      </p>
    </Container>
  );
}
