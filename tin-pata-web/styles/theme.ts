/** Design tokens — calm reading-app palette aligned with Tin Pata mobile. */

export const colors = {
  light: {
    text: '#2C2C2E',
    textSecondary: '#6B6B6E',
    background: '#F8F7F4',
    surface: '#FFFFFF',
    border: '#E8E6E1',
    tint: '#5B8A72',
    tintMuted: '#E8F0EB',
    danger: '#C45C5C',
    dangerMuted: '#F9EBEB',
  },
  dark: {
    text: '#F2F2F3',
    textSecondary: '#A8A8AB',
    background: '#1C1C1E',
    surface: '#2C2C2E',
    border: '#3A3A3C',
    tint: '#7BA892',
    tintMuted: '#2A3D32',
    danger: '#E07A7A',
    dangerMuted: '#3D2A2A',
  },
} as const;

export const typography = {
  fontSans: 'var(--font-dm-sans), system-ui, sans-serif',
  fontDisplay: 'var(--font-dm-sans), system-ui, sans-serif',
  sizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
  },
  lineHeights: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.625,
  },
} as const;

export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
} as const;

export const radius = {
  sm: '0.375rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  full: '9999px',
} as const;

export const shadows = {
  sm: '0 1px 2px rgb(44 44 46 / 0.06)',
  md: '0 4px 12px rgb(44 44 46 / 0.08)',
  lg: '0 8px 24px rgb(44 44 46 / 0.1)',
} as const;

export const containers = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  content: '72rem',
} as const;

export const brand = {
  nameBn: 'তিনপাতা',
  nameEn: 'Tin Pata',
  displayName: 'তিনপাতা (Tin Pata)',
} as const;
