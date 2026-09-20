import clsx from "clsx";

// Shared page-width wrapper — max 1280px, with the 32/24/16px desktop/
// tablet/mobile padding the design system calls for (Tailwind's default
// spacing scale maps directly: px-8 = 32px, px-6 = 24px, px-4 = 16px).
export default function Container({
  children,
  className,
  maxWidth,
}: {
  children: React.ReactNode;
  className?: string;
  // Overrides the default 1280px cap via an inline style, in pixels —
  // guaranteed to win over the base max-w-[1280px] utility class
  // regardless of Tailwind's generated stylesheet order (unlike passing a
  // wider max-w-[...] class through `className`, whose cascade precedence
  // against the base class isn't something to rely on). Used by
  // DashboardShell's `wide` prop for admin tables with more columns than
  // the default width comfortably fits (e.g. the Users table's Role/
  // Joined As/Verified/Purchases-Sales/Joined/Status columns, 2026-09-20
  // site owner report: the Status column's Block button was getting cut
  // off / requiring horizontal scroll on a normal desktop window).
  maxWidth?: number;
}) {
  return (
    <div
      className={clsx("mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8", className)}
      style={maxWidth ? { maxWidth } : undefined}
    >
      {children}
    </div>
  );
}
