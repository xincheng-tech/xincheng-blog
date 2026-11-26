// Adapted from boringdesigners/boring-avatars (MIT License). See public/licenses/boring-avatars-MIT.txt.
import { useId } from "react";

type Props = {
  name: string;
  colors?: string[];
  size?: number;
  variant?: "marble" | "ring";
  className?: string;
};

function hashCode(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function getDigit(num: number, ntn: number): number {
  return Math.floor((num / Math.pow(10, ntn)) % 10);
}

function getUnit(num: number, range: number, index?: number): number {
  const value = num % range;
  return index && getDigit(num, index) % 2 === 0 ? -value : value;
}

const DEFAULT_COLORS = ["#0b1536", "#3a5ad9", "#64f0ff", "#ff72cf", "#ffd479"];

export function CosmicEmblem({
  name,
  colors = DEFAULT_COLORS,
  size = 36,
  variant = "marble",
  className = "",
}: Props) {
  const palette = colors.length ? colors : DEFAULT_COLORS;
  const seed = hashCode(name);
  const rawId = useId().replace(/[^a-zA-Z0-9_-]/g, "");

  if (variant === "ring") {
    const pick = (offset: number) => palette[(seed + offset) % palette.length];
    return (
      <svg
        viewBox="0 0 90 90"
        fill="none"
        width={size}
        height={size}
        className={className}
        aria-hidden="true"
      >
        <mask id={`ring-${rawId}`} maskUnits="userSpaceOnUse" x={0} y={0} width={90} height={90}>
          <rect width={90} height={90} rx={90} fill="#fff" />
        </mask>
        <g mask={`url(#ring-${rawId})`}>
          <path d="M0 0h90v45H0z" fill={pick(0)} />
          <path d="M0 45h90v45H0z" fill={pick(1)} />
          <path d="M83 45a38 38 0 00-76 0h76z" fill={pick(1)} />
          <path d="M83 45a38 38 0 01-76 0h76z" fill={pick(2)} />
          <path d="M77 45a32 32 0 10-64 0h64z" fill={pick(2)} />
          <path d="M77 45a32 32 0 11-64 0h64z" fill={pick(3)} />
          <path d="M71 45a26 26 0 00-52 0h52z" fill={pick(3)} />
          <path d="M71 45a26 26 0 01-52 0h52z" fill={pick(0)} />
          <circle cx={45} cy={45} r={22} fill={pick(4)} />
        </g>
      </svg>
    );
  }

  const props = [0, 1, 2].map((i) => ({
    color: palette[(seed + i) % palette.length],
    tx: getUnit(seed * (i + 1), 8, 1),
    ty: getUnit(seed * (i + 1), 8, 2),
    scale: 1.2 + getUnit(seed * (i + 1), 4) / 10,
    rotate: getUnit(seed * (i + 1), 360, 1),
  }));

  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <mask id={`m-${rawId}`} maskUnits="userSpaceOnUse" x={0} y={0} width={80} height={80}>
        <rect width={80} height={80} rx={80} fill="#fff" />
      </mask>
      <g mask={`url(#m-${rawId})`}>
        <rect width={80} height={80} fill={props[0].color} />
        <path
          filter={`url(#f-${rawId})`}
          d="M32.414 59.35L50.376 70.5H72.5v-71H33.728L26.5 13.381l19.057 27.08L32.414 59.35z"
          fill={props[1].color}
          transform={`translate(${props[1].tx} ${props[1].ty}) rotate(${props[1].rotate} 40 40) scale(${props[2].scale})`}
        />
        <path
          filter={`url(#f-${rawId})`}
          style={{ mixBlendMode: "overlay" }}
          d="M22.216 24L0 46.75l14.108 38.129L78 86l-3.081-59.276-22.378 4.005 12.972 20.186-23.35 27.395L22.215 24z"
          fill={props[2].color}
          transform={`translate(${props[2].tx} ${props[2].ty}) rotate(${props[2].rotate} 40 40) scale(${props[2].scale})`}
        />
      </g>
      <defs>
        <filter id={`f-${rawId}`} filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity={0} result="bg" />
          <feBlend in="SourceGraphic" in2="bg" result="shape" />
          <feGaussianBlur stdDeviation={6.5} />
        </filter>
      </defs>
    </svg>
  );
}
