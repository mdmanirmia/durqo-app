import type { Metadata } from "next";
import { Suspense } from "react";
import { Mail, MapPin } from "lucide-react";
import FaqAccordion from "@/components/FaqAccordion";
import Container from "@/components/ui/Container";
import ContactForm from "./ContactForm";

// Sep 8, 2026 technical-SEO pass (Section 6): this page previously had no
// metadata at all (it inherited the homepage's title/description from the
// root layout) because the whole file was a "use client" component and
// Next.js only resolves metadata from Server Components. The interactive
// form now lives in ./ContactForm.tsx so this file can go back to being a
// plain server component — same rendered output, now with its own title/
// description/canonical/robots/OG.
export const metadata: Metadata = {
  title: "Contact Durqo | Marketplace Support",
  description: "Contact Durqo for assistance with buying, selling or managing a digital-business listing.",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "Durqo",
    title: "Contact Durqo | Marketplace Support",
    description: "Contact Durqo for assistance with buying, selling or managing a digital-business listing.",
    url: "https://www.durqo.com/contact",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Durqo | Marketplace Support",
    description: "Contact Durqo for assistance with buying, selling or managing a digital-business listing.",
  },
  alternates: { canonical: "https://www.durqo.com/contact" },
};

const FAQS = [
  { question: "How does Durqo verify a listing?", answer: "We request read-only access to analytics, payment processor exports and hosting records, and cross-check the numbers before a listing is marked Verified." },
  // Sep 6, 2026: corrected — Durqo has no third-party escrow integration
  // (Stripe Checkout pays straight into Durqo's own balance; seller payout
  // is a manual admin step). See src/lib/fees.ts and the /terms rebuild for
  // the full accuracy pass this FAQ answer was caught by.
  { question: "What happens to my money during a sale?", answer: "Your payment is processed through Durqo's payment provider, Stripe. Durqo holds the funds until the seller has transferred the agreed assets and you've confirmed receipt, then pays the seller their share." },
  // Sep 6, 2026: aligned with the /sell page's tiered pricing (10% under
  // $50k, 7% $50k–$250k, 5% over $250k) instead of the old vague "5-10%"
  // range, which didn't name the middle tier or the boundaries.
  { question: "What does Durqo charge?", answer: "Buyers pay nothing to browse or make offers. Sellers pay a tiered success fee — 10%, 7% or 5% depending on the final sale price — only when a deal closes." },
  { question: "Can I sell a business with no revenue yet?", answer: "Yes — domains and early-stage sites are listed regularly, though they won't carry a Verified income badge." },
];

export default function ContactPage() {
  return (
    <main className="py-14">
      <Container>
        <p className="mono mb-2 text-xs uppercase tracking-wider text-ink-faint">Contact us</p>
        <h1 className="mb-10 text-3xl">Talk to the Durqo team</h1>

        <div className="grid gap-12 md:grid-cols-2">
          <Suspense fallback={null}>
            <ContactForm />
          </Suspense>

          <div>
            <div className="flex gap-3 border-t border-rule py-4">
              <Mail className="mt-0.5 text-brand-strong" size={20} />
              <div><h4 className="text-sm font-semibold">Email</h4><p className="text-sm text-ink-soft">support@durqo.com · typical reply within 3 hours</p></div>
            </div>
            <div className="flex gap-3 border-t border-b border-rule py-4">
              <MapPin className="mt-0.5 text-brand-strong" size={20} />
              <div><h4 className="text-sm font-semibold">Office</h4><p className="text-sm text-ink-soft">40A Rutledge Crescent, St. John&rsquo;s, NL A1A 3J6</p></div>
            </div>

            <div className="mt-8">
              <p className="mono mb-3 text-xs uppercase tracking-wider text-ink-faint">FAQ</p>
              <FaqAccordion items={FAQS} />
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
}
