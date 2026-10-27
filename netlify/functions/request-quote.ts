import { createHash } from "node:crypto";
import { studioProducts } from "../../src/data/studio-products";
import { deliveryForPostcode, isValidPostcode } from "../../src/data/delivery-zones";
import { json, newRequestId, requestStore, siteOrigin, type QuoteRequest } from "./lib/quote-requests";

/**
 * Public: a customer asks for a delivery quote from a Studio table page (their postcode is one we quote individually).
 *
 * The request is saved, and the order inbox gets an email with a button that opens /admin/quote/ with the request loaded,
 * so the quote is a price and a click away. The customer gets an on-screen thank-you, not an email, so this can't be used
 * to send mail to someone else's address. Spam is limited by a hidden field and a small per-visitor hourly limit.
 *
 * Needs BREVO_API_KEY, BREVO_SENDER_EMAIL and ORDER_NOTIFICATION_EMAIL (the same ones the order emails use).
 */

const HOURLY_LIMIT = 5;
const esc = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function handler(event: { httpMethod: string; body: string | null; headers: Record<string, string | undefined> }) {
  if (event.httpMethod !== "POST") return json(405, { error: "Method Not Allowed" });

  let input: Record<string, unknown>;
  try {
    input = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Invalid request." });
  }

  // A hidden field real visitors never see: if it is filled in, a bot did it. Reply as if it worked, and keep nothing.
  if (typeof input.website === "string" && input.website.trim() !== "") return json(200, { ok: true });

  const product = typeof input.productId === "string" ? studioProducts[input.productId] : undefined;
  const size = product?.sizes.find((s) => s.id === input.sizeId);
  if (!product || !size) return json(404, { error: "Choose a table and size." });

  const postcode = String(input.postcode ?? "").trim();
  const delivery = isValidPostcode(postcode) ? deliveryForPostcode(postcode) : null;
  if (!delivery) return json(400, { error: "Enter a 4-digit delivery postcode." });
  if (delivery.priceCents !== null) return json(400, { error: "Delivery to that postcode is a set fee, so you can order online." });

  const name = String(input.name ?? "").trim().slice(0, 80);
  const email = String(input.email ?? "").trim();
  const phone = String(input.phone ?? "").trim().slice(0, 25);
  const message = String(input.message ?? "").trim().slice(0, 600);
  if (!name) return json(400, { error: "Please enter your name." });
  if (!/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(email) || email.length > 200) return json(400, { error: "Please enter a valid email address." });
  if (phone && !/^[0-9 +()\-]{6,25}$/.test(phone)) return json(400, { error: "Please enter a valid phone number, or leave it blank." });

  try {
    return await saveRequest(event, { product, size, postcode, name, email, phone, message });
  } catch (err) {
    console.error("request-quote: could not save the request:", err);
    return json(500, { error: "We couldn't save your request just now. Please try again in a moment." });
  }
}

type Saved = {
  product: NonNullable<(typeof studioProducts)[string]>;
  size: NonNullable<(typeof studioProducts)[string]>["sizes"][number];
  postcode: string;
  name: string;
  email: string;
  phone: string;
  message: string;
};

async function saveRequest(event: { headers: Record<string, string | undefined> }, { product, size, postcode, name, email, phone, message }: Saved) {
  const store = requestStore(event);

  // At most a handful of requests an hour from one visitor.
  const visitor = createHash("sha256").update(event.headers["x-nf-client-connection-ip"] || event.headers["client-ip"] || event.headers["x-forwarded-for"] || "unknown").digest("hex").slice(0, 24);
  const limitKey = `limit/${visitor}`;
  const now = Date.now();
  const previous = (await store.get(limitKey, { type: "json" }).catch(() => null)) as { start: number; count: number } | null;
  const window = previous && now - previous.start < 3_600_000 ? previous : { start: now, count: 0 };
  if (window.count >= HOURLY_LIMIT) return json(429, { error: "That's a lot of requests. Please try again later, or contact us directly." });
  await store.setJSON(limitKey, { start: window.start, count: window.count + 1 });

  const request: QuoteRequest = {
    id: newRequestId(),
    createdAt: new Date(now).toISOString(),
    status: "new",
    productId: product.id,
    sizeId: size.id,
    order: `${product.name} — ${size.label}`,
    postcode,
    name,
    email,
    phone,
    message,
  };
  await store.setJSON(`req/${request.id}`, request);

  // Tell the order inbox. The request is already saved, so an email problem is logged but the customer still gets their thank-you.
  const { BREVO_API_KEY, BREVO_SENDER_EMAIL, ORDER_NOTIFICATION_EMAIL } = process.env;
  if (BREVO_API_KEY && BREVO_SENDER_EMAIL && ORDER_NOTIFICATION_EMAIL) {
    try {
      const link = `${siteOrigin(event.headers)}/admin/quote/?request=${request.id}`;
      const preview = process.env.CONTEXT && process.env.CONTEXT !== "production" ? "[PREVIEW] " : "";
      const lines = [
        "A delivery quote has been requested.",
        "",
        `Table:      ${request.order}`,
        `Deliver to: ${postcode}`,
        "",
        `Name:       ${name}`,
        `Email:      ${email}`,
        `Phone:      ${phone || "—"}`,
        ...(message ? ["", "Message:", message] : []),
        "",
        "Open it, add the delivery price and send the quote:",
        link,
      ];
      const html = `<div style="font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;color:#3d4f47;max-width:560px">
<p style="margin:0 0 16px">A delivery quote has been requested.</p>
<table style="border-collapse:collapse;margin:0 0 16px">
<tr><td style="padding:2px 16px 2px 0;color:#5a6b64">Table</td><td>${esc(request.order)}</td></tr>
<tr><td style="padding:2px 16px 2px 0;color:#5a6b64">Deliver to</td><td>${esc(postcode)}</td></tr>
<tr><td style="padding:2px 16px 2px 0;color:#5a6b64">Name</td><td>${esc(name)}</td></tr>
<tr><td style="padding:2px 16px 2px 0;color:#5a6b64">Email</td><td>${esc(email)}</td></tr>
<tr><td style="padding:2px 16px 2px 0;color:#5a6b64">Phone</td><td>${esc(phone || "—")}</td></tr>
</table>
${message ? `<p style="margin:0 0 16px;white-space:pre-line"><span style="color:#5a6b64">Message:</span><br>${esc(message)}</p>` : ""}
<p style="margin:24px 0"><a href="${esc(link)}" style="background:#3d4f47;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;display:inline-block">Open and send the quote</a></p>
<p style="margin:0;font-size:13px;color:#5a6b64">You can also reply to this email to reach ${esc(name)} directly.</p></div>`;
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { "Content-Type": "application/json", "api-key": BREVO_API_KEY },
        body: JSON.stringify({
          sender: { email: BREVO_SENDER_EMAIL, name: "Level Design orders" },
          to: [{ email: ORDER_NOTIFICATION_EMAIL }],
          replyTo: { email, name },
          subject: `${preview}Delivery quote request: ${product.name} (${size.label}) to ${postcode}, ${name}`,
          htmlContent: html,
          textContent: lines.join("\n"),
        }),
      });
      if (!response.ok) console.error("request-quote: Brevo rejected the notification:", response.status, await response.text());
    } catch (err) {
      console.error("request-quote: could not send the notification:", err);
    }
  } else {
    console.error("request-quote: email settings are missing, so no notification was sent (the request is saved).");
  }

  return json(200, { ok: true });
}
