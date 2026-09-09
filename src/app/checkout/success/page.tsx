import type { Metadata } from "next";
import CheckoutSuccessView from "./CheckoutSuccessView";

// Section 15: transactional confirmation page — noindex,nofollow.
export const metadata: Metadata = {
  title: "Payment Received | Durqo",
  robots: { index: false, follow: false },
};

export default function CheckoutSuccessPage() {
  return <CheckoutSuccessView />;
}
