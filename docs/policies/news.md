# 뉴스 검색 정책

## 감지 조건
- `disp-attr="DNS"` (뉴스 컴포넌트) 존재
- 메타데이터에 `timestamp` + `category` 동시 존재
- 쿼리에 시사/이슈 키워드 포함

## 데이터 추출
| 필드 | 셀렉터 |
|------|--------|
| title | `.item-title .tit-g` |
| description | `.conts-desc` |
| source | `.c-tit-doc .txt_info` |
| timestamp | `.gem-subinfo .txt_info` |
| imageUrl | `img[data-original-src]` |
| url | `a[href]` |

## 템플릿
- **메인**: `article` (기사 본문 있을 때) 또는 `timeline` (목록)
- **컨트롤러**: `date-range`, `source-filter`

## 인물+뉴스 복합
인물과 함께 뉴스가 나오면:
- 인물 1명: `hero` (인물 히어로 + 뉴스 목록)
- 인물 2명: `dual-profile`

## 예시 쿼리
| 쿼리 | 처리 |
|------|------|
| 오늘 뉴스 | timeline 템플릿 |
| 이병헌 대종상 | hero (인물+뉴스) |
| 경제 뉴스 | article 또는 timeline |
