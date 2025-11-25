/**
 * Daum Search disp-attr mappings and priorities
 */
import { IntentType } from '@/types';

export interface DispAttrConfig {
  readonly intent: IntentType;
  readonly priority: number;
  readonly description: string;
}

/**
 * Priority levels:
 * - 0-9: Absolute priority (position-independent)
 * - 10+: Position-based priority (only top 3 positions)
 */
export const DISP_ATTR_MAP: Readonly<Record<string, DispAttrConfig>> = {
  // Absolute priority
  Z6T: { intent: 'exchange', priority: 0, description: '환율 정보' },
  '3DV': { intent: 'country', priority: 1, description: '국가 정보' },
  PRF: { intent: 'people', priority: 2, description: '인물 프로필' },
  TCS: { intent: 'events', priority: 3, description: '축제/일정 통합 컬렉션' },
  WMD: { intent: 'weather', priority: 4, description: '날씨 정보' },

  // Position-based priority
  GG2: { intent: 'locations', priority: 10, description: '장소/관광지' },
  IIM: { intent: 'images', priority: 10, description: '이미지' },
  SNP: { intent: 'products', priority: 10, description: '쇼핑하우' },
  SNY: { intent: 'products', priority: 10, description: '쇼핑' },
  NSJ: { intent: 'products', priority: 10, description: '쇼핑 (새 형식)' },
  '0SC': { intent: 'products', priority: 10, description: '쇼핑 컬렉션' },
  '0NS': { intent: 'products', priority: 10, description: '네이버쇼핑 광고' },
  DNS: { intent: 'news', priority: 10, description: '뉴스' },
  VOI: { intent: 'videos', priority: 10, description: '동영상' },

  // Low priority
  TWA: { intent: 'web', priority: 100, description: '통합웹' },
  TWD: { intent: 'web', priority: 100, description: '통합웹' },
  '0NL': { intent: 'ads', priority: 999, description: '파워링크 광고' },
} as const;

/**
 * Absolute priority threshold
 */
export const ABSOLUTE_PRIORITY_THRESHOLD = 10;

/**
 * Top position threshold for position-based priorities
 */
export const TOP_POSITION_THRESHOLD = 2; // 0, 1, 2 (top 3)

/**
 * Weak intents for fallback logic
 */
export const WEAK_INTENTS: readonly IntentType[] = ['web', 'ads', 'mixed'] as const;

/**
 * Strong intents for fallback logic
 */
export const STRONG_INTENTS: readonly IntentType[] = [
  'products',
  'news',
  'people',
  'images',
  'exchange',
  'country',
  'events',
  'locations',
  'weather',
] as const;

/**
 * Helper functions
 */
export const isAbsolutePriority = (priority: number): boolean =>
  priority < ABSOLUTE_PRIORITY_THRESHOLD;

export const isWeakIntent = (intent: IntentType): boolean =>
  WEAK_INTENTS.includes(intent);

export const isStrongIntent = (intent: IntentType): boolean =>
  STRONG_INTENTS.includes(intent);

export const isTopPosition = (position: number): boolean =>
  position <= TOP_POSITION_THRESHOLD;
