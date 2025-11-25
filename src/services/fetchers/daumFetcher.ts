/**
 * Daum Search Fetcher - Specialized fetchers for Daum search pages
 */
import { buildDaumSearchUrl, buildDaumImageSearchUrl } from '@/constants';
import { fetchHtml, fetchWithRetry } from './httpFetcher';

export interface DaumFetchOptions {
  useRetry?: boolean;
  maxRetries?: number;
  timeout?: number;
}

/**
 * Fetch Daum general search results
 */
export const fetchDaumSearch = async (
  query: string,
  options: DaumFetchOptions = {}
): Promise<string> => {
  const { useRetry = false, maxRetries = 2, timeout } = options;
  const url = buildDaumSearchUrl(query);

  console.log('[Daum Fetcher] Fetching search results for:', query);

  if (useRetry) {
    return fetchWithRetry(url, { timeout }, maxRetries);
  }

  return fetchHtml(url, { timeout });
};

/**
 * Fetch Daum image search results
 */
export const fetchDaumImageSearch = async (
  query: string,
  options: DaumFetchOptions = {}
): Promise<string> => {
  const { useRetry = false, maxRetries = 2, timeout } = options;
  const url = buildDaumImageSearchUrl(query);

  console.log('[Daum Fetcher] Fetching image search results for:', query);

  if (useRetry) {
    return fetchWithRetry(url, { timeout }, maxRetries);
  }

  return fetchHtml(url, { timeout });
};
