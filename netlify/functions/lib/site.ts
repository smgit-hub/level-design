/**
 * The site's own address, for links we hand to Stripe (where to go after paying, the Terms link) and for the link in the
 * quote-request email. Requests say which site they came from in their Origin header, so links match the site the customer
 * was on (the live site or a preview), but that header can be forged by anyone calling the function directly. So only our
 * own domain and this deploy's own Netlify addresses are trusted; anything else falls back to the site's configured address.
 *
 * Netlify sets URL (the main address), DEPLOY_PRIME_URL (the branch or preview address) and DEPLOY_URL (this exact deploy).
 */
const OWN_HOSTS = ["leveldesign.com.au", "www.leveldesign.com.au"];

function hostOf(value: string | undefined) {
  try {
    return value ? new URL(value).hostname : null;
  } catch {
    return null;
  }
}

export function siteOrigin(headers: Record<string, string | undefined>) {
  const fallback = process.env.DEPLOY_PRIME_URL || process.env.URL || "https://leveldesign.com.au";
  const trustedHosts = new Set([...OWN_HOSTS, hostOf(process.env.URL), hostOf(process.env.DEPLOY_PRIME_URL), hostOf(process.env.DEPLOY_URL)].filter(Boolean));
  try {
    const url = new URL(headers.origin || headers.Origin || "");
    if (url.protocol === "https:" && trustedHosts.has(url.hostname)) return url.origin;
  } catch {
    /* no usable origin header */
  }
  return fallback;
}
