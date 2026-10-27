import { useState } from "react";
import { trackEvent } from "../lib/analytics";

export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  // With double opt-in switched on, Brevo emails a confirmation link first, so the thank-you says to check the inbox.
  const [needsConfirm, setNeedsConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");
    try {
      const response = await fetch("/.netlify/functions/newsletter-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, website }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Something went wrong.");
      trackEvent("sign_up", { method: "newsletter" });
      setNeedsConfirm(!!data.confirm);
      setStatus("success");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  };

  if (status === "success") {
    return (
      <p role="status" className="text-sm text-[#e8dcc8]">
        {needsConfirm ? "Nearly there: check your inbox and click the link to confirm your subscription." : "Thanks for subscribing — keep an eye on your inbox."}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          // No pattern attribute: the browser applies it without the shared pattern's ignore-case flag, which rejected every
          // lower-case address. type="email" checks the format, and the signup function checks it again.
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email address"
          aria-label="Email address"
          className="flex-1 min-w-0 px-4 py-3 rounded-full bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-[#c8956a] focus:outline-none focus:ring-2 focus:ring-[#c8956a]/40 transition-colors"
        />
        {/* A trap for bots: real visitors never see or fill this in. */}
        <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" value={website} onChange={(e) => setWebsite(e.target.value)} className="absolute -left-[9999px] h-0 w-0 opacity-0" />
        <button
          type="submit"
          disabled={status === "loading"}
          className="px-6 py-3 bg-[#c8956a] text-white rounded-full hover:bg-[#b8856a] transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
        >
          {status === "loading" ? "Subscribing…" : "Subscribe"}
        </button>
      </div>
      {status === "error" && <p role="alert" className="text-sm text-red-300 mt-2">{errorMessage}</p>}
      <p className="text-xs text-[#b8ac98] mt-2">
        By subscribing you agree to receive our emails and can unsubscribe at any time. See our{" "}
        <a href="/privacy/" className="underline underline-offset-2 hover:text-white">Privacy Policy</a>.
      </p>
    </form>
  );
}
