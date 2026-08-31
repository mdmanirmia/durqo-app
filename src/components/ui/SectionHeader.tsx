import clsx from "clsx";

// Consistent "eyebrow + heading (+ optional subheading)" block used at the
// top of every homepage/marketplace section, so headings stay the same
// restrained size everywhere instead of drifting section to section.
export default function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = "left",
  onDark = false,
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  align?: "left" | "center";
  onDark?: boolean;
  className?: string;
}) {
  return (
    <div className={clsx(align === "center" && "text-center", className)}>
      {eyebrow && <p className={clsx("eyebrow mb-3", onDark && "eyebrow--on-dark")}>{eyebrow}</p>}
      <h2 className={clsx("text-2xl sm:text-3xl", onDark ? "text-white" : "text-ink")}>{title}</h2>
      {subtitle && (
        <p className={clsx("mt-2 max-w-[60ch] text-[0.95rem] leading-relaxed", align === "center" && "mx-auto", onDark ? "text-white/65" : "text-ink-soft")}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
