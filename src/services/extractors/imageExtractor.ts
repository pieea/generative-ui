/**
 * Image Extractor - Extract images from Daum image search
 */
import * as cheerio from 'cheerio';
import { SearchResultItem } from '@/types';
import { generateId } from '@/services/parsers/baseParser';

interface ImageData {
  url?: string;
  oimgurl?: string;
  org_title?: string;
  docurl?: string;
  width?: number;
  height?: number;
  display_cpname?: string;
}

/**
 * Extract image data using regex patterns
 */
const extractImageDataWithRegex = (html: string): ImageData[] => {
  const imageData: ImageData[] = [];

  // Pattern 1: oimgurl after url
  const imageObjectPattern =
    /\{\s*ndid64:\s*"[^"]+",[\s\S]*?oimgurl:\s*"([^"]+)"[\s\S]*?org_title:\s*"([^"]*)"[\s\S]*?docurl:\s*"([^"]*)"[\s\S]*?url:\s*"([^"]+)"[\s\S]*?display_cpname:\s*"([^"]*)"/g;

  // Pattern 2: url before oimgurl
  const altImagePattern =
    /\{\s*ndid64:\s*"[^"]+",\s*docid:[^,]+,\s*[^}]*url:\s*"([^"]+)"[^}]*oimgurl:\s*"([^"]+)"[^}]*org_title:\s*"([^"]*)"[^}]*docurl:\s*"([^"]*)"[^}]*display_cpname:\s*"([^"]*)"/g;

  // Pattern 3: Simple pattern with just url and oimgurl
  const simplePattern =
    /url:\s*"(https?:\/\/[^"]+)"[^}]*oimgurl:\s*"(https?:\/\/[^"]+)"/g;

  let match;

  // Try pattern 1
  while ((match = imageObjectPattern.exec(html)) !== null && imageData.length < 20) {
    const [, oimgurl, org_title, docurl, url, display_cpname] = match;
    imageData.push({
      url,
      oimgurl,
      org_title: org_title.replace(/<[^>]+>/g, ''),
      docurl,
      display_cpname: display_cpname.replace(/&gt;/g, '>'),
    });
  }

  // Try pattern 2 if pattern 1 failed
  if (imageData.length === 0) {
    while ((match = altImagePattern.exec(html)) !== null && imageData.length < 20) {
      const [, url, oimgurl, org_title, docurl, display_cpname] = match;
      imageData.push({
        url,
        oimgurl,
        org_title: org_title.replace(/<[^>]+>/g, ''),
        docurl,
        display_cpname: display_cpname.replace(/&gt;/g, '>'),
      });
    }
  }

  // Try pattern 3 if both failed
  if (imageData.length === 0) {
    while ((match = simplePattern.exec(html)) !== null && imageData.length < 20) {
      const [, url, oimgurl] = match;
      if (url.includes('kakaocdn') || url.includes('daumcdn')) {
        imageData.push({ url, oimgurl });
      }
    }
  }

  return imageData;
};

/**
 * Extract images from HTML using cheerio (fallback)
 */
const extractImagesWithCheerio = (html: string): SearchResultItem[] => {
  const items: SearchResultItem[] = [];
  const $ = cheerio.load(html);

  $('.thumb_img, .img_thumb, .c-item-content img, .wrap_thumb img').each(
    (index, el) => {
      if (index >= 20) return;

      const $img = $(el);
      const imageUrl =
        $img.attr('data-original-src') || $img.attr('src') || '';
      const title = $img.attr('alt') || `이미지 ${index + 1}`;
      const $link = $img.closest('a');
      const docUrl = $link.attr('href') || '';

      if (
        imageUrl &&
        !imageUrl.includes('data:image') &&
        !imageUrl.includes('plazy')
      ) {
        items.push({
          id: generateId('image-fallback', index),
          title,
          description: '이미지',
          url: docUrl,
          imageUrl: imageUrl.startsWith('//') ? `https:${imageUrl}` : imageUrl,
          category: '이미지',
          metadata: {},
        });
      }
    }
  );

  return items;
};

/**
 * Convert image data to SearchResultItem
 */
const convertToSearchResultItems = (imageData: ImageData[]): SearchResultItem[] => {
  const items: SearchResultItem[] = [];

  for (let index = 0; index < Math.min(imageData.length, 20); index++) {
    const img = imageData[index];
    const title = img.org_title || `이미지 ${index + 1}`;
    const imageUrl = img.oimgurl || img.url;
    const thumbnailUrl = img.url;

    if (!imageUrl) continue;

    items.push({
      id: generateId('image', index),
      title,
      description: img.display_cpname ? `출처: ${img.display_cpname}` : '이미지',
      url: img.docurl || '',
      imageUrl: imageUrl.startsWith('//') ? `https:${imageUrl}` : imageUrl,
      category: '이미지',
      metadata: {
        thumbnailUrl: thumbnailUrl?.startsWith('//')
          ? `https:${thumbnailUrl}`
          : thumbnailUrl,
        originalUrl: img.oimgurl?.startsWith('//')
          ? `https:${img.oimgurl}`
          : img.oimgurl,
        width: img.width,
        height: img.height,
        source: img.display_cpname,
      },
    });
  }

  return items;
};

/**
 * Extract image items from Daum image search HTML
 */
export const extractImageItems = (html: string): SearchResultItem[] => {
  try {
    // Try regex-based extraction first
    const imageData = extractImageDataWithRegex(html);

    console.log(
      `[Image Extractor] Extracted ${imageData.length} images using regex patterns`
    );

    if (imageData.length > 0) {
      return convertToSearchResultItems(imageData);
    }

    console.log('[Image Extractor] Regex failed, trying cheerio fallback');
    return extractImagesWithCheerio(html);
  } catch (error) {
    console.error('[Image Extractor] Error:', error);
    return [];
  }
};
