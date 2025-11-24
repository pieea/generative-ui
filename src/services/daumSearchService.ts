import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';
import OpenAI from 'openai';
import { SearchIntent } from './queryRewriteService';
import { SearchResultItem } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 다음 검색 결과 컴포넌트
export interface DaumSearchComponent {
  type: string;
  title: string;
  items: SearchResultItem[];
  raw: string;
}

// 검색 엔진 분석 결과
export interface SearchEngineAnalysis {
  query: string;
  components: DaumSearchComponent[];
  allItems: SearchResultItem[];
  llmExtractedItems: SearchResultItem[];  // LLM이 추출한 구조화 데이터
  primaryIntent: SearchIntent;
  secondaryIntent?: SearchIntent;
  reasoning: string;
}

// 다음 검색 URL 생성
function buildDaumSearchUrl(query: string): string {
  const encodedQuery = encodeURIComponent(query);
  return `https://search.daum.net/search?w=tot&nil_mtopsearch=btn&DA=YZR&q=${encodedQuery}`;
}

// 다음 검색 결과 HTML 가져오기
async function fetchDaumSearchHtml(query: string): Promise<string> {
  const url = buildDaumSearchUrl(query);
  console.log('[Daum Search] Fetching:', url);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.text();
  } catch (error) {
    console.error('[Daum Search] Fetch error:', error);
    throw error;
  }
}

// 컴포넌트 타입 감지
function detectComponentType($comp: cheerio.Cheerio<AnyNode>, $: cheerio.CheerioAPI): string {
  const className = $comp.attr('class') || '';
  const dataType = $comp.attr('data-type') || '';
  const dispAttr = $comp.attr('disp-attr') || '';  // 다음 검색 고유 속성
  const id = $comp.attr('id') || '';
  const combined = (className + ' ' + dataType + ' ' + id + ' ' + dispAttr).toLowerCase();

  // 섹션 제목도 확인
  const sectionTitle = $comp.find('.tit_comp, .tit_head, .tit_g, h3, h2').first().text().toLowerCase();
  const allText = combined + ' ' + sectionTitle;

  // 다음 검색 disp-attr 기반 타입 감지 (가장 정확)
  if (dispAttr === 'PRF') return 'people';  // Profile
  if (dispAttr === 'DNS') return 'news';     // News
  if (dispAttr === 'SNY' || dispAttr === '0NS' || dispAttr === 'SNP') return 'products'; // Shopping (SNY: 쇼핑, 0NS: 네이버쇼핑광고, SNP: 쇼핑하우)
  if (dispAttr === 'IIM') return 'images';   // Images
  if (dispAttr === 'VOI') return 'videos';   // Videos
  if (dispAttr === 'Z6T') return 'exchange'; // Exchange Rate (환율)
  if (dispAttr === 'TWA' || dispAttr === 'TWD') return 'web';  // 통합웹

  // 텍스트 기반 타입 감지 (폴백, products 제외 - SNY 없으면 쇼핑 아님)
  if (allText.includes('person') || allText.includes('인물') || allText.includes('프로필')) return 'people';
  if (allText.includes('news') || allText.includes('뉴스')) return 'news';
  // 쇼핑/상품은 disp-attr="SNY" 에서만 감지 (텍스트에 '쇼핑'이 있어도 무시)
  if (allText.includes('place') || allText.includes('장소') || allText.includes('맛집') || allText.includes('지도')) return 'locations';
  if (allText.includes('weather') || allText.includes('날씨')) return 'weather';
  if (allText.includes('환율') || allText.includes('exchange') || allText.includes('달러') || allText.includes('엔화')) return 'exchange';
  if (allText.includes('image') || allText.includes('이미지')) return 'images';
  if (allText.includes('video') || allText.includes('동영상')) return 'videos';
  if (allText.includes('blog') || allText.includes('블로그')) return 'blog';
  if (allText.includes('cafe') || allText.includes('카페글')) return 'cafe';
  if (allText.includes('web') || allText.includes('웹문서')) return 'web';
  if (allText.includes('지식') || allText.includes('답변')) return 'knowledge';

  return 'mixed';
}

// 인물 정보 추출
function extractPersonItems($comp: cheerio.Cheerio<AnyNode>, $: cheerio.CheerioAPI): SearchResultItem[] {
  const items: SearchResultItem[] = [];

  // 인물 프로필 카드
  const name = $comp.find('.tit_info, .txt_name, .tit_item').first().text().trim();
  const imageUrl = $comp.find('img').first().attr('src') || '';
  const description = $comp.find('.desc, .txt_info, .cont_info').first().text().trim();

  if (name) {
    const metadata: Record<string, any> = {};

    // 상세 정보 추출
    $comp.find('.list_info li, .info_item, .txt_cont').each((_, el) => {
      const text = $(el).text().trim();
      if (text.includes('출생')) metadata.birthDate = text.replace('출생', '').trim();
      if (text.includes('직업')) metadata.occupation = text.replace('직업', '').trim();
      if (text.includes('소속')) metadata.organization = text.replace('소속', '').trim();
      if (text.includes('학력')) metadata.education = text.replace('학력', '').trim();
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
}

// 뉴스 항목 추출
function extractNewsItems($comp: cheerio.Cheerio<AnyNode>, $: cheerio.CheerioAPI): SearchResultItem[] {
  const items: SearchResultItem[] = [];

  // 다음 검색 뉴스 구조: .c-list-basic > li[data-docid]
  $comp.find('.c-list-basic > li[data-docid], .wrap_cont, .cont_thumb, .item_news, .news_item').each((index, el) => {
    if (index >= 5) return; // 최대 5개

    const $item = $(el);

    // 다음 검색 뉴스 구조에서 제목 추출 (언론사 이름이 아닌 실제 뉴스 제목)
    let title = $item.find('.item-title .tit-g, .tit-g.clamp-g').first().text().trim();
    if (!title) {
      title = $item.find('.tit_news, .tit, a.link_txt').first().text().trim();
    }

    // 설명 추출
    let description = $item.find('.conts-desc, .item-contents p').first().text().trim();
    if (!description) {
      description = $item.find('.desc, .txt_sub').first().text().trim();
    }

    // URL 추출 (뉴스 링크)
    let url = $item.find('.item-title a, .c-item-content a').first().attr('href') || '';
    if (!url) {
      url = $item.find('a').first().attr('href') || '';
    }

    // 이미지 URL 추출
    let imageUrl = $item.find('.item-thumb img').first().attr('data-original-src') || '';
    if (!imageUrl) {
      imageUrl = $item.find('img').first().attr('data-original-src') || $item.find('img').first().attr('src') || '';
    }

    // 언론사 추출 (c-tit-doc 내의 tit_item)
    const source = $item.find('.c-tit-doc .tit_item .txt_info, .c-tit-doc .tit_item, .info_news, .txt_cp').first().text().trim();

    // 시간 추출
    let timestamp = $item.find('.gem-subinfo .txt_info').first().text().trim();
    if (!timestamp) {
      timestamp = $item.find('.txt_time, .date, .time').first().text().trim();
    }

    if (title && title.length > 5) {
      items.push({
        id: `news-${Date.now()}-${index}`,
        title,
        description: description || title,
        url,
        imageUrl: imageUrl.startsWith('//') ? `https:${imageUrl}` : imageUrl || undefined,
        category: '뉴스',
        timestamp,
        metadata: { source },
      });
    }
  });

  return items;
}

// 쇼핑 항목 추출
function extractShoppingItems($comp: cheerio.Cheerio<AnyNode>, $: cheerio.CheerioAPI): SearchResultItem[] {
  const items: SearchResultItem[] = [];

  // 0NS (네이버 쇼핑) 구조: li > div.c-item-content
  $comp.find('li').each((index, el) => {
    if (index >= 10) return;

    const $item = $(el);
    const $content = $item.find('.c-item-content, .item_prd, .product_item');
    if ($content.length === 0 && !$item.find('.txt_price, .cont_price').length) return;

    // 제목 추출 (여러 패턴 시도)
    const title = $item.find('.tit-g.clamp-g, .tit_item, .tit_prd, .name').first().text().trim()
      || $item.find('.item-title strong').first().text().trim()
      || $item.find('a .wrap_cont .item-title').first().text().trim();

    // 가격 추출
    const priceText = $item.find('.txt_price').first().text().trim();
    const priceMatch = priceText.replace(/[^0-9]/g, '');
    const price = priceMatch ? parseInt(priceMatch) : undefined;

    // 링크 추출
    const url = $item.find('a.wrap_cont, a.thumb_bf').first().attr('href')
      || $item.find('a').first().attr('href') || '';

    // 이미지 추출 (lazy loading 대응)
    const $img = $item.find('img').first();
    let imageUrl = $img.attr('data-original-src') || $img.attr('src') || '';
    if (imageUrl.startsWith('//')) imageUrl = `https:${imageUrl}`;
    if (imageUrl.includes('data:image/gif')) imageUrl = $img.attr('data-original-src') || '';

    // 판매처 추출
    const mall = $item.find('.txt_mallname, .txt_mall, .mall').first().text().trim();

    // 배송 정보
    const delivery = $item.find('.txt_delivery').first().text().trim();

    // 리뷰 수 추출
    const reviewText = $item.find('.cont_count .txt_info, .txt_review').first().text().trim();
    const reviewMatch = reviewText.match(/[\d,]+/);
    const reviewCount = reviewMatch ? parseInt(reviewMatch[0].replace(/,/g, '')) : undefined;

    if (title && title.length > 3 && price) {
      items.push({
        id: `product-${Date.now()}-${index}`,
        title,
        description: `${mall || '쇼핑몰'}에서 판매${delivery ? ` (${delivery})` : ''}`,
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
    }
  });

  // 기존 패턴도 폴백으로 유지 (SNP 쇼핑하우 키워드 등)
  if (items.length === 0) {
    $comp.find('.wrap_thumb, .item_link').each((index, el) => {
      if (index >= 6) return;
      const $item = $(el);
      const title = $item.find('.txt_item, .tit_item').first().text().trim();
      const url = $item.attr('href') || $item.find('a').first().attr('href') || '';
      const imageUrl = $item.find('img').first().attr('src') || '';

      if (title && title.length > 2) {
        items.push({
          id: `product-keyword-${Date.now()}-${index}`,
          title,
          description: '쇼핑 키워드',
          url: url.startsWith('?') ? `https://search.daum.net/search${url}` : url,
          imageUrl: imageUrl.startsWith('//') ? `https:${imageUrl}` : imageUrl || undefined,
          category: '상품',
          metadata: {},
        });
      }
    });
  }

  return items;
}

// 장소 항목 추출
function extractLocationItems($comp: cheerio.Cheerio<AnyNode>, $: cheerio.CheerioAPI): SearchResultItem[] {
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
      // 실제 평점 파싱 (없으면 undefined)
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
}

// 환율 정보 추출
function extractExchangeRateItems($comp: cheerio.Cheerio<AnyNode>, $: cheerio.CheerioAPI): SearchResultItem[] {
  const items: SearchResultItem[] = [];

  // 통화 코드 -> 이름 매핑
  const currencyNames: Record<string, string> = {
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
  };

  // 다음 검색 환율 데이터는 JavaScript 객체로 제공됨
  // nationMap 변수에서 데이터 추출 시도
  const scriptContent = $comp.find('script').text() || $comp.html() || '';

  // nationMap에서 환율 데이터 추출
  const nationMapMatch = scriptContent.match(/nationMap\s*=\s*(\{[\s\S]*?\});/);
  if (nationMapMatch) {
    try {
      // JSON 파싱을 위해 문자열 정리
      const jsonStr = nationMapMatch[1]
        .replace(/'/g, '"')
        .replace(/(\w+):/g, '"$1":')
        .replace(/,\s*}/g, '}');
      const nationMap = JSON.parse(jsonStr);

      // 주요 통화 추출
      const mainCurrencies = ['USD', 'JPY', 'EUR', 'CNY', 'GBP', 'AUD'];
      mainCurrencies.forEach((code, index) => {
        const data = nationMap[code];
        if (data) {
          items.push({
            id: `exchange-${Date.now()}-${index}`,
            title: code,
            description: currencyNames[code] || code,
            category: '환율',
            metadata: {
              currencyCode: code,
              currencyName: currencyNames[code] || code,
              baseRate: parseFloat(data.currentRate?.replace(/,/g, '') || '0'),
              cashBuy: parseFloat(data.cashBuy?.replace(/,/g, '') || '0'),
              cashSell: parseFloat(data.cashSell?.replace(/,/g, '') || '0'),
              sendRate: parseFloat(data.onlineSend?.replace(/,/g, '') || '0'),
              receiveRate: parseFloat(data.onlineRcv?.replace(/,/g, '') || '0'),
              change: parseFloat(data.currentRatio?.replace(/,/g, '') || '0'),
              changePercent: parseFloat(data.currentRatioPercent?.replace(/,/g, '') || '0'),
              trend: data.currentRatio?.startsWith('-') ? 'down' : data.currentRatio === '0' ? 'unchanged' : 'up',
            },
          });
        }
      });
    } catch (e) {
      console.log('[Exchange Rate] Failed to parse nationMap:', e);
    }
  }

  // 폴백: 텍스트에서 환율 정보 추출
  if (items.length === 0) {
    // 환율 테이블이나 리스트에서 추출
    $comp.find('.exchange_item, .rate_item, li, tr').each((index, el) => {
      if (index >= 6) return;

      const $item = $(el);
      const text = $item.text();

      // USD, JPY 등 통화 코드 찾기
      const currencyMatch = text.match(/\b(USD|EUR|JPY|CNY|GBP|AUD|CAD|CHF)\b/);
      if (!currencyMatch) return;

      const code = currencyMatch[1];

      // 숫자 추출 (환율 값)
      const rateMatch = text.match(/[\d,]+\.?\d*/g);
      const rates = rateMatch ? rateMatch.map(r => parseFloat(r.replace(/,/g, ''))) : [];

      if (rates.length > 0) {
        items.push({
          id: `exchange-${Date.now()}-${index}`,
          title: code,
          description: currencyNames[code] || code,
          category: '환율',
          metadata: {
            currencyCode: code,
            currencyName: currencyNames[code] || code,
            baseRate: rates[0],
            cashBuy: rates[1],
            cashSell: rates[2],
          },
        });
      }
    });
  }

  // 여전히 없으면 주요 통화 플레이스홀더 생성
  if (items.length === 0) {
    const mainCurrencies = [
      { code: 'USD', name: '미국 달러' },
      { code: 'JPY', name: '일본 엔 (100엔)' },
      { code: 'EUR', name: '유로' },
      { code: 'CNY', name: '중국 위안' },
    ];

    mainCurrencies.forEach((currency, index) => {
      items.push({
        id: `exchange-${Date.now()}-${index}`,
        title: currency.code,
        description: currency.name,
        category: '환율',
        metadata: {
          currencyCode: currency.code,
          currencyName: currency.name,
        },
      });
    });
  }

  return items;
}

// 일반 웹문서 항목 추출
function extractWebItems($comp: cheerio.Cheerio<AnyNode>, $: cheerio.CheerioAPI): SearchResultItem[] {
  const items: SearchResultItem[] = [];

  $comp.find('.wrap_cont, .item, li, article').each((index, el) => {
    if (index >= 5) return;

    const $item = $(el);
    const title = $item.find('.tit, .tit_item, a.link_txt, h3, h4').first().text().trim();
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
}

// 환율 데이터 추출 (전체 HTML에서 nationMap 찾기)
function extractExchangeRateFromHtml(html: string): SearchResultItem[] {
  const items: SearchResultItem[] = [];

  const currencyNames: Record<string, string> = {
    USD: '미국 달러',
    EUR: '유로',
    JPY: '일본 엔 (100엔)',
    CNY: '중국 위안',
    GBP: '영국 파운드',
    AUD: '호주 달러',
  };

  // nationMap['USD'] = {...} 형식 파싱
  const mainCurrencies = ['USD', 'JPY', 'EUR', 'CNY', 'GBP', 'AUD'];

  mainCurrencies.forEach((code, index) => {
    // nationMap['USD'] = {...} 패턴 찾기
    const pattern = new RegExp(`nationMap\\['${code}'\\]\\s*=\\s*\\{([^}]+)\\}`, 's');
    const match = html.match(pattern);

    if (match) {
      const dataBlock = match[1];

      // 개별 값 추출 (rate: '1,477.00' 형식)
      const extractValue = (key: string): string => {
        const valueMatch = dataBlock.match(new RegExp(`${key}\\s*:\\s*'([^']*)'`));
        return valueMatch ? valueMatch[1] : '';
      };

      const rateStr = extractValue('rate');
      const baseRate = parseFloat(rateStr.replace(/,/g, '')) || 0;
      const change = parseFloat(extractValue('currentRatio').replace(/,/g, '')) || 0;
      const changePercentStr = extractValue('currentRatioPercent').replace('%', '');
      const changePercent = parseFloat(changePercentStr) || 0;
      const cashBuy = parseFloat(extractValue('cashBuy').replace(/,/g, '')) || 0;
      const cashSell = parseFloat(extractValue('cashSell').replace(/,/g, '')) || 0;
      const onlineSend = parseFloat(extractValue('onlineSend').replace(/,/g, '')) || 0;
      const onlineRcv = parseFloat(extractValue('onlineRcv').replace(/,/g, '')) || 0;
      const country = extractValue('country');
      const unit = extractValue('unit');
      const upDownTxt = extractValue('currentUpDownTxt');

      // description 생성 (중복 방지)
      let displayName = currencyNames[code] || code;
      if (country && unit && country !== unit) {
        displayName = `${country} ${unit}`;
      } else if (country) {
        displayName = country;
      }

      // JPY는 100엔 기준으로 표시 (rate가 1엔 기준이면 100배)
      const displayRate = code === 'JPY' && baseRate < 100 ? baseRate * 100 : baseRate;

      if (baseRate > 0) {
        items.push({
          id: `exchange-${Date.now()}-${index}`,
          title: code,
          description: code === 'JPY' ? '일본 엔 (100엔)' : displayName,
          category: '환율',
          url: extractValue('url') || undefined,
          metadata: {
            currencyCode: code,
            currencyName: code === 'JPY' ? '일본 엔 (100엔)' : displayName,
            baseRate: displayRate,
            cashBuy: cashBuy || undefined,
            cashSell: cashSell || undefined,
            sendRate: onlineSend || undefined,
            receiveRate: onlineRcv || undefined,
            change,
            changePercent,
            trend: upDownTxt === '하락' ? 'down' : upDownTxt === '상승' ? 'up' : change < 0 ? 'down' : change > 0 ? 'up' : 'unchanged',
          },
        });
      }
    }
  });

  console.log(`[Exchange Rate] Extracted ${items.length} currencies from HTML`);
  return items;
}

// 환율 폴백 데이터 생성 (환율 관련 쿼리에만 사용)
function createExchangeRateFallback(): SearchResultItem[] {
  console.log('[Exchange Rate] Using fallback placeholder data');
  const defaultRates = [
    { code: 'USD', name: '미국 달러', rate: 1400, change: 5.00 },
    { code: 'JPY', name: '일본 엔 (100엔)', rate: 920, change: -2.50 },
    { code: 'EUR', name: '유로', rate: 1530, change: 3.20 },
    { code: 'CNY', name: '중국 위안', rate: 193, change: 0.80 },
  ];

  return defaultRates.map((currency, index) => ({
    id: `exchange-fallback-${Date.now()}-${index}`,
    title: currency.code,
    description: currency.name,
    category: '환율',
    metadata: {
      currencyCode: currency.code,
      currencyName: currency.name,
      baseRate: currency.rate,
      change: currency.change,
      changePercent: (currency.change / currency.rate) * 100,
      trend: currency.change < 0 ? 'down' : currency.change > 0 ? 'up' : 'unchanged',
    },
  }));
}

// 쿼리가 환율 관련인지 확인
function isExchangeRelatedQuery(query: string): boolean {
  const keywords = ['환율', '달러', '엔화', '유로', '위안', '환전', 'usd', 'jpy', 'eur', 'cny'];
  const q = query.toLowerCase();
  return keywords.some(kw => q.includes(kw));
}

// HTML에서 g_comp 컴포넌트 및 검색 결과 추출
function extractComponents(html: string, query: string): DaumSearchComponent[] {
  const $ = cheerio.load(html);
  const components: DaumSearchComponent[] = [];

  // 먼저 환율 데이터 추출 시도 (특별 처리)
  let exchangeItems = extractExchangeRateFromHtml(html);

  // 환율 관련 쿼리인데 데이터를 못 찾으면 폴백 사용
  if (exchangeItems.length === 0 && isExchangeRelatedQuery(query)) {
    exchangeItems = createExchangeRateFallback();
  }

  if (exchangeItems.length > 0) {
    components.push({
      type: 'exchange',
      title: '실시간 환율',
      items: exchangeItems,
      raw: `환율 정보: ${exchangeItems.map(i => `${i.title}=${i.metadata?.baseRate}`).join(', ')}`,
    });
  }

  // #exchangeColl 또는 disp-attr="Z6T" 확인
  const $exchangeColl = $('#exchangeColl, [disp-attr="Z6T"]');
  if ($exchangeColl.length > 0 && exchangeItems.length === 0) {
    // 폴백: exchangeColl 요소에서 텍스트 추출
    const items = extractExchangeRateItems($exchangeColl, $);
    if (items.length > 0) {
      components.push({
        type: 'exchange',
        title: '실시간 환율',
        items,
        raw: $exchangeColl.text().slice(0, 500),
      });
    }
  }

  $('.g_comp').each((index, element) => {
    const $comp = $(element);
    const className = $comp.attr('class') || '';
    const dataType = $comp.attr('data-type') || '';

    // 관련 검색어 제외
    if (
      className.includes('relate') ||
      dataType.includes('relate') ||
      $comp.find('.tit_relate').length > 0 ||
      $comp.text().includes('관련 검색어')
    ) {
      return;
    }

    const type = detectComponentType($comp, $);
    const sectionTitle = $comp.find('.tit_comp, .tit_head, .tit_g, h3, h2').first().text().trim() || type;

    // 타입별 항목 추출
    let items: SearchResultItem[] = [];
    switch (type) {
      case 'people':
        items = extractPersonItems($comp, $);
        break;
      case 'news':
        items = extractNewsItems($comp, $);
        break;
      case 'products':
        items = extractShoppingItems($comp, $);
        break;
      case 'locations':
        items = extractLocationItems($comp, $);
        break;
      case 'exchange':
        items = extractExchangeRateItems($comp, $);
        break;
      default:
        items = extractWebItems($comp, $);
    }

    // raw 텍스트 + 이미지 URL 추출
    const rawText = $comp.text().replace(/\s+/g, ' ').trim().slice(0, 500);

    // 컴포넌트 내 모든 이미지 URL 추출
    const imageUrls: string[] = [];
    $comp.find('img').each((_, img) => {
      const src = $(img).attr('data-original-src') || $(img).attr('src') || '';
      if (src && !src.includes('plazy.svg') && !src.includes('icon')) {
        const fullSrc = src.startsWith('//') ? `https:${src}` : src;
        if (!imageUrls.includes(fullSrc)) {
          imageUrls.push(fullSrc);
        }
      }
    });

    // 컴포넌트 내 모든 링크 URL 추출
    const linkUrls: string[] = [];
    $comp.find('a[href]').each((_, a) => {
      const href = $(a).attr('href') || '';
      if (href && href.startsWith('http')) {
        linkUrls.push(href);
      }
    });

    // raw에 이미지/링크 정보 포함
    const raw = `${rawText}\n[이미지URLs]: ${imageUrls.slice(0, 5).join(', ')}\n[링크URLs]: ${linkUrls.slice(0, 3).join(', ')}`;

    if (items.length > 0 || rawText.length > 30) {
      // 각 아이템에 소스 의도 추가
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
}

// LLM으로 g_comp raw 데이터를 SearchResultItem 구조로 추출
async function extractStructuredDataWithLLM(
  query: string,
  components: DaumSearchComponent[],
  searchIntent?: string  // 검색 의도 힌트
): Promise<SearchResultItem[]> {
  if (!process.env.OPENAI_API_KEY || components.length === 0) {
    return [];
  }

  // 인물 검색인 경우 더 많은 컴포넌트에서 정보 추출 (PRF 섹션이 비어있을 수 있음)
  const isPeopleSearch = searchIntent === 'people' ||
    components.some(c => c.type === 'people') ||
    /[가-힣]{2,4}$/.test(query.trim()); // 한글 이름 패턴

  const componentCount = isPeopleSearch ? 4 : 2;
  const topComponents = components.slice(0, componentCount);

  // 유효한 컴포넌트만 필터링 (raw 텍스트가 있는 것)
  const validComponents = topComponents.filter(c => c.raw && c.raw.length > 50);

  if (validComponents.length === 0) {
    console.log('[LLM Extract] No valid components with content');
    return [];
  }

  const rawContents = validComponents.map((c, idx) =>
    `[컴포넌트 ${idx + 1}: ${c.type}] ${c.title}\n원본 텍스트:\n${c.raw.slice(0, 1500)}`
  ).join('\n\n---\n\n');

  // 인물 검색 특화 프롬프트
  const personPrompt = isPeopleSearch ? `
## 인물 검색 특별 지침
검색어 "${query}"는 인물 검색입니다. 다음을 수행하세요:
1. **첫 번째 항목으로 인물 프로필 카드를 생성**:
   - title: 인물 이름
   - category: "인물"
   - description: 직업/소속/대표작 요약
   - metadata에 occupation, organization 등 포함
2. 뉴스/기사에서 인물에 대한 최신 정보 추출
3. 인물과 직접 관련된 정보만 포함` : '';

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `검색 결과에서 추출한 텍스트를 분석하여 구조화된 데이터로 변환하세요.
${personPrompt}

반드시 아래 JSON 배열 형식으로만 응답하세요:
[
  {
    "title": "제목/이름 (필수)",
    "description": "설명 또는 부가정보",
    "url": "링크 URL ([링크URLs]에서 가장 관련있는 것)",
    "imageUrl": "이미지 URL ([이미지URLs]에서 가장 관련있는 것)",
    "category": "카테고리 (인물, 영화, 드라마, 뉴스, 상품 등)",
    "timestamp": "날짜 정보",
    "metadata": {
      "age": "나이 (예: 42세)",
      "birthDate": "출생일",
      "occupation": "직업 (예: 배우, 가수, 운동선수)",
      "organization": "소속사/팀",
      "spouse": "배우자",
      "source": "출처",
      "price": 가격(숫자),
      "address": "주소"
    }
  }
]

규칙:
- 최대 5개 항목만 추출
- **인물 검색인 경우**: 텍스트에서 나이, 직업, 소속, 배우자 등 인물 정보를 반드시 추출하고 첫 항목은 프로필
- **[이미지URLs]에서 첫 번째 URL을 imageUrl로 사용**
- **[링크URLs]에서 가장 관련있는 URL을 url로 사용**
- 실제로 있는 정보만 포함 (없으면 필드 생략)
- 광고, 관련검색어 제외`,
        },
        {
          role: 'user',
          content: `검색어: "${query}"

검색 결과 원본:
${rawContents}

위 텍스트에서 주요 검색 결과를 구조화된 데이터로 추출하세요.`,
        },
      ],
      temperature: 0.1,
      max_tokens: 1200,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return [];

    // JSON 배열 파싱
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const parsed = JSON.parse(jsonMatch[0]) as Array<{
      title: string;
      description?: string;
      url?: string;
      imageUrl?: string;
      category?: string;
      timestamp?: string;
      metadata?: Record<string, unknown>;
    }>;

    // 디버그: LLM 추출 결과 상세 로깅
    console.log('[LLM Extract] isPeopleSearch:', isPeopleSearch);
    console.log('[LLM Extract] Parsed items:', parsed.map(p => ({ title: p.title, category: p.category, metadata: p.metadata })));

    // SearchResultItem 형태로 변환
    return parsed.map((item, idx) => ({
      id: `llm-extracted-${Date.now()}-${idx}`,
      title: item.title,
      description: item.description,
      url: item.url,
      imageUrl: item.imageUrl,
      category: item.category,
      timestamp: item.timestamp,
      metadata: {
        ...item.metadata,
        sourceIntent: validComponents[0]?.type || 'mixed',
        extractedByLLM: true,
      },
    }));
  } catch (error) {
    console.error('[Daum Search] LLM data extraction error:', error);
    return [];
  }
}

// LLM으로 검색 결과 분석
async function analyzeWithLLM(query: string, components: DaumSearchComponent[]): Promise<{
  primaryIntent: SearchIntent;
  secondaryIntent?: SearchIntent;
  reasoning: string;
}> {
  if (!process.env.OPENAI_API_KEY || components.length === 0) {
    // 폴백: 첫 번째 컴포넌트 타입 사용
    const firstType = components[0]?.type || 'mixed';
    return {
      primaryIntent: firstType as SearchIntent,
      secondaryIntent: components[1]?.type as SearchIntent,
      reasoning: `컴포넌트 기반: ${components.map(c => c.type).join(', ')}`,
    };
  }

  const componentSummary = components.slice(0, 3).map((c, i) =>
    `${i + 1}. [${c.type}] ${c.title} (${c.items.length}개 항목)`
  ).join('\n');

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `검색 엔진 결과를 분석하여 의도를 파악합니다.
상위 컴포넌트들의 타입을 보고 주요 의도와 보조 의도를 결정하세요.

JSON으로 응답: {"primaryIntent": "타입", "secondaryIntent": "타입 또는 null", "reasoning": "이유"}`,
        },
        {
          role: 'user',
          content: `검색어: "${query}"\n\n결과:\n${componentSummary}`,
        },
      ],
      temperature: 0.1,
      max_tokens: 150,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('Empty');

    const parsed = JSON.parse(content.match(/\{[\s\S]*\}/)?.[0] || '{}');
    return {
      primaryIntent: parsed.primaryIntent || components[0]?.type || 'mixed',
      secondaryIntent: parsed.secondaryIntent,
      reasoning: parsed.reasoning || '분석 완료',
    };
  } catch (error) {
    console.error('[Daum Search] LLM error:', error);
    return {
      primaryIntent: components[0]?.type as SearchIntent || 'mixed',
      secondaryIntent: components[1]?.type as SearchIntent,
      reasoning: `폴백: ${components.map(c => c.type).join(', ')}`,
    };
  }
}

// 메인 함수: 다음 검색 결과 분석
export async function analyzeDaumSearch(query: string): Promise<SearchEngineAnalysis> {
  console.log('[Daum Search] Analyzing query:', query);

  try {
    const html = await fetchDaumSearchHtml(query);
    const components = extractComponents(html, query);
    console.log(`[Daum Search] Found ${components.length} components with ${components.reduce((sum, c) => sum + c.items.length, 0)} items`);

    // 컴포넌트 타입으로 빠른 의도 추정 (LLM 추출에 힌트로 사용)
    const hasExchangeComponent = components.some(c => c.type === 'exchange');
    const hasPeopleComponent = components.some(c => c.type === 'people');
    const hasNewsComponent = components.some(c => c.type === 'news');
    const quickIntent = hasExchangeComponent ? 'exchange' : hasPeopleComponent ? 'people' : hasNewsComponent ? 'news' : components[0]?.type;
    console.log('[Daum Search] Quick intent:', quickIntent);

    // 중요 컴포넌트 우선 정렬 (exchange, people, news, products 순)
    const priorityOrder: Record<string, number> = {
      'exchange': 0,  // 환율 최우선
      'people': 1,
      'news': 2,
      'products': 3,
      'locations': 4,
      'weather': 5,
      'images': 6,
      'videos': 7,
      'web': 8,
      'mixed': 9,
    };
    // 환율 컴포넌트 명시적 분리 (정렬 문제 해결)
    const exchangeComps = components.filter(c => c.type === 'exchange');
    const otherComps = components.filter(c => c.type !== 'exchange');

    // 환율 컴포넌트를 맨 앞에, 나머지는 우선순위로 정렬
    const sortedOthers = otherComps.sort((a, b) => {
      const aPriority = priorityOrder[a.type] || 10;
      const bPriority = priorityOrder[b.type] || 10;
      return aPriority - bPriority;
    });

    // 환율 컴포넌트를 맨 앞에 배치
    const sortedComponents = [...exchangeComps, ...sortedOthers];

    // 환율/인물/뉴스 검색의 경우 더 많은 컴포넌트 사용
    const componentCount = (hasExchangeComponent || hasPeopleComponent || hasNewsComponent) ? 4 : 2;
    const topComponents = sortedComponents.slice(0, componentCount);
    console.log('[Daum Search] Top components:', topComponents.map(c => `[${c.type}] ${c.title} (${c.items.length})`));

    // cheerio로 추출한 아이템
    const cheerioItems = topComponents.flatMap(c => c.items);

    // LLM 분석 및 데이터 구조 추출 병렬 실행 (의도 힌트 전달)
    const [analysis, llmExtractedItems] = await Promise.all([
      analyzeWithLLM(query, topComponents),
      extractStructuredDataWithLLM(query, components, quickIntent),  // 전체 컴포넌트 + 의도 힌트
    ]);

    console.log('[Daum Search] LLM extracted items:', llmExtractedItems.length);

    // cheerio 추출 아이템과 LLM 추출 아이템 병합 (LLM 우선, 중복 제거)
    const mergedItems = mergeItems(cheerioItems, llmExtractedItems);

    return {
      query,
      components: topComponents,
      allItems: mergedItems,
      llmExtractedItems,
      primaryIntent: analysis.primaryIntent,
      secondaryIntent: analysis.secondaryIntent,
      reasoning: analysis.reasoning,
    };
  } catch (error) {
    console.error('[Daum Search] Error:', error);
    return {
      query,
      components: [],
      allItems: [],
      llmExtractedItems: [],
      primaryIntent: 'mixed',
      reasoning: '검색 실패',
    };
  }
}

// 아이템 병합 (LLM 데이터 + cheerio의 이미지/URL 보완)
function mergeItems(cheerioItems: SearchResultItem[], llmItems: SearchResultItem[]): SearchResultItem[] {
  // cheerio 아이템을 제목으로 인덱싱 (이미지/URL 조회용)
  const cheerioByTitle = new Map<string, SearchResultItem>();
  for (const item of cheerioItems) {
    cheerioByTitle.set(item.title.toLowerCase().trim(), item);
  }

  // LLM 아이템에 cheerio의 이미지/URL 정보 보완
  const enrichedLlmItems = llmItems.map(llmItem => {
    const normalizedTitle = llmItem.title.toLowerCase().trim();
    const cheerioItem = cheerioByTitle.get(normalizedTitle);

    if (cheerioItem) {
      // cheerio에서 이미지, URL 정보 가져오기
      return {
        ...llmItem,
        imageUrl: llmItem.imageUrl || cheerioItem.imageUrl,
        url: llmItem.url || cheerioItem.url,
        metadata: {
          ...cheerioItem.metadata,  // cheerio 메타데이터 먼저
          ...llmItem.metadata,      // LLM 메타데이터 덮어쓰기
        },
      };
    }
    return llmItem;
  });

  const result: SearchResultItem[] = [...enrichedLlmItems];
  const processedTitles = new Set(llmItems.map(i => i.title.toLowerCase().trim()));

  // cheerio 아이템 중 LLM에 없는 것만 추가
  for (const item of cheerioItems) {
    const normalizedTitle = item.title.toLowerCase().trim();
    if (!processedTitles.has(normalizedTitle)) {
      result.push(item);
      processedTitles.add(normalizedTitle);
    }
  }

  return result.slice(0, 10); // 최대 10개
}
