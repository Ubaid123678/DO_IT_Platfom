import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

import { api } from '@/src/services/api';
import { CURRENCY_MAP } from '@/src/utils/currency';

/**
 * Money model
 * -----------
 * USD cents are canonical everywhere: the database, the wallet, escrow and
 * Stripe all speak USD cents. This context converts for DISPLAY only, and
 * converts user input back to USD cents on submit.
 *
 * Display currency defaults to the device region (no IP lookup needed — the
 * phone already knows its country) and can be overridden in Settings. The
 * override persists across restarts.
 *
 * ponytail: one cached USD→X rate per currency, refreshed hourly. Ceiling:
 * amounts drift with the live rate between refreshes and we do not lock a
 * rate per transaction. Upgrade path: persist the rate on each money row
 * (topup/escrow/bid) when real FX settlement is needed.
 */

const STORAGE_KEY = '@doit_currency';
const RATE_STORAGE_KEY = '@doit_fx_rate';

export type CurrencyInfo = { code: string; symbol: string; locale: string };

type CurrencyContextValue = {
  /** Selected display currency. */
  currency: CurrencyInfo;
  /** USD → selected currency rate (e.g. 278 for PKR). */
  rate: number;
  /** True until the persisted choice + rate have loaded. */
  loading: boolean;
  /** Format canonical USD cents into the selected currency. */
  fmt: (usdCents: number, opts?: { precise?: boolean }) => string;
  /** Convert a display-currency amount (e.g. from an input) to USD cents. */
  toUsdCents: (localAmount: number) => number;
  /** Convert USD cents to a display-currency number (for inputs/prefill). */
  fromUsdCents: (usdCents: number) => number;
  /** Persist a new currency choice and refresh its rate. */
  setCurrencyCode: (code: string) => Promise<void>;
};

const CurrencyContext = createContext<CurrencyContextValue | undefined>(undefined);

const deviceCurrency = (): CurrencyInfo => {
  const locales = Localization.getLocales();
  const loc = locales[0];
  const region = loc?.regionCode?.toUpperCase();
  if (region && CURRENCY_MAP[region]) return CURRENCY_MAP[region];
  return CURRENCY_MAP.default;
};

export const CurrencyProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [currency, setCurrency] = useState<CurrencyInfo>(deviceCurrency);
  const [rate, setRate] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchRate = useCallback(async (code: string): Promise<number> => {
    if (code === 'USD') return 1;
    try {
      const res = await api.get<{ success: boolean; data: { rates: Record<string, number> } }>(
        `/wallet/fx/rates?base=USD&targets=${code}`,
      );
      const value = res.data.data.rates?.[code];
      return value && value > 0 ? value : 1;
    } catch {
      return 1;
    }
  }, []);

  // Load persisted choice (or device default), then its rate. A cached rate is
  // applied first so the first render after a cold start shows local money, not
  // a flash of USD.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [savedCode, savedRate] = await AsyncStorage.multiGet([STORAGE_KEY, RATE_STORAGE_KEY]);
        const next = savedCode[1] && CURRENCY_MAP[savedCode[1]] ? CURRENCY_MAP[savedCode[1]] : deviceCurrency();
        const cachedRate = Number(savedRate[1]);
        if (active && savedCode[1] === next.code && cachedRate > 0) setRate(cachedRate);
        if (active) setCurrency(next);

        const nextRate = await fetchRate(next.code);
        if (!active) return;
        setRate(nextRate);
        await AsyncStorage.setItem(RATE_STORAGE_KEY, String(nextRate));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [fetchRate]);

  const setCurrencyCode = useCallback(async (code: string) => {
    const next = CURRENCY_MAP[code];
    if (!next) return;
    const nextRate = await fetchRate(next.code);
    setCurrency(next);
    setRate(nextRate);
    await AsyncStorage.multiSet([[STORAGE_KEY, next.code], [RATE_STORAGE_KEY, String(nextRate)]]);
  }, [fetchRate]);

  const fmt = useCallback((usdCents: number, opts?: { precise?: boolean }) => {
    const local = (usdCents / 100) * rate;
    const digits = opts?.precise === false ? 0 : 2;
    return `${currency.symbol}${local.toLocaleString(currency.locale, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    })}`;
  }, [currency, rate]);

  const toUsdCents = useCallback(
    (localAmount: number) => Math.round((localAmount / (rate || 1)) * 100),
    [rate],
  );

  const fromUsdCents = useCallback(
    (usdCents: number) => (usdCents / 100) * rate,
    [rate],
  );

  const value = useMemo<CurrencyContextValue>(
    () => ({ currency, rate, loading, fmt, toUsdCents, fromUsdCents, setCurrencyCode }),
    [currency, rate, loading, fmt, toUsdCents, fromUsdCents, setCurrencyCode],
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
};

export const useCurrency = (): CurrencyContextValue => {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used inside CurrencyProvider');
  return ctx;
};

/** Currencies offered in Settings (subset of CURRENCY_MAP, USD always first). */
export const SELECTABLE_CURRENCIES: CurrencyInfo[] = [
  'USD', 'PKR', 'INR', 'EUR', 'GBP', 'AED', 'SAR', 'CAD', 'AUD',
]
  .filter((code) => Boolean(CURRENCY_MAP[code]))
  .map((code) => CURRENCY_MAP[code]);
