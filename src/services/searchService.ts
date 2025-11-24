import { SearchResult, ResultType, SearchResultItem } from '@/types';
import { analyzeDaumSearch, SearchEngineAnalysis } from './daumSearchService';
import { rewriteQuery, ExpandedQuery } from './queryRewriteService';

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

// 여러 분석 결과 병합
function mergeAnalyses(
  originalQuery: string,
  analyses: { query: ExpandedQuery; analysis: SearchEngineAnalysis }[]
): {
  items: SearchResultItem[];
  components: { type: string; title: string; itemCount: number }[];
  primaryIntent: string;
  secondaryIntent?: string;
  reasoning: string;
  llmExtractedCount: number;
} {
  // 모든 아이템 수집 (각 쿼리의 의도 태깅)
  const allItems: SearchResultItem[] = [];
  const allComponents: { type: string; title: string; itemCount: number }[] = [];
  let totalLlmExtracted = 0;

  for (const { query, analysis } of analyses) {
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

  // 주요 의도 결정 (첫 번째 분석 기준)
  const primary = analyses[0]?.analysis;

  return {
    items: deduped,
    components: allComponents,
    primaryIntent: primary?.primaryIntent || 'mixed',
    secondaryIntent: primary?.secondaryIntent,
    reasoning: analyses.map(a => `[${a.query.intent}] ${a.analysis.reasoning}`).join(' | '),
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
    const merged = mergeAnalyses(query, analyses);

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

  // 3. 결과 타입 분류
  // 디버그: 인물 관련 메타데이터 확인
  const peopleItems = items.filter(i => i.metadata && ('occupation' in i.metadata || 'birthDate' in i.metadata));
  console.log('[Search Service] People items found:', peopleItems.length, peopleItems.map(i => ({ title: i.title, occupation: i.metadata?.occupation })));

  const resultType = classifyResultType(query, items);
  console.log('[Search Service] Final resultType:', resultType);

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
