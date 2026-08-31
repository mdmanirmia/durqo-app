import Container from "@/components/ui/Container";

export const metadata = { title: "Terms of Service — Durqo" };

export default function TermsPage() {
  return (
    <Container className="py-16 sm:py-20">
      <h1 className="text-3xl">Terms of Service</h1>
      <p className="mt-4 max-w-[65ch] leading-relaxed text-ink-soft">
        Durqo&rsquo;s full terms of service are being finalized. In the meantime, every transaction on the
        platform runs through our escrow partner and Stripe, and every listing goes through identity and
        financial review before it&rsquo;s published. If you have a question about a specific term before it
        publishes here, reach out and we&rsquo;ll answer directly.
      </p>
      <a href="mailto:support@durqo.com" className="mt-6 inline-block text-sm font-semibold text-brand-hover">
        support@durqo.com
      </a>
    </Container>
  );
}
