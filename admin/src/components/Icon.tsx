import React from 'react';

// Minimal hand-drawn line icons (no icon-font dependency) — 16px, stroke = currentColor,
// matching the mobile app's line-weight iconography.
const PATHS: Record<string, string> = {
  dashboard: 'M3 3h4v7H3V3zm0 9h4v5H3v-5zm6-9h4v5H9V3zm0 7h4v8H9v-8z',
  users: 'M6 7a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM2 13c0-2.2 1.8-4 4-4s4 1.8 4 4M11 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM10 9.5c1.7.2 3 1.5 3 3.5',
  dog: 'M3 6l2-2 2 1 3-1 2 2v3l-1 4H5L4 9zM6 10v3M9 10v3',
  walk: 'M8 2.5a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4zM6 5l2 1 2-1 1 3-2 1v4M7 9l-1 4M9 6l2 2-1 3',
  event: 'M2 4h12v9H2V4zm0 3h12M5 2v3M11 2v3',
  place: 'M8 1c-2.5 0-4.5 2-4.5 4.5C3.5 9 8 15 8 15s4.5-6 4.5-9.5C12.5 3 10.5 1 8 1zm0 6a2 2 0 1 1 0-4 2 2 0 0 1 0 4z',
  match: 'M5 3C3 3 2 4.5 2 6c0 3 6 7 6 7s6-4 6-7c0-1.5-1-3-3-3-1.3 0-2.4.8-3 2-.6-1.2-1.7-2-3-2z',
  chat: 'M2 3h12v8H6l-3 3V11H2V3z',
  upload: 'M8 11V3M5 6l3-3 3 3M3 13h10',
  log: 'M3 2h10v12H3V2zm2 3h6M5 7h6M5 9h4',
  shield: 'M8 1l5 2v4c0 4-2.5 6.5-5 8-2.5-1.5-5-4-5-8V3l5-2z',
  logout: 'M6 2H3v12h3M11 5l3 3-3 3M14 8H6',
  search: 'M7 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM14 14l-3.5-3.5',
};

export const Icon: React.FC<{ name: keyof typeof PATHS; size?: number }> = ({ name, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <path d={PATHS[name]} />
  </svg>
);
