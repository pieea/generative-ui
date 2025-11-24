import { TemplateType, ResultType, ControllerType } from '@/types';

// 템플릿 매핑: 결과 타입에 따른 기본 템플릿 추천
export const templateMapping: Record<ResultType, TemplateType> = {
  news: 'list',
  products: 'grid',
  images: 'grid',
  locations: 'map',
  events: 'timeline',
  people: 'card',
  documents: 'list',
  mixed: 'card',
};

// 결과 타입에 따른 기본 컨트롤러 추천
export const controllerMapping: Record<ResultType, ControllerType[]> = {
  news: ['filter', 'sort', 'date-range', 'pagination'],
  products: ['filter', 'sort', 'view-toggle', 'pagination'],
  images: ['filter', 'view-toggle', 'pagination'],
  locations: ['filter', 'search-refine'],
  events: ['filter', 'date-range', 'sort'],
  people: ['filter', 'sort', 'pagination'],
  documents: ['filter', 'sort', 'date-range', 'pagination'],
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
  const baseTemplate = templateMapping[resultType];
  const controllers = controllerMapping[resultType];

  // 이미지가 있으면 grid를 secondary로 추가 가능
  let secondary: TemplateType | undefined;
  if (hasImages && baseTemplate !== 'grid') {
    secondary = 'grid';
  }

  // 비교가 필요한 경우 (예: 상품 2-4개)
  if (resultType === 'products' && itemCount >= 2 && itemCount <= 4) {
    return {
      main: 'comparison',
      controllers: ['filter', 'sort'],
    };
  }

  return {
    main: baseTemplate,
    secondary,
    controllers,
  };
}

export { ListTemplate } from './ListTemplate';
export { GridTemplate } from './GridTemplate';
export { CardTemplate } from './CardTemplate';
