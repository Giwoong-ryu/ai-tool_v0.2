# Search V2 임베딩 배치 처리

Search V2의 벡터 임베딩 생성 및 관리를 위한 배치 처리 시스템 설계입니다.

## 임베딩 배치 처리 개요

### 처리 흐름
1. **신규/업데이트 감지**: embedding이 없거나 outdated된 아이템 식별
2. **텍스트 전처리**: 제목, 요약, 태그를 임베딩용 텍스트로 결합
3. **배치 생성**: OpenAI API 호출 최적화를 위한 배치 구성
4. **임베딩 생성**: OpenAI text-embedding-ada-002 API 호출
5. **DB 업데이트**: 생성된 임베딩을 PostgreSQL에 저장
6. **실패 처리**: 재시도 로직 및 오류 처리

### 성능 목표
- **배치 크기**: 100개 아이템/배치 (OpenAI API 제한 고려)
- **처리 속도**: 1000개 아이템/시간
- **오류율**: <1% (재시도 포함)
- **비용 최적화**: 중복 임베딩 생성 방지

## 배치 처리 스크립트

### Node.js 배치 스크립트

```typescript
// scripts/embedding-batch.ts
import { Pool } from 'pg'
import { OpenAI } from 'openai'
import { Redis } from 'ioredis'

// =====================================================
// 설정 및 초기화
// =====================================================

interface EmbeddingConfig {
  batchSize: number
  maxRetries: number
  delayBetweenBatches: number
  model: string
  maxTokens: number
}

const config: EmbeddingConfig = {
  batchSize: 100,
  maxRetries: 3,
  delayBetweenBatches: 2000, // 2초
  model: 'text-embedding-ada-002',
  maxTokens: 8000 // OpenAI 제한
}

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 5 // 배치 처리용 적은 연결 수
})

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD
})

// =====================================================
// 타입 정의
// =====================================================

interface ItemForEmbedding {
  id: string
  title: string
  summary: string
  tags: string[]
  content_text: string
  token_count?: number
}

interface BatchResult {
  processed: number
  succeeded: number
  failed: number
  skipped: number
  errors: Array<{
    id: string
    error: string
  }>
}

interface EmbeddingJob {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  created_at: Date
  updated_at: Date
  batch_size: number
  progress: {
    total: number
    processed: number
    succeeded: number
    failed: number
  }
}

// =====================================================
// 유틸리티 함수
// =====================================================

function prepareTextForEmbedding(item: ItemForEmbedding): string {
  const parts = [
    item.title,
    item.summary || '',
    Array.isArray(item.tags) ? item.tags.join(' ') : ''
  ].filter(Boolean)
  
  return parts.join(' ').trim()
}

function estimateTokenCount(text: string): number {
  // 간단한 토큰 추정 (정확하지 않지만 배치 계획용)
  return Math.ceil(text.length / 4)
}

function splitIntoBatches<T>(items: T[], batchSize: number): T[][] {
  const batches: T[][] = []
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize))
  }
  return batches
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// =====================================================
// 메인 배치 처리 클래스
// =====================================================

class EmbeddingBatchProcessor {
  private readonly pool: Pool
  private readonly openai: OpenAI
  private readonly redis: Redis
  private readonly config: EmbeddingConfig

  constructor(pool: Pool, openai: OpenAI, redis: Redis, config: EmbeddingConfig) {
    this.pool = pool
    this.openai = openai
    this.redis = redis
    this.config = config
  }

  async processAllPendingItems(): Promise<BatchResult> {
    console.log('🚀 임베딩 배치 처리 시작')
    
    // 1. 처리 대상 아이템 조회
    const pendingItems = await this.getPendingItems()
    console.log(`📊 처리 대상: ${pendingItems.length}개 아이템`)
    
    if (pendingItems.length === 0) {
      console.log('✅ 처리할 아이템 없음')
      return { processed: 0, succeeded: 0, failed: 0, skipped: 0, errors: [] }
    }

    // 2. 배치로 분할
    const batches = splitIntoBatches(pendingItems, this.config.batchSize)
    console.log(`📦 ${batches.length}개 배치로 분할`)

    // 3. 각 배치 처리
    let totalResult: BatchResult = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      skipped: 0,
      errors: []
    }

    for (let i = 0; i < batches.length; i++) {
      console.log(`🔄 배치 ${i + 1}/${batches.length} 처리 중...`)
      
      const batchResult = await this.processBatch(batches[i])
      
      totalResult.processed += batchResult.processed
      totalResult.succeeded += batchResult.succeeded
      totalResult.failed += batchResult.failed
      totalResult.skipped += batchResult.skipped
      totalResult.errors.push(...batchResult.errors)
      
      // 배치 간 대기 (API 제한 준수)
      if (i < batches.length - 1) {
        await delay(this.config.delayBetweenBatches)
      }
    }

    console.log('✅ 임베딩 배치 처리 완료')
    console.log(`📈 결과: ${totalResult.succeeded}개 성공, ${totalResult.failed}개 실패`)
    
    return totalResult
  }

  private async getPendingItems(): Promise<ItemForEmbedding[]> {
    const query = `
      SELECT 
        id,
        title,
        summary,
        tags,
        CONCAT_WS(' ', title, COALESCE(summary, ''), array_to_string(COALESCE(tags, '{}'), ' ')) as content_text
      FROM ai_items
      WHERE 
        embedding IS NULL 
        OR embedding_updated_at IS NULL 
        OR embedding_updated_at < updated_at
      ORDER BY 
        CASE WHEN embedding IS NULL THEN 0 ELSE 1 END,  -- NULL 우선
        updated_at DESC
      LIMIT 5000  -- 한 번에 처리할 최대 개수
    `
    
    const result = await this.pool.query(query)
    
    return result.rows.map(row => ({
      id: row.id,
      title: row.title,
      summary: row.summary,
      tags: row.tags || [],
      content_text: row.content_text,
      token_count: estimateTokenCount(row.content_text)
    }))
  }

  private async processBatch(items: ItemForEmbedding[]): Promise<BatchResult> {
    const result: BatchResult = {
      processed: items.length,
      succeeded: 0,
      failed: 0,
      skipped: 0,
      errors: []
    }

    try {
      // 1. 텍스트 준비 및 검증
      const validItems: ItemForEmbedding[] = []
      for (const item of items) {
        const text = prepareTextForEmbedding(item)
        const tokenCount = estimateTokenCount(text)
        
        if (tokenCount > this.config.maxTokens) {
          console.warn(`⚠️  토큰 초과: ${item.id} (${tokenCount} tokens)`)
          result.skipped++
          continue
        }
        
        if (!text.trim()) {
          console.warn(`⚠️  빈 텍스트: ${item.id}`)
          result.skipped++
          continue
        }
        
        validItems.push({ ...item, content_text: text })
      }

      if (validItems.length === 0) {
        return result
      }

      // 2. OpenAI API 호출
      const texts = validItems.map(item => item.content_text)
      const embeddingResponse = await this.createEmbeddings(texts)

      // 3. DB 업데이트
      for (let i = 0; i < validItems.length; i++) {
        const item = validItems[i]
        const embedding = embeddingResponse.data[i]?.embedding

        if (embedding) {
          await this.updateItemEmbedding(item.id, embedding)
          result.succeeded++
        } else {
          result.failed++
          result.errors.push({
            id: item.id,
            error: '임베딩 생성 실패'
          })
        }
      }

    } catch (error) {
      console.error(`❌ 배치 처리 오류:`, error)
      
      // 개별 아이템 재시도
      for (const item of items) {
        try {
          await this.processSingleItem(item)
          result.succeeded++
        } catch (singleError) {
          result.failed++
          result.errors.push({
            id: item.id,
            error: singleError instanceof Error ? singleError.message : 'Unknown error'
          })
        }
      }
    }

    return result
  }

  private async createEmbeddings(texts: string[]): Promise<any> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        const response = await this.openai.embeddings.create({
          model: this.config.model,
          input: texts,
          encoding_format: 'float'
        })

        return response
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error')
        console.warn(`⚠️  임베딩 생성 실패 (시도 ${attempt}/${this.config.maxRetries}):`, lastError.message)
        
        if (attempt < this.config.maxRetries) {
          await delay(1000 * attempt) // 지수 백오프
        }
      }
    }

    throw lastError
  }

  private async processSingleItem(item: ItemForEmbedding): Promise<void> {
    const text = prepareTextForEmbedding(item)
    const response = await this.createEmbeddings([text])
    const embedding = response.data[0]?.embedding

    if (!embedding) {
      throw new Error('임베딩 생성 실패')
    }

    await this.updateItemEmbedding(item.id, embedding)
  }

  private async updateItemEmbedding(id: string, embedding: number[]): Promise<void> {
    const query = `
      UPDATE ai_items 
      SET 
        embedding = $2::vector,
        embedding_model = $3,
        embedding_updated_at = NOW()
      WHERE id = $1
    `
    
    await this.pool.query(query, [
      id,
      JSON.stringify(embedding),
      this.config.model
    ])
  }

  async getProgressStats(): Promise<any> {
    const query = `
      SELECT 
        COUNT(*) as total_items,
        COUNT(embedding) as embedded_items,
        COUNT(*) - COUNT(embedding) as pending_items,
        ROUND(COUNT(embedding) * 100.0 / COUNT(*), 2) as progress_percent
      FROM ai_items
    `
    
    const result = await this.pool.query(query)
    return result.rows[0]
  }
}

// =====================================================
// CLI 실행 스크립트
// =====================================================

async function main() {
  const processor = new EmbeddingBatchProcessor(pool, openai, redis, config)

  try {
    // 현재 진행률 확인
    const stats = await processor.getProgressStats()
    console.log('📊 현재 임베딩 진행률:', stats)

    // 배치 처리 실행
    const result = await processor.processAllPendingItems()
    
    // 결과 출력
    console.log('\n📋 처리 결과:')
    console.log(`   처리됨: ${result.processed}개`)
    console.log(`   성공: ${result.succeeded}개`)
    console.log(`   실패: ${result.failed}개`)
    console.log(`   건너뜀: ${result.skipped}개`)
    
    if (result.errors.length > 0) {
      console.log('\n❌ 오류 목록:')
      result.errors.forEach(error => {
        console.log(`   ${error.id}: ${error.error}`)
      })
    }

    // 업데이트된 진행률 확인
    const finalStats = await processor.getProgressStats()
    console.log('\n📊 최종 임베딩 진행률:', finalStats)

  } catch (error) {
    console.error('💥 배치 처리 실패:', error)
    process.exit(1)
  } finally {
    await pool.end()
    await redis.quit()
  }
}

// CLI에서 실행된 경우
if (require.main === module) {
  main()
}

export { EmbeddingBatchProcessor, config }
```

## 배치 작업 스케줄링

### Cron Job 설정

```bash
# crontab -e
# 매일 새벽 2시에 임베딩 배치 처리
0 2 * * * cd /path/to/ai-tools-website && npm run embedding:batch >> /var/log/embedding-batch.log 2>&1

# 매시간 증분 처리 (신규/업데이트된 아이템만)
0 * * * * cd /path/to/ai-tools-website && npm run embedding:incremental >> /var/log/embedding-incremental.log 2>&1
```

### package.json 스크립트

```json
{
  "scripts": {
    "embedding:batch": "ts-node scripts/embedding-batch.ts",
    "embedding:incremental": "ts-node scripts/embedding-batch.ts --incremental",
    "embedding:status": "ts-node scripts/embedding-status.ts",
    "embedding:reset": "ts-node scripts/embedding-reset.ts"
  }
}
```

## 모니터링 및 알림

### 배치 작업 모니터링

```typescript
// scripts/embedding-monitor.ts
import { Pool } from 'pg'

interface MonitoringMetrics {
  total_items: number
  embedded_items: number
  pending_items: number
  progress_percent: number
  last_update: string
  avg_processing_time: number
  error_rate: number
}

async function getMonitoringMetrics(): Promise<MonitoringMetrics> {
  const pool = new Pool(/* config */)
  
  const query = `
    SELECT 
      COUNT(*) as total_items,
      COUNT(embedding) as embedded_items,
      COUNT(*) - COUNT(embedding) as pending_items,
      ROUND(COUNT(embedding) * 100.0 / COUNT(*), 2) as progress_percent,
      MAX(embedding_updated_at) as last_update
    FROM ai_items
  `
  
  const result = await pool.query(query)
  const row = result.rows[0]
  
  return {
    total_items: parseInt(row.total_items),
    embedded_items: parseInt(row.embedded_items),
    pending_items: parseInt(row.pending_items),
    progress_percent: parseFloat(row.progress_percent),
    last_update: row.last_update,
    avg_processing_time: 0, // 별도 로그에서 계산
    error_rate: 0 // 별도 로그에서 계산
  }
}

// Slack/Discord 알림
async function sendAlert(message: string) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL
  if (!webhookUrl) return
  
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `🤖 임베딩 배치 알림: ${message}`
    })
  })
}
```

### Prometheus 메트릭 노출

```typescript
// scripts/metrics-server.ts
import express from 'express'
import { register, Gauge, Counter } from 'prom-client'

const app = express()

// 메트릭 정의
const embeddingProgress = new Gauge({
  name: 'embedding_progress_percent',
  help: '임베딩 진행률 (%)'
})

const embeddingTotal = new Gauge({
  name: 'embedding_total_items',
  help: '전체 아이템 수'
})

const embeddingPending = new Gauge({
  name: 'embedding_pending_items',
  help: '대기 중인 아이템 수'
})

const embeddingErrors = new Counter({
  name: 'embedding_errors_total',
  help: '임베딩 오류 총 개수'
})

app.get('/metrics', async (req, res) => {
  try {
    const metrics = await getMonitoringMetrics()
    
    embeddingProgress.set(metrics.progress_percent)
    embeddingTotal.set(metrics.total_items)
    embeddingPending.set(metrics.pending_items)
    
    res.set('Content-Type', register.contentType)
    res.end(await register.metrics())
  } catch (error) {
    res.status(500).send('메트릭 수집 실패')
  }
})

app.listen(9090)
```

## 비용 최적화

### OpenAI API 비용 계산

```typescript
interface CostEstimate {
  total_tokens: number
  estimated_cost_usd: number
  estimated_cost_krw: number
}

function calculateEmbeddingCost(tokenCount: number): CostEstimate {
  // OpenAI text-embedding-ada-002 가격: $0.0004 per 1K tokens
  const pricePerThousandTokens = 0.0004
  const exchangeRate = 1300 // 원/달러 (추정)
  
  const costUsd = (tokenCount / 1000) * pricePerThousandTokens
  const costKrw = costUsd * exchangeRate
  
  return {
    total_tokens: tokenCount,
    estimated_cost_usd: costUsd,
    estimated_cost_krw: costKrw
  }
}
```

### 중복 방지 전략

```sql
-- 동일한 텍스트의 중복 임베딩 방지
CREATE INDEX ai_items_content_hash 
ON ai_items (md5(title || ' ' || COALESCE(summary, '') || ' ' || array_to_string(COALESCE(tags, '{}'), ' ')));

-- 중복 검사 쿼리
SELECT 
  content_hash,
  COUNT(*) as duplicate_count,
  array_agg(id) as item_ids
FROM (
  SELECT 
    id,
    md5(title || ' ' || COALESCE(summary, '') || ' ' || array_to_string(COALESCE(tags, '{}'), ' ')) as content_hash
  FROM ai_items
  WHERE embedding IS NULL
) duplicates
GROUP BY content_hash
HAVING COUNT(*) > 1;
```

## 오류 처리 및 복구

### 재시도 로직

```typescript
async function processWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')
      
      if (attempt === maxRetries) {
        throw lastError
      }
      
      // 지수 백오프 + 지터
      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError!
}
```

### 배치 작업 복구

```sql
-- 실패한 임베딩 식별 및 재설정
UPDATE ai_items 
SET 
  embedding = NULL,
  embedding_updated_at = NULL
WHERE 
  embedding_updated_at < NOW() - INTERVAL '1 day'
  AND embedding IS NULL;

-- 오래된 임베딩 재생성 (모델 업데이트 시)
UPDATE ai_items 
SET 
  embedding = NULL,
  embedding_updated_at = NULL
WHERE 
  embedding_model != 'text-embedding-ada-002'
  OR embedding_updated_at < '2024-01-01';
```

## 성능 벤치마크

### 배치 크기별 성능 테스트

```bash
# 다양한 배치 크기로 성능 테스트
npm run embedding:benchmark -- --batch-size=50 --items=1000
npm run embedding:benchmark -- --batch-size=100 --items=1000
npm run embedding:benchmark -- --batch-size=200 --items=1000
```

### 예상 처리 시간

| 배치 크기 | API 호출/분 | 아이템/시간 | 1000개 처리 시간 |
|---------|----------|-----------|-------------|
| 50개 | 30 | 1,500 | 40분 |
| 100개 | 30 | 3,000 | 20분 |
| 200개 | 30 | 6,000 | 10분 |

### 리소스 사용량

```typescript
// 메모리 및 CPU 모니터링
function getResourceUsage() {
  const usage = process.memoryUsage()
  const cpuUsage = process.cpuUsage()
  
  return {
    memory: {
      rss: Math.round(usage.rss / 1024 / 1024) + 'MB',
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024) + 'MB',
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + 'MB'
    },
    cpu: {
      user: cpuUsage.user,
      system: cpuUsage.system
    }
  }
}
```

---

> 다음 단계: 프론트엔드 연동 가이드 작성 (05-frontend-integration.md)