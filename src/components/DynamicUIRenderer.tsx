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
  DualProfileTemplate,
  ArticleTemplate,
  MapTemplate,
  WeatherTemplate,
  ShoppingTemplate,
  ExchangeRateTemplate,
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
  'dual-profile': DualProfileTemplate, // 두 인물 + 뉴스 레이아웃
  article: ArticleTemplate,    // 기사 본문 (경제/뉴스)
  map: MapTemplate,            // 지도 기반 장소
  weather: WeatherTemplate,    // 날씨 정보
  shopping: ShoppingTemplate,  // 쇼핑/상품 목록
  'exchange-rate': ExchangeRateTemplate, // 환율 정보
  table: ListTemplate,         // fallback
  comparison: CarouselTemplate, // 비교는 캐러셀로
  detail: ProfileTemplate,     // 상세는 프로필로
  chart: CardTemplate,         // 차트는 카드로 fallback
};

export function DynamicUIRenderer({
  uiState,
  onFeedback,
  isLoading = false,
}: DynamicUIRendererProps) {
  const { mainTemplate, controllers, data, layout, filters } = uiState;

  const MainTemplateComponent = templateComponents[mainTemplate];

  // 검색 분석 결과 추출
  const analysis = data.metadata?.analysis as {
    primaryIntent: string;
    secondaryIntent?: string;
    components: { type: string; title: string; itemCount: number }[];
    reasoning: string;
  } | undefined;

  // 이중 쿼리 정보 추출
  const expandedQueries = data.metadata?.expandedQueries as {
    query: string;
    intent: string;
    description: string;
  }[] | undefined;

  // LLM 추출 정보
  const llmExtractedCount = data.metadata?.llmExtractedCount || 0;

  // 디버그 문자열 생성
  const isMultiQuery = expandedQueries && expandedQueries.length > 1;
  const queryInfo = isMultiQuery
    ? `[이중쿼리] ${expandedQueries.map(q => `"${q.query}"(${q.intent})`).join(' + ')}`
    : '[단일쿼리]';

  const debugInfo = analysis
    ? `${queryInfo} → ${analysis.components.map(c => `[${c.type}]${c.title}(${c.itemCount}건)`).join(' + ')} → ${analysis.primaryIntent}${analysis.secondaryIntent ? '+' + analysis.secondaryIntent : ''} | LLM추출: ${llmExtractedCount}건 → 템플릿: ${mainTemplate}`
    : `템플릿: ${mainTemplate}`;

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

      {/* 디버그: 쿼리 분석 결과 */}
      <div className={styles.debugInfo}>
        <span className={styles.debugText}>{debugInfo}</span>
        <div className={styles.debugLinks}>
          {isMultiQuery ? (
            expandedQueries.map((q, i) => (
              <a
                key={i}
                href={`https://search.daum.net/search?w=tot&q=${encodeURIComponent(q.query)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.daumSearchLink}
              >
                {q.query}
              </a>
            ))
          ) : (
            <a
              href={`https://search.daum.net/search?w=tot&q=${encodeURIComponent(data.query)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.daumSearchLink}
            >
              다음검색
            </a>
          )}
        </div>
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
