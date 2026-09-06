import { ShieldCheck, LineChart, Users } from "lucide-react";
import Container from "@/components/ui/Container";
import MarketplaceSearchBox from "./MarketplaceSearchBox";

const TRUST_POINTS = [
  { icon: ShieldCheck, label: "Verified listings" },
  { icon: LineChart, label: "Clear performance data" },
  { icon: Users, label: "Direct seller contact" },
];

// Compact navy marketplace hero (Section 4). Deliberately shorter than the
// homepage/sell-page heroes — this page's job is search + browse, not a
// pitch — matching the mockup's compact treatment.
export default function MarketplaceHero() {
  return (
    <section className="border-b border-rule bg-brand-strong py-10 sm:py-12">
      <Container>
        <div className="mx-auto max-w-[760px] text-center">
          <p className="eyebrow eyebrow--on-dark mx-auto">Marketplace</p>
          <h1 className="mt-3 text-3xl leading-[1.15] text-white sm:text-4xl">Find a business worth building on.</h1>
          <p className="mx-auto mt-3 max-w-[56ch] text-[0.95rem] leading-relaxed text-white/70">
            Explore verified digital businesses and compare their performance, pricing and operating history.
          </p>

          <div className="mt-6">
            <MarketplaceSearchBox />
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-7 gap-y-2.5">
            {TRUST_POINTS.map(({ icon: Icon, label }) => (
              <span key={label} className="flex items-center gap-1.5 text-xs font-medium text-white/70">
                <Icon size={14} className="text-brand" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
