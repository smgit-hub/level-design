import Stripe from "stripe";
import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Private: starts a A$1 "TEST ORDER" checkout, so the whole path (Stripe Checkout, the order webhook, both emails) can be tried once on
 * the live site for a dollar instead of the price of a table. Used only by /admin/test-order/, behind the quote passphrase.
 *
 * It is deliberately separate from create-checkout-session.ts, so the real checkout is untouched. The test product exists in Stripe
 * only while it has been created with `npm run stripe:setup -- --test-order`; once it is archived (`--remove-test-order`) this
 * function simply reports that the test product isn't set up. Needs QUOTE_ADMIN_KEY and STRIPE_SECRET_KEY.
 */

const TEST_ORDER_LOOKUP_KEY = "studio_test_order";
const TEST_ORDER_CENTS = 100;

const json = (statusCode: number, body: Record<string, unknown>) => ({ statusCode, body: JSON.stringify(body) });
const sameSecret = (given: string, expected: string) =>
  timingSafeEqual(createHash("sha256").update(given).digest(), createHash("sha256").update(expected).digest());

export async function handler(event: { httpMethod: string; body: string | null; headers: Record<string, string | undefined> }) {
  if (event.httpMethod !== "POST") return json(405, { error: "Method Not Allowed" });

  const adminKey = process.env.QUOTE_ADMIN_KEY;
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!adminKey || !stripeSecretKey) return json(500, { error: "The test order is not configured." });

  let input: { key?: string };
  try {
    input = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Invalid request." });
  }
  if (!input.key || !sameSecret(String(input.key), adminKey)) {
    await new Promise((resolve) => setTimeout(resolve, 800)); // slows down guessing
    return json(401, { error: "Wrong passphrase." });
  }

  const stripe = new Stripe(stripeSecretKey);
  const origin = event.headers.origin || process.env.URL || "https://leveldesign.com.au";

  try {
    const { data: prices } = await stripe.prices.list({ lookup_keys: [TEST_ORDER_LOOKUP_KEY], active: true, limit: 1 });
    const price = prices[0];
    if (!price) return json(404, { error: "The test product isn't set up in Stripe (or has been archived). Run `npm run stripe:setup -- --test-order`." });
    if (price.unit_amount !== TEST_ORDER_CENTS || price.currency !== "aud") {
      return json(500, { error: "The test product's price isn't A$1, so it won't be used." });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: price.id, quantity: 1 }],
      phone_number_collection: { enabled: true },
      // The same tags a real order carries, so the order webhook handles it in the same way. "quote" skips the delivery-zone check.
      metadata: { source: "leveldesign-studio", productId: "test-order", sizeId: "test", order: "TEST ORDER", deliveryZone: "quote", deliveryPostcode: "", test: "yes" },
      payment_intent_data: { description: "TEST ORDER: Level Design checkout test (refund it)", metadata: { productId: "test-order", sizeId: "test" } },
      shipping_address_collection: { allowed_countries: ["AU"] },
      shipping_options: [{ shipping_rate_data: { type: "fixed_amount", fixed_amount: { amount: 0, currency: "aud" }, display_name: "Test order (no delivery charge)" } }],
      custom_text: { submit: { message: "This is a A$1 test of the Level Design checkout. Nothing will be made or delivered." } },
      success_url: `${origin}/studio/success/?table=${encodeURIComponent("Test order")}`,
      cancel_url: `${origin}/admin/test-order/`,
    });
    return json(200, { url: session.url, live: session.livemode });
  } catch (err) {
    console.error("create-test-order failed:", err);
    const message = err instanceof Error ? err.message : "";
    return json(500, { error: /permission|restricted/i.test(message) ? `Stripe refused: ${message}` : "Could not start the test order." });
  }
}
