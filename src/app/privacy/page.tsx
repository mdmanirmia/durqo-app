import Container from "@/components/ui/Container";

export const metadata = { title: "Privacy Policy — Durqo" };

export default function PrivacyPage() {
  return (
    <Container className="py-16 sm:py-20">
      <h1 className="text-3xl">Privacy Policy</h1>
      <p className="mt-4 max-w-[65ch] leading-relaxed text-ink-soft">
        Durqo&rsquo;s full privacy policy is being finalized. Account, listing and messaging data is stored with
        Supabase, and payments are processed by Stripe — we don&rsquo;t sell personal data to third parties. If
        you have a specific question about what&rsquo;s collected or how it&rsquo;s used before this page
        publishes in full, reach out directly.
      </p>
      <a href="mailto:support@durqo.com" className="mt-6 inline-block text-sm font-semibold text-brand-hover">
        support@durqo.com
      </a>
    </Container>
  );
}
