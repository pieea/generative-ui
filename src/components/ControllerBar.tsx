'use client';

import { ControllerType, FilterState } from '@/types';
import styles from './components.module.css';

interface ControllerBarProps {
  controllers: ControllerType[];
  filters?: FilterState;
  onFilterChange?: (filters: FilterState) => void;
}

export function ControllerBar({
  controllers,
  filters,
  onFilterChange,
}: ControllerBarProps) {
  const renderController = (type: ControllerType) => {
    switch (type) {
      case 'filter':
        return (
          <button key={type} className={styles.controllerButton}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46" />
            </svg>
            필터
          </button>
        );
      case 'sort':
        return (
          <select key={type} className={styles.controllerSelect}>
            <option value="relevance">관련도순</option>
            <option value="date">최신순</option>
            <option value="name">이름순</option>
          </select>
        );
      case 'date-range':
        return (
          <div key={type} className={styles.dateRange}>
            <input type="date" className={styles.dateInput} placeholder="시작일" />
            <span>~</span>
            <input type="date" className={styles.dateInput} placeholder="종료일" />
          </div>
        );
      case 'view-toggle':
        return (
          <div key={type} className={styles.viewToggle}>
            <button className={styles.viewButton} title="리스트 보기">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
            </button>
            <button className={styles.viewButton} title="그리드 보기">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
            </button>
          </div>
        );
      case 'pagination':
        return (
          <div key={type} className={styles.pagination}>
            <button className={styles.pageButton} disabled>이전</button>
            <span className={styles.pageInfo}>1 / 1</span>
            <button className={styles.pageButton} disabled>다음</button>
          </div>
        );
      case 'search-refine':
        return (
          <input
            key={type}
            type="text"
            className={styles.refineInput}
            placeholder="검색어 세분화..."
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.controllerBar}>
      {controllers.map(renderController)}
    </div>
  );
}
