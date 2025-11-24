// UI 템플릿 타입 정의
export type TemplateType =
  | 'list'           // 기본 리스트 형태
  | 'grid'           // 그리드 갤러리 형태
  | 'card'           // 카드 레이아웃
  | 'carousel'       // 캐러셀/슬라이더 형태
  | 'hero'           // 히어로 (큰 이미지 + 사이드바)
  | 'gallery'        // 갤러리 (메이슨리 스타일)
  | 'timeline'       // 타임라인 형태
  | 'profile'        // 프로필/위키 형태 (인물 정보)
  | 'article'        // 기사 본문 형태 (경제/뉴스 기사)
  | 'weather'        // 날씨 정보 형태
  | 'shopping'       // 쇼핑/상품 목록 형태
  | 'table'          // 테이블 형태
  | 'comparison'     // 비교 형태
  | 'detail'         // 상세 정보 형태
  | 'map'            // 지도 기반 형태
  | 'chart';         // 차트/그래프 형태

// 컨트롤러 타입 정의
export type ControllerType =
  | 'filter'         // 필터링 컨트롤
  | 'sort'           // 정렬 컨트롤
  | 'pagination'     // 페이지네이션
  | 'date-range'     // 날짜 범위 선택
  | 'view-toggle'    // 뷰 전환 (리스트/그리드 등)
  | 'search-refine'  // 검색어 상세화
  | 'price-range'    // 가격 범위 (쇼핑)
  | 'brand-filter'   // 브랜드 필터 (쇼핑)
  | 'rating-filter'  // 평점 필터 (쇼핑)
  | 'discount-filter'; // 할인/특가 필터 (쇼핑)

// 검색 결과 아이템
export interface SearchResultItem {
  id: string;
  title: string;
  description?: string;
  url?: string;
  imageUrl?: string;
  metadata?: Record<string, unknown>;
  timestamp?: string;
  category?: string;
  tags?: string[];
}

// 검색 결과
export interface SearchResult {
  query: string;
  items: SearchResultItem[];
  totalCount: number;
  resultType: ResultType;
  metadata?: {
    source?: string;
    searchTime?: number;
    suggestions?: string[];
  };
}

// 결과 타입 (UI 선택에 영향)
export type ResultType =
  | 'news'           // 뉴스 기사
  | 'products'       // 상품
  | 'images'         // 이미지
  | 'locations'      // 장소/위치
  | 'events'         // 이벤트/일정
  | 'people'         // 인물
  | 'documents'      // 문서
  | 'mixed';         // 혼합 결과

// UI 상태
export interface UIState {
  mainTemplate: TemplateType;
  secondaryTemplate?: TemplateType;
  controllers: ControllerType[];
  data: SearchResult;
  layout: LayoutConfig;
  filters?: FilterState;
}

// 레이아웃 설정
export interface LayoutConfig {
  columns?: number;
  showImages?: boolean;
  compact?: boolean;
  itemsPerPage?: number;
  expanded?: boolean;
}

// 필터 상태
export interface FilterState {
  dateRange?: {
    start?: string;
    end?: string;
  };
  categories?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 사용자 피드백
export interface UserFeedback {
  type: 'layout' | 'filter' | 'expand' | 'custom';
  value: string;
  context?: Record<string, unknown>;
}

// 템플릿 캐시 키
export interface CacheKey {
  queryPattern: string;
  resultType: ResultType;
  feedbackHash?: string;
}

// API 응답 타입
export interface GenerateUIResponse {
  uiState: UIState;
  cacheHit: boolean;
}

// 템플릿 컴포넌트 props
export interface TemplateProps {
  data: SearchResult;
  layout: LayoutConfig;
  filters?: FilterState;
  onFilterChange?: (filters: FilterState) => void;
}

// 컨트롤러 컴포넌트 props
export interface ControllerProps {
  type: ControllerType;
  currentValue?: unknown;
  onChange: (value: unknown) => void;
  options?: Record<string, unknown>;
}
