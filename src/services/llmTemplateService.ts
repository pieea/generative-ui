import { SearchResult, TemplateType, ControllerType, ResultType } from '@/types';

// LLM 템플릿 결정 결과
export interface LLMTemplateDecision {
  template: TemplateType;
  resultType: ResultType;
  controllers: ControllerType[];
  reasoning: string;
}

// LLM 프롬프트 생성
function buildPrompt(query: string, searchResult: SearchResult): string {
  const itemSummary = searchResult.items.slice(0, 3).map(item => ({
    title: item.title,
    category: item.category,
    hasImage: !!item.imageUrl,
    hasMeta: !!item.metadata,
    metaKeys: item.metadata ? Object.keys(item.metadata) : [],
  }));

  return `
검색어: "${query}"
결과 수: ${searchResult.items.length}개
샘플 결과:
${JSON.stringify(itemSummary, null, 2)}

사용 가능한 템플릿:
- shopping: 상품 목록 (가격, 평점, 할인 정보가 있는 제품)
- map: 지도 기반 (장소, 위치, 맛집, 카페, 관광지)
- weather: 날씨 정보 (날씨, 기온, 예보)
- article: 기사 본문 (뉴스, 경제 기사, 상세 본문)
- profile: 인물 프로필 (위키 스타일 인물 정보)
- hero: 히어로 레이아웃 (메인 콘텐츠 + 사이드바)
- gallery: 갤러리 (이미지 중심)
- timeline: 타임라인 (이벤트, 일정)
- carousel: 캐러셀 (슬라이드 형태)
- grid: 그리드 (균일한 카드)
- list: 리스트 (목록 형태)
- card: 카드 레이아웃

위 정보를 바탕으로 가장 적합한 템플릿을 선택하세요.
`;
}

// LLM 응답 파싱 (시뮬레이션)
function parseQueryIntent(query: string, searchResult: SearchResult): LLMTemplateDecision {
  const queryLower = query.toLowerCase();
  const items = searchResult.items;

  // 메타데이터 분석
  const hasPrice = items.some(item => item.metadata && 'price' in item.metadata);
  const hasRating = items.some(item => item.metadata && 'rating' in item.metadata);
  const hasCondition = items.some(item => item.metadata && 'condition' in item.metadata);
  const hasAddress = items.some(item => item.metadata && 'address' in item.metadata);
  const hasBio = items.some(item => item.metadata && ('birthDate' in item.metadata || 'occupation' in item.metadata));
  const hasBody = items.some(item => item.metadata && 'body' in item.metadata);

  // 1. 메타데이터 기반 판단 (가장 정확)
  if (hasCondition) {
    return {
      template: 'weather',
      resultType: 'mixed',
      controllers: [],
      reasoning: '날씨 조건 데이터(condition)가 감지되어 weather 템플릿 선택'
    };
  }

  if (hasPrice && hasRating) {
    return {
      template: 'shopping',
      resultType: 'products',
      controllers: ['price-range', 'brand-filter', 'rating-filter', 'discount-filter', 'sort', 'view-toggle', 'pagination'],
      reasoning: '가격(price)과 평점(rating) 데이터가 감지되어 shopping 템플릿 선택'
    };
  }

  if (hasAddress) {
    return {
      template: 'map',
      resultType: 'locations',
      controllers: ['filter', 'search-refine'],
      reasoning: '주소(address) 데이터가 감지되어 map 템플릿 선택'
    };
  }

  if (hasBio && items.length === 1) {
    return {
      template: 'profile',
      resultType: 'people',
      controllers: ['filter', 'sort', 'pagination'],
      reasoning: '인물 정보(birthDate, occupation)가 감지되어 profile 템플릿 선택'
    };
  }

  if (hasBody) {
    return {
      template: 'article',
      resultType: 'news',
      controllers: ['filter', 'sort', 'date-range', 'pagination'],
      reasoning: '기사 본문(body) 데이터가 감지되어 article 템플릿 선택'
    };
  }

  // 2. 쿼리 의도 분석 (자연어 이해)
  const shoppingIntents = [
    '추천', '가성비', '비교', '리뷰', '후기', '최저가', '할인', '구매', '쇼핑',
    '노트북', '태블릿', '스마트폰', '핸드폰', '휴대폰', '아이폰', '갤럭시', '아이패드',
    '이어폰', '헤드폰', '에어팟', '버즈', '무선',
    '모니터', '키보드', '마우스', 'tv', '냉장고', '세탁기', '에어컨', '청소기',
    '카메라', '렌즈', '게이밍', '그래픽카드', 'ssd', '메모리', '가격'
  ];

  const locationIntents = [
    '맛집', '카페', '음식점', '식당', '레스토랑', '베이커리', '브런치',
    '관광지', '명소', '볼거리', '여행', '숙소', '호텔', '펜션',
    '공원', '박물관', '미술관', '서점',
    '서울', '제주', '강남', '홍대', '이태원', '부산', '경주', '전주', '속초'
  ];

  const weatherIntents = ['날씨', '기온', '온도', '비', '눈', '맑음', '흐림', '일기예보', '기상', '미세먼지'];

  const newsIntents = ['뉴스', '기사', '속보', '경제', '금융', '주식', '증시', '환율'];

  const peopleIntents = ['ceo', '배우', '가수', '인물', '감독', '작가', '선수'];

  // 의도 매칭
  if (shoppingIntents.some(intent => queryLower.includes(intent))) {
    return {
      template: 'shopping',
      resultType: 'products',
      controllers: ['price-range', 'brand-filter', 'rating-filter', 'discount-filter', 'sort', 'view-toggle', 'pagination'],
      reasoning: `쿼리에서 쇼핑/상품 관련 의도 감지: "${query}"`
    };
  }

  if (locationIntents.some(intent => queryLower.includes(intent))) {
    return {
      template: 'map',
      resultType: 'locations',
      controllers: ['filter', 'search-refine'],
      reasoning: `쿼리에서 장소/위치 관련 의도 감지: "${query}"`
    };
  }

  if (weatherIntents.some(intent => queryLower.includes(intent))) {
    return {
      template: 'weather',
      resultType: 'mixed',
      controllers: [],
      reasoning: `쿼리에서 날씨 관련 의도 감지: "${query}"`
    };
  }

  if (newsIntents.some(intent => queryLower.includes(intent))) {
    const template = items.length === 1 ? 'article' : 'hero';
    return {
      template,
      resultType: 'news',
      controllers: ['filter', 'sort', 'date-range', 'pagination'],
      reasoning: `쿼리에서 뉴스/기사 관련 의도 감지: "${query}"`
    };
  }

  if (peopleIntents.some(intent => queryLower.includes(intent))) {
    const template = items.length === 1 ? 'profile' : 'grid';
    return {
      template,
      resultType: 'people',
      controllers: ['filter', 'sort', 'pagination'],
      reasoning: `쿼리에서 인물 관련 의도 감지: "${query}"`
    };
  }

  // 3. 기본값: 이미지 유무와 결과 수에 따라 결정
  const hasImages = items.some(item => item.imageUrl);

  if (hasImages && items.length >= 6) {
    return {
      template: 'gallery',
      resultType: 'images',
      controllers: ['filter', 'view-toggle', 'pagination'],
      reasoning: '이미지가 포함된 다수의 결과로 gallery 템플릿 선택'
    };
  }

  if (items.length >= 3) {
    return {
      template: 'hero',
      resultType: 'mixed',
      controllers: ['filter', 'sort', 'view-toggle', 'pagination'],
      reasoning: '여러 결과가 있어 hero 템플릿 선택'
    };
  }

  return {
    template: 'card',
    resultType: 'mixed',
    controllers: ['filter', 'sort', 'pagination'],
    reasoning: '기본 card 템플릿 선택'
  };
}

// LLM 기반 템플릿 결정 (메인 함수)
export async function decidetTemplateWithLLM(
  query: string,
  searchResult: SearchResult
): Promise<LLMTemplateDecision> {
  // 실제 LLM API 호출 시뮬레이션
  // 프로덕션에서는 OpenAI, Anthropic 등의 API를 호출

  const prompt = buildPrompt(query, searchResult);
  console.log('[LLM Template Service] Analyzing query:', query);
  console.log('[LLM Template Service] Prompt:', prompt);

  // LLM 응답 시뮬레이션 (실제로는 API 호출)
  const decision = parseQueryIntent(query, searchResult);

  console.log('[LLM Template Service] Decision:', decision);

  return decision;
}

// 동기 버전 (캐시된 결과나 빠른 판단용)
export function decideTemplateSync(
  query: string,
  searchResult: SearchResult
): LLMTemplateDecision {
  return parseQueryIntent(query, searchResult);
}
