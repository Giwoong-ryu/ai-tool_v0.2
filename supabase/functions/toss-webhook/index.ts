// Toss Payments Webhook Handler for Supabase Edge Functions
// Handles Toss Payments webhook events for subscription and payment processing

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

// Types
interface TossWebhookEvent {
  eventType: string
  createdAt: string
  data: {
    paymentKey: string
    orderId: string
    orderName: string
    status: string
    totalAmount: number
    currency: string
    method: string
    approvedAt?: string
    requestedAt: string
    receipt?: {
      url: string
    }
    checkout?: {
      url: string
    }
    failure?: {
      code: string
      message: string
    }
    customerName?: string
    customerEmail?: string
    vat?: number
    taxExemptionAmount?: number
  }
}

// Environment variables validation
const getEnvVar = (name: string): string => {
  const value = Deno.env.get(name)
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

// Toss Payments webhook signature validation
async function validateTossWebhook(
  webhookEvent: TossWebhookEvent,
  signature: string,
  rawBody: string
): Promise<boolean> {
  try {
    const tossSecretKey = getEnvVar('TOSS_SECRET_KEY')
    
    // Toss Payments uses Base64-encoded secret for signature validation
    const encoder = new TextEncoder()
    const data = encoder.encode(rawBody)
    const key = encoder.encode(tossSecretKey)
    
    // Create HMAC-SHA256 signature
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    
    const hashBuffer = await crypto.subtle.sign('HMAC', cryptoKey, data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashBase64 = btoa(String.fromCharCode.apply(null, hashArray))
    
    return hashBase64 === signature
    
  } catch (error) {
    console.error('Error validating Toss webhook:', error)
    return false
  }
}

// Database operations
async function handlePaymentApproved(
  supabase: any,
  event: TossWebhookEvent
): Promise<void> {
  const { paymentKey, orderId, totalAmount, approvedAt, method } = event.data
  
  // Update payment record with completion
  const { error: updateError } = await supabase
    .from('payments')
    .update({
      payment_key: paymentKey,
      status: 'completed',
      paid_at: approvedAt || new Date().toISOString(),
      payment_method: `toss_${method}`,
      updated_at: new Date().toISOString()
    })
    .eq('order_id', orderId)
  
  if (updateError) {
    throw new Error(`Failed to update payment: ${updateError.message}`)
  }
  
  // Get payment info to update subscription
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .select('user_id, amount')
    .eq('order_id', orderId)
    .single()
  
  if (paymentError) {
    throw new Error(`Failed to get payment info: ${paymentError.message}`)
  }
  
  // Extract plan type from order ID
  const planType = orderId.split('_')[0] // basic_userId_timestamp_random
  const isYearly = totalAmount > (planType === 'basic' ? 9800 : 19800) // Check if yearly payment
  
  // Calculate subscription expiry
  const expiresAt = new Date()
  if (isYearly) {
    expiresAt.setFullYear(expiresAt.getFullYear() + 1)
  } else {
    expiresAt.setMonth(expiresAt.getMonth() + 1)
  }
  
  // Update or create subscription
  const { data: existingSubscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', payment.user_id)
    .eq('status', 'active')
    .single()
  
  if (existingSubscription) {
    // Update existing subscription
    const { error: subUpdateError } = await supabase
      .from('subscriptions')
      .update({
        subscription_tier: planType,
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', existingSubscription.id)
    
    if (subUpdateError) {
      throw new Error(`Failed to update subscription: ${subUpdateError.message}`)
    }
  } else {
    // Create new subscription
    const { error: subInsertError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: payment.user_id,
        subscription_tier: planType,
        status: 'active',
        starts_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        auto_renew: true
      })
    
    if (subInsertError) {
      throw new Error(`Failed to create subscription: ${subInsertError.message}`)
    }
  }
  
  // Update user profile subscription tier
  const limits = planType === 'basic' 
    ? { monthly_searches: -1, bookmarks: -1, collections: 5 }
    : { monthly_searches: -1, bookmarks: -1, collections: -1 }
  
  const { error: profileError } = await supabase
    .from('user_profiles')
    .update({
      subscription_tier: planType,
      monthly_limit: limits.monthly_searches,
      updated_at: new Date().toISOString()
    })
    .eq('id', payment.user_id)
  
  if (profileError) {
    console.warn(`Failed to update user profile: ${profileError.message}`)
    // Don't throw error as this is not critical
  }
}

async function handlePaymentFailed(
  supabase: any,
  event: TossWebhookEvent
): Promise<void> {
  const { orderId, failure } = event.data
  
  // Update payment status to failed
  const { error } = await supabase
    .from('payments')
    .update({
      status: 'failed',
      failed_reason: failure?.message || 'Payment failed',
      updated_at: new Date().toISOString()
    })
    .eq('order_id', orderId)
  
  if (error) {
    throw new Error(`Failed to update failed payment: ${error.message}`)
  }
}

// Main webhook handler
Deno.serve(async (req) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
  
  try {
    // Initialize Supabase client
    const supabaseUrl = getEnvVar('SUPABASE_URL')
    const supabaseServiceKey = getEnvVar('SUPABASE_SERVICE_ROLE_KEY')
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get webhook signature
    const signature = req.headers.get('toss-signature') || ''
    
    if (!signature) {
      console.error('Missing Toss signature header')
      return new Response(
        JSON.stringify({ error: 'Missing signature' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    
    // Get raw body and parse JSON
    const rawBody = await req.text()
    const webhookEvent: TossWebhookEvent = JSON.parse(rawBody)
    
    // Log webhook event (development only)
    if (Deno.env.get('ENVIRONMENT') === 'development') {
      console.log('Toss Webhook Event:', {
        eventType: webhookEvent.eventType,
        orderId: webhookEvent.data.orderId,
        status: webhookEvent.data.status
      })
    }
    
    // Validate webhook signature
    const isValid = await validateTossWebhook(webhookEvent, signature, rawBody)
    
    if (!isValid) {
      console.error('Invalid Toss webhook signature')
      return new Response(
        JSON.stringify({ error: 'Invalid webhook signature' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    
    // Handle different event types
    switch (webhookEvent.eventType) {
      case 'PAYMENT_STATUS_CHANGED':
        if (webhookEvent.data.status === 'DONE') {
          await handlePaymentApproved(supabase, webhookEvent)
        } else if (webhookEvent.data.status === 'ABORTED' || webhookEvent.data.status === 'CANCELED') {
          await handlePaymentFailed(supabase, webhookEvent)
        }
        break
        
      default:
        // Log unhandled event types
        if (Deno.env.get('ENVIRONMENT') === 'development') {
          console.log('Unhandled Toss event type:', webhookEvent.eventType)
        }
    }
    
    // Return success response
    return new Response(
      JSON.stringify({ success: true, processed: webhookEvent.eventType }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )
    
  } catch (error) {
    console.error('Toss webhook error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
})

/* 
Development Testing:

1. Run `supabase start`
2. Test webhook locally:

curl -X POST 'http://127.0.0.1:54321/functions/v1/toss-webhook' \
  -H 'Authorization: Bearer [SERVICE_ROLE_KEY]' \
  -H 'Content-Type: application/json' \
  -H 'toss-signature: test-signature' \
  -d '{
    "eventType": "PAYMENT_STATUS_CHANGED",
    "createdAt": "2024-01-01T00:00:00+09:00",
    "data": {
      "paymentKey": "test-payment-key",
      "orderId": "basic_user123_1704067200000_abc123",
      "orderName": "Basic Plan (Monthly)",
      "status": "DONE",
      "totalAmount": 4900,
      "currency": "KRW",
      "method": "카드",
      "approvedAt": "2024-01-01T00:00:00+09:00",
      "requestedAt": "2024-01-01T00:00:00+09:00"
    }
  }'

Environment Variables Required:
- TOSS_SECRET_KEY (for webhook signature validation)
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- ENVIRONMENT (optional, for development logging)

Webhook URL for production:
- https://your-project.supabase.co/functions/v1/toss-webhook

Toss Payments Dashboard Setup:
1. Go to Toss Payments Dashboard > Webhooks
2. Add webhook endpoint URL
3. Select events: PAYMENT_STATUS_CHANGED
4. Save webhook configuration
*/