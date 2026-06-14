export const Colors = {
  light: {
    text: '#2C2C2E',
    textSecondary: '#6B6B6E',
    background: '#F8F7F4',
    surface: '#FFFFFF',
    border: '#E8E6E1',
    tint: '#5B8A72',
    tintMuted: '#E8F0EB',
    tabIconDefault: '#A8A8AB',
    tabIconSelected: '#5B8A72',
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
    tabIconDefault: '#6B6B6E',
    tabIconSelected: '#7BA892',
    danger: '#E07A7A',
    dangerMuted: '#3D2A2A',
  },
} as const;

export type ColorScheme = keyof typeof Colors;
