export type Product = {
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
};

export const products: Record<string, Product> = {
  pillar: {
    id: "pillar",
    name: "Pillar Table",
    tagline: "Statement base and generous top for entertaining at scale",
    description:
      "The Pillar Table features distinctive sculptured bases paired with a generous tabletop, designed for those who love to entertain. Its bold proportions make it a centrepiece in any dining space.",
    category: "Signature",
    size: "Large",
    features: [
      "Sculptured pedestal bases with exceptional stability",
      "Generous tabletop dimensions for large gatherings",
      "Available in multiple timber species",
      "Hand-finished with protective coating",
      "Seats 8–10 people comfortably",
    ],
    specifications: {
      "Dimensions Shown": "2400mm L × 1100mm W × 750mm H",
      "Seating Capacity": "8–10 people",
      "Top / Base Style": "Pill with bevelled edge / Cylindrical pedestals",
      "Timber / Finish Shown": "American Oak / Raw Matte",
    },
    images: {
      main: "/images/signature/pillar/level-design-pillar-american-oak-dining-table-main.webp",
      gallery: [
        "/images/signature/pillar/level-design-pillar-american-oak-dining-table-image-1.webp",
        "/images/signature/pillar/level-design-pillar-american-oak-dining-table-image-2.webp",
        "/images/signature/pillar/level-design-pillar-american-oak-dining-table-image-3.webp",
      ],
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
      "Dimensions Shown": "1400mm Diameter × 750mm H",
      "Seating Capacity": "4–6 people",
      "Top / Base Style": "Round with bevelled edge / Angled legs with cross support",
      "Timber / Finish Shown": "Tasmanian Oak / Clear Matte",
    },
    images: {
      main: "/images/signature/luna/level-design-luna-american-oak-dining-table-main.webp",
      gallery: [
        "/images/signature/luna/level-design-luna-american-oak-dining-table-image-1.webp",
        "/images/signature/luna/level-design-luna-american-oak-dining-table-image-2.webp",
        "/images/signature/luna/level-design-luna-american-oak-dining-table-image-3.webp",
      ],
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
      "Seats 10–12 people comfortably",
    ],
    specifications: {
      "Dimensions Shown": "3400mm L × 1100mm W × 750mm H",
      "Seating Capacity": "10–12 people",
      "Top / Base Style": "Rectangle with rounded corners and shark nose edge / Angled legs with centre stretch",
      "Timber / Finish Shown": "American Oak / Clear Matte",
    },
    images: {
      main: "/images/signature/yama/level-design-yama-american-oak-dining-table-main.webp",
      gallery: [
        "/images/signature/yama/level-design-yama-american-oak-dining-table-image-1.webp",
        "/images/signature/yama/level-design-yama-american-oak-dining-table-image-2.webp",
        "/images/signature/yama/level-design-yama-american-oak-dining-table-image-3.webp",
      ],
    },
  },
  venn: {
    id: "venn",
    name: "Venn Table",
    tagline: "Geometric precision with organic warmth",
    description:
      "The Venn Table is defined by its organic, free-form top — softened by natural timber grain and honest craftsmanship. A sculptural centrepiece that feels as natural as it does considered.",
    category: "Signature",
    size: "Medium",
    features: [
      "Sculptured pedestal bases with exceptional stability",
      "Generous organic shape top with soft, flowing edges",
      "Available in multiple timber species",
      "Hand-finished with protective coating",
      "Seats 8–10 people comfortably",
    ],
    specifications: {
      "Dimensions Shown": "2500mm L × 1400mm W × 750mm H",
      "Seating Capacity": "8–10 people",
      "Top / Base Style": "Organic with bevelled edge / Oval pedestals",
      "Timber / Finish Shown": "American Oak / Raw Matte",
    },
    images: {
      main: "/images/signature/venn/level-design-venn-american-oak-dining-table-image.webp",
      gallery: [
        "/images/signature/venn/level-design-venn-american-oak-dining-table-image-1.webp",
        "/images/signature/venn/level-design-venn-american-oak-dining-table-image-2.webp",
        "/images/signature/venn/level-design-venn-american-oak-dining-table-image-3.webp",
      ],
    },
  },
  cort: {
    id: "cort",
    name: "Cort Table",
    tagline: "Bold lines for statement dining spaces",
    description:
      "The Cort Table is designed to command attention. Strong, confident proportions pair with the natural beauty of hardwood finished in a rich black stain.",
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
      "Dimensions Shown": "2800mm L × 1200mm W × 750mm H",
      "Seating Capacity": "8–10 people",
      "Top / Base Style": "Rectangle with rounded corners and straight edge / Slatted pill pedestals",
      "Timber / Finish Shown": "American Ash / Black Satin",
    },
    images: {
      main: "/images/signature/cort/level-design-cort-american-oak-dining-table-main.webp",
      gallery: [
        "/images/signature/cort/level-design-cort-american-oak-dining-table-image-1.webp",
        "/images/signature/cort/level-design-cort-american-oak-dining-table-image-2.webp",
        "/images/signature/cort/level-design-cort-american-oak-dining-table-image-3.webp",
      ],
    },
  },
  morgan: {
    id: "morgan",
    name: "Morgan Table",
    tagline: "Clean lines, understated elegance",
    description:
      "The Morgan Table is built on restraint. Clean lines, considered proportions, and a no-fuss profile that sits quietly in any space — understated in the best possible way.",
    category: "Signature",
    size: "Medium",
    features: [
      "Clean lines and understated elegance in solid hardwood",
      "Designed for both everyday use and entertaining",
      "Available in multiple timber species",
      "Hand-finished with protective coating",
      "Seats 10–12 people comfortably",
    ],
    specifications: {
      "Dimensions Shown": "3000mm L × 1100mm W × 750mm H",
      "Seating Capacity": "10–12 people",
      "Top / Base Style": "Rectangle with straight edge / Triangle pedestals with rounded corners",
      "Timber / Finish Shown": "American Oak / Custom",
    },
    images: {
      main: "/images/signature/morgan/level-design-morgan-american-oak-dining-table-main.webp",
      gallery: [
        "/images/signature/morgan/level-design-morgan-american-oak-dining-table-image-1.webp",
        "/images/signature/morgan/level-design-morgan-american-oak-dining-table-image-2.webp",
        "/images/signature/morgan/level-design-morgan-american-oak-dining-table-image-3.webp",
      ],
    },
  },
  bruno: {
    id: "bruno",
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
      "Seats 10–12 people comfortably",
    ],
    specifications: {
      "Dimensions Shown": "3000mm L × 1200mm W × 750mm H",
      "Seating Capacity": "10–12 people",
      "Top / Base Style": "Rectangle with straight edge / Rectangle with shadow line",
      "Timber / Finish Shown": "American Oak / Black Wash",
    },
    images: {
      main: "/images/signature/bruno/level-design-bruno-american-oak-dining-table-main.webp",
      gallery: [
        "/images/signature/bruno/level-design-bruno-american-oak-dining-table-image-1.webp",
        "/images/signature/bruno/level-design-bruno-american-oak-dining-table-image-2.webp",
        "/images/signature/bruno/level-design-bruno-american-oak-dining-table-image-3.webp",
      ],
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
      "Dimensions Shown": "1400mm Diameter × 750mm H",
      "Seating Capacity": "4–6 people",
      "Top / Base Style": "Round with bevelled edge / 8 point star pedestal",
      "Timber / Finish Shown": "American Oak / Raw Matte",
    },
    images: {
      main: "/images/signature/helm/level-design-helm-american-oak-dining-table-main.webp",
      gallery: [
        "/images/signature/helm/level-design-helm-american-oak-dining-table-image-2.webp",
        "/images/signature/helm/level-design-helm-american-oak-dining-table-image-3.webp",
        "/images/signature/helm/level-design-helm-american-oak-dining-table-image-4.webp",
      ],
    },
  },
  nina: {
    id: "nina",
    name: "Nina Table",
    tagline: "Slim lines, lightweight look, timeless feel",
    description:
      "The Nina Table is all about proportion. Long, slim, and visually light — its classic silhouette brings an effortless elegance to any space without overwhelming it.",
    category: "Modern",
    size: "Small",
    features: [
      "Long, slim profile with a visually lightweight classic look",
      "Refined leg detail in solid hardwood",
      "Available in multiple timber species",
      "Hand-finished with protective coating",
      "Seats 10–12 people comfortably",
    ],
    specifications: {
      "Dimensions Shown": "3000mm L × 1200mm W × 750mm H",
      "Seating Capacity": "10–12 people",
      "Top / Base Style": "Rectangle with bevelled edge / Angled U shape",
      "Timber / Finish Shown": "American Oak / Black Wash",
    },
    images: {
      main: "/images/signature/nina/level-design-nina-american-oak-dining-table-main.webp",
      gallery: [
        "/images/signature/nina/level-design-nina-american-oak-dining-table-image-1.webp",
        "/images/signature/nina/level-design-nina-american-oak-dining-table-image-2.webp",
        "/images/signature/nina/level-design-nina-american-oak-dining-table-image-3.webp",
      ],
    },
  },
};

export const allProducts = Object.values(products);
