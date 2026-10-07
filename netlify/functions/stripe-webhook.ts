import Stripe from "stripe";

/**
 * Stripe → "you've got an order" email.
 *
 * Stripe calls this when a Checkout payment completes. It checks the call really came from Stripe (signature),
 * pulls the full order, and emails the details through Brevo so you can arrange delivery.
 *
 * Environment variables (Netlify dashboard in production, your local env file in development):
 *   STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET   from Stripe (the webhook secret starts whsec_). A restricted key is enough:
 *                                              Checkout Sessions = Read (the checkout function also needs Write, Prices/Products = Read).
 *
 * The Stripe account is shared with other sites, so only sessions tagged metadata.source = "leveldesign-studio" are acted on.
 *   BREVO_API_KEY                              already used by the newsletter signup
 *   BREVO_SENDER_EMAIL                         a sender you have verified in Brevo
 *   ORDER_NOTIFICATION_EMAIL                   where order emails go
 */

type NetlifyEvent = {
  httpMethod: string;
  body: string | null;
  isBase64Encoded?: boolean;
  headers: Record<string, string | undefined>;
};

const money = (cents: number | null | undefined) =>
  cents == null ? "—" : new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(cents / 100);

export async function handler(event: NetlifyEvent) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, BREVO_API_KEY, BREVO_SENDER_EMAIL, ORDER_NOTIFICATION_EMAIL } = process.env;
  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
    console.error("stripe-webhook: STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET is not set.");
    return { statusCode: 500, body: "Stripe is not configured." };
  }

  // The signature is computed over the exact bytes Stripe sent, so use the raw body.
  const rawBody = event.isBase64Encoded && event.body ? Buffer.from(event.body, "base64").toString("utf8") : event.body ?? "";
  const signature = event.headers["stripe-signature"];
  if (!signature) {
    return { statusCode: 400, body: "Missing Stripe signature." };
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY);
  let stripeEvent: Stripe.Event;
  try {
    stripeEvent = stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("stripe-webhook: signature check failed:", err);
    return { statusCode: 400, body: "Invalid signature." };
  }

  // Only completed payments matter here; acknowledge everything else so Stripe stops retrying it.
  if (stripeEvent.type !== "checkout.session.completed" && stripeEvent.type !== "checkout.session.async_payment_succeeded") {
    return { statusCode: 200, body: "Ignored." };
  }

  if (!BREVO_API_KEY || !BREVO_SENDER_EMAIL || !ORDER_NOTIFICATION_EMAIL) {
    // Returning an error makes Stripe retry for days, so the order email is not lost if this is fixed in time.
    console.error("stripe-webhook: BREVO_API_KEY, BREVO_SENDER_EMAIL or ORDER_NOTIFICATION_EMAIL is not set.");
    return { statusCode: 500, body: "Order emails are not configured." };
  }

  try {
    const base = stripeEvent.data.object as Stripe.Checkout.Session;
    // This Stripe account also serves other websites and products, and Stripe sends every checkout to every
    // webhook endpoint — so only act on sessions this site's checkout created.
    if (base.metadata?.source !== "leveldesign-studio") {
      return { statusCode: 200, body: "Not a Studio order — ignored." };
    }
    if (base.payment_status !== "paid") {
      return { statusCode: 200, body: "Not paid yet." }; // an async payment will fire async_payment_succeeded later
    }

    // Needs only read access to Checkout Sessions (no extra permissions for shipping rates or payment intents).
    const session = await stripe.checkout.sessions.retrieve(base.id, { expand: ["line_items"] });
    // Stripe moved shipping details between API versions; read whichever is present.
    const s = session as Stripe.Checkout.Session & {
      shipping_details?: { name?: string | null; address?: Stripe.Address | null } | null;
      collected_information?: { shipping_details?: { name?: string | null; address?: Stripe.Address | null } | null } | null;
    };
    const shipping = s.shipping_details ?? s.collected_information?.shipping_details ?? null;
    const addr = shipping?.address;
    const customer = session.customer_details;

    const item = session.line_items?.data[0];
    // The delivery option is identified by its price, which is set in create-checkout-session.ts.
    const shippingCents = session.shipping_cost?.amount_total;
    const deliveryName =
      shippingCents === 19900 ? "Melbourne Metro" : shippingCents === 44900 ? "Other capital cities & VIC regional" : shippingCents === 0 ? "Remote (WA / NT / TAS / far regional)" : "Delivery";
    const isRemote = shippingCents === 0;
    const live = session.livemode;
    const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id; // an id; no expansion needed

    const lines = [
      `${live ? "" : "[TEST ORDER] "}New Studio Collection order`,
      "",
      `Item:      ${item?.description ?? session.metadata?.order ?? "—"}`,
      `Table:     ${money(item?.amount_total)}`,
      `Delivery:  ${deliveryName}  ${money(shippingCents)}`,
      `Paid:      ${money(session.amount_total)}`,
      "",
      ...(isRemote ? ["⚠ REMOTE DELIVERY: no delivery fee was charged. Confirm the fee with the customer and invoice it separately.", ""] : []),
      "Customer",
      `  ${customer?.name ?? "—"}`,
      `  ${customer?.email ?? "—"}`,
      `  ${customer?.phone ?? "—"}`,
      "",
      "Deliver to",
      `  ${shipping?.name ?? customer?.name ?? ""}`,
      ...(addr
        ? [
            `  ${[addr.line1, addr.line2].filter(Boolean).join(", ")}`,
            `  ${[addr.city, addr.state, addr.postal_code].filter(Boolean).join(" ")}`,
            `  ${addr.country ?? ""}`,
          ]
        : ["  (no delivery address returned)"]),
      "",
      `Stripe: https://dashboard.stripe.com/${live ? "" : "test/"}payments/${paymentIntentId ?? ""}`,
      `Order reference: ${session.id}`,
    ];

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "Content-Type": "application/json", "api-key": BREVO_API_KEY },
      body: JSON.stringify({
        sender: { email: BREVO_SENDER_EMAIL, name: "Level Design orders" },
        to: [{ email: ORDER_NOTIFICATION_EMAIL }],
        replyTo: customer?.email ? { email: customer.email, name: customer.name ?? undefined } : undefined,
        subject: `${live ? "" : "[TEST] "}New order: ${item?.description ?? session.metadata?.order ?? "Studio table"} — ${money(session.amount_total)}`,
        textContent: lines.join("\n"),
      }),
    });
    if (!response.ok) {
      console.error("stripe-webhook: Brevo rejected the order email:", response.status, await response.text());
      return { statusCode: 500, body: "Could not send the order email." }; // Stripe will retry
    }
    return { statusCode: 200, body: "Order email sent." };
  } catch (err) {
    console.error("stripe-webhook: failed to process order:", err);
    return { statusCode: 500, body: "Could not process the order." };
  }
}
