"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// Sends a buyer to their Messages inbox with this seller/listing thread
// pre-selected (see MessagesPanel's ?with=&listing= handling). Checks auth
// client-side rather than linking straight to /login, matching CartButton
// and WishlistButton's pattern.
//
// 2026-09-20 redesign: solid dark fill (bg-brand-strong) instead of the
// outlined style every other sidebar control uses — the reference
// screenshot gives this one the single strongest visual weight on the
// card, since it's the action a buyer takes right after picking a payment
// method above. `text-white` is hardcoded (not `text-paper-raised`, which
// flips dark in dark mode) because `brand-strong` itself stays a constant
// dark navy across both themes — same reasoning already used for the
// disabled "Sold" BuyNowButton state and GatedContent's "Register Free"
// button.
export default function ChatWithSellerButton({ sellerId, listingId }: { sellerId: string; listingId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    if (busy) return;
    setBusy(true);
    try {
      const supabase = createClient();
      if (!supabase) {
        router.push("/login");
        return;
      }
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/login");
        return;
      }
      router.push(`/dashboard/buyer/messages?with=${sellerId}&listing=${listingId}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      className="flex items-center justify-center gap-2 rounded-xl bg-brand-strong py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
    >
      <MessageCircle size={15} /> Chat with Seller
    </button>
  );
}
