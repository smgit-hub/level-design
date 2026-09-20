import { useState } from "react";
import { trackEvent } from "../lib/analytics";
import { EMAIL_PATTERN } from "../lib/forms";

export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");
    try {
      const response = await fetch("/.netlify/functions/newsletter-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Something went wrong.");
      trackEvent("sign_up", { method: "newsletter" });
      setStatus("success");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  };

  if (status === "success") {
    return <p className="text-sm text-[#e8dcc8]">Thanks for subscribing — keep an eye on your inbox.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          required
          pattern={EMAIL_PATTERN.source}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email address"
          aria-label="Email address"
          className="flex-1 min-w-0 px-4 py-3 rounded-full bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-[#c8956a] focus:outline-none transition-colors"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="px-6 py-3 bg-[#c8956a] text-white rounded-full hover:bg-[#b8856a] transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
        >
          {status === "loading" ? "Subscribing…" : "Subscribe"}
        </button>
      </div>
      {status === "error" && <p className="text-sm text-red-300 mt-2">{errorMessage}</p>}
    </form>
  );
}
