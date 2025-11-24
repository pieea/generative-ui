import { SearchResult, ResultType, SearchResultItem } from '@/types';

// 검색 결과 타입 분류 로직
export function classifyResultType(query: string, items: SearchResultItem[]): ResultType {
  const queryLower = query.toLowerCase();

  // 키워드 기반 분류
  const typeKeywords: Record<ResultType, string[]> = {
    news: ['뉴스', '기사', '속보', 'news', '보도'],
    products: ['상품', '제품', '구매', '쇼핑', '가격', 'product', 'buy', 'price'],
    images: ['이미지', '사진', '그림', 'image', 'photo', 'picture'],
    locations: ['장소', '위치', '지도', '맛집', '카페', 'location', 'map', 'place'],
    events: ['이벤트', '행사', '일정', '축제', 'event', 'schedule', 'festival'],
    people: ['인물', '사람', '배우', '가수', 'people', 'person', 'celebrity'],
    documents: ['문서', '파일', '자료', 'document', 'file', 'pdf'],
    mixed: [],
  };

  for (const [type, keywords] of Object.entries(typeKeywords)) {
    if (keywords.some((keyword) => queryLower.includes(keyword))) {
      return type as ResultType;
    }
  }

  // 결과 아이템 분석
  const hasImages = items.some((item) => item.imageUrl);
  const hasTimestamps = items.some((item) => item.timestamp);
  const hasCategories = items.some((item) => item.category);

  if (hasImages && items.length >= 4) return 'images';
  if (hasTimestamps && hasCategories) return 'news';

  return 'mixed';
}

// 검색 수행 (향후 실제 검색 엔진 연동 예정)
export async function performSearch(query: string): Promise<SearchResult> {
  // TODO: 실제 검색 엔진 API 연동
  // 현재는 Mock 데이터 반환
  const mockItems = generateMockResults(query);
  const resultType = classifyResultType(query, mockItems);

  return {
    query,
    items: mockItems,
    totalCount: mockItems.length,
    resultType,
    metadata: {
      source: 'mock',
      searchTime: Math.random() * 500 + 100,
    },
  };
}

// Mock 데이터 생성 (개발용)
function generateMockResults(query: string): SearchResultItem[] {
  const queryLower = query.toLowerCase();

  // 인물 검색 감지 (CEO, 배우, 가수 등)
  const isPeopleSearch = ['ceo', '배우', '가수', '인물', 'person', '멤버'].some(
    (keyword) => queryLower.includes(keyword)
  );

  if (isPeopleSearch) {
    return generatePersonResults(query);
  }

  const count = Math.floor(Math.random() * 8) + 4;
  const items: SearchResultItem[] = [];

  for (let i = 0; i < count; i++) {
    items.push({
      id: `item-${i + 1}`,
      title: `${query} 관련 결과 ${i + 1}`,
      description: `${query}에 대한 검색 결과입니다. 이것은 샘플 설명 텍스트로, 실제 검색 결과에서는 더 상세한 내용이 표시됩니다.`,
      url: `https://example.com/result/${i + 1}`,
      imageUrl: i % 2 === 0 ? `https://picsum.photos/seed/${query}${i}/400/300` : undefined,
      timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('ko-KR'),
      category: ['기술', '생활', '문화', '경제'][i % 4],
      tags: ['태그1', '태그2'].slice(0, (i % 2) + 1),
    });
  }

  return items;
}

// 인물 검색 결과 생성 (위키 스타일 메타데이터 포함)
function generatePersonResults(query: string): SearchResultItem[] {
  // 단일 인물 프로필 반환 (테슬라 CEO 등의 검색에 적합)
  return [
    {
      id: 'person-1',
      title: query.includes('테슬라') ? 'Elon Musk' : `${query}`,
      description: `${query}에 대한 상세 정보입니다. 이 인물은 다양한 분야에서 활발하게 활동하고 있으며, 많은 업적을 남겼습니다.`,
      url: 'https://example.com/wiki/person',
      imageUrl: `https://picsum.photos/seed/${query}/400/500`,
      timestamp: new Date().toLocaleDateString('ko-KR'),
      category: '기업인',
      tags: ['CEO', '기업가', '혁신가'],
      metadata: {
        birthDate: '1971년 6월 28일',
        birthPlace: '남아프리카공화국 프리토리아',
        nationality: '미국, 남아프리카공화국, 캐나다',
        occupation: '기업인, 엔지니어, 투자자',
        organization: 'Tesla, SpaceX, X Corp',
        netWorth: '약 2,000억 달러 (2024년 기준)',
        education: '펜실베이니아 대학교',
        website: 'https://twitter.com/elonmusk',
        summary: '일론 머스크는 테슬라의 CEO이자 SpaceX의 창립자로, 전기차와 우주 탐사 분야에서 혁신을 이끌고 있습니다.',
        career: '1995년 Zip2 창업, 1999년 X.com(이후 PayPal) 창업, 2002년 SpaceX 설립, 2004년 Tesla 투자 및 이사회 의장 취임, 2022년 Twitter 인수',
        achievements: 'PayPal 공동 창업, Tesla를 세계 최대 전기차 회사로 성장, SpaceX를 통한 민간 우주 비행 실현, Starlink 위성 인터넷 서비스 구축',
      },
    },
  ];
}
