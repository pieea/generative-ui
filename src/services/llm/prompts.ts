/**
 * LLM Prompt Templates
 */

/**
 * Generate person search specialized prompt
 */
export const generatePersonPrompt = (query: string): string => `
## 인물 검색 특별 지침
검색어 "${query}"는 인물 검색입니다. 다음을 수행하세요:
1. **첫 번째 항목으로 인물 프로필 카드를 생성**:
   - title: 인물 이름
   - category: "인물"
   - description: 직업/소속/대표작 요약
   - metadata에 occupation, organization 등 포함
2. 뉴스/기사에서 인물에 대한 최신 정보 추출
3. 인물과 직접 관련된 정보만 포함`;

/**
 * Generate event search specialized prompt
 */
export const generateEventPrompt = (query: string): string => `
## 축제/이벤트 검색 특별 지침
검색어 "${query}"는 축제/이벤트 검색입니다. 다음을 수행하세요:
1. **축제/행사 정보를 타임라인 형식으로 추출**:
   - title: 축제/행사 이름 (예: "2025 구미 라면축제")
   - category: "축제" 또는 "행사"
   - timestamp: 개최 기간 (예: "11.14~17", "2025.11.15~16")
   - description: 간단한 설명 또는 특징
   - metadata에 location(장소), source(출처) 포함
2. **날짜 정보가 있는 축제를 우선 추출**
3. 텍스트에서 축제명, 날짜, 장소를 정확히 파싱
4. 최대 8개까지 추출`;

/**
 * System prompt for data extraction
 */
export const DATA_EXTRACTION_SYSTEM_PROMPT = `검색 결과에서 추출한 텍스트를 분석하여 구조화된 데이터로 변환하세요.

반드시 아래 JSON 배열 형식으로만 응답하세요:
[
  {
    "title": "제목/이름 (필수)",
    "description": "설명 또는 부가정보",
    "url": "링크 URL ([링크URLs]에서 가장 관련있는 것)",
    "imageUrl": "이미지 URL ([이미지URLs]에서 가장 관련있는 것)",
    "category": "카테고리 (인물, 영화, 드라마, 뉴스, 상품 등)",
    "timestamp": "날짜 정보",
    "metadata": {
      "age": "나이 (예: 42세)",
      "birthDate": "출생일",
      "occupation": "직업 (예: 배우, 가수, 운동선수)",
      "organization": "소속사/팀",
      "spouse": "배우자",
      "source": "출처",
      "price": 가격(숫자),
      "address": "주소"
    }
  }
]

규칙:
- 최대 5개 항목만 추출 (축제/이벤트 검색은 최대 8개)
- **인물 검색인 경우**: 텍스트에서 나이, 직업, 소속, 배우자 등 인물 정보를 반드시 추출하고 첫 항목은 프로필
- **축제/이벤트 검색인 경우**: 축제명, 날짜(timestamp), 장소를 정확히 추출하고 날짜가 있는 항목 우선
- **[이미지URLs]에서 첫 번째 URL을 imageUrl로 사용**
- **[링크URLs]에서 가장 관련있는 URL을 url로 사용**
- 실제로 있는 정보만 포함 (없으면 필드 생략)
- 광고, 관련검색어 제외`;

/**
 * System prompt for intent analysis
 */
export const INTENT_ANALYSIS_SYSTEM_PROMPT = `검색 의도를 종합 분석하는 전문가입니다.

당신은 검색어와 검색 엔진의 실제 응답(disp-attr 코드 포함)을 분석하여 사용자의 진짜 의도를 파악합니다.

## disp-attr 코드 의미
- **PRF**: 인물 프로필
- **DNS**: 뉴스/기사
- **NSJ/SNY/0NS/0SC**: 쇼핑/상품
- **IIM**: 이미지
- **VOI**: 동영상
- **Z6T**: 환율 정보
- **3DV**: 국가 정보
- **TCS**: 축제/일정
- **GG2**: 장소/관광지
- **WMD**: 날씨 정보
- **TWA/TWD**: 웹문서 (일반)

## 분석 원칙
1. **검색어의 본질적 의도 파악**: "BTS 멤버" → 인물, "서울 날씨" → 날씨
2. **disp-attr의 우선순위 고려**: 상위 위치에 나타난 전문 컴포넌트(PRF, WMD, Z6T 등)는 높은 신뢰도
3. **쇼핑 컴포넌트의 과대평가 방지**: NSJ/SNY가 상위에 있어도 검색어가 쇼핑 의도가 아니면 무시
4. **종합 판단**: 검색어 + disp-attr 위치 + 컴포넌트 내용을 모두 고려

## 응답 형식
{"primaryIntent": "의도", "secondaryIntent": "보조의도 또는 null", "reasoning": "상세한 판단 근거"}

가능한 의도: people, news, products, images, videos, exchange, country, events, locations, weather, web, mixed`;

/**
 * Generate user prompt for data extraction
 */
export const generateDataExtractionPrompt = (
  query: string,
  rawContents: string
): string => `검색어: "${query}"

검색 결과 원본:
${rawContents}

위 텍스트에서 주요 검색 결과를 구조화된 데이터로 추출하세요.`;

/**
 * Generate user prompt for intent analysis
 */
export const generateIntentAnalysisPrompt = (
  query: string,
  componentSummary: string,
  dispAttrInfo?: string
): string => `검색어: "${query}"

## 검색 엔진 응답 (disp-attr 코드 포함)
${dispAttrInfo || '정보 없음'}

## 추출된 컴포넌트
${componentSummary}

위 정보를 종합하여 사용자의 진짜 검색 의도를 파악하세요.`;
