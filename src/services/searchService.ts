import { SearchResult, ResultType, SearchResultItem } from '@/types';
import { rewriteQuery, SearchIntent, ExpandedQuery } from './queryRewriteService';

// 검색 결과 타입 분류 (메타데이터 기반)
export function classifyResultType(query: string, items: SearchResultItem[]): ResultType {
  const hasPrice = items.some((item) => item.metadata && 'price' in item.metadata);
  const hasRating = items.some((item) => item.metadata && 'rating' in item.metadata);
  const hasAddress = items.some((item) => item.metadata && 'address' in item.metadata);
  const hasCondition = items.some((item) => item.metadata && 'condition' in item.metadata);
  const hasBio = items.some((item) => item.metadata && ('birthDate' in item.metadata || 'occupation' in item.metadata));

  if (hasCondition) return 'weather';
  if (hasPrice && hasRating) return 'products';
  if (hasAddress) return 'locations';
  if (hasBio) return 'people';

  const hasImages = items.some((item) => item.imageUrl);
  const hasTimestamps = items.some((item) => item.timestamp);
  const hasCategories = items.some((item) => item.category);

  if (hasImages && items.length >= 4) return 'images';
  if (hasTimestamps && hasCategories) return 'news';

  return 'mixed';
}

// 검색 수행 (LLM rewrite 기반)
export async function performSearch(query: string): Promise<SearchResult> {
  // 1. LLM으로 검색어 rewrite 및 확장
  const rewriteResult = await rewriteQuery(query);
  console.log('[Search Service] Rewrite result:', rewriteResult);

  // 2. 확장된 각 쿼리에 대해 검색 수행
  const allItems: SearchResultItem[] = [];
  const intentGroups: Map<SearchIntent, SearchResultItem[]> = new Map();

  for (const expandedQuery of rewriteResult.expandedQueries) {
    const items = generateMockResultsByIntent(expandedQuery.query, expandedQuery.intent);

    // 의도별로 그룹화
    const existing = intentGroups.get(expandedQuery.intent) || [];
    intentGroups.set(expandedQuery.intent, [...existing, ...items]);

    // 전체 결과에 추가 (중복 제거용 태그 추가)
    items.forEach(item => {
      item.metadata = {
        ...item.metadata,
        sourceQuery: expandedQuery.query,
        sourceIntent: expandedQuery.intent,
      };
    });
    allItems.push(...items);
  }

  // 3. 결과 병합 및 정렬 (의도별로 그룹화하여 표시)
  const mergedItems = mergeAndSortResults(allItems, rewriteResult.expandedQueries);
  const resultType = classifyResultType(query, mergedItems);

  return {
    query,
    items: mergedItems,
    totalCount: mergedItems.length,
    resultType,
    metadata: {
      source: 'mock',
      searchTime: Math.random() * 500 + 100,
      rewriteResult: {
        originalQuery: rewriteResult.originalQuery,
        expanded: rewriteResult.shouldExpand,
        queries: rewriteResult.expandedQueries,
      },
    },
  };
}

// 결과 병합 및 정렬
function mergeAndSortResults(items: SearchResultItem[], queries: ExpandedQuery[]): SearchResultItem[] {
  // 의도 우선순위에 따라 정렬
  const intentPriority: Record<SearchIntent, number> = {
    people: 1,      // 인물 정보 우선
    news: 2,        // 뉴스/기사
    products: 3,    // 상품
    locations: 4,   // 장소
    weather: 5,     // 날씨
    events: 6,      // 이벤트
    images: 7,      // 이미지
    documents: 8,   // 문서
    mixed: 9,       // 일반
  };

  return items.sort((a, b) => {
    const intentA = (a.metadata?.sourceIntent as SearchIntent) || 'mixed';
    const intentB = (b.metadata?.sourceIntent as SearchIntent) || 'mixed';
    return intentPriority[intentA] - intentPriority[intentB];
  });
}

// 의도에 따른 Mock 데이터 생성
function generateMockResultsByIntent(query: string, intent: SearchIntent): SearchResultItem[] {
  switch (intent) {
    case 'products':
      return generateProductResults(query);
    case 'locations':
      return generateLocationResults(query);
    case 'weather':
      return generateWeatherResults(query);
    case 'news':
      return generateNewsResults(query);
    case 'people':
      return generatePersonResults(query);
    default:
      return generateGenericResults(query);
  }
}

// 일반 검색 결과 생성
function generateGenericResults(query: string): SearchResultItem[] {
  const count = Math.floor(Math.random() * 4) + 3;
  const items: SearchResultItem[] = [];

  for (let i = 0; i < count; i++) {
    items.push({
      id: `item-${Date.now()}-${i}`,
      title: `${query} 관련 결과 ${i + 1}`,
      description: `${query}에 대한 검색 결과입니다.`,
      url: `https://example.com/result/${i + 1}`,
      imageUrl: i % 2 === 0 ? `https://picsum.photos/seed/${query}${i}/400/300` : undefined,
      timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('ko-KR'),
      category: ['기술', '생활', '문화', '경제'][i % 4],
    });
  }

  return items;
}

// 뉴스/기사 결과 생성
function generateNewsResults(query: string): SearchResultItem[] {
  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return [
    {
      id: `news-${Date.now()}-1`,
      title: `${query} 관련 최신 소식`,
      description: `${query}에 대한 최신 뉴스입니다. 업계에서 큰 관심을 받고 있습니다.`,
      url: 'https://example.com/news/1',
      imageUrl: `https://picsum.photos/seed/${query}news1/400/300`,
      timestamp: today,
      category: '뉴스',
      metadata: {
        author: '기자',
        source: '뉴스매체',
        body: `${query}에 대한 상세 기사 내용입니다.`,
      },
    },
    {
      id: `news-${Date.now()}-2`,
      title: `"${query}" 화제... 네티즌 반응`,
      description: '온라인에서 뜨거운 반응을 얻고 있습니다.',
      url: 'https://example.com/news/2',
      imageUrl: `https://picsum.photos/seed/${query}news2/400/300`,
      timestamp: today,
      category: '이슈',
    },
    {
      id: `news-${Date.now()}-3`,
      title: `${query}, 앞으로의 전망은?`,
      description: '전문가들의 다양한 분석이 나오고 있습니다.',
      url: 'https://example.com/news/3',
      imageUrl: `https://picsum.photos/seed/${query}news3/400/300`,
      timestamp: today,
      category: '분석',
    },
  ];
}

// 장소 검색 결과 생성
function generateLocationResults(query: string): SearchResultItem[] {
  const places = ['추천 장소 1', '인기 명소 2', '핫플레이스 3', '숨은 명소 4'];

  return places.map((name, index) => ({
    id: `location-${Date.now()}-${index}`,
    title: `${query} - ${name}`,
    description: `${query}에서 인기있는 장소입니다.`,
    url: `https://example.com/place/${index + 1}`,
    imageUrl: `https://picsum.photos/seed/${name}${index}/400/300`,
    category: '장소',
    metadata: {
      rating: (4 + Math.random()).toFixed(1),
      reviewCount: Math.floor(Math.random() * 500) + 50,
      address: `서울특별시 ${['강남구', '마포구', '종로구', '용산구'][index % 4]}`,
      openHours: `${8 + (index % 3)}:00 - ${21 + (index % 3)}:00`,
    },
  }));
}

// 날씨 검색 결과 생성
function generateWeatherResults(query: string): SearchResultItem[] {
  const now = new Date();
  const conditions = ['sunny', 'cloudy', 'partlyCloudy', 'rainy', 'snowy'];
  const conditionNames = ['맑음', '흐림', '구름조금', '비', '눈'];
  const locations = ['서울', '부산', '제주', '대구', '인천'];
  const foundLocation = locations.find(loc => query.includes(loc)) || '서울';
  const condIndex = Math.floor(Math.random() * 3);

  return [
    {
      id: `weather-${Date.now()}`,
      title: conditionNames[condIndex],
      timestamp: now.toLocaleString('ko-KR', { hour: '2-digit', minute: '2-digit' }) + ' 기준',
      category: '날씨',
      metadata: {
        location: foundLocation,
        condition: conditions[condIndex],
        temperature: String(Math.floor(Math.random() * 15) + 10),
        humidity: String(Math.floor(Math.random() * 40) + 40),
        feelsLike: String(Math.floor(Math.random() * 15) + 8),
        hourlyForecast: Array.from({ length: 6 }, (_, i) => ({
          time: `${(now.getHours() + i + 1) % 24}시`,
          temp: String(Math.floor(Math.random() * 5) + 15),
          icon: conditions[Math.floor(Math.random() * 3)],
        })),
      },
    },
  ];
}

// 인물 검색 결과 생성
function generatePersonResults(query: string): SearchResultItem[] {
  return [
    {
      id: `person-${Date.now()}`,
      title: query,
      description: `${query}에 대한 상세 정보입니다.`,
      url: 'https://example.com/wiki/person',
      imageUrl: `https://picsum.photos/seed/${query}/400/500`,
      timestamp: new Date().toLocaleDateString('ko-KR'),
      category: '인물',
      metadata: {
        birthDate: '생년월일 정보',
        birthPlace: '출생지 정보',
        nationality: '국적 정보',
        occupation: '직업 정보',
        organization: '소속 정보',
        summary: `${query}에 대한 요약 정보입니다.`,
      },
    },
  ];
}

// 상품 검색 결과 생성
function generateProductResults(query: string): SearchResultItem[] {
  const productNames = [
    `${query} 프리미엄`, `${query} 스탠다드`, `${query} 프로`,
    `${query} 라이트`, `${query} 울트라`, `${query} 플러스`
  ];
  const brands = ['삼성', 'LG', 'Apple', 'Sony', '브랜드A', '브랜드B'];

  return productNames.map((name, index) => {
    const basePrice = 100000 + Math.random() * 900000;
    const hasDiscount = Math.random() > 0.4;
    const discount = hasDiscount ? Math.floor(Math.random() * 30) + 5 : 0;
    const originalPrice = Math.floor(basePrice);
    const price = hasDiscount ? Math.floor(originalPrice * (1 - discount / 100)) : originalPrice;

    return {
      id: `product-${Date.now()}-${index}`,
      title: name,
      description: `${name}은(는) 고품질 제품입니다.`,
      url: `https://example.com/product/${index + 1}`,
      imageUrl: `https://picsum.photos/seed/${name}${index}/400/400`,
      category: '상품',
      metadata: {
        price,
        originalPrice: hasDiscount ? originalPrice : undefined,
        discount: hasDiscount ? discount : undefined,
        rating: Number((4 + Math.random()).toFixed(1)),
        reviewCount: Math.floor(Math.random() * 5000) + 100,
        brand: brands[index % brands.length],
        freeShipping: Math.random() > 0.3,
      },
    };
  });
}
