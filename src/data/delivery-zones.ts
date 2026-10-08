/**
 * Delivery for Studio Collection orders, decided from the delivery postcode.
 *
 * Used by the product page (to show the fee before checkout), by the checkout function (which sets the fee itself, so a
 * buyer can't pick a cheaper rate than their address allows) and by the order-email webhook (which flags it if the
 * address typed at checkout falls in a different zone). The postcode lists below are approximate suburb ranges —
 * edit them here and everything follows.
 */

export type DeliveryZone = "melbourne" | "standard" | "quote";

export type DeliveryOption = {
  zone: DeliveryZone;
  /** AUD cents; null when delivery is quoted individually instead of sold at a fixed fee. */
  priceCents: number | null;
  /** Name shown on the product page, in Stripe Checkout and in the order emails. */
  label: string;
};

export const MELBOURNE_DELIVERY_CENTS = 19900;
export const STANDARD_DELIVERY_CENTS = 44900;

const MELBOURNE_METRO_NAME = "Melbourne Metro Delivery";
const STANDARD_NAME = "Brisbane, Sydney, Canberra, Adelaide & Regional VIC Delivery";

type Range = readonly [number, number];

/** Greater Melbourne, including the outer growth areas, Sunbury, Melton, the Dandenongs and the Mornington Peninsula edge. */
const MELBOURNE_METRO: Range[] = [
  [3000, 3207],
  [3335, 3341],
  [3427, 3429],
  [3750, 3811],
  [3910, 3920],
  [3975, 3978],
];

/** The rest of Victoria (everything else in the 3000s, plus the 8000s PO box range). */
const VICTORIA: Range[] = [
  [3000, 3999],
  [8000, 8999],
];

/** The other east-coast and South Australian capitals we deliver to at the standard fee. */
const OTHER_CAPITALS: Range[] = [
  [2000, 2234], // Sydney
  [2555, 2574],
  [2745, 2770],
  [2600, 2620], // Canberra
  [2900, 2914],
  [4000, 4179], // Brisbane
  [4300, 4305],
  [4500, 4521],
  [5000, 5199], // Adelaide
];

const inRanges = (n: number, ranges: Range[]) => ranges.some(([from, to]) => n >= from && n <= to);

export const isValidPostcode = (value: string) => /^\d{4}$/.test(value.trim());

/** Everywhere not covered above — Perth, Hobart, Darwin, Tasmania, regional NSW/QLD/SA and so on — is quoted individually. */
export function deliveryForPostcode(postcode: string): DeliveryOption | null {
  if (!isValidPostcode(postcode)) return null;
  const n = Number(postcode.trim());
  if (inRanges(n, MELBOURNE_METRO)) return { zone: "melbourne", priceCents: MELBOURNE_DELIVERY_CENTS, label: MELBOURNE_METRO_NAME };
  if (inRanges(n, VICTORIA) || inRanges(n, OTHER_CAPITALS)) return { zone: "standard", priceCents: STANDARD_DELIVERY_CENTS, label: STANDARD_NAME };
  return { zone: "quote", priceCents: null, label: "Delivery quoted individually" };
}
