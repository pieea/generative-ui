'use client';

import { TemplateProps } from '@/types';
import styles from './templates.module.css';

export function ProfileTemplate({ data, layout }: TemplateProps) {
  const { items } = data;
  const { showImages = true } = layout;

  // 첫 번째 아이템을 메인 프로필로 사용
  const mainProfile = items[0];
  const relatedItems = items.slice(1);

  if (!mainProfile) return null;

  // 메타데이터에서 프로필 정보 추출
  const profileInfo = mainProfile.metadata || {};

  return (
    <div className={styles.profileContainer}>
      {/* 메인 프로필 영역 */}
      <article className={styles.profileMain}>
        {/* 프로필 헤더 */}
        <header className={styles.profileHeader}>
          <h1 className={styles.profileName}>{mainProfile.title}</h1>
          {mainProfile.category && (
            <span className={styles.profileRole}>{mainProfile.category}</span>
          )}
        </header>

        <div className={styles.profileBody}>
          {/* 프로필 이미지 & 정보 테이블 */}
          <aside className={styles.profileSidebar}>
            {showImages && mainProfile.imageUrl && (
              <div className={styles.profileImageWrapper}>
                <img
                  src={mainProfile.imageUrl}
                  alt={mainProfile.title}
                  className={styles.profileImage}
                />
              </div>
            )}

            {/* 정보 테이블 (위키 스타일) */}
            <div className={styles.profileInfoBox}>
              <h3 className={styles.infoBoxTitle}>{mainProfile.title}</h3>
              <dl className={styles.infoList}>
                {profileInfo.birthDate && (
                  <>
                    <dt>출생</dt>
                    <dd>{String(profileInfo.birthDate)}</dd>
                  </>
                )}
                {profileInfo.birthPlace && (
                  <>
                    <dt>출생지</dt>
                    <dd>{String(profileInfo.birthPlace)}</dd>
                  </>
                )}
                {profileInfo.nationality && (
                  <>
                    <dt>국적</dt>
                    <dd>{String(profileInfo.nationality)}</dd>
                  </>
                )}
                {profileInfo.occupation && (
                  <>
                    <dt>직업</dt>
                    <dd>{String(profileInfo.occupation)}</dd>
                  </>
                )}
                {profileInfo.organization && (
                  <>
                    <dt>소속</dt>
                    <dd>{String(profileInfo.organization)}</dd>
                  </>
                )}
                {profileInfo.netWorth && (
                  <>
                    <dt>자산</dt>
                    <dd>{String(profileInfo.netWorth)}</dd>
                  </>
                )}
                {profileInfo.education && (
                  <>
                    <dt>학력</dt>
                    <dd>{String(profileInfo.education)}</dd>
                  </>
                )}
                {profileInfo.website && (
                  <>
                    <dt>웹사이트</dt>
                    <dd>
                      <a href={String(profileInfo.website)} target="_blank" rel="noopener noreferrer">
                        {String(profileInfo.website)}
                      </a>
                    </dd>
                  </>
                )}
                {mainProfile.timestamp && (
                  <>
                    <dt>최근 업데이트</dt>
                    <dd>{mainProfile.timestamp}</dd>
                  </>
                )}
              </dl>
            </div>

            {/* 태그 */}
            {mainProfile.tags && mainProfile.tags.length > 0 && (
              <div className={styles.profileTags}>
                {mainProfile.tags.map((tag) => (
                  <span key={tag} className={styles.tag}>{tag}</span>
                ))}
              </div>
            )}
          </aside>

          {/* 메인 콘텐츠 (소개/약력) */}
          <div className={styles.profileContent}>
            {mainProfile.description && (
              <section className={styles.profileSection}>
                <h2 className={styles.sectionTitle}>개요</h2>
                <p className={styles.profileBio}>{mainProfile.description}</p>
              </section>
            )}

            {profileInfo.summary && (
              <section className={styles.profileSection}>
                <h2 className={styles.sectionTitle}>요약</h2>
                <p className={styles.profileText}>{String(profileInfo.summary)}</p>
              </section>
            )}

            {profileInfo.career && (
              <section className={styles.profileSection}>
                <h2 className={styles.sectionTitle}>경력</h2>
                <p className={styles.profileText}>{String(profileInfo.career)}</p>
              </section>
            )}

            {profileInfo.achievements && (
              <section className={styles.profileSection}>
                <h2 className={styles.sectionTitle}>주요 업적</h2>
                <p className={styles.profileText}>{String(profileInfo.achievements)}</p>
              </section>
            )}

            {/* 외부 링크 */}
            {mainProfile.url && (
              <section className={styles.profileSection}>
                <h2 className={styles.sectionTitle}>외부 링크</h2>
                <a
                  href={mainProfile.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.profileLink}
                >
                  자세히 보기 →
                </a>
              </section>
            )}
          </div>
        </div>
      </article>

      {/* 관련 인물/항목 */}
      {relatedItems.length > 0 && (
        <section className={styles.relatedSection}>
          <h2 className={styles.relatedTitle}>관련 항목</h2>
          <div className={styles.relatedGrid}>
            {relatedItems.slice(0, 4).map((item) => (
              <article key={item.id} className={styles.relatedCard}>
                {showImages && item.imageUrl && (
                  <div className={styles.relatedImage}>
                    <img src={item.imageUrl} alt={item.title} />
                  </div>
                )}
                <div className={styles.relatedContent}>
                  <h3 className={styles.relatedName}>
                    {item.url ? (
                      <a href={item.url} target="_blank" rel="noopener noreferrer">
                        {item.title}
                      </a>
                    ) : (
                      item.title
                    )}
                  </h3>
                  {item.category && (
                    <span className={styles.relatedRole}>{item.category}</span>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
