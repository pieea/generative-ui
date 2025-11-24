'use client';

import { TemplateProps } from '@/types';
import styles from './templates.module.css';

export function GridTemplate({ data, layout }: TemplateProps) {
  const { items } = data;
  const { columns = 3, compact = false } = layout;

  return (
    <div
      className={styles.gridContainer}
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
    >
      {items.map((item) => (
        <article
          key={item.id}
          className={`${styles.gridItem} ${compact ? styles.compact : ''}`}
        >
          {item.imageUrl && (
            <div className={styles.gridItemImage}>
              <img src={item.imageUrl} alt={item.title} />
            </div>
          )}
          <div className={styles.gridItemContent}>
            <h3 className={styles.gridItemTitle}>
              {item.url ? (
                <a href={item.url} target="_blank" rel="noopener noreferrer">
                  {item.title}
                </a>
              ) : (
                item.title
              )}
            </h3>
            {!compact && item.description && (
              <p className={styles.gridItemDescription}>{item.description}</p>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
