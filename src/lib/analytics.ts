"use client";

import { sendGAEvent } from "@next/third-parties/google";

// Sep 16, 2026: thin, typed wrapper around @next/third-parties/google's
// sendGAEvent() — one place that names every custom/ecommerce event this
// app fires, so call sites can't typo an event name or drift on parameter
// shape (the same "one source of truth" reasoning as src/lib/fees.ts for
// the Success Fee schedule). sendGAEvent() itself is already a safe no-op
// (console.warn, never throws) when NEXT_PUBLIC_GA_ID isn't set — see
// node_modules/@next/third-parties/dist/google/ga.js — so every function
// here is safe to call unconditionally, including in local dev and preview
// deploys where GA isn't configured.
//
// Event names below stick to GA4's own "recommended events" where one
// fits (purchase, begin_checkout, sign_up, generate_lead) so GA4's UI
// recognizes them automatically; "verification_submitted" and
// "pay_later_order_created" have no GA4-recommended equivalent, so they're
// plain custom events — mark them as "key events" in GA4's Admin ->
// Events if you want them to show up as conversions.

export interface GAItem {
  item_id: string;
  item_name: string;
  price?: number;
}

// Fired when a buyer commits to a specific payment method on Buy Now
// (Stripe: right before the redirect to Stripe's hosted page; SSLCommerz/
// Escrow.com: right after their confirm-modal's "Confirm" click succeeds).
// Cart/multi-item checkout doesn't call this today — see the note on
// CartButton.tsx being unused in the same audit that added this file.
export function trackBeginCheckout(params: {
  value: number;
  paymentChannel: "stripe" | "sslcommerz" | "escrow_com";
  items: GAItem[];
  currency?: string;
}) {
  sendGAEvent("event", "begin_checkout", {
    currency: params.currency ?? "USD",
    value: params.value,
    payment_channel: params.paymentChannel,
    items: params.items,
  });
}

// Fired exactly once per order, from the Transfer Room page (the one
// landing page every real payment channel's buyer eventually reaches:
// Stripe's success redirect, SSLCommerz's success redirect, and
// Escrow.com's own "Transfer Room" email link — see transferRoomEmailCta()
// in src/lib/asset-transfer-room.ts). Deliberately NOT fired for
// payment_channel "durqo_platform" (Pay Later) — no money actually moves
// on that rail, so counting it here would inflate GA4's revenue reports;
// see trackPayLaterOrderCreated() below for that case instead. Dedup
// against repeat visits is the caller's job (see
// hasTrackedPurchase/markPurchaseTracked below), since this module has no
// server-side idempotency to lean on.
export function trackPurchase(params: {
  orderId: string;
  value: number;
  paymentChannel: "stripe" | "sslcommerz" | "escrow_com";
  items: GAItem[];
  currency?: string;
}) {
  sendGAEvent("event", "purchase", {
    transaction_id: params.orderId,
    currency: params.currency ?? "USD",
    value: params.value,
    payment_channel: params.paymentChannel,
    items: params.items,
  });
}

// Pay Later's equivalent of trackPurchase() above, kept as its own event
// name specifically so it never lands in GA4's "purchase"/revenue
// reporting — see the comment on trackPurchase(). Same dedup contract.
export function trackPayLaterOrderCreated(params: { orderId: string; value: number; items: GAItem[] }) {
  sendGAEvent("event", "pay_later_order_created", {
    transaction_id: params.orderId,
    currency: "USD",
    value: params.value,
    items: params.items,
  });
}

// localStorage-based dedup for the two functions above — the Transfer Room
// page is revisited many times after the purchase (buyer/seller checking
// transfer progress), and a plain page-load effect would otherwise refire
// the event on every single visit. try/catch'd since localStorage can
// throw (private browsing, blocked site data) — treating that as "not yet
// tracked" just risks one duplicate event in the rare case it fails
// silently, never a crash.
const PURCHASE_TRACKED_KEY_PREFIX = "durqo_ga_purchase_tracked_";

export function hasTrackedPurchase(orderId: string): boolean {
  try {
    return window.localStorage.getItem(PURCHASE_TRACKED_KEY_PREFIX + orderId) === "1";
  } catch {
    return false;
  }
}

export function markPurchaseTracked(orderId: string): void {
  try {
    window.localStorage.setItem(PURCHASE_TRACKED_KEY_PREFIX + orderId, "1");
  } catch {
    // ignore — worst case this event fires again on a later visit
  }
}

export function trackSignUp(role: "buyer" | "seller") {
  sendGAEvent("event", "sign_up", { method: "email", role });
}

// Fired once a new listing's full insert (listing row + every dependent
// table) has actually succeeded — see the setSubmitted(true) call in
// dashboard/seller/listings/new/page.tsx, not on the form's initial submit
// click (which can still fail partway through and roll back).
export function trackListingSubmitted(params: { category: string; price: number }) {
  sendGAEvent("event", "generate_lead", {
    lead_type: "listing_submitted",
    category: params.category,
    currency: "USD",
    value: params.price,
  });
}

// Fired once submitVerification() (the server action) has actually
// returned successfully, from dashboard/seller/verification/page.tsx.
export function trackVerificationSubmitted(method: string) {
  sendGAEvent("event", "verification_submitted", { method });
}
