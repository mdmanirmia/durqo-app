import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { remindUnrepliedMessages } from "@/lib/message-reminders";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Hit every 10 minutes by the Supabase pg_cron job from migration 063.
// No secret needed: it only ever sends reminders that are actually due,
// each at most once (reminder_sent_at), so an extra call does nothing.
export async function POST() {
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ ok: false });
  try {
    await remindUnrepliedMessages(admin);
  } catch (err) {
    console.error("[hooks/message-reminders] failed:", err);
  }
  return NextResponse.json({ ok: true });
}
