// EasyPick 클라이언트 권한 검증 서비스
// 목적: Edge Guard와 연동하여 권한/쿼터 검증, 자동 업그레이드 유도
// 작성자: Claude Security Specialist

import { supabase } from '@/lib/supabase'
import { featureFlags, FeatureFlagService, type FeatureFlag } from '@/config/featureFlags'
import { analyticsService } from './analyticsService'

// 보호된 작업 타입
export type ProtectedAction = 
  | 'compile' 
  | 'save' 
  | 'api_call' 
  | 'workflow_run'
  | 'prompt_generate'
  | 'ai_tool_access'
  | 'team_create'
  | 'team_invite'
  | 'export_data'

// 가드 검증 결과
export interface GuardResult {
  allowed: boolean
  planId?: string
  quotaRemaining?: number
  error?: {
    code: string
    message: string
    statusCode: number
    upgradeUrl?: string
  }
}

// 쿼터 상태
export interface QuotaStatus {
  current: number
  limit: number
  remaining: number
  resetDate: string
  isUnlimited: boolean
}

// 업그레이드 정보
export interface UpgradeInfo {
  currentPlan: string
  recommendedPlan: string
  features: string[]
  savings?: number
  upgradeUrl: string
}

class GuardService {
  private featureFlags: FeatureFlagService = featureFlags
  private cache = new Map<string, { result: GuardResult; timestamp: number }>()
  private readonly CACHE_TTL = 60 * 1000 // 1분 캐시

  // Edge Guard 함수 호출
  private async callEdgeGuard(
    action: ProtectedAction,
    resourceId?: string,
    quantity: number = 1
  ): Promise<GuardResult> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        return {
          allowed: false,
          error: {
            code: 'UNAUTHORIZED',
            message: '로그인이 필요합니다.',
            statusCode: 401,
            upgradeUrl: '/auth/signin'
          }
        }
      }

      const response = await fetch('/functions/v1/guard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          action,
          resource_id: resourceId,
          quantity
        })
      })

      const result = await response.json()

      if (response.ok) {
        return {
          allowed: true,
          planId: result.data.plan_id,
          quotaRemaining: result.data.quota_remaining
        }
      } else {
        return {
          allowed: false,
          error: {
            code: result.error.code,
            message: result.error.message,
            statusCode: result.error.status,
            upgradeUrl: result.error.upgrade_url
          }
        }
      }
    } catch (error) {
      console.error('Guard service error:', error)
      return {
        allowed: false,
        error: {
          code: 'NETWORK_ERROR',
          message: '네트워크 오류가 발생했습니다.',
          statusCode: 500
        }
      }
    }
  }

  // 캐시된 권한 검증
  async checkPermission(
    action: ProtectedAction,
    resourceId?: string,
    quantity: number = 1,
    useCache: boolean = true
  ): Promise<GuardResult> {
    const cacheKey = `${action}:${resourceId || 'none'}:${quantity}`
    
    // 캐시 확인
    if (useCache) {
      const cached = this.cache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.result
      }
    }

    // Edge Guard 호출
    const result = await this.callEdgeGuard(action, resourceId, quantity)
    
    // 성공한 경우만 캐시
    if (result.allowed) {
      this.cache.set(cacheKey, {
        result,
        timestamp: Date.now()
      })
    }

    // 분석 이벤트 전송
    analyticsService.track('guard_check', {
      action,
      allowed: result.allowed,
      plan_id: result.planId,
      error_code: result.error?.code
    })

    return result
  }

  // 실행 전 권한 검증 및 실행
  async executeWithGuard<T>(
    action: ProtectedAction,
    operation: () => Promise<T>,
    options?: {
      resourceId?: string
      quantity?: number
      onUpgradeRequired?: (upgradeInfo: UpgradeInfo) => void
      onQuotaExceeded?: (quotaStatus: QuotaStatus) => void
    }
  ): Promise<T | null> {
    const result = await this.checkPermission(
      action,
      options?.resourceId,
      options?.quantity
    )

    if (!result.allowed) {
      if (result.error?.code === 'QUOTA_EXCEEDED') {
        options?.onQuotaExceeded?.({
          current: 0, // Edge Guard에서 제공된 정보 사용
          limit: 0,
          remaining: 0,
          resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          isUnlimited: false
        })
      } else if (result.error?.code === 'FEATURE_NOT_AVAILABLE') {
        options?.onUpgradeRequired?.({
          currentPlan: 'free',
          recommendedPlan: 'pro',
          features: [],
          upgradeUrl: result.error.upgradeUrl || '/pricing'
        })
      }
      
      throw new Error(result.error?.message || '권한이 없습니다.')
    }

    // 권한이 있으면 실행
    try {
      return await operation()
    } catch (error) {
      console.error('Operation failed after guard check:', error)
      throw error
    }
  }

  // 쿼터 상태 조회
  async getQuotaStatus(action: ProtectedAction): Promise<QuotaStatus | null> {
    try {
      const { data, error } = await supabase.rpc('check_usage_quota', {
        p_event_type: action,
        p_quantity: 0 // 조회용
      })

      if (error || !data) {
        return null
      }

      return {
        current: data.current_usage,
        limit: data.limit,
        remaining: data.remaining,
        resetDate: data.reset_date,
        isUnlimited: data.limit === -1
      }
    } catch (error) {
      console.error('Failed to get quota status:', error)
      return null
    }
  }

  // 현재 사용자 플랜 정보 업데이트
  async updateUserPlan(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('plan, current_team_id')
        .eq('id', user.id)
        .single()

      if (!profile) return

      let teamPlan = undefined
      if (profile.current_team_id) {
        const { data: team } = await supabase
          .from('teams')
          .select('plan_id, subscription_status, subscription_period_end')
          .eq('id', profile.current_team_id)
          .single()

        if (team && team.subscription_status === 'active') {
          const isActive = !team.subscription_period_end || 
            new Date(team.subscription_period_end) > new Date()
          
          if (isActive) {
            teamPlan = team.plan_id as any
          }
        }
      }

      this.featureFlags.updatePlan(profile.plan || 'free', teamPlan)
    } catch (error) {
      console.error('Failed to update user plan:', error)
    }
  }

  // 기능 플래그 확인 (로컬)
  hasFeature(feature: FeatureFlag): boolean {
    return this.featureFlags.hasFeature(feature)
  }

  // 제한값 확인 (로컬)
  getLimit(limitKey: string): number {
    return this.featureFlags.getLimit(limitKey as any)
  }

  // 업그레이드 정보 생성
  getUpgradeInfo(currentPlan: string, requiredFeature?: FeatureFlag): UpgradeInfo {
    const planUpgrades = {
      'free': 'pro',
      'pro': 'team'
    } as const

    const recommendedPlan = planUpgrades[currentPlan as keyof typeof planUpgrades] || 'pro'
    
    return {
      currentPlan,
      recommendedPlan,
      features: this.getUpgradeFeatures(currentPlan, recommendedPlan),
      upgradeUrl: `/pricing?from=${currentPlan}&to=${recommendedPlan}${requiredFeature ? `&feature=${requiredFeature}` : ''}`
    }
  }

  private getUpgradeFeatures(fromPlan: string, toPlan: string): string[] {
    const planFeatures = {
      'free': ['기본 AI 도구', '월 20회 컴파일'],
      'pro': ['모든 AI 도구', '무제한 사용', 'API 액세스', '팀 협업'],
      'team': ['고급 팀 관리', '감사 로그', 'SSO 연동', '전담 지원']
    }

    return planFeatures[toPlan as keyof typeof planFeatures] || []
  }

  // 캐시 정리
  clearCache(): void {
    this.cache.clear()
  }

  // 자동 업그레이드 배너 표시 여부
  shouldShowUpgradeBanner(action: ProtectedAction): boolean {
    const actionFeatureMap: Record<ProtectedAction, FeatureFlag> = {
      'compile': 'BASIC_AI_TOOLS',
      'save': 'BASIC_AI_TOOLS',
      'api_call': 'API_ACCESS',
      'workflow_run': 'ADVANCED_WORKFLOWS',
      'prompt_generate': 'UNLIMITED_PROMPTS',
      'ai_tool_access': 'ALL_AI_TOOLS',
      'team_create': 'TEAM_BASIC',
      'team_invite': 'TEAM_BASIC',
      'export_data': 'API_ACCESS'
    }

    const requiredFeature = actionFeatureMap[action]
    return !this.hasFeature(requiredFeature)
  }
}

// 싱글톤 인스턴스
export const guardService = new GuardService()

// React Hook (옵셔널)
export function useGuard() {
  return {
    checkPermission: guardService.checkPermission.bind(guardService),
    executeWithGuard: guardService.executeWithGuard.bind(guardService),
    getQuotaStatus: guardService.getQuotaStatus.bind(guardService),
    hasFeature: guardService.hasFeature.bind(guardService),
    getLimit: guardService.getLimit.bind(guardService),
    shouldShowUpgradeBanner: guardService.shouldShowUpgradeBanner.bind(guardService)
  }
}

// 사용 예시
/*
// 1. 간단한 권한 체크
const result = await guardService.checkPermission('compile', 'workflow_123')
if (!result.allowed) {
  showUpgradeModal(result.error.upgradeUrl)
}

// 2. 실행과 함께 권한 체크
await guardService.executeWithGuard(
  'save',
  async () => {
    return await saveWorkflow(data)
  },
  {
    resourceId: 'workflow_123',
    onUpgradeRequired: (info) => {
      showUpgradeModal(info.upgradeUrl)
    },
    onQuotaExceeded: (quota) => {
      showQuotaExceededModal(quota)
    }
  }
)

// 3. React 컴포넌트에서 사용
function CompileButton() {
  const { checkPermission, shouldShowUpgradeBanner } = useGuard()
  
  const handleCompile = async () => {
    const result = await checkPermission('compile')
    if (result.allowed) {
      // 컴파일 실행
    } else {
      // 업그레이드 유도
    }
  }
  
  return (
    <div>
      <button onClick={handleCompile}>컴파일</button>
      {shouldShowUpgradeBanner('compile') && (
        <UpgradeBanner feature="BASIC_AI_TOOLS" />
      )}
    </div>
  )
}
*/