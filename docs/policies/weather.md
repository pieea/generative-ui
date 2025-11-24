# 날씨 검색 정책

## 감지 키워드
```
날씨, 기온, 온도, 비, 눈, 미세먼지, 자외선
```

## 감지 조건
- 메타데이터에 `condition` 존재
- 쿼리에 날씨 키워드 포함

## 데이터 추출
| 필드 | 설명 |
|------|------|
| location | 지역명 |
| condition | 날씨 상태 (맑음, 흐림 등) |
| temperature | 현재 기온 |
| high | 최고 기온 |
| low | 최저 기온 |
| humidity | 습도 |
| precipitation | 강수 확률 |

## 템플릿
- **메인**: `weather`
- **컨트롤러**: `date-range`, `location`

## 예시 쿼리
| 쿼리 | 처리 |
|------|------|
| 서울 날씨 | weather 템플릿 |
| 오늘 기온 | weather 템플릿 |
| 내일 비 | weather 템플릿 |
