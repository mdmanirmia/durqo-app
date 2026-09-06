import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import { CATEGORY_MAP } from "@/lib/categories";
import { CATEGORY_ICONS } from "@/lib/category-icons";
import { MarketplaceFilters, filtersToHref } from "@/lib/marketplace-filters";
import Container from "@/components/ui/Container";
import MoreCategoriesMenu from "./MoreCategoriesMenu";

// Section 5's fixed shortcut set, mapped to real category ids from the
// shared category source — never a separate hardcoded list of names.
const SHORTCUT_IDS = ["websites", "saas", "ai-apps-tools", "e-commerce", "apps-tools"];

export default function CategoryShortcuts({ filters }: { filters: MarketplaceFilters }) {
  const selected = filters.categoryIds;
  const isAllActive = selected.length === 0;

  function hrefFor(categoryId: string | null) {
    return filtersToHref({ ...filters, categoryIds: categoryId ? [categoryId] : [], page: 1 });
  }

  const pillCls = (active: boolean) =>
    `inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-3.5 py-3 text-sm font-medium transition ${
      active ? "border-brand text-brand-hover" : "border-transparent text-ink-soft hover:text-ink"
    }`;

  const moreActive = selected.length > 0 && !(selected.length === 1 && SHORTCUT_IDS.includes(selected[0]));

  return (
    <nav aria-label="Category shortcuts" className="border-b border-rule bg-paper">
      <Container>
        <div className="scrollbar-hide flex items-center gap-1 overflow-x-auto">
          <Link href={hrefFor(null)} aria-current={isAllActive ? "page" : undefined} className={pillCls(isAllActive)}>
            <LayoutGrid size={15} />
            All businesses
          </Link>
          {SHORTCUT_IDS.map((id) => {
            const category = CATEGORY_MAP[id];
            if (!category) return null;
            const Icon = CATEGORY_ICONS[id];
            const active = selected.length === 1 && selected[0] === id;
            return (
              <Link key={id} href={hrefFor(id)} aria-current={active ? "page" : undefined} className={pillCls(active)}>
                {Icon && <Icon size={15} />}
                {category.name}
              </Link>
            );
          })}
          <MoreCategoriesMenu filters={filters} excludeIds={SHORTCUT_IDS} active={moreActive} />
        </div>
      </Container>
    </nav>
  );
}
