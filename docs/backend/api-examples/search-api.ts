/**
 * Search V2 API Implementation
 * 
 * Next.js API Route: /api/search
 * FTS + pgvector 2단계 하이브리드 검색 구현
 */

import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import { Redis } from 'ioredis'

// =====================================================
// 타입 정의
// =====================================================

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

interface SearchParams {
  q?: string
  page: number
  size: number
  type?: 'tool' | 'template' | 'workflow'
}

// =====================================================
// 데이터베이스 및 캐시 설정
// =====================================================

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'ai_tools',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
})

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
})

// =====================================================
// 유틸리티 함수
// =====================================================

function validateSearchParams(searchParams: URLSearchParams): SearchParams {
  const q = searchParams.get('q') || undefined
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const size = Math.max(1, Math.min(100, parseInt(searchParams.get('size') || '30')))
  const type = searchParams.get('type') as 'tool' | 'template' | 'workflow' | undefined
  
  // 검색어 길이 검증
  if (q && (q.length > 100 || q.length < 1)) {
    throw new Error('검색어는 1-100자 사이여야 합니다')
  }
  
  // 타입 검증
  if (type && !['tool', 'template', 'workflow'].includes(type)) {
    throw new Error('올바르지 않은 타입입니다')
  }
  
  return { q, page, size, type }
}

function generateCacheKey(params: SearchParams): string {
  const { q, page, size, type } = params
  const keyParts = [
    'search',
    q ? Buffer.from(q).toString('base64').slice(0, 20) : 'all',
    page.toString(),
    size.toString(),
    type || 'any'
  ]
  return keyParts.join(':')
}

async function getEmbedding(text: string): Promise<number[]> {
  // OpenAI Embedding API 호출
  // 실제 구현에서는 OpenAI SDK 사용
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-ada-002',
      input: text,
    })
  })
  
  if (!response.ok) {
    throw new Error('임베딩 생성 실패')
  }
  
  const data = await response.json()
  return data.data[0].embedding
}

// =====================================================
// 검색 로직 구현
// =====================================================

class SearchService {
  private readonly pool: Pool
  private readonly redis: Redis
  
  constructor(pool: Pool, redis: Redis) {
    this.pool = pool
    this.redis = redis
  }
  
  async search(params: SearchParams): Promise<SearchResponse> {
    const startTime = Date.now()
    const { q, page, size, type } = params
    
    // 캐시 확인
    const cacheKey = generateCacheKey(params)
    const cached = await this.redis.get(cacheKey)
    if (cached) {
      const result = JSON.parse(cached)
      result.performance.took_ms = Date.now() - startTime
      return result
    }
    
    let items: SearchItem[]
    let total: number
    let stages = {
      fts_ms: 0,
      vector_ms: 0,
      total_candidates: 0
    }
    
    if (q) {
      // 검색어가 있는 경우: 하이브리드 검색
      const result = await this.hybridSearch(q, page, size, type)
      items = result.items
      total = result.total
      stages = result.stages
    } else {
      // 검색어가 없는 경우: 전체 조회
      const result = await this.getAllItems(page, size, type)
      items = result.items
      total = result.total
    }
    
    const response: SearchResponse = {
      items,
      pagination: {
        page,
        size,
        total,
        pages: Math.ceil(total / size)
      },
      performance: {
        took_ms: Date.now() - startTime,
        stages
      }
    }
    
    // 결과 캐싱 (5분)
    await this.redis.setex(cacheKey, 300, JSON.stringify(response))
    
    return response
  }
  
  private async hybridSearch(
    query: string, 
    page: number, 
    size: number, 
    type?: string
  ): Promise<{
    items: SearchItem[]
    total: number
    stages: { fts_ms: number; vector_ms: number; total_candidates: number }
  }> {
    const offset = (page - 1) * size
    
    // 1단계: 총 개수 조회
    const totalStart = Date.now()
    const totalQuery = `
      SELECT COUNT(*) as total
      FROM ai_items
      WHERE 
        tsv @@ plainto_tsquery('simple', $1)
        AND ($2::text IS NULL OR type = $2)
        AND embedding IS NOT NULL
    `
    const totalResult = await this.pool.query(totalQuery, [query, type])
    const total = parseInt(totalResult.rows[0].total)
    
    // 2단계: 임베딩 생성
    const embeddingStart = Date.now()
    const queryEmbedding = await getEmbedding(query)
    const embeddingTime = Date.now() - embeddingStart
    
    // 3단계: 하이브리드 검색
    const searchStart = Date.now()
    const searchQuery = `
      WITH fts_candidates AS (
        SELECT 
          id, type, title, summary, tags, body, embedding,
          created_at, updated_at,
          ts_rank(tsv, plainto_tsquery('simple', $1)) as fts_rank
        FROM ai_items
        WHERE 
          tsv @@ plainto_tsquery('simple', $1)
          AND ($2::text IS NULL OR type = $2)
          AND embedding IS NOT NULL
        ORDER BY fts_rank DESC
        LIMIT 200
      ),
      vector_ranked AS (
        SELECT 
          *,
          1 - (embedding <-> $3::vector) as vector_similarity,
          (fts_rank * 0.3) + ((1 - (embedding <-> $3::vector)) * 0.7) as combined_score
        FROM fts_candidates
        ORDER BY combined_score DESC
      )
      SELECT 
        id, type, title, summary, tags, body,
        created_at, updated_at,
        fts_rank, vector_similarity, combined_score
      FROM vector_ranked
      LIMIT $4 OFFSET $5
    `
    
    const searchResult = await this.pool.query(searchQuery, [
      query,
      type,
      JSON.stringify(queryEmbedding),
      size,
      offset
    ])
    
    const searchTime = Date.now() - searchStart
    
    const items: SearchItem[] = searchResult.rows.map(row => ({
      id: row.id,
      type: row.type,
      title: row.title,
      summary: row.summary,
      tags: row.tags,
      body: row.body,
      score: {
        fts_rank: parseFloat(row.fts_rank) || 0,
        vector_similarity: parseFloat(row.vector_similarity) || 0,
        combined_score: parseFloat(row.combined_score) || 0
      },
      created_at: row.created_at,
      updated_at: row.updated_at
    }))
    
    return {
      items,
      total,
      stages: {
        fts_ms: searchTime - embeddingTime,
        vector_ms: embeddingTime,
        total_candidates: Math.min(200, total)
      }
    }
  }
  
  private async getAllItems(
    page: number, 
    size: number, 
    type?: string
  ): Promise<{ items: SearchItem[]; total: number }> {
    const offset = (page - 1) * size
    
    // 총 개수 조회
    const totalQuery = `
      SELECT COUNT(*) as total
      FROM ai_items
      WHERE ($1::text IS NULL OR type = $1)
    `
    const totalResult = await this.pool.query(totalQuery, [type])
    const total = parseInt(totalResult.rows[0].total)
    
    // 아이템 조회
    const itemsQuery = `
      SELECT 
        id, type, title, summary, tags, body,
        created_at, updated_at
      FROM ai_items
      WHERE ($1::text IS NULL OR type = $1)
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `
    const itemsResult = await this.pool.query(itemsQuery, [type, size, offset])
    
    const items: SearchItem[] = itemsResult.rows.map(row => ({
      id: row.id,
      type: row.type,
      title: row.title,
      summary: row.summary,
      tags: row.tags,
      body: row.body,
      score: {
        fts_rank: 0,
        vector_similarity: 0,
        combined_score: 0
      },
      created_at: row.created_at,
      updated_at: row.updated_at
    }))
    
    return { items, total }
  }
  
  async getSuggestions(query: string, limit: number = 8): Promise<any> {
    const cacheKey = `suggest:${Buffer.from(query).toString('base64').slice(0, 20)}`
    const cached = await this.redis.get(cacheKey)
    if (cached) {
      return JSON.parse(cached)
    }
    
    const suggestQuery = `
      SELECT 
        id, title, type, summary,
        CASE 
          WHEN title ILIKE '%' || $1 || '%' THEN 'title'
          WHEN summary ILIKE '%' || $1 || '%' THEN 'summary'  
          WHEN array_to_string(tags, ' ') ILIKE '%' || $1 || '%' THEN 'tags'
          ELSE 'content'
        END as match_reason,
        ts_rank(tsv, plainto_tsquery('simple', $1)) as rank
      FROM ai_items
      WHERE tsv @@ plainto_tsquery('simple', $1)
      ORDER BY rank DESC, created_at DESC
      LIMIT $2
    `
    
    const result = await this.pool.query(suggestQuery, [query, limit])
    
    const suggestions = {
      suggestions: result.rows.map(row => ({
        id: row.id,
        title: row.title,
        type: row.type,
        summary: row.summary,
        match_reason: row.match_reason
      })),
      took_ms: 0
    }
    
    // 캐싱 (10분)
    await this.redis.setex(cacheKey, 600, JSON.stringify(suggestions))
    
    return suggestions
  }
}

// =====================================================
// API 핸들러
// =====================================================

const searchService = new SearchService(pool, redis)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const params = validateSearchParams(searchParams)
    
    // Rate limiting 체크 (Redis 기반)
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const rateLimitKey = `rate_limit:search:${clientIP}`
    const currentCount = await redis.incr(rateLimitKey)
    
    if (currentCount === 1) {
      await redis.expire(rateLimitKey, 3600) // 1시간
    }
    
    if (currentCount > 1000) { // 시간당 1000회 제한
      return NextResponse.json(
        {
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: '요청 한도를 초과했습니다'
          }
        },
        { status: 429 }
      )
    }
    
    const result = await searchService.search(params)
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('Search API Error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_QUERY',
            message: error.message
          }
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: '검색 중 오류가 발생했습니다'
        }
      },
      { status: 500 }
    )
  }
}

// =====================================================
// 헬스체크 엔드포인트
// =====================================================

export async function HEAD(request: NextRequest) {
  try {
    // DB 연결 체크
    await pool.query('SELECT 1')
    
    // Redis 연결 체크
    await redis.ping()
    
    return new NextResponse(null, { status: 200 })
  } catch (error) {
    return new NextResponse(null, { status: 503 })
  }
}

// =====================================================
// 개발 환경 전용: 캐시 클리어
// =====================================================

export async function DELETE(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Not allowed in production' },
      { status: 403 }
    )
  }
  
  try {
    const { searchParams } = new URL(request.url)
    const pattern = searchParams.get('pattern') || 'search:*'
    
    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
    
    return NextResponse.json({
      message: `${keys.length} cache entries cleared`,
      pattern
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Cache clear failed' },
      { status: 500 }
    )
  }
}