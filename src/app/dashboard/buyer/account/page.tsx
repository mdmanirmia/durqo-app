import DashboardShell from "@/components/dashboard/DashboardShell";
import { BUYER_NAV } from "@/lib/dashboard-nav";
import { createClient } from "@/lib/supabase/server";
import AccountForm from "./AccountForm";

export default async function BuyerAccountPage() {
  const supabase = await createClient();

  let initialFullName = "";
  let initialLocation = "";
  let initialEmail = "";

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      initialEmail = user.email ?? "";
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, location")
        .eq("id", user.id)
        .maybeSingle();
      initialFullName = profile?.full_name ?? "";
      initialLocation = profile?.location ?? "";
    }
  }

  return (
    <DashboardShell title="Buyer Dashboard" nav={BUYER_NAV} switchHref="/dashboard/seller" switchLabel="Go to Seller Dashboard">
      <h2 className="mb-4 text-xl">Account details</h2>
      <AccountForm initialFullName={initialFullName} initialLocation={initialLocation} initialEmail={initialEmail} />
    </DashboardShell>
  );
}
