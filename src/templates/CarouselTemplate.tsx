'use client';

import { useState } from 'react';
import { TemplateProps } from '@/types';
import styles from './templates.module.css';

export function CarouselTemplate({ data, layout }: TemplateProps) {
  const { items } = data;
  const [currentIndex, setCurrentIndex] = useState(0);
  const { showImages = true } = layout;

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1));
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const currentItem = items[currentIndex];

  return (
    <div className={styles.carouselContainer}>
      <div className={styles.carouselMain}>
        <button
          className={`${styles.carouselNav} ${styles.carouselPrev}`}
          onClick={goToPrev}
          aria-label="이전"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15,18 9,12 15,6" />
          </svg>
        </button>

        <div className={styles.carouselSlide}>
          {showImages && currentItem.imageUrl && (
            <div className={styles.carouselImage}>
              <img src={currentItem.imageUrl} alt={currentItem.title} />
            </div>
          )}
          <div className={styles.carouselContent}>
            <h2 className={styles.carouselTitle}>
              {currentItem.url ? (
                <a href={currentItem.url} target="_blank" rel="noopener noreferrer">
                  {currentItem.title}
                </a>
              ) : (
                currentItem.title
              )}
            </h2>
            {currentItem.description && (
              <p className={styles.carouselDescription}>{currentItem.description}</p>
            )}
            <div className={styles.carouselMeta}>
              {currentItem.timestamp && (
                <span className={styles.timestamp}>{currentItem.timestamp}</span>
              )}
              {currentItem.category && (
                <span className={styles.category}>{currentItem.category}</span>
              )}
            </div>
            {currentItem.tags && currentItem.tags.length > 0 && (
              <div className={styles.carouselTags}>
                {currentItem.tags.map((tag) => (
                  <span key={tag} className={styles.tag}>{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          className={`${styles.carouselNav} ${styles.carouselNext}`}
          onClick={goToNext}
          aria-label="다음"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9,18 15,12 9,6" />
          </svg>
        </button>
      </div>

      <div className={styles.carouselDots}>
        {items.map((_, index) => (
          <button
            key={index}
            className={`${styles.carouselDot} ${index === currentIndex ? styles.active : ''}`}
            onClick={() => goToSlide(index)}
            aria-label={`${index + 1}번 슬라이드`}
          />
        ))}
      </div>

      <div className={styles.carouselCounter}>
        {currentIndex + 1} / {items.length}
      </div>
    </div>
  );
}
