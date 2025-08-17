// src/api/toss/confirm.js - 토스페이먼츠 결제 승인 API
export default async function handler(req, res) {
  // CORS 헤더 추가
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  // OPTIONS 요청 처리 (CORS preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // POST 요청만 허용
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'POST 요청만 허용됩니다.' 
    })
  }

  const { paymentKey, orderId, amount } = req.body

  // 필수 파라미터 검증
  if (!paymentKey || !orderId || !amount) {
    return res.status(400).json({
      error: 'Missing required parameters',
      message: '필수 파라미터가 누락되었습니다.'
    })
  }

  try {
    console.log('토스페이먼츠 결제 승인 시작:', { paymentKey, orderId, amount })

    // 토스페이먼츠 결제 승인 API 호출
    const tossResponse = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(process.env.TOSS_SECRET_KEY + ':').toString('base64')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount: parseInt(amount)
      })
    })

    const tossData = await tossResponse.json()

    if (!tossResponse.ok) {
      console.error('토스페이먼츠 API 오류:', tossData)
      return res.status(tossResponse.status).json({
        error: 'Toss payment confirmation failed',
        message: tossData.message || '결제 승인에 실패했습니다.',
        details: tossData
      })
    }

    console.log('토스페이먼츠 결제 승인 성공:', tossData)

    // 성공 응답
    res.status(200).json({
      success: true,
      message: '결제가 성공적으로 승인되었습니다.',
      payment: tossData
    })

  } catch (error) {
    console.error('토스페이먼츠 결제 승인 처리 중 오류:', error)
    
    res.status(500).json({
      error: 'Internal server error',
      message: '서버 내부 오류가 발생했습니다.',
      details: error.message
    })
  }
}
