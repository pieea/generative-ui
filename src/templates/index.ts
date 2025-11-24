import { TemplateType, ResultType, ControllerType } from '@/types';

// 템플릿 매핑: 결과 타입에 따른 기본 템플릿 추천
export const templateMapping: Record<ResultType, TemplateType> = {
  news: 'hero',        // 뉴스는 히어로 레이아웃 (메인 기사 + 사이드)
  products: 'shopping', // 상품은 쇼핑 전용 레이아웃
  images: 'gallery',    // 이미지는 갤러리 형태
  locations: 'card',    // 장소는 카드 형태
  events: 'timeline',   // 이벤트는 타임라인
  people: 'grid',       // 인물은 그리드
  documents: 'list',    // 문서는 리스트
  weather: 'weather',   // 날씨는 날씨 템플릿
  mixed: 'hero',        // 혼합은 히어로
};

// 결과 타입에 따른 기본 컨트롤러 추천
export const controllerMapping: Record<ResultType, ControllerType[]> = {
  news: ['filter', 'sort', 'date-range', 'pagination'],
  products: ['price-range', 'brand-filter', 'rating-filter', 'discount-filter', 'sort', 'view-toggle', 'pagination'],
  images: ['filter', 'view-toggle', 'pagination'],
  locations: ['filter', 'search-refine'],
  events: ['filter', 'date-range', 'sort'],
  people: ['filter', 'sort', 'pagination'],
  documents: ['filter', 'sort', 'date-range', 'pagination'],
  weather: ['date-range'],
  mixed: ['filter', 'sort', 'view-toggle', 'pagination'],
};

// 템플릿 조합 규칙
export interface TemplateComposition {
  main: TemplateType;
  secondary?: TemplateType;
  controllers: ControllerType[];
}

// 결과 개수에 따른 레이아웃 조정
export function getLayoutByCount(count: number): {
  columns?: number;
  compact?: boolean;
  itemsPerPage: number;
} {
  if (count <= 3) {
    return { columns: count, compact: false, itemsPerPage: count };
  }
  if (count <= 6) {
    return { columns: 3, compact: false, itemsPerPage: 6 };
  }
  if (count <= 12) {
    return { columns: 4, compact: false, itemsPerPage: 12 };
  }
  return { columns: 4, compact: true, itemsPerPage: 20 };
}

// 템플릿 선택 로직
export function selectTemplate(
  resultType: ResultType,
  itemCount: number,
  hasImages: boolean
): TemplateComposition {
  const controllers = controllerMapping[resultType];

  // 결과 개수와 타입에 따른 동적 템플릿 선택
  let mainTemplate: TemplateType;

  // 이미지가 많은 경우 갤러리
  if (hasImages && resultType === 'images') {
    mainTemplate = 'gallery';
  }
  // 뉴스 기사가 1개인 경우 (기사 본문 상세) - article 템플릿
  else if (resultType === 'news' && itemCount === 1) {
    mainTemplate = 'article';
  }
  // 뉴스나 혼합 결과가 많은 경우 히어로
  else if ((resultType === 'news' || resultType === 'mixed') && itemCount >= 3) {
    mainTemplate = 'hero';
  }
  // 상품은 쇼핑 템플릿으로 표시
  else if (resultType === 'products') {
    mainTemplate = 'shopping';
  }
  // 이벤트는 타임라인
  else if (resultType === 'events') {
    mainTemplate = 'timeline';
  }
  // 인물: 1명이면 프로필(위키), 적으면 카드, 많으면 그리드
  else if (resultType === 'people') {
    if (itemCount === 1) {
      mainTemplate = 'profile';
    } else if (itemCount <= 4) {
      mainTemplate = 'card';
    } else {
      mainTemplate = 'grid';
    }
  }
  // 장소/위치는 지도 템플릿
  else if (resultType === 'locations') {
    mainTemplate = 'map';
  }
  // 기본값
  else {
    mainTemplate = templateMapping[resultType];
  }

  return {
    main: mainTemplate,
    controllers,
  };
}

export { ListTemplate } from './ListTemplate';
export { GridTemplate } from './GridTemplate';
export { CardTemplate } from './CardTemplate';
export { CarouselTemplate } from './CarouselTemplate';
export { HeroTemplate } from './HeroTemplate';
export { GalleryTemplate } from './GalleryTemplate';
export { TimelineTemplate } from './TimelineTemplate';
export { ProfileTemplate } from './ProfileTemplate';
export { ArticleTemplate } from './ArticleTemplate';
export { MapTemplate } from './MapTemplate';
export { WeatherTemplate } from './WeatherTemplate';
export { ShoppingTemplate } from './ShoppingTemplate';
export { DualProfileTemplate } from './DualProfileTemplate';
