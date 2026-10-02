"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, ADMIN_EMAIL } from "@/lib/email";
import { CATEGORY_MAP } from "@/lib/categories";
import { estimateValuation, getCategoryMetricConfig, type ValuationResult } from "@/lib/valuation";
import { appendValuationLeadToSheet } from "@/lib/google-sheets";

export type ValuationLeadFields = {
  name: string;
  email: string;
  phone?: string;
  categoryId: string;
  monthlyRevenue: number;
  monthlyProfit: number;
  businessAgeYears: number;
  // The one category-specific Quick Stat the form asks for (see
  // src/lib/valuation.ts's CATEGORY_METRICS) — undefined for a category
  // with no configured metric.
  categoryMetricValue?: number;
};

export type ValuationLeadOutcome = ValuationResult & { categoryName: string };

// A plain unauthenticated lead-capture write, same "server action goes
// through the service-role client rather than opening an RLS insert
// policy" choice several other public-facing writes in this codebase make
// (e.g. the webhook routes) — see 058_valuation_leads.sql for why.
export async function submitValuationLead(fields: ValuationLeadFields): Promise<ValuationLeadOutcome> {
  const name = fields.name.trim();
  const email = fields.email.trim();
  const phone = fields.phone?.trim() || null;
  const category = CATEGORY_MAP[fields.categoryId];
  const monthlyRevenue = Math.max(0, Number(fields.monthlyRevenue) || 0);
  const monthlyProfit = Math.max(0, Number(fields.monthlyProfit) || 0);
  const businessAgeYears = Math.max(0, Number(fields.businessAgeYears) || 0);

  if (!name || !email) throw new Error("Please share your name and email.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Please enter a valid email address.");
  if (!category) throw new Error("Please choose a business category.");

  // Only trust a category-metric value for the category it was actually
  // configured for — guards against a stale value left over from a
  // previously-selected category being submitted for a different one.
  const metricConfig = getCategoryMetricConfig(category.id);
  const categoryMetricValue =
    metricConfig && fields.categoryMetricValue !== undefined && fields.categoryMetricValue !== null
      ? Math.max(0, Number(fields.categoryMetricValue) || 0)
      : undefined;

  const result = estimateValuation({
    categoryId: category.id,
    monthlyRevenue,
    monthlyProfit,
    businessAgeYears,
    categoryMetricValue,
  });

  // Best-effort: attach the submitter's user id when they happen to be
  // signed in, purely for cross-reference on the admin side — never
  // required, and never blocks the submission if it can't be resolved.
  let userId: string | null = null;
  try {
    const supabase = await createClient();
    if (supabase) {
      const { data } = await supabase.auth.getUser();
      userId = data.user?.id ?? null;
    }
  } catch {
    // ignore — anonymous submission
  }

  const admin = createAdminClient();
  if (admin) {
    const { error } = await admin.from("valuation_leads").insert({
      name,
      email,
      phone,
      category_id: category.id,
      monthly_revenue: monthlyRevenue,
      monthly_profit: monthlyProfit,
      business_age_years: businessAgeYears,
      estimated_low: result.low,
      estimated_high: result.high,
      category_metric_value: categoryMetricValue ?? null,
      user_id: userId,
    });
    if (error) console.error("[valuation] failed to store lead:", error);
  } else {
    console.warn("[valuation] admin client unavailable - lead was not stored:", { name, email });
  }

  // 2026-10-02 ("lead hisebe ki excel file e auto sync kora jai" — can
  // leads auto-sync to an excel file): best-effort, never throws, and never
  // blocks this submission even if Google Sheets isn't configured or is
  // temporarily unreachable — see src/lib/google-sheets.ts for the scope
  // (new leads only, no later status/note sync back) and setup this relies
  // on.
  await appendValuationLeadToSheet({
    createdAt: new Date().toISOString(),
    name,
    email,
    phone,
    categoryName: category.name,
    monthlyRevenue,
    monthlyProfit,
    businessAgeYears,
    categoryMetricLabel:
      metricConfig && categoryMetricValue !== undefined ? `${metricConfig.label}: ${categoryMetricValue.toLocaleString("en-US")}` : null,
    estimatedLow: result.low,
    estimatedHigh: result.high,
    status: "new",
  });

  const rangeLabel = `$${result.low.toLocaleString("en-US")} – $${result.high.toLocaleString("en-US")}`;

  // Admin notification — new sales lead, same "notify support@durqo.com
  // immediately" pattern the contact form and every other lead-style event
  // in this codebase already uses.
  const metricLine =
    metricConfig && categoryMetricValue !== undefined
      ? `<br/><strong>${metricConfig.label}:</strong> ${categoryMetricValue.toLocaleString("en-US")}`
      : "";

  await sendEmail(
    ADMIN_EMAIL,
    `New valuation lead: ${name} (${category.name})`,
    `<p><strong>${name}</strong> (${email}${phone ? `, ${phone}` : ""}) requested a free valuation.</p>
     <p><strong>Category:</strong> ${category.name}<br/>
        <strong>Monthly revenue:</strong> $${monthlyRevenue.toLocaleString("en-US")}<br/>
        <strong>Monthly profit:</strong> $${monthlyProfit.toLocaleString("en-US")}<br/>
        <strong>Business age:</strong> ${businessAgeYears} year(s)${metricLine}</p>
     <p><strong>Estimated range shown:</strong> ${rangeLabel}</p>`,
    email
  );

  // Confirmation copy to the seller, with the same range they were shown
  // plus a nudge toward actually listing — the whole point of the tool.
  await sendEmail(
    email,
    "Your free valuation estimate - Durqo",
    `<p>Hi ${name},</p>
     <p>Thanks for using Durqo's free valuation tool. Based on the numbers you shared for your ${category.name.toLowerCase()} business, here's your estimated range:</p>
     <p style="font-size:1.25rem;font-weight:700;">${rangeLabel}</p>
     <p>This is an illustrative estimate based on typical multiples for similar businesses, not an appraisal or a guarantee of your final sale price. A member of the Durqo team may reach out to help you understand your options.</p>
     <p>Ready to see real offers? <a href="https://www.durqo.com/register?as=seller">Create your listing</a> and start reaching buyers today.</p>
     <p>- Durqo</p>`
  );

  return { ...result, categoryName: category.name };
}
