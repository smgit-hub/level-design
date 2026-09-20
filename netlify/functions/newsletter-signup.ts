export async function handler(event: { httpMethod: string; body: string | null }) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "Newsletter signup is not configured." }) };
  }

  let email: string | undefined;
  try {
    ({ email } = JSON.parse(event.body || "{}"));
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid request body." }) };
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || typeof email !== "string" || !emailPattern.test(email)) {
    return { statusCode: 400, body: JSON.stringify({ error: "Please enter a valid email address." }) };
  }

  // Set in Netlify's dashboard once the Brevo list exists — safe to leave unset
  // (contact is still created, just not added to a specific list).
  const listId = process.env.BREVO_LIST_ID;

  try {
    const response = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
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

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error("Brevo signup failed:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Could not complete signup. Please try again." }) };
  }
}
