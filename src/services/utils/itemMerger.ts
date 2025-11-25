/**
 * Item Merger - Merge and deduplicate search result items
 */
import { SearchResultItem } from '@/types';

/**
 * Normalize title for comparison
 */
const normalizeTitle = (title: string): string => {
  return title.toLowerCase().trim();
};

/**
 * Create title index map from items
 */
const createTitleIndex = (
  items: SearchResultItem[]
): Map<string, SearchResultItem> => {
  const index = new Map<string, SearchResultItem>();
  for (const item of items) {
    index.set(normalizeTitle(item.title), item);
  }
  return index;
};

/**
 * Enrich LLM item with cheerio data
 */
const enrichItem = (
  llmItem: SearchResultItem,
  cheerioItem: SearchResultItem | undefined
): SearchResultItem => {
  if (!cheerioItem) {
    return llmItem;
  }

  return {
    ...llmItem,
    imageUrl: llmItem.imageUrl || cheerioItem.imageUrl,
    url: llmItem.url || cheerioItem.url,
    metadata: {
      ...cheerioItem.metadata,
      ...llmItem.metadata,
    },
  };
};

/**
 * Merge cheerio items and LLM items
 * LLM items take priority, cheerio items fill gaps
 */
export const mergeItems = (
  cheerioItems: SearchResultItem[],
  llmItems: SearchResultItem[],
  maxItems = 10
): SearchResultItem[] => {
  const cheerioByTitle = createTitleIndex(cheerioItems);

  // Enrich LLM items with cheerio data
  const enrichedLlmItems = llmItems.map(llmItem => {
    const cheerioItem = cheerioByTitle.get(normalizeTitle(llmItem.title));
    return enrichItem(llmItem, cheerioItem);
  });

  const result: SearchResultItem[] = [...enrichedLlmItems];
  const processedTitles = new Set(
    llmItems.map(i => normalizeTitle(i.title))
  );

  // Add cheerio items not in LLM results
  for (const item of cheerioItems) {
    const normalized = normalizeTitle(item.title);
    if (!processedTitles.has(normalized)) {
      result.push(item);
      processedTitles.add(normalized);
    }
  }

  return result.slice(0, maxItems);
};
