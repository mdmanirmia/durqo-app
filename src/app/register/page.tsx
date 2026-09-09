import type { Metadata } from "next";
import RegisterFormPage from "./RegisterForm";

// Section 15: authenticated-area/utility pages are noindex,follow.
export const metadata: Metadata = {
  title: "Register | Durqo",
  robots: { index: false, follow: true },
};

export default function RegisterPage() {
  return <RegisterFormPage />;
}
