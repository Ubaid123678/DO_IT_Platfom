export const Colors = {
  light: {
    primary: '#1A9E8F',
    primaryMid: '#7ABFB8',
    primaryLight: '#E0F4F2',
    primaryDark: '#0D7A6E',
    amber: '#F5A623',
    amberLight: '#FEF3DC',
    success: '#27AE60',
    error: '#E74C3C',
    warning: '#F39C12',
    background: '#F0F4F4',
    card: '#FFFFFF',
    cardBorder: '#D0E8E6',
    textPrimary: '#1A1A1A',
    textSecondary: '#666666',
    textHint: '#AAAAAA',
    divider: '#E8EDED',
    navBg: '#FFFFFF',
    navBorder: '#D0E8E6',
    inputBg: '#FFFFFF',
    inputBorder: '#D0E8E6',
    inputFocus: '#1A9E8F',
    overlay: 'rgba(0,0,0,0.5)',
  },
  dark: {
    primary: '#1A9E8F',
    primaryMid: '#7ABFB8',
    primaryLight: '#0F3330',
    primaryDark: '#0F3330',
    amber: '#F5A623',
    amberLight: '#2A1F00',
    success: '#27AE60',
    error: '#E74C3C',
    warning: '#F39C12',
    background: '#0D1F1E',
    card: '#152E2C',
    cardBorder: '#1F4A47',
    textPrimary: '#E8F8F6',
    textSecondary: '#7ABFB8',
    textHint: '#4A7A75',
    divider: '#1F4A47',
    navBg: '#0A1A19',
    navBorder: '#1F4A47',
    inputBg: '#152E2C',
    inputBorder: '#1F4A47',
    inputFocus: '#1A9E8F',
    overlay: 'rgba(0,0,0,0.7)',
  },
} as const;

export const colors = Colors;

export type AppColors = {
  [K in keyof typeof Colors.light]: string;
};
export type ThemeMode = keyof typeof Colors;
