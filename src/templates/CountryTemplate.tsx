'use client';

import { TemplateProps } from '@/types';
import styles from './templates.module.css';

interface CountryMetadata {
  countryCode?: string;      // KR, US, JP 등
  officialName?: string;     // 공식 명칭
  englishName?: string;      // 영문명
  capital?: string;          // 수도
  population?: string;       // 인구
  area?: string;             // 면적
  gdp?: string;              // GDP
  language?: string;         // 언어
  currency?: string;         // 통화
  religion?: string;         // 종교
  climate?: string;          // 기후
  flagUrl?: string;          // 국기 이미지
  localTime?: string;        // 현지 시간
  exchangeRate?: string;     // 환율
}

// 국가 코드별 국기 이모지 매핑
const countryFlags: Record<string, string> = {
  US: '🇺🇸', USA: '🇺🇸',
  JP: '🇯🇵', JPN: '🇯🇵',
  CN: '🇨🇳', CHN: '🇨🇳',
  KR: '🇰🇷', KOR: '🇰🇷',
  GB: '🇬🇧', GBR: '🇬🇧',
  DE: '🇩🇪', DEU: '🇩🇪',
  FR: '🇫🇷', FRA: '🇫🇷',
  IT: '🇮🇹', ITA: '🇮🇹',
  ES: '🇪🇸', ESP: '🇪🇸',
  AU: '🇦🇺', AUS: '🇦🇺',
  CA: '🇨🇦', CAN: '🇨🇦',
  BR: '🇧🇷', BRA: '🇧🇷',
  IN: '🇮🇳', IND: '🇮🇳',
  RU: '🇷🇺', RUS: '🇷🇺',
  MX: '🇲🇽', MEX: '🇲🇽',
  TH: '🇹🇭', THA: '🇹🇭',
  VN: '🇻🇳', VNM: '🇻🇳',
  PH: '🇵🇭', PHL: '🇵🇭',
  SG: '🇸🇬', SGP: '🇸🇬',
  MY: '🇲🇾', MYS: '🇲🇾',
};

export function CountryTemplate({ data }: TemplateProps) {
  // 국가 정보 아이템 찾기
  const countryItem = data.items.find(
    item => item.category === '국가' || item.metadata?.countryCode || item.metadata?.capital
  );

  // 관련 뉴스 아이템
  const newsItems = data.items.filter(
    item => item.category === '뉴스' || (item.timestamp && item.metadata?.source)
  );

  if (!countryItem) {
    return (
      <div className={styles.countryEmptyState}>
        <p>국가 정보를 불러오는 중...</p>
      </div>
    );
  }

  const meta = (countryItem.metadata || {}) as CountryMetadata;
  const countryCode = meta.countryCode || '';
  const flag = countryFlags[countryCode] || '🌍';

  const infoItems = [
    { label: '수도', value: meta.capital },
    { label: '인구', value: meta.population },
    { label: '면적', value: meta.area },
    { label: 'GDP', value: meta.gdp },
    { label: '언어', value: meta.language },
    { label: '통화', value: meta.currency },
    { label: '종교', value: meta.religion },
    { label: '기후', value: meta.climate },
  ].filter(item => item.value);

  return (
    <div className={styles.countryContainer}>
      {/* 국가 헤더 */}
      <div className={styles.countryHeader}>
        <div className={styles.countryFlag}>{flag}</div>
        <div className={styles.countryTitleArea}>
          <h1 className={styles.countryName}>{countryItem.title}</h1>
          {meta.englishName && (
            <span className={styles.countryEnglishName}>{meta.englishName}</span>
          )}
          {meta.officialName && (
            <span className={styles.countryOfficialName}>{meta.officialName}</span>
          )}
        </div>
      </div>

      {/* 국가 설명 */}
      {countryItem.description && (
        <p className={styles.countryDescription}>{countryItem.description}</p>
      )}

      {/* 국가 정보 그리드 */}
      <div className={styles.countryInfoGrid}>
        {infoItems.map((item, index) => (
          <div key={index} className={styles.countryInfoItem}>
            <span className={styles.countryInfoLabel}>{item.label}</span>
            <span className={styles.countryInfoValue}>{item.value}</span>
          </div>
        ))}
      </div>

      {/* 현지 시간 & 환율 */}
      {(meta.localTime || meta.exchangeRate) && (
        <div className={styles.countryLiveInfo}>
          {meta.localTime && (
            <div className={styles.countryLiveItem}>
              <span className={styles.countryLiveLabel}>현지 시간</span>
              <span className={styles.countryLiveValue}>{meta.localTime}</span>
            </div>
          )}
          {meta.exchangeRate && (
            <div className={styles.countryLiveItem}>
              <span className={styles.countryLiveLabel}>환율</span>
              <span className={styles.countryLiveValue}>{meta.exchangeRate}</span>
            </div>
          )}
        </div>
      )}

      {/* 관련 뉴스 */}
      {newsItems.length > 0 && (
        <aside className={styles.countryNews}>
          <h3 className={styles.countryNewsTitle}>관련 뉴스</h3>
          <div className={styles.countryNewsList}>
            {newsItems.slice(0, 5).map((item, index) => (
              <article key={item.id || index} className={styles.countryNewsItem}>
                <h4 className={styles.countryNewsItemTitle}>
                  {item.url ? (
                    <a href={item.url} target="_blank" rel="noopener noreferrer">
                      {item.title}
                    </a>
                  ) : (
                    item.title
                  )}
                </h4>
                <div className={styles.countryNewsMeta}>
                  {item.metadata?.source !== undefined && (
                    <span className={styles.countryNewsSource}>
                      {String(item.metadata.source)}
                    </span>
                  )}
                  {item.timestamp && (
                    <span className={styles.countryNewsTime}>{item.timestamp}</span>
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
