# Daum Search Service Refactoring

## 개요

기존 1759줄의 모놀리식 `daumSearchService.ts` 파일을 Python 고급 개발자 수준의 구조화된 코드로 리팩토링했습니다.

## 새로운 디렉토리 구조

```
src/
├── constants/           # 상수 및 설정
│   ├── dispAttr.ts     # disp-attr 매핑 및 우선순위
│   ├── selectors.ts    # CSS 셀렉터 정의
│   ├── currency.ts     # 통화 관련 상수
│   ├── country.ts      # 국가 코드 매핑
│   ├── urls.ts         # URL 빌더 함수
│   └── index.ts        # 통합 export
│
├── services/
│   ├── analyzers/      # 의도 분석 로직
│   │   ├── intentAnalyzer.ts  # disp-attr 기반 의도 분석
│   │   └── index.ts
│   │
│   ├── parsers/        # 데이터 파싱 로직
│   │   ├── baseParser.ts      # 공통 파싱 유틸리티
│   │   ├── newsParser.ts      # 뉴스 파싱
│   │   ├── shoppingParser.ts  # 쇼핑 파싱 (SNP + NSJ)
│   │   ├── exchangeParser.ts  # 환율 파싱
│   │   └── index.ts
│   │
│   ├── llm/           # LLM 관련 서비스
│   │   ├── prompts.ts        # LLM 프롬프트 템플릿
│   │   ├── llmService.ts     # OpenAI API 호출
│   │   └── index.ts
│   │
│   ├── fetchers/      # HTTP 요청 처리
│   │   ├── httpFetcher.ts    # 일반 HTTP 요청
│   │   ├── daumFetcher.ts    # 다음 검색 전용
│   │   └── index.ts
│   │
│   ├── extractors/    # 컴포넌트 추출 로직
│   │   ├── componentExtractor.ts  # 메인 추출 로직
│   │   ├── typeExtractors.ts      # 타입별 추출기
│   │   ├── imageExtractor.ts      # 이미지 추출
│   │   ├── queryAnalyzer.ts       # 쿼리 분석
│   │   └── index.ts
│   │
│   ├── utils/         # 유틸리티 함수
│   │   ├── itemMerger.ts     # 검색 결과 병합
│   │   └── index.ts
│   │
│   ├── daumSearchService.ts            # 기존 파일 (보존)
│   └── daumSearchService.refactored.ts # 리팩토링 버전
```

## 주요 개선사항

### 1. 관심사의 분리 (Separation of Concerns)

- **Constants**: 모든 상수를 별도 모듈로 분리
- **Parsers**: 데이터 파싱 로직을 타입별로 분리
- **Analyzers**: 의도 분석 로직 독립화
- **LLM**: OpenAI 관련 로직 캡슐화
- **Fetchers**: HTTP 요청 로직 분리
- **Extractors**: HTML 컴포넌트 추출 로직 분리
- **Utils**: 재사용 가능한 유틸리티 함수

### 2. 타입 안전성 (Type Safety)

```typescript
// 기존: 매직 넘버와 문자열
if (priority < 10) { ... }

// 개선: 상수와 헬퍼 함수
import { isAbsolutePriority, ABSOLUTE_PRIORITY_THRESHOLD } from '@/constants';
if (isAbsolutePriority(priority)) { ... }
```

### 3. 단일 책임 원칙 (Single Responsibility)

각 모듈은 하나의 명확한 책임만 가집니다:

- `newsParser.ts`: 뉴스 데이터만 파싱
- `intentAnalyzer.ts`: 의도 분석만 수행
- `httpFetcher.ts`: HTTP 요청만 처리

### 4. 재사용성 (Reusability)

```typescript
// 공통 파싱 로직 재사용
import { extractText, extractImageUrl, parseNumber } from './baseParser';

// 공통 URL 빌더 재사용
import { buildDaumSearchUrl, buildDaumImageSearchUrl } from '@/constants';
```

### 5. 테스트 용이성 (Testability)

각 모듈이 독립적이어서 단위 테스트 작성이 쉽습니다:

```typescript
// 예: intentAnalyzer.ts 테스트
import { analyzeTopComponents, isImageQuery } from '@/services/analyzers';

test('이미지 쿼리 감지', () => {
  expect(isImageQuery('강아지 사진')).toBe(true);
  expect(isImageQuery('강아지 정보')).toBe(false);
});
```

### 6. 유지보수성 (Maintainability)

- 기능 추가 시 관련 모듈만 수정
- 버그 수정 시 영향 범위가 명확
- 코드 리뷰가 용이 (작은 파일 단위)

## 마이그레이션 방법

### 1. 점진적 마이그레이션 (권장)

```typescript
// 기존 코드는 그대로 유지하면서 새 모듈을 import하여 사용
import { analyzeTopComponents } from '@/services/analyzers';
import { parseNewsItems } from '@/services/parsers';
```

### 2. 전체 교체

```bash
# 기존 파일 백업
mv src/services/daumSearchService.ts src/services/daumSearchService.old.ts

# 리팩토링 버전을 메인으로
mv src/services/daumSearchService.refactored.ts src/services/daumSearchService.ts
```

## 모듈별 상세 설명

### Constants

모든 하드코딩된 값을 상수로 분리:

```typescript
// dispAttr.ts
export const DISP_ATTR_MAP: Readonly<Record<string, DispAttrConfig>> = {
  Z6T: { intent: 'exchange', priority: 0, description: '환율 정보' },
  // ...
};

export const isAbsolutePriority = (priority: number): boolean =>
  priority < ABSOLUTE_PRIORITY_THRESHOLD;
```

### Parsers

타입별 파싱 로직:

```typescript
// newsParser.ts
export const parseNewsItems = (
  $comp: cheerio.Cheerio<AnyNode>,
  $: cheerio.CheerioAPI,
  options: NewsParserOptions = {}
): SearchResultItem[] => {
  // 뉴스 파싱 로직
};

// shoppingParser.ts
export const parseShoppingItems = (
  $comp: cheerio.Cheerio<AnyNode>,
  $: cheerio.CheerioAPI,
  options: ShoppingParserOptions = {}
): SearchResultItem[] => {
  // 쇼핑 파싱 로직 (SNP + NSJ)
};
```

### Analyzers

의도 분석 로직:

```typescript
// intentAnalyzer.ts
export const analyzeTopComponents = (
  html: string,
  query?: string
): TopComponentAnalysis | null => {
  // disp-attr 기반 분석
};

export const determineFinalIntent = (
  topAnalysis: TopComponentAnalysis | null,
  quickIntent: IntentType | null
): FinalIntentResult => {
  // 최종 의도 결정 (weak signal fallback 포함)
};
```

### LLM Service

OpenAI API 호출 로직:

```typescript
// llmService.ts
export const extractStructuredData = async (
  options: LLMExtractionOptions
): Promise<SearchResultItem[]> => {
  // LLM 기반 데이터 추출
};

export const analyzeIntent = async (
  options: LLMIntentAnalysisOptions
): Promise<IntentAnalysisResult> => {
  // LLM 기반 의도 분석
};
```

### Fetchers

HTTP 요청 처리:

```typescript
// daumFetcher.ts
export const fetchDaumSearch = async (
  query: string,
  options: DaumFetchOptions = {}
): Promise<string> => {
  // 다음 검색 요청
};

export const fetchDaumImageSearch = async (
  query: string,
  options: DaumFetchOptions = {}
): Promise<string> => {
  // 다음 이미지 검색 요청
};
```

### Extractors

컴포넌트 추출 로직:

```typescript
// componentExtractor.ts
export const extractComponents = (
  html: string,
  query: string
): DaumSearchComponent[] => {
  // HTML에서 컴포넌트 추출
};

// imageExtractor.ts
export const extractImageItems = (html: string): SearchResultItem[] => {
  // 이미지 추출
};
```

## 성능 영향

- **번들 크기**: 트리 쉐이킹으로 인해 사용하지 않는 모듈은 번들에서 제외
- **로딩 시간**: 코드 스플리팅 가능 (동적 import 사용 시)
- **런타임 성능**: 기존과 동일 (로직 변경 없음)

## 향후 개선 방향

1. **단위 테스트 추가**: 각 모듈별 테스트 작성
2. **에러 핸들링 강화**: 각 모듈에 적절한 에러 처리
3. **로깅 개선**: 구조화된 로깅 시스템
4. **캐싱 추가**: 자주 사용되는 데이터 캐싱
5. **타입 개선**: 더 엄격한 타입 정의

## 참고

- 기존 파일(`daumSearchService.ts`)은 보존되어 있습니다
- 리팩토링 버전(`daumSearchService.refactored.ts`)을 테스트 후 교체하세요
- 모든 기존 기능은 그대로 유지됩니다
