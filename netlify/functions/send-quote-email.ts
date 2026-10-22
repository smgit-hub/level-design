import { createHash, timingSafeEqual } from "node:crypto";
import { studioProducts } from "../../src/data/studio-products";
import { isValidPostcode } from "../../src/data/delivery-zones";
import { isRequestId, requestStore, type QuoteRequest } from "./lib/quote-requests";

/**
 * Private tool behind /admin/quote/: emails the customer their delivery quote and payment link, in Level Design's own words,
 * so it doesn't have to be written in a mail app. Sent through Brevo from the same verified sender as the order emails, with a
 * copy to the order inbox, and replies go to that inbox.
 *
 * The wording is fixed here (only the optional personal note is free text, and it is escaped), and the payment link must be a
 * Stripe link, so the page can't be used to send arbitrary email from the domain. Needs QUOTE_ADMIN_KEY, BREVO_API_KEY,
 * BREVO_SENDER_EMAIL and ORDER_NOTIFICATION_EMAIL.
 */

const json = (statusCode: number, body: Record<string, unknown>) => ({ statusCode, body: JSON.stringify(body) });

const sameSecret = (given: string, expected: string) =>
  timingSafeEqual(createHash("sha256").update(given).digest(), createHash("sha256").update(expected).digest());

const money = (cents: number) => new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(cents / 100);
const esc = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

type QuoteEmailInput = {
  firstName?: string;
  tableName: string;
  details: string[];
  tablePrice: string;
  deliveryLabel: string;
  deliveryPrice: string;
  total: string;
  link: string;
  note?: string;
};

function quoteEmail(o: QuoteEmailInput) {
  const serif = "Georgia, 'Times New Roman', serif";
  const sans = "-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";
  const greeting = o.firstName ? `Hi ${o.firstName},` : "Hello,";
  const steps = [
    ["Pay securely", "Use the pay link in this email. Your payment is taken on Stripe's secure page."],
    ["Your table is made", "Each Studio table is made to order in Melbourne, with a lead time of 6–8 weeks."],
    ["We arrange delivery", "We'll agree a delivery date with you as your table nears completion, then deliver it in two parts, the top and the base, and assemble it in your room."],
  ];
  const row = (label: string, value: string, bold = false) =>
    `<tr><td style="padding:6px 0;color:#5a6b64;font-size:15px;">${esc(label)}</td><td align="right" style="padding:6px 0;color:#3d4f47;font-size:15px;${bold ? "font-weight:600;" : ""}">${esc(value)}</td></tr>`;
  const noteHtml = o.note
    ? `<tr><td style="padding:0 32px 8px;"><p style="margin:0;font-size:16px;line-height:1.6;color:#3d4f47;white-space:pre-line;">${esc(o.note)}</p></td></tr>`
    : "";

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Your Level Design quote</title></head>
<body style="margin:0;padding:0;background:#f5f1e8;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f1e8;"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;font-family:${sans};">
  <tr><td style="background:#3d4f47;padding:28px 32px;text-align:center;">
    <div style="font-family:${serif};font-size:22px;letter-spacing:3px;color:#f5f1e8;text-transform:uppercase;">Level Design</div>
    <div style="font-size:12px;letter-spacing:2px;color:#d9b48d;margin-top:6px;text-transform:uppercase;">Dining tables, Melbourne</div>
  </td></tr>
  <tr><td style="padding:36px 32px 8px;">
    <h1 style="margin:0 0 12px;font-family:${serif};font-weight:normal;font-size:30px;color:#3d4f47;">${esc(greeting)}</h1>
    <p style="margin:0;font-size:17px;line-height:1.6;color:#5a6b64;">Thanks for your interest in the <strong style="color:#3d4f47;">${esc(o.tableName)}</strong>. Here is your delivery quote and a secure link to order.</p>
  </td></tr>
  ${noteHtml}
  <tr><td style="padding:24px 32px 8px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f1e8;border-radius:12px;"><tr><td style="padding:24px;">
      <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#c8956a;">Your quote</div>
      <div style="font-family:${serif};font-size:24px;color:#3d4f47;margin:6px 0 4px;">${esc(o.tableName)}</div>
      ${o.details.length ? `<div style="font-size:14px;line-height:1.6;color:#5a6b64;margin-bottom:14px;">${o.details.map(esc).join("<br>")}</div>` : ""}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #d9cfbd;">
        ${row("Table", o.tablePrice)}
        ${row(o.deliveryLabel, o.deliveryPrice)}
        ${row("Total", o.total, true)}
      </table>
    </td></tr></table>
  </td></tr>
  <tr><td align="center" style="padding:24px 32px 8px;">
    <a href="${esc(o.link)}" style="display:inline-block;background:#3d4f47;color:#ffffff;text-decoration:none;font-size:16px;padding:14px 32px;border-radius:6px;">Pay ${esc(o.total)} securely</a>
    <div style="font-size:13px;color:#5a6b64;margin-top:10px;">Delivery includes assembly in your room. By paying you agree to our <a href="https://leveldesign.com.au/terms/" style="color:#c8956a;">Terms of Sale</a>.</div>
  </td></tr>
  <tr><td style="padding:24px 32px 0;">
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
    <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#5a6b64;">If you have a question, or the quote needs to change, just reply to this email.</p>
    <p style="margin:0;font-family:${serif};font-size:18px;color:#3d4f47;">The Level Design team</p>
  </td></tr>
  <tr><td style="background:#f5f1e8;padding:18px 32px;text-align:center;font-size:13px;line-height:1.7;color:#5a6b64;">Level Design Australia Pty Ltd · ABN 85 633 988 486<br><a href="https://leveldesign.com.au" style="color:#c8956a;text-decoration:none;">leveldesign.com.au</a></td></tr>
</table>
</td></tr></table>
</body></html>`;

  const text = [
    greeting,
    "",
    `Thanks for your interest in the ${o.tableName}. Here is your delivery quote and a secure link to order.`,
    ...(o.note ? ["", o.note] : []),
    "",
    o.tableName,
    ...o.details.map((d) => `  ${d}`),
    "",
    `  Table:  ${o.tablePrice}`,
    `  ${o.deliveryLabel}:  ${o.deliveryPrice}`,
    `  Total:  ${o.total}`,
    "",
    `Pay securely: ${o.link}`,
    "Delivery includes assembly in your room. By paying you agree to our Terms of Sale: https://leveldesign.com.au/terms/",
    "",
    "What happens next",
    ...steps.map(([title, body], i) => `  ${i + 1}. ${title}: ${body}`),
    "",
    "If you have a question, or the quote needs to change, just reply to this email.",
    "",
    "The Level Design team",
    "https://leveldesign.com.au",
    "Level Design Australia Pty Ltd, ABN 85 633 988 486",
  ].join("\n");

  return { html, text };
}

export async function handler(event: { httpMethod: string; body: string | null; headers: Record<string, string | undefined> }) {
  if (event.httpMethod !== "POST") return json(405, { error: "Method Not Allowed" });

  const adminKey = process.env.QUOTE_ADMIN_KEY;
  const { BREVO_API_KEY, BREVO_SENDER_EMAIL, ORDER_NOTIFICATION_EMAIL } = process.env;
  if (!adminKey || !BREVO_API_KEY || !BREVO_SENDER_EMAIL || !ORDER_NOTIFICATION_EMAIL) {
    return json(500, { error: "Email sending is not configured (needs QUOTE_ADMIN_KEY, BREVO_API_KEY, BREVO_SENDER_EMAIL and ORDER_NOTIFICATION_EMAIL)." });
  }

  let input: {
    key?: string;
    productId?: string;
    sizeId?: string;
    deliveryDollars?: number | string;
    postcode?: string;
    url?: string;
    toEmail?: string;
    toName?: string;
    note?: string;
    requestId?: string;
  };
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

  const link = String(input.url ?? "");
  if (!/^https:\/\/buy\.stripe\.com\/[A-Za-z0-9_]+$/.test(link)) return json(400, { error: "Create the payment link first." });

  const toEmail = String(input.toEmail ?? "").trim();
  if (!/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(toEmail) || toEmail.length > 200) return json(400, { error: "Enter the customer's email address." });
  const toName = String(input.toName ?? "").trim().slice(0, 80);
  const note = String(input.note ?? "").trim().slice(0, 600);

  const isTest = link.includes("/test_");
  const email = quoteEmail({
    firstName: toName.split(/\s+/)[0] || undefined,
    tableName: product.name,
    details: [size.dimensions, `Seats ${size.seating}`, product.specifications["Timber / Finish"]].filter(Boolean) as string[],
    tablePrice: money(size.price),
    deliveryLabel: postcode ? `Delivery to ${postcode}, with assembly` : "Delivery, with assembly",
    deliveryPrice: money(deliveryCents),
    total: money(size.price + deliveryCents),
    link,
    note: note || undefined,
  });

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "Content-Type": "application/json", "api-key": BREVO_API_KEY },
      body: JSON.stringify({
        sender: { email: BREVO_SENDER_EMAIL, name: "Level Design" },
        to: [{ email: toEmail, name: toName || undefined }],
        bcc: [{ email: ORDER_NOTIFICATION_EMAIL }],
        replyTo: { email: ORDER_NOTIFICATION_EMAIL, name: "Level Design" },
        subject: `${isTest ? "[TEST] " : ""}Your Level Design quote: ${product.name}`,
        htmlContent: email.html,
        textContent: email.text,
      }),
    });
    if (!response.ok) {
      console.error("send-quote-email: Brevo rejected the email:", response.status, await response.text());
      return json(500, { error: "Brevo couldn't send the email. Check the sender address is verified in Brevo." });
    }
    // If this quote answers a request from a table page, mark it quoted. The email is already sent, so a problem here is only logged.
    if (isRequestId(input.requestId)) {
      try {
        const store = requestStore(event);
        const key = `req/${input.requestId}`;
        const request = (await store.get(key, { type: "json" })) as QuoteRequest | null;
        if (request) await store.setJSON(key, { ...request, status: "quoted", quotedAt: new Date().toISOString(), quoteUrl: link });
      } catch (err) {
        console.error("send-quote-email: could not mark the request as quoted:", err);
      }
    }
    return json(200, { sent: true, to: toEmail, copyTo: ORDER_NOTIFICATION_EMAIL });
  } catch (err) {
    console.error("send-quote-email failed:", err);
    return json(500, { error: "Could not send the email." });
  }
}
