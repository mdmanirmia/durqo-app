"use client";

import { useState, Suspense } from "react";
import { Mail, MessageSquare, MapPin } from "lucide-react";
import FaqAccordion from "@/components/FaqAccordion";
import Container from "@/components/ui/Container";
import { submitContactForm } from "./actions";

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

function ContactForm() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    setLoading(true);
    try {
      await submitContactForm({
        name: String(formData.get("name") || ""),
        email: String(formData.get("email") || ""),
        subject: String(formData.get("subject") || ""),
        message: String(formData.get("message") || ""),
      });
      setSent(true);
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong — please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-ink-soft" htmlFor="name">Name</label>
          <input id="name" name="name" required placeholder="Your name" className="rounded-md border border-rule-strong bg-paper px-3 py-2.5 text-sm text-ink focus:border-brand-strong focus:outline-none" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-ink-soft" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required placeholder="you@email.com" className="rounded-md border border-rule-strong bg-paper px-3 py-2.5 text-sm text-ink focus:border-brand-strong focus:outline-none" />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-ink-soft" htmlFor="subject">Subject</label>
        <select id="subject" name="subject" className="rounded-md border border-rule-strong bg-paper px-3 py-2.5 text-sm text-ink focus:border-brand-strong focus:outline-none">
          <option>General question</option>
          <option>Help with a listing</option>
          <option>Buyer support</option>
          <option>Press &amp; partnerships</option>
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-ink-soft" htmlFor="message">Message</label>
        <textarea id="message" name="message" required rows={5} placeholder="How can we help?" className="rounded-md border border-rule-strong bg-paper px-3 py-2.5 text-sm text-ink focus:border-brand-strong focus:outline-none" />
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <button disabled={loading} className="rounded-md bg-brand py-2.5 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-60">
        {loading ? "Sending…" : "Send message"}
      </button>
      {sent && <p className="text-sm text-brand-strong">Message sent — we&rsquo;ll reply within one business day.</p>}
    </form>
  );
}

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
              <div><h4 className="text-sm font-semibold">Email</h4><p className="text-sm text-ink-soft">support@durqo.com · typical reply within one business day</p></div>
            </div>
            <div className="flex gap-3 border-t border-rule py-4">
              <MessageSquare className="mt-0.5 text-brand-strong" size={20} />
              <div><h4 className="text-sm font-semibold">Live chat</h4><p className="text-sm text-ink-soft">Available weekdays, 9am–6pm Atlantic Time, for buyers and sellers with an open deal.</p></div>
            </div>
            <div className="flex gap-3 border-t border-b border-rule py-4">
              <MapPin className="mt-0.5 text-brand-strong" size={20} />
              <div><h4 className="text-sm font-semibold">Office</h4><p className="text-sm text-ink-soft">St. John&rsquo;s, Newfoundland &amp; Labrador, Canada</p></div>
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
