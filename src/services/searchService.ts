import { SearchResult, ResultType, SearchResultItem } from '@/types';
import { analyzeDaumSearch, SearchEngineAnalysis } from './daumSearchService';
import { rewriteQuery, ExpandedQuery } from './queryRewriteService';
import OpenAI from 'openai';

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
    // 비인물 occupation이면 제외
    if (NON_PERSON_OCCUPATIONS.some(np => occupation.includes(np))) {
      return false;
    }
    return true;
  }

  // birthDate가 있으면 인물로 간주
  if (item.metadata.birthDate) return true;

  return false;
}

// 검색 결과 타입 분류 (메타데이터 기반)
export function classifyResultType(query: string, items: SearchResultItem[]): ResultType {
  const hasPrice = items.some((item) => item.metadata && 'price' in item.metadata);
  const hasRating = items.some((item) => item.metadata && 'rating' in item.metadata);
  const hasAddress = items.some((item) => item.metadata && 'address' in item.metadata);
  const hasCondition = items.some((item) => item.metadata && 'condition' in item.metadata);
  const hasBio = items.some(isActualPerson);
  const hasExchangeRate = items.some((item) => item.metadata && 'currencyCode' in item.metadata);
  const hasCountryInfo = items.some((item) => item.category === '국가' || (item.metadata && 'countryCode' in item.metadata && 'capital' in item.metadata));

  // 국가 정보가 있으면 country 타입 반환
  if (hasCountryInfo) return 'country';
  if (hasExchangeRate) return 'exchange';
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

// 아이템 중복 제거 (제목 기준)
function deduplicateItems(items: SearchResultItem[]): SearchResultItem[] {
  const seen = new Set<string>();
  return items.filter(item => {
    const key = item.title.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// LLM 기반 일관성 검사
async function checkQueryConsistencyWithLLM(
  originalQuery: string,
  originalAnalysis: SearchEngineAnalysis,
  expandedAnalysis: { query: ExpandedQuery; analysis: SearchEngineAnalysis }
): Promise<boolean> {
  // people 의도 쿼리의 경우만 검사
  if (expandedAnalysis.query.intent !== 'people') {
    return true;
  }

  const personItems = expandedAnalysis.analysis.allItems.filter(
    item => item.category === '인물' || item.metadata?.occupation
  );

  if (personItems.length === 0) {
    console.log(`[Consistency Check] No person found in "${expandedAnalysis.query.query}"`);
    return false;
  }

  // API 키가 없으면 기본 문자열 매칭으로 폴백
  if (!process.env.OPENAI_API_KEY) {
    console.log('[Consistency Check] No API key, using fallback string matching');
    return checkQueryConsistencyFallback(originalAnalysis, expandedAnalysis);
  }

  // 원 쿼리 결과 요약
  const originalSummary = originalAnalysis.allItems.slice(0, 5).map(item => ({
    title: item.title,
    description: item.description?.slice(0, 100),
    category: item.category,
    occupation: item.metadata?.occupation,
  }));

  // 확장 쿼리에서 추출된 인물 정보
  const expandedPerson = personItems[0];
  const expandedPersonInfo = {
    name: expandedPerson.title,
    occupation: expandedPerson.metadata?.occupation,
    organization: expandedPerson.metadata?.organization,
    description: expandedPerson.description?.slice(0, 100),
  };

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `당신은 검색 결과의 일관성을 판단하는 전문가입니다.
사용자가 검색한 원본 쿼리의 결과와, 확장된 인물 쿼리의 결과가 **동일한 사람**을 가리키는지 판단하세요.

동명이인 판단 기준:
1. 직업/분야가 다르면 동명이인 (예: 가수 vs 바둑기사)
2. 소속이 완전히 다르면 동명이인
3. 맥락이 전혀 다르면 동명이인

JSON으로 응답: {"isSamePerson": true/false, "reason": "판단 이유"}`,
        },
        {
          role: 'user',
          content: `원본 쿼리: "${originalQuery}"

원본 쿼리 검색 결과:
${JSON.stringify(originalSummary, null, 2)}

확장 쿼리 "${expandedAnalysis.query.query}"에서 추출된 인물:
${JSON.stringify(expandedPersonInfo, null, 2)}

위 인물이 원본 쿼리 결과에서 언급되는 인물과 동일인인가요?`,
        },
      ],
      temperature: 0.1,
      max_tokens: 200,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.log('[Consistency Check] Empty LLM response, using fallback');
      return checkQueryConsistencyFallback(originalAnalysis, expandedAnalysis);
    }

    console.log('[Consistency Check] LLM Response:', content);

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return checkQueryConsistencyFallback(originalAnalysis, expandedAnalysis);
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const isSamePerson = parsed.isSamePerson === true;

    console.log(`[Consistency Check] LLM Decision: ${isSamePerson ? 'SAME PERSON' : 'DIFFERENT PERSON'} - ${parsed.reason}`);

    return isSamePerson;
  } catch (error) {
    console.error('[Consistency Check] LLM error:', error);
    return checkQueryConsistencyFallback(originalAnalysis, expandedAnalysis);
  }
}

// 폴백: 문자열 기반 일관성 검사
function checkQueryConsistencyFallback(
  originalAnalysis: SearchEngineAnalysis,
  expandedAnalysis: { query: ExpandedQuery; analysis: SearchEngineAnalysis }
): boolean {
  const personItems = expandedAnalysis.analysis.allItems.filter(
    item => item.category === '인물' || item.metadata?.occupation
  );

  const originalPersonItems = originalAnalysis.allItems.filter(
    item => item.category === '인물' || item.metadata?.occupation
  );

  if (originalPersonItems.length > 0 && personItems.length > 0) {
    const originalOccupations = originalPersonItems
      .map(p => (p.metadata?.occupation || '').toString().toLowerCase())
      .filter(o => o.length > 0);

    const expandedOccupations = personItems
      .map(p => (p.metadata?.occupation || '').toString().toLowerCase())
      .filter(o => o.length > 0);

    if (originalOccupations.length > 0 && expandedOccupations.length > 0) {
      const hasMatch = expandedOccupations.some(exp =>
        originalOccupations.some(orig => exp.includes(orig) || orig.includes(exp))
      );
      if (!hasMatch) {
        console.log(`[Consistency Check] Fallback: Occupation mismatch`);
        return false;
      }
    }
  }

  // 이름이 원 쿼리 결과에 등장하는지 확인
  const originalTexts = originalAnalysis.allItems
    .map(item => `${item.title} ${item.description || ''}`.toLowerCase())
    .join(' ');

  return personItems.some(person => {
    const name = person.title.toLowerCase().trim();
    return name.length >= 2 && originalTexts.includes(name);
  });
}

// 여러 분석 결과 병합 (LLM 기반 일관성 검사 포함)
async function mergeAnalyses(
  originalQuery: string,
  analyses: { query: ExpandedQuery; analysis: SearchEngineAnalysis }[]
): Promise<{
  items: SearchResultItem[];
  components: { type: string; title: string; itemCount: number }[];
  primaryIntent: string;
  secondaryIntent?: string;
  reasoning: string;
  llmExtractedCount: number;
}> {
  // 원 쿼리 찾기 (원본 쿼리와 동일하거나 가장 긴 쿼리)
  const originalAnalysis = analyses.find(a => a.query.query === originalQuery)
    || analyses.reduce((longest, current) =>
        current.query.query.length > longest.query.query.length ? current : longest
      );

  // LLM 기반 일관성 검사: 확장 쿼리 결과가 원 쿼리와 일치하는지 확인
  const consistencyChecks = await Promise.all(
    analyses.map(async (a) => {
      if (a === originalAnalysis) return { analysis: a, isConsistent: true };

      const isConsistent = await checkQueryConsistencyWithLLM(
        originalQuery,
        originalAnalysis.analysis,
        a
      );

      if (!isConsistent) {
        console.log(`[Merge] Dropping inconsistent query: "${a.query.query}" (${a.query.intent})`);
      }
      return { analysis: a, isConsistent };
    })
  );

  const consistentAnalyses = consistencyChecks
    .filter(c => c.isConsistent)
    .map(c => c.analysis);

  console.log(`[Merge] Using ${consistentAnalyses.length}/${analyses.length} queries after consistency check`);

  // 일관성 있는 결과만 병합
  const allItems: SearchResultItem[] = [];
  const allComponents: { type: string; title: string; itemCount: number }[] = [];
  let totalLlmExtracted = 0;

  for (const { query, analysis } of consistentAnalyses) {
    // 아이템에 쿼리 출처 태깅
    const taggedItems = analysis.allItems.map(item => ({
      ...item,
      metadata: {
        ...item.metadata,
        querySource: query.query,
        queryIntent: query.intent,
      },
    }));
    allItems.push(...taggedItems);

    // 컴포넌트 수집
    analysis.components.forEach(c => {
      allComponents.push({
        type: c.type,
        title: `[${query.intent}] ${c.title}`,
        itemCount: c.items.length,
      });
    });

    totalLlmExtracted += analysis.llmExtractedItems.length;
  }

  // 중복 제거
  const deduped = deduplicateItems(allItems);

  // 주요 의도 결정 (원 쿼리 기준)
  const primary = originalAnalysis?.analysis;

  return {
    items: deduped,
    components: allComponents,
    primaryIntent: primary?.primaryIntent || 'mixed',
    secondaryIntent: primary?.secondaryIntent,
    reasoning: consistentAnalyses.map(a => `[${a.query.intent}] ${a.analysis.reasoning}`).join(' | '),
    llmExtractedCount: totalLlmExtracted,
  };
}

// 검색 수행 (다음 검색 엔진 기반 + 이중 쿼리 지원)
export async function performSearch(query: string): Promise<SearchResult> {
  // 1. 쿼리 확장 분석
  const rewriteResult = await rewriteQuery(query);
  console.log('[Search Service] Query rewrite:', rewriteResult.shouldExpand ? 'EXPAND' : 'SINGLE');
  console.log('[Search Service] Queries:', rewriteResult.expandedQueries.map(q => q.query).join(', '));

  let items: SearchResultItem[];
  let analysisMetadata: {
    primaryIntent: string;
    secondaryIntent?: string;
    components: { type: string; title: string; itemCount: number }[];
    reasoning: string;
  };
  let llmExtractedCount: number;

  if (rewriteResult.shouldExpand && rewriteResult.expandedQueries.length > 1) {
    // 2a. 이중 쿼리 검색: 각 쿼리에 대해 병렬로 다음 검색 실행
    console.log('[Search Service] Performing multi-query search...');

    const searchPromises = rewriteResult.expandedQueries.map(async (eq) => {
      const analysis = await analyzeDaumSearch(eq.query);
      console.log(`[Search Service] "${eq.query}" (${eq.intent}): ${analysis.allItems.length} items`);
      return { query: eq, analysis };
    });

    const analyses = await Promise.all(searchPromises);
    const merged = await mergeAnalyses(query, analyses);

    items = merged.items;
    llmExtractedCount = merged.llmExtractedCount;
    analysisMetadata = {
      primaryIntent: merged.primaryIntent,
      secondaryIntent: merged.secondaryIntent,
      components: merged.components,
      reasoning: merged.reasoning,
    };
  } else {
    // 2b. 단일 쿼리 검색
    const analysis = await analyzeDaumSearch(query);
    console.log('[Search Service] Daum analysis:', analysis.reasoning);
    console.log('[Search Service] Items from Daum:', analysis.allItems.length);

    items = analysis.allItems;
    llmExtractedCount = analysis.llmExtractedItems.length;
    analysisMetadata = {
      primaryIntent: analysis.primaryIntent,
      secondaryIntent: analysis.secondaryIntent,
      components: analysis.components.map(c => ({
        type: c.type,
        title: c.title,
        itemCount: c.items.length,
      })),
      reasoning: analysis.reasoning,
    };
  }

  // 3. 결과 타입 분류 - primaryIntent (data-dc 기반)를 우선 사용
  // 디버그: 인물 관련 메타데이터 확인
  const peopleItems = items.filter(i => i.metadata && ('occupation' in i.metadata || 'birthDate' in i.metadata));
  console.log('[Search Service] People items found:', peopleItems.length, peopleItems.map(i => ({ title: i.title, occupation: i.metadata?.occupation })));

  // primaryIntent가 유효하면 그대로 사용 (data-dc 기반)
  const validIntents: ResultType[] = ['news', 'products', 'images', 'locations', 'events', 'people', 'documents', 'weather', 'exchange', 'country', 'mixed'];
  const resultType = validIntents.includes(analysisMetadata.primaryIntent as ResultType)
    ? (analysisMetadata.primaryIntent as ResultType)
    : classifyResultType(query, items);  // 폴백
  console.log('[Search Service] Final resultType:', resultType, '(from:', validIntents.includes(analysisMetadata.primaryIntent as ResultType) ? 'data-dc' : 'fallback', ')');

  return {
    query,
    items,
    totalCount: items.length,
    resultType,
    metadata: {
      source: 'daum',
      searchTime: Math.random() * 500 + 100,
      llmExtractedCount,
      expandedQueries: rewriteResult.shouldExpand ? rewriteResult.expandedQueries : undefined,
      analysis: analysisMetadata,
    },
  };
}
