import { AppError } from '../../common/errors/AppError.js';

interface FxRate {
  base: string;
  target: string;
  rate: number;
  timestamp: Date;
  source: 'wise' | 'stripe' | 'exchangerate' | 'manual';
}

interface FxRateCache {
  [pair: string]: FxRate;
}

interface FxConversionResult {
  sourceAmount: number;
  sourceCurrency: string;
  targetAmount: number;
  targetCurrency: string;
  rate: number;
  fee: number;
  timestamp: Date;
}

class FxRateService {
  private cache: Map<string, FxRate> = new Map();
  private cacheTTL: number = 1000 * 60 * 60; // 1 hour default TTL
  private maxCacheSize: number = 500;

  private readonly fallbackRates: Record<string, Record<string, number>> = {
    USD: { EUR: 0.92, GBP: 0.79, CAD: 1.35, AUD: 1.52, JPY: 149.5, INR: 83.1, PHP: 56.2, MXN: 17.1, BRL: 4.95, NGN: 780 },
    EUR: { USD: 1.09, GBP: 0.86, CAD: 1.47, AUD: 1.65, JPY: 162.5, INR: 90.3, PHP: 61.1, MXN: 18.6, BRL: 5.38, NGN: 848 },
    GBP: { USD: 1.27, EUR: 1.16, CAD: 1.71, AUD: 1.92, JPY: 189.0, INR: 105.0, PHP: 71.1, MXN: 21.6, BRL: 6.25, NGN: 986 },
  };

  private generateCacheKey(base: string, target: string): string {
    return `${base}_${target}`;
  }

  private isCacheValid(cached: FxRate): boolean {
    const now = Date.now();
    const cachedTime = cached.timestamp.getTime();
    return (now - cachedTime) < this.cacheTTL;
  }

  async getRate(base: string, target: string): Promise<number> {
    if (base === target) return 1;

    const cacheKey = this.generateCacheKey(base, target);
    const cached = this.cache.get(cacheKey);

    if (cached && this.isCacheValid(cached)) {
      return cached.rate;
    }

    // Try to fetch from Wise
    try {
      const rate = await this.fetchFromWise(base, target);
      this.setCache(base, target, rate, 'wise');
      return rate;
    } catch (wiseError) {
      console.warn('Wise rate fetch failed, trying exchangerate.host:', wiseError);
    }

    // Fallback to exchangerate.host
    try {
      const rate = await this.fetchFromExchangerateHost(base, target);
      this.setCache(base, target, rate, 'exchangerate');
      return rate;
    } catch (exchError) {
      console.warn('exchangerate.host failed, using fallback:', exchError);
    }

    // Use hardcoded fallback
    return this.getFallbackRate(base, target);
  }

  private async fetchFromWise(base: string, target: string): Promise<number> {
    const wiseToken = process.env.WISE_API_TOKEN;
    if (!wiseToken) throw new Error('Wise API token not configured');

    const response = await fetch(
      `https://api.transferwise.com/v1/rates?source=${base}&target=${target}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.WISE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Wise API error: ${response.status}`);
    }

    const data = await response.json();
    if (!data || !data[0]?.rate) {
      throw new Error('Invalid Wise rate response');
    }

    return data[0].rate;
  }

  private async fetchFromExchangerateHost(base: string, target: string): Promise<number> {
    const response = await fetch(
      `https://api.exchangerate.host/latest?base=${base}&symbols=${target}`
    );

    if (!response.ok) {
      throw new Error(`exchangerate.host error: ${response.status}`);
    }

    const data = await response.json();
    if (!data.rates?.[target]) {
      throw new Error(`Rate not found for ${base}/${target}`);
    }

    return data.rates[target];
  }

  private getFallbackRate(base: string, target: string): number {
    if (base === target) return 1;

    const baseRates = this.fallbackRates[base];
    if (baseRates?.[target]) {
      return baseRates[target];
    }

    // Try inverse
    const targetRates = this.fallbackRates[target];
    if (targetRates?.[base]) {
      return 1 / targetRates[base];
    }

    throw new AppError(`No fallback rate available for ${base}/${target}`, 500, 'FX_RATE_UNAVAILABLE');
  }

  private setCache(base: string, target: string, rate: number, source: 'wise' | 'stripe' | 'exchangerate' | 'manual'): void {
    // Evict oldest if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    const cacheKey = this.generateCacheKey(base, target);
    this.cache.set(cacheKey, {
      base,
      target,
      rate,
      timestamp: new Date(),
      source,
    });

    // Also cache inverse
    const inverseKey = this.generateCacheKey(target, base);
    this.cache.set(inverseKey, {
      base: target,
      target: base,
      rate: 1 / rate,
      timestamp: new Date(),
      source,
    });
  }

  async convert(
    amount: number,
    sourceCurrency: string,
    targetCurrency: string
  ): Promise<{ sourceAmount: number; targetAmount: number; rate: number; timestamp: Date }> {
    if (sourceCurrency === targetCurrency) {
      return {
        sourceAmount: amount,
        targetAmount: amount,
        rate: 1,
        timestamp: new Date(),
      };
    }

    const rate = await this.getRate(sourceCurrency, targetCurrency);
    return {
      sourceAmount: amount,
      targetAmount: Math.round(amount * rate * 100) / 100,
      rate,
      timestamp: new Date(),
    };
  }

  async getMultipleRates(base: string, targets: string[]): Promise<Record<string, number>> {
    const results: Record<string, number> = {};

    for (const target of targets) {
      try {
        results[target] = await this.getRate(base, target);
      } catch (error) {
        console.warn(`Failed to get rate for ${base}/${target}:`, error);
        results[target] = 0;
      }
    }

    return results;
  }

  async getHistoricalRate(
    base: string,
    target: string,
    date: Date
  ): Promise<number> {
    try {
      const dateStr = date.toISOString().split('T')[0];
      const response = await fetch(
        `https://api.exchangerate.host/${dateStr}?base=${base}&symbols=${target}`
      );

      if (!response.ok) {
        throw new Error(`Historical rate fetch failed: ${response.status}`);
      }

      const data = await response.json();
      if (!data.rates?.[target]) {
        throw new Error(`Historical rate not found`);
      }

      return data.rates[target];
    } catch (error) {
      console.warn('Historical rate fetch failed, using current rate:', error);
      return this.getRate(base, target);
    }
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheStats(): { size: number; maxSize: number; ttl: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      ttl: this.cacheTTL,
    };
  }

  setCacheTTL(ms: number): void {
    this.cacheTTL = ms;
  }

  setMaxCacheSize(size: number): void {
    this.maxCacheSize = size;
    // Evict if over new limit
    while (this.cache.size > this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
  }
}

export const fxRateService = new FxRateService();