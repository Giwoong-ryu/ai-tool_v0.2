// FEATURE FLAGS - 환경별 설정 가능한 기능 플래그 시스템
// ============================================================

// 검색 관련 플래그
export const FEATURE_SEARCH_V2 = 
  (import.meta.env.VITE_FEATURE_SEARCH_V2 ?? "true") === "true";

// 결제 관련 플래그 (계층적 구조)
export const FEATURE_BILLING = 
  (import.meta.env.VITE_FEATURE_BILLING ?? "false") === "true";

export const FEATURE_UPGRADE = 
  (import.meta.env.VITE_FEATURE_UPGRADE ?? "false") === "true";

export const FEATURE_PAYMENT_TOSS = 
  (import.meta.env.VITE_FEATURE_PAYMENT_TOSS ?? "false") === "true";

export const FEATURE_SUBSCRIPTION_MANAGEMENT = 
  (import.meta.env.VITE_FEATURE_SUBSCRIPTION_MANAGEMENT ?? "false") === "true";

// ============================================================
// 플래그 의존성 및 검증
// ============================================================

/**
 * 플래그 의존성 검증 함수
 * FEATURE_UPGRADE는 FEATURE_BILLING에 의존
 * FEATURE_PAYMENT_TOSS는 FEATURE_BILLING에 의존
 */
export const validateFeatureFlags = () => {
  const validationErrors = [];

  // UPGRADE 플래그는 BILLING 플래그 활성화 필요
  if (FEATURE_UPGRADE && !FEATURE_BILLING) {
    validationErrors.push('FEATURE_UPGRADE requires FEATURE_BILLING to be enabled');
  }

  // PAYMENT_TOSS 플래그는 BILLING 플래그 활성화 필요
  if (FEATURE_PAYMENT_TOSS && !FEATURE_BILLING) {
    validationErrors.push('FEATURE_PAYMENT_TOSS requires FEATURE_BILLING to be enabled');
  }

  // SUBSCRIPTION_MANAGEMENT 플래그는 BILLING 플래그 활성화 필요
  if (FEATURE_SUBSCRIPTION_MANAGEMENT && !FEATURE_BILLING) {
    validationErrors.push('FEATURE_SUBSCRIPTION_MANAGEMENT requires FEATURE_BILLING to be enabled');
  }

  if (validationErrors.length > 0 && import.meta.env.DEV) {
    console.warn('⚠️ Feature Flag Validation Errors:', validationErrors);
  }

  return validationErrors;
};

// ============================================================
// 플래그 유틸리티 함수
// ============================================================

/**
 * 결제 관련 기능이 활성화되어 있는지 확인
 */
export const isBillingEnabled = () => {
  return FEATURE_BILLING;
};

/**
 * 업그레이드 프롬프트 표시 가능한지 확인
 */
export const canShowUpgradePrompts = () => {
  return FEATURE_BILLING && FEATURE_UPGRADE;
};

/**
 * Toss Payments 결제 기능 사용 가능한지 확인
 */
export const canUseTossPayments = () => {
  return FEATURE_BILLING && FEATURE_PAYMENT_TOSS;
};

/**
 * 구독 관리 기능 사용 가능한지 확인
 */
export const canManageSubscriptions = () => {
  return FEATURE_BILLING && FEATURE_SUBSCRIPTION_MANAGEMENT;
};

// ============================================================
// 개발 환경 디버그 정보
// ============================================================

if (import.meta.env.DEV) {
  console.log('🏁 Feature Flags Status:', {
    SEARCH_V2: FEATURE_SEARCH_V2,
    BILLING: FEATURE_BILLING,
    UPGRADE: FEATURE_UPGRADE,
    PAYMENT_TOSS: FEATURE_PAYMENT_TOSS,
    SUBSCRIPTION_MANAGEMENT: FEATURE_SUBSCRIPTION_MANAGEMENT,
  });

  // 플래그 검증 실행
  validateFeatureFlags();
}

// ============================================================
// 환경별 권장 설정 (주석 가이드)
// ============================================================

/*
개발 환경 (.env.development):
VITE_FEATURE_BILLING=true
VITE_FEATURE_UPGRADE=true
VITE_FEATURE_PAYMENT_TOSS=true
VITE_FEATURE_SUBSCRIPTION_MANAGEMENT=true

스테이징 환경 (.env.staging):
VITE_FEATURE_BILLING=true
VITE_FEATURE_UPGRADE=true
VITE_FEATURE_PAYMENT_TOSS=true
VITE_FEATURE_SUBSCRIPTION_MANAGEMENT=false

프로덕션 환경 (.env.production):
VITE_FEATURE_BILLING=false
VITE_FEATURE_UPGRADE=false
VITE_FEATURE_PAYMENT_TOSS=false
VITE_FEATURE_SUBSCRIPTION_MANAGEMENT=false
*/