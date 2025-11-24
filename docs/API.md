# Generative UI API 문서

검색 결과에 따라 동적으로 UI를 생성하는 Generative UI 시스템의 API 명세서입니다.

---

## 목차

1. [개요](#개요)
2. [Base URL](#base-url)
3. [API 엔드포인트](#api-엔드포인트)
   - [검색 API](#1-검색-api)
   - [피드백 API](#2-피드백-api)
4. [데이터 타입](#데이터-타입)
5. [템플릿 시스템](#템플릿-시스템)
6. [에러 처리](#에러-처리)

---

## 개요

Generative UI API는 검색어를 입력받아 검색 결과의 특성을 분석하고, 가장 적합한 UI 템플릿과 레이아웃을 자동으로 결정하여 반환합니다. 사용자의 피드백을 통해 UI를 동적으로 재구성할 수 있습니다.

## Base URL

```
http://localhost:3000/api
```

---

## API 엔드포인트

### 1. 검색 API

검색어를 받아 검색 결과와 최적화된 UI 상태를 반환합니다.

#### Request

```http
GET /api/search?q={검색어}
```

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `q` | string | O | 검색어 |

#### Response

```json
{
  "uiState": {
    "mainTemplate": "hero",
    "secondaryTemplate": null,
    "controllers": ["filter", "sort", "date-range", "pagination"],
    "data": {
      "query": "AI 기술 뉴스",
      "items": [...],
      "totalCount": 10,
      "resultType": "news",
      "metadata": {
        "source": "mock",
        "searchTime": 234.5
      }
    },
    "layout": {
      "columns": 3,
      "showImages": true,
      "compact": false,
      "itemsPerPage": 6
    },
    "filters": null
  },
  "cacheHit": false
}
```

#### 예시

```bash
curl -X GET "http://localhost:3000/api/search?q=노트북%20추천"
```

---

### 2. 피드백 API

사용자의 자연어 피드백을 받아 UI를 재구성합니다.

#### Request

```http
POST /api/feedback
Content-Type: application/json
```

```json
{
  "currentState": { ... },
  "feedback": "캐러셀로 보여줘"
}
```

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `currentState` | UIState | O | 현재 UI 상태 객체 |
| `feedback` | string | O | 사용자의 피드백 텍스트 |

#### Response

```json
{
  "uiState": {
    "mainTemplate": "carousel",
    "controllers": [...],
    "data": {...},
    "layout": {...},
    "filters": {...}
  }
}
```

#### 지원되는 피드백 명령어

| 카테고리 | 명령어 예시 | 동작 |
|---------|-----------|------|
| **템플릿 변경** | "리스트로 보여줘", "목록 형태로" | `list` 템플릿으로 전환 |
| | "그리드로 보여줘", "타일 형태로" | `grid` 템플릿으로 전환 |
| | "카드로 보여줘" | `card` 템플릿으로 전환 |
| | "캐러셀로 보여줘", "슬라이드로" | `carousel` 템플릿으로 전환 |
| | "갤러리로 보여줘", "사진첩으로" | `gallery` 템플릿으로 전환 |
| | "타임라인으로", "연대기로" | `timeline` 템플릿으로 전환 |
| | "큰 이미지로", "히어로로", "메인" | `hero` 템플릿으로 전환 |
| **레이아웃** | "크게 보고 싶어", "확대" | 확장 레이아웃 적용 |
| | "작게 보고 싶어", "축소", "compact" | 압축 레이아웃 적용 |
| **이미지** | "이미지 숨기고 싶어" | 이미지 비표시 |
| | "이미지 보여줘" | 이미지 표시 |
| **정렬** | "최신순으로", "최근 것부터" | 날짜 내림차순 정렬 |
| | "오래된 순으로" | 날짜 오름차순 정렬 |
| | "이름순으로" | 이름 오름차순 정렬 |
| **필터** | "날짜로 필터링", "기간 설정" | 날짜 범위 컨트롤러 추가 |

---

## 데이터 타입

### UIState

UI의 전체 상태를 나타내는 객체입니다.

```typescript
interface UIState {
  mainTemplate: TemplateType;      // 메인 템플릿
  secondaryTemplate?: TemplateType; // 보조 템플릿 (선택)
  controllers: ControllerType[];    // 활성화된 컨트롤러 목록
  data: SearchResult;               // 검색 결과 데이터
  layout: LayoutConfig;             // 레이아웃 설정
  filters?: FilterState;            // 필터 상태
}
```

### TemplateType

지원되는 UI 템플릿 타입입니다.

```typescript
type TemplateType =
  | 'list'       // 기본 리스트
  | 'grid'       // 그리드 갤러리
  | 'card'       // 카드 레이아웃
  | 'carousel'   // 캐러셀/슬라이더
  | 'hero'       // 히어로 (큰 이미지 + 사이드바)
  | 'gallery'    // 갤러리 (메이슨리)
  | 'timeline'   // 타임라인
  | 'table'      // 테이블
  | 'comparison' // 비교
  | 'detail'     // 상세 정보
  | 'map'        // 지도 기반
  | 'chart';     // 차트/그래프
```

### ResultType

검색 결과의 유형입니다. UI 템플릿 자동 선택에 사용됩니다.

```typescript
type ResultType =
  | 'news'       // 뉴스 기사 → hero
  | 'products'   // 상품 → carousel/grid
  | 'images'     // 이미지 → gallery
  | 'locations'  // 장소/위치 → card
  | 'events'     // 이벤트/일정 → timeline
  | 'people'     // 인물 → grid/card
  | 'documents'  // 문서 → list
  | 'mixed';     // 혼합 결과 → hero
```

### SearchResultItem

개별 검색 결과 항목입니다.

```typescript
interface SearchResultItem {
  id: string;                        // 고유 식별자
  title: string;                     // 제목
  description?: string;              // 설명
  url?: string;                      // 링크 URL
  imageUrl?: string;                 // 이미지 URL
  metadata?: Record<string, unknown>; // 추가 메타데이터
  timestamp?: string;                // 시간 정보
  category?: string;                 // 카테고리
  tags?: string[];                   // 태그 목록
}
```

### LayoutConfig

레이아웃 설정입니다.

```typescript
interface LayoutConfig {
  columns?: number;        // 컬럼 수
  showImages?: boolean;    // 이미지 표시 여부
  compact?: boolean;       // 압축 모드
  itemsPerPage?: number;   // 페이지당 항목 수
  expanded?: boolean;      // 확장 모드
}
```

### FilterState

필터링 상태입니다.

```typescript
interface FilterState {
  dateRange?: {
    start?: string;        // 시작 날짜 (YYYY-MM-DD)
    end?: string;          // 종료 날짜 (YYYY-MM-DD)
  };
  categories?: string[];   // 선택된 카테고리
  sortBy?: string;         // 정렬 기준 (date, name 등)
  sortOrder?: 'asc' | 'desc'; // 정렬 순서
}
```

### ControllerType

UI 컨트롤러 타입입니다.

```typescript
type ControllerType =
  | 'filter'        // 필터링 컨트롤
  | 'sort'          // 정렬 컨트롤
  | 'pagination'    // 페이지네이션
  | 'date-range'    // 날짜 범위 선택
  | 'view-toggle'   // 뷰 전환 토글
  | 'search-refine'; // 검색어 세분화
```

---

## 템플릿 시스템

### 자동 템플릿 선택 규칙

검색 결과 타입과 항목 수에 따라 최적의 템플릿이 자동 선택됩니다.

| 결과 타입 | 조건 | 선택 템플릿 |
|----------|------|------------|
| `news` | 3개 이상 | `hero` |
| `products` | 6개 이하 | `carousel` |
| `products` | 6개 초과 | `grid` |
| `images` | 이미지 있음 | `gallery` |
| `events` | - | `timeline` |
| `people` | 4개 이하 | `card` |
| `people` | 4개 초과 | `grid` |
| `documents` | - | `list` |
| `mixed` | 3개 이상 | `hero` |

### 템플릿별 특징

| 템플릿 | 설명 | 적합한 용도 |
|--------|------|------------|
| `list` | 세로 목록 형태 | 문서, 검색 결과 |
| `grid` | 그리드 배열 | 상품 목록, 인물 |
| `card` | 카드 형태 | 장소, 소수 인물 |
| `carousel` | 좌우 슬라이더 | 상품 상세 보기 |
| `hero` | 메인 + 사이드바 | 뉴스, 주요 콘텐츠 |
| `gallery` | 메이슨리 갤러리 | 이미지 검색 |
| `timeline` | 연대순 타임라인 | 이벤트, 일정 |

---

## 에러 처리

### 에러 응답 형식

```json
{
  "error": "에러 메시지"
}
```

### HTTP 상태 코드

| 코드 | 설명 |
|------|------|
| `200` | 성공 |
| `400` | 잘못된 요청 (파라미터 누락 등) |
| `500` | 서버 내부 오류 |

### 에러 예시

#### 검색어 누락 (400)

```json
{
  "error": "검색어가 필요합니다."
}
```

#### 피드백 파라미터 누락 (400)

```json
{
  "error": "현재 UI 상태와 피드백이 필요합니다."
}
```

#### 서버 오류 (500)

```json
{
  "error": "검색 중 오류가 발생했습니다."
}
```

---

## 캐싱

동일한 검색 패턴과 결과 타입에 대한 UI 설정은 30분간 캐싱됩니다.

- 캐시 키: `{정규화된_쿼리}:{결과타입}`
- TTL: 30분
- 캐시 히트 시 `cacheHit: true` 반환

---

## 사용 예시

### 1. 기본 검색

```javascript
const response = await fetch('/api/search?q=맛집 추천');
const { uiState } = await response.json();

console.log(uiState.mainTemplate); // "card" (locations 타입)
```

### 2. UI 피드백

```javascript
const response = await fetch('/api/feedback', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    currentState: uiState,
    feedback: '그리드로 보여줘'
  })
});
const { uiState: updatedState } = await response.json();

console.log(updatedState.mainTemplate); // "grid"
```

### 3. React Hook 사용

```typescript
import { useGenerativeUI } from '@/hooks/useGenerativeUI';

function SearchComponent() {
  const { uiState, isLoading, search, updateUI } = useGenerativeUI();

  const handleSearch = () => search('노트북 추천');
  const handleFeedback = () => updateUI('노트북 추천', '캐러셀로 보여줘');

  return (
    // UI 렌더링
  );
}
```
