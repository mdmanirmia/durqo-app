const VALUES = [
  ["Verify before you list", "No listing goes live until income and traffic claims are checked against source data."],
  ["Escrow, always", "We never let funds change hands before assets do. No exceptions, regardless of deal size."],
  ["Plain-language fees", "One success fee, published up front. No hidden listing costs or surprise add-ons."],
  ["A human reviews every deal", "Software flags issues; a person on our team signs off before anything closes."],
];

const TEAM = [
  ["R", "Rin Okafor", "Co-founder & CEO"],
  ["D", "Dev Sharma", "Co-founder & Head of Verification"],
  ["L", "Lina Vosk", "Head of Escrow Partnerships"],
  ["T", "Tomas Reyes", "Head of Support"],
];

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-14 sm:px-7">
      <div className="mb-16 grid gap-10 md:grid-cols-2 md:items-center">
        <div>
          <p className="mono mb-2 text-xs uppercase tracking-wider text-ink-faint">About Durqo</p>
          <h1 className="mb-4 text-4xl">We keep the paperwork so deals don&rsquo;t fall apart</h1>
          <p className="max-w-[52ch] text-ink-soft">
            Durqo started after our founders watched two separate business sales collapse over disputed income figures. We built the marketplace we wished had existed: independent verification before a listing goes live, escrow on every transaction, and a permanent record of who said what.
          </p>
        </div>
        <div className="rounded-lg border-[1.5px] border-rule-strong bg-paper-raised p-7">
          <p className="mono mb-2 text-xs text-ink-faint">FOUNDED 2023 · ST. JOHN&rsquo;S</p>
          <h3 className="mb-1 text-2xl">Mission</h3>
          <p className="mb-4 text-ink-soft">Make buying and selling an online business as boring — and safe — as buying a house.</p>
          <div className="flex gap-8">
            <div><div className="mono text-lg font-semibold">640+</div><div className="text-xs text-ink-faint">Verified listings</div></div>
            <div><div className="mono text-lg font-semibold">18</div><div className="text-xs text-ink-faint">Team members</div></div>
          </div>
        </div>
      </div>

      <p className="mono mb-2 text-xs uppercase tracking-wider text-ink-faint">What we value</p>
      <h2 className="mb-8 text-3xl">Four things we won&rsquo;t compromise on</h2>
      <div className="mb-16 grid gap-6 sm:grid-cols-2">
        {VALUES.map(([t, b]) => (
          <div key={t} className="border-t border-rule pt-5">
            <h4 className="mb-1 text-base">{t}</h4>
            <p className="text-sm text-ink-soft">{b}</p>
          </div>
        ))}
      </div>

      <p className="mono mb-2 text-xs uppercase tracking-wider text-ink-faint">Team</p>
      <h2 className="mb-8 text-3xl">Small team, every deal reviewed by hand</h2>
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        {TEAM.map(([initial, name, role]) => (
          <div key={name} className="text-center">
            <div className="mx-auto mb-3 grid h-20 w-20 place-items-center rounded-full border border-rule-strong bg-brand-soft text-xl font-bold text-brand">
              {initial}
            </div>
            <h4 className="text-sm font-semibold">{name}</h4>
            <p className="text-xs text-ink-faint">{role}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
