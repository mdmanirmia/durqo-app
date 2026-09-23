"use client";

// 2026-09-23 bot-signup cleanup: a wave of automated registrations (random
// 15-30 character alphanumeric full_name strings, scraped real corporate
// email addresses, each confirming its own email within 2-75 seconds of
// signing up — too fast for a human, and fast enough to slip straight past
// the existing "Unverified" admin holding pen from the Sep 21 bot-cleanup
// pass, since these bots DO confirm) was cluttering the admin Users table
// and inflating signup counts. Cloudflare Turnstile (free, no user-facing
// puzzle in the common case) is wired into Supabase Auth's own built-in
// CAPTCHA protection — see https://supabase.com/docs/guides/auth/auth-captcha.
// Supabase's "Enable CAPTCHA protection" toggle applies to sign-up, sign-in,
// AND password-reset alike, so this widget is used on both the register and
// login forms (not just register) — turning the toggle on without also
// updating login would have broken every login instantly, since Supabase
// would then reject any signInWithPassword() call that didn't carry a valid
// captchaToken.
//
// Renders nothing (and never blocks submission) when
// NEXT_PUBLIC_TURNSTILE_SITE_KEY isn't set, the same graceful-degrade
// pattern as RESEND_API_KEY/Stripe elsewhere in this codebase — so local
// dev and any environment without a configured site key keeps working
// exactly as it did before this change.
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";

// Whether a captcha token is actually required before submitting the form
// this widget is attached to — false whenever no site key is configured, so
// callers can skip the "please complete the check" gate entirely rather
// than blocking a form that will never show a widget.
export const captchaRequired = !!SITE_KEY;

export interface TurnstileHandle {
  reset: () => void;
}

let scriptLoadPromise: Promise<void> | null = null;
function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (!scriptLoadPromise) {
    scriptLoadPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
      if (existing) {
        existing.addEventListener("load", () => resolve());
        return;
      }
      const script = document.createElement("script");
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Couldn't load the verification widget."));
      document.head.appendChild(script);
    });
  }
  return scriptLoadPromise;
}

const TurnstileWidget = forwardRef<TurnstileHandle, { onToken: (token: string | null) => void }>(
  function TurnstileWidget({ onToken }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const [ready, setReady] = useState(false);

    useImperativeHandle(ref, () => ({
      reset: () => {
        if (widgetIdRef.current && window.turnstile) window.turnstile.reset(widgetIdRef.current);
      },
    }));

    useEffect(() => {
      if (!SITE_KEY) return;
      let cancelled = false;
      loadScript()
        .then(() => {
          if (!cancelled) setReady(true);
        })
        .catch(() => {
          // Swallow — the form's own captchaRequired check keeps working off
          // whatever token (or lack of one) ever gets reported; a failed
          // script load just means the widget never renders and Supabase's
          // own captcha check (if enabled) will reject the submission with
          // a clear error, same as any other network hiccup would.
        });
      return () => {
        cancelled = true;
      };
    }, []);

    useEffect(() => {
      if (!ready || !SITE_KEY || !containerRef.current || !window.turnstile || widgetIdRef.current) return;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: SITE_KEY,
        callback: (token) => onToken(token),
        "expired-callback": () => onToken(null),
        "error-callback": () => onToken(null),
      });
    }, [ready, onToken]);

    if (!SITE_KEY) return null;

    return <div ref={containerRef} className="flex justify-center" />;
  }
);

export default TurnstileWidget;
