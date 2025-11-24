import { UIState, ResultType } from '@/types';

// 간단한 메모리 캐시 (프로덕션에서는 Redis 등 사용 권장)
const cache = new Map<string, { uiState: UIState; timestamp: number }>();

const CACHE_TTL = 30 * 60 * 1000; // 30분

// 캐시 키 생성
function generateCacheKey(queryPattern: string, resultType: ResultType): string {
  // 쿼리를 패턴화 (공백 정규화, 소문자 변환)
  const normalizedQuery = queryPattern.trim().toLowerCase().replace(/\s+/g, ' ');
  return `${normalizedQuery}:${resultType}`;
}

// 캐시에서 UI 상태 조회
export function getCachedUIState(
  query: string,
  resultType: ResultType
): Omit<UIState, 'data'> | null {
  const key = generateCacheKey(query, resultType);
  const cached = cache.get(key);

  if (!cached) return null;

  // TTL 체크
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }

  // data를 제외한 UI 설정만 반환
  const { data, ...uiConfig } = cached.uiState;
  return uiConfig as Omit<UIState, 'data'>;
}

// UI 상태를 캐시에 저장
export function setCachedUIState(
  query: string,
  resultType: ResultType,
  uiState: UIState
): void {
  const key = generateCacheKey(query, resultType);
  cache.set(key, {
    uiState,
    timestamp: Date.now(),
  });
}

// 캐시 무효화
export function invalidateCache(query?: string, resultType?: ResultType): void {
  if (query && resultType) {
    const key = generateCacheKey(query, resultType);
    cache.delete(key);
  } else {
    cache.clear();
  }
}

// 캐시 통계 조회
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
  };
}
