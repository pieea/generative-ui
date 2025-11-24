'use client';

import { useState } from 'react';
import { TemplateProps } from '@/types';
import styles from './templates.module.css';

export function MapTemplate({ data, layout }: TemplateProps) {
  const { items } = data;
  const { showImages = true } = layout;
  const [selectedId, setSelectedId] = useState<string | null>(items[0]?.id || null);

  const selectedItem = items.find((item) => item.id === selectedId) || items[0];

  if (!items.length) return null;

  return (
    <div className={styles.mapContainer}>
      {/* 지도 영역 (시뮬레이션) */}
      <div className={styles.mapArea}>
        <div className={styles.mapView}>
          {/* 지도 배경 이미지 (실제로는 지도 API 사용) */}
          <div className={styles.mapBackground}>
            <img
              src={`https://picsum.photos/seed/${data.query}map/800/500`}
              alt="지도"
              className={styles.mapImage}
            />
            <div className={styles.mapOverlay} />
          </div>

          {/* 마커들 */}
          <div className={styles.mapMarkers}>
            {items.slice(0, 8).map((item, index) => {
              const positions = [
                { top: '20%', left: '30%' },
                { top: '35%', left: '55%' },
                { top: '50%', left: '25%' },
                { top: '45%', left: '70%' },
                { top: '65%', left: '40%' },
                { top: '30%', left: '80%' },
                { top: '70%', left: '60%' },
                { top: '25%', left: '15%' },
              ];
              const pos = positions[index] || positions[0];

              return (
                <button
                  key={item.id}
                  className={`${styles.mapMarker} ${selectedId === item.id ? styles.active : ''}`}
                  style={{ top: pos.top, left: pos.left }}
                  onClick={() => setSelectedId(item.id)}
                  title={item.title}
                >
                  <span className={styles.markerIcon}>📍</span>
                  <span className={styles.markerNumber}>{index + 1}</span>
                </button>
              );
            })}
          </div>

          {/* 선택된 장소 미리보기 */}
          {selectedItem && (
            <div className={styles.mapPreview}>
              {showImages && selectedItem.imageUrl && (
                <div className={styles.previewImage}>
                  <img src={selectedItem.imageUrl} alt={selectedItem.title} />
                </div>
              )}
              <div className={styles.previewContent}>
                <h3 className={styles.previewTitle}>{selectedItem.title}</h3>
                {selectedItem.category && (
                  <span className={styles.previewCategory}>{selectedItem.category}</span>
                )}
                {selectedItem.metadata?.rating && (
                  <div className={styles.previewRating}>
                    <span className={styles.ratingStars}>
                      {'★'.repeat(Math.floor(Number(selectedItem.metadata.rating)))}
                      {'☆'.repeat(5 - Math.floor(Number(selectedItem.metadata.rating)))}
                    </span>
                    <span className={styles.ratingValue}>{String(selectedItem.metadata.rating)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 지도 컨트롤 */}
          <div className={styles.mapControls}>
            <button className={styles.mapControl} title="확대">+</button>
            <button className={styles.mapControl} title="축소">−</button>
            <button className={styles.mapControl} title="현위치">◎</button>
          </div>
        </div>
      </div>

      {/* 장소 목록 */}
      <div className={styles.mapList}>
        <div className={styles.listHeader}>
          <h2 className={styles.listTitle}>
            {data.query} 검색 결과
            <span className={styles.listCount}>{items.length}개</span>
          </h2>
        </div>

        <div className={styles.locationList}>
          {items.map((item, index) => {
            const meta = item.metadata || {};

            return (
              <article
                key={item.id}
                className={`${styles.locationCard} ${selectedId === item.id ? styles.selected : ''}`}
                onClick={() => setSelectedId(item.id)}
              >
                <span className={styles.locationNumber}>{index + 1}</span>

                {showImages && item.imageUrl && (
                  <div className={styles.locationImage}>
                    <img src={item.imageUrl} alt={item.title} />
                  </div>
                )}

                <div className={styles.locationInfo}>
                  <h3 className={styles.locationName}>
                    {item.url ? (
                      <a href={item.url} target="_blank" rel="noopener noreferrer">
                        {item.title}
                      </a>
                    ) : (
                      item.title
                    )}
                  </h3>

                  {item.category && (
                    <span className={styles.locationCategory}>{item.category}</span>
                  )}

                  {item.description && (
                    <p className={styles.locationDesc}>{item.description}</p>
                  )}

                  <div className={styles.locationMeta}>
                    {meta.rating && (
                      <span className={styles.locationRating}>
                        <span className={styles.star}>★</span>
                        {String(meta.rating)}
                      </span>
                    )}
                    {meta.reviewCount && (
                      <span className={styles.locationReviews}>
                        리뷰 {String(meta.reviewCount)}
                      </span>
                    )}
                    {meta.distance && (
                      <span className={styles.locationDistance}>
                        {String(meta.distance)}
                      </span>
                    )}
                  </div>

                  {meta.address && (
                    <p className={styles.locationAddress}>
                      <span className={styles.addressIcon}>📍</span>
                      {String(meta.address)}
                    </p>
                  )}

                  {meta.openHours && (
                    <p className={styles.locationHours}>
                      <span className={styles.hoursIcon}>🕐</span>
                      {String(meta.openHours)}
                    </p>
                  )}

                  {item.tags && item.tags.length > 0 && (
                    <div className={styles.locationTags}>
                      {item.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className={styles.locationTag}>{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
