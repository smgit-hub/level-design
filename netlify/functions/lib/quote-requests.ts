import { connectLambda, getStore } from "@netlify/blobs";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Delivery quote requests from the Studio table pages, kept in Netlify Blobs (a small key-value store that comes with the
 * site: no separate database or account). A request is one entry, found by a random id, so the link in the notification
 * email never has to carry the customer's details.
 */

export type QuoteRequest = {
  id: string;
  createdAt: string;
  status: "new" | "quoted" | "done";
  productId: string;
  sizeId: string;
  /** The table and size as shown to the customer, kept so the request still reads correctly if the range changes. */
  order: string;
  postcode: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  quotedAt?: string;
  quoteUrl?: string;
};

type LambdaEvent = Parameters<typeof connectLambda>[0];

/** Netlify's older function format needs the event handed over before the store can be used. */
export function requestStore(event: unknown) {
  connectLambda(event as LambdaEvent);
  return getStore({ name: "quote-requests", consistency: "strong" });
}

export const newRequestId = () => randomBytes(12).toString("hex");
export const isRequestId = (value: unknown): value is string => typeof value === "string" && /^[0-9a-f]{24}$/.test(value);

export const json = (statusCode: number, body: Record<string, unknown>) => ({ statusCode, body: JSON.stringify(body) });

/** The same passphrase check the other quote-page functions use. */
export function sameSecret(given: string, expected: string) {
  return timingSafeEqual(createHash("sha256").update(given).digest(), createHash("sha256").update(expected).digest());
}

/** Where the quote page is, for the link in the notification email (the preview's own address on previews). */
export const siteOrigin = (headers: Record<string, string | undefined>) =>
  process.env.DEPLOY_PRIME_URL || process.env.URL || headers.origin || "https://leveldesign.com.au";
