// WalkMe Design System — brand identity, tokens, grid & elevation
// T1 (E1-S2): style guide source of truth for all coded components

export const Colors = {
  // Primary
  primary: '#6C5CE7',
  primaryDark: '#5B4CC4',
  secondary: '#00D2D3',
  accent: '#FD7272',

  // Semantic
  success: '#1DD1A1',
  warning: '#FECA57',
  error: '#FD7272',
  info: '#00D2D3',

  // Dark mode layers
  backgroundDark: '#0D0D0D',
  surfaceDark: '#1A1A2E',
  cardDark: '#16213E',

  // Light mode layers
  backgroundLight: '#F8F9FD',
  surfaceLight: '#FFFFFF',
  cardLight: '#FFFFFF',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.6)',
  textMuted: 'rgba(255,255,255,0.35)',
  textDark: '#0D0D0D',

  // Borders
  border: 'rgba(255,255,255,0.08)',
  borderLight: 'rgba(255,255,255,0.15)',

  // Gradients (use as [start, end] with LinearGradient)
  gradientPrimary: ['#6C5CE7', '#5B4CC4'] as [string, string],
  gradientProgress: ['#6C5CE7', '#00D2D3'] as [string, string],
  gradientHero: ['transparent', 'rgba(13,13,13,0.95)'] as [string, string],
};

export const Typography = {
  display: { fontSize: 40, fontWeight: '700' as const, letterSpacing: -0.8 },
  h1: { fontSize: 32, fontWeight: '700' as const, letterSpacing: -0.5 },
  h2: { fontSize: 24, fontWeight: '600' as const },
  h3: { fontSize: 20, fontWeight: '500' as const },
  bodyLarge: { fontSize: 17, fontWeight: '400' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  caption: { fontSize: 13, fontWeight: '400' as const },
  overline: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 1.5, textTransform: 'uppercase' as const },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export const Shadow = {
  /** Elevation 1 — subtle, used for cards and inputs */
  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 2,
  },
  /** Elevation 2 — mid, used for floating cards */
  card: {
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  /** Elevation 3 — high, used for bottom sheets and modals */
  modal: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 16,
  },
  /** Elevation 4 — max, used for floating action buttons */
  fab: {
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
};

// ── Grid / Layout ─────────────────────────────────────────────────────────────

export const Grid = {
  /** Horizontal content padding on all screens */
  screenPadding: 16,
  /** Gutter between columns / cards */
  gutter: 12,
  /** Standard section gap */
  sectionGap: 24,
  /** Max card width in a 2-column layout */
  cardWidth: '47%',
};

// ── Z-Index stack ─────────────────────────────────────────────────────────────

export const ZIndex = {
  base: 0,
  card: 10,
  header: 50,
  modal: 100,
  toast: 200,
};
