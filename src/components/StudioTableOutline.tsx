import { motion } from "motion/react";
import type { StudioProduct, StudioSizeVariant } from "../data/studio-products";

interface Props {
  product: StudioProduct;
  size: StudioSizeVariant;
  /** Thumbnail mode: no labels, heavier strokes so it still reads at a small size. */
  compact?: boolean;
}

// Chair seat and back, in mm. Local coordinates: +y points away from the table, the seat's inner
// edge sits slightly under the tabletop so the chair looks pulled in.
const SEAT_WIDTH = 420;
const SEAT_INNER = -110;
const SEAT_OUTER = 290;
const BACK_OUTER = 350;
const CHAIR_REACH = BACK_OUTER;
const PAD = 70;
// Side chairs are spread over this share of the length so none end up on a curved end.
const SIDE_SPAN = 0.84;

type Chair = { x: number; y: number; angle: number };

function ChairShape({ x, y, angle, stroke }: Chair & { stroke: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle})`}>
      <rect x={-SEAT_WIDTH / 2} y={SEAT_INNER} width={SEAT_WIDTH} height={SEAT_OUTER - SEAT_INNER} rx={55} fill="#e5ddd0" stroke="#8a9b94" strokeWidth={stroke} />
      <rect x={-SEAT_WIDTH / 2} y={SEAT_OUTER + 15} width={SEAT_WIDTH} height={BACK_OUTER - SEAT_OUTER - 15} rx={22} fill="#8a9b94" />
    </g>
  );
}

/** Y of the tabletop edge at horizontal position x, for a rounded rectangle of half-sizes (hl, hw) and corner radius r. */
function edgeY(x: number, hl: number, hw: number, r: number) {
  const d = Math.abs(x) - (hl - r);
  return d <= 0 ? hw : hw - r + Math.sqrt(Math.max(r * r - d * d, 0));
}

function layoutChairs(product: StudioProduct, size: StudioSizeVariant, radius: number): Chair[] {
  const hl = size.lengthMm / 2;
  const hw = size.widthMm / 2;
  const n = size.chairs;

  if (product.outline.kind === "round") {
    return Array.from({ length: n }, (_, i) => {
      const phi = (i / n) * 2 * Math.PI + Math.PI / n;
      return { x: Math.cos(phi) * hl, y: Math.sin(phi) * hl, angle: (phi * 180) / Math.PI - 90 };
    });
  }

  const perSide = Math.max(Math.floor((n - 2) / 2), 0);
  const chairs: Chair[] = [
    { x: -hl, y: 0, angle: 90 },
    { x: hl, y: 0, angle: -90 },
  ];
  for (let i = 0; i < perSide; i++) {
    const x = ((i + 0.5) / perSide - 0.5) * size.lengthMm * SIDE_SPAN;
    const y = edgeY(x, hl, hw, radius);
    chairs.push({ x, y: -y, angle: 180 }, { x, y, angle: 0 });
  }
  return chairs;
}

export default function StudioTableOutline({ product, size, compact = false }: Props) {
  const maxLength = Math.max(...product.sizes.map((s) => s.lengthMm));
  const maxWidth = Math.max(...product.sizes.map((s) => s.widthMm));
  // One fixed canvas per product, so a smaller size visibly draws smaller than a larger one.
  const vbW = maxLength + 2 * (CHAIR_REACH + PAD);
  const vbH = maxWidth + 2 * (CHAIR_REACH + PAD);

  const radius =
    product.outline.kind === "rect"
      ? product.outline.cornerRadiusMm
      : Math.min(size.lengthMm, size.widthMm) / 2;
  const chairs = layoutChairs(product, size, radius);
  const isRound = product.outline.kind === "round";
  const sizeText = isRound ? `${size.lengthMm}mm` : `${size.lengthMm} × ${size.widthMm}mm`;
  const fontSize = vbW * 0.042;

  return (
    <svg
      viewBox={`${-vbW / 2} ${-vbH / 2} ${vbW} ${vbH}`}
      role="img"
      aria-label={`Top-down outline of the ${product.name}, ${size.label}, with ${size.chairs} chairs around it`}
      className="w-full h-auto block"
    >
      {chairs.map((chair, i) => (
        <motion.g key={`${size.id}-${i}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.1 }}>
          <ChairShape {...chair} stroke={compact ? 24 : 8} />
        </motion.g>
      ))}
      <motion.rect
        initial={false}
        animate={{ x: -size.lengthMm / 2, y: -size.widthMm / 2, width: size.lengthMm, height: size.widthMm, rx: radius }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        fill="#f5f1e8"
        stroke="#3d4f47"
        strokeWidth={compact ? 36 : 14}
      />
      {!compact && (
        <>
          <text x={0} y={-fontSize * 0.1} textAnchor="middle" fontSize={fontSize} fontWeight={600} fill="#3d4f47">
            {sizeText}
          </text>
          <text x={0} y={fontSize * 1.15} textAnchor="middle" fontSize={fontSize * 0.8} fill="#5a6b64">
            {`Seats ${size.seating.replace(" people", "")}`}
          </text>
        </>
      )}
    </svg>
  );
}
