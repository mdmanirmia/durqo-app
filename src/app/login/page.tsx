import type { Metadata } from "next";
import LoginFormPage from "./LoginForm";

// Section 15: authenticated-area/utility pages are noindex,follow — a
// login page has no content worth ranking, but its outbound link (to
// /register) is still fine for crawlers to follow.
export const metadata: Metadata = {
  title: "Log In | Durqo",
  robots: { index: false, follow: true },
};

export default function LoginPage() {
  return <LoginFormPage />;
}
