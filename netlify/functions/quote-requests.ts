import { isRequestId, json, requestStore, sameSecret, type QuoteRequest } from "./lib/quote-requests";

/**
 * Private, for /admin/quote/: look at delivery quote requests (one by id, or the open ones) and mark them done.
 * Needs QUOTE_ADMIN_KEY, the passphrase typed on the page.
 */

export async function handler(event: { httpMethod: string; body: string | null; headers: Record<string, string | undefined> }) {
  if (event.httpMethod !== "POST") return json(405, { error: "Method Not Allowed" });

  const adminKey = process.env.QUOTE_ADMIN_KEY;
  if (!adminKey) return json(500, { error: "The quote tool is not configured." });

  let input: { key?: string; action?: string; id?: string; status?: string };
  try {
    input = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Invalid request." });
  }

  if (!input.key || !sameSecret(String(input.key), adminKey)) {
    await new Promise((resolve) => setTimeout(resolve, 800)); // slows down guessing
    return json(401, { error: "Wrong passphrase." });
  }

  const store = requestStore(event);

  try {
    if (input.action === "list") {
      const { blobs } = await store.list({ prefix: "req/" });
      const all = (await Promise.all(blobs.map((b) => store.get(b.key, { type: "json" }).catch(() => null)))) as (QuoteRequest | null)[];
      const open = all
        .filter((r): r is QuoteRequest => !!r && r.status !== "done")
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 50);
      return json(200, { requests: open });
    }

    if (!isRequestId(input.id)) return json(400, { error: "Unknown request." });
    const key = `req/${input.id}`;
    const request = (await store.get(key, { type: "json" })) as QuoteRequest | null;
    if (!request) return json(404, { error: "That request wasn't found. It may have been removed." });

    if (input.action === "get") return json(200, { request });

    if (input.action === "mark") {
      if (input.status !== "new" && input.status !== "quoted" && input.status !== "done") return json(400, { error: "Unknown status." });
      await store.setJSON(key, { ...request, status: input.status });
      return json(200, { request: { ...request, status: input.status } });
    }

    return json(400, { error: "Unknown action." });
  } catch (err) {
    console.error("quote-requests failed:", err);
    return json(500, { error: "Could not reach the request store." });
  }
}
