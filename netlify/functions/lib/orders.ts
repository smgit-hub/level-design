import { connectLambda, getStore } from "@netlify/blobs";

/**
 * Which order emails have already gone out, per Checkout session, kept in Netlify Blobs. Stripe sometimes delivers the same
 * event twice, and retries when a call times out after the first email has been sent, so the webhook checks here before
 * sending each email and records it once sent. If the store can't be reached the email is sent anyway: a duplicate is
 * better than a lost order.
 */
export type OrderEmailsSent = { owner?: boolean; customer?: boolean };

type LambdaEvent = Parameters<typeof connectLambda>[0];

export function orderEmailStore(event: unknown) {
  connectLambda(event as LambdaEvent);
  const store = getStore("order-emails");
  return {
    async get(sessionId: string): Promise<OrderEmailsSent> {
      try {
        return ((await store.get(sessionId, { type: "json" })) as OrderEmailsSent | null) ?? {};
      } catch (err) {
        console.error("order-emails: could not read", sessionId, err);
        return {};
      }
    },
    async set(sessionId: string, sent: OrderEmailsSent) {
      try {
        await store.setJSON(sessionId, sent);
      } catch (err) {
        console.error("order-emails: could not record", sessionId, err);
      }
    },
  };
}
