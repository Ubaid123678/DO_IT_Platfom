import { Platform } from 'react-native';

export const typography = {
  fontFamily: {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    bold: 'Inter_700Bold',
    fallback: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  displayLarge: {
    fontSize: 28,
    fontWeight: '800' as const,
  },
  h1: {
    fontSize: 24,
    fontWeight: '700' as const,
  },
  h2: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  h3: {
    fontSize: 17,
    fontWeight: '600' as const,
  },
  h4: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  body: {
    fontSize: 14,
    fontWeight: '400' as const,
  },
  small: {
    fontSize: 13,
    fontWeight: '400' as const,
  },
  micro: {
    fontSize: 12,
    fontWeight: '400' as const,
  },
  tiny: {
    fontSize: 10,
    fontWeight: '500' as const,
  },
} as const;
