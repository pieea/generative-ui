'use client';

import { UIState, TemplateType } from '@/types';
import { ListTemplate, GridTemplate, CardTemplate } from '@/templates';
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
  table: ListTemplate, // TODO: 별도 구현
  timeline: ListTemplate, // TODO: 별도 구현
  comparison: CardTemplate, // TODO: 별도 구현
  detail: CardTemplate, // TODO: 별도 구현
  map: CardTemplate, // TODO: 별도 구현
  chart: CardTemplate, // TODO: 별도 구현
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
