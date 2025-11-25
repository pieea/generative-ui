/**
 * Intent Analyzer - Determines search intent from disp-attr components
 */
import * as cheerio from 'cheerio';
import { IntentType } from '@/types';
import {
  DISP_ATTR_MAP,
  WEAK_INTENTS,
  STRONG_INTENTS,
  isAbsolutePriority,
  isTopPosition,
  isWeakIntent,
  isStrongIntent,
} from '@/constants';

export interface TopComponentAnalysis {
  readonly primaryIntent: IntentType;
  readonly dispAttr: string;
  readonly position: number;
  readonly reasoning: string;
}

export interface DispAttrInfo {
  readonly dispAttr: string;
  readonly position: number;
  readonly intent: string;
  readonly priority: number;
}

interface ComponentCandidate {
  readonly dispAttr: string;
  readonly position: number;
  readonly priority: number;
}

/**
 * Extract disp-attr components from HTML
 */
const extractDispAttrComponents = (
  $: cheerio.CheerioAPI,
  maxComponents = 5
): ComponentCandidate[] => {
  const components: ComponentCandidate[] = [];

  $('.g_comp')
    .slice(0, maxComponents)
    .each((index, element) => {
      const dispAttr = $(element).attr('disp-attr') || '';
      const config = DISP_ATTR_MAP[dispAttr];

      if (config) {
        components.push({
          dispAttr,
          position: index,
          priority: config.priority,
        });
      }
    });

  return components;
};

/**
 * Extract disp-attr information for LLM analysis
 */
export const extractDispAttrList = (
  html: string,
  maxComponents = 5
): DispAttrInfo[] => {
  const $ = cheerio.load(html);
  const dispAttrList: DispAttrInfo[] = [];

  $('.g_comp')
    .slice(0, maxComponents)
    .each((index, element) => {
      const dispAttr = $(element).attr('disp-attr') || '';
      const config = DISP_ATTR_MAP[dispAttr];

      if (config) {
        dispAttrList.push({
          dispAttr,
          position: index,
          intent: config.intent,
          priority: config.priority,
        });
      }
    });

  return dispAttrList;
};

/**
 * Sort components by priority rules
 */
const sortComponents = (components: ComponentCandidate[]): ComponentCandidate[] => {
  return [...components].sort((a, b) => {
    // Absolute priority components (priority < 10) come first
    const aIsAbsolute = isAbsolutePriority(a.priority);
    const bIsAbsolute = isAbsolutePriority(b.priority);

    if (aIsAbsolute && !bIsAbsolute) return -1;
    if (!aIsAbsolute && bIsAbsolute) return 1;

    // Both absolute: sort by priority value
    if (aIsAbsolute && bIsAbsolute) {
      return a.priority - b.priority;
    }

    // Both position-based: only consider top 3 positions
    const aIsTop = isTopPosition(a.position);
    const bIsTop = isTopPosition(b.position);

    if (aIsTop && bIsTop) {
      return a.position - b.position;
    }

    if (aIsTop && !bIsTop) return -1;
    if (!aIsTop && bIsTop) return 1;

    return a.position - b.position;
  });
};


/**
 * Analyze top components and determine primary intent
 */
export const analyzeTopComponents = (
  html: string,
  query?: string
): TopComponentAnalysis | null => {
  const $ = cheerio.load(html);
  const components = extractDispAttrComponents($);

  if (components.length === 0) {
    return null;
  }

  console.log(
    '[Daum Search] Top disp-attr components:',
    components.map(c => `[${c.position}] ${c.dispAttr}`).join(', ')
  );

  // Sort by priority rules
  const sortedComponents = sortComponents(components);

  if (sortedComponents.length === 0) {
    return null;
  }

  const winner = sortedComponents[0];
  const config = DISP_ATTR_MAP[winner.dispAttr];

  if (!config) {
    console.log(`[Daum Search] Unknown disp-attr: ${winner.dispAttr}`);
    return null;
  }

  const isAbsolute = isAbsolutePriority(winner.priority);
  const reasoning = isAbsolute
    ? `${winner.dispAttr} 컴포넌트가 절대 우선순위로 ${config.intent} 의도 결정`
    : `${winner.dispAttr} 컴포넌트가 위치 ${winner.position}에서 ${config.intent} 의도 결정`;

  console.log(`[Daum Search] Primary intent: ${config.intent} (${reasoning})`);

  return {
    primaryIntent: config.intent,
    dispAttr: winner.dispAttr,
    position: winner.position,
    reasoning,
  };
};

/**
 * Determine if signal is weak (needs fallback)
 */
export const isWeakSignal = (
  analysis: TopComponentAnalysis | null,
  weakPositionThreshold = 3
): boolean => {
  if (!analysis) return true;

  return (
    isWeakIntent(analysis.primaryIntent) &&
    analysis.position >= weakPositionThreshold
  );
};

export interface QueryPatternInput {
  intent: IntentType | null;
  confidence: 'high' | 'medium' | 'low';
  keywords?: string[];
}

/**
 * Determine final intent with query pattern, disp-attr, and component analysis
 */
export const determineFinalIntent = (
  topAnalysis: TopComponentAnalysis | null,
  quickIntent: IntentType | null,
  queryPattern?: QueryPatternInput
): {
  intent: IntentType;
  reasoning: string;
  source: 'query-pattern' | 'pattern+disp-attr' | 'disp-attr' | 'components' | 'fallback';
} => {
  // Priority 1: High confidence query pattern + matching disp-attr
  if (queryPattern?.confidence === 'high' && queryPattern.intent) {
    if (topAnalysis && topAnalysis.primaryIntent === queryPattern.intent) {
      console.log(
        `[Daum Search] HIGH confidence query pattern matches disp-attr: ${queryPattern.intent}`
      );

      return {
        intent: queryPattern.intent,
        reasoning: `쿼리 패턴(HIGH) + disp-attr 일치: ${queryPattern.intent} [키워드: ${queryPattern.keywords?.join(', ') || 'N/A'}]`,
        source: 'pattern+disp-attr',
      };
    }

    // HIGH confidence pattern without matching disp-attr - still prioritize pattern
    console.log(
      `[Daum Search] HIGH confidence query pattern (no disp-attr match): ${queryPattern.intent}`
    );

    return {
      intent: queryPattern.intent,
      reasoning: `쿼리 패턴(HIGH): ${queryPattern.intent} [키워드: ${queryPattern.keywords?.join(', ') || 'N/A'}]`,
      source: 'query-pattern',
    };
  }

  const weakSignal = isWeakSignal(topAnalysis);

  // Priority 2: Strong disp-attr signal
  if (topAnalysis && !weakSignal) {
    return {
      intent: topAnalysis.primaryIntent,
      reasoning: topAnalysis.reasoning,
      source: 'disp-attr',
    };
  }

  // Priority 3: Weak signal - check query pattern MEDIUM or quickIntent
  if (weakSignal) {
    // MEDIUM confidence query pattern
    if (queryPattern?.confidence === 'medium' && queryPattern.intent) {
      console.log(
        `[Daum Search] Weak disp-attr signal, using MEDIUM query pattern: ${queryPattern.intent}`
      );

      return {
        intent: queryPattern.intent,
        reasoning: `쿼리 패턴(MEDIUM): ${queryPattern.intent} (disp-attr 신호 약함)`,
        source: 'query-pattern',
      };
    }

    // Strong component intent
    const hasStrongQuickIntent =
      quickIntent !== null && isStrongIntent(quickIntent);

    if (hasStrongQuickIntent) {
      console.log(
        `[Daum Search] Weak disp-attr signal, using quickIntent: ${quickIntent}`
      );

      return {
        intent: quickIntent,
        reasoning: `컴포넌트 분석 기반: ${quickIntent} (disp-attr 신호 약함: ${
          topAnalysis?.primaryIntent || 'none'
        } at position ${topAnalysis?.position ?? 'N/A'})`,
        source: 'components',
      };
    }
  }

  // Priority 4: Fallback to topAnalysis or quickIntent
  if (topAnalysis) {
    return {
      intent: topAnalysis.primaryIntent,
      reasoning: topAnalysis.reasoning,
      source: 'disp-attr',
    };
  }

  if (quickIntent) {
    return {
      intent: quickIntent,
      reasoning: `컴포넌트 기반: ${quickIntent}`,
      source: 'components',
    };
  }

  return {
    intent: 'mixed',
    reasoning: '의도 판단 불가',
    source: 'fallback',
  };
};
