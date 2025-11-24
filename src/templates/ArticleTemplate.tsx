'use client';

import { TemplateProps } from '@/types';
import styles from './templates.module.css';

export function ArticleTemplate({ data, layout }: TemplateProps) {
  const { items } = data;
  const { showImages = true } = layout;

  // 첫 번째 아이템을 메인 기사로 사용
  const mainArticle = items[0];
  const relatedArticles = items.slice(1);

  if (!mainArticle) return null;

  // 메타데이터에서 기사 정보 추출
  const articleMeta = (mainArticle.metadata || {}) as Record<string, string | number | undefined>;

  return (
    <div className={styles.articleContainer}>
      {/* 메인 기사 영역 */}
      <article className={styles.articleMain}>
        {/* 기사 헤더 */}
        <header className={styles.articleHeader}>
          {mainArticle.category && (
            <span className={styles.articleCategory}>{mainArticle.category}</span>
          )}
          <h1 className={styles.articleTitle}>{mainArticle.title}</h1>

          {/* 기사 메타 정보 */}
          <div className={styles.articleMeta}>
            {articleMeta.author && (
              <span className={styles.articleAuthor}>
                <span className={styles.metaIcon}>✍️</span>
                {String(articleMeta.author)}
              </span>
            )}
            {articleMeta.source && (
              <span className={styles.articleSource}>
                <span className={styles.metaIcon}>📰</span>
                {String(articleMeta.source)}
              </span>
            )}
            {mainArticle.timestamp && (
              <span className={styles.articleDate}>
                <span className={styles.metaIcon}>🕐</span>
                {mainArticle.timestamp}
              </span>
            )}
            {articleMeta.readTime && (
              <span className={styles.articleReadTime}>
                <span className={styles.metaIcon}>⏱️</span>
                {String(articleMeta.readTime)}
              </span>
            )}
          </div>
        </header>

        {/* 대표 이미지 */}
        {showImages && mainArticle.imageUrl && (
          <figure className={styles.articleFeaturedImage}>
            <img
              src={mainArticle.imageUrl}
              alt={mainArticle.title}
            />
            {articleMeta.imageCaption && (
              <figcaption className={styles.imageCaption}>
                {String(articleMeta.imageCaption)}
              </figcaption>
            )}
          </figure>
        )}

        {/* 기사 본문 */}
        <div className={styles.articleBody}>
          {/* 핵심 요약 */}
          {articleMeta.summary && (
            <div className={styles.articleSummary}>
              <h2 className={styles.summaryTitle}>핵심 요약</h2>
              <p className={styles.summaryText}>{String(articleMeta.summary)}</p>
            </div>
          )}

          {/* 메인 본문 */}
          {mainArticle.description && (
            <section className={styles.articleContent}>
              {String(mainArticle.description).split('\n\n').map((paragraph, index) => (
                <p key={index} className={styles.articleParagraph}>
                  {paragraph}
                </p>
              ))}
            </section>
          )}

          {/* 추가 본문 (metadata.body) */}
          {articleMeta.body && (
            <section className={styles.articleContent}>
              {String(articleMeta.body).split('\n\n').map((paragraph, index) => (
                <p key={index} className={styles.articleParagraph}>
                  {paragraph}
                </p>
              ))}
            </section>
          )}

          {/* 핵심 수치/데이터 */}
          {articleMeta.keyFigures && Array.isArray(articleMeta.keyFigures) && (
            <div className={styles.keyFigures}>
              <h3 className={styles.keyFiguresTitle}>주요 수치</h3>
              <div className={styles.keyFiguresGrid}>
                {(articleMeta.keyFigures as Array<{ label: string; value: string; change?: string }>).map((figure, index) => (
                  <div key={index} className={styles.keyFigureItem}>
                    <span className={styles.keyFigureLabel}>{figure.label}</span>
                    <span className={styles.keyFigureValue}>{figure.value}</span>
                    {figure.change && (
                      <span className={`${styles.keyFigureChange} ${
                        figure.change.startsWith('+') ? styles.positive :
                        figure.change.startsWith('-') ? styles.negative : ''
                      }`}>
                        {figure.change}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 인용구 */}
          {articleMeta.quote && (
            <blockquote className={styles.articleQuote}>
              <p>{String(articleMeta.quote)}</p>
              {articleMeta.quoteAuthor && (
                <cite>— {String(articleMeta.quoteAuthor)}</cite>
              )}
            </blockquote>
          )}

          {/* 태그 */}
          {mainArticle.tags && mainArticle.tags.length > 0 && (
            <div className={styles.articleTags}>
              {mainArticle.tags.map((tag) => (
                <span key={tag} className={styles.articleTag}>{tag}</span>
              ))}
            </div>
          )}

          {/* 원문 링크 */}
          {mainArticle.url && (
            <div className={styles.articleActions}>
              <a
                href={mainArticle.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.articleLink}
              >
                원문 보기 →
              </a>
            </div>
          )}
        </div>
      </article>

      {/* 관련 기사 */}
      {relatedArticles.length > 0 && (
        <aside className={styles.relatedArticles}>
          <h2 className={styles.relatedArticlesTitle}>관련 기사</h2>
          <div className={styles.relatedArticlesList}>
            {relatedArticles.slice(0, 5).map((article) => (
              <article key={article.id} className={styles.relatedArticleItem}>
                {showImages && article.imageUrl && (
                  <div className={styles.relatedArticleImage}>
                    <img src={article.imageUrl} alt={article.title} />
                  </div>
                )}
                <div className={styles.relatedArticleContent}>
                  {article.category && (
                    <span className={styles.relatedArticleCategory}>{article.category}</span>
                  )}
                  <h3 className={styles.relatedArticleTitle}>
                    {article.url ? (
                      <a href={article.url} target="_blank" rel="noopener noreferrer">
                        {article.title}
                      </a>
                    ) : (
                      article.title
                    )}
                  </h3>
                  {article.description && (
                    <p className={styles.relatedArticleDesc}>{article.description}</p>
                  )}
                  {article.timestamp && (
                    <span className={styles.relatedArticleDate}>{article.timestamp}</span>
                  )}
                </div>
              </article>
            ))}
          </div>
        </aside>
      )}
    </div>
  );
}
