/**
 * Shopping parser - Extracts product items from Daum search results
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
  parseNumber,
  parseFloat,
} from './baseParser';

export interface ShoppingParserOptions {
  maxItems?: number;
}

const DEFAULT_OPTIONS: Required<ShoppingParserOptions> = {
  maxItems: 10,
};

/**
 * Parse shopping items from SNP (쇼핑하우) component
 */
const parseShoppingHauItems = (
  $comp: cheerio.Cheerio<AnyNode>,
  $: cheerio.CheerioAPI,
  maxItems: number
): SearchResultItem[] => {
  const items: SearchResultItem[] = [];

  $comp.find(SELECTORS.SHOPPING.SNP.LIST).each((index, el) => {
    if (index >= maxItems) return false;

    const $item = $(el);

    const title = extractText($item, SELECTORS.SHOPPING.SNP.TITLE);
    if (!isValidString(title, 3)) return;

    const priceText = extractText($item, SELECTORS.SHOPPING.SNP.PRICE);
    const price = parseNumber(priceText);
    if (!price) return;

    const url = extractUrl($item, SELECTORS.SHOPPING.SNP.LINK);

    const $img = $item.find(SELECTORS.SHOPPING.SNP.IMAGE).first();
    const imageUrl = $img.length ? extractImageUrl($img, $) : '';

    const ratingText = extractText($item, SELECTORS.SHOPPING.SNP.RATING);
    const rating = ratingText ? parseFloat(ratingText) : undefined;

    const reviewText = extractText($item, SELECTORS.SHOPPING.SNP.REVIEW);
    const reviewMatch = reviewText.match(/[\d,]+/);
    const reviewCount = reviewMatch
      ? parseNumber(reviewMatch[0])
      : undefined;

    const deliveryText = extractText($item, SELECTORS.SHOPPING.SNP.DELIVERY);
    const delivery = deliveryText === '무료' ? '무료배송' : deliveryText;

    // Extract seller count
    const sellerCountText = $item
      .find('.txt_info')
      .filter((_, el) => $(el).text().includes('판매처'))
      .text()
      .trim();
    const sellerMatch = sellerCountText.match(/[\d,]+/);
    const sellerCount = sellerMatch ? parseNumber(sellerMatch[0]) : undefined;

    const description = sellerCount
      ? `최저가 ${price.toLocaleString()}원 (${sellerCount}개 판매처)`
      : `최저가 ${price.toLocaleString()}원`;

    items.push({
      id: generateId('product-snp', index),
      title,
      description,
      url,
      imageUrl: imageUrl || undefined,
      category: '상품',
      metadata: {
        price,
        ...(rating && { rating }),
        ...(reviewCount && { reviewCount }),
        ...(delivery && { delivery }),
        ...(sellerCount && { sellerCount }),
        source: '쇼핑하우',
      },
    });
  });

  return items;
};

/**
 * Parse shopping items from NSJ/0NS (네이버쇼핑) component
 */
const parseNaverShoppingItems = (
  $comp: cheerio.Cheerio<AnyNode>,
  $: cheerio.CheerioAPI,
  maxItems: number
): SearchResultItem[] => {
  const items: SearchResultItem[] = [];

  $comp.find(SELECTORS.SHOPPING.NSJ.LIST).each((index, el) => {
    if (index >= maxItems) return false;

    const $item = $(el);
    const $content = $item.find(SELECTORS.SHOPPING.NSJ.CONTENT);
    if (
      $content.length === 0 &&
      !$item.find('.txt_price, .cont_price').length
    )
      return;

    let title = extractText($item, SELECTORS.SHOPPING.NSJ.TITLE);
    if (!title) {
      title = extractText($item, SELECTORS.SHOPPING.NSJ.TITLE_ALT);
    }
    if (!title) {
      title = $item.find('a .wrap_cont .item-title').first().text().trim();
    }
    if (!isValidString(title, 3)) return;

    const priceText = extractText($item, SELECTORS.SHOPPING.NSJ.PRICE);
    const price = parseNumber(priceText);
    if (!price) return;

    let url = $item
      .find(SELECTORS.SHOPPING.NSJ.LINK)
      .first()
      .attr('href') || '';
    if (!url) {
      url = extractUrl($item, SELECTORS.LINK);
    }

    const $img = $item.find(SELECTORS.SHOPPING.NSJ.IMAGE).first();
    const imageUrl = $img.length ? extractImageUrl($img, $) : '';

    const mall = extractText($item, SELECTORS.SHOPPING.NSJ.MALL);
    const delivery = extractText($item, SELECTORS.SHOPPING.NSJ.DELIVERY);

    const reviewText = extractText($item, SELECTORS.SHOPPING.NSJ.REVIEW);
    const reviewMatch = reviewText.match(/[\d,]+/);
    const reviewCount = reviewMatch ? parseNumber(reviewMatch[0]) : undefined;

    const description = delivery
      ? `${mall || '쇼핑몰'}에서 판매 (${delivery})`
      : `${mall || '쇼핑몰'}에서 판매`;

    items.push({
      id: generateId('product', index),
      title,
      description,
      url,
      imageUrl: imageUrl || undefined,
      category: '상품',
      metadata: {
        price,
        brand: mall,
        ...(reviewCount && { reviewCount }),
        ...(delivery && { delivery }),
      },
    });
  });

  return items;
};

/**
 * Parse fallback shopping keyword items
 */
const parseFallbackItems = (
  $comp: cheerio.Cheerio<AnyNode>,
  $: cheerio.CheerioAPI,
  maxItems: number
): SearchResultItem[] => {
  const items: SearchResultItem[] = [];

  $comp.find('.wrap_thumb, .item_link').each((index, el) => {
    if (index >= maxItems) return false;

    const $item = $(el);
    const title = extractText($item, '.txt_item, .tit_item');
    if (!isValidString(title, 2)) return;

    let url = $item.attr('href') || '';
    if (!url) {
      url = extractUrl($item, SELECTORS.LINK);
    }
    if (url.startsWith('?')) {
      url = `https://search.daum.net/search${url}`;
    }

    const $img = $item.find(SELECTORS.IMAGE).first();
    const imageUrl = $img.length ? extractImageUrl($img, $) : '';

    items.push({
      id: generateId('product-keyword', index),
      title,
      description: '쇼핑 키워드',
      url,
      imageUrl: imageUrl || undefined,
      category: '상품',
      metadata: {},
    });
  });

  return items;
};

/**
 * Main shopping parser
 */
export const parseShoppingItems = (
  $comp: cheerio.Cheerio<AnyNode>,
  $: cheerio.CheerioAPI,
  options: ShoppingParserOptions = {}
): SearchResultItem[] => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const dispAttr = $comp.attr('disp-attr') || '';

  // Try SNP (쇼핑하우) first
  if (dispAttr === 'SNP' || $comp.find('.list_shopping').length > 0) {
    const items = parseShoppingHauItems($comp, $, opts.maxItems);
    if (items.length > 0) return items;
  }

  // Try NSJ/0NS (네이버쇼핑)
  const items = parseNaverShoppingItems($comp, $, opts.maxItems);
  if (items.length > 0) return items;

  // Fallback to keyword items
  return parseFallbackItems($comp, $, 6);
};

/**
 * Validate shopping item
 */
export const isValidShoppingItem = (item: SearchResultItem): boolean => {
  return (
    isValidString(item.title, 3) &&
    item.category === '상품' &&
    item.metadata?.price !== undefined
  );
};
