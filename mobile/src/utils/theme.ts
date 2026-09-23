// WalkMe Design System — brand identity, tokens, grid & elevation
// T1 (E1-S2): style guide source of truth for all coded components

// Nocturne tokens (from the "Nocturne" design system): a quiet dark ground,
// one blurple accent used as a line/glow rather than a flood, medium-weight
// Inter, soft 8px radii and a compact (0.7x) spacing scale.
// Key names are unchanged from the previous theme so screens keep working.

/** Tonal ramps generated in OKLCH — same step = same visual weight. */
export const Ramp = {
  neutral: {
    100: '#f3f5fe', 200: '#e4e7f5', 300: '#cfd3e5', 400: '#b2b6ca', 500: '#9397ab',
    600: '#75798c', 700: '#595d6c', 800: '#3f424d', 900: '#292b31',
  },
  accent: {
    100: '#f5f4ff', 200: '#e7e5fe', 300: '#d2cefd', 400: '#b5abfc', 500: '#968ae0',
    600: '#796cbf', 700: '#5d5294', 800: '#423a6a', 900: '#2b2741',
  },
};

export const Colors = {
  // Accent (mono scheme: one accent voice)
  primary: '#9184d9',
  primaryDark: Ramp.accent[600],
  secondary: '#a7a1db',
  accent: '#9184d9',

  // Semantic — kept low-chroma so they sit quietly on the ground
  success: '#7fc8a9',
  warning: '#d9b877',
  error: '#e0837f',
  info: '#a7a1db',

  // Dark ground + surfaces
  backgroundDark: '#161826',
  surfaceDark: '#232532',
  cardDark: '#232532',

  // Light layers (unused — Nocturne is dark-only)
  backgroundLight: Ramp.neutral[100],
  surfaceLight: '#ffffff',
  cardLight: '#ffffff',

  // Text — never pure white
  textPrimary: '#e9e9ed',
  textSecondary: 'rgba(233,233,237,0.70)',
  textMuted: 'rgba(233,233,237,0.50)',
  textDark: '#161826',

  // Borders — the system's divider is text @ 16%
  border: 'rgba(233,233,237,0.10)',
  borderLight: 'rgba(233,233,237,0.16)',

  // Gradients (accent used as a soft glow, never a flood)
  gradientPrimary: [Ramp.accent[700], Ramp.accent[800]] as [string, string],
  gradientProgress: [Ramp.accent[600], Ramp.accent[400]] as [string, string],
  gradientHero: ['transparent', 'rgba(22,24,38,0.95)'] as [string, string],
};

/** Fonts. Weights above 500 are capped at Medium — hierarchy is size and space. */
export const Fonts = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
};

export const Typography = {
  display: { fontSize: 34, fontWeight: '500' as const, letterSpacing: -0.5 },
  h1: { fontSize: 28, fontWeight: '500' as const, letterSpacing: -0.4 },
  h2: { fontSize: 22, fontWeight: '500' as const, letterSpacing: -0.3 },
  h3: { fontSize: 18, fontWeight: '500' as const, letterSpacing: -0.2 },
  bodyLarge: { fontSize: 16, fontWeight: '400' as const },
  body: { fontSize: 14, fontWeight: '400' as const },
  caption: { fontSize: 12, fontWeight: '400' as const },
  overline: { fontSize: 10, fontWeight: '500' as const, letterSpacing: 1.2, textTransform: 'uppercase' as const },
};

/** Compact scale (~0.7x density). */
export const Spacing = {
  xs: 3,
  sm: 6,
  md: 12,
  lg: 18,
  xl: 24,
  xxl: 36,
};

export const Radius = {
  sm: 4,
  md: 8,
  lg: 14,
  xl: 14,
  full: 999,
};

/** Elevation = a hairline edge plus ambient darkness, never a coloured glow. */
export const Shadow = {
  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 1,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 4,
  },
  modal: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 16,
  },
  fab: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
    elevation: 10,
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
