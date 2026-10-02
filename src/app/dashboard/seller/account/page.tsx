import { User } from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { SELLER_NAV } from "@/lib/dashboard-nav";
import { createClient } from "@/lib/supabase/server";
import AccountForm from "./AccountForm";

// A seller who saved a name before first_name/last_name existed (migration
// 056) only has full_name on file -- split it once here so the form shows
// something sensible on first load instead of two blank fields. This is
// purely a display fallback: nothing is written back until the seller
// actually saves the form.
function splitFullName(fullName: string): { first: string; last: string } {
  const trimmed = fullName.trim();
  if (!trimmed) return { first: "", last: "" };
  const parts = trimmed.split(/\s+/);
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

export default async function SellerAccountPage() {
  const supabase = await createClient();

  let initialFirstName = "";
  let initialLastName = "";
  let initialCountry = "";
  let initialAddress = "";
  let initialEmail = "";

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      initialEmail = user.email ?? "";
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name, full_name, country, address")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.first_name || profile?.last_name) {
        initialFirstName = profile.first_name ?? "";
        initialLastName = profile.last_name ?? "";
      } else {
        const split = splitFullName(profile?.full_name ?? "");
        initialFirstName = split.first;
        initialLastName = split.last;
      }
      initialCountry = profile?.country ?? "";
      initialAddress = profile?.address ?? "";
    }
  }

  return (
    <DashboardShell title="Seller Dashboard" icon="user" nav={SELLER_NAV} switchHref="/dashboard/buyer" switchLabel="Go to Buyer Dashboard">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand-hover">
          <User size={15} />
        </div>
        <h2 className="text-xl">Account details</h2>
      </div>
      <AccountForm
        initialFirstName={initialFirstName}
        initialLastName={initialLastName}
        initialCountry={initialCountry}
        initialAddress={initialAddress}
        initialEmail={initialEmail}
      />
    </DashboardShell>
  );
}
