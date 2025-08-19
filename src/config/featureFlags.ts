// EasyPick Feature Flag 시스템
// 목적: 요금제별 기능 제어, A/B 테스트, 점진적 롤아웃
// 작성자: Claude Security Specialist

export type PlanType = 'free' | 'pro' | 'team'

export type FeatureFlag = 
  // 기본 기능
  | 'BASIC_AI_TOOLS'
  | 'PROMPT_TEMPLATES' 
  | 'BASIC_WORKFLOWS'
  | 'PERSONAL_BOOKMARKS'
  
  // Pro 기능
  | 'ALL_AI_TOOLS'
  | 'UNLIMITED_PROMPTS'
  | 'ADVANCED_WORKFLOWS'
  | 'API_ACCESS'
  | 'TEAM_BASIC'
  | 'PRIORITY_SUPPORT'
  | 'ADVANCED_ANALYTICS'
  
  // Team 기능
  | 'TEAM_ADVANCED'
  | 'AUDIT_LOGS'
  | 'SSO_INTEGRATION'
  | 'ROLE_BASED_ACCESS'
  | 'DEDICATED_SUPPORT'
  
  // 개발/실험 기능
  | 'FEATURE_UPGRADE'
  | 'FEATURE_BILLING'
  | 'BETA_FEATURES'
  | 'EXPERIMENTAL_UI'

// 요금제별 기능 매트릭스
export const PLAN_FEATURES: Record<PlanType, FeatureFlag[]> = {
  free: [
    'BASIC_AI_TOOLS',
    'PROMPT_TEMPLATES',
    'BASIC_WORKFLOWS',
    'PERSONAL_BOOKMARKS',
    'FEATURE_UPGRADE',
    'FEATURE_BILLING'
  ],
  pro: [
    'BASIC_AI_TOOLS',
    'PROMPT_TEMPLATES',
    'BASIC_WORKFLOWS',
    'PERSONAL_BOOKMARKS',
    'ALL_AI_TOOLS',
    'UNLIMITED_PROMPTS',
    'ADVANCED_WORKFLOWS',
    'API_ACCESS',
    'TEAM_BASIC',
    'PRIORITY_SUPPORT',
    'ADVANCED_ANALYTICS',
    'FEATURE_UPGRADE',
    'FEATURE_BILLING'
  ],
  team: [
    'BASIC_AI_TOOLS',
    'PROMPT_TEMPLATES',
    'BASIC_WORKFLOWS',
    'PERSONAL_BOOKMARKS',
    'ALL_AI_TOOLS',
    'UNLIMITED_PROMPTS',
    'ADVANCED_WORKFLOWS',
    'API_ACCESS',
    'TEAM_BASIC',
    'PRIORITY_SUPPORT',
    'ADVANCED_ANALYTICS',
    'TEAM_ADVANCED',
    'AUDIT_LOGS',
    'SSO_INTEGRATION',
    'ROLE_BASED_ACCESS',
    'DEDICATED_SUPPORT',
    'FEATURE_UPGRADE',
    'FEATURE_BILLING'
  ]
}

// 요금제별 제한값
export const PLAN_LIMITS = {
  free: {
    monthly_compiles: 20,
    monthly_saves: 10,
    team_members: 1,
    storage_mb: 100,
    api_calls_per_day: 50,
    max_workflows: 5,
    max_prompts: 10
  },
  pro: {
    monthly_compiles: -1, // 무제한
    monthly_saves: -1,
    team_members: 10,
    storage_mb: 10240, // 10GB
    api_calls_per_day: 1000,
    max_workflows: -1,
    max_prompts: -1
  },
  team: {
    monthly_compiles: -1,
    monthly_saves: -1,
    team_members: 50,
    storage_mb: 51200, // 50GB
    api_calls_per_day: 5000,
    max_workflows: -1,
    max_prompts: -1
  }
} as const

// 기능별 업그레이드 안내
export const FEATURE_UPGRADE_INFO: Record<FeatureFlag, {
  title: string
  description: string
  requiredPlan: PlanType
  upgradeUrl: string
}> = {
  ALL_AI_TOOLS: {
    title: '모든 AI 도구 사용',
    description: '150개 이상의 프리미엄 AI 도구에 무제한 액세스',
    requiredPlan: 'pro',
    upgradeUrl: '/pricing?feature=all_ai_tools'
  },
  UNLIMITED_PROMPTS: {
    title: '무제한 프롬프트',
    description: '프롬프트 생성 및 저장 제한 없음',
    requiredPlan: 'pro',
    upgradeUrl: '/pricing?feature=unlimited_prompts'
  },
  ADVANCED_WORKFLOWS: {
    title: '고급 워크플로',
    description: '복잡한 자동화 워크플로 및 연동 기능',
    requiredPlan: 'pro',
    upgradeUrl: '/pricing?feature=advanced_workflows'
  },
  API_ACCESS: {
    title: 'API 액세스',
    description: '개발자 API 및 webhook 연동',
    requiredPlan: 'pro',
    upgradeUrl: '/pricing?feature=api_access'
  },
  TEAM_BASIC: {
    title: '팀 협업',
    description: '팀 멤버 초대 및 공유 기능',
    requiredPlan: 'pro',
    upgradeUrl: '/pricing?feature=team_basic'
  },
  TEAM_ADVANCED: {
    title: '고급 팀 관리',
    description: '역할 기반 권한 및 팀 관리 기능',
    requiredPlan: 'team',
    upgradeUrl: '/pricing?feature=team_advanced'
  },
  AUDIT_LOGS: {
    title: '감사 로그',
    description: '팀 활동 및 보안 로그 추적',
    requiredPlan: 'team',
    upgradeUrl: '/pricing?feature=audit_logs'
  },
  SSO_INTEGRATION: {
    title: 'SSO 연동',
    description: '기업용 Single Sign-On 연동',
    requiredPlan: 'team',
    upgradeUrl: '/pricing?feature=sso'
  },
  // 기본 기능들 (업그레이드 불필요)
  BASIC_AI_TOOLS: {
    title: '기본 AI 도구',
    description: '기본 AI 도구 사용',
    requiredPlan: 'free',
    upgradeUrl: ''
  },
  PROMPT_TEMPLATES: {
    title: '프롬프트 템플릿',
    description: '기본 프롬프트 템플릿 사용',
    requiredPlan: 'free',
    upgradeUrl: ''
  },
  BASIC_WORKFLOWS: {
    title: '기본 워크플로',
    description: '기본 워크플로 사용',
    requiredPlan: 'free',
    upgradeUrl: ''
  },
  PERSONAL_BOOKMARKS: {
    title: '개인 북마크',
    description: '개인 북마크 기능',
    requiredPlan: 'free',
    upgradeUrl: ''
  },
  PRIORITY_SUPPORT: {
    title: '우선 지원',
    description: '우선 고객 지원',
    requiredPlan: 'pro',
    upgradeUrl: '/pricing?feature=priority_support'
  },
  ADVANCED_ANALYTICS: {
    title: '고급 분석',
    description: '상세한 사용량 분석 및 인사이트',
    requiredPlan: 'pro',
    upgradeUrl: '/pricing?feature=analytics'
  },
  ROLE_BASED_ACCESS: {
    title: '역할 기반 액세스',
    description: '세밀한 권한 관리',
    requiredPlan: 'team',
    upgradeUrl: '/pricing?feature=rbac'
  },
  DEDICATED_SUPPORT: {
    title: '전담 지원',
    description: '전담 고객 성공 매니저',
    requiredPlan: 'team',
    upgradeUrl: '/pricing?feature=dedicated_support'
  },
  FEATURE_UPGRADE: {
    title: '업그레이드 기능',
    description: '업그레이드 관련 UI 표시',
    requiredPlan: 'free',
    upgradeUrl: ''
  },
  FEATURE_BILLING: {
    title: '결제 기능',
    description: '결제 관련 UI 표시',
    requiredPlan: 'free',
    upgradeUrl: ''
  },
  BETA_FEATURES: {
    title: '베타 기능',
    description: '실험적 베타 기능 액세스',
    requiredPlan: 'pro',
    upgradeUrl: '/pricing?feature=beta'
  },
  EXPERIMENTAL_UI: {
    title: '실험적 UI',
    description: '새로운 UI 실험 참여',
    requiredPlan: 'free',
    upgradeUrl: ''
  }
}

// Feature Flag 체크 클래스
export class FeatureFlagService {
  private userPlan: PlanType = 'free'
  private teamPlan?: PlanType
  
  constructor(userPlan: PlanType = 'free', teamPlan?: PlanType) {
    this.userPlan = userPlan
    this.teamPlan = teamPlan
  }

  // 현재 유효한 플랜 (팀 플랜이 개인 플랜보다 우선)
  private getCurrentPlan(): PlanType {
    return this.teamPlan || this.userPlan
  }

  // 기능 사용 가능 여부 확인
  hasFeature(feature: FeatureFlag): boolean {
    const currentPlan = this.getCurrentPlan()
    return PLAN_FEATURES[currentPlan].includes(feature)
  }

  // 제한값 조회
  getLimit(limitKey: keyof typeof PLAN_LIMITS.free): number {
    const currentPlan = this.getCurrentPlan()
    return PLAN_LIMITS[currentPlan][limitKey]
  }

  // 무제한 여부 확인
  isUnlimited(limitKey: keyof typeof PLAN_LIMITS.free): boolean {
    return this.getLimit(limitKey) === -1
  }

  // 업그레이드 정보 조회
  getUpgradeInfo(feature: FeatureFlag) {
    if (this.hasFeature(feature)) {
      return null // 이미 사용 가능
    }
    
    return FEATURE_UPGRADE_INFO[feature]
  }

  // 플랜 업데이트
  updatePlan(userPlan: PlanType, teamPlan?: PlanType) {
    this.userPlan = userPlan
    this.teamPlan = teamPlan
  }

  // 현재 플랜 정보
  getPlanInfo() {
    const currentPlan = this.getCurrentPlan()
    return {
      plan: currentPlan,
      features: PLAN_FEATURES[currentPlan],
      limits: PLAN_LIMITS[currentPlan],
      isTeamPlan: !!this.teamPlan
    }
  }
}

// 전역 인스턴스 (기본값)
export const featureFlags = new FeatureFlagService()

// Hook 스타일 사용을 위한 유틸리티
export function useFeatureFlag(feature: FeatureFlag): {
  hasFeature: boolean
  upgradeInfo?: typeof FEATURE_UPGRADE_INFO[FeatureFlag]
} {
  const hasFeature = featureFlags.hasFeature(feature)
  const upgradeInfo = hasFeature ? undefined : featureFlags.getUpgradeInfo(feature)
  
  return { hasFeature, upgradeInfo }
}

// 컴포넌트에서 사용할 수 있는 조건부 렌더링 헬퍼
export function FeatureGate({ 
  feature, 
  children, 
  fallback 
}: {
  feature: FeatureFlag
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const { hasFeature } = useFeatureFlag(feature)
  
  if (hasFeature) {
    return <>{children}</>
  }
  
  return <>{fallback || null}</>
}

// 업그레이드 배너용 타입
export interface UpgradeBannerProps {
  feature: FeatureFlag
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'banner' | 'modal' | 'tooltip'
}

// ========================================
// Step 8: Guard 통합 업셀 기능
// ========================================

// Guard 에러 코드별 업셀 매핑
export const GUARD_ERROR_UPSELL_MAP: Record<string, {
  feature: FeatureFlag
  title: string
  description: string
  action: string
  urgency: 'low' | 'medium' | 'high'
}> = {
  QUOTA_EXCEEDED: {
    feature: 'FEATURE_UPGRADE',
    title: '사용량 한도 초과',
    description: 'Pro 플랜으로 업그레이드하여 무제한 사용하세요',
    action: '지금 업그레이드',
    urgency: 'high'
  },
  RATE_LIMIT_EXCEEDED: {
    feature: 'FEATURE_BILLING',
    title: '요청 한도 초과',
    description: '더 높은 요청 한도가 필요하시면 Pro 플랜을 고려해보세요',
    action: '플랜 비교하기',
    urgency: 'medium'
  }
}

// Guard 응답 처리용 유틸리티
export class GuardUpsellService {
  private featureFlagService: FeatureFlagService

  constructor(featureFlagService: FeatureFlagService) {
    this.featureFlagService = featureFlagService
  }

  // Guard 에러 응답에서 업셀 정보 추출
  getUpsellForGuardError(errorCode: string, action: string): {
    shouldShowUpsell: boolean
    upsellInfo?: {
      feature: FeatureFlag
      title: string
      description: string
      action: string
      urgency: 'low' | 'medium' | 'high'
      upgradeUrl: string
    }
  } {
    // Free 플랜 사용자만 업셀 표시
    const currentPlan = this.featureFlagService.getPlanInfo().plan
    if (currentPlan !== 'free') {
      return { shouldShowUpsell: false }
    }

    const upsellMapping = GUARD_ERROR_UPSELL_MAP[errorCode]
    if (!upsellMapping) {
      return { shouldShowUpsell: false }
    }

    // 액션별 업그레이드 URL 생성
    const upgradeUrl = this.generateUpgradeUrl(action, errorCode)

    return {
      shouldShowUpsell: true,
      upsellInfo: {
        ...upsellMapping,
        upgradeUrl
      }
    }
  }

  // 사용량 근접 경고용 업셀 정보
  getUsageWarningUpsell(usagePercentage: number, action: string): {
    shouldShowUpsell: boolean
    upsellInfo?: {
      feature: FeatureFlag
      title: string
      description: string
      action: string
      urgency: 'low' | 'medium' | 'high'
      upgradeUrl: string
    }
  } {
    const currentPlan = this.featureFlagService.getPlanInfo().plan
    if (currentPlan !== 'free') {
      return { shouldShowUpsell: false }
    }

    if (usagePercentage < 80) {
      return { shouldShowUpsell: false }
    }

    const urgency = usagePercentage >= 95 ? 'high' : 
                    usagePercentage >= 90 ? 'medium' : 'low'

    const actionMap: Record<string, string> = {
      compile: '프롬프트 컴파일',
      save: '워크플로 저장',
      api_call: 'API 호출'
    }

    return {
      shouldShowUpsell: true,
      upsellInfo: {
        feature: 'FEATURE_UPGRADE',
        title: `${actionMap[action] || action} 사용량 ${Math.round(usagePercentage)}%`,
        description: 'Pro 플랜으로 업그레이드하여 무제한 사용하세요',
        action: '지금 업그레이드',
        urgency,
        upgradeUrl: this.generateUpgradeUrl(action, 'usage_warning')
      }
    }
  }

  // 업그레이드 URL 생성
  private generateUpgradeUrl(action: string, trigger: string): string {
    const baseUrl = '/pricing'
    const params = new URLSearchParams({
      source: 'guard',
      action,
      trigger,
      utm_campaign: 'quota_upsell',
      utm_medium: 'in_app',
      utm_content: `${action}_${trigger}`
    })

    return `${baseUrl}?${params.toString()}`
  }

  // 업셀 모달/배너 표시 여부 결정
  shouldShowUpsellModal(urgency: 'low' | 'medium' | 'high'): boolean {
    return urgency === 'high'
  }

  shouldShowUpsellBanner(urgency: 'low' | 'medium' | 'high'): boolean {
    return urgency === 'medium' || urgency === 'high'
  }

  shouldShowUpsellTooltip(urgency: 'low' | 'medium' | 'high'): boolean {
    return urgency === 'low'
  }
}

// 전역 Guard 업셀 서비스 인스턴스
export const guardUpsellService = new GuardUpsellService(featureFlags)

// 사용 예시 주석
/*
// 1. 기본 사용법
import { featureFlags, useFeatureFlag, FeatureGate, guardUpsellService } from '@/config/featureFlags'

// 2. 컴포넌트에서 조건부 렌더링
<FeatureGate 
  feature="ADVANCED_WORKFLOWS"
  fallback={<UpgradeBanner feature="ADVANCED_WORKFLOWS" />}
>
  <AdvancedWorkflowEditor />
</FeatureGate>

// 3. Hook 사용
function MyComponent() {
  const { hasFeature, upgradeInfo } = useFeatureFlag('API_ACCESS')
  
  return (
    <div>
      {hasFeature ? (
        <ApiKeyManager />
      ) : (
        <UpgradeBanner 
          title={upgradeInfo?.title}
          description={upgradeInfo?.description}
          upgradeUrl={upgradeInfo?.upgradeUrl}
        />
      )}
    </div>
  )
}

// 4. 제한값 확인
if (featureFlags.isUnlimited('monthly_compiles')) {
  // 무제한 사용 가능
} else {
  const limit = featureFlags.getLimit('monthly_compiles')
  // 제한된 사용량
}

// 5. Step 8: Guard 에러 처리 및 업셀
async function handleGuardError(response: Response, action: string) {
  const errorData = await response.json()
  
  // Guard 에러에 대한 업셀 정보 확인
  const upsellResult = guardUpsellService.getUpsellForGuardError(
    errorData.code, 
    action
  )
  
  if (upsellResult.shouldShowUpsell && upsellResult.upsellInfo) {
    const { urgency, title, description, upgradeUrl } = upsellResult.upsellInfo
    
    // 긴급도에 따른 UI 표시
    if (guardUpsellService.shouldShowUpsellModal(urgency)) {
      showUpgradeModal({ title, description, upgradeUrl })
    } else if (guardUpsellService.shouldShowUpsellBanner(urgency)) {
      showUpgradeBanner({ title, description, upgradeUrl })
    } else {
      showUpgradeTooltip({ title, description, upgradeUrl })
    }
  }
}

// 6. 사용량 경고 처리
function handleUsageWarning(usagePercentage: number, action: string) {
  const warningResult = guardUpsellService.getUsageWarningUpsell(
    usagePercentage, 
    action
  )
  
  if (warningResult.shouldShowUpsell && warningResult.upsellInfo) {
    const { urgency, title, description, upgradeUrl } = warningResult.upsellInfo
    
    // 사용량에 따른 점진적 알림
    if (usagePercentage >= 95) {
      showUpgradeModal({ title, description, upgradeUrl })
    } else if (usagePercentage >= 90) {
      showUpgradeBanner({ title, description, upgradeUrl })
    } else {
      showUpgradeTooltip({ title, description, upgradeUrl })
    }
  }
}

// 7. Guard API 통합 예제
async function checkQuotaAndHandle(action: string, quantity = 1) {
  try {
    const response = await fetch('/functions/v1/guard', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action,
        quantity,
        metadata: { 
          feature: 'prompt_launcher',
          source: 'ui_action'
        }
      })
    })
    
    if (!response.ok) {
      await handleGuardError(response, action)
      return false
    }
    
    const result = await response.json()
    
    // 성공시 사용량 경고 체크
    if (result.quota && result.quota.limit > 0) {
      const usagePercentage = (result.quota.current / result.quota.limit) * 100
      if (usagePercentage >= 80) {
        handleUsageWarning(usagePercentage, action)
      }
    }
    
    return true
    
  } catch (error) {
    console.error('Quota check failed:', error)
    return false
  }
}
*/