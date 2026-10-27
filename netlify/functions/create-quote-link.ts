import Stripe from "stripe";
import { createHash, timingSafeEqual } from "node:crypto";
import { studioProducts } from "../../src/data/studio-products";
import { isValidPostcode } from "../../src/data/delivery-zones";
import { siteOrigin } from "./lib/site";

/**
 * Private tool behind /admin/quote/: makes a one-off payment link for a Studio table at a delivery price we have quoted.
 *
 * The link is built like a normal checkout (same Price, same order tags, same Terms line), so the order-email webhook
 * sends the usual owner email and branded customer confirmation when it is paid. It can only be paid once, and it stays
 * valid until it is deactivated in the Stripe dashboard. Needs QUOTE_ADMIN_KEY (the passphrase typed on the page).
 */

const json = (statusCode: number, body: Record<string, unknown>) => ({ statusCode, body: JSON.stringify(body) });

const sameSecret = (given: string, expected: string) =>
  timingSafeEqual(createHash("sha256").update(given).digest(), createHash("sha256").update(expected).digest());

export async function handler(event: { httpMethod: string; body: string | null; headers: Record<string, string | undefined> }) {
  if (event.httpMethod !== "POST") return json(405, { error: "Method Not Allowed" });

  const adminKey = process.env.QUOTE_ADMIN_KEY;
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!adminKey || !stripeSecretKey) return json(500, { error: "The quote tool is not configured." });

  let input: { key?: string; productId?: string; sizeId?: string; deliveryDollars?: number | string; postcode?: string; quoteFor?: string };
  try {
    input = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Invalid request." });
  }

  if (!input.key || !sameSecret(String(input.key), adminKey)) {
    await new Promise((resolve) => setTimeout(resolve, 800)); // slows down guessing
    return json(401, { error: "Wrong passphrase." });
  }

  const product = input.productId ? studioProducts[input.productId] : undefined;
  const size = product?.sizes.find((s) => s.id === input.sizeId);
  if (!product || !size) return json(404, { error: "Choose a table and size." });

  const deliveryCents = Math.round(Number(input.deliveryDollars) * 100);
  if (!Number.isFinite(deliveryCents) || deliveryCents < 0 || deliveryCents > 500000) {
    return json(400, { error: "Enter the delivery price in dollars, between 0 and 5,000." });
  }
  const postcode = String(input.postcode ?? "").trim();
  if (postcode && !isValidPostcode(postcode)) return json(400, { error: "The postcode must be 4 digits." });
  const quoteFor = String(input.quoteFor ?? "").trim().slice(0, 80);

  const stripe = new Stripe(stripeSecretKey);
  const origin = siteOrigin(event.headers);

  try {
    // The table's price comes from the live Stripe Price, and is refused if it ever differs from the site's.
    const { data: prices } = await stripe.prices.list({ lookup_keys: [size.stripeLookupKey], active: true, limit: 1 });
    const stripePrice = prices[0];
    if (!stripePrice || stripePrice.unit_amount !== size.price || stripePrice.currency !== "aud") {
      return json(500, { error: "The Stripe price for that size is missing or doesn't match the site. Run `npm run stripe:setup`." });
    }

    const orderLabel = `${product.name} — ${size.label}`;
    // Delivery is a fixed shipping rate at the agreed amount, so the order email reads it the same way as a normal order.
    const rate = await stripe.shippingRates.create({
      display_name: postcode ? `Delivery to ${postcode} (quoted)` : "Delivery (quoted)",
      type: "fixed_amount",
      fixed_amount: { amount: deliveryCents, currency: "aud" },
    });

    const link = await stripe.paymentLinks.create({
      line_items: [{ price: stripePrice.id, quantity: 1 }],
      phone_number_collection: { enabled: true },
      shipping_address_collection: { allowed_countries: ["AU"] },
      shipping_options: [{ shipping_rate: rate.id }],
      // "source" is what makes the order-email webhook act on a payment; "quote" marks it as a quoted-delivery order.
      metadata: {
        source: "leveldesign-studio",
        productId: product.id,
        sizeId: size.id,
        order: orderLabel,
        deliveryZone: "quote",
        deliveryPostcode: postcode,
        quote: "yes",
        // Lets send-quote-email check the emailed delivery price is the one this link charges
        deliveryCents: String(deliveryCents),
        ...(quoteFor ? { quoteFor } : {}),
      },
      payment_intent_data: { description: `Studio Collection — ${orderLabel} (quoted delivery)`, metadata: { productId: product.id, sizeId: size.id } },
      custom_text: {
        submit: { message: `Made to order in Melbourne, with a lead time of 6–8 weeks, and assembled in your room on delivery. By paying you agree to our [Terms of Sale](${origin}/terms/).` },
      },
      after_completion: { type: "redirect", redirect: { url: `${origin}/studio/success/?table=${encodeURIComponent(product.name)}` } },
      restrictions: { completed_sessions: { limit: 1 } },
    });

    return json(200, {
      // The email step looks the link up by id in our own Stripe account, rather than trusting a URL sent back to it
      id: link.id,
      url: link.url,
      order: orderLabel,
      tableCents: size.price,
      deliveryCents,
      totalCents: size.price + deliveryCents,
      live: link.livemode,
    });
  } catch (err) {
    console.error("create-quote-link failed:", err);
    const message = err instanceof Error ? err.message : "";
    // A restricted key without the right permissions says so plainly; show that so it can be fixed.
    return json(500, { error: /permission|restricted/i.test(message) ? `Stripe refused: ${message}` : "Could not create the payment link." });
  }
}
