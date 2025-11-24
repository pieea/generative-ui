import { UIState, SearchResult, UserFeedback, FilterState, TemplateType, LayoutConfig } from '@/types';
import { selectTemplate, getLayoutByCount } from '@/templates';
import { getCachedUIState, setCachedUIState } from './cacheService';

// UI 상태 생성
export function generateUIState(searchResult: SearchResult): UIState {
  // 캐시 확인
  const cached = getCachedUIState(searchResult.query, searchResult.resultType);
  if (cached) {
    return {
      ...cached,
      data: searchResult,
    };
  }

  const hasImages = searchResult.items.some((item) => item.imageUrl);
  const templateComposition = selectTemplate(
    searchResult.resultType,
    searchResult.items.length,
    hasImages
  );

  const layout = getLayoutByCount(searchResult.items.length);

  const uiState: UIState = {
    mainTemplate: templateComposition.main,
    secondaryTemplate: templateComposition.secondary,
    controllers: templateComposition.controllers,
    data: searchResult,
    layout: {
      ...layout,
      showImages: hasImages,
    },
  };

  // 캐시에 저장
  setCachedUIState(searchResult.query, searchResult.resultType, uiState);

  return uiState;
}

// 사용자 피드백에 따른 UI 재구성
export function updateUIFromFeedback(
  currentState: UIState,
  feedback: string
): UIState {
  const feedbackLower = feedback.toLowerCase();
  let newState = { ...currentState };
  let newLayout: LayoutConfig = { ...currentState.layout };
  let newFilters: FilterState = { ...currentState.filters };

  // 레이아웃 변경 요청 분석
  if (feedbackLower.includes('크게') || feedbackLower.includes('확대') || feedbackLower.includes('expand')) {
    newLayout.expanded = true;
    newLayout.columns = Math.max(1, (newLayout.columns || 2) - 1);
  }

  if (feedbackLower.includes('작게') || feedbackLower.includes('축소') || feedbackLower.includes('compact')) {
    newLayout.compact = true;
    newLayout.columns = Math.min(6, (newLayout.columns || 2) + 1);
  }

  // 템플릿 변경 요청 분석
  if (feedbackLower.includes('리스트') || feedbackLower.includes('목록') || feedbackLower.includes('list')) {
    newState.mainTemplate = 'list';
  }

  if (feedbackLower.includes('그리드') || feedbackLower.includes('grid') || feedbackLower.includes('타일')) {
    newState.mainTemplate = 'grid';
  }

  if (feedbackLower.includes('카드') || feedbackLower.includes('card')) {
    newState.mainTemplate = 'card';
  }

  if (feedbackLower.includes('캐러셀') || feedbackLower.includes('슬라이드') || feedbackLower.includes('carousel') || feedbackLower.includes('slider')) {
    newState.mainTemplate = 'carousel';
  }

  if (feedbackLower.includes('갤러리') || feedbackLower.includes('gallery') || feedbackLower.includes('사진첩')) {
    newState.mainTemplate = 'gallery';
  }

  if (feedbackLower.includes('타임라인') || feedbackLower.includes('timeline') || feedbackLower.includes('연대기')) {
    newState.mainTemplate = 'timeline';
  }

  if (feedbackLower.includes('히어로') || feedbackLower.includes('hero') || feedbackLower.includes('큰 이미지') || feedbackLower.includes('메인')) {
    newState.mainTemplate = 'hero';
  }

  if (feedbackLower.includes('프로필') || feedbackLower.includes('위키') || feedbackLower.includes('profile') || feedbackLower.includes('wiki') || feedbackLower.includes('인물 정보')) {
    newState.mainTemplate = 'profile';
  }

  if (feedbackLower.includes('기사') || feedbackLower.includes('본문') || feedbackLower.includes('article') || feedbackLower.includes('상세 기사') || feedbackLower.includes('전문')) {
    newState.mainTemplate = 'article';
  }

  if (feedbackLower.includes('지도') || feedbackLower.includes('map') || feedbackLower.includes('위치') || feedbackLower.includes('장소 목록')) {
    newState.mainTemplate = 'map';
  }

  // 이미지 표시 변경
  if (feedbackLower.includes('이미지 숨') || feedbackLower.includes('hide image')) {
    newLayout.showImages = false;
  }

  if (feedbackLower.includes('이미지 보') || feedbackLower.includes('show image')) {
    newLayout.showImages = true;
  }

  // 정렬 변경
  if (feedbackLower.includes('최신') || feedbackLower.includes('latest') || feedbackLower.includes('recent')) {
    newFilters.sortBy = 'date';
    newFilters.sortOrder = 'desc';
  }

  if (feedbackLower.includes('오래된') || feedbackLower.includes('oldest')) {
    newFilters.sortBy = 'date';
    newFilters.sortOrder = 'asc';
  }

  if (feedbackLower.includes('이름순') || feedbackLower.includes('alphabetical')) {
    newFilters.sortBy = 'name';
    newFilters.sortOrder = 'asc';
  }

  // 날짜 필터 활성화
  if (feedbackLower.includes('날짜') || feedbackLower.includes('date') || feedbackLower.includes('기간')) {
    if (!newState.controllers.includes('date-range')) {
      newState.controllers = [...newState.controllers, 'date-range'];
    }
  }

  return {
    ...newState,
    layout: newLayout,
    filters: newFilters,
  };
}

// 피드백 타입 분류
export function classifyFeedback(feedback: string): UserFeedback {
  const feedbackLower = feedback.toLowerCase();

  if (
    feedbackLower.includes('리스트') ||
    feedbackLower.includes('그리드') ||
    feedbackLower.includes('카드') ||
    feedbackLower.includes('크게') ||
    feedbackLower.includes('작게')
  ) {
    return { type: 'layout', value: feedback };
  }

  if (
    feedbackLower.includes('필터') ||
    feedbackLower.includes('날짜') ||
    feedbackLower.includes('정렬') ||
    feedbackLower.includes('카테고리')
  ) {
    return { type: 'filter', value: feedback };
  }

  if (
    feedbackLower.includes('확대') ||
    feedbackLower.includes('상세') ||
    feedbackLower.includes('expand')
  ) {
    return { type: 'expand', value: feedback };
  }

  return { type: 'custom', value: feedback };
}
