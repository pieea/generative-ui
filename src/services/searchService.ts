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

  // 경제/금융 기사 검색 감지
  const isEconomicArticle = [
    '경제', '금융', '주식', '증시', '코스피', '코스닥', 'kospi', 'nasdaq',
    '환율', '금리', '인플레이션', '경기', '무역', '수출', '수입',
    'gdp', '실업률', '고용', '투자', '펀드', '채권', '기준금리',
    '한은', '미연준', 'fed', '달러', '엔화', '유로', '원화',
    '삼성전자', '현대차', '반도체', '배터리', '2차전지'
  ].some((keyword) => queryLower.includes(keyword));

  if (isEconomicArticle) {
    return generateEconomicArticle(query);
  }

  // 장소/위치 검색 감지
  const isLocationSearch = [
    '맛집', '카페', '음식점', '식당', '레스토랑', '베이커리', '브런치',
    '관광지', '명소', '볼거리', '여행', '숙소', '호텔', '펜션', '게스트하우스',
    '공원', '박물관', '미술관', '전시관', '서점', '편의점',
    '제주', '강남', '홍대', '이태원', '부산', '경주', '전주', '속초'
  ].some((keyword) => queryLower.includes(keyword));

  if (isLocationSearch) {
    return generateLocationResults(query);
  }

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

// 경제 기사 결과 생성 (상세 본문 포함)
function generateEconomicArticle(query: string): SearchResultItem[] {
  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // 메인 기사
  const mainArticle: SearchResultItem = {
    id: 'article-main',
    title: `${query} 관련 시장 동향 및 전망 분석`,
    description: `최근 ${query}와 관련된 시장이 큰 변화를 맞이하고 있습니다. 전문가들은 이번 변화가 단기적인 현상이 아닌 구조적인 변화의 시작점이 될 수 있다고 분석하고 있습니다.

국내외 경제 상황과 정책 방향을 종합적으로 고려할 때, 향후 시장의 흐름은 여러 변수에 의해 결정될 것으로 보입니다. 특히 글로벌 경제 환경의 불확실성이 지속되는 가운데, 국내 기업들의 대응 전략이 주목받고 있습니다.

업계 관계자들은 "현재의 시장 상황은 도전적이지만, 동시에 새로운 기회를 모색할 수 있는 시기"라며 "기업들의 혁신적인 접근이 필요한 때"라고 강조했습니다.`,
    url: 'https://example.com/economy/article/main',
    imageUrl: `https://picsum.photos/seed/${query}economy/800/400`,
    timestamp: today,
    category: '경제',
    tags: ['경제', '시장분석', '전망', query.split(' ')[0]],
    metadata: {
      author: '김경제 기자',
      source: '경제일보',
      readTime: '5분 소요',
      imageCaption: `${query} 관련 시장 동향 이미지`,
      summary: `${query}와 관련된 시장이 변화하고 있으며, 전문가들은 구조적 변화의 가능성을 언급하고 있습니다. 글로벌 불확실성 속에서 기업들의 대응 전략이 중요해지고 있습니다.`,
      body: `◆ 시장 현황

${query}와 관련된 시장은 최근 몇 달간 급격한 변화를 겪고 있습니다. 국내외 다양한 요인들이 복합적으로 작용하면서 시장 참여자들의 관심이 높아지고 있습니다.

한국은행의 최근 보고서에 따르면, 관련 지표들이 예상을 상회하는 수준으로 나타나고 있으며, 이는 실물 경제에도 긍정적인 영향을 미칠 것으로 전망됩니다.

◆ 전문가 분석

주요 증권사 애널리스트들은 현재 상황에 대해 다양한 의견을 제시하고 있습니다. 일부는 단기적인 조정 가능성을 언급하면서도, 중장기적으로는 성장 잠재력이 높다고 평가하고 있습니다.

"현재의 밸류에이션은 여전히 매력적인 수준"이라며 "장기 투자자들에게는 좋은 진입 시점이 될 수 있다"는 분석도 나오고 있습니다.

◆ 향후 전망

향후 시장 전망에 대해서는 여러 시나리오가 제시되고 있습니다. 긍정적인 시나리오에서는 정부의 정책 지원과 기업들의 혁신 노력이 결합되어 성장세가 이어질 것으로 예상됩니다.

다만, 글로벌 경제 불확실성과 지정학적 리스크는 여전히 주시해야 할 변수로 남아있습니다. 전문가들은 분산 투자와 리스크 관리의 중요성을 강조하고 있습니다.`,
      keyFigures: [
        { label: '코스피', value: '2,650.28', change: '+1.2%' },
        { label: '코스닥', value: '875.45', change: '+0.8%' },
        { label: '원/달러', value: '1,320.50', change: '-0.3%' },
        { label: '국고채 3년', value: '3.45%', change: '+0.05%p' },
      ],
      quote: '현재의 시장 변화는 새로운 패러다임의 시작점이 될 수 있습니다. 기업과 투자자 모두 장기적 관점에서 전략을 수립해야 할 때입니다.',
      quoteAuthor: '한국경제연구원 수석연구위원',
    },
  };

  // 관련 기사들
  const relatedArticles: SearchResultItem[] = [
    {
      id: 'article-related-1',
      title: `"${query}" 관련주 급등...투자 주의보`,
      description: '전문가들은 단기 급등에 따른 차익 실현 매물 출회 가능성을 경고',
      url: 'https://example.com/economy/article/1',
      imageUrl: `https://picsum.photos/seed/${query}1/400/300`,
      timestamp: today,
      category: '증권',
    },
    {
      id: 'article-related-2',
      title: `정부, ${query} 관련 새 정책 발표 예정`,
      description: '이번 주 중 구체적인 정책 방향이 공개될 것으로 예상',
      url: 'https://example.com/economy/article/2',
      imageUrl: `https://picsum.photos/seed/${query}2/400/300`,
      timestamp: today,
      category: '정책',
    },
    {
      id: 'article-related-3',
      title: `글로벌 시장에서 본 ${query}의 의미`,
      description: '해외 전문가들의 시각과 국제 시장 동향 분석',
      url: 'https://example.com/economy/article/3',
      imageUrl: `https://picsum.photos/seed/${query}3/400/300`,
      timestamp: today,
      category: '글로벌',
    },
    {
      id: 'article-related-4',
      title: `${query} 영향받는 업종별 전망`,
      description: '각 산업별로 미치는 영향과 대응 전략 분석',
      url: 'https://example.com/economy/article/4',
      imageUrl: `https://picsum.photos/seed/${query}4/400/300`,
      timestamp: today,
      category: '산업',
    },
  ];

  return [mainArticle, ...relatedArticles];
}

// 장소 검색 결과 생성 (지도 레이아웃용)
function generateLocationResults(query: string): SearchResultItem[] {
  const locationNames = query.includes('제주')
    ? ['오설록 티뮤지엄', '카페 델문도', '몽상드애월', '빈브라더스 제주', '노티드 제주', '마노르블랑 카페', '카페 공백', '봄날 카페']
    : query.includes('강남')
    ? ['카페 드 파리', '블루보틀 강남', '테라로사 강남', '프릳츠 강남', '빈브라더스 강남', '커피콩볶는집 강남점', '앤트러사이트']
    : ['로컬 카페 1', '로컬 카페 2', '로컬 카페 3', '로컬 카페 4', '로컬 카페 5', '로컬 카페 6', '로컬 카페 7'];

  const categories = ['카페', '디저트카페', '브런치카페', '루프탑카페', '뷰맛집', '베이커리카페'];
  const tags = ['뷰맛집', '디저트', '커피맛집', '브런치', '인스타감성', '조용한', '넓은주차장', '펫프렌들리', '테라스'];

  return locationNames.slice(0, 6).map((name, index) => ({
    id: `location-${index + 1}`,
    title: name,
    description: `${query}에서 인기있는 ${categories[index % categories.length]}입니다. 아늑한 분위기와 맛있는 음료로 많은 사랑을 받고 있습니다.`,
    url: `https://example.com/place/${index + 1}`,
    imageUrl: `https://picsum.photos/seed/${query}${index}/400/300`,
    category: categories[index % categories.length],
    tags: tags.slice(index % 3, (index % 3) + 3),
    metadata: {
      rating: (4 + Math.random()).toFixed(1),
      reviewCount: Math.floor(Math.random() * 500) + 50,
      distance: `${(Math.random() * 3 + 0.5).toFixed(1)}km`,
      address: query.includes('제주')
        ? `제주특별자치도 제주시 ${['애월읍', '한림읍', '조천읍', '구좌읍'][index % 4]} ${index + 1}길 ${Math.floor(Math.random() * 100) + 1}`
        : query.includes('강남')
        ? `서울특별시 강남구 ${['테헤란로', '강남대로', '논현로', '압구정로'][index % 4]} ${Math.floor(Math.random() * 500) + 1}`
        : `서울특별시 ${['마포구', '종로구', '용산구', '성동구'][index % 4]} ${index + 1}길 ${Math.floor(Math.random() * 100) + 1}`,
      openHours: `${8 + (index % 3)}:00 - ${21 + (index % 3)}:00`,
      priceRange: ['₩', '₩₩', '₩₩₩'][index % 3],
      phone: `02-${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`,
    },
  }));
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
