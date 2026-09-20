export type StudioProduct = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  size: string;
  features: string[];
  specifications: Record<string, string>;
  images: {
    main: string;
    gallery: string[];
  };
  /** AUD, in cents — required so a table can never ship without a price. */
  price: number;
  /** Stripe Price ID for this table, managed in the Stripe dashboard. */
  stripePriceId: string;
  /** Path to the .glb model used by the rotate-viewer. */
  model: string;
};

// TODO(sean): every `price`, `stripePriceId`, and image/model path below is a
// placeholder. Replace with real values before this range goes live — see
// the plan file for what's needed.
export const studioProducts: Record<string, StudioProduct> = {
  line: {
    id: "line",
    name: "Line Table",
    tagline: "Crisp, straight-edged proportions for everyday dining",
    description:
      "The Line Table pairs a sharp-cornered rectangular top with clean, engineered construction — a straightforward, fixed-price design for everyday dining spaces.",
    category: "Studio",
    size: "Medium",
    features: [
      "Rectangular top with a small corner radius",
      "Engineered oak veneer top over a stable substrate",
      "Solid timber legs for load-bearing strength",
      "Fixed dimensions, ready to order",
      "Seats 6–8 people comfortably",
    ],
    specifications: {
      "Dimensions": "2100mm L × 950mm W × 750mm H",
      "Seating Capacity": "6–8 people",
      "Top / Base Style": "Rectangle with small corner radius / Straight legs",
      "Construction": "Oak veneer top, solid oak legs",
    },
    images: {
      main: "/images/studio/line/level-design-line-studio-dining-table-main.webp",
      gallery: [
        "/images/studio/line/level-design-line-studio-dining-table-image-1.webp",
        "/images/studio/line/level-design-line-studio-dining-table-image-2.webp",
      ],
    },
    price: 129900,
    stripePriceId: "price_REPLACE_ME_line",
    model: "/models/studio/line.glb",
  },
  curve: {
    id: "curve",
    name: "Curve Table",
    tagline: "The same clean rectangle, softened at every corner",
    description:
      "The Curve Table takes the same rectangular footprint as Line and softens every corner with a large radius — a warmer profile for open-plan living.",
    category: "Studio",
    size: "Medium",
    features: [
      "Rectangular top with a large corner radius",
      "Engineered oak veneer top over a stable substrate",
      "Solid timber legs for load-bearing strength",
      "Fixed dimensions, ready to order",
      "Seats 6–8 people comfortably",
    ],
    specifications: {
      "Dimensions": "2100mm L × 950mm W × 750mm H",
      "Seating Capacity": "6–8 people",
      "Top / Base Style": "Rectangle with large corner radius / Straight legs",
      "Construction": "Oak veneer top, solid oak legs",
    },
    images: {
      main: "/images/studio/curve/level-design-curve-studio-dining-table-main.webp",
      gallery: [
        "/images/studio/curve/level-design-curve-studio-dining-table-image-1.webp",
        "/images/studio/curve/level-design-curve-studio-dining-table-image-2.webp",
      ],
    },
    price: 129900,
    stripePriceId: "price_REPLACE_ME_curve",
    model: "/models/studio/curve.glb",
  },
  pill: {
    id: "pill",
    name: "Pill Table",
    tagline: "Stadium-shaped top for easy conversation across the table",
    description:
      "The Pill Table's stadium-shaped top — straight sides, fully rounded ends — keeps the seating generous while softening the whole silhouette.",
    category: "Studio",
    size: "Medium",
    features: [
      "Pill-shaped top with fully rounded ends",
      "Engineered oak veneer top over a stable substrate",
      "Solid timber legs for load-bearing strength",
      "Fixed dimensions, ready to order",
      "Seats 6–8 people comfortably",
    ],
    specifications: {
      "Dimensions": "2000mm L × 1000mm W × 750mm H",
      "Seating Capacity": "6–8 people",
      "Top / Base Style": "Pill shape / Straight legs",
      "Construction": "Oak veneer top, solid oak legs",
    },
    images: {
      main: "/images/studio/pill/level-design-pill-studio-dining-table-main.webp",
      gallery: [
        "/images/studio/pill/level-design-pill-studio-dining-table-image-1.webp",
        "/images/studio/pill/level-design-pill-studio-dining-table-image-2.webp",
      ],
    },
    price: 139900,
    stripePriceId: "price_REPLACE_ME_pill",
    model: "/models/studio/pill.glb",
  },
  round: {
    id: "round",
    name: "Round Table",
    tagline: "A generous round top built for intimate, no-head-of-table dining",
    description:
      "The Round Table brings the same engineered veneer construction to a circular top — an easy fit for smaller dining spaces and everyday conversation.",
    category: "Studio",
    size: "Small",
    features: [
      "Round top, no head of table",
      "Engineered oak veneer top over a stable substrate",
      "Solid timber central pedestal base",
      "Fixed dimensions, ready to order",
      "Seats 4–6 people comfortably",
    ],
    specifications: {
      "Dimensions": "1300mm Diameter × 750mm H",
      "Seating Capacity": "4–6 people",
      "Top / Base Style": "Round / Central pedestal",
      "Construction": "Oak veneer top, solid oak base",
    },
    images: {
      main: "/images/studio/round/level-design-round-studio-dining-table-main.webp",
      gallery: [
        "/images/studio/round/level-design-round-studio-dining-table-image-1.webp",
        "/images/studio/round/level-design-round-studio-dining-table-image-2.webp",
      ],
    },
    price: 109900,
    stripePriceId: "price_REPLACE_ME_round",
    model: "/models/studio/round.glb",
  },
};

export const allStudioProducts = Object.values(studioProducts);
