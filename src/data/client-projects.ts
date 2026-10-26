export type ClientPiece = {
  /** Optimised .glb in public/models/clients/<slug>/. */
  model: string;
  /** Heading for this piece. Defaults to "Piece 1", "Piece 2"… when left out. */
  name?: string;
  /** Shown as label/value rows under the viewer, e.g. { "Timber": "American Oak", "Finish": "Raw Matte", "Size": "2400mm × 1100mm" }. */
  details?: Record<string, string>;
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
        model: "/models/clients/nadine-af535bfe/sideboard-v2.glb",
        details: { Timber: "American Oak", Finish: "Clear Matte", Size: "1000mm W × 450mm D × 1400mm H" },
      },
      {
        name: "Bedside Table",
        model: "/models/clients/nadine-af535bfe/bedside-v2.glb",
        details: { Timber: "American Oak", Finish: "Clear Matte", Size: "500mm W × 400mm D × 500mm H" },
      },
    ],
  },
];
