import { SearchResult, TemplateType, ControllerType, ResultType, SearchResultItem } from '@/types';
import OpenAI from 'openai';

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 비인물 occupation 값 (국가, 기관, 회사 등)
const NON_PERSON_OCCUPATIONS = ['국가', '회사', '기업', '단체', '기관', '조직', '브랜드', '도시', '지역'];

// 실제 인물인지 확인
function isActualPerson(item: SearchResultItem): boolean {
  if (!item.metadata) return false;

  const occupation = item.metadata.occupation;
  if (occupation && typeof occupation === 'string') {
    if (NON_PERSON_OCCUPATIONS.some(np => occupation.includes(np))) {
      return false;
    }
    return true;
  }

  if (item.metadata.birthDate) return true;
  return false;
}

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
- exchange-rate: 환율 정보 (환율, 달러, 엔화, 유로, 통화 환전)
- article: 기사 본문 (뉴스, 경제 기사, 상세 본문)
- profile: 인물 프로필 (위키 스타일 인물 정보, 단일 인물)
- dual-profile: 두 인물 비교 레이아웃 (2명 인물 프로필 + 관련 뉴스)
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

// data-dc/disp-attr 기반 템플릿 매핑 (영문 + 한글 키 모두 지원)
const DATA_DC_TEMPLATE_MAP: Record<string, { template: TemplateType; resultType: ResultType; controllers: ControllerType[] }> = {
  // 영문 키
  'exchange': { template: 'exchange-rate', resultType: 'exchange', controllers: ['date-range', 'filter'] },
  'country': { template: 'country', resultType: 'country', controllers: ['filter'] },
  'events': { template: 'timeline', resultType: 'events', controllers: ['filter', 'date-range', 'sort'] },
  'people': { template: 'profile', resultType: 'people', controllers: ['filter', 'sort', 'pagination'] },
  'news': { template: 'hero', resultType: 'news', controllers: ['filter', 'sort', 'date-range', 'pagination'] },
  'products': { template: 'shopping', resultType: 'products', controllers: ['price-range', 'brand-filter', 'rating-filter', 'discount-filter', 'sort', 'view-toggle', 'pagination'] },
  'locations': { template: 'map', resultType: 'locations', controllers: ['filter', 'search-refine'] },
  'weather': { template: 'weather', resultType: 'weather', controllers: ['date-range'] },
  'images': { template: 'gallery', resultType: 'images', controllers: ['filter', 'view-toggle', 'pagination'] },
  'videos': { template: 'gallery', resultType: 'images', controllers: ['filter', 'view-toggle', 'pagination'] },
  // 한글 키 (LLM이 한글로 반환하는 경우 대응)
  '환율': { template: 'exchange-rate', resultType: 'exchange', controllers: ['date-range', 'filter'] },
  '국가': { template: 'country', resultType: 'country', controllers: ['filter'] },
  '이벤트': { template: 'timeline', resultType: 'events', controllers: ['filter', 'date-range', 'sort'] },
  '축제': { template: 'timeline', resultType: 'events', controllers: ['filter', 'date-range', 'sort'] },
  '인물': { template: 'profile', resultType: 'people', controllers: ['filter', 'sort', 'pagination'] },
  '뉴스': { template: 'hero', resultType: 'news', controllers: ['filter', 'sort', 'date-range', 'pagination'] },
  '쇼핑': { template: 'shopping', resultType: 'products', controllers: ['price-range', 'brand-filter', 'rating-filter', 'discount-filter', 'sort', 'view-toggle', 'pagination'] },
  '상품': { template: 'shopping', resultType: 'products', controllers: ['price-range', 'brand-filter', 'rating-filter', 'discount-filter', 'sort', 'view-toggle', 'pagination'] },
  '장소': { template: 'map', resultType: 'locations', controllers: ['filter', 'search-refine'] },
  '날씨': { template: 'weather', resultType: 'weather', controllers: ['date-range'] },
  '이미지': { template: 'gallery', resultType: 'images', controllers: ['filter', 'view-toggle', 'pagination'] },
  '동영상': { template: 'gallery', resultType: 'images', controllers: ['filter', 'view-toggle', 'pagination'] },
};

// LLM 응답 파싱 (시뮬레이션)
function parseQueryIntent(query: string, searchResult: SearchResult): LLMTemplateDecision {
  const items = searchResult.items;

  // 0. data-dc/disp-attr 기반 primaryIntent 확인 (가장 우선)
  const analysisIntent = searchResult.metadata?.analysis?.primaryIntent;
  if (analysisIntent && DATA_DC_TEMPLATE_MAP[analysisIntent]) {
    const mapping = DATA_DC_TEMPLATE_MAP[analysisIntent];
    console.log(`[LLM Template] Using data-dc based intent: ${analysisIntent}`);

    // 인물 검색의 경우 추가 로직 적용
    if (analysisIntent === 'people') {
      const personItems = items.filter(isActualPerson);
      const newsItems = items.filter(i => i.category === '뉴스' || (i.timestamp && i.metadata?.source));

      if (personItems.length === 2) {
        const names = personItems.map(p => p.title);
        const uniqueNames = new Set(names);
        if (uniqueNames.size === 2) {
          return {
            template: 'dual-profile',
            resultType: 'people',
            controllers: ['filter', 'sort', 'date-range', 'pagination'],
            reasoning: `[data-dc: PRF] 두 인물(${names.join(', ')}) + 관련 뉴스(${newsItems.length}건)로 dual-profile 템플릿 선택`
          };
        }
      }

      if (personItems.length > 0 && newsItems.length > 0) {
        return {
          template: 'hero',
          resultType: 'people',
          controllers: ['filter', 'sort', 'date-range', 'pagination'],
          reasoning: `[data-dc: PRF] 인물 프로필(${personItems.length}건) + 관련 뉴스(${newsItems.length}건) 복합 검색으로 hero 템플릿 선택`
        };
      }

      if (personItems.length === 1) {
        return {
          template: 'profile',
          resultType: 'people',
          controllers: ['filter', 'sort', 'pagination'],
          reasoning: `[data-dc: PRF] 단일 인물 정보가 감지되어 profile 템플릿 선택`
        };
      }
    }

    // 뉴스 검색의 경우 기사 개수에 따라 템플릿 조정
    if (analysisIntent === 'news' && items.length === 1) {
      return {
        template: 'article',
        resultType: 'news',
        controllers: ['filter', 'sort', 'date-range', 'pagination'],
        reasoning: `[data-dc: DNS] 단일 기사로 article 템플릿 선택`
      };
    }

    return {
      ...mapping,
      reasoning: `[data-dc: ${analysisIntent}] ${analysisIntent} 컴포넌트가 감지되어 ${mapping.template} 템플릿 선택`
    };
  }

  // 1. 메타데이터 기반 판단 (폴백)
  const hasPrice = items.some(item => item.metadata && 'price' in item.metadata);
  const hasRating = items.some(item => item.metadata && 'rating' in item.metadata);
  const hasCondition = items.some(item => item.metadata && 'condition' in item.metadata);
  const hasAddress = items.some(item => item.metadata && 'address' in item.metadata);
  const hasBio = items.some(isActualPerson);
  const hasBody = items.some(item => item.metadata && 'body' in item.metadata);
  const hasExchangeRate = items.some(item => item.metadata && 'currencyCode' in item.metadata);

  // 환율 데이터가 있는 경우
  if (hasExchangeRate || items.some(i => i.category === '환율')) {
    return {
      template: 'exchange-rate',
      resultType: 'exchange',
      controllers: ['date-range', 'filter'],
      reasoning: '환율 데이터(currencyCode)가 감지되어 exchange-rate 템플릿 선택'
    };
  }

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

  // 인물 정보가 있는 경우
  if (hasBio) {
    // 인물 카테고리 아이템과 뉴스 아이템 분리
    const personItems = items.filter(isActualPerson);
    const newsItems = items.filter(i => i.category === '뉴스' || (i.timestamp && i.metadata?.source));

    // 2명의 서로 다른 인물이 있는 경우 → dual-profile 템플릿
    if (personItems.length === 2) {
      // 두 인물이 서로 다른 사람인지 확인 (이름이 다르면 다른 사람)
      const names = personItems.map(p => p.title);
      const uniqueNames = new Set(names);

      if (uniqueNames.size === 2) {
        return {
          template: 'dual-profile',
          resultType: 'people',
          controllers: ['filter', 'sort', 'date-range', 'pagination'],
          reasoning: `두 인물(${names.join(', ')}) + 관련 뉴스(${newsItems.length}건)로 dual-profile 템플릿 선택`
        };
      }
    }

    if (personItems.length > 0 && newsItems.length > 0) {
      // 인물 + 뉴스 복합 → hero 템플릿 (메인: 인물, 사이드: 뉴스)
      return {
        template: 'hero',
        resultType: 'people',
        controllers: ['filter', 'sort', 'date-range', 'pagination'],
        reasoning: `인물 프로필(${personItems.length}건) + 관련 뉴스(${newsItems.length}건) 복합 검색으로 hero 템플릿 선택`
      };
    }

    if (personItems.length === 1) {
      return {
        template: 'profile',
        resultType: 'people',
        controllers: ['filter', 'sort', 'pagination'],
        reasoning: '단일 인물 정보(birthDate, occupation)가 감지되어 profile 템플릿 선택'
      };
    }

    // 인물 여러 명
    return {
      template: 'grid',
      resultType: 'people',
      controllers: ['filter', 'sort', 'pagination'],
      reasoning: '여러 인물 정보가 감지되어 grid 템플릿 선택'
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

  // 2. 기본 폴백 (data-dc가 없고 메타데이터도 없는 경우)
  // 이미지 유무와 결과 수에 따라 결정
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

// 시스템 프롬프트
const SYSTEM_PROMPT = `당신은 검색 결과에 가장 적합한 UI 템플릿을 선택하는 전문가입니다.
검색어와 결과를 분석하여 최적의 템플릿, 결과 타입, 필요한 컨트롤러를 JSON 형식으로 반환하세요.

응답 형식 (반드시 이 JSON 형식으로만 응답):
{
  "template": "템플릿 이름",
  "resultType": "결과 타입",
  "controllers": ["컨트롤러1", "컨트롤러2"],
  "reasoning": "선택 이유"
}

사용 가능한 템플릿:
- shopping: 상품 목록 (가격, 평점, 할인 정보가 있는 제품)
- map: 지도 기반 (장소, 위치, 맛집, 카페, 관광지)
- weather: 날씨 정보 (날씨, 기온, 예보)
- article: 기사 본문 (뉴스, 경제 기사, 상세 본문)
- profile: 인물 프로필 (위키 스타일 인물 정보, 단일 인물)
- dual-profile: 두 인물 비교 레이아웃 (2명 인물 프로필 + 관련 뉴스)
- hero: 히어로 레이아웃 (메인 콘텐츠 + 사이드바, 뉴스/기사 목록)
- gallery: 갤러리 (이미지 중심)
- timeline: 타임라인 (이벤트, 일정)
- carousel: 캐러셀 (슬라이드 형태)
- grid: 그리드 (균일한 카드)
- list: 리스트 (목록 형태)
- card: 카드 레이아웃 (기본)

사용 가능한 결과 타입:
- products, locations, weather, news, people, images, events, videos, mixed

사용 가능한 컨트롤러:
- filter, sort, pagination, view-toggle, search-refine, date-range
- price-range, brand-filter, rating-filter, discount-filter (쇼핑용)`;

// LLM 응답 파싱
function parseLLMResponse(content: string): LLMTemplateDecision | null {
  try {
    // JSON 블록 추출 (```json ... ``` 또는 순수 JSON)
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) ||
                      content.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      console.error('[LLM Template Service] No JSON found in response');
      return null;
    }

    const jsonStr = jsonMatch[1] || jsonMatch[0];
    const parsed = JSON.parse(jsonStr);

    // 유효성 검사
    if (!parsed.template || !parsed.resultType) {
      console.error('[LLM Template Service] Invalid response structure');
      return null;
    }

    return {
      template: parsed.template as TemplateType,
      resultType: parsed.resultType as ResultType,
      controllers: (parsed.controllers || []) as ControllerType[],
      reasoning: parsed.reasoning || 'LLM 분석 완료',
    };
  } catch (error) {
    console.error('[LLM Template Service] Parse error:', error);
    return null;
  }
}

// 두 인물 패턴 감지 (dual-profile 후처리)
function checkDualProfileOverride(
  searchResult: SearchResult,
  decision: LLMTemplateDecision
): LLMTemplateDecision {
  const items = searchResult.items;

  // 인물 카테고리 아이템 필터링
  const personItems = items.filter(
    i => i.category === '인물' || i.metadata?.occupation
  );

  // 정확히 2명의 서로 다른 인물이 있는 경우
  if (personItems.length === 2) {
    const names = personItems.map(p => p.title);
    const uniqueNames = new Set(names);

    if (uniqueNames.size === 2) {
      const newsItems = items.filter(
        i => i.category === '뉴스' || (i.timestamp && i.metadata?.source)
      );

      console.log(`[LLM Template Service] Dual-profile override: ${names.join(', ')}`);
      return {
        template: 'dual-profile',
        resultType: 'people',
        controllers: ['filter', 'sort', 'date-range', 'pagination'],
        reasoning: `두 인물(${names.join(', ')}) + 관련 뉴스(${newsItems.length}건)로 dual-profile 템플릿 선택`
      };
    }
  }

  return decision;
}

// LLM 기반 템플릿 결정 (메인 함수)
export async function decidetTemplateWithLLM(
  query: string,
  searchResult: SearchResult
): Promise<LLMTemplateDecision> {
  const userPrompt = buildPrompt(query, searchResult);
  console.log('[LLM Template Service] Analyzing query:', query);

  // API 키가 없으면 폴백 사용
  if (!process.env.OPENAI_API_KEY) {
    console.log('[LLM Template Service] No API key, using fallback');
    return parseQueryIntent(query, searchResult);
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      console.log('[LLM Template Service] Empty response, using fallback');
      return parseQueryIntent(query, searchResult);
    }

    console.log('[LLM Template Service] LLM Response:', content);

    let decision = parseLLMResponse(content);

    if (!decision) {
      console.log('[LLM Template Service] Parse failed, using fallback');
      return parseQueryIntent(query, searchResult);
    }

    // 두 인물 패턴 후처리 체크
    decision = checkDualProfileOverride(searchResult, decision);

    console.log('[LLM Template Service] Decision:', decision);
    return decision;

  } catch (error) {
    console.error('[LLM Template Service] API error:', error);
    // 에러 시 폴백 로직 사용
    return parseQueryIntent(query, searchResult);
  }
}

// 동기 버전 (캐시된 결과나 빠른 판단용)
export function decideTemplateSync(
  query: string,
  searchResult: SearchResult
): LLMTemplateDecision {
  return parseQueryIntent(query, searchResult);
}
