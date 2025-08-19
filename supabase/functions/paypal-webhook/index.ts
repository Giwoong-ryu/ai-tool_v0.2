// PayPal Webhook Handler for Supabase Edge Functions
// Handles PayPal IPN/REST webhook events for subscription and payment processing

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

// Types
interface PayPalWebhookEvent {
  id: string
  event_type: string
  resource_type: string
  summary: string
  resource: {
    id: string
    state?: string
    amount?: {
      total: string
      currency: string
    }
    billing_agreement_id?: string
    subscription_id?: string
    custom_id?: string
  }
  create_time: string
  event_version: string
}

interface WebhookHeaders {
  'paypal-transmission-id': string
  'paypal-cert-id': string
  'paypal-auth-algo': string
  'paypal-transmission-sig': string
  'paypal-transmission-time': string
}

// Environment variables validation
const getEnvVar = (name: string): string => {
  const value = Deno.env.get(name)
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

// PayPal webhook signature validation
async function validatePayPalWebhook(
  webhookEvent: PayPalWebhookEvent,
  headers: WebhookHeaders,
  rawBody: string
): Promise<boolean> {
  try {
    const paypalClientId = getEnvVar('PAYPAL_CLIENT_ID')
    const paypalClientSecret = getEnvVar('PAYPAL_CLIENT_SECRET')
    const webhookId = getEnvVar('PAYPAL_WEBHOOK_ID')
    
    // PayPal webhook verification endpoint
    const verifyUrl = Deno.env.get('PAYPAL_BASE_URL') || 'https://api-m.sandbox.paypal.com'
    
    // Get access token
    const tokenResponse = await fetch(`${verifyUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'en_US',
        'Authorization': `Basic ${btoa(`${paypalClientId}:${paypalClientSecret}`)}`
      },
      body: 'grant_type=client_credentials'
    })
    
    if (!tokenResponse.ok) {
      console.error('Failed to get PayPal access token')
      return false
    }
    
    const tokenData = await tokenResponse.json()
    
    // Verify webhook signature
    const verifyPayload = {
      transmission_id: headers['paypal-transmission-id'],
      cert_id: headers['paypal-cert-id'],
      auth_algo: headers['paypal-auth-algo'],
      transmission_sig: headers['paypal-transmission-sig'],
      transmission_time: headers['paypal-transmission-time'],
      webhook_id: webhookId,
      webhook_event: webhookEvent
    }
    
    const verifyResponse = await fetch(`${verifyUrl}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenData.access_token}`
      },
      body: JSON.stringify(verifyPayload)
    })
    
    if (!verifyResponse.ok) {
      console.error('PayPal signature verification failed')
      return false
    }
    
    const verifyData = await verifyResponse.json()
    return verifyData.verification_status === 'SUCCESS'
    
  } catch (error) {
    console.error('Error validating PayPal webhook:', error)
    return false
  }
}

// Database operations
async function handleSubscriptionActivated(
  supabase: any,
  event: PayPalWebhookEvent
): Promise<void> {
  const subscriptionId = event.resource.id
  const customId = event.resource.custom_id // User ID
  
  if (!customId) {
    throw new Error('Missing custom_id in subscription event')
  }
  
  // Update or insert subscription
  const { error } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: customId,
      subscription_tier: 'pro', // Determine tier based on plan
      status: 'active',
      starts_at: new Date(event.create_time),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      auto_renew: true,
      updated_at: new Date()
    }, {
      onConflict: 'user_id'
    })
  
  if (error) {
    throw new Error(`Failed to update subscription: ${error.message}`)
  }
  
  // Update user profile subscription tier
  const { error: profileError } = await supabase
    .from('user_profiles')
    .update({
      subscription_tier: 'pro',
      updated_at: new Date()
    })
    .eq('id', customId)
  
  if (profileError) {
    throw new Error(`Failed to update user profile: ${profileError.message}`)
  }
}

async function handlePaymentCompleted(
  supabase: any,
  event: PayPalWebhookEvent
): Promise<void> {
  const paymentId = event.resource.id
  const amount = event.resource.amount
  const billingAgreementId = event.resource.billing_agreement_id
  
  if (!amount) {
    throw new Error('Missing amount in payment event')
  }
  
  // Insert payment record
  const { error } = await supabase
    .from('payments')
    .insert({
      payment_key: paymentId,
      amount: Math.round(parseFloat(amount.total) * 100), // Convert to cents
      currency: amount.currency,
      payment_method: 'paypal',
      status: 'completed',
      paid_at: new Date(event.create_time)
    })
  
  if (error) {
    throw new Error(`Failed to insert payment: ${error.message}`)
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
    
    // Get webhook headers
    const headers = {
      'paypal-transmission-id': req.headers.get('paypal-transmission-id') || '',
      'paypal-cert-id': req.headers.get('paypal-cert-id') || '',
      'paypal-auth-algo': req.headers.get('paypal-auth-algo') || '',
      'paypal-transmission-sig': req.headers.get('paypal-transmission-sig') || '',
      'paypal-transmission-time': req.headers.get('paypal-transmission-time') || ''
    } as WebhookHeaders
    
    // Get raw body and parse JSON
    const rawBody = await req.text()
    const webhookEvent: PayPalWebhookEvent = JSON.parse(rawBody)
    
    // Log webhook event (development only)
    if (Deno.env.get('ENVIRONMENT') === 'development') {
      console.log('PayPal Webhook Event:', {
        id: webhookEvent.id,
        type: webhookEvent.event_type,
        resource_type: webhookEvent.resource_type
      })
    }
    
    // Validate webhook signature
    const isValid = await validatePayPalWebhook(webhookEvent, headers, rawBody)
    
    if (!isValid) {
      console.error('Invalid PayPal webhook signature')
      return new Response(
        JSON.stringify({ error: 'Invalid webhook signature' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    
    // Handle different event types
    switch (webhookEvent.event_type) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        await handleSubscriptionActivated(supabase, webhookEvent)
        break
        
      case 'PAYMENT.SALE.COMPLETED':
        await handlePaymentCompleted(supabase, webhookEvent)
        break
        
      case 'BILLING.SUBSCRIPTION.CANCELLED':
      case 'BILLING.SUBSCRIPTION.SUSPENDED':
        // Handle subscription cancellation/suspension
        const customId = webhookEvent.resource.custom_id
        if (customId) {
          await supabase
            .from('subscriptions')
            .update({
              status: webhookEvent.event_type.includes('CANCELLED') ? 'cancelled' : 'suspended',
              updated_at: new Date()
            })
            .eq('user_id', customId)
        }
        break
        
      default:
        // Log unhandled event types
        if (Deno.env.get('ENVIRONMENT') === 'development') {
          console.log('Unhandled PayPal event type:', webhookEvent.event_type)
        }
    }
    
    // Return success response
    return new Response(
      JSON.stringify({ success: true, processed: webhookEvent.event_type }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )
    
  } catch (error) {
    console.error('PayPal webhook error:', error)
    
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

curl -X POST 'http://127.0.0.1:54321/functions/v1/paypal-webhook' \
  -H 'Authorization: Bearer [SERVICE_ROLE_KEY]' \
  -H 'Content-Type: application/json' \
  -H 'paypal-transmission-id: test-id' \
  -H 'paypal-cert-id: test-cert' \
  -H 'paypal-auth-algo: SHA256withRSA' \
  -H 'paypal-transmission-sig: test-sig' \
  -H 'paypal-transmission-time: 2024-01-01T00:00:00Z' \
  -d '{
    "id": "test-event-id",
    "event_type": "BILLING.SUBSCRIPTION.ACTIVATED",
    "resource_type": "subscription",
    "summary": "Test subscription activated",
    "resource": {
      "id": "test-subscription-id",
      "custom_id": "user-uuid-here"
    },
    "create_time": "2024-01-01T00:00:00Z",
    "event_version": "1.0"
  }'

Environment Variables Required:
- PAYPAL_CLIENT_ID
- PAYPAL_CLIENT_SECRET  
- PAYPAL_WEBHOOK_ID
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- PAYPAL_BASE_URL (optional, defaults to sandbox)
- ENVIRONMENT (optional, for development logging)
*/
