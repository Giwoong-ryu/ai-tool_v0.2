# Search V2 API 스펙

Search V2의 FTS + pgvector 2단계 검색 API 명세서입니다.

## API 엔드포인트

### 검색 API

```
GET /api/search?q={query}&page={page}&size={size}&type={type}
```

#### 요청 파라미터

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|---------|------|------|--------|------|
| `q` | string | 선택 | - | 검색 키워드 (빈 값시 전체 조회) |
| `page` | number | 선택 | 1 | 페이지 번호 (1부터 시작) |
| `size` | number | 선택 | 30 | 페이지 크기 (최대 100) |
| `type` | string | 선택 | - | 아이템 타입 필터 (`tool`, `template`, `workflow`) |

#### 응답 형식

```typescript
interface SearchResponse {
  items: SearchItem[]
  pagination: {
    page: number
    size: number
    total: number
    pages: number
  }
  performance: {
    took_ms: number
    stages: {
      fts_ms: number
      vector_ms: number
      total_candidates: number
    }
  }
}

interface SearchItem {
  id: string
  type: 'tool' | 'template' | 'workflow'
  title: string
  summary: string
  tags: string[]
  body: Record<string, any>
  score: {
    fts_rank: number
    vector_similarity: number
    combined_score: number
  }
  created_at: string
  updated_at: string
}
```

#### 응답 예시

```json
{
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "type": "template",
      "title": "블로그 글 초안 만들기",
      "summary": "SEO 최적화된 블로그 글 구조 생성",
      "tags": ["blog", "writing", "seo", "content"],
      "body": {
        "fields": [
          {"name": "주제", "type": "text"},
          {"name": "키워드", "type": "text"},
          {"name": "톤", "type": "select"}
        ]
      },
      "score": {
        "fts_rank": 0.8,
        "vector_similarity": 0.92,
        "combined_score": 0.89
      },
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "size": 30,
    "total": 156,
    "pages": 6
  },
  "performance": {
    "took_ms": 248,
    "stages": {
      "fts_ms": 12,
      "vector_ms": 189,
      "total_candidates": 200
    }
  }
}
```

### 제안 API (Combobox용)

```
GET /api/search/suggestions?q={query}&limit={limit}
```

#### 요청 파라미터

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|---------|------|------|--------|------|
| `q` | string | 필수 | - | 검색 키워드 |
| `limit` | number | 선택 | 8 | 제안 개수 (최대 10) |

#### 응답 형식

```typescript
interface SuggestionsResponse {
  suggestions: Suggestion[]
  took_ms: number
}

interface Suggestion {
  id: string
  title: string
  type: 'tool' | 'template' | 'workflow'
  summary: string
  match_reason: 'title' | 'summary' | 'tags'
}
```

#### 응답 예시

```json
{
  "suggestions": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "블로그 글 초안 만들기",
      "type": "template",
      "summary": "SEO 최적화된 블로그 글 구조 생성",
      "match_reason": "title"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "title": "블로그 콘텐츠 전략",
      "type": "workflow", 
      "summary": "체계적인 블로그 운영 전략 수립",
      "match_reason": "tags"
    }
  ],
  "took_ms": 23
}
```

## 검색 알고리즘

### 2단계 하이브리드 검색

1. **1단계: Full-Text Search (FTS)**
   - PostgreSQL tsvector + GIN 인덱스 사용
   - `plainto_tsquery()` 함수로 쿼리 파싱
   - `ts_rank()` 함수로 관련성 점수 계산
   - 상위 N개 (기본 200개) 후보 추출

2. **2단계: Vector Similarity**
   - pgvector HNSW 인덱스 사용
   - 코사인 유사도 기반 재정렬
   - 1단계 후보군에서만 벡터 검색 수행
   - 최종 페이지네이션 적용

### 점수 계산

```sql
-- 통합 점수 = (FTS 점수 * 0.3) + (벡터 유사도 * 0.7)
combined_score = (ts_rank * 0.3) + (vector_similarity * 0.7)
```

### 성능 최적화

- **FTS 최적화**: GIN 인덱스, 적절한 tsvector 구성
- **벡터 최적화**: HNSW 인덱스, 배치 처리로 임베딩 생성
- **캐싱**: Redis를 통한 인기 검색어 결과 캐싱
- **페이지네이션**: OFFSET 대신 커서 기반 페이지네이션 고려

## 에러 응답

### 4xx 클라이언트 에러

```json
{
  "error": {
    "code": "INVALID_QUERY",
    "message": "검색어는 1-100자 사이여야 합니다",
    "details": {
      "field": "q",
      "received": "",
      "expected": "1-100 characters"
    }
  },
  "took_ms": 2
}
```

### 5xx 서버 에러

```json
{
  "error": {
    "code": "SEARCH_TIMEOUT",
    "message": "검색 시간이 초과되었습니다",
    "details": {
      "timeout_ms": 5000,
      "stage": "vector_search"
    }
  },
  "took_ms": 5001
}
```

### 에러 코드

| 코드 | HTTP | 설명 |
|------|------|------|
| `INVALID_QUERY` | 400 | 잘못된 검색어 형식 |
| `INVALID_PAGINATION` | 400 | 잘못된 페이지네이션 파라미터 |
| `RATE_LIMIT_EXCEEDED` | 429 | 요청 한도 초과 |
| `SEARCH_TIMEOUT` | 500 | 검색 시간 초과 |
| `DATABASE_ERROR` | 500 | 데이터베이스 연결 실패 |
| `EMBEDDING_SERVICE_ERROR` | 502 | 임베딩 서비스 오류 |

## 성능 목표

### 응답 시간 목표

| 시나리오 | P50 | P95 | P99 |
|---------|-----|-----|-----|
| FTS 전용 (벡터 없음) | 50ms | 150ms | 300ms |
| 하이브리드 검색 | 150ms | 300ms | 500ms |
| 제안 API | 20ms | 50ms | 100ms |

### 처리량 목표

- **RPS**: 500 requests/second (피크 시간)
- **동시 연결**: 1000 concurrent connections
- **캐시 히트율**: 70% 이상 (인기 검색어)

## 모니터링 메트릭

### 성능 메트릭

```typescript
interface PerformanceMetrics {
  // 응답 시간
  response_time_p50: number
  response_time_p95: number
  response_time_p99: number
  
  // 처리량
  requests_per_second: number
  concurrent_connections: number
  
  // 검색 품질
  zero_results_rate: number // 결과 없음 비율
  click_through_rate: number // 클릭률
  
  // 시스템 리소스
  cpu_usage: number
  memory_usage: number
  db_connection_pool: number
}
```

### 비즈니스 메트릭

```typescript
interface BusinessMetrics {
  // 검색 행동
  search_frequency: number // 검색 빈도
  popular_keywords: string[] // 인기 검색어
  search_session_duration: number // 검색 세션 지속 시간
  
  // 콘텐츠 인기도
  most_clicked_items: SearchItem[] // 가장 많이 클릭된 아이템
  conversion_rate: number // 검색 → 사용 전환율
}
```

## 캐싱 전략

### Redis 캐싱

```typescript
interface CacheConfig {
  // 검색 결과 캐싱
  search_results: {
    key_pattern: 'search:{query_hash}:{page}:{size}'
    ttl: 300 // 5분
    max_size: '1GB'
  }
  
  // 제안 캐싱
  suggestions: {
    key_pattern: 'suggest:{query_hash}'
    ttl: 600 // 10분
    max_size: '100MB'
  }
  
  // 인기 검색어 캐싱
  trending: {
    key_pattern: 'trending:keywords'
    ttl: 3600 // 1시간
    update_interval: 900 // 15분마다 갱신
  }
}
```

### 캐시 무효화

- **실시간 무효화**: ai_items 테이블 변경 시
- **주기적 무효화**: 매일 새벽 3시 전체 캐시 클리어
- **스마트 무효화**: 관련 태그/카테고리만 부분 무효화

## 보안 고려사항

### 입력 검증

```typescript
interface InputValidation {
  query: {
    min_length: 0
    max_length: 100
    allowed_chars: /^[\w\s가-힣-]+$/
    sql_injection_check: true
  }
  pagination: {
    page_min: 1
    page_max: 1000
    size_min: 1
    size_max: 100
  }
}
```

### Rate Limiting

```typescript
interface RateLimitConfig {
  // IP별 제한
  per_ip: {
    requests: 1000
    window: 3600 // 1시간
  }
  
  // 사용자별 제한 (인증된 경우)
  per_user: {
    requests: 5000
    window: 3600 // 1시간
  }
  
  // 특수 제한
  search_heavy_users: {
    requests: 100
    window: 60 // 1분
  }
}
```

---

> 다음 파일: `03-search-queries.sql` (실제 SQL 쿼리 예시)