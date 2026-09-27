"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, TrendingUp } from "lucide-react";
import Button from "@/components/ui/Button";
import { valuationCategoryOptions, getCategoryMetricConfig, BUSINESS_AGE_OPTIONS, type ValuationBasis } from "@/lib/valuation";
import { submitValuationLead, type ValuationLeadOutcome } from "./actions";

const CATEGORY_OPTIONS = valuationCategoryOptions();

const BASIS_NOTE: Record<ValuationBasis, string> = {
  profit: "Based on the monthly profit you shared, using a typical multiple for similar businesses.",
  revenue: "Your business isn't profitable yet, so this range is based on monthly revenue instead of profit.",
  floor: "You didn't share any revenue or profit, so this is a rough starting range only.",
};

type Step = "business" | "contact" | "result";

export default function ValuationForm() {
  const [step, setStep] = useState<Step>("business");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ValuationLeadOutcome | null>(null);

  const [categoryId, setCategoryId] = useState(CATEGORY_OPTIONS[0]?.id ?? "");
  const [monthlyRevenue, setMonthlyRevenue] = useState("");
  const [monthlyProfit, setMonthlyProfit] = useState("");
  const [businessAgeYears, setBusinessAgeYears] = useState(String(BUSINESS_AGE_OPTIONS[2].value));
  const [categoryMetricValue, setCategoryMetricValue] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const categoryMetric = getCategoryMetricConfig(categoryId);

  function handleCategoryChange(nextCategoryId: string) {
    setCategoryId(nextCategoryId);
    // A value typed for one category's metric (e.g. Subscribers) almost
    // never means the same thing for another (e.g. Total Downloads) — clear
    // it rather than silently carrying it over.
    setCategoryMetricValue("");
  }

  function handleBusinessSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStep("contact");
  }

  async function handleContactSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const outcome = await submitValuationLead({
        name,
        email,
        phone,
        categoryId,
        monthlyRevenue: Number(monthlyRevenue) || 0,
        monthlyProfit: Number(monthlyProfit) || 0,
        businessAgeYears: Number(businessAgeYears) || 0,
        categoryMetricValue: categoryMetric && categoryMetricValue !== "" ? Number(categoryMetricValue) || 0 : undefined,
      });
      setResult(outcome);
      setStep("result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "rounded-md border border-rule-strong bg-paper px-3 py-2.5 text-sm text-ink focus:border-brand-strong focus:outline-none";
  const labelClass = "text-sm font-semibold text-ink-soft";

  if (step === "result" && result) {
    return (
      <div className="rounded-2xl border border-rule bg-paper-raised p-6 shadow-[0_28px_56px_-30px_rgba(11,19,36,0.4)] sm:p-8">
        <span className="eyebrow mb-3 flex items-center gap-2 text-brand-strong">
          <CheckCircle2 size={15} />
          Your estimate is ready
        </span>
        <div className="rounded-xl bg-brand-soft p-5">
          <p className="text-[0.68rem] font-semibold uppercase tracking-wide text-brand-strong/70">
            Estimated valuation range for your {result.categoryName.toLowerCase()} business
          </p>
          <p className="mono mt-1 text-3xl font-bold text-brand-strong">
            ${result.low.toLocaleString("en-US")} &ndash; ${result.high.toLocaleString("en-US")}
          </p>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-ink-soft">{BASIS_NOTE[result.basis]}</p>
        {categoryMetric && categoryMetricValue !== "" && (
          <p className="mt-1 text-sm leading-relaxed text-ink-soft">
            We also factored in the {categoryMetric.label.toLowerCase()} you shared ({Number(categoryMetricValue).toLocaleString("en-US")}).
          </p>
        )}
        <p className="mt-2 text-xs leading-relaxed text-ink-faint">
          This is an illustrative estimate, not an appraisal, an offer, or a guarantee of your final sale price. Your
          actual sale price depends on buyer interest, verified financials and market conditions. We&rsquo;ve emailed
          this estimate to you, and a member of the Durqo team may reach out to help.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button href="/register?as=seller" size="lg">
            Create your listing
            <ArrowRight size={16} />
          </Button>
          <Button href="/contact?subject=valuation" variant="secondary" size="lg">
            Talk to our team
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-rule bg-paper-raised p-6 shadow-[0_28px_56px_-30px_rgba(11,19,36,0.4)] sm:p-8">
      <div className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
        <span className={step === "business" ? "text-brand-strong" : ""}>1. Your business</span>
        <span className="h-px w-5 bg-rule" aria-hidden />
        <span className={step === "contact" ? "text-brand-strong" : ""}>2. Get your estimate</span>
      </div>

      {step === "business" && (
        <form onSubmit={handleBusinessSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="categoryId">Business category</label>
            <select
              id="categoryId"
              value={categoryId}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className={inputClass}
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} htmlFor="monthlyRevenue">Monthly revenue (USD)</label>
              <input
                id="monthlyRevenue"
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="e.g. 8500"
                value={monthlyRevenue}
                onChange={(e) => setMonthlyRevenue(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} htmlFor="monthlyProfit">Monthly profit (USD)</label>
              <input
                id="monthlyProfit"
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="e.g. 3200"
                value={monthlyProfit}
                onChange={(e) => setMonthlyProfit(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="businessAgeYears">How long has it been running?</label>
            <select
              id="businessAgeYears"
              value={businessAgeYears}
              onChange={(e) => setBusinessAgeYears(e.target.value)}
              className={inputClass}
            >
              {BUSINESS_AGE_OPTIONS.map((o) => (
                <option key={o.label} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          {categoryMetric && (
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} htmlFor="categoryMetricValue">
                {categoryMetric.label}
                {categoryMetric.sourceHint && <span className="font-normal text-ink-faint"> ({categoryMetric.sourceHint})</span>}
              </label>
              <input
                id="categoryMetricValue"
                type="number"
                min={0}
                inputMode="numeric"
                placeholder={categoryMetric.placeholder}
                value={categoryMetricValue}
                onChange={(e) => setCategoryMetricValue(e.target.value)}
                className={inputClass}
              />
              <p className="text-xs leading-relaxed text-ink-faint">{categoryMetric.helpText}</p>
            </div>
          )}
          <p className="text-xs leading-relaxed text-ink-faint">
            Leave revenue and profit at 0 if your business hasn&rsquo;t made money yet (e.g. a domain or a brand-new
            project) - you&rsquo;ll still get a rough starting range.
          </p>
          <Button type="submit" size="lg" className="mt-1">
            Continue
            <ArrowRight size={16} />
          </Button>
        </form>
      )}

      {step === "contact" && (
        <form onSubmit={handleContactSubmit} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} htmlFor="name">Your name</label>
              <input
                id="name"
                required
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                required
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="phone">Phone (optional)</label>
            <input
              id="phone"
              type="tel"
              placeholder="+880 1XXX-XXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputClass}
            />
          </div>
          <p className="text-xs leading-relaxed text-ink-faint">
            We&rsquo;ll email you this estimate and may reach out to help you sell. We won&rsquo;t share your details
            with anyone else.
          </p>
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setStep("business")}
              className="flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink"
            >
              <ArrowLeft size={15} />
              Back
            </button>
            <Button type="submit" size="lg" disabled={loading} className="ml-auto">
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Calculating...
                </>
              ) : (
                <>
                  <TrendingUp size={16} />
                  Get my free estimate
                </>
              )}
            </Button>
          </div>
        </form>
      )}

      {step === "business" && (
        <p className="mt-5 text-xs text-ink-faint">
          Already know your numbers and ready to sell? <Link href="/register?as=seller" className="font-semibold text-brand-strong hover:underline">List your business directly</Link>.
        </p>
      )}
    </div>
  );
}
