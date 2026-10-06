export type StudioSizeVariant = {
  /** Used as the URL/session param and Stripe lookup key — e.g. "2000x900". */
  id: string;
  /** Tabletop length in mm (the diameter for a round table) — drives the to-scale outline on the product page. */
  lengthMm: number;
  /** Tabletop width in mm (the diameter for a round table). */
  widthMm: number;
  /** Chairs drawn around the outline — the bottom of the `seating` range — a comfortable layout; the range in the copy is the squeezed-in maximum. */
  chairs: number;
  /** Short label shown in the size selector — e.g. "2000mm × 900mm". */
  label: string;
  /** Full dimensions string shown in the specifications table. */
  dimensions: string;
  seating: string;
  /** AUD, in cents — required so a size can never ship without a price. This is always the current charged amount and must match the live Stripe Price. */
  price: number;
  /**
   * AUD, in cents — optional "was" price shown struck through next to `price` to run a
   * sale (e.g. Black Friday, EOFY, Christmas). Leave unset outside of a sale window.
   * To run a sale: set this to the current regular price, drop `price` to the sale
   * amount, and point `stripePriceId` at a Stripe Price object for that sale amount
   * (Stripe Prices are immutable, so the sale needs its own Price object). Revert both
   * — and switch `stripePriceId` back — once the sale ends.
   */
  compareAtPrice?: number;
  /** Stripe Price ID for this size, managed in the Stripe dashboard. */
  stripePriceId: string;
};

export type StudioProduct = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  /** Two-word shape cue shown on cards, so four similar oak tables are easy to tell apart. */
  shape: string;
  /** Top-down outline drawn on the product page: rectangle (with a corner radius in mm), pill, or round. */
  outline: { kind: "rect"; cornerRadiusMm: number } | { kind: "pill" } | { kind: "round" };
  features: string[];
  /** Facts that don't vary by size — dimensions/seating live on each entry in `sizes` instead. */
  specifications: Record<string, string>;
  images: {
    main: string;
    gallery: string[];
  };
  /** Every size this table is offered in, smallest first. */
  sizes: StudioSizeVariant[];
  /** Path to the .glb model used by the rotate-viewer — one model shared across sizes, made at the largest size and not scaled per size. */
  model: string;
};

export const startingPrice = (product: StudioProduct) => Math.min(...product.sizes.map((s) => s.price));

// TODO(sean): every `price`, `stripePriceId`, and image/model path below is a
// placeholder. Replace with real values before this range goes live — see
// the plan file for what's needed.
export const studioProducts: Record<string, StudioProduct> = {
  line: {
    id: "line",
    name: "Line Table",
    tagline: "Crisp, straight-edged proportions for everyday dining",
    description:
      "The Line Table pairs a sharp-cornered rectangular top with clean lines — a straightforward, made-to-order design for everyday dining spaces.",
    category: "Studio",
    shape: "Straight-edged",
    outline: { kind: "rect", cornerRadiusMm: 40 },
    features: [
      "Rectangular top with a small corner radius",
      "Real oak veneer top, solid oak wherever it bears weight — built to last, not to be replaced",
      "View and rotate in 3D before you buy",
      "Three fixed sizes, ready to order online",
      "6–8 week lead time, faster than a bespoke commission",
    ],
    specifications: {
      "Top / Base Style": "Rectangle with small corner radius / Straight legs",
      "Construction": "Mix of oak veneer and solid oak",
    },
    images: {
      main: "/images/studio/line/level-design-line-studio-dining-table-main.webp",
      gallery: ["/images/studio/line/level-design-line-studio-dining-table-lifestyle.webp"],
    },
    sizes: [
      {
        id: "1600x850",
        lengthMm: 1600,
        widthMm: 850,
        chairs: 4,
        label: "1600mm × 850mm",
        dimensions: "1600mm L × 850mm W × 750mm H",
        seating: "4–6 people",
        price: 199900,
        stripePriceId: "price_REPLACE_ME_line_1600x850",
      },
      {
        id: "2000x1000",
        lengthMm: 2000,
        widthMm: 1000,
        chairs: 6,
        label: "2000mm × 1000mm",
        dimensions: "2000mm L × 1000mm W × 750mm H",
        seating: "6–8 people",
        price: 229900,
        stripePriceId: "price_REPLACE_ME_line_2000x1000",
      },
      {
        id: "2350x1150",
        lengthMm: 2350,
        widthMm: 1150,
        chairs: 8,
        label: "2350mm × 1150mm",
        dimensions: "2350mm L × 1150mm W × 750mm H",
        seating: "8–10 people",
        price: 289900,
        stripePriceId: "price_REPLACE_ME_line_2350x1150",
      },
    ],
    model: "/models/studio/line.glb",
  },
  curve: {
    id: "curve",
    name: "Curve Table",
    tagline: "The same clean rectangle, softened at every corner",
    description:
      "The Curve Table takes the same rectangular footprint as Line and softens every corner with a large radius — a warmer profile for open-plan living.",
    category: "Studio",
    shape: "Soft corners",
    outline: { kind: "rect", cornerRadiusMm: 250 },
    features: [
      "Rectangular top with a large corner radius",
      "Real oak veneer top, solid oak wherever it bears weight — built to last, not to be replaced",
      "View and rotate in 3D before you buy",
      "Two fixed sizes, ready to order online",
      "6–8 week lead time, faster than a bespoke commission",
    ],
    specifications: {
      "Top / Base Style": "Rectangle with large corner radius / Straight legs",
      "Construction": "Mix of oak veneer and solid oak",
    },
    images: {
      main: "/images/studio/curve/level-design-curve-studio-dining-table-main.webp",
      gallery: ["/images/studio/curve/level-design-curve-studio-dining-table-lifestyle.webp"],
    },
    sizes: [
      {
        id: "2000x1000",
        lengthMm: 2000,
        widthMm: 1000,
        chairs: 6,
        label: "2000mm × 1000mm",
        dimensions: "2000mm L × 1000mm W × 750mm H",
        seating: "6–8 people",
        price: 229900,
        stripePriceId: "price_REPLACE_ME_curve_2000x1000",
      },
      {
        id: "2350x1150",
        lengthMm: 2350,
        widthMm: 1150,
        chairs: 8,
        label: "2350mm × 1150mm",
        dimensions: "2350mm L × 1150mm W × 750mm H",
        seating: "8–10 people",
        price: 289900,
        stripePriceId: "price_REPLACE_ME_curve_2350x1150",
      },
    ],
    model: "/models/studio/curve.glb",
  },
  pill: {
    id: "pill",
    name: "Pill Table",
    tagline: "Stadium-shaped top for easy conversation across the table",
    description:
      "The Pill Table's stadium-shaped top — straight sides, fully rounded ends — keeps the seating generous while softening the whole silhouette.",
    category: "Studio",
    shape: "Pill shape",
    outline: { kind: "pill" },
    features: [
      "Pill-shaped top with fully rounded ends",
      "Real oak veneer top, solid oak wherever it bears weight — built to last, not to be replaced",
      "View and rotate in 3D before you buy",
      "Two fixed sizes, ready to order online",
      "6–8 week lead time, faster than a bespoke commission",
    ],
    specifications: {
      "Top / Base Style": "Pill shape / Straight legs",
      "Construction": "Mix of oak veneer and solid oak",
    },
    images: {
      main: "/images/studio/pill/level-design-pill-studio-dining-table-main.webp",
      gallery: ["/images/studio/pill/level-design-pill-studio-dining-table-lifestyle.webp"],
    },
    sizes: [
      {
        id: "2000x1000",
        lengthMm: 2000,
        widthMm: 1000,
        chairs: 6,
        label: "2000mm × 1000mm",
        dimensions: "2000mm L × 1000mm W × 750mm H",
        seating: "6–8 people",
        price: 249900,
        stripePriceId: "price_REPLACE_ME_pill_2000x1000",
      },
      {
        id: "2350x1150",
        lengthMm: 2350,
        widthMm: 1150,
        chairs: 8,
        label: "2350mm × 1150mm",
        dimensions: "2350mm L × 1150mm W × 750mm H",
        seating: "8–10 people",
        price: 309900,
        stripePriceId: "price_REPLACE_ME_pill_2350x1150",
      },
    ],
    model: "/models/studio/pill.glb",
  },
  round: {
    id: "round",
    name: "Round Table",
    tagline: "A generous round top built for intimate, no-head-of-table dining",
    description:
      "The Round Table brings the same design standard to a circular top — an easy fit for smaller dining spaces and everyday conversation.",
    category: "Studio",
    shape: "Round",
    outline: { kind: "round" },
    features: [
      "Round top, no head of table",
      "Real oak veneer top, solid oak wherever it bears weight — built to last, not to be replaced",
      "View and rotate in 3D before you buy",
      "Two fixed sizes, ready to order online",
      "6–8 week lead time, faster than a bespoke commission",
    ],
    specifications: {
      "Top / Base Style": "Round / Central pedestal",
      "Construction": "Mix of oak veneer and solid oak",
    },
    images: {
      main: "/images/studio/round/level-design-round-studio-dining-table-main.webp",
      gallery: ["/images/studio/round/level-design-round-studio-dining-table-lifestyle.webp"],
    },
    sizes: [
      {
        id: "1200",
        lengthMm: 1200,
        widthMm: 1200,
        chairs: 4,
        label: "1200mm Diameter",
        dimensions: "1200mm Diameter × 750mm H",
        seating: "4–5 people",
        price: 209900,
        stripePriceId: "price_REPLACE_ME_round_1200",
      },
      {
        id: "1500",
        lengthMm: 1500,
        widthMm: 1500,
        chairs: 6,
        label: "1500mm Diameter",
        dimensions: "1500mm Diameter × 750mm H",
        seating: "6–8 people",
        price: 279900,
        stripePriceId: "price_REPLACE_ME_round_1500",
      },
    ],
    model: "/models/studio/round.glb",
  },
};

export const allStudioProducts = Object.values(studioProducts);
