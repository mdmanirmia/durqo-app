"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { ArrowLeftRight } from "lucide-react";
import Container from "@/components/ui/Container";

export interface DashboardNavItem {
  href: string;
  label: string;
  badge?: number;
}

export default function DashboardShell({
  title,
  nav,
  switchHref,
  switchLabel,
  children,
}: {
  title: string;
  nav: DashboardNavItem[];
  switchHref: string;
  switchLabel: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <main className="py-10">
      <Container>
        <p className="mono mb-1 text-xs uppercase tracking-wider text-ink-faint">Dashboard</p>
        <h1 className="mb-8 text-3xl">{title}</h1>

        <div className="grid gap-8 md:grid-cols-[220px_1fr]">
          <aside className="flex flex-row gap-1 overflow-x-auto md:flex-col md:overflow-visible">
            {nav.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "flex shrink-0 items-center justify-between gap-2 rounded-md px-3 py-2.5 text-sm font-medium",
                    active ? "bg-brand-strong text-white" : "text-ink-soft hover:bg-paper-raised"
                  )}
                >
                  {item.label}
                  {typeof item.badge === "number" && (
                    <span className={clsx("mono rounded-full px-1.5 py-0.5 text-[0.65rem]", active ? "bg-white/20" : "bg-brand-soft text-brand-strong")}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
            <Link href={switchHref} className="mt-3 flex shrink-0 items-center gap-2 rounded-md border border-rule-strong px-3 py-2.5 text-sm font-medium text-ink-soft hover:border-brand-strong md:mt-4">
              <ArrowLeftRight size={14} /> {switchLabel}
            </Link>
          </aside>

          <div>{children}</div>
        </div>
      </Container>
    </main>
  );
}
