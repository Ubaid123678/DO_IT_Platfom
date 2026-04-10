import { useColorScheme as useNativeColorScheme } from 'react-native';

export const useColorScheme = (): 'light' | 'dark' => {
  return useNativeColorScheme() ?? 'light';
};
