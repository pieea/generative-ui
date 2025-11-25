/**
 * Type-specific extractors - Extract items for specific content types
 */
import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';
import { SearchResultItem } from '@/types';
import { COUNTRY_CODES } from '@/constants';

/**
 * Extract person/people items
 */
export const extractPersonItems = (
  $comp: cheerio.Cheerio<AnyNode>,
  $: cheerio.CheerioAPI
): SearchResultItem[] => {
  const items: SearchResultItem[] = [];

  const name = $comp
    .find('.tit_info, .txt_name, .tit_item')
    .first()
    .text()
    .trim();
  const imageUrl = $comp.find('img').first().attr('src') || '';
  const description = $comp
    .find('.desc, .txt_info, .cont_info')
    .first()
    .text()
    .trim();

  if (name) {
    const metadata: Record<string, any> = {};

    $comp.find('.list_info li, .info_item, .txt_cont').each((_, el) => {
      const text = $(el).text().trim();
      if (text.includes('출생'))
        metadata.birthDate = text.replace('출생', '').trim();
      if (text.includes('직업'))
        metadata.occupation = text.replace('직업', '').trim();
      if (text.includes('소속'))
        metadata.organization = text.replace('소속', '').trim();
      if (text.includes('학력'))
        metadata.education = text.replace('학력', '').trim();
    });

    items.push({
      id: `person-${Date.now()}`,
      title: name,
      description: description || `${name}에 대한 정보`,
      url: $comp.find('a').first().attr('href') || '',
      imageUrl: imageUrl.startsWith('//') ? `https:${imageUrl}` : imageUrl,
      category: '인물',
      metadata,
    });
  }

  return items;
};

/**
 * Extract location items
 */
export const extractLocationItems = (
  $comp: cheerio.Cheerio<AnyNode>,
  $: cheerio.CheerioAPI
): SearchResultItem[] => {
  const items: SearchResultItem[] = [];

  $comp.find('.wrap_cont, .item_place, .place_item, li').each((index, el) => {
    if (index >= 5) return;

    const $item = $(el);
    const title = $item.find('.tit_item, .name, .tit').first().text().trim();
    const address = $item.find('.txt_addr, .addr, .address').first().text().trim();
    const category = $item.find('.txt_category, .category').first().text().trim();
    const url = $item.find('a').first().attr('href') || '';
    const imageUrl = $item.find('img').first().attr('src') || '';
    const rating = $item.find('.txt_grade, .rating, .star').first().text().trim();

    if (title && title.length > 2) {
      const ratingMatch = rating.match(/[\d.]+/);
      const parsedRating = ratingMatch ? parseFloat(ratingMatch[0]) : undefined;

      items.push({
        id: `location-${Date.now()}-${index}`,
        title,
        description: address || category || `${title} 정보`,
        url,
        imageUrl: imageUrl.startsWith('//') ? `https:${imageUrl}` : imageUrl || undefined,
        category: category || '장소',
        metadata: {
          address,
          ...(parsedRating && { rating: parsedRating }),
        },
      });
    }
  });

  return items;
};

/**
 * Extract country information items
 */
export const extractCountryItems = (
  $comp: cheerio.Cheerio<AnyNode>,
  $: cheerio.CheerioAPI
): SearchResultItem[] => {
  const items: SearchResultItem[] = [];

  let countryName = $comp.find('.tit-g.clamp-g').first().text().trim();
  if (!countryName) {
    countryName = $comp.find('.tit_head, .tit_comp, h2, h3').first().text().trim();
  }
  if (!countryName) return items;

  console.log('[Country Extract] Found country name:', countryName);

  const countryCode = COUNTRY_CODES[countryName] || '';
  const metadata: Record<string, unknown> = { countryCode };

  // Extract sub info
  const subInfoTexts: string[] = [];
  $comp.find('.sub_header .txt-split, .conts-combo .txt-split').each((_, el) => {
    const text = $(el).text().trim();
    if (text) subInfoTexts.push(text);
  });

  if (subInfoTexts.length > 0) {
    if (subInfoTexts.length >= 2) {
      metadata.region = subInfoTexts[0];
      metadata.englishName = subInfoTexts[1];
    } else {
      metadata.region = subInfoTexts[0];
    }
  }

  // Extract structured data from dl.conts-richx
  $comp.find('dl.conts-richx').each((_, dl) => {
    const $dl = $(dl);
    let currentLabel = '';

    $dl.children().each((_, el) => {
      const $el = $(el);
      const tagName = el.tagName?.toLowerCase();

      if (tagName === 'dt') {
        currentLabel = $el.text().trim();
      } else if (tagName === 'dd' && currentLabel) {
        const value = $el.text().trim();
        console.log(`[Country Extract] ${currentLabel}: ${value}`);

        switch (currentLabel) {
          case '수도':
            metadata.capital = value;
            break;
          case '인구':
            metadata.population = value;
            break;
          case '면적':
            metadata.area = value;
            break;
          case 'GDP':
            metadata.gdp = value;
            break;
          case '언어':
            metadata.language = value;
            break;
          case '통화':
            metadata.currency = value;
            break;
          case '종교':
            metadata.religion = value;
            break;
          case '기후':
            metadata.climate = value;
            break;
          case '안전':
            metadata.safetyInfo = value;
            break;
        }
        currentLabel = '';
      }
    });
  });

  // Extract live info
  const liveInfo: Record<string, string> = {};
  $comp.find('.c-carousel .c-item-content').each((_, item) => {
    const $item = $(item);
    const label = $item.find('.tit_info').text().trim();
    const value = $item.find('.txt_info').first().text().trim();
    const subValue = $item.find('.txt_subinfo').text().trim();

    if (label && value) {
      switch (label) {
        case '현지시간':
          liveInfo.localTime = value;
          liveInfo.timeDiff = subValue;
          break;
        case '통화':
          liveInfo.exchangeRate = value;
          liveInfo.currencyUnit = subValue;
          break;
        case '날씨':
          liveInfo.weather = value;
          liveInfo.weatherDesc = subValue;
          break;
      }
    }
  });

  if (Object.keys(liveInfo).length > 0) {
    metadata.liveInfo = liveInfo;
  }

  // Extract description
  let description = $comp.find('q-ellipsis span[slot="text"]').text().trim();
  if (!description) {
    description = $comp.find('.wrap_desc').text().trim();
  }
  if (!description) {
    description = $comp.find('.desc, .txt_info').first().text().trim();
  }

  // Extract flag image
  let flagUrl =
    $comp.find('.badge_img img').attr('data-original-src') ||
    $comp.find('.badge_img img').attr('src') ||
    '';
  if (!flagUrl) {
    flagUrl =
      $comp.find('img').first().attr('data-original-src') ||
      $comp.find('img').first().attr('src') ||
      '';
  }

  const url = $comp.find('.c-tit-exact a').first().attr('href') || '';
  const fullUrl = url.startsWith('//') ? `https:${url}` : url;

  console.log('[Country Extract] Metadata:', JSON.stringify(metadata, null, 2));

  items.push({
    id: `country-${Date.now()}`,
    title: countryName,
    description: description || `${countryName}에 대한 정보`,
    url: fullUrl,
    imageUrl: flagUrl.startsWith('//') ? `https:${flagUrl}` : flagUrl || undefined,
    category: '국가',
    metadata,
  });

  return items;
};

/**
 * Extract event/festival items
 */
export const extractEventItems = (
  $comp: cheerio.Cheerio<AnyNode>,
  $: cheerio.CheerioAPI
): SearchResultItem[] => {
  const items: SearchResultItem[] = [];

  $comp
    .find(
      '.c-item-content, .c-list-basic > li, .wrap_cont, li[data-docid], article'
    )
    .each((index, el) => {
      if (index >= 10) return;

      const $item = $(el);

      let title = $item
        .find('.tit-g.clamp-g, .item-title .tit-g, .tit_news, .tit')
        .first()
        .text()
        .trim();
      if (!title) {
        title = $item
          .find('a.link_txt, h3, h4, .txt_item')
          .first()
          .text()
          .trim();
      }

      let description = $item
        .find('.conts-desc, .item-contents p, .desc, .txt_sub')
        .first()
        .text()
        .trim();
      if (!description) {
        description = $item.find('.txt_info').first().text().trim();
      }

      let url = $item.find('.item-title a, a.wrap_cont, a').first().attr('href') || '';

      let imageUrl =
        $item.find('img').first().attr('data-original-src') ||
        $item.find('img').first().attr('src') ||
        '';
      if (imageUrl.startsWith('//')) imageUrl = `https:${imageUrl}`;
      if (imageUrl.includes('data:image/gif')) {
        imageUrl = $item.find('img').first().attr('data-original-src') || '';
        if (imageUrl.startsWith('//')) imageUrl = `https:${imageUrl}`;
      }

      let timestamp = $item
        .find('.gem-subinfo .txt_info, .txt_date, .date, .time')
        .first()
        .text()
        .trim();
      if (!timestamp) {
        const textContent = $item.text();
        const dateMatch = textContent.match(
          /\d{1,2}\.\d{1,2}[~\-]\d{1,2}|\d{4}\.\d{1,2}\.\d{1,2}/
        );
        if (dateMatch) timestamp = dateMatch[0];
      }

      const location = $item
        .find('.txt_place, .place, .location, .txt_addr')
        .first()
        .text()
        .trim();
      const source = $item
        .find('.c-tit-doc .tit_item, .info_news, .txt_cp, .txt_source')
        .first()
        .text()
        .trim();
      const category = $item
        .find('.txt_category, .tag, .badge')
        .first()
        .text()
        .trim();

      const combinedText = (title + ' ' + description).toLowerCase();
      const eventKeywords = [
        '축제',
        '페스티벌',
        '행사',
        '공연',
        '전시',
        '박람회',
        '마라톤',
        '콘서트',
        '불꽃',
        '개막',
        '폐막',
        '일정',
      ];
      const isEventRelated = eventKeywords.some(kw => combinedText.includes(kw));

      if (title && title.length > 3 && (isEventRelated || index < 5)) {
        items.push({
          id: `event-${Date.now()}-${index}`,
          title,
          description: description || title,
          url,
          imageUrl: imageUrl || undefined,
          category: category || '축제/행사',
          timestamp,
          metadata: {
            source,
            ...(location && { location }),
            isEventRelated,
          },
        });
      }
    });

  // Sort event-related items first
  items.sort((a, b) => {
    const aEvent = a.metadata?.isEventRelated ? 1 : 0;
    const bEvent = b.metadata?.isEventRelated ? 1 : 0;
    return bEvent - aEvent;
  });

  return items.slice(0, 8);
};

/**
 * Extract general web items
 */
export const extractWebItems = (
  $comp: cheerio.Cheerio<AnyNode>,
  $: cheerio.CheerioAPI
): SearchResultItem[] => {
  const items: SearchResultItem[] = [];

  $comp.find('.wrap_cont, .item, li, article').each((index, el) => {
    if (index >= 5) return;

    const $item = $(el);
    const title = $item
      .find('.tit, .tit_item, a.link_txt, h3, h4')
      .first()
      .text()
      .trim();
    const description = $item.find('.desc, .txt_info, p').first().text().trim();
    const url = $item.find('a').first().attr('href') || '';
    const imageUrl = $item.find('img').first().attr('src') || '';
    const source = $item.find('.info, .source, .txt_cp').first().text().trim();

    if (title && title.length > 5 && !title.includes('관련 검색어')) {
      items.push({
        id: `web-${Date.now()}-${index}`,
        title,
        description: description || title,
        url,
        imageUrl: imageUrl.startsWith('//') ? `https:${imageUrl}` : imageUrl || undefined,
        category: source || '웹',
        timestamp: new Date().toLocaleDateString('ko-KR'),
      });
    }
  });

  return items;
};
