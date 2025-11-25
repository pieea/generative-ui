/**
 * HTTP Fetcher - Handles all HTTP requests to Daum search
 */

/**
 * Default headers for Daum search requests
 */
const DEFAULT_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
} as const;

export interface FetchOptions {
  headers?: Record<string, string>;
  timeout?: number;
}

/**
 * Fetch HTML from URL with default headers
 */
export const fetchHtml = async (
  url: string,
  options: FetchOptions = {}
): Promise<string> => {
  const { headers = {}, timeout } = options;

  console.log('[HTTP Fetcher] Fetching:', url);

  try {
    const controller = new AbortController();
    const timeoutId = timeout
      ? setTimeout(() => controller.abort(), timeout)
      : undefined;

    const response = await fetch(url, {
      headers: {
        ...DEFAULT_HEADERS,
        ...headers,
      },
      signal: controller.signal,
    });

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    console.log(`[HTTP Fetcher] Success: ${html.length} bytes`);
    return html;
  } catch (error) {
    console.error('[HTTP Fetcher] Error:', error);
    throw error;
  }
};

/**
 * Fetch with retry logic
 */
export const fetchWithRetry = async (
  url: string,
  options: FetchOptions = {},
  maxRetries = 2
): Promise<string> => {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`[HTTP Fetcher] Retry attempt ${attempt}/${maxRetries}`);
        // Wait before retry (exponential backoff)
        await new Promise(resolve =>
          setTimeout(resolve, Math.pow(2, attempt) * 500)
        );
      }

      return await fetchHtml(url, options);
    } catch (error) {
      lastError = error as Error;
      if (attempt === maxRetries) {
        break;
      }
    }
  }

  throw lastError || new Error('Fetch failed after retries');
};
