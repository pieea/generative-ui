/**
 * LLM Service - Handles OpenAI API interactions for data extraction and analysis
 */
import OpenAI from 'openai';
import { SearchResultItem, IntentType } from '@/types';
import {
  generatePersonPrompt,
  generateEventPrompt,
  DATA_EXTRACTION_SYSTEM_PROMPT,
  INTENT_ANALYSIS_SYSTEM_PROMPT,
  generateDataExtractionPrompt,
  generateIntentAnalysisPrompt,
} from './prompts';

export interface DaumSearchComponent {
  type: string;
  title: string;
  items: SearchResultItem[];
  raw: string;
}

export interface LLMExtractionOptions {
  query: string;
  components: DaumSearchComponent[];
  searchIntent?: IntentType;
  maxComponents?: number;
}

export interface DispAttrInfo {
  dispAttr: string;
  position: number;
  intent: string;
}

export interface LLMIntentAnalysisOptions {
  query: string;
  components: DaumSearchComponent[];
  dispAttrList?: DispAttrInfo[];
  maxComponents?: number;
}

export interface IntentAnalysisResult {
  primaryIntent: IntentType;
  secondaryIntent?: IntentType;
  reasoning: string;
}

/**
 * Initialize OpenAI client
 */
const getOpenAIClient = (): OpenAI | null => {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('[LLM Service] OpenAI API key not found');
    return null;
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
};

/**
 * Check if query is person search (based on intent and components only)
 */
export const isPeopleSearch = (
  searchIntent: IntentType | undefined,
  components: DaumSearchComponent[]
): boolean => {
  return (
    searchIntent === 'people' ||
    components.some(c => c.type === 'people')
  );
};

/**
 * Check if query is event search (based on intent and components only)
 */
export const isEventSearch = (
  searchIntent: IntentType | undefined,
  components: DaumSearchComponent[]
): boolean => {
  return (
    searchIntent === 'events' ||
    components.some(c => c.type === 'events')
  );
};

/**
 * Prepare components for LLM processing
 */
const prepareComponents = (
  components: DaumSearchComponent[],
  maxComponents: number
): DaumSearchComponent[] => {
  // Filter valid components with sufficient content
  return components
    .slice(0, maxComponents)
    .filter(c => c.raw && c.raw.length > 50);
};

/**
 * Format components as raw content string
 */
const formatRawContents = (components: DaumSearchComponent[]): string => {
  return components
    .map(
      (c, idx) =>
        `[컴포넌트 ${idx + 1}: ${c.type}] ${c.title}\n원본 텍스트:\n${c.raw.slice(0, 1500)}`
    )
    .join('\n\n---\n\n');
};

/**
 * Parse JSON from LLM response
 */
const parseJsonFromResponse = (content: string): any => {
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('No JSON array found in response');
  }
  return JSON.parse(jsonMatch[0]);
};

/**
 * Extract structured data from search results using LLM
 */
export const extractStructuredData = async (
  options: LLMExtractionOptions
): Promise<SearchResultItem[]> => {
  const { query, components, searchIntent, maxComponents = 2 } = options;

  const openai = getOpenAIClient();
  if (!openai || components.length === 0) {
    return [];
  }

  // Determine search type and adjust max components
  const isPeople = isPeopleSearch(searchIntent, components);
  const isEvent = isEventSearch(searchIntent, components);
  const componentCount = isPeople || isEvent ? 4 : maxComponents;

  // Prepare and validate components
  const validComponents = prepareComponents(components, componentCount);
  if (validComponents.length === 0) {
    console.log('[LLM Service] No valid components with content');
    return [];
  }

  // Format raw contents
  const rawContents = formatRawContents(validComponents);

  // Build specialized prompts
  const personPrompt = isPeople ? generatePersonPrompt(query) : '';
  const eventPrompt = isEvent ? generateEventPrompt(query) : '';
  const systemPrompt = `${DATA_EXTRACTION_SYSTEM_PROMPT}\n${personPrompt}\n${eventPrompt}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: generateDataExtractionPrompt(query, rawContents),
        },
      ],
      temperature: 0.1,
      max_tokens: 1200,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.warn('[LLM Service] Empty response from OpenAI');
      return [];
    }

    // Parse JSON response
    const parsed = parseJsonFromResponse(content);

    // Log extraction results
    console.log('[LLM Service] isPeopleSearch:', isPeople);
    console.log(
      '[LLM Service] Parsed items:',
      parsed.map((p: any) => ({
        title: p.title,
        category: p.category,
        metadata: p.metadata,
      }))
    );

    // Convert to SearchResultItem format
    return parsed.map((item: any, idx: number) => ({
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
    console.error('[LLM Service] Data extraction error:', error);
    return [];
  }
};

/**
 * Analyze search intent using LLM
 */
export const analyzeIntent = async (
  options: LLMIntentAnalysisOptions
): Promise<IntentAnalysisResult> => {
  const { query, components, dispAttrList, maxComponents = 5 } = options;

  const openai = getOpenAIClient();
  if (!openai || components.length === 0) {
    // Fallback: use first component type
    const firstType = components[0]?.type || 'mixed';
    return {
      primaryIntent: firstType as IntentType,
      secondaryIntent: components[1]?.type as IntentType,
      reasoning: `컴포넌트 기반: ${components.map(c => c.type).join(', ')}`,
    };
  }

  // Prepare disp-attr information
  const dispAttrInfo = dispAttrList && dispAttrList.length > 0
    ? dispAttrList
        .map((d, i) => `위치 ${d.position}: [${d.dispAttr}] → ${d.intent}`)
        .join('\n')
    : undefined;

  // Prepare component summary
  const componentSummary = components
    .slice(0, maxComponents)
    .map(
      (c, i) => `${i + 1}. [${c.type}] ${c.title} (${c.items.length}개 항목)`
    )
    .join('\n');

  console.log('[LLM Intent Analysis] Query:', query);
  console.log('[LLM Intent Analysis] disp-attr info:\n', dispAttrInfo);
  console.log('[LLM Intent Analysis] Components:\n', componentSummary);

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: INTENT_ANALYSIS_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: generateIntentAnalysisPrompt(query, componentSummary, dispAttrInfo),
        },
      ],
      temperature: 0.1,
      max_tokens: 200,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response');
    }

    console.log('[LLM Intent Analysis] Raw response:', content);

    const parsed = JSON.parse(content.match(/\{[\s\S]*\}/)?.[0] || '{}');

    console.log('[LLM Intent Analysis] Parsed result:', parsed);

    return {
      primaryIntent: parsed.primaryIntent || components[0]?.type || 'mixed',
      secondaryIntent: parsed.secondaryIntent,
      reasoning: parsed.reasoning || '분석 완료',
    };
  } catch (error) {
    console.error('[LLM Service] Intent analysis error:', error);
    return {
      primaryIntent: (components[0]?.type as IntentType) || 'mixed',
      secondaryIntent: components[1]?.type as IntentType,
      reasoning: `폴백: ${components.map(c => c.type).join(', ')}`,
    };
  }
};

/**
 * Check for duplicate person in results
 * Used to avoid showing same person multiple times
 */
export const findDuplicatePerson = (
  items: SearchResultItem[],
  name: string
): SearchResultItem | undefined => {
  const normalizedName = name.toLowerCase().trim();
  return items.find(
    item =>
      item.category === '인물' &&
      item.title.toLowerCase().trim() === normalizedName
  );
};
