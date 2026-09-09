"use client";

// Split out of contact/page.tsx (Sep 8, 2026 technical-SEO pass, Section
// 22): the interactive form needs client-side state, but the page itself
// needs to export server-rendered metadata (Next.js requires `metadata`/
// `generateMetadata` to come from a Server Component). Moving this form
// into its own client child and turning page.tsx back into a plain server
// component keeps the exact same rendered output and behavior — nothing
// here changed except which file the code lives in.
import { useState } from "react";
import { submitContactForm } from "./actions";

export default function ContactForm() {
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
      {sent && <p className="text-sm text-brand-strong">Message sent — we&rsquo;ll reply within 3 hours.</p>}
    </form>
  );
}
