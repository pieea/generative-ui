import { NextRequest, NextResponse } from 'next/server';
import { performSearch } from '@/services/searchService';
import { generateUIState } from '@/services/uiGeneratorService';
import { GenerateUIResponse } from '@/types';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json(
      { error: '검색어가 필요합니다.' },
      { status: 400 }
    );
  }

  try {
    // 검색 수행
    const searchResult = await performSearch(query);

    // UI 상태 생성
    const uiState = generateUIState(searchResult);

    const response: GenerateUIResponse = {
      uiState,
      cacheHit: false, // TODO: 캐시 히트 여부 확인
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
