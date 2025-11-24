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
      case 'price-range':
        return (
          <div key={type} className={styles.priceRange}>
            <span className={styles.priceLabel}>가격</span>
            <input
              type="number"
              className={styles.priceInput}
              placeholder="최소"
              min="0"
            />
            <span className={styles.priceSeparator}>~</span>
            <input
              type="number"
              className={styles.priceInput}
              placeholder="최대"
              min="0"
            />
            <span className={styles.priceUnit}>원</span>
          </div>
        );
      case 'brand-filter':
        return (
          <select key={type} className={styles.controllerSelect}>
            <option value="">브랜드 전체</option>
            <option value="samsung">삼성</option>
            <option value="lg">LG</option>
            <option value="apple">Apple</option>
            <option value="sony">Sony</option>
            <option value="etc">기타</option>
          </select>
        );
      case 'rating-filter':
        return (
          <div key={type} className={styles.ratingFilter}>
            <span className={styles.ratingLabel}>평점</span>
            <div className={styles.ratingButtons}>
              <button className={styles.ratingButton} title="4점 이상">
                ★★★★☆ 이상
              </button>
              <button className={styles.ratingButton} title="3점 이상">
                ★★★☆☆ 이상
              </button>
            </div>
          </div>
        );
      case 'discount-filter':
        return (
          <div key={type} className={styles.discountFilter}>
            <button className={`${styles.controllerButton} ${styles.discountButton}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 5L5 19" />
                <circle cx="6.5" cy="6.5" r="2.5" />
                <circle cx="17.5" cy="17.5" r="2.5" />
              </svg>
              할인 상품
            </button>
            <button className={`${styles.controllerButton} ${styles.freeShippingButton}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="3" width="15" height="13" />
                <polygon points="16,8 20,8 23,11 23,16 16,16" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
              무료배송
            </button>
          </div>
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
