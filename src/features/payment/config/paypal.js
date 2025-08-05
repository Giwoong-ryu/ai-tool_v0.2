// PayPal 설정
export const paypalConfig = {
  clientId: 'AYNnbgqMk3KC7FmvUxucmXhlhXBER5091VkUwsYbvx7zlCAZioucIrChS7J1a0Shaik6rgG0joo74on2',
  // 주의: 시크릿 키는 절대 프론트엔드에 노출하면 안됩니다!
  // 실제 구현시에는 백엔드 서버에서만 사용해야 합니다
  currency: 'USD',
  intent: 'capture',
  
  // 프로 플랜 가격 (USD)
  proPlanPrice: '8.00' // 약 9,000원
}

// PayPal SDK 로드 함수
export const loadPayPalScript = () => {
  return new Promise((resolve, reject) => {
    if (window.paypal) {
      resolve(window.paypal)
      return
    }
    
    const script = document.createElement('script')
    script.src = `https://www.paypal.com/sdk/js?client-id=${paypalConfig.clientId}&currency=${paypalConfig.currency}`
    script.async = true
    script.onload = () => resolve(window.paypal)
    script.onerror = reject
    document.body.appendChild(script)
  })
}

// 결제 생성 함수
export const createPayPalOrder = async () => {
  // 실제 구현시에는 백엔드 API를 통해 주문을 생성해야 합니다
  return {
    purchase_units: [{
      amount: {
        currency_code: paypalConfig.currency,
        value: paypalConfig.proPlanPrice,
        breakdown: {
          item_total: {
            currency_code: paypalConfig.currency,
            value: paypalConfig.proPlanPrice
          }
        }
      },
      items: [{
        name: '이지픽 프로 플랜 (월간 구독)',
        description: 'AI 도구 고급 분석, 프롬프트 다운로드, 북마크 기능',
        unit_amount: {
          currency_code: paypalConfig.currency,
          value: paypalConfig.proPlanPrice
        },
        quantity: '1',
        category: 'DIGITAL_GOODS'
      }]
    }],
    application_context: {
      brand_name: '이지픽 (EazyPick)',
      locale: 'ko-KR',
      landing_page: 'BILLING',
      user_action: 'PAY_NOW',
      return_url: window.location.origin + '/payment/success',
      cancel_url: window.location.origin + '/payment/cancel'
    }
  }
}

// 결제 승인 함수
export const capturePayPalOrder = async (orderId) => {
  // 실제 구현시에는 백엔드 API를 통해 결제를 승인해야 합니다
  // const response = await fetch(`/api/payments/paypal/capture/${orderId}`, {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     'Authorization': `Bearer ${token}`
  //   }
  // })
  // return await response.json()
  
  // 데모용 응답
  return {
    success: true,
    orderId: orderId,
    status: 'COMPLETED',
    payer: {
      email: 'demo@paypal.com',
      name: 'Demo User'
    }
  }
}
