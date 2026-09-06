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

  // Reply-To is set to the submitter's own address so that replying from
  // the support@durqo.com inbox goes straight to them, not back to Durqo.
  await sendEmail(
    ADMIN_EMAIL,
    `Contact form: ${cleanSubject} — ${cleanName}`,
    `<p><strong>From:</strong> ${cleanName} (${cleanEmail})</p>
     <p><strong>Subject:</strong> ${cleanSubject}</p>
     <p>${cleanMessage.replace(/\n/g, "<br/>")}</p>`,
    cleanEmail
  );

  // Confirmation copy back to whoever filled out the form, so they have a
  // record their message actually sent — separate from the admin notification
  // above, sent to the email address they themselves typed into the form.
  await sendEmail(
    cleanEmail,
    "We've received your message — Durqo",
    `<p>Hi ${cleanName},</p>
     <p>Thanks for reaching out to Durqo. We've received your message and will reply within one business day.</p>
     <p><strong>Subject:</strong> ${cleanSubject}</p>
     <p><strong>Your message:</strong><br/>${cleanMessage.replace(/\n/g, "<br/>")}</p>
     <p>— Durqo</p>`
  );

  return { ok: true };
}
