// Fixed niche checklist for the listing form's "Niche" selector, transcribed
// verbatim from the reference screenshot supplied for this feature. A
// listing can belong to more than one niche (the reference shows checkboxes,
// not radio buttons), stored as `listings.niches` (migration 012).
export const NICHES: { id: string; name: string }[] = [
  { id: "health-wellness", name: "Health & Wellness" },
  { id: "finance-investing", name: "Finance & Investing" },
  { id: "technology-gadgets", name: "Technology & Gadgets" },
  { id: "education-online-learning", name: "Education & Online Learning" },
  { id: "home-garden", name: "Home & Garden" },
  { id: "travel", name: "Travel" },
  { id: "food-recipes", name: "Food & Recipes" },
  { id: "parenting-family", name: "Parenting & Family" },
  { id: "beauty-fashion", name: "Beauty & Fashion" },
  { id: "business-entrepreneurship", name: "Business & Entrepreneurship" },
  { id: "outdoors-adventure", name: "Outdoors & Adventure" },
  { id: "sports-fitness", name: "Sports & Fitness" },
  { id: "pets-animals", name: "Pets & Animals" },
  { id: "relationships-dating", name: "Relationships & Dating" },
  { id: "automotive", name: "Automotive" },
  { id: "spirituality", name: "Spirituality" },
  { id: "entertainment-gaming", name: "Entertainment & Gaming" },
  { id: "online-web-tool", name: "Online Web Tool" },
  { id: "informational", name: "Informational" },
  { id: "product-reviews", name: "Product Reviews" },
  { id: "other", name: "Other" },
];

export const NICHE_MAP: Record<string, string> = Object.fromEntries(NICHES.map((n) => [n.id, n.name]));
