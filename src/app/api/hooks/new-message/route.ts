import { NextResponse } from "next/server";
import { notifyNewMessage } from "@/lib/message-notify";

export const dynamic = "force-dynamic";

// Called by the `on_message_created_notify` trigger (migration 063) via
// pg_net. The body is only a hint: notifyNewMessage() re-reads the message
// with the service-role client and emails at most once per message, so
// calling this by hand can't spam anyone or reveal anything.
export async function POST(request: Request) {
  let id = "";
  try {
    const body = (await request.json()) as { message_id?: unknown };
    if (typeof body.message_id === "string") id = body.message_id;
  } catch {
    // ignore malformed bodies
  }
  if (id) {
    try {
      await notifyNewMessage(id);
    } catch (err) {
      console.error("[hooks/new-message] failed:", err);
    }
  }
  return NextResponse.json({ ok: true });
}
