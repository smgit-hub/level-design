import { connectLambda, getStore } from "@netlify/blobs";
import { createHash } from "node:crypto";
import { sameSecret } from "./quote-requests";

/**
 * The passphrase check shared by the private admin functions (quote links, quote emails, quote requests, the test order).
 *
 * QUOTE_ADMIN_KEY is the only lock on them, so wrong guesses are counted per connection: after MAX_FAILURES wrong passphrases
 * within an hour, that connection is refused for an hour, even with the right passphrase. A correct passphrase clears the
 * count. Connections are stored only as a fingerprint of their address, in Netlify Blobs. If the store can't be reached
 * the passphrase is still checked as usual, so a storage problem never locks the owner out.
 */
const MAX_FAILURES = 10;
const WINDOW_MS = 60 * 60 * 1000;
const LOCK_MS = 60 * 60 * 1000;

type Attempts = { failures: number; windowStart: number; lockedUntil?: number };
type LambdaEvent = Parameters<typeof connectLambda>[0];
type Event = { headers: Record<string, string | undefined> };
type Response = { statusCode: number; body: string };

const deny = (statusCode: number, error: string): Response => ({ statusCode, body: JSON.stringify({ error }) });

function clientKey(headers: Event["headers"]) {
  const ip = headers["x-nf-client-connection-ip"] || headers["client-ip"] || headers["x-forwarded-for"]?.split(",")[0]?.trim() || "unknown";
  return `ip/${createHash("sha256").update(ip).digest("hex").slice(0, 32)}`;
}

/** Returns null when the passphrase is right; otherwise the response to send back (401 wrong, 429 locked out). */
export async function checkPassphrase(event: Event, given: unknown, expected: string): Promise<Response | null> {
  const key = clientKey(event.headers);
  let store: ReturnType<typeof getStore> | null = null;
  let attempts: Attempts | null = null;
  try {
    connectLambda(event as unknown as LambdaEvent);
    store = getStore({ name: "admin-lockout", consistency: "strong" });
    attempts = (await store.get(key, { type: "json" })) as Attempts | null;
  } catch (err) {
    console.error("admin-auth: lockout store unavailable, checking the passphrase only:", err);
    store = null;
  }

  const now = Date.now();
  if (attempts?.lockedUntil && attempts.lockedUntil > now) {
    return deny(429, "Too many wrong passphrases from this connection. Try again in an hour.");
  }

  if (typeof given === "string" && given && sameSecret(given, expected)) {
    if (store && attempts) await store.delete(key).catch(() => undefined);
    return null;
  }

  if (store) {
    const fresh = !attempts || now - attempts.windowStart > WINDOW_MS || (attempts.lockedUntil ?? 0) > 0;
    const failures = (fresh ? 0 : attempts!.failures) + 1;
    const next: Attempts = { failures, windowStart: fresh ? now : attempts!.windowStart, ...(failures >= MAX_FAILURES ? { lockedUntil: now + LOCK_MS } : {}) };
    await store.setJSON(key, next).catch((err) => console.error("admin-auth: could not record a failed attempt:", err));
  }
  await new Promise((resolve) => setTimeout(resolve, 800)); // slows down guessing
  return deny(401, "Wrong passphrase.");
}
