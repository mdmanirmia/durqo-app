"use server";

import { sendEmail, ADMIN_EMAIL } from "@/lib/email";

export type ContactFormFields = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

// Replaces the previous fake onSubmit in contact/page.tsx, which only ever
// called setSent(true) and never sent the message anywhere. This is a plain
// support-inbox forward, not a database record — nothing about a contact
// message needs to persist in the app itself.
export async function submitContactForm({ name, email, subject, message }: ContactFormFields) {
  const cleanName = name.trim();
  const cleanEmail = email.trim();
  const cleanSubject = subject.trim() || "General question";
  const cleanMessage = message.trim();

  if (!cleanName || !cleanEmail || !cleanMessage) {
    throw new Error("Please fill in your name, email, and message.");
  }

  await sendEmail(
    ADMIN_EMAIL,
    `Contact form: ${cleanSubject} — ${cleanName}`,
    `<p><strong>From:</strong> ${cleanName} (${cleanEmail})</p>
     <p><strong>Subject:</strong> ${cleanSubject}</p>
     <p>${cleanMessage.replace(/\n/g, "<br/>")}</p>`
  );

  return { ok: true };
}
