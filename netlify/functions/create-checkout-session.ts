import Stripe from "stripe";
import { studioProducts } from "../../src/data/studio-products";

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
  try {
    ({ productId, sizeId } = JSON.parse(event.body || "{}"));
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid request body." }) };
  }

  // Price is always looked up server-side from the size's Stripe Price ID —
  // never trust a client-supplied amount.
  const product = productId ? studioProducts[productId] : undefined;
  const size = product?.sizes.find((s) => s.id === sizeId);
  if (!product || !size) {
    return { statusCode: 404, body: JSON.stringify({ error: "Unknown product or size." }) };
  }

  const stripe = new Stripe(stripeSecretKey);
  const origin = event.headers.origin || process.env.URL || "https://leveldesign.com.au";

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: size.stripePriceId, quantity: 1 }],
      shipping_address_collection: { allowed_countries: ["AU"] },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: 19900, currency: "aud" },
            display_name: "Melbourne Metro Delivery",
          },
        },
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: 44900, currency: "aud" },
            display_name: "Other Capital Cities & VIC Regional Delivery",
          },
        },
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: 0, currency: "aud" },
            display_name: "Remote Delivery (WA / NT / TAS / far regional) — fee confirmed and invoiced separately",
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
