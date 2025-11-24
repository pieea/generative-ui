'use client';

import { TemplateProps } from '@/types';
import styles from './templates.module.css';

export function TimelineTemplate({ data, layout }: TemplateProps) {
  const { items } = data;
  const { showImages = true } = layout;

  return (
    <div className={styles.timelineContainer}>
      <div className={styles.timelineLine} />
      {items.map((item, index) => (
        <article
          key={item.id}
          className={`${styles.timelineItem} ${index % 2 === 0 ? styles.timelineLeft : styles.timelineRight}`}
        >
          <div className={styles.timelineMarker}>
            <div className={styles.timelineDot} />
            {item.timestamp && (
              <span className={styles.timelineDate}>{item.timestamp}</span>
            )}
          </div>
          <div className={styles.timelineCard}>
            {showImages && item.imageUrl && (
              <div className={styles.timelineImage}>
                <img src={item.imageUrl} alt={item.title} />
              </div>
            )}
            <div className={styles.timelineContent}>
              {item.category && (
                <span className={styles.timelineCategory}>{item.category}</span>
              )}
              <h3 className={styles.timelineTitle}>
                {item.url ? (
                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                    {item.title}
                  </a>
                ) : (
                  item.title
                )}
              </h3>
              {item.description && (
                <p className={styles.timelineDescription}>{item.description}</p>
              )}
              {item.tags && item.tags.length > 0 && (
                <div className={styles.timelineTags}>
                  {item.tags.map((tag) => (
                    <span key={tag} className={styles.tag}>{tag}</span>
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
