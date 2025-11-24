# 이미지 검색 정책

## 감지 조건
- `disp-attr="IIM"` (이미지 컴포넌트) 존재
- 이미지 포함 아이템 6개 이상
- 쿼리에 이미지 관련 키워드 포함

## 데이터 추출
| 필드 | 설명 |
|------|------|
| imageUrl | 이미지 URL |
| thumbnailUrl | 썸네일 URL |
| title | 이미지 제목 |
| source | 출처 |
| width | 너비 |
| height | 높이 |

## 템플릿
- **메인**: `gallery`
- **컨트롤러**: `size-filter`, `color-filter`

## 예시 쿼리
| 쿼리 | 처리 |
|------|------|
| 고양이 사진 | gallery 템플릿 |
| 배경화면 이미지 | gallery 템플릿 |
