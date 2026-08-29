-- ============================================================
-- Durqo — lets the recipient of a message mark it read. The base schema
-- only had select/insert policies on public.messages, so the chat UI's
-- "mark this thread read" call would otherwise be silently blocked by RLS.
-- Scoped to the recipient only (a sender can't mark their own sent message
-- read on the other person's behalf).
-- ============================================================

create policy "messages_update_recipient" on public.messages for update
  using (auth.uid() = recipient_id);
