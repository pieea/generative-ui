/**
 * Exchange rate parser - Extracts currency exchange rates
 */
import { SearchResultItem } from '@/types';
import {
  MAIN_CURRENCIES,
  getCurrencyName,
  DEFAULT_EXCHANGE_RATES,
} from '@/constants';
import { generateId, parseFloat } from './baseParser';

export interface ExchangeRateData {
  code: string;
  currentRate?: string;
  cashBuy?: string;
  cashSell?: string;
  onlineSend?: string;
  onlineRcv?: string;
  currentRatio?: string;
  currentRatioPercent?: string;
  currentUpDownTxt?: string;
  country?: string;
  unit?: string;
  url?: string;
}

/**
 * Extract exchange rate from HTML using nationMap pattern
 */
export const extractExchangeRateFromHtml = (
  html: string
): SearchResultItem[] => {
  const items: SearchResultItem[] = [];

  MAIN_CURRENCIES.forEach((code, index) => {
    const pattern = new RegExp(
      `nationMap\\['${code}'\\]\\s*=\\s*\\{([^}]+)\\}`,
      's'
    );
    const match = html.match(pattern);

    if (!match) return;

    const dataBlock = match[1];

    const extractValue = (key: string): string => {
      const valueMatch = dataBlock.match(
        new RegExp(`${key}\\s*:\\s*'([^']*)'`)
      );
      return valueMatch ? valueMatch[1] : '';
    };

    const rateStr = extractValue('rate');
    const baseRate = parseFloat(rateStr.replace(/,/g, '')) || 0;
    if (baseRate === 0) return;

    const change = parseFloat(extractValue('currentRatio').replace(/,/g, '')) || 0;
    const changePercentStr = extractValue('currentRatioPercent').replace('%', '');
    const changePercent = parseFloat(changePercentStr) || 0;
    const cashBuy = parseFloat(extractValue('cashBuy').replace(/,/g, '')) || 0;
    const cashSell = parseFloat(extractValue('cashSell').replace(/,/g, '')) || 0;
    const onlineSend = parseFloat(extractValue('onlineSend').replace(/,/g, '')) || 0;
    const onlineRcv = parseFloat(extractValue('onlineRcv').replace(/,/g, '')) || 0;
    const country = extractValue('country');
    const unit = extractValue('unit');
    const upDownTxt = extractValue('currentUpDownTxt');

    let displayName = getCurrencyName(code);
    if (country && unit && country !== unit) {
      displayName = `${country} ${unit}`;
    } else if (country) {
      displayName = country;
    }

    // JPY는 100엔 기준
    const displayRate = code === 'JPY' && baseRate < 100 ? baseRate * 100 : baseRate;

    const trend =
      upDownTxt === '하락'
        ? 'down'
        : upDownTxt === '상승'
        ? 'up'
        : change < 0
        ? 'down'
        : change > 0
        ? 'up'
        : 'unchanged';

    items.push({
      id: generateId('exchange', index),
      title: code,
      description: code === 'JPY' ? '일본 엔 (100엔)' : displayName,
      category: '환율',
      url: extractValue('url') || undefined,
      metadata: {
        currencyCode: code,
        currencyName: code === 'JPY' ? '일본 엔 (100엔)' : displayName,
        baseRate: displayRate,
        cashBuy: cashBuy || undefined,
        cashSell: cashSell || undefined,
        sendRate: onlineSend || undefined,
        receiveRate: onlineRcv || undefined,
        change,
        changePercent,
        trend,
      },
    });
  });

  return items;
};

/**
 * Create fallback exchange rate items
 */
export const createFallbackExchangeRates = (): SearchResultItem[] => {
  console.log('[Exchange Rate] Using fallback placeholder data');

  return DEFAULT_EXCHANGE_RATES.map((currency, index) => ({
    id: generateId('exchange-fallback', index),
    title: currency.code,
    description: currency.name,
    category: '환율',
    metadata: {
      currencyCode: currency.code,
      currencyName: currency.name,
      // Note: Real rates should come from API
    },
  }));
};

/**
 * Validate exchange rate item
 */
export const isValidExchangeItem = (item: SearchResultItem): boolean => {
  return (
    item.category === '환율' &&
    item.metadata?.currencyCode !== undefined
  );
};
