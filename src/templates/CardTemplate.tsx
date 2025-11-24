'use client';

import { TemplateProps } from '@/types';
import styles from './templates.module.css';

export function CardTemplate({ data, layout }: TemplateProps) {
  const { items } = data;
  const { columns = 2, expanded = false } = layout;

  return (
    <div
      className={styles.cardContainer}
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
    >
      {items.map((item) => (
        <article
          key={item.id}
          className={`${styles.card} ${expanded ? styles.expanded : ''}`}
        >
          {item.imageUrl && (
            <div className={styles.cardImage}>
              <img src={item.imageUrl} alt={item.title} />
            </div>
          )}
          <div className={styles.cardBody}>
            <h3 className={styles.cardTitle}>
              {item.url ? (
                <a href={item.url} target="_blank" rel="noopener noreferrer">
                  {item.title}
                </a>
              ) : (
                item.title
              )}
            </h3>
            {item.description && (
              <p className={styles.cardDescription}>{item.description}</p>
            )}
            {item.tags && item.tags.length > 0 && (
              <div className={styles.cardTags}>
                {item.tags.map((tag) => (
                  <span key={tag} className={styles.tag}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
            {item.metadata && expanded && (
              <div className={styles.cardMeta}>
                {Object.entries(item.metadata).map(([key, value]) => (
                  <div key={key} className={styles.metaItem}>
                    <span className={styles.metaKey}>{key}:</span>
                    <span className={styles.metaValue}>{String(value)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className={styles.cardFooter}>
            {item.timestamp && (
              <span className={styles.timestamp}>{item.timestamp}</span>
            )}
            {item.category && (
              <span className={styles.category}>{item.category}</span>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
