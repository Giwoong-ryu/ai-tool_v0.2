// src/services/paymentService.js
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
        monthly_searches: -1, // 무제한
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
          currency: plan.currency,
          payment_method: 'card',
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
          orderName: `${plan.name} 플랜 (${billingCycle === 'yearly' ? '연간' : '월간'})`,
          customerEmail: null, // 토스페이먼츠에서 자동으로 수집
          successUrl: `${window.location.origin}/payment/success`,
          failUrl: `${window.location.origin}/payment/fail`
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
      const { loadTossPayments } = await import('@toss/payment-sdk')
      
      const tossPayments = await loadTossPayments(import.meta.env.VITE_TOSS_CLIENT_KEY)
      
      // 결제창 호출
      await tossPayments.requestPayment('카드', {
        amount: paymentData.amount,
        orderId: paymentData.orderId,
        orderName: paymentData.orderName,
        customerEmail: paymentData.customerEmail,
        successUrl: paymentData.successUrl,
        failUrl: paymentData.failUrl
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

  // 결제 성공 처리 (간단한 버전 - 실제로는 서버에서 처리해야 함)
  static async confirmPayment(paymentKey, orderId, amount) {
    try {
      // 실제 구현에서는 백엔드 API를 호출해야 함
      // 여기서는 간단히 DB 업데이트만 수행
      
      const { error: updateError } = await supabase
        .from('payments')
        .update({
          payment_key: paymentKey,
          status: 'completed',
          paid_at: new Date().toISOString()
        })
        .eq('order_id', orderId)

      if (updateError) throw updateError

      // 구독 정보 생성/업데이트
      await this.updateSubscription(orderId)

      toast.success('결제가 완료되었습니다!')
      return { success: true }

    } catch (error) {
      console.error('Payment confirmation error:', error)
      
      // 결제 실패 상태 업데이트
      await supabase
        .from('payments')
        .update({
          status: 'failed',
          failed_reason: error.message
        })
        .eq('order_id', orderId)

      toast.error('결제 확인 중 오류가 발생했습니다.')
      throw error
    }
  }

  // 구독 정보 업데이트
  static async updateSubscription(orderId) {
    try {
      // 결제 정보 조회
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .select('*')
        .eq('order_id', orderId)
        .single()

      if (paymentError) throw paymentError

      // 플랜 타입 추출 (orderId에서)
      const planType = this.extractPlanFromOrderId(orderId)
      const plan = this.PLANS[planType]

      if (!plan) throw new Error('Invalid plan type')

      // 구독 만료일 계산 (월간/연간)
      const expiresAt = new Date()
      const isYearly = payment.amount > plan.price * 2 // 연간 결제 판단
      expiresAt.setMonth(expiresAt.getMonth() + (isYearly ? 12 : 1))

      // 기존 구독 조회
      const { data: existingSubscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', payment.user_id)
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
            user_id: payment.user_id,
            subscription_tier: planType,
            status: 'active',
            starts_at: new Date().toISOString(),
            expires_at: expiresAt.toISOString(),
            auto_renew: true
          }])

        if (insertError) throw insertError
      }

      // 사용자 프로필 업데이트
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          subscription_tier: planType,
          monthly_limit: plan.limits.monthly_searches,
          updated_at: new Date().toISOString()
        })
        .eq('id', payment.user_id)

      if (profileError) throw profileError

      // 결제 정보에 구독 ID 연결
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', payment.user_id)
        .eq('status', 'active')
        .single()

      if (subscription) {
        await supabase
          .from('payments')
          .update({ subscription_id: subscription.id })
          .eq('id', payment.id)
      }

    } catch (error) {
      console.error('Update subscription error:', error)
      throw error
    }
  }

  // 구독 취소
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

      toast.success('구독이 취소되었습니다. 현재 기간이 끝날 때까지 서비스를 이용할 수 있습니다.')
      return { success: true }

    } catch (error) {
      console.error('Cancel subscription error:', error)
      toast.error('구독 취소 중 오류가 발생했습니다.')
      throw error
    }
  }

  // 결제 내역 조회
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

  // 현재 구독 정보 조회
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

  // 유틸리티 함수들
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

  static isSubscriptionActive(subscription) {
    if (!subscription || subscription.status !== 'active') {
      return false
    }

    const expiresAt = new Date(subscription.expires_at)
    const now = new Date()
    
    return expiresAt > now
  }
}
