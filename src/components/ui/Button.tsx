import Link from "next/link";
import clsx from "clsx";

type Variant = "primary" | "secondary" | "ghost" | "on-dark";
type Size = "md" | "lg";

const VARIANT: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand-hover",
  secondary: "border border-rule-strong bg-paper-raised text-ink hover:border-brand-strong",
  ghost: "text-ink-soft hover:text-ink",
  "on-dark": "border border-white/25 text-white hover:border-white/50",
};

const SIZE: Record<Size, string> = {
  md: "px-4 py-2.5 text-sm",
  lg: "px-5 py-3 text-sm",
};

const base = "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
};

type ButtonAsLink = CommonProps & { href: string; onClick?: never; type?: never; disabled?: never };
type ButtonAsButton = CommonProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & { href?: never };

export default function Button(props: ButtonAsLink | ButtonAsButton) {
  const { variant = "primary", size = "md", className, children } = props;
  const cls = clsx(base, VARIANT[variant], SIZE[size], className);

  if ("href" in props && props.href) {
    return (
      <Link href={props.href} className={cls}>
        {children}
      </Link>
    );
  }

  const { variant: _v, size: _s, className: _c, children: _ch, href: _h, ...rest } = props as ButtonAsButton;
  void _v; void _s; void _c; void _ch; void _h;
  return (
    <button type="button" className={cls} {...rest}>
      {children}
    </button>
  );
}
