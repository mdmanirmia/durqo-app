// Oct 30, 2026 (/durqo-bangladesh: "photo or video add korte hole baniye
// koro"): a code-built animated illustration instead of a stock photo or
// video file — Bangladesh as the hub, connected by flowing arcs to buyers
// and sellers around the world. Pure SVG + CSS (globals.css .dq-bd-*), so
// it's sharp at any size, weighs almost nothing, and every animation stops
// for prefers-reduced-motion. Decorative only (aria-hidden); it makes no
// factual claim beyond "Bangladesh <-> the world".
const HUB = { x: 300, y: 230 };

const NODES = [
  { x: 92, y: 96, label: "North America" },
  { x: 70, y: 262, label: "South America" },
  { x: 168, y: 58, label: "Europe" },
  { x: 214, y: 196, label: "Middle East" },
  { x: 476, y: 120, label: "East Asia" },
  { x: 496, y: 318, label: "Australia" },
  { x: 402, y: 306, label: "Southeast Asia" },
];

function arc(a: { x: number; y: number }, b: { x: number; y: number }) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2 - Math.max(40, Math.abs(a.x - b.x) * 0.35);
  return `M${a.x},${a.y} Q${mx},${my} ${b.x},${b.y}`;
}

export default function BdNetwork() {
  return (
    <svg viewBox="0 0 560 400" className="h-full w-full" fill="none" aria-hidden>
      <defs>
        <pattern id="bd-dots" width="14" height="14" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="1.3" fill="rgba(255,255,255,0.13)" />
        </pattern>
        <radialGradient id="bd-fade" cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor="#fff" stopOpacity="1" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <mask id="bd-mask">
          <rect width="560" height="400" fill="url(#bd-fade)" />
        </mask>
        <linearGradient id="bd-arc" x1="0" x2="1">
          <stop offset="0%" stopColor="#10B981" stopOpacity="0.15" />
          <stop offset="50%" stopColor="#34D399" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#10B981" stopOpacity="0.15" />
        </linearGradient>
      </defs>

      {/* Dotted "world" field */}
      <rect width="560" height="400" fill="url(#bd-dots)" mask="url(#bd-mask)" />

      {/* Arcs from Bangladesh to every region, with a dash that flows
          outward and a small packet of light travelling along each. */}
      {NODES.map((n, i) => {
        const d = arc(HUB, n);
        return (
          <g key={n.label}>
            <path d={d} stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
            <path d={d} stroke="url(#bd-arc)" strokeWidth="1.6" strokeLinecap="round" className="dq-bd-flow" style={{ animationDelay: `${i * -0.7}s` }} />
            <circle r="3.2" fill="#6EE7B7" className="dq-bd-packet" style={{ offsetPath: `path("${d}")`, animationDelay: `${i * 0.55}s` }} />
          </g>
        );
      })}

      {/* Region nodes */}
      {NODES.map((n, i) => (
        <g key={`n-${n.label}`}>
          <circle cx={n.x} cy={n.y} r="10" fill="rgba(16,185,129,0.12)" className="dq-bd-node" style={{ animationDelay: `${i * 0.4}s` }} />
          <circle cx={n.x} cy={n.y} r="3.6" fill="#E2E8F0" />
          <text x={n.x} y={n.y - 14} textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.55)" fontFamily="ui-sans-serif, system-ui">
            {n.label}
          </text>
        </g>
      ))}

      {/* Bangladesh hub: a nod to the flag — red disc on green */}
      <circle cx={HUB.x} cy={HUB.y} r="34" fill="rgba(16,185,129,0.14)" className="dq-bd-ring" />
      <circle cx={HUB.x} cy={HUB.y} r="34" fill="rgba(16,185,129,0.14)" className="dq-bd-ring" style={{ animationDelay: "1.2s" }} />
      <circle cx={HUB.x} cy={HUB.y} r="22" fill="#006A4E" stroke="#34D399" strokeWidth="1.5" />
      <circle cx={HUB.x - 2} cy={HUB.y} r="9.5" fill="#F42A41" />
      <rect x={HUB.x - 46} y={HUB.y + 30} width="92" height="22" rx="11" fill="rgba(11,19,36,0.85)" stroke="rgba(52,211,153,0.5)" />
      <text x={HUB.x} y={HUB.y + 45} textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#fff" fontFamily="ui-sans-serif, system-ui">
        Bangladesh
      </text>
    </svg>
  );
}
