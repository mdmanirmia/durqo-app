"use client";

import { useState, useTransition } from "react";
import { updateAccount } from "../actions";

const fieldCls =
  "rounded-md border border-rule-strong bg-paper px-3 py-2.5 text-sm text-ink focus:border-brand-strong focus:outline-none disabled:opacity-60";

export default function AccountForm({
  initialFullName,
  initialLocation,
  initialEmail,
}: {
  initialFullName: string;
  initialLocation: string;
  initialEmail: string;
}) {
  const [fullName, setFullName] = useState(initialFullName);
  const [location, setLocation] = useState(initialLocation);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    startTransition(async () => {
      try {
        const result = await updateAccount({ fullName, location, email, password });
        setPassword("");
        setFeedback({
          type: "success",
          message: result.emailChangeRequested
            ? "Saved. Check your new email address for a link to confirm the change."
            : "Your account details were saved.",
        });
      } catch (err) {
        setFeedback({ type: "error", message: err instanceof Error ? err.message : "Couldn't save — try again." });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg rounded-xl border border-rule bg-paper-raised p-6">
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-ink-soft">Full name</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={isPending}
              placeholder="Your name"
              className={fieldCls}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-ink-soft">Location</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={isPending}
              placeholder="City, Country"
              className={fieldCls}
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-ink-soft">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isPending}
            placeholder="you@email.com"
            className={fieldCls}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-ink-soft">New password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isPending}
            placeholder="Leave blank to keep current password"
            autoComplete="new-password"
            className={fieldCls}
          />
        </div>
        {feedback && (
          <div className={`text-sm ${feedback.type === "success" ? "text-brand-strong" : "text-danger"}`}>
            {feedback.message}
          </div>
        )}
        <button
          type="submit"
          disabled={isPending}
          className="w-fit rounded-md bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-60"
        >
          {isPending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
