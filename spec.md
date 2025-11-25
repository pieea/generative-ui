# 개요
https://research.google/blog/generative-ui-a-rich-custom-visual-interactive-user-experience-for-any-prompt/ 와 유사하게 구현
검색어와 검색 결과의 특성을 분석하여 가장 적합한 UI를 구성해 주는 것을 1차 목표로 한다.
사용자의 요구사항에 따라 UI를 재구성 할 수 있는 기능을 제공한다.

# 상세 구현
- 검색어를 입력받아 검색 엔진에 날린다(이 부분은 향후 변경 가능). LLM이 검색어 rewrite를 한다.
- 검색어를 확장할 필요가 있을 경우 각각에 대해서 호출하고 합친 결과를 리턴한다(e.g. 이병헌 대종상 -> 이병헌(인물), 이병헌 대종상(뉴스)). 해당 부분은 검색어 rewrite에서 수행한다.
- 검색어 rewrite 영역은 디버그 용으로 노출해줘.
- 검색어와 검색결과에 따라서 내부적으로 보유하고 있는 UI 템플릿 중 적합한 형태를 판단한다. 필요에 따라서는 메인 / 컨트롤러를 합치거나 둘 이상의 메인 템플릿을 조합한다.
- 사용자가 추가적인 피드백을 요구하는 경우(e.g. 날짜로 필터링 하고 싶어, 화면을 크게 보고 싶어) 해당 요구사항을 반영한 형태로 UI를 재구성한다.
- 요청 패턴에 따른 템플릿 결과는 캐싱을 한다

# 의도 해석
- 의도가 명확하면 각 의도에 맞는 disp-attr 값을 가지는 영역을 참고해서 화면 구성. 의도가 명확하지 않으면 상위 disp-attr를 참고해서 의도 해석 후에 화면 구성

# 검색엔진 활용
- URL: https://search.daum.net/search?w=tot&nil_mtopsearch=btn&DA=YZR&q={query}
- class="g_comp" 항목을 필터링 해서 결과로 사용
- 관련 검색어를 제외하고 1~2번째로 나오는 결과가 해당 키워드에 대한 주요 검색 결과
- 주요 검색 결과를 사용해서 검색어의 의도를 파악하고 템플릿에 대해 결정한다.

# 기술 스펙
- Next.js 15 활용

# 세부 정책

## 1. 쿼리 리라이트 (Query Rewrite)

### 이중 쿼리 확장 규칙
- 복합 의도 검색어는 여러 쿼리로 확장하여 병렬 검색 후 결과 병합
- **원본 쿼리는 반드시 포함**

### 확장 패턴 예시
| 원본 쿼리 | 확장 결과 |
|-----------|-----------|
| 이병헌 대종상 | "이병헌"(people) + "이병헌 대종상"(news) |
| 손흥민 토트넘 | "손흥민"(people) + "손흥민 토트넘"(news) |
| 피렌체 예지원 | "예지원"(people) + "피렌체 예지원"(news) |
| 명세빈 생활고 | "명세빈"(people) + "명세빈 생활고"(news) |
| 아이폰 16 출시 | "아이폰 16"(products) + "아이폰 16 출시"(news) |

### 인물 이름 감지 규칙
- 한글 2~4글자 이름 패턴 (예: 예지원, 손흥민, 이병헌)
- 장소/지역명 + 인물 조합 시 인물 쿼리 분리
- 인물 + 이슈/사건 조합 시 인물 쿼리 분리

## 2. 검색엔진 파싱 (다음 검색)

### 2.1. 컴포넌트 타입 감지

#### disp-attr 매핑 테이블
`disp-attr` 속성 기반으로 컴포넌트 타입 판별:
| disp-attr | 타입 | 설명 | 우선순위 |
|-----------|------|------|----------|
| Z6T | exchange | 환율 정보 | 0 (절대 최우선) |
| 3DV | country | 국가 정보 | 1 (절대 우선) |
| PRF | people | 인물 프로필 | 2 (절대 우선) |
| TCS | events | 축제/일정 통합 컬렉션 | 3 (절대 우선) |
| **GG2** | **locations** | **장소/관광지 정보** | **10 (위치 기반)** |
| IIM | images | 이미지 | 10 (위치 기반) |
| SNP | products | 쇼핑하우 | 10 (위치 기반) |
| SNY | products | 쇼핑 | 10 (위치 기반) |
| NSJ | products | 쇼핑 (새 형식) | 10 (위치 기반) |
| 0SC | products | 쇼핑 컬렉션 | 10 (위치 기반) |
| 0NS | products | 네이버쇼핑 광고 | 10 (위치 기반) |
| DNS | news | 뉴스 | 10 (위치 기반) |
| VOI | videos | 동영상 | 10 (위치 기반) |
| TWA, TWD | web | 통합웹/웹문서 | - |
| 0NL | ads | 파워링크 광고 | - (무시) |

#### 우선순위 정책
**절대 우선순위 (priority < 10):**
- 위치에 관계없이 무조건 해당 의도로 결정
- 환율(Z6T), 국가(3DV), 인물(PRF), 축제(TCS)

**위치 기반 우선순위 (priority >= 10):**
- 상위 3개 위치(position 0-2) 내에서만 의도 결정에 사용
- 장소(GG2), 이미지(IIM), 쇼핑(SNP/SNY/NSJ/0SC), 뉴스(DNS), 동영상(VOI)

#### 정렬 규칙
1. 절대 우선순위 컴포넌트가 있으면 무조건 선택
2. 위치 기반 컴포넌트는 상위 3개 내에서 위치순으로 정렬
3. 상위 3개 밖의 위치 기반 컴포넌트는 무시

### 2.2. 쿼리 패턴 기반 특별 처리

#### 이미지 쿼리
**키워드**: 사진, 이미지, 화보, 그림, 포토, 움짤, gif, 사진첩
- 쿼리에 이미지 키워드가 포함되고 IIM이 상위 3개 내에 있으면 IIM 우선
- NSJ 등 쇼핑 광고보다 이미지 의도를 우선 적용

**예시:**
| 쿼리 | disp-attr 순서 | 결과 |
|------|---------------|------|
| 아이유 사진 | [0]NSJ, [1]IIM | images (IIM 우선) |
| 노트북 추천 | [0]NSJ, [1]IIM | products (NSJ 우선) |

#### 장소/관광지 쿼리
**키워드**: 관광지, 여행지, 맛집, 카페, 음식점, 레스토랑, 호텔, 숙소, 명소, 가볼만한곳, 데이트, 데이트코스, 장소, 위치, 근처

**패턴**: {지역명} + {명사}
- 지역명: 서울, 부산, 대구, 인천, 광주, 대전, 울산, 세종, 제주, 경기, 강원, 충북, 충남, 전북, 전남, 경북, 경남

- 쿼리 패턴이 감지되면 GG2 disp-attr 우선 검색
- 신뢰도: 키워드 매칭 시 HIGH, 패턴 매칭 시 MEDIUM

**예시:**
| 쿼리 | disp-attr 순서 | 결과 |
|------|---------------|------|
| 서울 관광지 | [0]GG2 | locations (GG2 우선) |
| 부산 맛집 | [0]GG2, [1]TWA | locations (GG2 우선) |
| 강남 카페 | [0]GG2 | locations (GG2 우선) |

### 2.3. 약한 신호 폴백 로직
**약한 신호 정의:**
- web/ads/mixed 의도이면서 position >= 3인 경우
- topAnalysis가 없는 경우

**폴백 동작:**
- quickIntent (extractComponents 기반 분석)가 강한 의도(products, news, people 등)면 quickIntent 사용
- 이를 통해 disp-attr가 웹문서만 감지해도 실제 쇼핑 컴포넌트가 있으면 products로 판단

**강한 의도:**
- products, news, people, images, exchange, country, events, locations, weather

### 2.4. 전용 검색 URL

#### 이미지 전용 검색
- URL: `https://search.daum.net/search?w=img&nil_search=btn&DA=NTB&enc=utf8&q={query}`
- IIM이 상위에 감지되거나 이미지 키워드가 있으면 전용 URL 사용
- JavaScript `initialData` 배열에서 이미지 데이터 추출
- 정규식 패턴으로 unquoted JavaScript 객체 리터럴 파싱
- 최대 20개 이미지 추출

### 2.5. 타입별 파싱 셀렉터

#### 뉴스 (DNS)
- 뉴스 목록: `.c-list-basic > li[data-docid]`
- 뉴스 제목: `.item-title .tit-g`, `.tit-g.clamp-g`
- 뉴스 내용: `.conts-desc`, `.item-contents p`
- 언론사: `.c-tit-doc .tit_item .txt_info`
- 시간: `.gem-subinfo .txt_info`
- 이미지: `img[data-original-src]` 속성 우선

#### 인물 (PRF)
- PRF 섹션은 JavaScript로 동적 렌더링되어 SSR로 직접 파싱 불가
- LLM을 활용하여 뉴스/웹 컨텐츠에서 인물 정보 추출
- 인물 검색 시 4개 컴포넌트까지 분석 (일반 검색은 2개)
- 메타데이터: `occupation`, `birthDate`, `organization`, `education`

#### 쇼핑 (SNP/SNY/NSJ/0SC)
**쇼핑하우 (SNP):**
- 상품 목록: `.list_shopping > li`, `.item_shopping`
- 제목: `.tit.clamp-g`, `.wrap_tit strong.tit`
- 가격: `.item_price .txt_price`, `em.txt_price`
- 이미지: `.wrap_thumb img`
- 평점: `.ico-rate`
- 리뷰 수: `.txt_subinfo`
- 배송 정보: `.txt_delivery .txt_price`

**네이버쇼핑 (0NS, NSJ):**
- 상품 목록: `li` > `.c-item-content`
- 제목: `.tit-g.clamp-g`, `.tit_item`
- 가격: `.txt_price`
- 이미지: `img[data-original-src]` (lazy loading 대응)
- 판매처: `.txt_mallname`, `.txt_mall`

#### 환율 (Z6T)
- 전체 HTML에서 JavaScript `nationMap['USD']` 패턴 추출
- 주요 통화: USD, JPY, EUR, CNY, GBP, AUD
- 메타데이터:
  - `currencyCode`: 통화 코드
  - `currencyName`: 통화 이름
  - `baseRate`: 매매기준율
  - `cashBuy`: 현찰 살 때
  - `cashSell`: 현찰 팔 때
  - `sendRate`: 송금 보낼 때
  - `receiveRate`: 송금 받을 때
  - `change`: 전일대비 변동
  - `changePercent`: 등락률
  - `trend`: up/down/unchanged
- JPY는 100엔 기준으로 표시

#### 국가 정보 (3DV)
- 국가명: `.tit-g.clamp-g`
- 영문명/지역: `.sub_header .txt-split`, `.conts-combo .txt-split`
- 기본 정보: `dl.conts-richx` > `dt`/`dd` 쌍
  - 수도, 인구, 면적, GDP, 언어, 통화, 종교, 기후, 안전
- 실시간 정보: `.c-carousel .c-item-content`
  - 현지시간, 통화(환율), 날씨
- 국기 이미지: `.badge_img img[data-original-src]`
- 메타데이터:
  - `countryCode`: 국가 코드 (ISO 2자리)
  - `capital`: 수도
  - `population`: 인구
  - `area`: 면적
  - `gdp`: GDP
  - `language`: 언어
  - `currency`: 통화
  - `liveInfo`: 실시간 정보 (현지시간, 환율, 날씨)

#### 축제/이벤트 (TCS)
- 항목 목록: `.c-item-content`, `.c-list-basic > li`, `article`
- 제목: `.tit-g.clamp-g`, `.item-title .tit-g`
- 설명: `.conts-desc`, `.item-contents p`
- 날짜: `.gem-subinfo .txt_info`, `.txt_date`, 또는 텍스트에서 날짜 패턴 추출 (`\d{1,2}\.\d{1,2}~\d{1,2}`, `\d{4}\.\d{1,2}\.\d{1,2}`)
- 장소: `.txt_place`, `.place`, `.location`
- 축제 키워드: 축제, 페스티벌, 행사, 공연, 전시, 박람회, 마라톤, 콘서트, 불꽃
- 최대 8개 추출, 축제 관련 항목 우선 정렬

## 3. LLM 데이터 추출

### 3.1. 인물 검색 특화 프롬프트
인물 검색으로 판단되면:
1. 첫 번째 항목으로 인물 프로필 카드 생성
2. category: "인물"
3. metadata에 occupation, organization 등 포함
4. 뉴스/기사에서 인물 관련 최신 정보 추출
5. 텍스트에서 나이, 직업, 소속, 배우자 등 정보 추출

**인물 검색 판단 조건:**
- `disp-attr="PRF"` 컴포넌트 존재
- 쿼리 리라이트에서 `people` 의도 감지
- 한글 이름 패턴 (`/[가-힣]{2,4}$/`)

**LLM 프롬프트 추가 지침:**
- 최대 5개 항목 추출
- 인물 검색인 경우 첫 항목은 반드시 프로필 카드
- birthDate, occupation, organization, spouse 등 메타데이터 추출
- 이미지URLs에서 첫 번째 URL을 imageUrl로 사용
- 링크URLs에서 가장 관련있는 URL을 url로 사용

### 3.2. 축제/이벤트 검색 특화 프롬프트
축제/이벤트 검색으로 판단되면:
1. 축제/행사 정보를 타임라인 형식으로 추출
2. category: "축제" 또는 "행사"
3. timestamp: 개최 기간 (예: "11.14~17", "2025.11.15~16")
4. metadata에 location(장소), source(출처) 포함

**축제/이벤트 검색 판단 조건:**
- `disp-attr="TCS"` 컴포넌트 존재
- 쿼리 리라이트에서 `events` 의도 감지
- 축제 키워드 포함: 축제, 페스티벌, 일정, 행사, 이벤트, 공연, 전시, 박람회

**LLM 프롬프트 추가 지침:**
- 최대 8개 항목 추출 (일반 검색은 5개)
- 날짜 정보가 있는 축제를 우선 추출
- 텍스트에서 축제명, 날짜, 장소를 정확히 파싱
- 축제 키워드가 포함된 항목 우선

## 4. 템플릿 선택 로직

### 4.1. data-dc 기반 의도 우선 사용
- searchService에서 반환하는 `primaryIntent` (disp-attr 기반) 우선 사용
- LLM 템플릿 선택 시 data-dc 기반 의도를 힌트로 제공

### 4.2. resultType → 템플릿 매핑
| resultType | 템플릿 | 설명 |
|-----------|--------|------|
| exchange | exchange | 환율 정보 (Z6T) |
| country | country | 국가 정보 (3DV) |
| events | timeline | 축제/이벤트 (TCS) |
| products | shopping | 쇼핑 상품 |
| images | gallery | 이미지 갤러리 |
| people | 아래 참조 | 인물 정보 분기 |
| news | article | 뉴스 기사 |
| weather | weather | 날씨 정보 |
| locations | map | 장소/지도 |
| mixed | hero/card | 혼합 결과 |

### 4.3. 메타데이터 기반 판단 (폴백)
| 조건 | 템플릿 | resultType |
|------|--------|------------|
| currencyCode 존재 | exchange | exchange |
| countryCode + capital 존재 | country | country |
| condition 존재 | weather | weather |
| price + rating 존재 | shopping | products |
| address 존재 | map | locations |
| occupation/birthDate 존재 | 아래 참조 | people |
| body 존재 | article | news |

### 4.4. 인물 정보 템플릿 분기
| 조건 | 템플릿 |
|------|--------|
| 인물(1건) + 뉴스(N건) | hero (복합 레이아웃) |
| 인물만 1건 | profile |
| 인물 여러 명 | grid |

### 4.5. 기본값
| 조건 | 템플릿 |
|------|--------|
| 이미지 포함 + 6개 이상 | gallery |
| 3개 이상 | hero |
| 그 외 | card |

## 5. 디버그 UI

### 표시 정보
- 쿼리 확장 여부: `[이중쿼리]` 또는 `[단일쿼리]`
- 확장된 쿼리 목록: `"쿼리"(의도)` 형식
- 컴포넌트 분석 결과: `[타입]제목(건수)`
- LLM 추출 건수
- 최종 선택 템플릿

### 다음 검색 링크
- 이중 쿼리: 각 쿼리별 다음 검색 링크 제공
- 단일 쿼리: 원본 쿼리 다음 검색 링크 제공
- 새 탭에서 열림 (`target="_blank"`)

## 6. 결과 병합 정책

### 일관성 검사 (LLM 기반 동명이인 방지)
- 이중 쿼리 병합 전 **LLM이 동일인 여부 판단**
- `people` 의도 쿼리의 경우:
  1. 원 쿼리 검색 결과 요약 추출
  2. 확장 쿼리에서 추출된 인물 정보 (이름, 직업, 소속)
  3. LLM에게 동일인 여부 질의
  4. 다른 사람으로 판단 시 **확장 쿼리 결과 제거**

#### LLM 판단 기준
- 직업/분야가 다르면 동명이인 (예: 가수 vs 바둑기사)
- 소속이 완전히 다르면 동명이인
- 맥락이 전혀 다르면 동명이인

| 예시 | 원 쿼리 결과 | 확장 쿼리 결과 | LLM 판정 |
|------|-------------|---------------|----------|
| 안성준 농심배 | 안성준 (바둑 기사) | 안성준 (가수) | `{"isSamePerson": false, "reason": "직업이 다름"}` |
| 이병헌 대종상 | 이병헌 (배우) | 이병헌 (배우) | `{"isSamePerson": true, "reason": "동일인"}` |

### 중복 제거
- 제목 기준 중복 제거 (소문자 + trim 후 비교)
- LLM 추출 아이템 우선 유지

### 아이템 태깅
- `querySource`: 어떤 쿼리에서 추출되었는지
- `queryIntent`: 해당 쿼리의 의도
- `extractedByLLM`: LLM 추출 여부
- `sourceIntent`: 원본 컴포넌트 타입

## 7. 의도 결정 알고리즘 (analyzeDaumSearch)

### 7.1. 처리 흐름
```
1. fetchDaumSearchHtml() - 일반 검색 결과 HTML 가져오기
2. analyzeTopComponents(html, query) - disp-attr 기반 의도 분석
   ├─ 상위 5개 g_comp에서 disp-attr 추출
   ├─ 우선순위 정렬 (절대 우선순위 > 위치 기반)
   └─ 이미지 쿼리 특별 처리 (키워드 감지 시 IIM 우선)
3. 이미지 의도인 경우 fetchDaumImageSearchHtml() - 전용 이미지 검색
4. extractComponents(html) - cheerio 기반 컴포넌트 추출
   ├─ 환율 데이터 추출 (nationMap 파싱)
   ├─ 축제/이벤트 추출 (tcsColl)
   └─ 일반 g_comp 컴포넌트 추출
5. quickIntent 계산 - extractComponents 결과 기반 빠른 의도 추정
6. extractStructuredDataWithLLM() - LLM 기반 데이터 구조화
7. 최종 의도 결정:
   ├─ topAnalysis 신호가 강하면 (절대 우선순위 또는 상위 3개 내) → topAnalysis 사용
   ├─ topAnalysis 신호가 약하고 (web/ads at position >= 3) quickIntent가 강하면 → quickIntent 사용
   └─ 그 외 → topAnalysis 또는 quickIntent 폴백
```

### 7.2. 의도 결정 우선순위
```
1순위: 절대 우선순위 disp-attr (Z6T, 3DV, PRF, TCS)
2순위: 이미지 쿼리 키워드 감지 + IIM 상위 3개 내
3순위: 위치 기반 disp-attr 상위 3개 내 (IIM, SNP/NSJ/0SC, DNS, VOI)
4순위: quickIntent (extractComponents 기반)
5순위: 폴백 (첫 번째 컴포넌트 타입)
```

### 7.3. 컴포넌트 우선순위 정렬
```javascript
// 환율/국가 컴포넌트를 맨 앞에 배치
const exchangeComps = components.filter(c => c.type === 'exchange');
const countryComps = components.filter(c => c.type === 'country');
const otherComps = components.filter(c => c.type !== 'exchange' && c.type !== 'country');

// 나머지는 우선순위로 정렬
const priorityOrder = {
  'exchange': 0,   // 환율 최우선
  'country': 1,    // 국가 정보
  'products': 2,   // 쇼핑/상품
  'events': 3,     // 축제/이벤트
  'people': 4,
  'news': 5,
  ...
};

const sortedComponents = [...exchangeComps, ...countryComps, ...sortedOthers];
```

## 8. 구현된 템플릿

### 8.1. 환율 템플릿 (ExchangeRateTemplate)
- 카드 그리드 레이아웃
- 통화별 국기 이모지 표시
- 매매기준율, 현찰 매매, 송금 환율 표시
- 전일대비 변동 및 등락률 (▲/▼)
- 관련 뉴스 섹션
- 파일: `src/templates/ExchangeRateTemplate.tsx`

### 8.2. 국가 정보 템플릿 (CountryTemplate)
- 국기 이미지 + 국가명 헤더
- 기본 정보 테이블 (수도, 인구, 면적, GDP, 언어 등)
- 실시간 정보 섹션 (현지시간, 환율, 날씨)
- 설명 텍스트
- 파일: `src/templates/CountryTemplate.tsx`

### 8.3. 쇼핑 템플릿 (기존)
- 상품 그리드
- 가격, 평점, 리뷰 수 표시
- 필터/정렬 컨트롤러

### 8.4. 갤러리 템플릿 (기존)
- 이미지 그리드
- 라이트박스 뷰어

## 9. 캐싱 정책
- 인메모리 Map 기반 캐시
- TTL: 10분 (600초)
- 키: 검색 쿼리 (원본 쿼리)
- 값: 전체 SearchResult 객체
- 캐시 히트 시 로그: `[Cache] HIT for "{query}" (TTL: {remaining}s)`
- 캐시 미스 시 로그: `[Cache] MISS for "{query}"`

## 10. 로깅 규칙

### 주요 로그 접두사
- `[Cache]`: 캐시 히트/미스 정보
- `[Query Rewrite]`: 쿼리 리라이트 결과
- `[Search Service]`: 검색 서비스 처리 상태
- `[Daum Search]`: 다음 검색 분석 상태
- `[Daum Image Search]`: 이미지 검색 처리
- `[Exchange Rate]`: 환율 데이터 추출
- `[Country Extract]`: 국가 정보 추출
- `[LLM Extract]`: LLM 데이터 추출
- `[LLM Template]`: LLM 템플릿 선택
- `[UI Generator]`: 최종 UI 생성
- `[Consistency Check]`: 동명이인 일관성 검사
- `[Merge]`: 검색 결과 병합

### 로그 예시
```
[Cache] MISS for "달러 환율"
[Query Rewrite] "달러 환율" -> 1 queries, expand: false
[Daum Search] Analyzing query: 달러 환율
[Daum Search] Top disp-attr components: [0] Z6T
[Daum Search] Primary intent: exchange (Z6T 컴포넌트가 절대 우선순위로 exchange 의도 결정)
[Exchange Rate] Extracted 6 currencies from HTML
[Search Service] Final resultType: exchange (from: data-dc)
[UI Generator] LLM Decision: [data-dc: exchange] exchange 컴포넌트가 감지되어 exchange 템플릿 선택
```
