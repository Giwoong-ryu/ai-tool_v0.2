// backend/server.js
const express = require('express')
const cors = require('cors')
const axios = require('axios')
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 3001

// Supabase 클라이언트 초기화
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // 서비스 롤 키 사용
)

// 미들웨어
app.use(cors({
  origin: ['http://localhost:5173', 'https://your-domain.com'],
  credentials: true
}))
app.use(express.json())

// 토스페이먼츠 결제 승인 API
app.post('/api/payments/toss/confirm', async (req, res) => {
  try {
    const { paymentKey, orderId, amount } = req.body
    
    // 1. 주문 정보 확인
    const { data: order, error: orderError } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .single()

    if (orderError || !order) {
      return res.status(404).json({ 
        success: false, 
        message: '주문을 찾을 수 없습니다.' 
      })
    }

    // 2. 금액 검증
    if (order.amount !== amount) {
      return res.status(400).json({ 
        success: false, 
        message: '결제 금액이 일치하지 않습니다.' 
      })
    }

    // 3. 토스페이먼츠 결제 승인 API 호출
    const tossResponse = await axios.post(
      'https://api.tosspayments.com/v1/payments/confirm',
      {
        paymentKey,
        orderId,
        amount
      },
      {
        headers: {
          'Authorization': `Basic ${Buffer.from(process.env.TOSS_SECRET_KEY + ':').toString('base64')}`,
          'Content-Type': 'application/json'
        }
      }
    )

    const paymentData = tossResponse.data

    // 4. 결제 성공 처리
    if (paymentData.status === 'DONE') {
      // 결제 정보 업데이트
      const { error: updateError } = await supabase
        .from('payments')
        .update({
          payment_key: paymentKey,
          status: 'completed',
          paid_at: new Date().toISOString(),
          toss_payment_data: paymentData
        })
        .eq('order_id', orderId)

      if (updateError) throw updateError

      // 구독 정보 업데이트
      await updateUserSubscription(order.user_id, order.plan_type, order.billing_cycle)

      res.json({ 
        success: true, 
        payment: paymentData,
        message: '결제가 성공적으로 완료되었습니다.' 
      })
    } else {
      throw new Error('결제 승인 실패')
    }

  } catch (error) {
    console.error('Toss payment confirmation error:', error)
    
    // 결제 실패 처리
    if (req.body.orderId) {
      await supabase
        .from('payments')
        .update({
          status: 'failed',
          failed_reason: error.response?.data?.message || error.message,
          failed_at: new Date().toISOString()
        })
        .eq('order_id', req.body.orderId)
    }

    res.status(400).json({ 
      success: false, 
      message: error.response?.data?.message || error.message 
    })
  }
})

// PayPal 결제 확인 API
app.post('/api/payments/paypal/confirm', async (req, res) => {
  try {
    const { paypalOrderId, orderId } = req.body
    
    // 1. 주문 정보 확인
    const { data: order, error: orderError } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .single()

    if (orderError || !order) {
      return res.status(404).json({ 
        success: false, 
        message: '주문을 찾을 수 없습니다.' 
      })
    }

    // 2. PayPal 주문 정보 확인
    const paypalResponse = await axios.get(
      `https://api-m.sandbox.paypal.com/v2/checkout/orders/${paypalOrderId}`,
      {
        headers: {
          'Authorization': `Bearer ${await getPayPalAccessToken()}`,
          'Content-Type': 'application/json'
        }
      }
    )

    const paypalOrder = paypalResponse.data

    // 3. 결제 상태 확인
    if (paypalOrder.status === 'COMPLETED') {
      // 결제 정보 업데이트
      const { error: updateError } = await supabase
        .from('payments')
        .update({
          payment_key: paypalOrderId,
          status: 'completed',
          paid_at: new Date().toISOString(),
          paypal_order_data: paypalOrder
        })
        .eq('order_id', orderId)

      if (updateError) throw updateError

      // 구독 정보 업데이트
      await updateUserSubscription(order.user_id, order.plan_type, order.billing_cycle)

      res.json({ 
        success: true, 
        order: paypalOrder,
        message: '결제가 성공적으로 완료되었습니다.' 
      })
    } else {
      throw new Error('PayPal 결제가 완료되지 않았습니다.')
    }

  } catch (error) {
    console.error('PayPal payment confirmation error:', error)
    
    // 결제 실패 처리
    if (req.body.orderId) {
      await supabase
        .from('payments')
        .update({
          status: 'failed',
          failed_reason: error.message,
          failed_at: new Date().toISOString()
        })
        .eq('order_id', req.body.orderId)
    }

    res.status(400).json({ 
      success: false, 
      message: error.message 
    })
  }
})

// PayPal 액세스 토큰 가져오기
async function getPayPalAccessToken() {
  try {
    const response = await axios.post(
      'https://api-m.sandbox.paypal.com/v1/oauth2/token',
      'grant_type=client_credentials',
      {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    )
    return response.data.access_token
  } catch (error) {
    console.error('PayPal token error:', error)
    throw error
  }
}

// 구독 정보 업데이트 함수
async function updateUserSubscription(userId, planType, billingCycle) {
  try {
    const expiresAt = new Date()
    const isYearly = billingCycle === 'yearly'
    expiresAt.setMonth(expiresAt.getMonth() + (isYearly ? 12 : 1))

    // 기존 활성 구독 확인
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (existingSubscription) {
      // 기존 구독 업데이트
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          subscription_tier: planType,
          expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSubscription.id)

      if (updateError) throw updateError
    } else {
      // 새 구독 생성
      const { error: insertError } = await supabase
        .from('subscriptions')
        .insert([{
          user_id: userId,
          subscription_tier: planType,
          status: 'active',
          starts_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          auto_renew: true
        }])

      if (insertError) throw insertError
    }

    // 사용자 프로필 업데이트
    const planLimits = {
      basic: { monthly_searches: -1, bookmarks: -1, collections: 5 },
      pro: { monthly_searches: -1, bookmarks: -1, collections: -1 }
    }

    const limits = planLimits[planType] || planLimits.basic

    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({
        subscription_tier: planType,
        monthly_limit: limits.monthly_searches,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (profileError) throw profileError

  } catch (error) {
    console.error('Update subscription error:', error)
    throw error
  }
}

// 나머지 API 엔드포인트들...
app.post('/api/subscriptions/cancel', async (req, res) => {
  try {
    const { userId } = req.body
    
    if (!userId) {
      return res.status(400).json({ success: false, message: '사용자 ID가 필요합니다.' })
    }

    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        auto_renew: false,
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('status', 'active')

    if (error) throw error

    await supabase
      .from('user_profiles')
      .update({
        subscription_tier: 'free',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    res.json({ 
      success: true, 
      message: '구독이 취소되었습니다.' 
    })

  } catch (error) {
    console.error('Cancel subscription error:', error)
    res.status(500).json({ 
      success: false, 
      message: '구독 취소 중 오류가 발생했습니다.' 
    })
  }
})

app.get('/api/payments/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params
    
    const { data, error } = await supabase
      .from('payments')
      .select(`*`)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    res.json({ success: true, payments: data || [] })

  } catch (error) {
    console.error('Get payment history error:', error)
    res.status(500).json({ 
      success: false, 
      message: '결제 내역 조회 중 오류가 발생했습니다.' 
    })
  }
})

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  })
})

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`)
})