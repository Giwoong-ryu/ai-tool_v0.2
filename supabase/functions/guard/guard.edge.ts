// ========================================
// EasyPick 플랜/사용량 가드 엣지 함수 (Step 8)
// 목적: JWT 기반 플랜 검증 및 쿼터 강제 (sub-50ms 응답)
// ========================================

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { verify } from "https://deno.land/x/djwt@v2.8/mod.ts"

// ========================================
// Environment Configuration
// ========================================

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const JWT_SECRET = Deno.env.get('SUPABASE_JWT_SECRET')!

// ========================================
// Types & Interfaces
// ========================================

interface GuardRequest {
  action: 'compile' | 'save' | 'api_call' | 'storage_write'
  quantity?: number
  resource_type?: string
  resource_id?: string
  metadata?: Record<string, any>
}

interface ErrorResponse {
  code: string
  trace_id: string
}

interface GuardResponse {
  allowed: boolean
  code: string
  trace_id: string
  quota?: {
    current: number
    limit: number
    remaining: number
    reset_date: string
  }
  plan?: {
    id: string
    is_premium: boolean
  }
}

interface JWTPayload {
  sub: string
  email?: string
  aud: string
  exp: number
  iat: number
  iss: string
}

interface QuotaCheck {
  user_id: string
  plan_id: string
  is_premium: boolean
  quotas: {
    compiles: { used: number; limit: number; available: boolean }
    saves: { used: number; limit: number; available: boolean }
    api_calls: { used: number; limit: number; available: boolean }
  }
  quota_ok: boolean
  seconds_until_reset: number
}

// ========================================
// Security Constants
// ========================================

const ALLOWED_ACTIONS = ['compile', 'save', 'api_call', 'storage_write'] as const
const MAX_QUANTITY = 1000 // 단일 요청 최대 수량
const RATE_LIMIT_WINDOW = 60 * 1000 // 1분
const RATE_LIMIT_MAX_REQUESTS = 60 // 분당 최대 요청

// ========================================
// Global Cache & Rate Limiting
// ========================================

const quotaCache = new Map<string, { data: QuotaCheck; expires: number }>()
const rateLimitCache = new Map<string, { count: number; window: number }>()

// ========================================
// Utility Functions
// ========================================

function generateTraceId(): string {
  return `grd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function createErrorResponse(code: string, trace_id: string): ErrorResponse {
  return { code, trace_id }
}

function createSuccessResponse(data: Partial<GuardResponse>, trace_id: string): GuardResponse {
  return {
    allowed: true,
    code: 'QUOTA_OK',
    trace_id,
    ...data
  }
}

// ========================================
// Rate Limiting
// ========================================

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const key = `rate_${userId}`
  const existing = rateLimitCache.get(key)
  
  if (!existing || now - existing.window > RATE_LIMIT_WINDOW) {
    rateLimitCache.set(key, { count: 1, window: now })
    return true
  }
  
  if (existing.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false
  }
  
  existing.count++
  return true
}

// ========================================
// JWT Validation
// ========================================

async function validateJWT(authHeader: string): Promise<{ userId: string; payload: JWTPayload } | null> {
  try {
    if (!authHeader.startsWith('Bearer ')) {
      return null
    }
    
    const token = authHeader.substring(7)
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )
    
    const payload = await verify(token, key) as JWTPayload
    
    // JWT 만료 확인
    if (payload.exp * 1000 < Date.now()) {
      return null
    }
    
    // 발급자 확인
    if (!payload.iss?.includes('supabase')) {
      return null
    }
    
    return {
      userId: payload.sub,
      payload
    }
  } catch (error) {
    console.error('JWT validation error:', error)
    return null
  }
}

// ========================================
// Quota Check Functions
// ========================================

async function getQuotaStatus(userId: string, supabase: any): Promise<QuotaCheck | null> {
  const cacheKey = `quota_${userId}`
  const cached = quotaCache.get(cacheKey)
  
  // 캐시 확인 (30초 TTL)
  if (cached && cached.expires > Date.now()) {
    return cached.data
  }
  
  try {
    const { data, error } = await supabase
      .from('guard_quota_check')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (error) {
      console.error('Quota check error:', error)
      return null
    }
    
    if (!data) {
      return null
    }
    
    // 캐시 저장
    quotaCache.set(cacheKey, {
      data,
      expires: Date.now() + 30000 // 30초
    })
    
    return data
  } catch (error) {
    console.error('Quota status error:', error)
    return null
  }
}

function checkActionQuota(quotaStatus: QuotaCheck, action: string, quantity: number): boolean {
  switch (action) {
    case 'compile':
      return quotaStatus.quotas.compiles.available && 
             (quotaStatus.quotas.compiles.limit === -1 || 
              quotaStatus.quotas.compiles.used + quantity <= quotaStatus.quotas.compiles.limit)
    
    case 'save':
      return quotaStatus.quotas.saves.available && 
             (quotaStatus.quotas.saves.limit === -1 || 
              quotaStatus.quotas.saves.used + quantity <= quotaStatus.quotas.saves.limit)
    
    case 'api_call':
      return quotaStatus.quotas.api_calls.available && 
             (quotaStatus.quotas.api_calls.limit === -1 || 
              quotaStatus.quotas.api_calls.used + quantity <= quotaStatus.quotas.api_calls.limit)
    
    default:
      return false
  }
}

// ========================================
// Usage Logging
// ========================================

async function logUsageEvent(
  userId: string,
  action: string,
  quantity: number,
  metadata: Record<string, any>,
  supabase: any,
  request: Request
): Promise<boolean> {
  try {
    const { error } = await supabase.rpc('log_usage_event', {
      p_user_id: userId,
      p_event_type: action,
      p_resource_type: metadata.resource_type || null,
      p_resource_id: metadata.resource_id || null,
      p_quantity: quantity,
      p_metadata: metadata,
      p_ip_address: request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown',
      p_user_agent: request.headers.get('user-agent') || null,
      p_session_id: metadata.session_id || null
    })
    
    if (error) {
      console.error('Usage logging error:', error)
      return false
    }
    
    // 캐시 무효화
    quotaCache.delete(`quota_${userId}`)
    
    return true
  } catch (error) {
    console.error('Usage event error:', error)
    return false
  }
}

// ========================================
// Main HTTP Handler
// ========================================

Deno.serve(async (req: Request) => {
  const trace_id = generateTraceId()
  
  // CORS 처리
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: { 
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
      } 
    })
  }
  
  // POST 메서드만 허용
  if (req.method !== 'POST') {
    return new Response(JSON.stringify(createErrorResponse('METHOD_NOT_ALLOWED', trace_id)), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    })
  }
  
  try {
    // JWT 검증
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response(JSON.stringify(createErrorResponse('MISSING_AUTH', trace_id)), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    const auth = await validateJWT(authHeader)
    if (!auth) {
      return new Response(JSON.stringify(createErrorResponse('INVALID_TOKEN', trace_id)), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // Rate limiting 확인
    if (!checkRateLimit(auth.userId)) {
      return new Response(JSON.stringify(createErrorResponse('RATE_LIMIT_EXCEEDED', trace_id)), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // 요청 본문 파싱
    let guardRequest: GuardRequest
    try {
      guardRequest = await req.json()
    } catch {
      return new Response(JSON.stringify(createErrorResponse('INVALID_JSON', trace_id)), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // 요청 검증
    if (!guardRequest.action || !ALLOWED_ACTIONS.includes(guardRequest.action as any)) {
      return new Response(JSON.stringify(createErrorResponse('INVALID_ACTION', trace_id)), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    const quantity = guardRequest.quantity || 1
    if (quantity < 1 || quantity > MAX_QUANTITY) {
      return new Response(JSON.stringify(createErrorResponse('INVALID_QUANTITY', trace_id)), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // Supabase 클라이언트 초기화
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    
    // 쿼터 상태 확인
    const quotaStatus = await getQuotaStatus(auth.userId, supabase)
    if (!quotaStatus) {
      return new Response(JSON.stringify(createErrorResponse('QUOTA_CHECK_FAILED', trace_id)), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // 액션별 쿼터 확인
    const quotaAllowed = checkActionQuota(quotaStatus, guardRequest.action, quantity)
    if (!quotaAllowed) {
      // 사용량 로깅 (실패한 시도도 기록)
      await logUsageEvent(
        auth.userId,
        guardRequest.action,
        0, // 실패시 0
        { 
          ...guardRequest.metadata,
          resource_type: guardRequest.resource_type,
          resource_id: guardRequest.resource_id,
          failure_reason: 'quota_exceeded'
        },
        supabase,
        req
      )
      
      return new Response(JSON.stringify(createErrorResponse('QUOTA_EXCEEDED', trace_id)), {
        status: 402,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // 사용량 로깅 (성공)
    const logged = await logUsageEvent(
      auth.userId,
      guardRequest.action,
      quantity,
      {
        ...guardRequest.metadata,
        resource_type: guardRequest.resource_type,
        resource_id: guardRequest.resource_id
      },
      supabase,
      req
    )
    
    if (!logged) {
      return new Response(JSON.stringify(createErrorResponse('LOGGING_FAILED', trace_id)), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // 성공 응답
    const quotaInfo = quotaStatus.quotas[guardRequest.action as keyof typeof quotaStatus.quotas]
    const resetDate = new Date(Date.now() + quotaStatus.seconds_until_reset * 1000).toISOString()
    
    return new Response(JSON.stringify(createSuccessResponse({
      quota: {
        current: quotaInfo.used + quantity,
        limit: quotaInfo.limit,
        remaining: quotaInfo.limit === -1 ? -1 : Math.max(0, quotaInfo.limit - quotaInfo.used - quantity),
        reset_date: resetDate
      },
      plan: {
        id: quotaStatus.plan_id,
        is_premium: quotaStatus.is_premium
      }
    }, trace_id)), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('Guard error:', error)
    return new Response(JSON.stringify(createErrorResponse('INTERNAL_ERROR', trace_id)), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})

// ========================================
// API 문서 및 사용 예제
// ========================================

/*
환경 변수 요구사항:
- SUPABASE_URL: Supabase 프로젝트 URL
- SUPABASE_SERVICE_ROLE_KEY: 서비스 역할 키 (관리자 권한)
- SUPABASE_JWT_SECRET: JWT 서명 검증용 비밀키

보안 고려사항:
1. JWT 검증: 만료시간, 발급자, 서명 확인
2. Rate Limiting: 사용자당 분당 60회 제한
3. 최소 정보 노출: 오류 응답에서 trace_id만 제공
4. SQL Injection 방지: RPC 함수 사용
5. 캐싱: 30초 TTL로 성능 최적화

성능 목표:
- 응답 시간: <50ms (캐시 히트시 <20ms)
- 동시 사용자: 100+ 지원
- 메모리 사용량: <50MB
- 에러율: <0.1%

========================================
API 사용 예제
========================================

Guard Check Request:
POST /functions/v1/guard
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "action": "compile",
  "quantity": 1,
  "resource_type": "prompt",
  "resource_id": "prompt_123",
  "metadata": {
    "session_id": "sess_abc123",
    "feature": "prompt_launcher"
  }
}

========================================
응답 예제
========================================

Success (200):
{
  "allowed": true,
  "code": "QUOTA_OK",
  "trace_id": "grd_1705123456_abc123def",
  "quota": {
    "current": 15,
    "limit": 20,
    "remaining": 5,
    "reset_date": "2024-02-01T00:00:00.000Z"
  },
  "plan": {
    "id": "free",
    "is_premium": false
  }
}

Quota Exceeded (402):
{
  "code": "QUOTA_EXCEEDED",
  "trace_id": "grd_1705123456_def456ghi"
}

Rate Limited (429):
{
  "code": "RATE_LIMIT_EXCEEDED",
  "trace_id": "grd_1705123456_ghi789jkl"
}

Invalid Token (401):
{
  "code": "INVALID_TOKEN",
  "trace_id": "grd_1705123456_jkl012mno"
}

Invalid Request (400):
{
  "code": "INVALID_ACTION",
  "trace_id": "grd_1705123456_mno345pqr"
}

Internal Error (500):
{
  "code": "INTERNAL_ERROR",
  "trace_id": "grd_1705123456_pqr678stu"
}

========================================
클라이언트 통합 예제
========================================

// TypeScript 클라이언트 사용법
async function checkQuota(action: string, quantity = 1) {
  const response = await fetch('/functions/v1/guard', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action,
      quantity,
      metadata: { feature: 'prompt_launcher' }
    })
  })
  
  const result = await response.json()
  
  if (!response.ok) {
    if (response.status === 402) {
      // 업그레이드 유도
      showUpgradeModal(result.trace_id)
    }
    throw new Error(`Guard check failed: ${result.code}`)
  }
  
  return result
}
*/