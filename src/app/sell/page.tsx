import Link from "next/link";
import { ShieldCheck, Banknote, LineChart } from "lucide-react";

const TRUST = [
  { icon: LineChart, title: "Trusted Valuation", body: "Get a free, data-backed valuation before you decide to list — based on your income, traffic and category comps." },
  { icon: ShieldCheck, title: "Seamless Transactions", body: "From listing to sale, our platform and escrow partner ensure a smooth, secure transfer of funds and assets." },
  { icon: Banknote, title: "No upfront cost", body: "Listing is free. Durqo only charges a success fee once your business sells." },
];

const FEES = [
  ["Under $50,000", "10%"],
  ["$50,000 – $250,000", "7%"],
  ["Over $250,000", "5%"],
];

export default function SellPage() {
  return (
    <main>
      <section className="border-b border-rule bg-brand-strong py-20 text-paper-raised">
        <div className="mx-auto max-w-6xl px-5 sm:px-7">
          <h1 className="max-w-[18ch] text-4xl text-paper-raised sm:text-5xl">
            Sell your online asset with confidence.
          </h1>
          <p className="mt-4 max-w-[60ch] text-paper-raised/80">
            List your website, SaaS business, e-commerce store, or domain on a trusted marketplace and connect with verified buyers.
          </p>
          <div className="mt-8 flex flex-wrap gap-3" id="valuation">
            <Link href="/contact?subject=valuation" className="rounded-lg bg-gold px-6 py-3 text-sm font-semibold text-white">
              Get a free valuation
            </Link>
            <Link href="/register?as=seller" className="rounded-lg border border-paper-raised/50 px-6 py-3 text-sm font-semibold hover:border-paper-raised">
              List your assets now
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-6xl px-5 sm:px-7">
          <h2 className="mb-8 text-3xl">Sell your digital assets on Durqo</h2>
          <p className="mb-10 max-w-[70ch] text-ink-soft">
            Selling your online business or asset has never been simpler. Durqo streamlines the process, helping you maximize value while connecting with serious buyers in a secure, transparent marketplace.
          </p>
          <div className="grid gap-5 sm:grid-cols-3">
            {TRUST.map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-md border border-rule bg-paper-raised p-6">
                <Icon className="mb-3 text-brand-strong" size={26} />
                <h4 className="mb-1 text-lg">{title}</h4>
                <p className="text-sm text-ink-soft">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-rule py-16">
        <div className="mx-auto max-w-6xl px-5 sm:px-7">
          <h2 className="mb-8 text-3xl">What listing your business involves</h2>
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              ["01", "Tell us about the business", "Category, price, income history and how it makes money — takes about 15 minutes."],
              ["02", "We verify the numbers", "Our team checks your income proof, Google Analytics, Search Console and SEO data before publishing."],
              ["03", "Go live and get offers", "Buyers message, wishlist and make direct offers. You accept, and escrow handles the rest."],
            ].map(([n, t, b]) => (
              <div key={n}>
                <div className="mono text-3xl font-bold text-brand">{n}</div>
                <h4 className="mt-2 text-lg">{t}</h4>
                <p className="mt-1 text-sm text-ink-soft">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-rule py-16">
        <div className="mx-auto max-w-6xl px-5 sm:px-7">
          <h2 className="mb-6 text-3xl">Success fee</h2>
          <div className="max-w-md rounded-lg border border-rule bg-paper-raised">
            {FEES.map(([range, fee]) => (
              <div key={range} className="mono flex justify-between border-b border-rule px-5 py-3 text-sm last:border-b-0">
                <span className="text-ink-soft">{range}</span>
                <span className="font-semibold">{fee}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 max-w-[55ch] text-sm text-ink-faint">
            No upfront cost. The fee is only charged once a deal closes through Durqo escrow.
          </p>
        </div>
      </section>

      <section className="border-t border-rule py-16">
        <div className="mx-auto max-w-6xl px-5 sm:px-7">
          <div className="flex flex-wrap items-center justify-between gap-6 rounded-md bg-brand-strong p-10 text-paper-raised">
            <div>
              <h2 className="text-2xl text-paper-raised">Ready to list your business?</h2>
              <p className="mt-1 max-w-[44ch] text-paper-raised/80">Create a free account and submit your listing for review — most go live within one business day.</p>
            </div>
            <Link href="/register?as=seller" className="rounded-lg bg-gold px-6 py-3 text-sm font-semibold text-white">
              Get started
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
