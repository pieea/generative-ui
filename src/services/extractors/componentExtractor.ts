/**
 * Component Extractor - Extracts components from Daum search HTML
 */
import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';
import { SearchResultItem } from '@/types';
import {
  parseNewsItems,
  parseShoppingItems,
  extractExchangeRateFromHtml,
  createFallbackExchangeRates,
} from '@/services/parsers';
import {
  extractPersonItems,
  extractLocationItems,
  extractCountryItems,
  extractEventItems,
  extractWebItems,
} from './typeExtractors';

export interface DaumSearchComponent {
  type: string;
  title: string;
  items: SearchResultItem[];
  raw: string;
}

/**
 * Detect component type from DOM element
 */
const detectComponentType = (
  $comp: cheerio.Cheerio<AnyNode>,
  $: cheerio.CheerioAPI
): string => {
  const className = $comp.attr('class') || '';
  const dataType = $comp.attr('data-type') || '';
  const dispAttr = $comp.attr('disp-attr') || '';
  const id = $comp.attr('id') || '';
  const combined = (className + ' ' + dataType + ' ' + id + ' ' + dispAttr).toLowerCase();

  // Section title
  const sectionTitle = $comp
    .find('.tit_comp, .tit_head, .tit_g, h3, h2')
    .first()
    .text()
    .toLowerCase();
  const allText = combined + ' ' + sectionTitle;

  // disp-attr based detection (most accurate)
  if (dispAttr === 'PRF') return 'people';
  if (dispAttr === 'DNS') return 'news';
  if (dispAttr === 'SNY' || dispAttr === '0NS' || dispAttr === 'SNP')
    return 'products';
  if (dispAttr === 'NSJ' || dispAttr === '0SC') return 'products';
  if (dispAttr === 'IIM') return 'images';
  if (dispAttr === 'VOI') return 'videos';
  if (dispAttr === 'Z6T') return 'exchange';
  if (dispAttr === '3DV') return 'country';
  if (dispAttr === 'TCS') return 'events';
  if (dispAttr === 'GG2') return 'locations';
  if (dispAttr === 'WMD') return 'weather';
  if (dispAttr === 'TWA' || dispAttr === 'TWD') return 'web';

  // ID based detection
  if (id === 'tcsColl' || id === 'tcscoll') return 'events';

  // Text based detection (fallback)
  if (
    allText.includes('person') ||
    allText.includes('인물') ||
    allText.includes('프로필')
  )
    return 'people';
  if (allText.includes('news') || allText.includes('뉴스')) return 'news';
  if (
    allText.includes('place') ||
    allText.includes('장소') ||
    allText.includes('맛집') ||
    allText.includes('지도')
  )
    return 'locations';
  if (allText.includes('weather') || allText.includes('날씨')) return 'weather';
  if (
    allText.includes('환율') ||
    allText.includes('exchange') ||
    allText.includes('달러') ||
    allText.includes('엔화')
  )
    return 'exchange';
  if (allText.includes('image') || allText.includes('이미지')) return 'images';
  if (allText.includes('video') || allText.includes('동영상')) return 'videos';
  if (allText.includes('blog') || allText.includes('블로그')) return 'blog';
  if (allText.includes('cafe') || allText.includes('카페글')) return 'cafe';
  if (allText.includes('web') || allText.includes('웹문서')) return 'web';
  if (allText.includes('지식') || allText.includes('답변')) return 'knowledge';

  return 'mixed';
};

/**
 * Extract items based on component type
 */
const extractItemsByType = (
  type: string,
  $comp: cheerio.Cheerio<AnyNode>,
  $: cheerio.CheerioAPI
): SearchResultItem[] => {
  switch (type) {
    case 'people':
      return extractPersonItems($comp, $);
    case 'news':
      return parseNewsItems($comp, $);
    case 'products':
      return parseShoppingItems($comp, $);
    case 'locations':
      return extractLocationItems($comp, $);
    case 'country':
      return extractCountryItems($comp, $);
    case 'events':
      return extractEventItems($comp, $);
    default:
      return extractWebItems($comp, $);
  }
};

/**
 * Extract image URLs from component
 */
const extractImageUrls = (
  $comp: cheerio.Cheerio<AnyNode>,
  $: cheerio.CheerioAPI,
  maxUrls = 5
): string[] => {
  const imageUrls: string[] = [];

  $comp.find('img').each((_, img) => {
    const src =
      $(img).attr('data-original-src') || $(img).attr('src') || '';
    if (src && !src.includes('plazy.svg') && !src.includes('icon')) {
      const fullSrc = src.startsWith('//') ? `https:${src}` : src;
      if (!imageUrls.includes(fullSrc)) {
        imageUrls.push(fullSrc);
      }
    }
  });

  return imageUrls.slice(0, maxUrls);
};

/**
 * Extract link URLs from component
 */
const extractLinkUrls = (
  $comp: cheerio.Cheerio<AnyNode>,
  $: cheerio.CheerioAPI,
  maxUrls = 3
): string[] => {
  const linkUrls: string[] = [];

  $comp.find('a[href]').each((_, a) => {
    const href = $(a).attr('href') || '';
    if (href && href.startsWith('http')) {
      linkUrls.push(href);
    }
  });

  return linkUrls.slice(0, maxUrls);
};

/**
 * Build raw content string for component
 */
const buildRawContent = (
  $comp: cheerio.Cheerio<AnyNode>,
  $: cheerio.CheerioAPI
): string => {
  const rawText = $comp
    .text()
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 500);
  const imageUrls = extractImageUrls($comp, $);
  const linkUrls = extractLinkUrls($comp, $);

  return `${rawText}\n[이미지URLs]: ${imageUrls.join(', ')}\n[링크URLs]: ${linkUrls.join(', ')}`;
};

/**
 * Extract special components (exchange, events)
 */
const extractSpecialComponents = (
  $: cheerio.CheerioAPI,
  html: string,
  query: string
): DaumSearchComponent[] => {
  const components: DaumSearchComponent[] = [];

  // Exchange rate component (only from HTML, no fallback)
  const exchangeItems = extractExchangeRateFromHtml(html);

  if (exchangeItems.length > 0) {
    components.push({
      type: 'exchange',
      title: '실시간 환율',
      items: exchangeItems,
      raw: `환율 정보: ${exchangeItems.map(i => `${i.title}=${i.metadata?.baseRate}`).join(', ')}`,
    });
  }

  // Events/Festival component
  const $tcsColl = $('#tcsColl, [disp-attr="TCS"]');
  if ($tcsColl.length > 0) {
    console.log('[Component Extractor] Found TCS collection');
    const items = extractEventItems($tcsColl, $);
    const rawText = $tcsColl
      .text()
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 1000);
    const imageUrls = extractImageUrls($tcsColl, $);

    components.push({
      type: 'events',
      title: '축제/일정 정보',
      items,
      raw: `${rawText}\n[이미지URLs]: ${imageUrls.join(', ')}`,
    });
  }

  return components;
};

/**
 * Extract all components from HTML
 */
export const extractComponents = (
  html: string,
  query: string
): DaumSearchComponent[] => {
  const $ = cheerio.load(html);
  const components: DaumSearchComponent[] = [];

  // Extract special components first
  components.push(...extractSpecialComponents($, html, query));

  // Extract g_comp components
  $('.g_comp').each((index, element) => {
    const $comp = $(element);
    const className = $comp.attr('class') || '';
    const dataType = $comp.attr('data-type') || '';

    // Skip related search keywords
    if (
      className.includes('relate') ||
      dataType.includes('relate') ||
      $comp.find('.tit_relate').length > 0 ||
      $comp.text().includes('관련 검색어')
    ) {
      return;
    }

    const type = detectComponentType($comp, $);
    const sectionTitle =
      $comp.find('.tit_comp, .tit_head, .tit_g, h3, h2').first().text().trim() ||
      type;

    // Extract items by type
    const items = extractItemsByType(type, $comp, $);

    // Build raw content
    const raw = buildRawContent($comp, $);

    if (items.length > 0 || raw.length > 30) {
      // Add source intent to each item
      items.forEach(item => {
        item.metadata = { ...item.metadata, sourceIntent: type };
      });

      components.push({
        type,
        title: sectionTitle,
        items,
        raw,
      });
    }
  });

  return components;
};
