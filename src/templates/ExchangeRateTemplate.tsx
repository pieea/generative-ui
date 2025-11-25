'use client';

import { TemplateProps } from '@/types';
import styles from './templates.module.css';

interface ExchangeRateMetadata {
  currencyCode?: string;      // USD, EUR, JPY 등
  currencyName?: string;      // 미국 달러, 유로 등
  baseRate?: number;          // 매매기준율
  cashBuy?: number;           // 현찰 살 때
  cashSell?: number;          // 현찰 팔 때
  sendRate?: number;          // 송금 보낼 때
  receiveRate?: number;       // 송금 받을 때
  change?: number;            // 전일대비 변동
  changePercent?: number;     // 등락률
  trend?: 'up' | 'down' | 'unchanged';
  updatedAt?: string;         // 업데이트 시간
}

// 통화별 국기 이모지 매핑
const currencyFlags: Record<string, string> = {
  USD: '🇺🇸',
  EUR: '🇪🇺',
  JPY: '🇯🇵',
  CNY: '🇨🇳',
  GBP: '🇬🇧',
  AUD: '🇦🇺',
  CAD: '🇨🇦',
  CHF: '🇨🇭',
  HKD: '🇭🇰',
  SGD: '🇸🇬',
  THB: '🇹🇭',
  TWD: '🇹🇼',
  NZD: '🇳🇿',
  INR: '🇮🇳',
  VND: '🇻🇳',
  PHP: '🇵🇭',
  MYR: '🇲🇾',
  IDR: '🇮🇩',
};

export function ExchangeRateTemplate({ data, layout }: TemplateProps) {
  const { showImages = true } = layout;

  // 환율 아이템 필터링
  const exchangeItems = data.items.filter(
    item => item.category === '환율' || item.metadata?.currencyCode
  );

  // 기타 뉴스/정보 아이템
  const newsItems = data.items.filter(
    item => item.category === '뉴스' || (item.category !== '환율' && !item.metadata?.currencyCode)
  );

  const getExchangeMeta = (item: typeof data.items[0]): ExchangeRateMetadata => {
    const meta = (item.metadata || {}) as Record<string, unknown>;
    return {
      currencyCode: meta.currencyCode as string,
      currencyName: meta.currencyName as string,
      baseRate: meta.baseRate as number,
      cashBuy: meta.cashBuy as number,
      cashSell: meta.cashSell as number,
      sendRate: meta.sendRate as number,
      receiveRate: meta.receiveRate as number,
      change: meta.change as number,
      changePercent: meta.changePercent as number,
      trend: meta.trend as 'up' | 'down' | 'unchanged',
      updatedAt: meta.updatedAt as string,
    };
  };

  const formatRate = (rate?: number) => {
    if (!rate) return '-';
    return rate.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatChange = (change?: number, percent?: number) => {
    if (!change && change !== 0) return null;
    const sign = change > 0 ? '+' : '';
    const percentStr = percent ? ` (${sign}${percent.toFixed(2)}%)` : '';
    return `${sign}${formatRate(change)}${percentStr}`;
  };

  return (
    <div className={styles.exchangeRateContainer}>
      {/* 헤더 */}
      <div className={styles.exchangeRateHeader}>
        <h2 className={styles.exchangeRateTitle}>실시간 환율</h2>
        <span className={styles.exchangeRateSource}>
          기준: 하나은행 매매기준율
        </span>
      </div>

      {/* 환율 카드 그리드 */}
      <div className={styles.exchangeRateGrid}>
        {exchangeItems.map((item, index) => {
          const meta = getExchangeMeta(item);
          const flag = currencyFlags[meta.currencyCode || ''] || '💱';
          const isUp = meta.trend === 'up' || (meta.change && meta.change > 0);
          const isDown = meta.trend === 'down' || (meta.change && meta.change < 0);

          return (
            <article key={item.id || index} className={styles.exchangeRateCard}>
              {/* 통화 헤더 */}
              <div className={styles.exchangeCurrencyHeader}>
                <span className={styles.exchangeFlag}>{flag}</span>
                <div className={styles.exchangeCurrencyInfo}>
                  <span className={styles.exchangeCurrencyCode}>
                    {meta.currencyCode || item.title}
                  </span>
                  <span className={styles.exchangeCurrencyName}>
                    {meta.currencyName || item.description}
                  </span>
                </div>
              </div>

              {/* 기준율 */}
              <div className={styles.exchangeBaseRate}>
                <span className={styles.exchangeRateValue}>
                  {formatRate(meta.baseRate)}
                </span>
                <span className={styles.exchangeRateUnit}>원</span>
              </div>

              {/* 변동 */}
              {meta.change !== undefined && (
                <div className={`${styles.exchangeChange} ${isUp ? styles.up : ''} ${isDown ? styles.down : ''}`}>
                  <span className={styles.exchangeChangeIcon}>
                    {isUp ? '▲' : isDown ? '▼' : '-'}
                  </span>
                  <span className={styles.exchangeChangeValue}>
                    {formatChange(meta.change, meta.changePercent)}
                  </span>
                </div>
              )}

              {/* 상세 환율 정보 */}
              <div className={styles.exchangeDetails}>
                {meta.cashBuy && (
                  <div className={styles.exchangeDetailRow}>
                    <span className={styles.exchangeDetailLabel}>현찰 살 때</span>
                    <span className={styles.exchangeDetailValue}>{formatRate(meta.cashBuy)}</span>
                  </div>
                )}
                {meta.cashSell && (
                  <div className={styles.exchangeDetailRow}>
                    <span className={styles.exchangeDetailLabel}>현찰 팔 때</span>
                    <span className={styles.exchangeDetailValue}>{formatRate(meta.cashSell)}</span>
                  </div>
                )}
                {meta.sendRate && (
                  <div className={styles.exchangeDetailRow}>
                    <span className={styles.exchangeDetailLabel}>송금 보낼 때</span>
                    <span className={styles.exchangeDetailValue}>{formatRate(meta.sendRate)}</span>
                  </div>
                )}
                {meta.receiveRate && (
                  <div className={styles.exchangeDetailRow}>
                    <span className={styles.exchangeDetailLabel}>송금 받을 때</span>
                    <span className={styles.exchangeDetailValue}>{formatRate(meta.receiveRate)}</span>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {/* 환율 데이터가 없는 경우 안내 */}
      {exchangeItems.length === 0 && (
        <div className={styles.exchangeEmptyState}>
          <p>환율 정보를 불러오는 중...</p>
        </div>
      )}

      {/* 관련 뉴스 */}
      {newsItems.length > 0 && (
        <aside className={styles.exchangeNews}>
          <h3 className={styles.exchangeNewsTitle}>관련 뉴스</h3>
          <div className={styles.exchangeNewsList}>
            {newsItems.slice(0, 4).map((item, index) => (
              <article key={item.id || index} className={styles.exchangeNewsItem}>
                <h4 className={styles.exchangeNewsItemTitle}>
                  {item.url ? (
                    <a href={item.url} target="_blank" rel="noopener noreferrer">
                      {item.title}
                    </a>
                  ) : (
                    item.title
                  )}
                </h4>
                <div className={styles.exchangeNewsMeta}>
                  {item.metadata?.source !== undefined && (
                    <span className={styles.exchangeNewsSource}>
                      {String(item.metadata.source)}
                    </span>
                  )}
                  {item.timestamp && (
                    <span className={styles.exchangeNewsTime}>{item.timestamp}</span>
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
