-- ============================================================
-- Durqo — category-specific secondary signal for the Free Valuation tool
-- (Sep 27, 2026 same-day follow-up to 058_valuation_leads.sql).
--
-- Site owner: "valuation tool e category wise aro kisu data niye estimate
-- dile aro realistic mone hoto" (a category-aware extra data point would
-- make the estimate feel more realistic). Rather than a full per-category
-- form, src/lib/valuation.ts now asks for ONE extra Quick-Stat-style metric
-- per category (traffic for a website, subscribers for a YouTube channel,
-- downloads for an app, etc.) and folds it into the estimate as a modest
-- multiplier alongside the existing business-age adjustment. This column
-- stores whatever number the seller entered for that category's metric —
-- nullable, since a handful of categories (e.g. Amazon Stores & KDP) have
-- no configured extra metric and the form simply doesn't ask for one.
-- ============================================================

alter table public.valuation_leads
  add column if not exists category_metric_value numeric;
