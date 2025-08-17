# 결제 UI 라우팅 전략 — App.jsx 분석 결과

## 🎯 라우팅 전략 결정사항

### ✅ **모달 중심 UX 유지 확정**

**현재 App.jsx 구조 분석 결과:**
- PaymentModal이 이미 글로벌 모달로 구현됨 (line 292-296)
- 모든 결제 관련 동작이 `handlePaymentClick` 함수로 처리됨 (line 155-163)
- 인증 → 결제 플로우가 모달 체인으로 설계됨 (line 286-289)

**결론: /billing 라우트 추가 불필요**

## 📋 현재 라우팅 구조

### 기존 라우트 목록
```
/ - 홈페이지 (NewMainLanding)
/tools - AI 도구 그리드  
/prompts - 프롬프트 컴포저
/workflows - 워크플로우 그리드
/hub-v2 - 검색 허브 V2
/payment/success - 결제 성공 페이지
/payment/fail - 결제 실패 페이지  
/test-prompt - 테스트 페이지
* - 404 리다이렉트
```

### 글로벌 모달 시스템
```
SimpleAuthModal - 인증 모달
PaymentModal - 결제 모달 (기존)
```

## 🔄 결제 플로우 분석

### 현재 결제 플로우 (line 155-163)
```javascript
const handlePaymentClick = (plan = 'basic') => {
  if (!isAuthenticated) {
    setAuthModalOpen(true)  // 1. 인증 필요 시 인증 모달
    return
  }
  setSelectedPlan(plan)     // 2. 플랜 선택
  setPaymentModalOpen(true) // 3. 결제 모달 열기
}
```

### 인증 성공 후 자동 결제 (line 286-289)
```javascript
onSuccess={() => {
  setAuthModalOpen(false)
  // 로그인 성공 후 결제 모달이 열려야 하는 경우
  if (selectedPlan && selectedPlan !== 'basic') {
    setTimeout(() => setPaymentModalOpen(true), 500)
  }
}}
```

## ✅ Feature Flag 통합 계획

### Step 1 완료 사항
- [x] featureFlags.js에 FEATURE_BILLING, FEATURE_UPGRADE 추가
- [x] modalStore.js로 글로벌 모달 상태 관리 구현
- [x] App.jsx 라우팅 전략 확인 (모달 유지)

### Step 2 예정 작업  
- [ ] handlePaymentClick에 Feature Flag 체크 추가
- [ ] UpgradeBanner.v2.jsx를 modalStore와 연동
- [ ] UpgradeModal.v2.jsx를 PaymentModal과 연계
- [ ] NavigationBar의 Pro Plan 버튼 플래그 제어

### Step 3 예정 작업
- [ ] Toss Payments 연동 활성화
- [ ] 구독 관리 UI 통합
- [ ] 실결제 테스트 및 검증

## 🛡️ 안전한 배포 전략

### 환경별 플래그 설정
```javascript
// 개발: 모든 기능 활성화
VITE_FEATURE_BILLING=true
VITE_FEATURE_UPGRADE=true
VITE_FEATURE_PAYMENT_TOSS=true

// 스테이징: 제한적 활성화  
VITE_FEATURE_BILLING=true
VITE_FEATURE_UPGRADE=true
VITE_FEATURE_PAYMENT_TOSS=true

// 프로덕션: 단계적 활성화
VITE_FEATURE_BILLING=false    # 초기 비활성화
VITE_FEATURE_UPGRADE=false    # 점진적 활성화
VITE_FEATURE_PAYMENT_TOSS=false
```

### 단계적 활성화 시나리오
1. **FEATURE_UPGRADE만 활성화**: 업그레이드 배너/버튼 노출, 결제 불가
2. **FEATURE_BILLING 추가 활성화**: 모달 열기 가능, Toss 결제 비활성화  
3. **FEATURE_PAYMENT_TOSS 활성화**: 실제 결제 기능 활성화

## 📊 App.jsx 수정 필요 없음

**현재 구조의 장점:**
- 모달 기반 UX가 이미 완성됨
- 인증 → 결제 플로우가 매끄럽게 연결됨
- Feature Flag만 추가하면 기존 구조 활용 가능
- 라우트 복잡도 증가 없음

**결론: App.jsx는 Step 2에서 최소한의 Feature Flag 체크만 추가하고, 라우트 구조는 변경하지 않음**