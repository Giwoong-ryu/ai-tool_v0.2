// ========================================
// EasyPick Edge Events 수집기 (/api/events)
// Step 3: FE track() 이벤트 수집·적재 + 플랜/월 사용량 차단
// ========================================

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { securityMiddleware } from '../_middleware.ts'

// Event data structure from frontend track()
interface EventRequest {
  name: string
  params?: Record<string, any>
  ts?: string
}

// Response interfaces
interface EventResponse {
  success: boolean
  processed: number
  failed: number
  errors?: string[]
  trace_id: string
}

interface ErrorResponse {
  code: string
  trace_id: string
}

// Environment variables
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const environment = Deno.env.get('ENVIRONMENT') || 'production'

// Sampling rates for different event types
const SAMPLING_RATES = {
  'page_view': 0.1,
  'click': 0.05,
  'search': 0.2,
  'engagement': 0.1,
  // High-value events: 100% collection
  'conversion': 1.0,
  'signup': 1.0,
  'purchase': 1.0,
  'compile_prompt': 1.0,
  'workflow_run': 1.0,
  'api_call': 1.0,
  'ai_generation': 1.0
}

// Sample check
function shouldSample(eventName: string): boolean {
  const rate = SAMPLING_RATES[eventName as keyof typeof SAMPLING_RATES] ?? 1.0
  return Math.random() < rate
}

// Event validation
function validateEvent(event: any): EventRequest | null {
  if (!event || typeof event !== 'object') {
    return null
  }

  if (!event.name || typeof event.name !== 'string') {
    return null
  }

  // Sanitize event name
  const sanitizedName = event.name
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .substring(0, 50)

  return {
    name: sanitizedName,
    params: event.params && typeof event.params === 'object' ? event.params : {},
    ts: event.ts || new Date().toISOString()
  }
}

// Database logging - usage_events 테이블 사용
async function logToDatabase(
  supabase: any,
  events: EventRequest[],
  userId?: string
): Promise<{ success: number; failed: number }> {
  let success = 0
  let failed = 0

  for (const event of events) {
    try {
      const { error } = await supabase
        .from('usage_events')
        .insert({
          user_id: userId || null,
          event_type: event.name,
          resource_type: 'event',
          resource_id: null,
          quantity: 1,
          metadata: {
            ...event.params,
            frontend_timestamp: event.ts,
            processed_at: new Date().toISOString()
          },
          plan_id: 'free', // 기본값, 실제로는 사용자 플랜에서 가져와야 함
          created_at: new Date(event.ts!)
        })

      if (error) {
        console.error('Database insert error:', error)
        failed++
      } else {
        success++
      }
    } catch (error) {
      console.error('Database operation failed:', error)
      failed++
    }
  }

  return { success, failed }
}

// Main handler function
async function handleEvents(req: Request): Promise<Response> {
  const traceId = crypto.randomUUID()
  
  try {
    // Only allow POST
    if (req.method !== 'POST') {
      const errorBody: ErrorResponse = {
        code: 'METHOD_NOT_ALLOWED',
        trace_id: traceId
      }
      return new Response(JSON.stringify(errorBody), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Parse request body
    const body = await req.json().catch(() => null)
    if (!body) {
      const errorBody: ErrorResponse = {
        code: 'INVALID_REQUEST_BODY',
        trace_id: traceId
      }
      return new Response(JSON.stringify(errorBody), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Handle single event or batch
    const rawEvents = Array.isArray(body) ? body : [body]
    
    // Validate events
    const validatedEvents: EventRequest[] = []
    const errors: string[] = []

    for (const rawEvent of rawEvents) {
      const validated = validateEvent(rawEvent)
      if (validated) {
        // Apply sampling
        if (shouldSample(validated.name)) {
          validatedEvents.push(validated)
        }
      } else {
        errors.push(`Invalid event: ${JSON.stringify(rawEvent)}`)
      }
    }

    if (validatedEvents.length === 0) {
      const errorBody: ErrorResponse = {
        code: 'NO_VALID_EVENTS',
        trace_id: traceId
      }
      return new Response(JSON.stringify(errorBody), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Extract user ID from JWT if present (optional)
    let userId: string | undefined
    const authHeader = req.headers.get('Authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        // JWT 파싱 로직은 간단하게 유지 (실제로는 guard.edge.ts에서 처리)
        const token = authHeader.substring(7)
        const payload = JSON.parse(atob(token.split('.')[1]))
        userId = payload.sub
      } catch {
        // JWT 파싱 실패는 무시 (익명 이벤트 허용)
      }
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Log to database
    const dbResult = await logToDatabase(supabase, validatedEvents, userId)

    // Sampling log (development only)
    if (environment === 'development') {
      console.log('Events processed:', {
        total_received: rawEvents.length,
        validated: validatedEvents.length,
        sampled: validatedEvents.length,
        db_success: dbResult.success,
        db_failed: dbResult.failed,
        user_id: userId
      })
    }

    // Return response
    const response: EventResponse = {
      success: dbResult.failed === 0,
      processed: dbResult.success,
      failed: dbResult.failed,
      errors: errors.length > 0 ? errors : undefined,
      trace_id: traceId
    }

    const status = dbResult.failed === 0 ? 200 : (dbResult.success > 0 ? 207 : 400)

    return new Response(JSON.stringify(response), {
      status,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Events handler error:', error)
    
    const errorBody: ErrorResponse = {
      code: 'INTERNAL_SERVER_ERROR',
      trace_id: traceId
    }
    
    return new Response(JSON.stringify(errorBody), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// Export handler with middleware
Deno.serve((req: Request) => {
  return securityMiddleware(req, handleEvents)
})

/* 
========================================
USAGE EXAMPLES
========================================

1. Single Event:
POST /functions/v1/events
Content-Type: application/json
Authorization: Bearer <optional-jwt>

{
  "name": "page_view",
  "params": {
    "page": "/tools",
    "referrer": "google.com"
  },
  "ts": "2024-01-15T10:30:00.000Z"
}

2. Batch Events:
POST /functions/v1/events
Content-Type: application/json
Authorization: Bearer <optional-jwt>

[
  {
    "name": "compile_prompt",
    "params": {
      "template_id": "blog_writer",
      "model": "gpt-4"
    }
  },
  {
    "name": "workflow_run",
    "params": {
      "workflow_id": "content_creation"
    }
  }
]

3. With Idempotency Key:
POST /functions/v1/events
Content-Type: application/json
X-Idempotency-Key: unique_key_123
Authorization: Bearer <optional-jwt>

{
  "name": "purchase",
  "params": {
    "plan": "pro",
    "amount": 29000
  }
}

========================================
RESPONSES
========================================

Success (200):
{
  "success": true,
  "processed": 2,
  "failed": 0,
  "trace_id": "uuid-trace-id"
}

Partial Success (207):
{
  "success": false,
  "processed": 1,
  "failed": 1,
  "errors": ["Invalid event: {...}"],
  "trace_id": "uuid-trace-id"
}

Error (400/500):
{
  "code": "NO_VALID_EVENTS",
  "trace_id": "uuid-trace-id"
}
*/