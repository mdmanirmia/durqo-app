import type { Metadata } from "next";
import CartView from "./CartView";

// Section 15: cart is a private, per-session utility page — noindex,nofollow
// (nothing on it is worth crawling onward from).
export const metadata: Metadata = {
  title: "Your Cart | Durqo",
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return <CartView />;
}
