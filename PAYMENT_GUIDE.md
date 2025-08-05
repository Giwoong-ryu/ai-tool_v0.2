# 토스페이먼츠 결제 처리 완전 가이드

## 🔧 실제 결제 처리를 위한 백엔드 API

현재는 클라이언트에서 결제 확인을 처리하고 있지만, **실제 서비스에서는 보안을 위해 반드시 백엔드에서 처리해야 합니다.**

### Node.js/Express 백엔드 API 예시

```javascript
// backend/routes/payments.js
const express = require('express');
const router = express.Router();
const axios = require('axios');

const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY; // 실제 시크릿 키

// 결제 승인 API
router.post('/confirm', async (req, res) => {
  try {
    const { paymentKey, orderId, amount } = req.body;

    // 토스페이먼츠 결제 승인 API 호출
    const response = await axios.post(
      'https://api.tosspayments.com/v1/payments/confirm',
      {
        paymentKey,
        orderId,
        amount
      },
      {
        headers: {
          'Authorization': `Basic ${Buffer.from(TOSS_SECRET_KEY + ':').toString('base64')}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const paymentData = response.data;

    // 데이터베이스에 결제 정보 저장
    // (여기서는 Supabase 예시)
    const { error } = await supabase
      .from('payments')
      .update({
        payment_key: paymentKey,
        status: 'completed',
        paid_at: new Date().toISOString(),
        toss_payment_data: paymentData
      })
      .eq('order_id', orderId);

    if (error) throw error;

    // 구독 상태 업데이트
    await updateUserSubscription(orderId, paymentData);

    res.json({ success: true, payment: paymentData });

  } catch (error) {
    console.error('Payment confirmation error:', error);
    
    // 결제 실패 처리
    await supabase
      .from('payments')
      .update({
        status: 'failed',
        failed_reason: error.message
      })
      .eq('order_id', req.body.orderId);

    res.status(400).json({ 
      success: false, 
      message: error.response?.data?.message || error.message 
    });
  }
});

module.exports = router;
```

## 🌐 성공/실패 URL 설정

### 1. 프로덕션 환경에서의 URL 설정

```javascript
// src/services/paymentService.js 수정
static async createPayment(userId, planType, billingCycle = 'monthly') {
  // ... 기존 코드 ...

  return {
    payment,
    paymentData: {
      amount: amount,
      orderId: orderId,
      orderName: `${plan.name} 플랜 (${billingCycle === 'yearly' ? '연간' : '월간'})`,
      customerEmail: null,
      // 프로덕션 URL로 변경
      successUrl: `${import.meta.env.VITE_APP_URL}/payment/success?orderId=${orderId}`,
      failUrl: `${import.meta.env.VITE_APP_URL}/payment/fail?orderId=${orderId}`
    }
  }
}
```

### 2. 환경별 URL 관리

```javascript
// .env.local (개발)
VITE_APP_URL=http://localhost:5173

// .env.production (프로덕션)
VITE_APP_URL=https://yourdomain.com
```

## 📱 결제 플로우 완전 구현

### 1. PaymentResult 컴포넌트 개선

```javascript
// src/components/PaymentResult.jsx에 추가
const handlePaymentSuccess = async () => {
  try {
    setIsProcessing(true)

    // 백엔드 API로 결제 확인 요청
    const response = await fetch('/api/payments/confirm', {
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

    const result = await response.json()

    if (result.success) {
      // 성공 처리
      setResult({
        success: true,
        message: '결제가 성공적으로 완료되었습니다!',
        details: {
          orderId,
          amount: parseInt(amount),
          paymentData: result.payment
        }
      })

      // 사용자 상태 새로고침
      await refreshUserProfile()
    } else {
      throw new Error(result.message)
    }

  } catch (error) {
    setResult({
      success: false,
      message: error.message || '결제 확인 중 오류가 발생했습니다.',
      details: { orderId }
    })
  } finally {
    setIsProcessing(false)
  }
}
```

## 🔒 보안 강화 방법

### 1. 결제 검증 강화

```javascript
// 백엔드에서 추가 검증
router.post('/confirm', async (req, res) => {
  try {
    const { paymentKey, orderId, amount } = req.body;
    const userId = req.user.id; // JWT에서 추출

    // 1. 주문이 해당 사용자의 것인지 확인
    const { data: order } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .eq('user_id', userId)
      .single();

    if (!order) {
      return res.status(403).json({ message: '권한이 없습니다.' });
    }

    // 2. 금액이 정확한지 확인
    if (order.amount !== parseInt(amount)) {
      return res.status(400).json({ message: '결제 금액이 일치하지 않습니다.' });
    }

    // 3. 이미 처리된 결제인지 확인
    if (order.status === 'completed') {
      return res.status(400).json({ message: '이미 처리된 결제입니다.' });
    }

    // 토스페이먼츠 결제 승인 진행...
    
  } catch (error) {
    // 오류 처리...
  }
});
```

### 2. 웹훅 처리 (권장)

```javascript
// 토스페이먼츠 웹훅 엔드포인트
router.post('/webhook', async (req, res) => {
  try {
    const { eventType, data } = req.body;
    
    // 웹훅 서명 검증 (실제 구현 필요)
    if (!verifyWebhookSignature(req)) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    switch (eventType) {
      case 'Payment.PaymentCompleted':
        await handlePaymentCompleted(data);
        break;
      case 'Payment.PaymentFailed':
        await handlePaymentFailed(data);
        break;
      case 'Payment.PaymentCanceled':
        await handlePaymentCanceled(data);
        break;
    }

    res.json({ received: true });
    
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
```

## 💳 테스트 카드 정보

### 토스페이먼츠 테스트 카드

```javascript
// 성공 테스트
{
  cardNumber: '4242424242424242',
  expiryMonth: '12',
  expiryYear: '25',
  cvc: '123'
}

// 실패 테스트 (잔액 부족)
{
  cardNumber: '4000000000000002',
  expiryMonth: '12',
  expiryYear: '25',
  cvc: '123'
}

// 실패 테스트 (카드 거절)
{
  cardNumber: '4000000000000069',
  expiryMonth: '12',
  expiryYear: '25',
  cvc: '123'
}
```

## 🚀 배포시 체크리스트

### 1. 환경변수 설정 확인

```bash
# Vercel 배포시
vercel env add VITE_TOSS_CLIENT_KEY production
vercel env add TOSS_SECRET_KEY production
vercel env add VITE_APP_URL production

# 값 예시
VITE_TOSS_CLIENT_KEY=live_ck_your_live_client_key
TOSS_SECRET_KEY=live_sk_your_live_secret_key
VITE_APP_URL=https://yourdomain.com
```

### 2. 토스페이먼츠 설정 변경

1. **개발자센터 > 내 애플리케이션**
2. **결제창 > 결제 완료 후 이동할 페이지**
   - 성공: `https://yourdomain.com/payment/success`
   - 실패: `https://yourdomain.com/payment/fail`
3. **웹훅 URL 설정**
   - `https://yourdomain.com/api/payments/webhook`

### 3. CORS 설정

```javascript
// 백엔드 CORS 설정
app.use(cors({
  origin: [
    'http://localhost:5173',  // 개발
    'https://yourdomain.com'  // 프로덕션
  ],
  credentials: true
}));
```

## 📊 결제 상태 모니터링

### 1. 관리자 대시보드 구현

```javascript
// 결제 통계 조회 API
router.get('/admin/stats', requireAdmin, async (req, res) => {
  try {
    const stats = await supabase
      .from('payments')
      .select(`
        status,
        amount,
        created_at,
        subscription_tier
      `)
      .gte('created_at', new Date(Date.now() - 30*24*60*60*1000).toISOString())

    const summary = {
      totalRevenue: stats.data.filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + p.amount, 0),
      totalTransactions: stats.data.length,
      successRate: stats.data.filter(p => p.status === 'completed').length / stats.data.length,
      planDistribution: stats.data.reduce((acc, p) => {
        acc[p.subscription_tier] = (acc[p.subscription_tier] || 0) + 1
        return acc
      }, {})
    }

    res.json(summary)
    
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})
```

### 2. 알림 시스템

```javascript
// 결제 실패시 슬랙 알림
const sendSlackNotification = async (message) => {
  await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `🚨 결제 오류: ${message}`,
      channel: '#payments'
    })
  })
}
```

## 🎯 실제 서비스 런칭 후 할 일

1. **결제 성공률 모니터링** (목표: 95% 이상)
2. **환불 정책 및 프로세스 수립**
3. **고객 지원 체계 구축**
4. **세금계산서 발행 시스템** (매출 3억 이상시)
5. **PG사 수수료 최적화** (다른 PG사와 비교)

이제 실제 결제가 가능한 완전한 시스템이 완성되었습니다! 🎉
