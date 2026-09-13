/**
 * CareTrace Shared Design Tokens
 * Conveys trust, warmth, and logistical clarity rather than cold corporate aesthetic.
 */

export const colors = {
  // Trust Teal (Primary)
  primary: {
    50: '#F0FDFA',
    100: '#CCFBF1',
    200: '#99F6E4',
    300: '#5EEAD4',
    400: '#2DD4BF',
    500: '#14B8A6',
    600: '#0D9488',
    700: '#0F766E', // Main brand primary
    800: '#115E59',
    900: '#134E4A',
    950: '#042F2E',
  },

  // Warm Amber / Terracotta (Secondary & Urgency)
  accent: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B', // Warm accent
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },

  // Terracotta / Action Red
  terracotta: {
    500: '#EA580C',
    600: '#C2410C',
  },

  // Canvas & Surfaces (Warm parchment/off-white)
  surface: {
    canvas: '#FBFBF9',     // Main background
    card: '#FFFFFF',       // Elevated surface
    cardSubtle: '#F6F6F2', // Secondary container
    cardHover: '#F1F1EC',
    border: '#E7E8E2',     // Crisp soft border
    borderStrong: '#D1D3CA',
  },

  // Slate Neutrals
  slate: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  },

  // Semantic Status Colors
  status: {
    verified: {
      bg: '#ECFDF5',
      text: '#065F46',
      border: '#A7F3D0',
      badge: '#059669',
    },
    matched: {
      bg: '#F0F9FF',
      text: '#075985',
      border: '#BAE6FD',
      badge: '#0284C7',
    },
    pickedUp: {
      bg: '#EEF2FF',
      text: '#3730A3',
      border: '#C7D2FE',
      badge: '#4F46E5',
    },
    inTransit: {
      bg: '#FFFBEB',
      text: '#92400E',
      border: '#FDE68A',
      badge: '#D97706',
    },
    delivered: {
      bg: '#F0FDF4',
      text: '#166534',
      border: '#BBF7D0',
      badge: '#16A34A',
    },
    confirmed: {
      bg: '#ECFDF5',
      text: '#047857',
      border: '#6EE7B7',
      badge: '#059669',
    },
    flagged: {
      bg: '#FEF2F2',
      text: '#991B1B',
      border: '#FECACA',
      badge: '#DC2626',
    },
  },
} as const;

export const typography = {
  fontFamily: {
    sans: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: 'JetBrains Mono, "Courier New", Courier, monospace',
  },
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem',// 30px
    '4xl': '2.25rem', // 36px
  },
  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
} as const;

export const spacing = {
  1: '0.25rem',  // 4px
  2: '0.5rem',   // 8px
  3: '0.75rem',  // 12px
  4: '1rem',     // 16px
  5: '1.25rem',  // 20px
  6: '1.5rem',   // 24px
  8: '2rem',     // 32px
  10: '2.5rem',  // 40px
  12: '3rem',    // 48px
  16: '4rem',    // 64px
} as const;

export const radii = {
  sm: '0.375rem', // 6px
  md: '0.5rem',   // 8px
  lg: '0.75rem',  // 12px
  xl: '1rem',     // 16px
  '2xl': '1.5rem',// 24px
  full: '9999px',
} as const;

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.07)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.08)',
} as const;

