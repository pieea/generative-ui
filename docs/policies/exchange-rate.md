# 환율 검색 정책

## 감지 키워드
```
환율, 달러, 엔화, 유로, 위안, 환전, usd, jpy, eur, cny
```

## 감지 조건
- `disp-attr="Z6T"` (환율 컴포넌트) 존재
- 메타데이터에 `currencyCode` 존재
- 쿼리에 환율 키워드 포함

## 데이터 추출
다음 검색 HTML 내 `nationMap['CODE']` 객체에서 추출:

| 필드 | 키 | 설명 |
|------|-----|------|
| currencyCode | CODE | USD, JPY, EUR 등 |
| currencyName | country + unit | 미국 달러 |
| baseRate | rate | 매매기준율 |
| change | change | 전일대비 |
| changePercent | changeRate | 등락률 |
| cashBuy | cashBuy | 현찰 살 때 |
| cashSell | cashSell | 현찰 팔 때 |

## 주요 통화
```
USD, JPY(100엔), EUR, CNY, GBP, AUD
```

## 템플릿
- **메인**: `exchange-rate`
- **컨트롤러**: `date-range`, `filter`

## 특이사항
- JPY는 100엔 기준으로 표시
- 환율 관련 쿼리만 fallback 적용 (다른 쿼리에 영향 없음)

## 예시 쿼리
| 쿼리 | 처리 |
|------|------|
| 환율 조회 | exchange-rate 템플릿 |
| 달러 환율 | exchange-rate 템플릿 |
| 엔화 환전 | exchange-rate 템플릿 |
