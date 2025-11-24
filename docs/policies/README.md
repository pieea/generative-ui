# 쿼리 타입별 템플릿 정책

## 정책 문서 목록

| 쿼리 타입 | 파일 | 템플릿 |
|-----------|------|--------|
| 쇼핑/상품 | [shopping.md](./shopping.md) | `shopping` |
| 환율 | [exchange-rate.md](./exchange-rate.md) | `exchange-rate` |
| 인물 | [people.md](./people.md) | `profile`, `hero`, `dual-profile` |
| 뉴스 | [news.md](./news.md) | `article`, `timeline` |
| 날씨 | [weather.md](./weather.md) | `weather` |
| 장소 | [location.md](./location.md) | `map` |
| 이미지 | [images.md](./images.md) | `gallery` |
| 일반 | [general.md](./general.md) | `card`, `hero` |

## 템플릿 선택 우선순위

```
1. 환율 (currencyCode 또는 환율 키워드)
2. 날씨 (condition 메타데이터)
3. 쇼핑 (price + rating)
4. 장소 (address)
5. 인물 (occupation/birthDate)
6. 뉴스 (timestamp + category)
7. 이미지 (6개 이상 이미지)
8. 일반 (기본값)
```

## 공통 규칙

### 쿼리 확장
복합 의도 쿼리는 이중 쿼리로 확장 (예: 인물+뉴스)

### 동명이인 처리
LLM 기반 일관성 검사로 동명이인 결과 제외

### 중복 제거
제목 기준 중복 제거 (소문자+trim 비교)
