/**
 * Base parser utilities
 */
import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';
import { IMAGE_ATTRS } from '@/constants';

/**
 * Safely extract text content from cheerio element
 */
export const extractText = (
  $elem: cheerio.Cheerio<AnyNode>,
  selector: string,
  fallbackSelector?: string
): string => {
  let text = $elem.find(selector).first().text().trim();
  if (!text && fallbackSelector) {
    text = $elem.find(fallbackSelector).first().text().trim();
  }
  return text;
};

/**
 * Extract image URL with lazy loading support
 */
export const extractImageUrl = (
  $img: cheerio.Cheerio<AnyNode>,
  $: cheerio.CheerioAPI
): string => {
  for (const attr of IMAGE_ATTRS) {
    const url = $img.attr(attr);
    if (url && !url.includes('data:image') && !url.includes('plazy')) {
      return url.startsWith('//') ? `https:${url}` : url;
    }
  }
  return '';
};

/**
 * Extract link URL from element
 */
export const extractUrl = (
  $elem: cheerio.Cheerio<AnyNode>,
  selector: string
): string => {
  const url = $elem.find(selector).first().attr('href') || '';
  return url;
};

/**
 * Parse number from text (remove non-numeric characters)
 */
export const parseNumber = (text: string): number | undefined => {
  const cleaned = text.replace(/[^0-9]/g, '');
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? undefined : num;
};

/**
 * Parse float from text (preserve decimals)
 */
export const parseFloat = (text: string): number | undefined => {
  const cleaned = text.replace(/[^0-9.]/g, '');
  const num = Number.parseFloat(cleaned);
  return isNaN(num) ? undefined : num;
};

/**
 * Generate unique ID
 */
export const generateId = (prefix: string, index: number): string =>
  `${prefix}-${Date.now()}-${index}`;

/**
 * Clean HTML tags from text
 */
export const cleanHtml = (text: string): string =>
  text.replace(/<[^>]+>/g, '').trim();

/**
 * Validate non-empty string
 */
export const isValidString = (str: string | undefined, minLength = 2): boolean =>
  Boolean(str && str.trim().length >= minLength);

/**
 * Fix protocol-relative URLs
 */
export const fixProtocolRelativeUrl = (url: string): string =>
  url.startsWith('//') ? `https:${url}` : url;

/**
 * Normalize URL for comparison
 */
export const normalizeUrl = (url: string): string =>
  url.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');

/**
 * Extract multiple values matching pattern
 */
export const extractAllMatches = (
  text: string,
  pattern: RegExp
): string[] => {
  const matches: string[] = [];
  let match;
  while ((match = pattern.exec(text)) !== null) {
    matches.push(match[1] || match[0]);
  }
  return matches;
};

/**
 * Safe JSON parse
 */
export const safeJsonParse = <T>(json: string, fallback: T): T => {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
};
