export const Colors = {
  bg: '#07091A',
  bgCard: '#0D1128',
  bgCardAlt: '#111630',
  bgCardBorder: '#1A2245',
  accent: '#7C5CFC',
  accentLight: '#A487FF',
  accentDim: '#2A1F6E',
  gold: '#F0B429',
  goldLight: '#FFD166',
  goldDim: '#3D2D08',
  success: '#06D6A0',
  successDim: '#063D2E',
  error: '#EF476F',
  errorDim: '#3D0F1F',
  warning: '#FFD166',
  text: '#F0F4FF',
  textSub: '#8896AB',
  textMuted: '#4A5568',
  border: '#1A2245',
  borderLight: '#222D50',
  easy: '#06D6A0',
  easyDim: '#063D2E',
  medium: '#F0B429',
  mediumDim: '#3D2D08',
  hard: '#EF476F',
  hardDim: '#3D0F1F',
  expert: '#A855F7',
  expertDim: '#2D1045',
  flame: '#FF6B35',
  flameDim: '#3D1A0A',

  // Aura accent colors (Domain themes)
  auraLegal: '#1B2B6F',
  auraLegalLight: '#2E4199',
  auraLegalDim: '#0D1536',
  auraFinance: '#0B8A50',
  auraFinanceLight: '#10B068',
  auraFinanceDim: '#052E1B',
  auraScience: '#00C8F0',
  auraScienceLight: '#33D6F5',
  auraScienceDim: '#003840',

  // ─── Neutral Workspace Theme (Polyplex Masterclass) ────────────────────────
  workspace: {
    charcoal: '#121212',
    charcoalLight: '#1A1A1A',
    charcoalMid: '#1E1E1E',
    paper: '#F8F9FA',
    paperDim: '#E8EAED',
    paperMuted: '#D4D7DC',
    inkBlue: '#003366',
    inkBlueLight: '#0A4A8A',
    inkBlueDim: '#001A33',
    inkBlueSoft: '#1A4D80',
    inkBlueGlow: '#0066CC',
    zenBorder: '#2A2A2A',
    zenBorderLight: '#333333',
    zenSurface: '#161616',
    zenSurfaceElevated: '#1C1C1C',
    textPrimary: '#F8F9FA',
    textSecondary: '#9CA3AF',
    textTertiary: '#6B7280',
    tonalAcademic: '#4A90D9',
    tonalLegal: '#7B68EE',
    tonalExecutive: '#CD853F',
    tonalPoetic: '#DA70D6',
    gardenSeed: '#4A5568',
    gardenSprout: '#48BB78',
    gardenBloom: '#38B2AC',
    gardenCrystal: '#9F7AEA',
    gardenWilt: '#E53E3E',
    stability100: '#48BB78',
    stability75: '#38B2AC',
    stability50: '#ECC94B',
    stability25: '#ED8936',
    stability0: '#E53E3E',
  },
};

export const Fonts = {
  sizes: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    xxl: 30,
    xxxl: 38,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
    black: '900' as const,
  },
};

export const Radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 999,
};

export const Shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  accent: {
    shadowColor: '#7C5CFC',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 12,
  },
  gold: {
    shadowColor: '#F0B429',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 12,
  },
  // Premium layered glass shadow
  glass: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 14,
  },
  // Subtle inner-glow effect for cards
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  }),
};

// ─── Glassmorphism presets ────────────────────────────────────────────────
export const Glass = {
  // Inner glow border (1px high-contrast)
  border: (color: string, opacity: string = '30') => ({
    borderWidth: 1,
    borderColor: `${color}${opacity}`,
  }),
  // Frosted surface background
  surface: '#FFFFFF08',
  surfaceElevated: '#FFFFFF0F',
  // Top highlight for depth
  highlight: (color: string) => `${color}12`,
};
