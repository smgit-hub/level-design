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
  try {
    ({ productId } = JSON.parse(event.body || "{}"));
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid request body." }) };
  }

  // Price is always looked up server-side from the product's Stripe Price ID —
  // never trust a client-supplied amount.
  const product = productId ? studioProducts[productId] : undefined;
  if (!product) {
    return { statusCode: 404, body: JSON.stringify({ error: "Unknown product." }) };
  }

  const stripe = new Stripe(stripeSecretKey);
  const origin = event.headers.origin || process.env.URL || "https://leveldesign.com.au";

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: product.stripePriceId, quantity: 1 }],
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
