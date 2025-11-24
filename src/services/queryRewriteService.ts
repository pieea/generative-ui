import OpenAI from 'openai';

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 검색 의도 타입
export type SearchIntent = 'products' | 'locations' | 'weather' | 'news' | 'people' | 'images' | 'events' | 'documents' | 'mixed';

// 확장된 쿼리 인터페이스
export interface ExpandedQuery {
  query: string;
  intent: SearchIntent;
  description: string;
}

// Rewrite 결과 인터페이스
export interface RewriteResult {
  originalQuery: string;
  expandedQueries: ExpandedQuery[];
  shouldExpand: boolean;
}

// LLM 기반 검색어 rewrite
export async function rewriteQuery(query: string): Promise<RewriteResult> {
  if (!process.env.OPENAI_API_KEY) {
    console.log('[Query Rewrite] No API key, returning original query');
    return {
      originalQuery: query,
      expandedQueries: [{ query, intent: 'mixed', description: '원본 검색어' }],
      shouldExpand: false,
    };
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `당신은 검색어 분석 및 확장 전문가입니다.
주어진 검색어를 분석하여 사용자의 검색 의도를 파악하고, 필요한 경우 여러 검색 쿼리로 확장합니다.

## 분석 규칙

1. 단일 의도 검색어: 하나의 명확한 의도만 있는 경우
   - "가성비 노트북" → products 의도만 존재
   - "서울 날씨" → weather 의도만 존재

2. 복합 의도 검색어: 여러 의도가 결합된 경우 확장 필요
   - "이병헌 대종상" → "이병헌"(people) + "이병헌 대종상"(news)
   - "손흥민 토트넘" → "손흥민"(people) + "손흥민 토트넘 경기"(news)
   - "아이폰 16 출시" → "아이폰 16"(products) + "아이폰 16 출시 뉴스"(news)
   - "피렌체 예지원" → "예지원"(people) + "피렌체 예지원"(news) [장소+인물 패턴]
   - "하와이 손예진" → "손예진"(people) + "하와이 손예진"(news)
   - "명세빈 생활고" → "명세빈"(people) + "명세빈 생활고"(news) [인물+이슈 패턴]

3. 인물 이름 감지 규칙:
   - 한글 2~4글자 이름 (예: 예지원, 손흥민, 이병헌)
   - 장소/지역명 + 인물 조합 시 인물 쿼리 분리
   - 인물 + 이슈/사건 조합 시 인물 쿼리 분리

4. 의도 타입:
   - products: 상품, 제품, 쇼핑
   - locations: 장소, 맛집, 카페, 관광지
   - weather: 날씨, 기온, 예보
   - news: 뉴스, 기사, 시사, 이벤트 소식
   - people: 인물, 유명인 프로필
   - images: 이미지, 사진
   - events: 행사, 일정, 축제
   - documents: 문서, 자료
   - mixed: 일반 검색

## 응답 형식 (반드시 JSON)

{
  "shouldExpand": true/false,
  "queries": [
    {
      "query": "확장된 검색어",
      "intent": "의도 타입",
      "description": "이 검색어의 목적 설명"
    }
  ]
}

단일 의도인 경우 shouldExpand: false로 하고 queries에 원본 쿼리와 의도를 반환하세요.
복합 의도인 경우 shouldExpand: true로 하고 확장된 쿼리들을 반환하세요.

**중요: 복합 의도인 경우 원본 쿼리는 반드시 포함되어야 합니다!**
예: "피렌체 예지원" → ["예지원"(people), "피렌체 예지원"(news)] ← 원본 포함
예: "명세빈 생활고" → ["명세빈"(people), "명세빈 생활고"(news)] ← 원본 포함`,
        },
        {
          role: 'user',
          content: query,
        },
      ],
      temperature: 0.2,
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response');
    }

    console.log('[Query Rewrite] LLM Response:', content);

    // JSON 파싱
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const expandedQueries: ExpandedQuery[] = parsed.queries.map((q: any) => ({
      query: q.query,
      intent: q.intent as SearchIntent,
      description: q.description,
    }));

    console.log(`[Query Rewrite] "${query}" -> ${expandedQueries.length} queries, expand: ${parsed.shouldExpand}`);

    return {
      originalQuery: query,
      expandedQueries,
      shouldExpand: parsed.shouldExpand,
    };
  } catch (error) {
    console.error('[Query Rewrite] Error:', error);
    return {
      originalQuery: query,
      expandedQueries: [{ query, intent: 'mixed', description: '원본 검색어' }],
      shouldExpand: false,
    };
  }
}
