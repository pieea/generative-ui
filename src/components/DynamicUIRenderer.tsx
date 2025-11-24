'use client';

import { UIState, TemplateType } from '@/types';
import {
  ListTemplate,
  GridTemplate,
  CardTemplate,
  CarouselTemplate,
  HeroTemplate,
  GalleryTemplate,
  TimelineTemplate,
  ProfileTemplate,
  ArticleTemplate,
} from '@/templates';
import { ControllerBar } from './ControllerBar';
import { FeedbackInput } from './FeedbackInput';
import styles from './components.module.css';

interface DynamicUIRendererProps {
  uiState: UIState;
  onFeedback: (feedback: string) => void;
  isLoading?: boolean;
}

// 템플릿 타입에 따른 컴포넌트 매핑
const templateComponents: Record<TemplateType, React.ComponentType<any>> = {
  list: ListTemplate,
  grid: GridTemplate,
  card: CardTemplate,
  carousel: CarouselTemplate,
  hero: HeroTemplate,
  gallery: GalleryTemplate,
  timeline: TimelineTemplate,
  profile: ProfileTemplate,    // 인물 위키/프로필
  article: ArticleTemplate,    // 기사 본문 (경제/뉴스)
  table: ListTemplate,         // fallback
  comparison: CarouselTemplate, // 비교는 캐러셀로
  detail: ProfileTemplate,     // 상세는 프로필로
  map: CardTemplate,           // 지도는 카드로 fallback
  chart: CardTemplate,         // 차트는 카드로 fallback
};

export function DynamicUIRenderer({
  uiState,
  onFeedback,
  isLoading = false,
}: DynamicUIRendererProps) {
  const { mainTemplate, controllers, data, layout, filters } = uiState;

  const MainTemplateComponent = templateComponents[mainTemplate];

  return (
    <div className={styles.dynamicUI}>
      {/* 검색 정보 헤더 */}
      <div className={styles.searchInfo}>
        <span className={styles.queryLabel}>검색어:</span>
        <span className={styles.queryText}>{data.query}</span>
        <span className={styles.resultCount}>
          {data.totalCount}개의 결과
        </span>
      </div>

      {/* 컨트롤러 바 */}
      {controllers.length > 0 && (
        <ControllerBar controllers={controllers} filters={filters} />
      )}

      {/* 메인 템플릿 */}
      <div className={`${styles.templateWrapper} ${isLoading ? styles.loading : ''}`}>
        <MainTemplateComponent data={data} layout={layout} filters={filters} />
      </div>

      {/* 피드백 입력 */}
      <FeedbackInput onSubmit={onFeedback} isLoading={isLoading} />
    </div>
  );
}
