/**
 * Delivery for Studio Collection orders, decided from the delivery postcode. Melbourne Metro, the Mornington Peninsula and the Bass Coast
 * share one set fee; everywhere else is quoted individually.
 *
 * Used by the product page (to show the fee before checkout), by the checkout function (which sets the fee itself, so a
 * buyer can't pick a cheaper rate than their address allows) and by the order-email webhook (which flags it if the
 * address typed at checkout falls in a different zone). The postcode lists below are approximate suburb ranges —
 * edit them here and everything follows.
 */

export type DeliveryZone = "melbourne" | "quote";

export type DeliveryOption = {
  zone: DeliveryZone;
  /** AUD cents; null when delivery is quoted individually instead of sold at a fixed fee. */
  priceCents: number | null;
  /** Name shown on the product page, in Stripe Checkout and in the order emails. */
  label: string;
  /** True while the launch offer makes delivery free (priceCents is then 0 and the normal fee is MELBOURNE_DELIVERY_CENTS). */
  free: boolean;
};

export const MELBOURNE_DELIVERY_CENTS = 19900;

/**
 * Launch offer: delivery in the one fixed-fee area is free through the end of 15 November 2026, Melbourne time (AEDT, UTC+11). It
 * switches itself off after that: the product page and the checkout function both ask `freeDeliveryActive()`, so the fee goes back to
 * $199 with no change needed. Quoted areas are not part of the offer. To end it early or move the date, edit the date below.
 */
export const FREE_DELIVERY_UNTIL_TEXT = "15 November";
const FREE_DELIVERY_ENDS_AT = Date.parse("2026-11-15T23:59:59+11:00");
export const freeDeliveryActive = (now: number = Date.now()) => now <= FREE_DELIVERY_ENDS_AT;

const MELBOURNE_METRO_NAME = "Melbourne Metro, Peninsula & Bass Coast Delivery";

type Range = readonly [number, number];

/** Greater Melbourne, including the outer growth areas, Sunbury, Melton, the Dandenongs and the Mornington Peninsula as far as Frankston, Hastings and Langwarrin. */
const MELBOURNE_METRO: Range[] = [
  [3000, 3207],
  [3335, 3341],
  [3427, 3429],
  [3750, 3811],
  [3910, 3920],
  [3926, 3944], // Mornington Peninsula: Balnarring, Flinders, Mt Eliza, Mornington, Red Hill, Rosebud, Rye, Sorrento, Portsea
  [3975, 3978],
];

/** The Bass Coast: Phillip Island (Cowes, Rhyll, Newhaven), San Remo, Corinella and Grantville, Bass, Dalyston, Wonthaggi, Kilcunda, Inverloch, Cape Paterson and Glen Alvie. We work there, so it is priced like Melbourne Metro. */
const BASS_COAST: Range[] = [
  [3922, 3925],
  [3979, 3979],
  [3984, 3984],
  [3991, 3992],
  [3995, 3996],
];

const inRanges = (n: number, ranges: Range[]) => ranges.some(([from, to]) => n >= from && n <= to);

export const isValidPostcode = (value: string) => /^\d{4}$/.test(value.trim());

/** Everywhere not covered above — Geelong and the rest of regional Victoria, interstate, and so on — is quoted individually. */
export function deliveryForPostcode(postcode: string, now: number = Date.now()): DeliveryOption | null {
  if (!isValidPostcode(postcode)) return null;
  const n = Number(postcode.trim());
  if (inRanges(n, MELBOURNE_METRO) || inRanges(n, BASS_COAST)) {
    if (freeDeliveryActive(now)) return { zone: "melbourne", priceCents: 0, label: `Free delivery, launch offer until ${FREE_DELIVERY_UNTIL_TEXT}`, free: true };
    return { zone: "melbourne", priceCents: MELBOURNE_DELIVERY_CENTS, label: MELBOURNE_METRO_NAME, free: false };
  }
  return { zone: "quote", priceCents: null, label: "Delivery quoted individually", free: false };
}
