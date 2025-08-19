// ========================================
// Supabase Edge Functions Common Middleware
// Security, CORS, Error Handling, and Rate Limiting
// ========================================

import "jsr:@supabase/functions-js/edge-runtime.d.ts"

// Environment variables
const ENVIRONMENT = Deno.env.get('ENVIRONMENT') || 'production'
const CORS_ORIGINS = Deno.env.get('CORS_ORIGINS')?.split(',') || [
  'https://easypick.ai',
  'https://www.easypick.ai'
]
const RATE_LIMIT_MAX = parseInt(Deno.env.get('RATE_LIMIT_MAX_REQUESTS') || '100')
const RATE_LIMIT_WINDOW = parseInt(Deno.env.get('RATE_LIMIT_WINDOW_MS') || '60000')

// In-memory rate limit store (use Redis in production)
const rateLimitStore = new Map<string, { count: number, resetTime: number }>()

// Security event logger
interface SecurityEvent {
  type: 'AUTH_FAILED' | 'RATE_LIMITED' | 'CORS_BLOCKED' | 'SIGNATURE_INVALID' | 'WEBHOOK_FAILED'
  source: string
  ip?: string
  userAgent?: string
  details?: Record<string, any>
  timestamp: string
  traceId: string
}

class SecurityLogger {
  private events: SecurityEvent[] = []

  log(event: Omit<SecurityEvent, 'timestamp' | 'traceId'>) {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: new Date().toISOString(),
      traceId: crypto.randomUUID()
    }

    this.events.push(securityEvent)

    // In development, log to console
    if (ENVIRONMENT === 'development') {
      console.warn('🚨 Security Event:', securityEvent)
    }

    // In production, send to monitoring service
    if (ENVIRONMENT === 'production') {
      this.sendToMonitoring(securityEvent)
    }

    // Keep only last 1000 events in memory
    if (this.events.length > 1000) {
      this.events.splice(0, this.events.length - 1000)
    }
  }

  private async sendToMonitoring(event: SecurityEvent) {
    try {
      // Send to external monitoring service (Sentry, DataDog, etc.)
      const sentryDsn = Deno.env.get('SENTRY_DSN')
      if (sentryDsn) {
        // Implement Sentry logging here
        console.log('Security event sent to monitoring:', event.traceId)
      }
    } catch (error) {
      console.error('Failed to send security event to monitoring:', error)
    }
  }

  getRecentEvents(limit: number = 50): SecurityEvent[] {
    return this.events.slice(-limit)
  }
}

const securityLogger = new SecurityLogger()

// CORS configuration
function getCorsHeaders(origin: string | null): HeadersInit {
  const allowedOrigin = origin && CORS_ORIGINS.includes(origin) ? origin : CORS_ORIGINS[0]
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-idempotency-key, paypal-transmission-id, paypal-cert-id, paypal-auth-algo, paypal-transmission-sig, paypal-transmission-time',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  }
}

// Rate limiting
function checkRateLimit(identifier: string): { allowed: boolean, remaining: number } {
  const now = Date.now()
  const record = rateLimitStore.get(identifier)

  if (!record || now > record.resetTime) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 }
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0 }
  }

  record.count++
  return { allowed: true, remaining: RATE_LIMIT_MAX - record.count }
}

// Error masking for production
function maskError(error: any, traceId: string): { error: string, traceId: string, details?: any } {
  const isDevelopment = ENVIRONMENT === 'development'
  
  if (isDevelopment) {
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
      traceId,
      details: error instanceof Error ? error.stack : error
    }
  }

  // Production: mask sensitive details
  const errorType = error instanceof Error ? error.constructor.name : 'ServerError'
  
  const errorMap: Record<string, string> = {
    'TypeError': 'Invalid request format',
    'ReferenceError': 'Service temporarily unavailable',
    'SyntaxError': 'Invalid request format',
    'ValidationError': 'Request validation failed',
    'AuthenticationError': 'Authentication failed',
    'AuthorizationError': 'Access denied',
    'RateLimitError': 'Too many requests',
    'WebhookError': 'Webhook processing failed'
  }

  return {
    error: errorMap[errorType] || 'Internal server error',
    traceId
  }
}

// PII masking for logs
function maskPII(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data
  }

  const sensitiveFields = [
    'email', 'phone', 'ssn', 'password', 'token', 'secret', 'key',
    'credit_card', 'cvv', 'expiry', 'bank_account', 'routing',
    'first_name', 'last_name', 'full_name', 'address', 'ip_address'
  ]

  const masked = { ...data }
  
  for (const [key, value] of Object.entries(masked)) {
    const lowercaseKey = key.toLowerCase()
    
    if (sensitiveFields.some(field => lowercaseKey.includes(field))) {
      if (typeof value === 'string') {
        masked[key] = value.length > 4 ? `${value.substring(0, 2)}***${value.substring(value.length - 2)}` : '***'
      } else {
        masked[key] = '***'
      }
    } else if (typeof value === 'object') {
      masked[key] = maskPII(value)
    }
  }

  return masked
}

// Webhook signature validation utilities
export async function validatePayPalSignature(
  headers: Headers,
  body: string,
  webhookId: string
): Promise<boolean> {
  try {
    const transmissionId = headers.get('paypal-transmission-id')
    const certId = headers.get('paypal-cert-id')
    const authAlgo = headers.get('paypal-auth-algo')
    const transmissionSig = headers.get('paypal-transmission-sig')
    const transmissionTime = headers.get('paypal-transmission-time')

    if (!transmissionId || !certId || !authAlgo || !transmissionSig || !transmissionTime) {
      return false
    }

    const paypalClientId = Deno.env.get('PAYPAL_CLIENT_ID')
    const paypalClientSecret = Deno.env.get('PAYPAL_CLIENT_SECRET')
    const paypalBaseUrl = Deno.env.get('PAYPAL_BASE_URL') || 'https://api-m.sandbox.paypal.com'

    if (!paypalClientId || !paypalClientSecret) {
      throw new Error('PayPal credentials not configured')
    }

    // Get access token
    const tokenResponse = await fetch(`${paypalBaseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'en_US',
        'Authorization': `Basic ${btoa(`${paypalClientId}:${paypalClientSecret}`)}`
      },
      body: 'grant_type=client_credentials'
    })

    if (!tokenResponse.ok) {
      return false
    }

    const tokenData = await tokenResponse.json()

    // Verify signature
    const verifyPayload = {
      transmission_id: transmissionId,
      cert_id: certId,
      auth_algo: authAlgo,
      transmission_sig: transmissionSig,
      transmission_time: transmissionTime,
      webhook_id: webhookId,
      webhook_event: JSON.parse(body)
    }

    const verifyResponse = await fetch(`${paypalBaseUrl}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenData.access_token}`
      },
      body: JSON.stringify(verifyPayload)
    })

    if (!verifyResponse.ok) {
      return false
    }

    const verifyData = await verifyResponse.json()
    return verifyData.verification_status === 'SUCCESS'

  } catch (error) {
    console.error('PayPal signature validation error:', error)
    return false
  }
}

export async function validateTossSignature(
  headers: Headers,
  body: string
): Promise<boolean> {
  try {
    const tossSignature = headers.get('toss-signature')
    const tossWebhookSecret = Deno.env.get('TOSS_WEBHOOK_SECRET')

    if (!tossSignature || !tossWebhookSecret) {
      return false
    }

    // Verify HMAC-SHA256 signature
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(tossWebhookSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )

    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(body))
    const expectedSignature = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    return tossSignature.toLowerCase() === expectedSignature.toLowerCase()

  } catch (error) {
    console.error('Toss signature validation error:', error)
    return false
  }
}

// Idempotency key handling
const idempotencyStore = new Map<string, { response: any, timestamp: number }>()

function checkIdempotency(key: string): { exists: boolean, response?: any } {
  const record = idempotencyStore.get(key)
  
  if (!record) {
    return { exists: false }
  }
  
  // Expire after 24 hours
  if (Date.now() - record.timestamp > 24 * 60 * 60 * 1000) {
    idempotencyStore.delete(key)
    return { exists: false }
  }
  
  return { exists: true, response: record.response }
}

function storeIdempotentResponse(key: string, response: any) {
  idempotencyStore.set(key, {
    response,
    timestamp: Date.now()
  })
  
  // Clean up old entries periodically
  if (idempotencyStore.size > 10000) {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000
    for (const [k, v] of idempotencyStore.entries()) {
      if (v.timestamp < cutoff) {
        idempotencyStore.delete(k)
      }
    }
  }
}

// Main middleware function
export async function securityMiddleware(
  req: Request,
  handler: (req: Request) => Promise<Response>
): Promise<Response> {
  const traceId = crypto.randomUUID()
  const startTime = Date.now()
  
  try {
    // Add trace ID to request for logging
    ;(req as any).traceId = traceId

    // CORS preflight handling
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: getCorsHeaders(req.headers.get('origin'))
      })
    }

    // CORS validation
    const origin = req.headers.get('origin')
    if (origin && !CORS_ORIGINS.includes(origin)) {
      securityLogger.log({
        type: 'CORS_BLOCKED',
        source: 'middleware',
        ip: req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for'),
        userAgent: req.headers.get('user-agent'),
        details: { origin, allowedOrigins: CORS_ORIGINS }
      })

      return new Response(
        JSON.stringify(maskError(new Error('CORS policy violation'), traceId)),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            ...getCorsHeaders(origin)
          }
        }
      )
    }

    // Rate limiting
    const clientIP = req.headers.get('cf-connecting-ip') || 
                     req.headers.get('x-forwarded-for') || 
                     'unknown'
    
    const rateLimitResult = checkRateLimit(clientIP)
    
    if (!rateLimitResult.allowed) {
      securityLogger.log({
        type: 'RATE_LIMITED',
        source: 'middleware',
        ip: clientIP,
        userAgent: req.headers.get('user-agent'),
        details: { limit: RATE_LIMIT_MAX, window: RATE_LIMIT_WINDOW }
      })

      return new Response(
        JSON.stringify(maskError(new Error('Rate limit exceeded'), traceId)),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': RATE_LIMIT_MAX.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': Math.ceil((Date.now() + RATE_LIMIT_WINDOW) / 1000).toString(),
            'Retry-After': Math.ceil(RATE_LIMIT_WINDOW / 1000).toString(),
            ...getCorsHeaders(origin)
          }
        }
      )
    }

    // Idempotency handling
    const idempotencyKey = req.headers.get('x-idempotency-key')
    if (idempotencyKey && req.method === 'POST') {
      const idempotencyResult = checkIdempotency(idempotencyKey)
      if (idempotencyResult.exists) {
        return new Response(
          JSON.stringify(idempotencyResult.response),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'X-Idempotency-Hit': 'true',
              ...getCorsHeaders(origin)
            }
          }
        )
      }
    }

    // Call the actual handler
    const response = await handler(req)

    // Store successful response for idempotency
    if (idempotencyKey && response.status < 400) {
      const responseBody = await response.text()
      storeIdempotentResponse(idempotencyKey, JSON.parse(responseBody || '{}'))
      
      // Return new response with the same body
      return new Response(responseBody, {
        status: response.status,
        headers: {
          ...Object.fromEntries(response.headers.entries()),
          'X-Idempotency-Stored': 'true',
          ...getCorsHeaders(origin)
        }
      })
    }

    // Add CORS headers to response
    const responseHeaders = new Headers(response.headers)
    Object.entries(getCorsHeaders(origin)).forEach(([key, value]) => {
      responseHeaders.set(key, value)
    })

    // Add security headers
    responseHeaders.set('X-Content-Type-Options', 'nosniff')
    responseHeaders.set('X-Frame-Options', 'DENY')
    responseHeaders.set('X-XSS-Protection', '1; mode=block')
    responseHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    
    // Add trace ID for debugging
    responseHeaders.set('X-Trace-ID', traceId)
    responseHeaders.set('X-Response-Time', `${Date.now() - startTime}ms`)

    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders
    })

  } catch (error) {
    securityLogger.log({
      type: 'WEBHOOK_FAILED',
      source: 'middleware',
      ip: req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for'),
      userAgent: req.headers.get('user-agent'),
      details: maskPII({
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })
    })

    return new Response(
      JSON.stringify(maskError(error, traceId)),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'X-Trace-ID': traceId,
          ...getCorsHeaders(req.headers.get('origin'))
        }
      }
    )
  }
}

// Export utilities
export { securityLogger, maskPII, maskError }

// Health check endpoint
export function createHealthCheck() {
  return async (req: Request): Promise<Response> => {
    const healthToken = Deno.env.get('HEALTH_CHECK_TOKEN')
    const providedToken = req.headers.get('authorization')?.replace('Bearer ', '')
    
    if (healthToken && providedToken !== healthToken) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: ENVIRONMENT,
      uptime: performance.now(),
      memory: Deno.memoryUsage ? Deno.memoryUsage() : undefined,
      rateLimitEntries: rateLimitStore.size,
      idempotencyEntries: idempotencyStore.size,
      recentSecurityEvents: securityLogger.getRecentEvents(10)
    }

    return new Response(JSON.stringify(health), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}