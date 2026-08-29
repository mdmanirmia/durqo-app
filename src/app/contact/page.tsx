"use client";

import { useState, Suspense } from "react";
import { Mail, MessageSquare, MapPin } from "lucide-react";
import FaqAccordion from "@/components/FaqAccordion";

const FAQS = [
  { question: "How does Durqo verify a listing?", answer: "We request read-only access to analytics, payment processor exports and hosting records, and cross-check the numbers before a listing is marked Verified." },
  { question: "What happens to my money during a sale?", answer: "Funds are held by our third-party escrow partner and only released to the seller once asset transfer is confirmed by both parties." },
  { question: "What does Durqo charge?", answer: "Buyers pay nothing to browse or make offers. Sellers pay a success fee of 5–10% only when a deal closes." },
  { question: "Can I sell a business with no revenue yet?", answer: "Yes — domains and early-stage sites are listed regularly, though they won't carry a Verified income badge." },
];

function ContactForm() {
  const [sent, setSent] = useState(false);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
      }}
      className="flex flex-col gap-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-ink-soft" htmlFor="name">Name</label>
          <input id="name" required placeholder="Your name" className="rounded-lg border border-rule-strong bg-paper-raised px-3 py-2.5" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-ink-soft" htmlFor="email">Email</label>
          <input id="email" type="email" required placeholder="you@email.com" className="rounded-lg border border-rule-strong bg-paper-raised px-3 py-2.5" />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-ink-soft" htmlFor="subject">Subject</label>
        <select id="subject" className="rounded-lg border border-rule-strong bg-paper-raised px-3 py-2.5">
          <option>General question</option>
          <option>Help with a listing</option>
          <option>Buyer support</option>
          <option>Press &amp; partnerships</option>
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-ink-soft" htmlFor="message">Message</label>
        <textarea id="message" required rows={5} placeholder="How can we help?" className="rounded-lg border border-rule-strong bg-paper-raised px-3 py-2.5" />
      </div>
      <button className="rounded-lg bg-brand-strong py-2.5 text-sm font-semibold text-paper-raised hover:bg-brand">Send message</button>
      {sent && <p className="text-sm text-brand-strong">Message sent — we&rsquo;ll reply within one business day.</p>}
    </form>
  );
}

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-14 sm:px-7">
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
    </main>
  );
}
