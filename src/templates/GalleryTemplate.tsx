'use client';

import { useState } from 'react';
import { TemplateProps } from '@/types';
import styles from './templates.module.css';

export function GalleryTemplate({ data }: TemplateProps) {
  const { items } = data;
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const selectedItemData = items.find((item) => item.id === selectedItem);

  return (
    <>
      <div className={styles.galleryContainer}>
        {items.map((item, index) => (
          <div
            key={item.id}
            className={`${styles.galleryItem} ${styles[`gallerySize${(index % 5) + 1}`]}`}
            onClick={() => setSelectedItem(item.id)}
          >
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.title} className={styles.galleryImage} />
            ) : (
              <div className={styles.galleryPlaceholder}>
                <span>{item.title.charAt(0)}</span>
              </div>
            )}
            <div className={styles.galleryOverlay}>
              <h4 className={styles.galleryTitle}>{item.title}</h4>
              {item.category && (
                <span className={styles.galleryCategory}>{item.category}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedItem && selectedItemData && (
        <div className={styles.lightbox} onClick={() => setSelectedItem(null)}>
          <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
            <button
              className={styles.lightboxClose}
              onClick={() => setSelectedItem(null)}
              aria-label="닫기"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            {selectedItemData.imageUrl && (
              <img
                src={selectedItemData.imageUrl}
                alt={selectedItemData.title}
                className={styles.lightboxImage}
              />
            )}
            <div className={styles.lightboxInfo}>
              <h3 className={styles.lightboxTitle}>
                {selectedItemData.url ? (
                  <a href={selectedItemData.url} target="_blank" rel="noopener noreferrer">
                    {selectedItemData.title}
                  </a>
                ) : (
                  selectedItemData.title
                )}
              </h3>
              {selectedItemData.description && (
                <p className={styles.lightboxDescription}>{selectedItemData.description}</p>
              )}
              <div className={styles.lightboxMeta}>
                {selectedItemData.timestamp && (
                  <span>{selectedItemData.timestamp}</span>
                )}
                {selectedItemData.category && (
                  <span className={styles.category}>{selectedItemData.category}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
