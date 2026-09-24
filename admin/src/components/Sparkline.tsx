import React from 'react';

/** Minimal inline-SVG area sparkline — no charting dependency needed for a
 * single accent-colored trend line. Matches the mobile app's "glow, never a
 * flood" treatment of the accent color. */
export const Sparkline: React.FC<{ values: number[]; width?: number; height?: number }> = ({ values, width = 640, height = 120 }) => {
  const max = Math.max(1, ...values);
  const stepX = width / Math.max(1, values.length - 1);
  const points = values.map((v, i) => [i * stepX, height - (v / max) * (height - 8) - 4] as const);
  const linePath = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`;

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label="Signups over the last 30 days">
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9184d9" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#9184d9" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#sparkFill)" />
      <path d={linePath} fill="none" stroke="#9184d9" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
};
