export type ClientPiece = {
  /** Optimised .glb in public/models/clients/<slug>/. */
  model: string;
  /** Heading for this piece. Defaults to "Piece 1", "Piece 2"… when left out; a project with a single unnamed piece shows no piece heading. */
  name?: string;
  /** Shown as label/value rows under the viewer, e.g. { "Timber": "American Oak", "Finish": "Raw Matte", "Size": "2400mm × 1100mm" }. */
  details?: Record<string, string>;
  /** Dimension drawing shown under the details, e.g. an SVG exported from the PDF with `pdftocairo -svg`. */
  drawing?: string;
  /** PDF of the drawing, offered as a download. */
  drawingPdf?: string;
};

export type ClientProject = {
  /** Becomes the URL (/clients/<slug>/). Include a random suffix — it's the only thing keeping the page unlisted. */
  slug: string;
  clientName: string;
  /** Page heading. Defaults to "Your Proposed Designs". */
  heading?: string;
  pieces: ClientPiece[];
};

export const clientProjects: ClientProject[] = [
  {
    slug: "nadine-af535bfe",
    clientName: "Nadine",
    pieces: [
      {
        name: "Sideboard",
        model: "/models/clients/nadine-af535bfe/sideboard-v5.glb",
        drawing: "/models/clients/nadine-af535bfe/sideboard-drawing.svg",
        drawingPdf: "/models/clients/nadine-af535bfe/sideboard-drawing.pdf",
        details: { Timber: "American Oak", Finish: "Clear Matte" },
      },
      {
        name: "Bedside Table",
        model: "/models/clients/nadine-af535bfe/bedside-v5.glb",
        drawing: "/models/clients/nadine-af535bfe/bedside-drawing-v4.svg",
        drawingPdf: "/models/clients/nadine-af535bfe/bedside-drawing-v4.pdf",
        details: { Timber: "American Oak", Finish: "Clear Matte" },
      },
    ],
  },
  {
    slug: "meusz-interiors-2ba801e3",
    clientName: "Meusz Interiors",
    heading: "Gilbert Table",
    pieces: [
      {
        model: "/models/clients/meusz-interiors-2ba801e3/gilbert.glb",
        drawing: "/models/clients/meusz-interiors-2ba801e3/gilbert-drawing-v3.svg",
        drawingPdf: "/models/clients/meusz-interiors-2ba801e3/gilbert-drawing-v3.pdf",
        details: {
          Timber: "American Oak",
          Finish: "Clear natural matte hard wax oil",
          "End overhang": "400mm, can be adjusted to suit",
          "Side overhang": "Approx. 428mm, set by the minimum base width needed for stability. The base can be made wider if preferred",
          "Top radii": "150mm on the corners and 25mm on the underside edge, both can be adjusted to suit",
          "Leg edges": "25mm radius",
        },
      },
    ],
  },
];
