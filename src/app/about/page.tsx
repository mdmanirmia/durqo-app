import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";

const VALUES = [
  ["Verify before you list", "No listing goes live until income and traffic claims are checked against source data."],
  ["Escrow, always", "We never let funds change hands before assets do. No exceptions, regardless of deal size."],
  ["Plain-language fees", "One success fee, published up front. No hidden listing costs or surprise add-ons."],
  ["A human reviews every deal", "Software flags issues; a person on our team signs off before anything closes."],
];

const TEAM = [
  ["V", "Verification", "Checks income and traffic claims against source data before a listing goes live."],
  ["E", "Escrow & Payments", "Holds funds until assets have actually changed hands."],
  ["S", "Support", "Answers buyer and seller questions throughout a deal."],
];

export default function AboutPage() {
  return (
    <main>
      <section className="border-b border-rule bg-paper-sunk py-16 sm:py-24">
        <Container>
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <p className="eyebrow mb-3">About Durqo</p>
              <h1 className="mb-4 text-4xl">We keep the paperwork so deals don&rsquo;t fall apart</h1>
              <p className="max-w-[52ch] text-ink-soft">
                Durqo started after our founders watched two separate business sales collapse over disputed income figures. We built the marketplace we wished had existed: independent verification before a listing goes live, escrow on every transaction, and a permanent record of who said what.
              </p>
            </div>
            <div className="rounded-xl border border-rule-strong bg-paper-raised p-8">
              <p className="mono mb-2 text-xs text-ink-faint">FOUNDED 2023 · ST. JOHN&rsquo;S</p>
              <h3 className="mb-1 text-2xl">Mission</h3>
              <p className="text-ink-soft">Make buying and selling an online business as boring — and safe — as buying a house.</p>
            </div>
          </div>
        </Container>
      </section>

      <section className="border-b border-rule py-16 sm:py-20">
        <Container>
          <SectionHeader eyebrow="What we value" title={<>Four things we won&rsquo;t compromise on</>} className="mb-10" />
          <div className="grid gap-6 sm:grid-cols-2">
            {VALUES.map(([t, b]) => (
              <div key={t} className="border-t border-rule pt-6">
                <h4 className="mb-1 text-base">{t}</h4>
                <p className="text-sm text-ink-soft">{b}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container>
          <SectionHeader eyebrow="Team" title="Small team, every deal reviewed by hand" className="mb-10" />
          <div className="grid gap-6 sm:grid-cols-3">
            {TEAM.map(([initial, name, description]) => (
              <div key={name} className="rounded-xl border border-rule bg-paper-raised p-6">
                <div className="mb-3 grid h-12 w-12 place-items-center rounded-full border border-rule-strong bg-brand-soft text-lg font-bold text-brand">
                  {initial}
                </div>
                <h4 className="mb-1 text-sm font-semibold">{name}</h4>
                <p className="text-xs text-ink-faint">{description}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </main>
  );
}
