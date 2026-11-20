/**
 * Small geometry helpers for hand-drawn case-study diagrams (see
 * `components/content/Diagram.astro` for the classes they use). Everything is
 * plain data, so a diagram is a list of boxes, arrows and labels.
 */

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
  /** One or two lines, centred in the box. */
  lines: string[];
  /** Muted second line, e.g. a role under a framework name. */
  subtitle?: string[];
}

export interface TextLine {
  x: number;
  y: number;
  text: string;
  anchor?: 'start' | 'middle' | 'end';
  muted?: boolean;
  label?: boolean;
}

/** Baselines for a box's text block, centred vertically. */
export function boxLines(box: Box): TextLine[] {
  const all = [...box.lines.map((text) => ({ text, muted: false })), ...(box.subtitle ?? []).map((text) => ({ text, muted: true }))];
  const lineHeight = 17;
  const first = box.y + box.h / 2 - ((all.length - 1) * lineHeight) / 2 + 4;
  return all.map(({ text, muted }, i) => ({
    x: box.x + box.w / 2,
    y: first + i * lineHeight,
    text,
    anchor: 'middle' as const,
    muted,
  }));
}

/**
 * An arrow as a polyline path plus a small filled head at its end. Points run
 * from tail to head; every segment is horizontal or vertical.
 */
export function arrow(points: [number, number][]): { path: string; head: string } {
  const path = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x} ${y}`).join(' ');
  const [x2, y2] = points[points.length - 1]!;
  const [x1, y1] = points[points.length - 2]!;
  const s = 5;
  let head: string;
  if (x2 > x1) head = `${x2},${y2} ${x2 - s * 1.6},${y2 - s} ${x2 - s * 1.6},${y2 + s}`;
  else if (x2 < x1) head = `${x2},${y2} ${x2 + s * 1.6},${y2 - s} ${x2 + s * 1.6},${y2 + s}`;
  else if (y2 > y1) head = `${x2},${y2} ${x2 - s},${y2 - s * 1.6} ${x2 + s},${y2 - s * 1.6}`;
  else head = `${x2},${y2} ${x2 - s},${y2 + s * 1.6} ${x2 + s},${y2 + s * 1.6}`;
  return { path, head };
}
