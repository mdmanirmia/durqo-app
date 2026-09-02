import Container from "@/components/ui/Container";

export const metadata = { title: "Privacy Policy — Durqo" };

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

export default function PrivacyPage() {
  return (
    <Container className="py-16 sm:py-20">
      <h1 className="text-3xl">Privacy Policy</h1>
      <p className="mt-4 max-w-[65ch] leading-relaxed text-ink-soft">
        At Durqo, we value your privacy and are committed to protecting your personal data. This policy explains
        how we collect, use, and safeguard your information.
      </p>

      <div className="mt-10 flex flex-col">
        <Section title="1. Introduction">
          <p>
            At Durqo, we value your privacy and are committed to protecting your personal data. This policy
            explains how we collect, use, and safeguard your information.
          </p>
        </Section>

        <Section title="2. Information We Collect">
          <p>The platform gathers three categories of data:</p>
          <List
            items={[
              "Personal Information — name, email, contact number, payment details.",
              "Business Information — listings, sales data, analytics.",
              "Technical Data — IP address, browser type, cookies.",
            ]}
          />
        </Section>

        <Section title="3. How We Use Your Information">
          <p>
            Data serves purposes including account management, transaction processing, platform security
            enhancement, and communications about updates and promotional content (with opt-out availability).
          </p>
        </Section>

        <Section title="4. Data Security">
          <p>
            We use encryption, secure servers, and authentication measures to protect your data. However, no
            online service is 100% secure.
          </p>
        </Section>

        <Section title="5. Sharing Your Data">
          <p>
            We do not sell your data. We may share information with payment processors, escrow services, and
            legal authorities when required by law.
          </p>
        </Section>

        <Section title="6. Cookies and Tracking">
          <p>
            The site employs cookies to enhance user experience and monitor usage; users can disable this in
            browser settings.
          </p>
        </Section>

        <Section title="7. Your Rights">
          <p>
            Users may access personal data, request corrections or deletions, and opt out of marketing
            communications.
          </p>
        </Section>

        <Section title="8. Data Retention">
          <p>Information is retained as needed for legal and business requirements.</p>
        </Section>

        <Section title="9. Third-Party Links">
          <p>The platform disclaims responsibility for external websites&rsquo; privacy practices.</p>
        </Section>

        <Section title="10. Updates to Privacy Policy">
          <p>Policy modifications will be posted on this page as they occur.</p>
        </Section>
      </div>

      <p className="mt-10 border-t border-rule pt-8 text-sm text-ink-faint">
        Questions about this policy? Reach out at{" "}
        <a href="mailto:support@durqo.com" className="font-semibold text-brand-hover">
          support@durqo.com
        </a>
        .
      </p>
    </Container>
  );
}
