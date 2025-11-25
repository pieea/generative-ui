/**
 * News parser - Extracts news articles from Daum search results
 */
import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';
import { SearchResultItem } from '@/types';
import { SELECTORS } from '@/constants';
import {
  extractText,
  extractImageUrl,
  extractUrl,
  generateId,
  isValidString,
} from './baseParser';

export interface NewsParserOptions {
  maxItems?: number;
}

const DEFAULT_OPTIONS: Required<NewsParserOptions> = {
  maxItems: 5,
};

/**
 * Parse news items from component
 */
export const parseNewsItems = (
  $comp: cheerio.Cheerio<AnyNode>,
  $: cheerio.CheerioAPI,
  options: NewsParserOptions = {}
): SearchResultItem[] => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const items: SearchResultItem[] = [];

  $comp.find(SELECTORS.NEWS.LIST).each((index, el) => {
    if (index >= opts.maxItems) return false; // Stop iteration

    const $item = $(el);

    // Extract title
    let title = extractText($item, SELECTORS.NEWS.TITLE);
    if (!title) {
      title = extractText($item, SELECTORS.NEWS.TITLE_ALT);
    }

    // Validate title
    if (!isValidString(title, 5)) return;

    // Extract description
    let description = extractText($item, SELECTORS.NEWS.DESCRIPTION);
    if (!description) {
      description = extractText($item, SELECTORS.NEWS.DESCRIPTION_ALT);
    }

    // Extract URL
    let url = extractUrl($item, SELECTORS.NEWS.URL);
    if (!url) {
      url = extractUrl($item, SELECTORS.LINK);
    }

    // Extract image
    let imageUrl = '';
    const $img = $item.find(SELECTORS.NEWS.IMAGE).first();
    if ($img.length) {
      imageUrl = extractImageUrl($img, $);
    }

    // Extract source (publisher)
    const source = extractText($item, SELECTORS.NEWS.SOURCE);

    // Extract timestamp
    let timestamp = extractText($item, SELECTORS.NEWS.TIMESTAMP);
    if (!timestamp) {
      timestamp = extractText($item, SELECTORS.NEWS.TIMESTAMP_ALT);
    }

    items.push({
      id: generateId('news', index),
      title,
      description: description || title,
      url,
      imageUrl: imageUrl || undefined,
      category: '뉴스',
      timestamp,
      metadata: { source },
    });
  });

  return items;
};

/**
 * Validate news item
 */
export const isValidNewsItem = (item: SearchResultItem): boolean => {
  return (
    isValidString(item.title, 5) &&
    item.category === '뉴스' &&
    !item.title.includes('관련 검색어')
  );
};
