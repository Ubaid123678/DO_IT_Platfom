// Currency utility - maps countries/locales to currency codes
export const CURRENCY_MAP: Record<string, { code: string; symbol: string; locale: string }> = {
  // Default fallback
  default: { code: 'USD', symbol: '$', locale: 'en-US' },
  
  // Countries
  PK: { code: 'PKR', symbol: '₨', locale: 'ur-PK' },     // Pakistan
  IN: { code: 'INR', symbol: '₹', locale: 'en-IN' },     // India
  US: { code: 'USD', symbol: '$', locale: 'en-US' },     // United States
  GB: { code: 'GBP', symbol: '£', locale: 'en-GB' },     // United Kingdom
  AE: { code: 'AED', symbol: 'د.إ', locale: 'ar-AE' },    // UAE
  SA: { code: 'SAR', symbol: '﷼', locale: 'ar-SA' },     // Saudi Arabia
  CA: { code: 'CAD', symbol: 'CA$', locale: 'en-CA' },   // Canada
  AU: { code: 'AUD', symbol: 'A$', locale: 'en-AU' },    // Australia
  EU: { code: 'EUR', symbol: '€', locale: 'de-DE' },     // Eurozone
  DE: { code: 'EUR', symbol: '€', locale: 'de-DE' },     // Germany
  FR: { code: 'EUR', symbol: '€', locale: 'fr-FR' },     // France
  IT: { code: 'EUR', symbol: '€', locale: 'it-IT' },     // Italy
  ES: { code: 'EUR', symbol: '€', locale: 'es-ES' },     // Spain
  NL: { code: 'EUR', symbol: '€', locale: 'nl-NL' },     // Netherlands
  BE: { code: 'EUR', symbol: '€', locale: 'nl-BE' },     // Belgium
  CN: { code: 'CNY', symbol: '¥', locale: 'zh-CN' },     // China
  JP: { code: 'JPY', symbol: '¥', locale: 'ja-JP' },     // Japan
  KR: { code: 'KRW', symbol: '₩', locale: 'ko-KR' },     // South Korea
  SG: { code: 'SGD', symbol: 'S$', locale: 'en-SG' },    // Singapore
  MY: { code: 'MYR', symbol: 'RM', locale: 'ms-MY' },    // Malaysia
  ID: { code: 'IDR', symbol: 'Rp', locale: 'id-ID' },    // Indonesia
  TH: { code: 'THB', symbol: '฿', locale: 'th-TH' },     // Thailand
  PH: { code: 'PHP', symbol: '₱', locale: 'en-PH' },     // Philippines
  VN: { code: 'VND', symbol: '₫', locale: 'vi-VN' },     // Vietnam
  BD: { code: 'BDT', symbol: '৳', locale: 'bn-BD' },     // Bangladesh
  NG: { code: 'NGN', symbol: '₦', locale: 'en-NG' },     // Nigeria
  ZA: { code: 'ZAR', symbol: 'R', locale: 'en-ZA' },     // South Africa
  EG: { code: 'EGP', symbol: '£', locale: 'ar-EG' },     // Egypt
  BR: { code: 'BRL', symbol: 'R$', locale: 'pt-BR' },    // Brazil
  MX: { code: 'MXN', symbol: '$', locale: 'es-MX' },     // Mexico
  AR: { code: 'ARS', symbol: '$', locale: 'es-AR' },     // Argentina
  CL: { code: 'CLP', symbol: '$', locale: 'es-CL' },     // Chile
  CO: { code: 'COP', symbol: '$', locale: 'es-CO' },     // Colombia
  PE: { code: 'PEN', symbol: 'S/', locale: 'es-PE' },    // Peru
  TR: { code: 'TRY', symbol: '₺', locale: 'tr-TR' },     // Turkey
  IL: { code: 'ILS', symbol: '₪', locale: 'he-IL' },     // Israel
  RU: { code: 'RUB', symbol: '₽', locale: 'ru-RU' },     // Russia
  UA: { code: 'UAH', symbol: '₴', locale: 'uk-UA' },     // Ukraine
  PL: { code: 'PLN', symbol: 'zł', locale: 'pl-PL' },    // Poland
  CZ: { code: 'CZK', symbol: 'Kč', locale: 'cs-CZ' },    // Czech Republic
  HU: { code: 'HUF', symbol: 'Ft', locale: 'hu-HU' },    // Hungary
  RO: { code: 'RON', symbol: 'lei', locale: 'ro-RO' },   // Romania
  BG: { code: 'BGN', symbol: 'лв', locale: 'bg-BG' },    // Bulgaria
  HR: { code: 'EUR', symbol: '€', locale: 'hr-HR' },     // Croatia
  RS: { code: 'RSD', symbol: 'дин', locale: 'sr-RS' },   // Serbia
  SK: { code: 'EUR', symbol: '€', locale: 'sk-SK' },     // Slovakia
  SI: { code: 'EUR', symbol: '€', locale: 'sl-SI' },     // Slovenia
  LT: { code: 'EUR', symbol: '€', locale: 'lt-LT' },     // Lithuania
  LV: { code: 'EUR', symbol: '€', locale: 'lv-LV' },     // Latvia
  EE: { code: 'EUR', symbol: '€', locale: 'et-EE' },     // Estonia
  FI: { code: 'EUR', symbol: '€', locale: 'fi-FI' },     // Finland
  SE: { code: 'SEK', symbol: 'kr', locale: 'sv-SE' },    // Sweden
  NO: { code: 'NOK', symbol: 'kr', locale: 'nb-NO' },    // Norway
  DK: { code: 'DKK', symbol: 'kr', locale: 'da-DK' },    // Denmark
  CH: { code: 'CHF', symbol: 'CHF', locale: 'de-CH' },   // Switzerland
  NZ: { code: 'NZD', symbol: 'NZ$', locale: 'en-NZ' },   // New Zealand
};

export const getCurrencyFromLocale = (locale: string): { code: string; symbol: string; locale: string } => {
  // Try to extract country code from locale (e.g., 'en-US' -> 'US', 'ur-PK' -> 'PK')
  const parts = locale.split('-');
  if (parts.length >= 2) {
    const countryCode = parts[1].toUpperCase();
    if (CURRENCY_MAP[countryCode]) {
      return CURRENCY_MAP[countryCode];
    }
  }
  return CURRENCY_MAP.default;
};

export const getCurrencyFromLocaleObject = (localeObj: { languageTag?: string; regionCode?: string | null; currencyCode?: string | null; currencySymbol?: string | null }): { code: string; symbol: string; locale: string } => {
  // Use currencyCode and currencySymbol directly from locale object if available (most accurate)
  if (localeObj.currencyCode && localeObj.currencySymbol) {
    return { code: localeObj.currencyCode, symbol: localeObj.currencySymbol, locale: localeObj.languageTag || 'en-US' };
  }
  // Try regionCode (more accurate for country detection)
  if (localeObj.regionCode) {
    const countryCode = localeObj.regionCode.toUpperCase();
    if (CURRENCY_MAP[countryCode]) {
      return CURRENCY_MAP[countryCode];
    }
  }
  // Fallback to languageTag
  if (localeObj.languageTag) {
    return getCurrencyFromLocale(localeObj.languageTag);
  }
  return CURRENCY_MAP.default;
};

export const getCurrencyFromCountryCode = (countryCode: string): { code: string; symbol: string; locale: string } => {
  const code = countryCode.toUpperCase();
  return CURRENCY_MAP[code] || CURRENCY_MAP.default;
};

export const formatCurrency = (amount: number, currency?: { code: string; symbol: string }): string => {
  const curr = currency || CURRENCY_MAP.default;
  // amount is in cents
  const dollars = amount / 100;
  return `${curr.symbol}${dollars.toFixed(2)}`;
};

export const getDeviceCurrency = (): { code: string; symbol: string; locale: string } => {
  // Try to get from device locale
  try {
    // In React Native, we can use I18nManager or expo-localization
    // For now, fallback to default
    return CURRENCY_MAP.default;
  } catch {
    return CURRENCY_MAP.default;
  }
};

// Platform fee is 10% - deducted from provider, not added to client
export const PLATFORM_FEE_PERCENT = 10;

export const calculatePlatformFee = (amount: number): number => {
  // amount in cents
  return Math.round(amount * (PLATFORM_FEE_PERCENT / 100));
};

export const calculateProviderAmount = (amount: number): number => {
  // amount in cents - provider gets amount minus platform fee
  return amount - calculatePlatformFee(amount);
};

export const calculateClientTotal = (amount: number): number => {
  // Client pays exactly what they set - platform fee comes from provider side
  return amount;
};