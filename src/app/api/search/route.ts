import { NextRequest, NextResponse } from 'next/server';
import { performSearch } from '@/services/searchService';
import { generateUIState } from '@/services/uiGeneratorService';
import { GenerateUIResponse, UIState } from '@/types';

// 캐시 설정
const CACHE_TTL_MS = 10 * 60 * 1000; // 10분

interface CacheEntry {
  data: UIState;
  timestamp: number;
}

// 메모리 캐시 (쿼리 -> 결과)
const searchCache = new Map<string, CacheEntry>();

// 캐시 정리 (만료된 항목 제거)
function cleanupCache() {
  const now = Date.now();
  for (const [key, entry] of searchCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL_MS) {
      searchCache.delete(key);
    }
  }
}

// 주기적 캐시 정리 (5분마다)
setInterval(cleanupCache, 5 * 60 * 1000);

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json(
      { error: '검색어가 필요합니다.' },
      { status: 400 }
    );
  }

  const cacheKey = query.toLowerCase().trim();
  const now = Date.now();

  // 캐시 확인
  const cached = searchCache.get(cacheKey);
  if (cached && (now - cached.timestamp) < CACHE_TTL_MS) {
    const remainingTTL = Math.round((CACHE_TTL_MS - (now - cached.timestamp)) / 1000);
    console.log(`[Cache] HIT for "${query}" (TTL: ${remainingTTL}s)`);

    const response: GenerateUIResponse = {
      uiState: cached.data,
      cacheHit: true,
      cacheTTL: remainingTTL,
    };
    return NextResponse.json(response);
  }

  try {
    console.log(`[Cache] MISS for "${query}"`);

    // 검색 수행
    const searchResult = await performSearch(query);

    // UI 상태 생성
    const uiState = generateUIState(searchResult);

    // 캐시 저장
    searchCache.set(cacheKey, {
      data: uiState,
      timestamp: now,
    });
    console.log(`[Cache] Stored "${query}" (size: ${searchCache.size})`);

    const response: GenerateUIResponse = {
      uiState,
      cacheHit: false,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: '검색 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
