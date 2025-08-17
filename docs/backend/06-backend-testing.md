# Search V2 백엔드 테스트 및 벤치마크

Search V2 백엔드 시스템의 종합적인 테스트 및 성능 벤치마크 가이드입니다.

## 테스트 전략 개요

### 테스트 피라미드
1. **단위 테스트 (70%)**: 개별 함수 및 모듈 테스트
2. **통합 테스트 (20%)**: API 엔드포인트 및 데이터베이스 연동 테스트  
3. **E2E 테스트 (10%)**: 전체 검색 플로우 테스트

### 테스트 환경 구성
- **개발 환경**: 로컬 PostgreSQL + Redis
- **CI 환경**: Docker 컨테이너 기반 테스트
- **스테이징 환경**: 프로덕션과 동일한 구성

## 단위 테스트

### 테스트 설정

```typescript
// tests/setup.ts
import { Pool } from 'pg'
import { Redis } from 'ioredis'
import { config } from 'dotenv'

// 테스트 환경 변수 로드
config({ path: '.env.test' })

// 테스트 데이터베이스 설정
export const testPool = new Pool({
  host: process.env.TEST_DB_HOST || 'localhost',
  port: parseInt(process.env.TEST_DB_PORT || '5433'),
  database: process.env.TEST_DB_NAME || 'ai_tools_test',
  user: process.env.TEST_DB_USER || 'postgres',
  password: process.env.TEST_DB_PASSWORD || 'test123',
  max: 5
})

export const testRedis = new Redis({
  host: process.env.TEST_REDIS_HOST || 'localhost',
  port: parseInt(process.env.TEST_REDIS_PORT || '6380'),
  db: 1 // 별도 DB 사용
})

// 테스트 데이터 정리
export async function cleanupTestData() {
  await testPool.query('TRUNCATE ai_items CASCADE')
  await testRedis.flushdb()
}

// 샘플 테스트 데이터
export const sampleItems = [
  {
    id: '550e8400-e29b-41d4-a716-446655440000',
    type: 'template',
    title: '블로그 글 초안 만들기',
    summary: 'SEO 최적화된 블로그 글 구조 생성',
    tags: ['blog', 'writing', 'seo'],
    body: { category: 'writing' }
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    type: 'tool',
    title: 'ChatGPT',
    summary: 'OpenAI의 대화형 AI 어시스턴트',
    tags: ['ai', 'chatbot', 'openai'],
    body: { category: 'ai-chat' }
  }
]
```

### 검색 서비스 단위 테스트

```typescript
// tests/unit/searchService.test.ts
import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { SearchService } from '../../src/services/SearchService'
import { testPool, testRedis, cleanupTestData, sampleItems } from '../setup'

describe('SearchService', () => {
  let searchService: SearchService

  beforeEach(async () => {
    await cleanupTestData()
    searchService = new SearchService(testPool, testRedis)
    
    // 테스트 데이터 삽입
    for (const item of sampleItems) {
      await testPool.query(
        'INSERT INTO ai_items (id, type, title, summary, tags, body) VALUES ($1, $2, $3, $4, $5, $6)',
        [item.id, item.type, item.title, item.summary, item.tags, JSON.stringify(item.body)]
      )
    }
  })

  afterEach(async () => {
    await cleanupTestData()
  })

  describe('search', () => {
    test('should return results for valid query', async () => {
      const result = await searchService.search({
        q: '블로그',
        page: 1,
        size: 10
      })

      expect(result.items).toHaveLength(1)
      expect(result.items[0].title).toContain('블로그')
      expect(result.pagination.total).toBe(1)
      expect(result.performance.took_ms).toBeGreaterThan(0)
    })

    test('should return all items when no query provided', async () => {
      const result = await searchService.search({
        page: 1,
        size: 10
      })

      expect(result.items).toHaveLength(2)
      expect(result.pagination.total).toBe(2)
    })

    test('should filter by type', async () => {
      const result = await searchService.search({
        type: 'template',
        page: 1,
        size: 10
      })

      expect(result.items).toHaveLength(1)
      expect(result.items[0].type).toBe('template')
    })

    test('should handle pagination correctly', async () => {
      const page1 = await searchService.search({
        page: 1,
        size: 1
      })

      const page2 = await searchService.search({
        page: 2,
        size: 1
      })

      expect(page1.items).toHaveLength(1)
      expect(page2.items).toHaveLength(1)
      expect(page1.items[0].id).not.toBe(page2.items[0].id)
      expect(page1.pagination.pages).toBe(2)
    })

    test('should validate search parameters', async () => {
      await expect(searchService.search({
        q: 'a'.repeat(101), // 너무 긴 쿼리
        page: 1,
        size: 10
      })).rejects.toThrow('검색어는 1-100자 사이여야 합니다')

      await expect(searchService.search({
        page: 0, // 잘못된 페이지
        size: 10
      })).rejects.toThrow()

      await expect(searchService.search({
        page: 1,
        size: 101 // 너무 큰 페이지 크기
      })).rejects.toThrow()
    })
  })

  describe('getSuggestions', () => {
    test('should return suggestions for partial query', async () => {
      const result = await searchService.getSuggestions('블로', 5)

      expect(result.suggestions).toHaveLength(1)
      expect(result.suggestions[0].title).toContain('블로그')
      expect(result.suggestions[0].match_reason).toBe('title')
    })

    test('should limit suggestions count', async () => {
      const result = await searchService.getSuggestions('a', 1)

      expect(result.suggestions.length).toBeLessThanOrEqual(1)
    })

    test('should return empty for very short queries', async () => {
      const result = await searchService.getSuggestions('', 5)

      expect(result.suggestions).toHaveLength(0)
    })
  })

  describe('caching', () => {
    test('should cache search results', async () => {
      const params = { q: 'test', page: 1, size: 10 }
      
      // 첫 번째 요청
      const start1 = Date.now()
      const result1 = await searchService.search(params)
      const time1 = Date.now() - start1

      // 두 번째 요청 (캐시에서)
      const start2 = Date.now()
      const result2 = await searchService.search(params)
      const time2 = Date.now() - start2

      expect(result1.items).toEqual(result2.items)
      expect(time2).toBeLessThan(time1 / 2) // 캐시가 더 빨라야 함
    })
  })
})
```

### 임베딩 배치 처리 테스트

```typescript
// tests/unit/embeddingBatch.test.ts
import { describe, test, expect, beforeEach, vi } from 'vitest'
import { EmbeddingBatchProcessor } from '../../scripts/embedding-batch'
import { testPool, testRedis, cleanupTestData } from '../setup'

// OpenAI API 모킹
const mockOpenAI = {
  embeddings: {
    create: vi.fn()
  }
}

describe('EmbeddingBatchProcessor', () => {
  let processor: EmbeddingBatchProcessor

  beforeEach(async () => {
    await cleanupTestData()
    processor = new EmbeddingBatchProcessor(testPool, mockOpenAI as any, testRedis, {
      batchSize: 2,
      maxRetries: 2,
      delayBetweenBatches: 100,
      model: 'text-embedding-ada-002',
      maxTokens: 8000
    })

    // 테스트 아이템 삽입 (임베딩 없음)
    await testPool.query(`
      INSERT INTO ai_items (type, title, summary, tags, body) VALUES 
      ('tool', 'Test Tool 1', 'Description 1', ARRAY['test'], '{}'),
      ('template', 'Test Template 1', 'Description 2', ARRAY['test'], '{}'),
      ('workflow', 'Test Workflow 1', 'Description 3', ARRAY['test'], '{}')
    `)
  })

  test('should process pending items in batches', async () => {
    // OpenAI API 모킹
    mockOpenAI.embeddings.create.mockResolvedValue({
      data: [
        { embedding: new Array(1536).fill(0.1) },
        { embedding: new Array(1536).fill(0.2) }
      ]
    })

    const result = await processor.processAllPendingItems()

    expect(result.succeeded).toBe(3)
    expect(result.failed).toBe(0)
    expect(mockOpenAI.embeddings.create).toHaveBeenCalledTimes(2) // 3개 아이템, 배치 크기 2

    // DB에 임베딩이 저장되었는지 확인
    const embeddedItems = await testPool.query(
      'SELECT COUNT(*) as count FROM ai_items WHERE embedding IS NOT NULL'
    )
    expect(parseInt(embeddedItems.rows[0].count)).toBe(3)
  })

  test('should handle API failures with retry', async () => {
    mockOpenAI.embeddings.create
      .mockRejectedValueOnce(new Error('API Error'))
      .mockResolvedValue({
        data: [{ embedding: new Array(1536).fill(0.1) }]
      })

    const result = await processor.processAllPendingItems()

    expect(result.succeeded).toBeGreaterThan(0)
    expect(mockOpenAI.embeddings.create).toHaveBeenCalledTimes(4) // 재시도 포함
  })

  test('should skip items with too many tokens', async () => {
    // 매우 긴 텍스트를 가진 아이템 추가
    await testPool.query(`
      INSERT INTO ai_items (type, title, summary, tags, body) VALUES 
      ('tool', '${'very long text '.repeat(1000)}', 'Description', ARRAY['test'], '{}')
    `)

    const result = await processor.processAllPendingItems()

    expect(result.skipped).toBeGreaterThan(0)
  })

  test('should track progress correctly', async () => {
    const stats = await processor.getProgressStats()

    expect(stats.total_items).toBe(3)
    expect(stats.embedded_items).toBe(0)
    expect(stats.progress_percent).toBe(0)
  })
})
```

## 통합 테스트

### API 엔드포인트 테스트

```typescript
// tests/integration/searchAPI.test.ts
import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import { app } from '../../src/app' // Express 앱
import { testPool, testRedis, cleanupTestData, sampleItems } from '../setup'

describe('Search API Integration', () => {
  beforeAll(async () => {
    // 테스트 환경 설정
  })

  afterAll(async () => {
    await testPool.end()
    await testRedis.quit()
  })

  beforeEach(async () => {
    await cleanupTestData()
    
    // 테스트 데이터 삽입
    for (const item of sampleItems) {
      await testPool.query(
        'INSERT INTO ai_items (id, type, title, summary, tags, body) VALUES ($1, $2, $3, $4, $5, $6)',
        [item.id, item.type, item.title, item.summary, item.tags, JSON.stringify(item.body)]
      )
    }
  })

  describe('GET /api/search', () => {
    test('should return search results', async () => {
      const response = await request(app)
        .get('/api/search')
        .query({ q: '블로그', page: 1, size: 10 })
        .expect(200)

      expect(response.body.items).toHaveLength(1)
      expect(response.body.items[0].title).toContain('블로그')
      expect(response.body.pagination.total).toBe(1)
      expect(response.body.performance.took_ms).toBeGreaterThan(0)
    })

    test('should handle empty query', async () => {
      const response = await request(app)
        .get('/api/search')
        .query({ page: 1, size: 10 })
        .expect(200)

      expect(response.body.items).toHaveLength(2)
      expect(response.body.pagination.total).toBe(2)
    })

    test('should validate query parameters', async () => {
      await request(app)
        .get('/api/search')
        .query({ q: 'a'.repeat(101) })
        .expect(400)

      await request(app)
        .get('/api/search')
        .query({ page: 0 })
        .expect(400)

      await request(app)
        .get('/api/search')
        .query({ size: 101 })
        .expect(400)

      await request(app)
        .get('/api/search')
        .query({ type: 'invalid' })
        .expect(400)
    })

    test('should apply rate limiting', async () => {
      const requests = Array(10).fill(null).map(() =>
        request(app)
          .get('/api/search')
          .query({ q: 'test' })
      )

      const responses = await Promise.all(requests)
      
      // 대부분은 성공해야 하지만, 일부는 rate limit에 걸릴 수 있음
      const successCount = responses.filter(r => r.status === 200).length
      expect(successCount).toBeGreaterThan(0)
    })

    test('should return proper error format', async () => {
      const response = await request(app)
        .get('/api/search')
        .query({ q: 'a'.repeat(101) })
        .expect(400)

      expect(response.body.error).toBeDefined()
      expect(response.body.error.code).toBe('INVALID_QUERY')
      expect(response.body.error.message).toContain('검색어는')
    })
  })

  describe('GET /api/search/suggestions', () => {
    test('should return suggestions', async () => {
      const response = await request(app)
        .get('/api/search/suggestions')
        .query({ q: '블로', limit: 5 })
        .expect(200)

      expect(response.body.suggestions).toHaveLength(1)
      expect(response.body.suggestions[0].title).toContain('블로그')
      expect(response.body.took_ms).toBeGreaterThan(0)
    })

    test('should limit suggestions count', async () => {
      const response = await request(app)
        .get('/api/search/suggestions')
        .query({ q: 'test', limit: 1 })
        .expect(200)

      expect(response.body.suggestions.length).toBeLessThanOrEqual(1)
    })

    test('should require query parameter', async () => {
      await request(app)
        .get('/api/search/suggestions')
        .expect(400)
    })
  })

  describe('HEAD /api/search', () => {
    test('should return health status', async () => {
      await request(app)
        .head('/api/search')
        .expect(200)
    })
  })

  describe('DELETE /api/search (dev only)', () => {
    test('should clear cache in development', async () => {
      process.env.NODE_ENV = 'development'
      
      await request(app)
        .delete('/api/search')
        .query({ pattern: 'search:*' })
        .expect(200)
    })

    test('should reject in production', async () => {
      process.env.NODE_ENV = 'production'
      
      await request(app)
        .delete('/api/search')
        .expect(403)
    })
  })
})
```

### 데이터베이스 통합 테스트

```typescript
// tests/integration/database.test.ts
import { describe, test, expect, beforeEach } from 'vitest'
import { testPool, cleanupTestData } from '../setup'

describe('Database Integration', () => {
  beforeEach(async () => {
    await cleanupTestData()
  })

  test('should create and query items with FTS', async () => {
    // 아이템 삽입
    await testPool.query(`
      INSERT INTO ai_items (type, title, summary, tags, body) VALUES 
      ('tool', 'ChatGPT Tool', 'AI 대화 도구', ARRAY['ai', 'chat'], '{}'),
      ('template', 'Blog Template', '블로그 템플릿', ARRAY['blog', 'writing'], '{}')
    `)

    // FTS 검색
    const result = await testPool.query(`
      SELECT title, ts_rank(tsv, plainto_tsquery('simple', '블로그')) as rank
      FROM ai_items
      WHERE tsv @@ plainto_tsquery('simple', '블로그')
      ORDER BY rank DESC
    `)

    expect(result.rows).toHaveLength(1)
    expect(result.rows[0].title).toBe('Blog Template')
    expect(result.rows[0].rank).toBeGreaterThan(0)
  })

  test('should handle vector operations when extension available', async () => {
    // pgvector 확장 확인
    const extensionCheck = await testPool.query(`
      SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'vector') as has_vector
    `)

    if (extensionCheck.rows[0].has_vector) {
      // 벡터 임베딩 테스트
      await testPool.query(`
        INSERT INTO ai_items (type, title, summary, tags, body, embedding) VALUES 
        ('tool', 'Test Tool', 'Test description', ARRAY['test'], '{}', $1::vector)
      `, [JSON.stringify(new Array(1536).fill(0.1))])

      const vectorResult = await testPool.query(`
        SELECT title, 1 - (embedding <-> $1::vector) as similarity
        FROM ai_items
        WHERE embedding IS NOT NULL
        ORDER BY similarity DESC
        LIMIT 1
      `, [JSON.stringify(new Array(1536).fill(0.1))])

      expect(vectorResult.rows).toHaveLength(1)
      expect(vectorResult.rows[0].similarity).toBeCloseTo(1.0, 1)
    }
  })

  test('should update generated tsvector column automatically', async () => {
    // 아이템 삽입
    const insertResult = await testPool.query(`
      INSERT INTO ai_items (type, title, summary, tags, body) VALUES 
      ('tool', 'Test Tool', 'Test description', ARRAY['test', 'automation'], '{}')
      RETURNING id
    `)
    const itemId = insertResult.rows[0].id

    // tsvector가 자동 생성되었는지 확인
    const tsvResult = await testPool.query(`
      SELECT tsv FROM ai_items WHERE id = $1
    `, [itemId])

    expect(tsvResult.rows[0].tsv).toBeTruthy()

    // 제목 업데이트 시 tsvector도 업데이트되는지 확인
    await testPool.query(`
      UPDATE ai_items SET title = 'Updated Tool' WHERE id = $1
    `, [itemId])

    const updatedTsvResult = await testPool.query(`
      SELECT tsv FROM ai_items WHERE id = $1
    `, [itemId])

    expect(updatedTsvResult.rows[0].tsv).not.toBe(tsvResult.rows[0].tsv)
  })

  test('should enforce constraints', async () => {
    // 제목 길이 제약
    await expect(testPool.query(`
      INSERT INTO ai_items (type, title, summary, tags, body) VALUES 
      ('tool', '${'a'.repeat(201)}', 'Description', ARRAY['test'], '{}')
    `)).rejects.toThrow()

    // 타입 제약
    await expect(testPool.query(`
      INSERT INTO ai_items (type, title, summary, tags, body) VALUES 
      ('invalid', 'Test Tool', 'Description', ARRAY['test'], '{}')
    `)).rejects.toThrow()

    // 태그 개수 제약
    await expect(testPool.query(`
      INSERT INTO ai_items (type, title, summary, tags, body) VALUES 
      ('tool', 'Test Tool', 'Description', $1, '{}')
    `, [new Array(21).fill('tag')])).rejects.toThrow()
  })
})
```

## 성능 벤치마크

### 부하 테스트 스크립트

```typescript
// tests/performance/loadTest.ts
import { performance } from 'perf_hooks'
import { Pool } from 'pg'
import { Redis } from 'ioredis'
import { SearchService } from '../../src/services/SearchService'

interface BenchmarkResult {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  averageResponseTime: number
  p95ResponseTime: number
  p99ResponseTime: number
  requestsPerSecond: number
  errorRate: number
}

class SearchBenchmark {
  private searchService: SearchService
  private responseTimes: number[] = []

  constructor(pool: Pool, redis: Redis) {
    this.searchService = new SearchService(pool, redis)
  }

  async runBenchmark(options: {
    duration: number // 초
    concurrency: number
    queries: string[]
  }): Promise<BenchmarkResult> {
    const { duration, concurrency, queries } = options
    const endTime = Date.now() + (duration * 1000)
    const promises: Promise<void>[] = []

    console.log(`🚀 부하 테스트 시작: ${concurrency}개 동시 연결, ${duration}초 동안`)

    // 동시 요청 실행
    for (let i = 0; i < concurrency; i++) {
      promises.push(this.runWorker(endTime, queries))
    }

    await Promise.all(promises)

    return this.calculateResults(duration)
  }

  private async runWorker(endTime: number, queries: string[]) {
    while (Date.now() < endTime) {
      const query = queries[Math.floor(Math.random() * queries.length)]
      
      try {
        const start = performance.now()
        await this.searchService.search({
          q: query,
          page: 1,
          size: 30
        })
        const responseTime = performance.now() - start
        this.responseTimes.push(responseTime)
      } catch (error) {
        this.responseTimes.push(-1) // 실패 표시
      }

      // 요청 간 간격
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100))
    }
  }

  private calculateResults(duration: number): BenchmarkResult {
    const totalRequests = this.responseTimes.length
    const successfulRequests = this.responseTimes.filter(t => t > 0).length
    const failedRequests = totalRequests - successfulRequests
    const successfulTimes = this.responseTimes.filter(t => t > 0).sort((a, b) => a - b)

    const averageResponseTime = successfulTimes.reduce((sum, time) => sum + time, 0) / successfulTimes.length
    const p95ResponseTime = successfulTimes[Math.floor(successfulTimes.length * 0.95)] || 0
    const p99ResponseTime = successfulTimes[Math.floor(successfulTimes.length * 0.99)] || 0
    const requestsPerSecond = totalRequests / duration
    const errorRate = failedRequests / totalRequests

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime,
      p95ResponseTime,
      p99ResponseTime,
      requestsPerSecond,
      errorRate
    }
  }
}

// 벤치마크 실행
async function runPerformanceTest() {
  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'ai_tools_bench',
    user: 'postgres',
    password: 'password',
    max: 20
  })

  const redis = new Redis({
    host: 'localhost',
    port: 6379,
    maxRetriesPerRequest: 3
  })

  const benchmark = new SearchBenchmark(pool, redis)

  const testQueries = [
    '블로그',
    'ChatGPT',
    'AI 도구',
    '템플릿',
    '워크플로우',
    'writing',
    'automation',
    'design'
  ]

  console.log('📊 성능 벤치마크 테스트')
  
  // 다양한 부하 수준 테스트
  const loadLevels = [
    { concurrency: 10, duration: 30 },
    { concurrency: 50, duration: 30 },
    { concurrency: 100, duration: 30 },
    { concurrency: 200, duration: 30 }
  ]

  for (const level of loadLevels) {
    console.log(`\n🔄 테스트: ${level.concurrency}개 동시 연결`)
    
    const result = await benchmark.runBenchmark({
      ...level,
      queries: testQueries
    })

    console.log('📋 결과:')
    console.log(`   총 요청: ${result.totalRequests}`)
    console.log(`   성공: ${result.successfulRequests}`)
    console.log(`   실패: ${result.failedRequests}`)
    console.log(`   평균 응답시간: ${result.averageResponseTime.toFixed(2)}ms`)
    console.log(`   P95 응답시간: ${result.p95ResponseTime.toFixed(2)}ms`)
    console.log(`   P99 응답시간: ${result.p99ResponseTime.toFixed(2)}ms`)
    console.log(`   RPS: ${result.requestsPerSecond.toFixed(2)}`)
    console.log(`   오류율: ${(result.errorRate * 100).toFixed(2)}%`)

    // 성능 목표 검증
    if (result.averageResponseTime > 300) {
      console.warn(`⚠️  평균 응답시간이 목표(300ms)를 초과했습니다: ${result.averageResponseTime.toFixed(2)}ms`)
    }

    if (result.errorRate > 0.01) {
      console.warn(`⚠️  오류율이 목표(1%)를 초과했습니다: ${(result.errorRate * 100).toFixed(2)}%`)
    }

    // 테스트 간 대기
    await new Promise(resolve => setTimeout(resolve, 5000))
  }

  await pool.end()
  await redis.quit()
}

if (require.main === module) {
  runPerformanceTest().catch(console.error)
}
```

### 데이터베이스 성능 분석

```sql
-- tests/performance/db-performance.sql

-- =====================================================
-- 1. 쿼리 성능 분석
-- =====================================================

-- 검색 쿼리 성능 분석 (EXPLAIN ANALYZE)
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
WITH fts_candidates AS (
    SELECT 
        id, type, title, summary, tags, body, embedding,
        created_at, updated_at,
        ts_rank(tsv, plainto_tsquery('simple', 'blog writing')) as fts_rank
    FROM ai_items
    WHERE 
        tsv @@ plainto_tsquery('simple', 'blog writing')
        AND embedding IS NOT NULL
    ORDER BY fts_rank DESC
    LIMIT 200
),
vector_ranked AS (
    SELECT 
        *,
        1 - (embedding <-> '[더미 벡터]'::vector) as vector_similarity,
        (fts_rank * 0.3) + ((1 - (embedding <-> '[더미 벡터]'::vector)) * 0.7) as combined_score
    FROM fts_candidates
    ORDER BY combined_score DESC
)
SELECT 
    id, type, title, summary, tags, body,
    created_at, updated_at,
    fts_rank, vector_similarity, combined_score
FROM vector_ranked
LIMIT 30 OFFSET 0;

-- =====================================================
-- 2. 인덱스 사용률 모니터링
-- =====================================================

-- 인덱스 사용 통계
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched,
    CASE 
        WHEN idx_scan = 0 THEN 'UNUSED'
        WHEN idx_scan < 100 THEN 'LOW_USAGE'
        WHEN idx_scan < 1000 THEN 'MEDIUM_USAGE'
        ELSE 'HIGH_USAGE'
    END as usage_level
FROM pg_stat_user_indexes 
WHERE tablename = 'ai_items'
ORDER BY idx_scan DESC;

-- 인덱스 크기 및 효율성
SELECT 
    indexname,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as index_size,
    idx_scan,
    CASE 
        WHEN idx_scan > 0 THEN pg_relation_size(indexname::regclass) / idx_scan
        ELSE pg_relation_size(indexname::regclass)
    END as bytes_per_scan
FROM pg_stat_user_indexes 
WHERE tablename = 'ai_items'
ORDER BY pg_relation_size(indexname::regclass) DESC;

-- =====================================================
-- 3. 테이블 통계 및 성능 메트릭
-- =====================================================

-- 테이블 크기 및 성장률
SELECT 
    'ai_items' as table_name,
    pg_size_pretty(pg_total_relation_size('ai_items')) as total_size,
    pg_size_pretty(pg_relation_size('ai_items')) as table_size,
    pg_size_pretty(pg_total_relation_size('ai_items') - pg_relation_size('ai_items')) as index_size,
    (SELECT COUNT(*) FROM ai_items) as row_count,
    pg_size_pretty(pg_total_relation_size('ai_items') / GREATEST((SELECT COUNT(*) FROM ai_items), 1)) as avg_row_size;

-- 쿼리 성능 통계 (PostgreSQL 13+에서 pg_stat_statements 필요)
/*
SELECT 
    query,
    calls,
    total_exec_time,
    mean_exec_time,
    stddev_exec_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements 
WHERE query LIKE '%ai_items%'
ORDER BY mean_exec_time DESC
LIMIT 10;
*/

-- =====================================================
-- 4. 성능 벤치마크 쿼리
-- =====================================================

-- FTS 성능 테스트 (여러 키워드)
DO $$
DECLARE
    test_queries text[] := ARRAY['blog', 'writing', 'ai', 'chatgpt', 'template', 'automation'];
    query_text text;
    start_time timestamptz;
    end_time timestamptz;
    duration_ms numeric;
BEGIN
    FOREACH query_text IN ARRAY test_queries
    LOOP
        start_time := clock_timestamp();
        
        PERFORM COUNT(*)
        FROM ai_items
        WHERE tsv @@ plainto_tsquery('simple', query_text);
        
        end_time := clock_timestamp();
        duration_ms := EXTRACT(MILLISECONDS FROM (end_time - start_time));
        
        RAISE NOTICE 'Query "%" took %.2f ms', query_text, duration_ms;
    END LOOP;
END $$;

-- Vector 검색 성능 테스트 (임베딩이 있는 경우)
DO $$
DECLARE
    dummy_vector vector(1536) := (SELECT ARRAY(SELECT random() FROM generate_series(1, 1536)))::vector;
    start_time timestamptz;
    end_time timestamptz;
    duration_ms numeric;
    result_count integer;
BEGIN
    start_time := clock_timestamp();
    
    SELECT COUNT(*) INTO result_count
    FROM ai_items
    WHERE embedding IS NOT NULL
    ORDER BY embedding <-> dummy_vector
    LIMIT 100;
    
    end_time := clock_timestamp();
    duration_ms := EXTRACT(MILLISECONDS FROM (end_time - start_time));
    
    RAISE NOTICE 'Vector search for % items took %.2f ms', result_count, duration_ms;
END $$;

-- =====================================================
-- 5. 성능 최적화 권장사항
-- =====================================================

-- 미사용 인덱스 식별
SELECT 
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as size
FROM pg_stat_user_indexes 
WHERE idx_scan = 0 
  AND schemaname = 'public'
  AND pg_relation_size(indexname::regclass) > 1024 * 1024; -- 1MB 이상

-- 중복 인덱스 검사
WITH index_stats AS (
    SELECT 
        schemaname,
        tablename,
        indexname,
        array_to_string(array_agg(attname ORDER BY attnum), ',') as columns
    FROM pg_stats_ext pse
    JOIN pg_attribute pa ON pse.schemaname = pa.attrelid::regclass::text
    GROUP BY schemaname, tablename, indexname
)
SELECT 
    i1.tablename,
    i1.indexname as index1,
    i2.indexname as index2,
    i1.columns
FROM index_stats i1
JOIN index_stats i2 ON i1.tablename = i2.tablename 
    AND i1.columns = i2.columns 
    AND i1.indexname < i2.indexname
WHERE i1.tablename = 'ai_items';
```

### 모니터링 및 알람

```typescript
// tests/performance/monitoring.ts
import { Pool } from 'pg'
import { Redis } from 'ioredis'

interface PerformanceMetrics {
  timestamp: Date
  responseTime: {
    avg: number
    p95: number
    p99: number
  }
  throughput: {
    requestsPerSecond: number
    queriesPerSecond: number
  }
  database: {
    connectionCount: number
    slowQueries: number
    indexHitRatio: number
  }
  cache: {
    hitRatio: number
    memoryUsage: number
  }
  errors: {
    rate: number
    count: number
  }
}

class PerformanceMonitor {
  private pool: Pool
  private redis: Redis
  private metrics: PerformanceMetrics[] = []

  constructor(pool: Pool, redis: Redis) {
    this.pool = pool
    this.redis = redis
  }

  async collectMetrics(): Promise<PerformanceMetrics> {
    const timestamp = new Date()

    // 데이터베이스 메트릭
    const dbStats = await this.pool.query(`
      SELECT 
        sum(numbackends) as connection_count,
        sum(xact_commit) as commits,
        sum(xact_rollback) as rollbacks,
        sum(blks_hit) / (sum(blks_hit) + sum(blks_read)) as hit_ratio
      FROM pg_stat_database
      WHERE datname = current_database()
    `)

    // Redis 메트릭
    const redisInfo = await this.redis.info('memory')
    const memoryUsage = parseInt(redisInfo.match(/used_memory:(\d+)/)?.[1] || '0')
    
    const cacheStats = await this.redis.info('stats')
    const cacheHits = parseInt(cacheStats.match(/keyspace_hits:(\d+)/)?.[1] || '0')
    const cacheMisses = parseInt(cacheStats.match(/keyspace_misses:(\d+)/)?.[1] || '0')
    const hitRatio = cacheHits / (cacheHits + cacheMisses) || 0

    // 성능 메트릭 구성
    const metrics: PerformanceMetrics = {
      timestamp,
      responseTime: {
        avg: 0, // 실제 구현에서는 애플리케이션 메트릭에서 수집
        p95: 0,
        p99: 0
      },
      throughput: {
        requestsPerSecond: 0,
        queriesPerSecond: 0
      },
      database: {
        connectionCount: parseInt(dbStats.rows[0]?.connection_count || '0'),
        slowQueries: 0, // pg_stat_statements에서 수집
        indexHitRatio: parseFloat(dbStats.rows[0]?.hit_ratio || '0')
      },
      cache: {
        hitRatio,
        memoryUsage
      },
      errors: {
        rate: 0,
        count: 0
      }
    }

    this.metrics.push(metrics)
    
    // 최근 24시간 데이터만 유지
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    this.metrics = this.metrics.filter(m => m.timestamp > oneDayAgo)

    return metrics
  }

  async checkAlerts(): Promise<string[]> {
    const alerts: string[] = []
    const latest = this.metrics[this.metrics.length - 1]

    if (!latest) return alerts

    // 응답 시간 알람
    if (latest.responseTime.avg > 500) {
      alerts.push(`높은 평균 응답시간: ${latest.responseTime.avg}ms`)
    }

    // 데이터베이스 알람
    if (latest.database.indexHitRatio < 0.95) {
      alerts.push(`낮은 인덱스 히트율: ${(latest.database.indexHitRatio * 100).toFixed(2)}%`)
    }

    if (latest.database.connectionCount > 80) {
      alerts.push(`높은 DB 연결 수: ${latest.database.connectionCount}`)
    }

    // 캐시 알람
    if (latest.cache.hitRatio < 0.7) {
      alerts.push(`낮은 캐시 히트율: ${(latest.cache.hitRatio * 100).toFixed(2)}%`)
    }

    // 오류율 알람
    if (latest.errors.rate > 0.01) {
      alerts.push(`높은 오류율: ${(latest.errors.rate * 100).toFixed(2)}%`)
    }

    return alerts
  }

  getMetrics(hours: number = 1): PerformanceMetrics[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000)
    return this.metrics.filter(m => m.timestamp > cutoff)
  }
}

export { PerformanceMonitor, type PerformanceMetrics }
```

## CI/CD 통합

### GitHub Actions 워크플로우

```yaml
# .github/workflows/backend-tests.yml
name: Backend Tests & Performance

on:
  push:
    branches: [main, develop]
    paths: ['src/services/**', 'scripts/**', 'tests/**']
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: pgvector/pgvector:pg15
        env:
          POSTGRES_DB: ai_tools_test
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: test123
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5433:5432
      
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6380:6379

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Setup test database
        run: |
          npm run db:migrate:test
          npm run db:seed:test

      - name: Run unit tests
        run: npm run test:unit
        env:
          TEST_DB_HOST: localhost
          TEST_DB_PORT: 5433
          TEST_DB_NAME: ai_tools_test
          TEST_DB_USER: postgres
          TEST_DB_PASSWORD: test123
          TEST_REDIS_HOST: localhost
          TEST_REDIS_PORT: 6380

      - name: Run integration tests
        run: npm run test:integration

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

  performance-tests:
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    
    services:
      postgres:
        image: pgvector/pgvector:pg15
        env:
          POSTGRES_DB: ai_tools_bench
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: bench123
        ports:
          - 5432:5432
      
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Setup benchmark database
        run: |
          npm run db:setup:bench
          npm run db:seed:bench

      - name: Run performance tests
        run: npm run test:performance
        env:
          DB_HOST: localhost
          DB_PORT: 5432
          DB_NAME: ai_tools_bench
          DB_USER: postgres
          DB_PASSWORD: bench123
          REDIS_HOST: localhost
          REDIS_PORT: 6379

      - name: Upload performance results
        uses: actions/upload-artifact@v3
        with:
          name: performance-results
          path: test-results/performance/
```

## 테스트 데이터 관리

### 테스트 데이터 생성 스크립트

```sql
-- scripts/generate-test-data.sql
-- 대량 테스트 데이터 생성 (성능 테스트용)

INSERT INTO ai_items (type, title, summary, tags, body)
SELECT 
    (ARRAY['tool', 'template', 'workflow'])[1 + floor(random() * 3)::int] as type,
    CASE 
        WHEN i % 3 = 0 THEN 'AI Tool ' || i
        WHEN i % 3 = 1 THEN 'Template ' || i || ' for Productivity'
        ELSE 'Workflow ' || i || ' Automation'
    END as title,
    CASE 
        WHEN i % 4 = 0 THEN 'Advanced AI-powered solution for productivity and automation'
        WHEN i % 4 = 1 THEN 'Template for creating professional content and documents'
        WHEN i % 4 = 2 THEN 'Workflow automation for streamlined business processes'
        ELSE 'Comprehensive tool for data analysis and visualization'
    END as summary,
    CASE 
        WHEN i % 5 = 0 THEN ARRAY['ai', 'productivity', 'automation']
        WHEN i % 5 = 1 THEN ARRAY['template', 'document', 'writing']
        WHEN i % 5 = 2 THEN ARRAY['workflow', 'business', 'process']
        WHEN i % 5 = 3 THEN ARRAY['data', 'analysis', 'visualization']
        ELSE ARRAY['tool', 'utility', 'helper']
    END as tags,
    json_build_object(
        'category', CASE WHEN i % 3 = 0 THEN 'ai-tools' WHEN i % 3 = 1 THEN 'templates' ELSE 'workflows' END,
        'features', ARRAY['feature1', 'feature2', 'feature3'],
        'difficulty', CASE WHEN i % 3 = 0 THEN 'beginner' WHEN i % 3 = 1 THEN 'intermediate' ELSE 'advanced' END
    ) as body
FROM generate_series(1, 10000) i;

-- 인덱스 통계 업데이트
ANALYZE ai_items;
```

---

## 요약

이 백엔드 테스트 및 벤치마크 가이드는 Search V2 시스템의 안정성과 성능을 보장하기 위한 종합적인 테스트 전략을 제공합니다:

### 주요 구성 요소:
1. **단위 테스트**: 개별 함수 및 모듈의 정확성 검증
2. **통합 테스트**: API 엔드포인트와 데이터베이스 연동 검증
3. **성능 벤치마크**: 부하 테스트 및 응답 시간 측정
4. **모니터링**: 실시간 성능 메트릭 수집 및 알람
5. **CI/CD 통합**: 자동화된 테스트 파이프라인

### 성능 목표:
- **응답 시간**: P95 < 300ms, P99 < 500ms
- **처리량**: 500 RPS 이상
- **오류율**: 1% 미만
- **가용성**: 99.9% 이상

이 가이드를 통해 Search V2 시스템의 품질과 성능을 지속적으로 모니터링하고 개선할 수 있습니다.