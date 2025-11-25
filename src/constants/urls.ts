/**
 * URL constants for Daum Search
 */

/**
 * Base URLs
 */
export const BASE_URL = 'https://search.daum.net/search' as const;

/**
 * Build Daum search URL
 */
export const buildDaumSearchUrl = (query: string): string => {
  const encodedQuery = encodeURIComponent(query);
  return `${BASE_URL}?w=tot&nil_mtopsearch=btn&DA=YZR&q=${encodedQuery}`;
};

/**
 * Build Daum image search URL
 */
export const buildDaumImageSearchUrl = (query: string): string => {
  const encodedQuery = encodeURIComponent(query);
  return `${BASE_URL}?w=img&nil_search=btn&DA=NTB&enc=utf8&q=${encodedQuery}`;
};

/**
 * HTTP headers for requests
 */
export const FETCH_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
} as const;
