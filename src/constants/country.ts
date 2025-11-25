/**
 * Country-related constants
 */

/**
 * Country name to ISO code mapping
 */
export const COUNTRY_CODES: Readonly<Record<string, string>> = {
  '미국': 'US',
  '미합중국': 'US',
  'United States': 'US',
  '일본': 'JP',
  '영국': 'GB',
  '독일': 'DE',
  '프랑스': 'FR',
  '중국': 'CN',
  '호주': 'AU',
  '캐나다': 'CA',
  '이탈리아': 'IT',
  '스페인': 'ES',
  '브라질': 'BR',
  '인도': 'IN',
  '러시아': 'RU',
  '대한민국': 'KR',
  '한국': 'KR',
  '멕시코': 'MX',
  '태국': 'TH',
  '베트남': 'VN',
  '필리핀': 'PH',
  '싱가포르': 'SG',
  '말레이시아': 'MY',
  '네덜란드': 'NL',
  '스위스': 'CH',
  '벨기에': 'BE',
  '스웨덴': 'SE',
  '노르웨이': 'NO',
  '덴마크': 'DK',
  '핀란드': 'FI',
  '폴란드': 'PL',
  '체코': 'CZ',
  '오스트리아': 'AT',
  '그리스': 'GR',
  '포르투갈': 'PT',
} as const;

/**
 * Country metadata field mappings (Korean to English)
 */
export const COUNTRY_FIELD_MAP: Readonly<Record<string, string>> = {
  '수도': 'capital',
  '인구': 'population',
  '면적': 'area',
  'GDP': 'gdp',
  '언어': 'language',
  '통화': 'currency',
  '종교': 'religion',
  '기후': 'climate',
  '안전': 'safetyInfo',
} as const;

/**
 * Get country code from name
 */
export const getCountryCode = (name: string): string | undefined =>
  COUNTRY_CODES[name];

/**
 * Get metadata field key
 */
export const getMetadataField = (koreanLabel: string): string | undefined =>
  COUNTRY_FIELD_MAP[koreanLabel];
