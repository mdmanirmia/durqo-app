"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// Sends a buyer to their Messages inbox with this seller/listing thread
// pre-selected (see MessagesPanel's ?with=&listing= handling). Checks auth
// client-side rather than linking straight to /login, matching CartButton
// and WishlistButton's pattern.
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
      className="flex items-center justify-center gap-2 rounded-lg border border-rule-strong py-2.5 text-sm font-semibold hover:border-brand-strong disabled:opacity-60"
    >
      <MessageCircle size={15} /> Chat with Seller
    </button>
  );
}
