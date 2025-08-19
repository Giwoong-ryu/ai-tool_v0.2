# Toss Payments 통합 설정 가이드

EasyPick AI Tools 플랫폼의 Toss Payments 통합 완료 가이드입니다.

## 🎯 구현 완료된 기능

### 1. 결제 시스템
- ✅ **PaymentModal.jsx**: 4,900원/9,900원 플랜 선택 UI
- ✅ **PaymentService.js**: Toss SDK 통합 및 결제 처리
- ✅ **PaymentSuccess.jsx**: 결제 성공 페이지
- ✅ **PaymentFail.jsx**: 결제 실패 페이지 (상세 오류 처리)

### 2. 백엔드 처리
- ✅ **Toss Webhook**: `supabase/functions/toss-webhook/index.ts`
- ✅ **결제 확인 API**: Toss API 통합으로 실시간 검증
- ✅ **구독 관리**: 결제 완료 시 자동 구독 활성화
- ✅ **DB 스키마**: payments, subscriptions, user_profiles 연동

### 3. 사용자 경험
- ✅ **결제 플로우**: 모달 → Toss 결제창 → 성공/실패 페이지
- ✅ **할인 혜택**: 연간 결제 시 20% 할인 적용
- ✅ **오류 처리**: 상세한 오류 메시지 및 해결 방안 제시
- ✅ **재결제**: 실패 시 원클릭 재결제 기능

## 🔧 환경 변수 설정

### 프론트엔드 (.env.local)
```env
# 기존 환경 변수 (유지)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key

# Toss Payments 설정 (추가 필요)
VITE_TOSS_CLIENT_KEY=test_ck_your_toss_client_key
VITE_TOSS_SECRET_KEY=test_sk_your_toss_secret_key
```

### Supabase Edge Functions 환경변수
```bash
# Supabase Dashboard > Settings > Edge Functions > Environment Variables
TOSS_SECRET_KEY=test_sk_your_toss_secret_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ENVIRONMENT=development  # 선택사항 (개발 로깅용)
```

## 📋 Toss Payments Dashboard 설정

### 1. 개발자센터 설정
1. [Toss Payments 개발자센터](https://developers.tosspayments.com/) 접속
2. 애플리케이션 생성 및 API 키 발급
3. 테스트/상용 환경 구분하여 설정

### 2. 웹훅 URL 등록
```
개발: http://127.0.0.1:54321/functions/v1/toss-webhook
상용: https://your-project.supabase.co/functions/v1/toss-webhook
```

### 3. 이벤트 타입 선택
- ✅ `PAYMENT_STATUS_CHANGED` (필수)

### 4. 성공/실패 URL 설정
```
성공 URL: https://your-domain.com/payment/success
실패 URL: https://your-domain.com/payment/fail
```

## 🧪 테스트 방법

### 1. 로컬 개발 환경 테스트

#### Supabase Functions 실행
```bash
supabase start
supabase functions serve
```

#### 웹훅 테스트
```bash
curl -X POST 'http://127.0.0.1:54321/functions/v1/toss-webhook' \
  -H 'Authorization: Bearer your_service_role_key' \
  -H 'Content-Type: application/json' \
  -H 'toss-signature: test-signature' \
  -d '{
    "eventType": "PAYMENT_STATUS_CHANGED",
    "createdAt": "2024-01-01T00:00:00+09:00",
    "data": {
      "paymentKey": "test-payment-key-12345",
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
```

### 2. 프론트엔드 테스트

#### 결제 모달 테스트
1. 로그인 후 프리미엄 기능 클릭
2. PaymentModal 열림 확인
3. 플랜 선택 (월간/연간) 확인
4. 할인 금액 계산 확인

#### Toss 테스트 카드
```
카드번호: 4300-0000-0000-0000
유효기간: 12/30
CVC: 123
비밀번호 앞 2자리: 12
```

### 3. 결제 플로우 테스트 체크리스트

#### 정상 결제 플로우
- [ ] 로그인 사용자만 결제 가능
- [ ] 플랜 선택 (Basic 4,900원 / Pro 9,900원)
- [ ] 결제 주기 선택 (월간/연간 20% 할인)
- [ ] 토스 결제창 연동
- [ ] 결제 성공 시 `/payment/success` 리다이렉트
- [ ] 결제 정보 DB 저장 확인
- [ ] 구독 상태 활성화 확인
- [ ] 사용자 프로필 subscription_tier 업데이트 확인

#### 결제 실패 플로우
- [ ] 결제 취소 시 `/payment/fail` 리다이렉트
- [ ] 오류 코드별 상세 메시지 표시
- [ ] 재결제 버튼 동작 확인
- [ ] 실패한 결제 DB 상태 업데이트 확인

#### 웹훅 처리
- [ ] 웹훅 서명 검증
- [ ] PAYMENT_STATUS_CHANGED 이벤트 처리
- [ ] DB 트랜잭션 무결성 확인
- [ ] 중복 결제 방지 확인

## 🔍 디버깅 가이드

### 1. 결제 실패 시 확인사항

#### 프론트엔드 콘솔 확인
```javascript
// PaymentService.js의 로그 확인
console.log('결제 확인 시작:', { paymentKey, orderId, amount })
console.log('Toss API 결제 확인:', paymentData)
```

#### 네트워크 탭 확인
- Toss API 호출 상태코드 확인
- 응답 에러 메시지 확인
- Supabase API 호출 확인

#### Supabase 테이블 확인
```sql
-- 결제 레코드 확인
SELECT * FROM payments WHERE order_id = 'your_order_id';

-- 구독 상태 확인
SELECT * FROM subscriptions WHERE user_id = 'your_user_id';

-- 사용자 프로필 확인
SELECT subscription_tier FROM user_profiles WHERE id = 'your_user_id';
```

### 2. 웹훅 실패 시 확인사항

#### Supabase Functions 로그
```bash
supabase functions logs toss-webhook --follow
```

#### 일반적인 오류
- **서명 검증 실패**: TOSS_SECRET_KEY 확인
- **DB 권한 오류**: SERVICE_ROLE_KEY 확인
- **JSON 파싱 오류**: 웹훅 페이로드 형식 확인

### 3. 환경 변수 확인
```javascript
// 브라우저 콘솔에서 확인
console.log('Toss Client Key:', import.meta.env.VITE_TOSS_CLIENT_KEY?.substring(0, 10) + '...')
```

## 🚀 배포 전 체크리스트

### 환경 변수
- [ ] 프로덕션 Toss API 키로 변경
- [ ] Supabase 상용 환경 변수 설정
- [ ] 웹훅 URL을 상용 도메인으로 변경

### 보안 설정
- [ ] RLS 정책 활성화 확인
- [ ] API 키 노출 방지 확인
- [ ] 웹훅 서명 검증 활성화

### 기능 테스트
- [ ] 실제 결제 테스트 (소액)
- [ ] 결제 취소/환불 프로세스 확인
- [ ] 구독 만료 처리 확인
- [ ] 오류 알림 설정 확인

## 📞 지원 및 문의

### Toss Payments 지원
- 개발자센터: https://developers.tosspayments.com/
- 기술 지원: dev@tosspayments.com

### 구현 완료 기능 요약
1. **결제 요청**: PaymentService.createPayment() → PaymentService.requestTossPayment()
2. **결제 확인**: PaymentService.confirmPayment() → Toss API 검증
3. **웹훅 처리**: /toss-webhook → DB 업데이트 → 구독 활성화
4. **사용자 경험**: 직관적 UI + 상세 오류 처리 + 재결제 기능

모든 기능이 구현 완료되어 바로 사용 가능합니다! 🎉