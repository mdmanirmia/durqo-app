import clsx from "clsx";

// Shared page-width wrapper — max 1280px, with the 32/24/16px desktop/
// tablet/mobile padding the design system calls for (Tailwind's default
// spacing scale maps directly: px-8 = 32px, px-6 = 24px, px-4 = 16px).
export default function Container({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={clsx("mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8", className)}>{children}</div>;
}
