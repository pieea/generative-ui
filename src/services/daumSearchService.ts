/**
 * Daum Search Service - Main orchestration service (Refactored)
 *
 * This is the refactored version with proper separation of concerns.
 * To use this version, rename this file to daumSearchService.ts
 */
import { SearchResultItem, IntentType } from '@/types';
import { SearchIntent } from './queryRewriteService';
import {
  WEAK_INTENTS,
  STRONG_INTENTS,
  isStrongIntent,
} from '@/constants';
import {
  analyzeTopComponents,
  extractDispAttrList,
  TopComponentAnalysis,
  DispAttrInfo,
} from './analyzers';
import { fetchDaumSearch, fetchDaumImageSearch } from './fetchers';
import {
  extractComponents,
  extractImageItems,
} from './extractors';
import type { DaumSearchComponent } from './extractors';
import {
  extractStructuredData,
  analyzeIntent,
  IntentAnalysisResult,
} from './llm';
import { mergeItems } from './utils';

/**
 * Search engine analysis result
 */
export interface SearchEngineAnalysis {
  query: string;
  components: DaumSearchComponent[];
  allItems: SearchResultItem[];
  llmExtractedItems: SearchResultItem[];
  primaryIntent: SearchIntent;
  secondaryIntent?: SearchIntent;
  reasoning: string;
}

/**
 * Component priority for sorting
 */
const COMPONENT_PRIORITY: Record<string, number> = {
  exchange: 0,
  country: 1,
  products: 2,
  events: 3,
  people: 4,
  news: 5,
  locations: 6,
  weather: 7,
  images: 8,
  videos: 9,
  web: 10,
  mixed: 11,
};

/**
 * Sort components by priority
 */
const sortComponentsByPriority = (
  components: DaumSearchComponent[]
): DaumSearchComponent[] => {
  // Separate exchange and country components (highest priority)
  const exchangeComps = components.filter(c => c.type === 'exchange');
  const countryComps = components.filter(c => c.type === 'country');
  const otherComps = components.filter(
    c => c.type !== 'exchange' && c.type !== 'country'
  );

  // Sort others by priority
  const sortedOthers = otherComps.sort((a, b) => {
    const aPriority = COMPONENT_PRIORITY[a.type] || 10;
    const bPriority = COMPONENT_PRIORITY[b.type] || 10;
    return aPriority - bPriority;
  });

  return [...exchangeComps, ...countryComps, ...sortedOthers];
};

/**
 * Determine component count based on intent
 */
const getComponentCount = (components: DaumSearchComponent[]): number => {
  const hasSpecialIntent =
    components.some(c => c.type === 'exchange') ||
    components.some(c => c.type === 'country') ||
    components.some(c => c.type === 'products') ||
    components.some(c => c.type === 'events') ||
    components.some(c => c.type === 'people') ||
    components.some(c => c.type === 'news') ||
    components.some(c => c.type === 'weather');

  return hasSpecialIntent ? 4 : 2;
};

/**
 * Get quick intent from components
 */
const getQuickIntent = (components: DaumSearchComponent[]): IntentType | null => {
  if (components.some(c => c.type === 'exchange')) return 'exchange';
  if (components.some(c => c.type === 'country')) return 'country';
  if (components.some(c => c.type === 'events')) return 'events';
  if (components.some(c => c.type === 'weather')) return 'weather';
  if (components.some(c => c.type === 'products')) return 'products';
  if (components.some(c => c.type === 'people')) return 'people';
  if (components.some(c => c.type === 'news')) return 'news';
  return components[0]?.type as IntentType || null;
};

/**
 * Handle image search intent
 */
const handleImageSearch = async (
  query: string,
  topAnalysis: TopComponentAnalysis
): Promise<SearchEngineAnalysis | null> => {
  if (topAnalysis.primaryIntent !== 'images') {
    return null;
  }

  console.log('[Daum Search] Images intent detected - fetching dedicated image search');

  try {
    const imageHtml = await fetchDaumImageSearch(query);
    const imageItems = extractImageItems(imageHtml);

    if (imageItems.length > 0) {
      console.log(`[Daum Search] Image search returned ${imageItems.length} images`);
      return {
        query,
        components: [
          {
            type: 'images',
            title: '이미지 검색 결과',
            items: imageItems,
            raw: `이미지 검색: ${imageItems.length}개 결과`,
          },
        ],
        allItems: imageItems,
        llmExtractedItems: [],
        primaryIntent: 'images',
        reasoning: topAnalysis.reasoning,
      };
    }

    console.log('[Daum Search] Image search returned no results, continuing with normal analysis');
  } catch (error) {
    console.error('[Daum Search] Image search error:', error);
  }

  return null;
};

/**
 * Analyze Daum search results
 */
export const analyzeDaumSearch = async (
  query: string
): Promise<SearchEngineAnalysis> => {
  console.log('[Daum Search] Analyzing query:', query);

  try {
    // Fetch search results
    const html = await fetchDaumSearch(query);

    // Extract disp-attr information for LLM
    const dispAttrList = extractDispAttrList(html, 5);
    console.log(
      '[Daum Search] disp-attr list:',
      dispAttrList.map(d => `[${d.position}] ${d.dispAttr} → ${d.intent}`).join(', ')
    );

    // Analyze top components for image search handling
    const topAnalysis = analyzeTopComponents(html, query);

    // Handle image search if detected
    if (topAnalysis) {
      const imageResult = await handleImageSearch(query, topAnalysis);
      if (imageResult) {
        return imageResult;
      }
    }

    // Extract components
    const components = extractComponents(html, query);
    console.log(
      `[Daum Search] Found ${components.length} components with ${components.reduce((sum, c) => sum + c.items.length, 0)} items`
    );

    // Get quick intent from components
    const quickIntent = getQuickIntent(components);
    console.log('[Daum Search] Quick intent:', quickIntent);

    // Sort components by priority
    const sortedComponents = sortComponentsByPriority(components);

    // Determine how many components to use
    const componentCount = getComponentCount(sortedComponents);
    const topComponents = sortedComponents.slice(0, componentCount);
    console.log(
      '[Daum Search] Top components:',
      topComponents.map(c => `[${c.type}] ${c.title} (${c.items.length})`)
    );

    // Extract items using cheerio
    const cheerioItems = topComponents.flatMap(c => c.items);

    // Use LLM to analyze intent with disp-attr information
    const llmIntentResult = await analyzeIntent({
      query,
      components: topComponents,
      dispAttrList,
    });

    console.log(
      `[Daum Search] LLM Intent Analysis: ${llmIntentResult.primaryIntent} (${llmIntentResult.reasoning})`
    );

    // Extract structured data with LLM
    const llmExtractedItems = await extractStructuredData({
      query,
      components,
      searchIntent: llmIntentResult.primaryIntent,
    });

    console.log('[Daum Search] LLM extracted items:', llmExtractedItems.length);

    // Merge cheerio and LLM items
    const mergedItems = mergeItems(cheerioItems, llmExtractedItems);

    return {
      query,
      components: topComponents,
      allItems: mergedItems,
      llmExtractedItems,
      primaryIntent: llmIntentResult.primaryIntent,
      secondaryIntent: llmIntentResult.secondaryIntent as SearchIntent,
      reasoning: llmIntentResult.reasoning,
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
};

// Re-export types for backward compatibility
export type { DaumSearchComponent };
