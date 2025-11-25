'use client';

import { TemplateProps } from '@/types';
import styles from './templates.module.css';

export function DualProfileTemplate({ data, layout }: TemplateProps) {
  const { items } = data;
  const { showImages = true } = layout;

  // 인물 아이템과 뉴스 아이템 분리
  const personItems = items.filter(
    item => item.category === '인물' || item.metadata?.occupation
  );
  const newsItems = items.filter(
    item => item.category === '뉴스' || (item.timestamp && item.metadata?.source)
  );

  // 최대 2명의 인물만 표시
  const [person1, person2] = personItems.slice(0, 2);

  if (!person1) return null;

  const renderProfileCard = (person: typeof person1, index: number) => {
    const profileInfo = (person.metadata || {}) as Record<string, string | number | undefined>;

    return (
      <article key={person.id || index} className={styles.dualProfileCard}>
        <div className={styles.dualProfileHeader}>
          {showImages && person.imageUrl && (
            <div className={styles.dualProfileImage}>
              <img src={person.imageUrl} alt={person.title} />
            </div>
          )}
          <div className={styles.dualProfileInfo}>
            <h2 className={styles.dualProfileName}>
              {person.url ? (
                <a href={person.url} target="_blank" rel="noopener noreferrer">
                  {person.title}
                </a>
              ) : (
                person.title
              )}
            </h2>
            {profileInfo.occupation && (
              <span className={styles.dualProfileOccupation}>
                {String(profileInfo.occupation)}
              </span>
            )}
            {profileInfo.organization && (
              <span className={styles.dualProfileOrg}>
                {String(profileInfo.organization)}
              </span>
            )}
          </div>
        </div>

        {person.description && (
          <p className={styles.dualProfileDesc}>{person.description}</p>
        )}

        <dl className={styles.dualProfileMeta}>
          {profileInfo.birthDate && (
            <>
              <dt>출생</dt>
              <dd>{String(profileInfo.birthDate)}</dd>
            </>
          )}
          {profileInfo.education && (
            <>
              <dt>학력</dt>
              <dd>{String(profileInfo.education)}</dd>
            </>
          )}
          {profileInfo.spouse && (
            <>
              <dt>배우자</dt>
              <dd>{String(profileInfo.spouse)}</dd>
            </>
          )}
        </dl>
      </article>
    );
  };

  return (
    <div className={styles.dualProfileContainer}>
      {/* 왼쪽: 두 인물 프로필 */}
      <div className={styles.dualProfileLeft}>
        {renderProfileCard(person1, 0)}
        {person2 && renderProfileCard(person2, 1)}
      </div>

      {/* 오른쪽: 관련 뉴스 */}
      {newsItems.length > 0 && (
        <aside className={styles.dualProfileRight}>
          <h3 className={styles.dualProfileNewsTitle}>관련 뉴스</h3>
          <div className={styles.dualProfileNewsList}>
            {newsItems.slice(0, 5).map((item, index) => (
              <article key={item.id || index} className={styles.dualProfileNewsItem}>
                {showImages && item.imageUrl && (
                  <div className={styles.dualProfileNewsImage}>
                    <img src={item.imageUrl} alt={item.title} />
                  </div>
                )}
                <div className={styles.dualProfileNewsContent}>
                  <h4 className={styles.dualProfileNewsItemTitle}>
                    {item.url ? (
                      <a href={item.url} target="_blank" rel="noopener noreferrer">
                        {item.title}
                      </a>
                    ) : (
                      item.title
                    )}
                  </h4>
                  <div className={styles.dualProfileNewsMeta}>
                    {item.metadata?.source !== undefined && (
                      <span className={styles.dualProfileNewsSource}>
                        {String(item.metadata.source)}
                      </span>
                    )}
                    {item.timestamp && (
                      <span className={styles.dualProfileNewsTime}>
                        {item.timestamp}
                      </span>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </aside>
      )}
    </div>
  );
}
