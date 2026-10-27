export type ClientPiece = {
  /** Optimised .glb in public/models/clients/<slug>/. */
  model: string;
  /** Heading for this piece. Defaults to "Piece 1", "Piece 2"… when left out. */
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
  pieces: ClientPiece[];
};

export const clientProjects: ClientProject[] = [
  {
    slug: "nadine-af535bfe",
    clientName: "Nadine",
    pieces: [
      {
        name: "Sideboard",
        model: "/models/clients/nadine-af535bfe/sideboard-v3.glb",
        drawing: "/models/clients/nadine-af535bfe/sideboard-drawing.svg",
        drawingPdf: "/models/clients/nadine-af535bfe/sideboard-drawing.pdf",
        details: { Timber: "American Oak", Finish: "Clear Matte" },
      },
      {
        name: "Bedside Table",
        model: "/models/clients/nadine-af535bfe/bedside-v3.glb",
        drawing: "/models/clients/nadine-af535bfe/bedside-drawing-v2.svg",
        drawingPdf: "/models/clients/nadine-af535bfe/bedside-drawing-v2.pdf",
        details: { Timber: "American Oak", Finish: "Clear Matte" },
      },
    ],
  },
];
