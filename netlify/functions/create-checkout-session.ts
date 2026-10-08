import Stripe from "stripe";
import { studioProducts } from "../../src/data/studio-products";
import { deliveryForPostcode } from "../../src/data/delivery-zones";

export async function handler(event: { httpMethod: string; body: string | null; headers: Record<string, string | undefined> }) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "Stripe is not configured." }) };
  }

  let productId: string | undefined;
  let sizeId: string | undefined;
  let postcode: string | undefined;
  try {
    ({ productId, sizeId, postcode } = JSON.parse(event.body || "{}"));
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid request body." }) };
  }

  // The amount is never taken from the browser: the Price is resolved server-side from the size's lookup key.
  const product = productId ? studioProducts[productId] : undefined;
  const size = product?.sizes.find((s) => s.id === sizeId);
  if (!product || !size) {
    return { statusCode: 404, body: JSON.stringify({ error: "Unknown product or size." }) };
  }

  // The delivery fee comes from the postcode, decided here — not from anything the buyer can pick at checkout.
  const delivery = deliveryForPostcode(String(postcode ?? ""));
  if (!delivery) {
    return { statusCode: 400, body: JSON.stringify({ error: "Enter a 4-digit delivery postcode." }) };
  }
  if (delivery.priceCents === null) {
    return { statusCode: 422, body: JSON.stringify({ error: "We quote delivery to that postcode individually — please get in touch." }) };
  }

  const stripe = new Stripe(stripeSecretKey);
  const origin = event.headers.origin || process.env.URL || "https://leveldesign.com.au";

  try {
    // Resolve the live Price (test or live mode, whichever key is in use) from the lookup key that
    // `npm run stripe:setup` created, and refuse to sell if Stripe's amount ever differs from the site's.
    const { data: prices } = await stripe.prices.list({ lookup_keys: [size.stripeLookupKey], active: true, limit: 1 });
    const stripePrice = prices[0];
    if (!stripePrice) {
      console.error(`No active Stripe Price for lookup key ${size.stripeLookupKey} — run \`npm run stripe:setup\`.`);
      return { statusCode: 500, body: JSON.stringify({ error: "This size isn't available to order online right now." }) };
    }
    if (stripePrice.unit_amount !== size.price || stripePrice.currency !== "aud") {
      console.error(`Stripe Price ${stripePrice.id} (${stripePrice.unit_amount} ${stripePrice.currency}) does not match the site price (${size.price} aud) for ${size.stripeLookupKey} — run \`npm run stripe:setup\`.`);
      return { statusCode: 500, body: JSON.stringify({ error: "This size isn't available to order online right now." }) };
    }

    const orderLabel = `${product.name} — ${size.label}`;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: stripePrice.id, quantity: 1 }],
      // Delivery needs a phone number, and the order email needs to know exactly what was bought.
      phone_number_collection: { enabled: true },
      // "source" lets the order-email webhook ignore checkouts from the other sites that share this Stripe account.
      metadata: { source: "leveldesign-studio", productId: product.id, sizeId: size.id, order: orderLabel, deliveryZone: delivery.zone, deliveryPostcode: String(postcode).trim() },
      payment_intent_data: { description: `Studio Collection — ${orderLabel}`, metadata: { productId: product.id, sizeId: size.id } },
      shipping_address_collection: { allowed_countries: ["AU"] },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: delivery.priceCents, currency: "aud" },
            display_name: delivery.label,
          },
        },
      ],
      success_url: `${origin}/studio/success/?table=${encodeURIComponent(product.name)}`,
      cancel_url: `${origin}/studio/${product.id}/`,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    console.error("Stripe checkout session creation failed:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Could not start checkout." }) };
  }
}
