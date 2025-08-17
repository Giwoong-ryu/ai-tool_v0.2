// src/api/paymentAPI.js
// 백엔드 API 엔드포인트들 (실제 서버 구현 필요)

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

// 토스페이먼츠 결제 승인 API
export const confirmTossPayment = async (paymentKey, orderId, amount) => {
  try {
    const response = await fetch(`${API_BASE}/payments/toss/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount: parseInt(amount)
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Toss payment confirmation API error:', error)
    throw error
  }
}

// PayPal 결제 확인 API
export const confirmPayPalPayment = async (paypalOrderId, orderId) => {
  try {
    const response = await fetch(`${API_BASE}/payments/paypal/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      },
      body: JSON.stringify({
        paypalOrderId,
        orderId
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('PayPal payment confirmation API error:', error)
    throw error
  }
}

// 결제 내역 조회 API
export const getPaymentHistory = async (userId) => {
  try {
    const response = await fetch(`${API_BASE}/payments/history/${userId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Get payment history API error:', error)
    throw error
  }
}

// 구독 취소 API
export const cancelSubscription = async (userId) => {
  try {
    const response = await fetch(`${API_BASE}/subscriptions/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      },
      body: JSON.stringify({ userId })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Cancel subscription API error:', error)
    throw error
  }
}

// 결제 통계 조회 API (관리자용)
export const getPaymentStats = async (startDate, endDate) => {
  try {
    const response = await fetch(`${API_BASE}/admin/payments/stats?start=${startDate}&end=${endDate}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Get payment stats API error:', error)
    throw error
  }
}