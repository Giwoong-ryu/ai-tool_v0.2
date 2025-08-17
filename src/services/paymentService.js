// src/services/paymentService.js - 토스페이먼츠 통합 버전
import { supabase } from '../lib/supabase.js'
import toast from 'react-hot-toast'

export class PaymentService {
  // 구독 플랜 정의
  static PLANS = {
    basic: {
      name: 'Basic',
      price: 4900,
      currency: 'KRW',
      features: [
        '무제한 검색',
        '고급 필터링',
        '무제한 북마크',
        '사용 통계',
        '이메일 지원'
      ],
      limits: {
        monthly_searches: -1,
        bookmarks: -1,
        collections: 5
      }
    },
    pro: {
      name: 'Pro',
      price: 9900,
      currency: 'KRW',
      features: [
        'Basic 모든 기능',
        'AI 추천',
        '무제한 컬렉션',
        '우선 지원',
        '월간 트렌드 리포트',
        'API 액세스 (베타)'
      ],
      limits: {
        monthly_searches: -1,
        bookmarks: -1,
        collections: -1
      }
    }
  }

  // 결제 요청 생성
  static async createPayment(userId, planType, billingCycle = 'monthly') {
    try {
      const plan = this.PLANS[planType]
      if (!plan) {
        throw new Error('Invalid plan type')
      }

      // 연간 결제시 20% 할인
      const amount = billingCycle === 'yearly' 
        ? Math.floor(plan.price * 12 * 0.8) 
        : plan.price

      const orderId = this.generateOrderId(userId, planType)
      
      // 결제 정보를 DB에 저장
      const { data: payment, error } = await supabase
        .from('payments')
        .insert([{
          user_id: userId,
          amount: amount,
          currency: 'KRW',
          payment_method: 'toss',
          order_id: orderId,
          status: 'pending'
        }])
        .select()
        .single()

      if (error) throw error

      return {
        payment,
        paymentData: {
          amount: amount,
          orderId: orderId,
          orderName: `${plan.name} Plan (${billingCycle === 'yearly' ? 'Annual' : 'Monthly'})`,
          currency: 'KRW'
        }
      }
    } catch (error) {
      console.error('Create payment error:', error)
      toast.error('결제 요청 생성 중 오류가 발생했습니다.')
      throw error
    }
  }

  // 토스페이먼츠 결제 요청
  static async requestTossPayment(paymentData) {
    try {
      // 토스페이먼츠 SDK 로드
      if (!window.TossPayments) {
        await this.loadTossScript()
      }

      const tossPayments = window.TossPayments(import.meta.env.VITE_TOSS_CLIENT_KEY)

      // 결제 요청 (await 제거 - 리다이렉트되므로 기다리지 않음)
      tossPayments.requestPayment('카드', {
        amount: paymentData.amount,
        orderId: paymentData.orderId,
        orderName: paymentData.orderName,
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
        customerName: '고객',
        customerEmail: 'customer@example.com',
      })

    } catch (error) {
      console.error('Toss payment request error:', error)
      
      if (error.code === 'USER_CANCEL') {
        toast.info('결제가 취소되었습니다.')
      } else {
        toast.error('결제 요청 중 오류가 발생했습니다.')
      }
      throw error
    }
  }

  // 토스페이먼츠 SDK 로드
  static async loadTossScript() {
    return new Promise((resolve, reject) => {
      if (window.TossPayments) {
        resolve()
        return
      }

      const script = document.createElement('script')
      script.src = 'https://js.tosspayments.com/v1/payment'
      script.onload = resolve
      script.onerror = reject
      document.head.appendChild(script)
    })
  }

  // 결제 성공 처리 (웹훅이나 리다이렉트에서 호출)
  static async confirmPayment(paymentKey, orderId, amount) {
    try {
      console.log('결제 확인 시작:', { paymentKey, orderId, amount })
      
      // 임시로 DB만 업데이트 (실제로는 백엔드에서 토스 API 호출 후 처리)
      const { error: updateError } = await supabase
        .from('payments')
        .update({
          payment_key: paymentKey,
          status: 'completed',
          paid_at: new Date().toISOString()
        })
        .eq('order_id', orderId)

      if (updateError) {
        console.error('DB 업데이트 오류:', updateError)
        throw updateError
      }

      // 구독 정보 생성/업데이트
      await this.updateSubscription(orderId)

      console.log('결제 확인 완료')
      return { success: true, paymentResult: { paymentKey, orderId, amount } }

    } catch (error) {
      console.error('Payment confirmation error:', error)
      
      // 결제 실패 상태 업데이트
      try {
        await supabase
          .from('payments')
          .update({
            status: 'failed',
            failed_reason: error.message
          })
          .eq('order_id', orderId)
      } catch (updateError) {
        console.error('실패 상태 업데이트 오류:', updateError)
      }

      throw error
    }
  }

  // 구독 정보 업데이트
  static async updateSubscription(orderId) {
    try {
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .select('*')
        .eq('order_id', orderId)
        .single()

      if (paymentError) throw paymentError

      const planType = this.extractPlanFromOrderId(orderId)
      const plan = this.PLANS[planType]

      if (!plan) throw new Error('Invalid plan type')

      const expiresAt = new Date()
      const isYearly = payment.amount > plan.price * 2
      expiresAt.setMonth(expiresAt.getMonth() + (isYearly ? 12 : 1))

      const { data: existingSubscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', payment.user_id)
        .eq('status', 'active')
        .single()

      if (existingSubscription) {
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
        const { error: insertError } = await supabase
          .from('subscriptions')
          .insert([{
            user_id: payment.user_id,
            subscription_tier: planType,
            status: 'active',
            starts_at: new Date().toISOString(),
            expires_at: expiresAt.toISOString(),
            auto_renew: true
          }])

        if (insertError) throw insertError
      }

      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          subscription_tier: planType,
          monthly_limit: plan.limits.monthly_searches,
          updated_at: new Date().toISOString()
        })
        .eq('id', payment.user_id)

      if (profileError) throw profileError

    } catch (error) {
      console.error('Update subscription error:', error)
      throw error
    }
  }

  // 기타 유틸리티 메서드들
  static generateOrderId(userId, planType) {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    return `${planType}_${userId.substring(0, 8)}_${timestamp}_${random}`
  }

  static extractPlanFromOrderId(orderId) {
    return orderId.split('_')[0]
  }

  static formatPrice(amount, currency = 'KRW') {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  static async cancelSubscription(userId) {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'cancelled',
          auto_renew: false,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('status', 'active')

      if (error) throw error

      toast.success('구독이 취소되었습니다.')
      return { success: true }

    } catch (error) {
      console.error('Cancel subscription error:', error)
      toast.error('구독 취소 중 오류가 발생했습니다.')
      throw error
    }
  }

  static async getPaymentHistory(userId) {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          subscriptions (
            subscription_tier,
            status
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Get payment history error:', error)
      return []
    }
  }

  static async getCurrentSubscription(userId) {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()

      return { data, error }
    } catch (error) {
      console.error('Get current subscription error:', error)
      return { data: null, error }
    }
  }

  static isSubscriptionActive(subscription) {
    if (!subscription || subscription.status !== 'active') {
      return false
    }

    const expiresAt = new Date(subscription.expires_at)
    const now = new Date()
    
    return expiresAt > now
  }
}