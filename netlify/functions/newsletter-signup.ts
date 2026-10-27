import { siteOrigin } from "./lib/site";

/**
 * Newsletter signup from the footer form, through Brevo.
 *
 * Double opt-in: once BREVO_DOI_TEMPLATE_ID (a Brevo "double opt-in confirmation" template, whose button uses {{ doubleoptin }})
 * and BREVO_LIST_ID are set, Brevo emails the address a confirmation link and only adds it to the list once it's clicked, so
 * nobody can be signed up without their say-so. The link lands on /newsletter-confirmed/. Until both are set, the address is
 * added straight away as before, so the form keeps working while the template is being set up in Brevo.
 */
export async function handler(event: { httpMethod: string; body: string | null; headers: Record<string, string | undefined> }) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "Newsletter signup is not configured." }) };
  }

  let email: string | undefined;
  let website: string | undefined;
  try {
    ({ email, website } = JSON.parse(event.body || "{}"));
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid request body." }) };
  }

  // A hidden field people never see or fill in; bots that fill every field are told it worked and nothing is sent.
  if (website) {
    return { statusCode: 200, body: JSON.stringify({ ok: true, confirm: true }) };
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || typeof email !== "string" || !emailPattern.test(email) || email.length > 254) {
    return { statusCode: 400, body: JSON.stringify({ error: "Please enter a valid email address." }) };
  }

  // Set in Netlify's dashboard once the Brevo list exists — safe to leave unset
  // (contact is still created, just not added to a specific list).
  const listId = process.env.BREVO_LIST_ID;
  const doiTemplateId = process.env.BREVO_DOI_TEMPLATE_ID;
  const doubleOptIn = !!(listId && doiTemplateId);

  try {
    const response = doubleOptIn
      ? await fetch("https://api.brevo.com/v3/contacts/doubleOptinConfirmation", {
          method: "POST",
          headers: { "Content-Type": "application/json", "api-key": apiKey },
          body: JSON.stringify({
            email,
            includeListIds: [Number(listId)],
            templateId: Number(doiTemplateId),
            redirectionUrl: `${siteOrigin(event.headers)}/newsletter-confirmed/`,
          }),
        })
      : await fetch("https://api.brevo.com/v3/contacts", {
          method: "POST",
          headers: { "Content-Type": "application/json", "api-key": apiKey },
          body: JSON.stringify({
            email,
            listIds: listId ? [Number(listId)] : undefined,
            // Lets a repeat signup (e.g. re-subscribing) succeed instead of erroring on a duplicate contact.
            updateEnabled: true,
          }),
        });

    if (!response.ok) {
      const errBody = await response.text();
      console.error("Brevo signup failed:", response.status, errBody);
      return { statusCode: 500, body: JSON.stringify({ error: "Could not complete signup. Please try again." }) };
    }

    // "confirm" tells the form to say "check your inbox" rather than "you're subscribed".
    return { statusCode: 200, body: JSON.stringify({ ok: true, confirm: doubleOptIn }) };
  } catch (err) {
    console.error("Brevo signup failed:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Could not complete signup. Please try again." }) };
  }
}
