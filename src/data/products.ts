export type Product = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  size: string;
  features: string[];
  specifications: Record<string, string>;
};

export const products: Record<string, Product> = {
  pillar: {
    id: "pillar",
    name: "Pillar Table",
    tagline: "Statement base and generous top for entertaining at scale",
    description:
      "The Pillar Table features a distinctive sculptural base paired with a generous tabletop, designed for those who love to entertain. Its bold proportions make it a centrepiece in any dining space.",
    category: "Signature",
    size: "Large",
    features: [
      "Sculptural pedestal base with exceptional stability",
      "Generous tabletop dimensions for large gatherings",
      "Available in multiple timber species",
      "Hand-finished with protective coating",
      "Seats 8–10 people comfortably",
    ],
    specifications: {
      "Standard Dimensions": "2400mm L × 1100mm W × 750mm H",
      "Seating Capacity": "8–10 people",
      "Base Style": "Central pedestal with four supports",
      "Timber Options": "Blackbutt, Spotted Gum, Victorian Ash, American Oak",
      "Lead Time": "8–10 weeks",
    },
  },
  luna: {
    id: "luna",
    name: "Luna Table",
    tagline: "Contemporary elegance for modern homes",
    description:
      "The Luna Table combines elegant curves with modern functionality, creating a sophisticated centrepiece for contemporary dining spaces. Its refined design adds warmth and character to any room.",
    category: "Contemporary",
    size: "Small",
    features: [
      "Elegant round tabletop with distinctive angled legs",
      "Perfect for intimate gatherings and daily use",
      "Available in premium timber finishes",
      "Hand-finished with protective coating",
      "Seats 4–6 people comfortably",
    ],
    specifications: {
      "Standard Dimensions": "1200mm Diameter × 750mm H",
      "Seating Capacity": "4–6 people",
      "Base Style": "Angled leg design with cross support",
      "Timber Options": "American Oak, Victorian Ash, Walnut",
      "Lead Time": "8–10 weeks",
    },
  },
  yama: {
    id: "yama",
    name: "Yama Table",
    tagline: "Clean lines with natural warmth",
    description:
      "The Yama Table embodies minimalist design principles with its clean lines and natural timber warmth. Perfect for open-plan living spaces, this versatile table brings understated elegance to modern homes.",
    category: "Modern",
    size: "Medium",
    features: [
      "Long rectangular design ideal for large gatherings",
      "Simple, sturdy leg construction with timeless appeal",
      "Natural timber showcasing beautiful grain patterns",
      "Hand-finished with protective coating",
      "Seats 8–12 people comfortably",
    ],
    specifications: {
      "Standard Dimensions": "3000mm L × 1100mm W × 750mm H",
      "Seating Capacity": "8–12 people",
      "Base Style": "Four solid timber legs",
      "Timber Options": "American Oak, Victorian Ash, Spotted Gum, Blackbutt",
      "Lead Time": "8–10 weeks",
    },
  },
  morgan: {
    id: "morgan",
    name: "Morgan Table",
    tagline: "Elegant curves meet modern functionality",
    description:
      "The Morgan Table brings together flowing form and practical build. A favourite for open-plan dining rooms that want character without clutter.",
    category: "Signature",
    size: "Medium",
    features: [
      "Flowing, organic silhouette in solid Australian hardwood",
      "Designed for both everyday use and entertaining",
      "Available in multiple timber species",
      "Hand-finished with protective coating",
      "Seats 6–8 people comfortably",
    ],
    specifications: {
      "Standard Dimensions": "2200mm L × 1000mm W × 750mm H",
      "Seating Capacity": "6–8 people",
      "Base Style": "Tapered solid timber legs",
      "Timber Options": "Blackbutt, Spotted Gum, Victorian Ash",
      "Lead Time": "8–10 weeks",
    },
  },
  venn: {
    id: "venn",
    name: "Venn Table",
    tagline: "Geometric precision with organic warmth",
    description:
      "The Venn Table takes its cues from geometry — clean angles softened by honest timber grain. A grounding presence in any dining room.",
    category: "Signature",
    size: "Medium",
    features: [
      "Angular base with refined joinery detail",
      "Generous rectangular top",
      "Available in multiple timber species",
      "Hand-finished with protective coating",
      "Seats 6–8 people comfortably",
    ],
    specifications: {
      "Standard Dimensions": "2200mm L × 1000mm W × 750mm H",
      "Seating Capacity": "6–8 people",
      "Base Style": "Angular trestle base",
      "Timber Options": "American Oak, Blackbutt, Victorian Ash",
      "Lead Time": "8–10 weeks",
    },
  },
  port: {
    id: "port",
    name: "Cort Table",
    tagline: "Bold lines for statement dining spaces",
    description:
      "The Cort Table is designed to command attention. Strong, confident proportions pair with the natural beauty of Australian hardwood.",
    category: "Contemporary",
    size: "Large",
    features: [
      "Bold, architectural leg detail",
      "Extra-wide top for generous setting",
      "Available in multiple timber species",
      "Hand-finished with protective coating",
      "Seats 8–10 people comfortably",
    ],
    specifications: {
      "Standard Dimensions": "2600mm L × 1100mm W × 750mm H",
      "Seating Capacity": "8–10 people",
      "Base Style": "Slab trestle with through-tenon detail",
      "Timber Options": "Spotted Gum, Blackbutt, Victorian Ash",
      "Lead Time": "10–12 weeks",
    },
  },
  helm: {
    id: "helm",
    name: "Helm Table",
    tagline: "Round elegance for intimate gatherings",
    description:
      "The Helm Table is a round dining table built for connection. Its circular top encourages easy conversation; its solid base anchors the room.",
    category: "Contemporary",
    size: "Medium",
    features: [
      "Generous round top — no head of table",
      "Central pedestal base for leg room",
      "Available in multiple timber species",
      "Hand-finished with protective coating",
      "Seats 4–6 people comfortably",
    ],
    specifications: {
      "Standard Dimensions": "1400mm Diameter × 750mm H",
      "Seating Capacity": "4–6 people",
      "Base Style": "Solid pedestal with cross feet",
      "Timber Options": "American Oak, Victorian Ash, Walnut",
      "Lead Time": "8–10 weeks",
    },
  },
  breno: {
    id: "breno",
    name: "Bruno Table",
    tagline: "Minimalist design with maximum impact",
    description:
      "The Bruno Table strips everything back. Clean lines, considered joinery, and a profile that works in almost any interior.",
    category: "Modern",
    size: "Large",
    features: [
      "Pared-back design with no unnecessary detail",
      "Strong, simple leg construction",
      "Available in multiple timber species",
      "Hand-finished with protective coating",
      "Seats 8–10 people comfortably",
    ],
    specifications: {
      "Standard Dimensions": "2400mm L × 1000mm W × 750mm H",
      "Seating Capacity": "8–10 people",
      "Base Style": "Box section legs with apron",
      "Timber Options": "Blackbutt, American Oak, Spotted Gum",
      "Lead Time": "8–10 weeks",
    },
  },
  nina: {
    id: "nina",
    name: "Nina Table",
    tagline: "Compact design, big on style",
    description:
      "The Nina Table proves that smaller tables deserve the same care as their larger counterparts. Refined proportions for apartments and compact dining rooms.",
    category: "Modern",
    size: "Small",
    features: [
      "Compact footprint — ideal for smaller spaces",
      "Refined leg detail in solid hardwood",
      "Available in multiple timber species",
      "Hand-finished with protective coating",
      "Seats 2–4 people comfortably",
    ],
    specifications: {
      "Standard Dimensions": "1400mm L × 800mm W × 750mm H",
      "Seating Capacity": "2–4 people",
      "Base Style": "Slender tapered legs",
      "Timber Options": "American Oak, Victorian Ash, Walnut",
      "Lead Time": "6–8 weeks",
    },
  },
};

export const allProducts = Object.values(products);
