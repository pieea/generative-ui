'use client';

import { TemplateProps } from '@/types';
import styles from './templates.module.css';

export function HeroTemplate({ data, layout }: TemplateProps) {
  const { items } = data;
  const { showImages = true } = layout;

  // 첫 번째 아이템을 히어로로, 나머지는 사이드바로
  const [heroItem, ...sideItems] = items;

  if (!heroItem) return null;

  return (
    <div className={styles.heroContainer}>
      <article className={styles.heroMain}>
        {showImages && heroItem.imageUrl && (
          <div className={styles.heroImage}>
            <img src={heroItem.imageUrl} alt={heroItem.title} />
            <div className={styles.heroOverlay} />
          </div>
        )}
        <div className={styles.heroContent}>
          {heroItem.category && (
            <span className={styles.heroCategory}>{heroItem.category}</span>
          )}
          <h1 className={styles.heroTitle}>
            {heroItem.url ? (
              <a href={heroItem.url} target="_blank" rel="noopener noreferrer">
                {heroItem.title}
              </a>
            ) : (
              heroItem.title
            )}
          </h1>
          {heroItem.description && (
            <p className={styles.heroDescription}>{heroItem.description}</p>
          )}
          <div className={styles.heroMeta}>
            {heroItem.timestamp && (
              <span className={styles.heroTimestamp}>{heroItem.timestamp}</span>
            )}
            {heroItem.tags && heroItem.tags.length > 0 && (
              <div className={styles.heroTags}>
                {heroItem.tags.map((tag) => (
                  <span key={tag} className={styles.heroTag}>{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </article>

      {sideItems.length > 0 && (
        <aside className={styles.heroSidebar}>
          <h3 className={styles.sidebarTitle}>관련 결과</h3>
          {sideItems.slice(0, 4).map((item) => (
            <article key={item.id} className={styles.sidebarItem}>
              {showImages && item.imageUrl && (
                <div className={styles.sidebarImage}>
                  <img src={item.imageUrl} alt={item.title} />
                </div>
              )}
              <div className={styles.sidebarContent}>
                <h4 className={styles.sidebarItemTitle}>
                  {item.url ? (
                    <a href={item.url} target="_blank" rel="noopener noreferrer">
                      {item.title}
                    </a>
                  ) : (
                    item.title
                  )}
                </h4>
                {item.timestamp && (
                  <span className={styles.sidebarTimestamp}>{item.timestamp}</span>
                )}
              </div>
            </article>
          ))}
        </aside>
      )}
    </div>
  );
}
