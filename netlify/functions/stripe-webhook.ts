import Stripe from "stripe";
import { studioProducts } from "../../src/data/studio-products";

/**
 * Stripe → "you've got an order" email.
 *
 * Stripe calls this when a Checkout payment completes. It checks the call really came from Stripe (signature),
 * pulls the full order, and emails the details through Brevo so you can arrange delivery. The customer also gets a
 * confirmation email in Level Design's own words (the Stripe account's own receipts are switched off, as it is shared).
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

const esc = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

type CustomerEmailInput = {
  firstName?: string;
  reference: string;
  tableName: string;
  details: string[];
  tablePrice: string;
  deliveryName: string;
  deliveryPrice: string;
  paid: string;
  recipient: string;
  addressLines: string[];
  isRemote: boolean;
};

/** The customer's order confirmation, as styled HTML (the site's cream, green and copper) plus a plain-text version. */
function customerEmail(o: CustomerEmailInput) {
  const serif = "Georgia, 'Times New Roman', serif";
  const sans = "-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";
  const greeting = o.firstName ? `Thank you, ${o.firstName}.` : "Thank you for your order.";
  const steps = [
    ["Your table is made", "Each Studio table is made to order, with a lead time of 6–8 weeks."],
    ["We arrange delivery", "We'll be in touch to agree a delivery date as your table nears completion."],
    [
      "It arrives",
      o.isRemote
        ? "Delivery to your area is arranged individually. We'll confirm the cost with you, and invoice it separately, before your table is sent."
        : "Your table is delivered to the address above.",
    ],
  ];
  const row = (label: string, value: string, bold = false) =>
    `<tr><td style="padding:6px 0;color:#5a6b64;font-size:15px;">${esc(label)}</td><td align="right" style="padding:6px 0;color:#3d4f47;font-size:15px;${bold ? "font-weight:600;" : ""}">${esc(value)}</td></tr>`;

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Your Level Design order</title></head>
<body style="margin:0;padding:0;background:#f5f1e8;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f1e8;"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;font-family:${sans};">
  <tr><td style="background:#3d4f47;padding:28px 32px;text-align:center;">
    <div style="font-family:${serif};font-size:22px;letter-spacing:3px;color:#f5f1e8;text-transform:uppercase;">Level Design</div>
    <div style="font-size:12px;letter-spacing:2px;color:#d9b48d;margin-top:6px;text-transform:uppercase;">Dining tables, Melbourne</div>
  </td></tr>
  <tr><td style="padding:36px 32px 8px;">
    <h1 style="margin:0 0 12px;font-family:${serif};font-weight:normal;font-size:30px;color:#3d4f47;">${esc(greeting)}</h1>
    <p style="margin:0;font-size:17px;line-height:1.6;color:#5a6b64;">Your payment has been received and your <strong style="color:#3d4f47;">${esc(o.tableName)}</strong> is now in the queue to be made.</p>
  </td></tr>
  <tr><td style="padding:24px 32px 8px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f1e8;border-radius:12px;"><tr><td style="padding:24px;">
      <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#c8956a;">Order ${esc(o.reference)}</div>
      <div style="font-family:${serif};font-size:24px;color:#3d4f47;margin:6px 0 4px;">${esc(o.tableName)}</div>
      ${o.details.length ? `<div style="font-size:14px;line-height:1.6;color:#5a6b64;margin-bottom:14px;">${o.details.map(esc).join("<br>")}</div>` : ""}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #d9cfbd;">
        ${row("Table", o.tablePrice)}
        ${row(o.deliveryName, o.deliveryPrice)}
        ${row("Total paid", o.paid, true)}
      </table>
    </td></tr></table>
  </td></tr>
  <tr><td style="padding:20px 32px 0;">
    <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#c8956a;margin-bottom:6px;">Delivering to</div>
    <div style="font-size:16px;line-height:1.6;color:#3d4f47;">${[o.recipient, ...o.addressLines].filter(Boolean).map(esc).join("<br>")}</div>
  </td></tr>
  <tr><td style="padding:28px 32px 0;">
    <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#c8956a;margin-bottom:12px;">What happens next</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${steps
        .map(
          ([title, body], i) =>
            `<tr><td valign="top" width="36" style="padding:0 0 16px;"><div style="width:26px;height:26px;border-radius:13px;background:#3d4f47;color:#f5f1e8;text-align:center;line-height:26px;font-size:13px;">${i + 1}</div></td><td style="padding:0 0 16px;"><div style="font-size:16px;color:#3d4f47;font-weight:600;">${esc(title)}</div><div style="font-size:15px;line-height:1.6;color:#5a6b64;">${esc(body)}</div></td></tr>`,
        )
        .join("")}
    </table>
  </td></tr>
  <tr><td style="padding:12px 32px 36px;">
    <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#5a6b64;">If anything about your order needs to change, or you have a question, just reply to this email.</p>
    <p style="margin:0;font-family:${serif};font-size:18px;color:#3d4f47;">The Level Design team</p>
  </td></tr>
  <tr><td style="background:#f5f1e8;padding:18px 32px;text-align:center;font-size:13px;color:#5a6b64;"><a href="https://leveldesign.com.au" style="color:#c8956a;text-decoration:none;">leveldesign.com.au</a></td></tr>
</table>
</td></tr></table>
</body></html>`;

  const text = [
    greeting,
    "",
    `Your payment has been received and your ${o.tableName} is now in the queue to be made.`,
    "",
    `Order ${o.reference}`,
    o.tableName,
    ...o.details.map((d) => `  ${d}`),
    "",
    `  Table:       ${o.tablePrice}`,
    `  ${o.deliveryName}:  ${o.deliveryPrice}`,
    `  Total paid:  ${o.paid}`,
    "",
    "Delivering to",
    ...[o.recipient, ...o.addressLines].filter(Boolean).map((l) => `  ${l}`),
    "",
    "What happens next",
    ...steps.map(([title, body], i) => `  ${i + 1}. ${title}: ${body}`),
    "",
    "If anything about your order needs to change, or you have a question, just reply to this email.",
    "",
    "The Level Design team",
    "https://leveldesign.com.au",
  ].join("\n");

  return { html, text };
}

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
    // A short reference both emails share, so a customer quoting it can be matched to the full Stripe session id below.
    const reference = `LD-${session.id.slice(-8).toUpperCase()}`;
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
      `Order reference: ${reference}  (${session.id})`,
    ];

    const sendEmail = (message: Record<string, unknown>) =>
      fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { "Content-Type": "application/json", "api-key": BREVO_API_KEY },
        body: JSON.stringify(message),
      });

    const response = await sendEmail({
      sender: { email: BREVO_SENDER_EMAIL, name: "Level Design orders" },
      to: [{ email: ORDER_NOTIFICATION_EMAIL }],
      replyTo: customer?.email ? { email: customer.email, name: customer.name ?? undefined } : undefined,
      subject: `${live ? "" : "[TEST] "}New order ${reference}: ${item?.description ?? session.metadata?.order ?? "Studio table"} — ${money(session.amount_total)}`,
      textContent: lines.join("\n"),
    });
    if (!response.ok) {
      console.error("stripe-webhook: Brevo rejected the order email:", response.status, await response.text());
      return { statusCode: 500, body: "Could not send the order email." }; // Stripe will retry
    }

    // The customer's confirmation. The order email above is the one that matters, so a failure here is logged but does
    // not return an error — that would make Stripe retry and send you the order email again.
    if (customer?.email) {
      const product = session.metadata?.productId ? studioProducts[session.metadata.productId] : undefined;
      const size = product?.sizes.find((s) => s.id === session.metadata?.sizeId);
      const confirmation = customerEmail({
        firstName: customer.name?.trim().split(/\s+/)[0],
        reference,
        tableName: product?.name ?? item?.description ?? "Studio Collection table",
        // e.g. "2000mm L × 1000mm W × 750mm H · Seats 6–8 people · American oak / Clear matte"
        details: [size?.dimensions, size?.seating && `Seats ${size.seating}`, product?.specifications["Timber / Finish"]].filter(Boolean) as string[],
        tablePrice: money(item?.amount_total),
        deliveryName,
        deliveryPrice: isRemote ? "To be confirmed" : money(shippingCents),
        paid: money(session.amount_total),
        recipient: shipping?.name ?? customer.name ?? "",
        addressLines: addr
          ? [[addr.line1, addr.line2].filter(Boolean).join(", "), [addr.city, addr.state, addr.postal_code].filter(Boolean).join(" ")]
          : [],
        isRemote,
      });
      try {
        const sent = await sendEmail({
          sender: { email: BREVO_SENDER_EMAIL, name: "Level Design" },
          to: [{ email: customer.email, name: customer.name ?? undefined }],
          replyTo: { email: ORDER_NOTIFICATION_EMAIL, name: "Level Design" },
          subject: `${live ? "" : "[TEST] "}Your Level Design order ${reference}`,
          htmlContent: confirmation.html,
          textContent: confirmation.text,
        });
        if (!sent.ok) console.error("stripe-webhook: Brevo rejected the customer email:", sent.status, await sent.text());
      } catch (err) {
        console.error("stripe-webhook: could not send the customer email:", err);
      }
    }
    return { statusCode: 200, body: "Order email sent." };
  } catch (err) {
    console.error("stripe-webhook: failed to process order:", err);
    return { statusCode: 500, body: "Could not process the order." };
  }
}
