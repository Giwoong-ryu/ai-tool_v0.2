# Feature Flag 기반 결제 UI 통합 — 구현 로드맵

## 🎯 전체 개요

현재 결제 UI가 무료 모드로 고정된 상태에서, Feature Flag 기반으로 단계적 활성화가 가능한 시스템으로 전환하는 프로젝트입니다.

---

## ✅ **Step 1 완료** — 기반 시스템 구축

### 완성된 작업
1. **featureFlags.js 확장**
   - FEATURE_BILLING, FEATURE_UPGRADE, FEATURE_PAYMENT_TOSS 플래그 추가
   - 계층적 의존성 검증 시스템 구현
   - 환경별 설정 가이드 문서화

2. **modalStore.js 구현**  
   - 글로벌 모달 상태 관리 시스템
   - 업그레이드 프롬프트 로직 (빈도 제어, 억제 기능)
   - Feature Flag 통합 검증

3. **라우팅 전략 확정**
   - App.jsx 분석 완료: 모달 중심 UX 유지 
   - /billing 라우트 불필요 확인
   - 기존 PaymentModal 활용 전략 수립

### 파일 변경사항
```
✅ src/lib/featureFlags.js (확장)
✅ src/store/modalStore.js (신규)
✅ docs/billing/routing-strategy.md (분석서)
✅ docs/billing/implementation-roadmap.md (이 문서)
```

---

## 📋 **Step 2 예정** — UI 컴포넌트 통합

### 목표
기존 결제 관련 컴포넌트들을 Feature Flag 기반으로 조건부 렌더링하도록 수정

### 작업 대상 파일
```
🔄 src/App.jsx
🔄 src/components/billing/UpgradeBanner.jsx
🔄 src/components/billing/UpgradeModal.jsx  
🔄 src/components/NavigationBar.jsx
🔄 기타 업그레이드 버튼이 있는 컴포넌트들
```

### 주요 작업
1. **App.jsx 수정**
   - `handlePaymentClick`에 Feature Flag 체크 추가
   - modalStore 통합

2. **UpgradeBanner 컴포넌트 수정**
   - `canShowUpgradePrompts()` 조건부 렌더링
   - modalStore의 `tryShowUpgradePrompt` 연동

3. **UpgradeModal 컴포넌트 수정**
   - modalStore와 연동
   - PaymentModal과 연계 로직

4. **NavigationBar 수정**
   - Pro Plan 버튼 Feature Flag 제어
   - 비활성화 시 graceful degradation

### 예상 결과
- 플래그 비활성화 시: 업그레이드 관련 UI 완전 숨김
- 플래그 활성화 시: 기존 UI 정상 동작
- 개발 환경에서 플래그 토글 테스트 가능

---

## 📋 **Step 3 예정** — 결제 기능 활성화

### 목표
Toss Payments 연동과 실제 결제 플로우 활성화

### 작업 대상 파일
```
🔄 src/features/payment/components/PaymentModal.jsx
🔄 supabase/functions/toss-webhook/index.ts
🔄 src/services/paymentService.js
🔄 .env (환경 변수)
```

### 주요 작업
1. **PaymentModal 수정**
   - `canUseTossPayments()` 체크
   - 플래그 비활성화 시 "준비 중" 메시지 표시

2. **Toss Webhook 활성화**
   - 현재 주석 처리된 코드 복원
   - Feature Flag 기반 웹훅 처리

3. **환경 변수 관리**
   - 개발/스테이징/프로덕션별 키 관리
   - 테스트 결제 vs 실결제 구분

### 예상 결과
- 개발: 테스트 결제 가능
- 스테이징: 실결제 테스트 가능  
- 프로덕션: 플래그로 단계적 활성화

---

## 📋 **Step 4 예정** — 구독 관리 시스템

### 목표
사용자 구독 상태 관리 및 Billing Dashboard 구현

### 작업 대상 파일
```
🆕 src/components/billing/BillingDashboard.jsx
🔄 src/store/authStore.js
🔄 src/services/subscriptionService.js
```

### 주요 작업
1. **구독 상태 관리**
   - authStore에 구독 정보 추가
   - 실시간 구독 상태 동기화

2. **Billing Dashboard**
   - 구독 플랜 변경 UI
   - 결제 내역 조회
   - 취소/환불 처리

3. **권한 관리 시스템**
   - 기능별 접근 권한 체크
   - Usage Limit 모니터링

---

## 🛡️ 단계별 배포 전략

### Phase 1: UI Only (프로덕션 안전)
```bash
VITE_FEATURE_BILLING=false
VITE_FEATURE_UPGRADE=true      # 배너만 노출, 결제 불가
VITE_FEATURE_PAYMENT_TOSS=false
```
- 업그레이드 배너/버튼 노출하여 사용자 반응 확인
- 실제 결제는 불가능 (안전)

### Phase 2: Payment Testing (스테이징 전용)
```bash
VITE_FEATURE_BILLING=true
VITE_FEATURE_UPGRADE=true
VITE_FEATURE_PAYMENT_TOSS=true   # 테스트 결제만
```
- 내부 QA 및 테스트 결제 진행
- 웹훅 및 결제 플로우 검증

### Phase 3: Production Rollout (점진적)
```bash
VITE_FEATURE_BILLING=true       # 단계적 활성화
VITE_FEATURE_UPGRADE=true
VITE_FEATURE_PAYMENT_TOSS=true   # 실결제 활성화
```
- 실제 사용자 대상 결제 기능 오픈
- 모니터링 및 이슈 대응

---

## 🔧 개발 환경 설정

### .env.development (권장)
```bash
VITE_FEATURE_BILLING=true
VITE_FEATURE_UPGRADE=true
VITE_FEATURE_PAYMENT_TOSS=true
VITE_FEATURE_SUBSCRIPTION_MANAGEMENT=true

# Toss Payments 테스트 키
VITE_TOSS_CLIENT_KEY=test_ck_테스트키
TOSS_SECRET_KEY=test_sk_테스트키
```

### 개발 시 확인사항
1. 브라우저 콘솔에서 Feature Flag 상태 확인
2. `window.__modalStore`로 모달 상태 디버깅
3. 플래그 토글 테스트 (환경 변수 변경 후 재시작)

---

## 📊 성공 지표

### Step 1 (완료)
- [x] Feature Flag 시스템 구축
- [x] 모달 상태 관리 시스템 구현
- [x] 라우팅 전략 확정

### Step 2 목표
- [ ] 모든 업그레이드 UI가 플래그로 제어됨
- [ ] 플래그 비활성화 시 UI 완전 숨김
- [ ] 개발 환경에서 플래그 토글 테스트 성공

### Step 3 목표  
- [ ] 테스트 결제 성공률 95% 이상
- [ ] 웹훅 응답 시간 < 3초
- [ ] 결제 플로우 완주율 측정

### Step 4 목표
- [ ] 구독 관리 기능 완성
- [ ] 권한 시스템 구축
- [ ] 전체 결제 시스템 안정화

---

## ⚠️ 주의사항

1. **절대 프로덕션에서 플래그 테스트 금지**
   - 스테이징 환경에서 충분한 검증 후 배포

2. **환경 변수 보안**
   - 실결제 키는 프로덕션 환경에서만 사용
   - .env 파일 Git 커밋 금지

3. **롤백 준비**
   - 모든 단계에서 즉시 롤백 가능한 구조 유지
   - Feature Flag를 통한 즉시 비활성화 가능

4. **사용자 경험**
   - 플래그 비활성화 시에도 UX 일관성 유지  
   - 기능 준비 중 상태 명확한 안내