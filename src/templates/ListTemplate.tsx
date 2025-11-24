'use client';

import { TemplateProps } from '@/types';
import styles from './templates.module.css';

export function ListTemplate({ data, layout }: TemplateProps) {
  const { items } = data;
  const { compact = false, showImages = true } = layout;

  return (
    <div className={styles.listContainer}>
      {items.map((item) => (
        <article
          key={item.id}
          className={`${styles.listItem} ${compact ? styles.compact : ''}`}
        >
          {showImages && item.imageUrl && (
            <div className={styles.listItemImage}>
              <img src={item.imageUrl} alt={item.title} />
            </div>
          )}
          <div className={styles.listItemContent}>
            <h3 className={styles.listItemTitle}>
              {item.url ? (
                <a href={item.url} target="_blank" rel="noopener noreferrer">
                  {item.title}
                </a>
              ) : (
                item.title
              )}
            </h3>
            {item.description && (
              <p className={styles.listItemDescription}>{item.description}</p>
            )}
            <div className={styles.listItemMeta}>
              {item.timestamp && (
                <span className={styles.timestamp}>{item.timestamp}</span>
              )}
              {item.category && (
                <span className={styles.category}>{item.category}</span>
              )}
              {item.tags && item.tags.length > 0 && (
                <div className={styles.tags}>
                  {item.tags.map((tag) => (
                    <span key={tag} className={styles.tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
