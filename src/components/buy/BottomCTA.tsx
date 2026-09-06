import Link from "next/link";
import Container from "@/components/ui/Container";

// Section 17. Durqo doesn't currently offer a dedicated acquisition-matching
// service (Contact is a general inquiry form, not a buyer-concierge feature)
// — the description below is deliberately the conservative, currently-true
// version rather than the spec's example copy, per its own instruction to
// "only promise acquisition assistance if Durqo actually provides it."
export default function BottomCTA() {
  return (
    <section className="border-t border-rule bg-brand-strong py-10 sm:py-12">
      <Container>
        <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <h2 className="text-xl font-semibold text-white sm:text-2xl">Looking for something specific?</h2>
            <p className="mt-1.5 max-w-[52ch] text-sm leading-relaxed text-white/70">
              Get in touch and tell us what you&apos;re looking for, or list your own business on Durqo.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link
              href="/contact"
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/25 px-5 text-sm font-semibold text-white transition hover:border-white/50"
            >
              Contact Durqo
            </Link>
            <Link
              href="/sell"
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand px-5 text-sm font-semibold text-white transition hover:bg-brand-hover"
            >
              Sell a business
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
