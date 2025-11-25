'use client';

import { ResultType } from '@/types';
import styles from './components.module.css';

interface ExampleQueriesProps {
  onSelect: (query: string) => void;
  isLoading?: boolean;
}

// 타입별 예시 쿼리
const exampleQueries: Record<ResultType, { label: string; queries: string[] }> = {
  news: {
    label: '뉴스',
    queries: ['AI 기술 뉴스', '코스피 증시 전망', '금리 인상 경제'],
  },
  products: {
    label: '상품',
    queries: ['노트북 추천', '무선 이어폰 가격', '가성비 태블릿'],
  },
  images: {
    label: '이미지',
    queries: ['고양이 사진', '서울 야경 이미지', '자연 풍경 사진'],
  },
  locations: {
    label: '장소',
    queries: ['강남역 맛집', '제주도 카페', '서울 관광지'],
  },
  events: {
    label: '축제/행사',
    queries: ['이번주 축제일정', '서울 콘서트 일정', '전시회 박람회'],
  },
  people: {
    label: '인물',
    queries: ['BTS 멤버', '테슬라 CEO', '한국 배우'],
  },
  documents: {
    label: '문서',
    queries: ['React 공식 문서', 'API 가이드 자료', 'TypeScript 튜토리얼'],
  },
  weather: {
    label: '날씨',
    queries: ['서울 날씨', '이번 주 날씨', '주말 날씨 예보'],
  },
  exchange: {
    label: '환율',
    queries: ['오늘 달러 환율', '엔화 환율', '유로 환율'],
  },
  country: {
    label: '국가',
    queries: ['미국', '일본', '프랑스'],
  },
  videos: {
    label: '동영상',
    queries: ['강아지 영상', '요리 레시피 영상', '운동 영상'],
  },
  web: {
    label: '웹문서',
    queries: ['TypeScript 튜토리얼', 'React 가이드', 'Next.js 문서'],
  },
  ads: {
    label: '광고',
    queries: [],
  },
  mixed: {
    label: '일반',
    queries: ['오늘의 운세', '주식 시세', '로또 번호'],
  },
};

export function ExampleQueries({ onSelect, isLoading = false }: ExampleQueriesProps) {
  return (
    <div className={styles.exampleQueries}>
      <p className={styles.exampleLabel}>예시 검색어</p>
      <div className={styles.breadcrumbContainer}>
        {Object.entries(exampleQueries).map(([type, { label, queries }]) => (
          <div key={type} className={styles.breadcrumbGroup}>
            <span className={styles.breadcrumbType}>{label}</span>
            <span className={styles.breadcrumbSeparator}>/</span>
            <div className={styles.breadcrumbItems}>
              {queries.map((query, idx) => (
                <span key={query} className={styles.breadcrumbWrapper}>
                  <button
                    className={styles.breadcrumbItem}
                    onClick={() => onSelect(query)}
                    disabled={isLoading}
                  >
                    {query}
                  </button>
                  {idx < queries.length - 1 && (
                    <span className={styles.breadcrumbDivider}>|</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
