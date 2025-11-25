/**
 * Currency-related constants
 */

export interface CurrencyInfo {
  readonly code: string;
  readonly name: string;
  readonly flag: string;
}

/**
 * Currency code to name mapping
 */
export const CURRENCY_NAMES: Readonly<Record<string, string>> = {
  USD: '미국 달러',
  EUR: '유로',
  JPY: '일본 엔',
  CNY: '중국 위안',
  GBP: '영국 파운드',
  AUD: '호주 달러',
  CAD: '캐나다 달러',
  CHF: '스위스 프랑',
  HKD: '홍콩 달러',
  SGD: '싱가포르 달러',
  THB: '태국 바트',
  TWD: '대만 달러',
  NZD: '뉴질랜드 달러',
  INR: '인도 루피',
  VND: '베트남 동',
  PHP: '필리핀 페소',
  MYR: '말레이시아 링깃',
  IDR: '인도네시아 루피아',
} as const;

/**
 * Currency flags emoji mapping
 */
export const CURRENCY_FLAGS: Readonly<Record<string, string>> = {
  USD: '🇺🇸',
  EUR: '🇪🇺',
  JPY: '🇯🇵',
  CNY: '🇨🇳',
  GBP: '🇬🇧',
  AUD: '🇦🇺',
  CAD: '🇨🇦',
  CHF: '🇨🇭',
  HKD: '🇭🇰',
  SGD: '🇸🇬',
  THB: '🇹🇭',
  TWD: '🇹🇼',
  NZD: '🇳🇿',
  INR: '🇮🇳',
  VND: '🇻🇳',
  PHP: '🇵🇭',
  MYR: '🇲🇾',
  IDR: '🇮🇩',
} as const;

/**
 * Main currencies to extract
 */
export const MAIN_CURRENCIES = ['USD', 'JPY', 'EUR', 'CNY', 'GBP', 'AUD'] as const;

/**
 * Default exchange rates for fallback
 */
export const DEFAULT_EXCHANGE_RATES: readonly CurrencyInfo[] = [
  { code: 'USD', name: '미국 달러', flag: '🇺🇸' },
  { code: 'JPY', name: '일본 엔 (100엔)', flag: '🇯🇵' },
  { code: 'EUR', name: '유로', flag: '🇪🇺' },
  { code: 'CNY', name: '중국 위안', flag: '🇨🇳' },
] as const;

/**
 * Get currency display name
 */
export const getCurrencyName = (code: string): string =>
  CURRENCY_NAMES[code] || code;

/**
 * Get currency flag
 */
export const getCurrencyFlag = (code: string): string =>
  CURRENCY_FLAGS[code] || '💱';
