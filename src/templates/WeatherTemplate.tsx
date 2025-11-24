'use client';

import { TemplateProps } from '@/types';
import styles from './templates.module.css';

// 날씨 아이콘 매핑
const weatherIcons: Record<string, string> = {
  sunny: '☀️',
  cloudy: '☁️',
  partlyCloudy: '⛅',
  rainy: '🌧️',
  snowy: '🌨️',
  stormy: '⛈️',
  foggy: '🌫️',
  windy: '💨',
};

export function WeatherTemplate({ data }: TemplateProps) {
  const { items, query } = data;

  if (!items.length) return null;

  // 첫 번째 아이템을 현재 날씨로 사용
  const currentWeather = items[0];
  const forecastItems = items.slice(1, 8); // 7일 예보

  const meta = currentWeather.metadata || {};

  return (
    <div className={styles.weatherContainer}>
      {/* 현재 날씨 카드 */}
      <div className={styles.currentWeather}>
        <div className={styles.weatherHeader}>
          <div className={styles.weatherLocation}>
            <span className={styles.locationIcon}>📍</span>
            <h2 className={styles.locationName}>{String(meta.location || query)}</h2>
          </div>
          <span className={styles.weatherTime}>{currentWeather.timestamp}</span>
        </div>

        <div className={styles.weatherMain}>
          <div className={styles.weatherIcon}>
            {weatherIcons[String(meta.condition)] || '☀️'}
          </div>
          <div className={styles.weatherTemp}>
            <span className={styles.tempValue}>{String(meta.temperature || '20')}</span>
            <span className={styles.tempUnit}>°C</span>
          </div>
          <div className={styles.weatherDesc}>
            {currentWeather.title}
          </div>
        </div>

        <div className={styles.weatherDetails}>
          <div className={styles.weatherDetail}>
            <span className={styles.detailIcon}>💧</span>
            <span className={styles.detailLabel}>습도</span>
            <span className={styles.detailValue}>{String(meta.humidity || '60')}%</span>
          </div>
          <div className={styles.weatherDetail}>
            <span className={styles.detailIcon}>💨</span>
            <span className={styles.detailLabel}>풍속</span>
            <span className={styles.detailValue}>{String(meta.windSpeed || '3')} m/s</span>
          </div>
          <div className={styles.weatherDetail}>
            <span className={styles.detailIcon}>🌡️</span>
            <span className={styles.detailLabel}>체감</span>
            <span className={styles.detailValue}>{String(meta.feelsLike || '18')}°</span>
          </div>
          <div className={styles.weatherDetail}>
            <span className={styles.detailIcon}>☔</span>
            <span className={styles.detailLabel}>강수확률</span>
            <span className={styles.detailValue}>{String(meta.precipitation || '10')}%</span>
          </div>
        </div>

        {/* 미세먼지 정보 */}
        {meta.airQuality && (
          <div className={styles.airQuality}>
            <h3 className={styles.airQualityTitle}>대기질</h3>
            <div className={styles.airQualityGrid}>
              <div className={`${styles.airQualityItem} ${styles[String(meta.pm10Level) || 'good']}`}>
                <span className={styles.aqLabel}>미세먼지</span>
                <span className={styles.aqValue}>{String(meta.pm10 || '35')}</span>
                <span className={styles.aqStatus}>{String(meta.pm10Status || '보통')}</span>
              </div>
              <div className={`${styles.airQualityItem} ${styles[String(meta.pm25Level) || 'good']}`}>
                <span className={styles.aqLabel}>초미세먼지</span>
                <span className={styles.aqValue}>{String(meta.pm25 || '18')}</span>
                <span className={styles.aqStatus}>{String(meta.pm25Status || '좋음')}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 지도 미리보기 */}
      <div className={styles.weatherMap}>
        <div className={styles.mapBackground}>
          <img
            src={`https://picsum.photos/seed/${query}weather/600/400`}
            alt="날씨 지도"
            className={styles.mapImage}
          />
          <div className={styles.mapOverlay} />
        </div>
        <div className={styles.mapWeatherOverlay}>
          <div className={styles.mapWeatherIcon}>
            {weatherIcons[String(meta.condition)] || '☀️'}
          </div>
          <div className={styles.mapTemp}>{String(meta.temperature || '20')}°</div>
        </div>
        <div className={styles.mapControls}>
          <button className={styles.mapControl}>위성</button>
          <button className={styles.mapControl}>레이더</button>
          <button className={styles.mapControl}>기온</button>
        </div>
      </div>

      {/* 주간 예보 */}
      {forecastItems.length > 0 && (
        <div className={styles.forecast}>
          <h3 className={styles.forecastTitle}>주간 예보</h3>
          <div className={styles.forecastList}>
            {forecastItems.map((item, index) => {
              const itemMeta = item.metadata || {};
              return (
                <div key={item.id || index} className={styles.forecastItem}>
                  <span className={styles.forecastDay}>{item.title}</span>
                  <span className={styles.forecastIcon}>
                    {weatherIcons[String(itemMeta.condition)] || '☀️'}
                  </span>
                  <span className={styles.forecastTemp}>
                    <span className={styles.tempHigh}>{String(itemMeta.high || '22')}°</span>
                    <span className={styles.tempLow}>{String(itemMeta.low || '15')}°</span>
                  </span>
                  <span className={styles.forecastRain}>
                    {String(itemMeta.precipitation || '0')}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 시간별 예보 */}
      {meta.hourlyForecast && Array.isArray(meta.hourlyForecast) && (
        <div className={styles.hourlyForecast}>
          <h3 className={styles.hourlyTitle}>시간별 예보</h3>
          <div className={styles.hourlyList}>
            {(meta.hourlyForecast as Array<{ time: string; temp: string; icon: string }>).map((hour, index) => (
              <div key={index} className={styles.hourlyItem}>
                <span className={styles.hourlyTime}>{hour.time}</span>
                <span className={styles.hourlyIcon}>{weatherIcons[hour.icon] || '☀️'}</span>
                <span className={styles.hourlyTemp}>{hour.temp}°</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
