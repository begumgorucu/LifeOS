/**
 * Inline SVG ikon kütüphanesi.
 *
 * Tasarım dosyasındaki (designs/assets/lifeos.js) lucide-style path'leri
 * birebir taşıdık. `<Icon name="flame" />` şeklinde kullanılır. CSS'te
 * `stroke: currentColor` olduğu için ikonun rengi her zaman parent'ın
 * `color` özelliğinden gelir — UI tutarlılığı bedava.
 */
import type { CSSProperties } from "react";

const PATHS: Record<string, string> = {
  dashboard: "M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z",
  areas: "M12 3a9 9 0 0 1 0 18M3 12h18",
  projects: "M3 9h18M9 4v16",
  tasks: "M4 6h16M4 12h16M4 18h10",
  pool: "M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4",
  vision: "M21 15l-5-5L5 21",
  stats: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  settings:
    "M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 9 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 9a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z",
  search: "M21 21l-4-4",
  plus: "M12 5v14M5 12h14",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0",
  check: "M20 6L9 17l-5-5",
  arrow: "M5 12h14M13 6l6 6-6 6",
  flame:
    "M12 2c1 3 4 5 4 9a4 4 0 0 1-8 0c0-1 .5-2 1-2.5C9 11 9 13 11 13c0-2 1-3 1-5 0-2-1-4-1-6z",
  star: "M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.1l1-5.8L3.5 9.2l5.9-.9z",
  refresh:
    "M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5",
  target: "",
  clock: "M12 7v5l3 2",
  link: "M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5",
  edit: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z",
  trash: "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6",
  grid: "",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  chevron: "M9 6l6 6-6 6",
  chevrond: "M6 9l6 6 6-6",
  calendar: "M3 10h18M8 2v4M16 2v4",
  sparkle: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z",
  play: "M6 4l14 8-14 8z",
  x: "M18 6L6 18M6 6l12 12",
  book: "M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19a2 2 0 0 0 2 2h13",
  download: "M12 3v12M7 11l5 5 5-5M5 21h14",
  upload: "M12 21V9M7 13l5-5 5 5M5 3h14",
  user: "M4 21a8 8 0 0 1 16 0",
  moon: "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z",
  globe: "M3 12h18M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z",
  bolt: "M13 2L4 14h7l-1 8 9-12h-7z",
  info: "M12 11v5M12 8h.01",
  filter: "M3 5h18l-7 8v6l-4-2v-4z",
};

const CIRCLES: Record<string, Array<{ cx: number; cy: number; r: number }>> = {
  areas: [{ cx: 12, cy: 12, r: 9 }],
  search: [{ cx: 11, cy: 11, r: 7 }],
  target: [
    { cx: 12, cy: 12, r: 9 },
    { cx: 12, cy: 12, r: 5 },
    { cx: 12, cy: 12, r: 1 },
  ],
  clock: [{ cx: 12, cy: 12, r: 9 }],
  globe: [{ cx: 12, cy: 12, r: 9 }],
  info: [{ cx: 12, cy: 12, r: 9 }],
  user: [{ cx: 12, cy: 8, r: 4 }],
};

const RECTS: Record<
  string,
  Array<{ x: number; y: number; w: number; h: number; rx?: number }>
> = {
  projects: [{ x: 3, y: 4, w: 18, h: 16, rx: 2 }],
  vision: [{ x: 3, y: 3, w: 18, h: 18, rx: 2 }],
  calendar: [{ x: 3, y: 4, w: 18, h: 18, rx: 2 }],
  grid: [
    { x: 3, y: 3, w: 7, h: 7, rx: 1 },
    { x: 14, y: 3, w: 7, h: 7, rx: 1 },
    { x: 3, y: 14, w: 7, h: 7, rx: 1 },
    { x: 14, y: 14, w: 7, h: 7, rx: 1 },
  ],
};

export type IconName = keyof typeof PATHS;

interface IconProps {
  name: IconName | string;
  size?: number;
  strokeWidth?: number;
  className?: string;
  style?: CSSProperties;
}

export function Icon({
  name,
  size = 18,
  strokeWidth = 1.7,
  className,
  style,
}: IconProps) {
  const path = PATHS[name] ?? "";
  const circles = CIRCLES[name];
  const rects = RECTS[name];

  // Bilinmeyen ikon adı geldiğinde sessiz kal — UI bozulmasın, görünmez SVG kalsın.
  if (!path && !circles && !rects) {
    return null;
  }

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      style={style}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {rects?.map((r, i) => (
        <rect key={`r${i}`} x={r.x} y={r.y} width={r.w} height={r.h} rx={r.rx} />
      ))}
      {circles?.map((c, i) => (
        <circle key={`c${i}`} cx={c.cx} cy={c.cy} r={c.r} />
      ))}
      {path && <path d={path} />}
    </svg>
  );
}
