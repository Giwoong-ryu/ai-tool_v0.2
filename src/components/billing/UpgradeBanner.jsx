// src/components/billing/UpgradeBanner.jsx
import React from 'react'
import { Button } from '../ui/button.jsx'
import { Badge } from '../ui/badge.jsx'
import { Crown, Zap, ArrowRight, X } from 'lucide-react'
import { canShowUpgradePrompts } from '../../lib/featureFlags.js'
import useModalStore, { MODAL_TYPES, UPGRADE_TRIGGERS } from '../../store/modalStore.js'
import useAuthStore from '../../store/authStore.js'

const UpgradeBanner = ({ 
  variant = 'default', // 'default', 'compact', 'sticky'
  onDismiss,
  plan = 'pro',
  trigger = UPGRADE_TRIGGERS.EXPLICIT_BUTTON,
  className = ''
}) => {
  const { openModal } = useModalStore()
  const { isAuthenticated, user, profile } = useAuthStore()

  // Feature Flag 체크 - 비활성화된 경우 렌더링하지 않음
  if (!canShowUpgradePrompts()) {
    return null
  }

  // 이미 유료 사용자인 경우 표시하지 않음
  if (profile?.subscription_tier && profile.subscription_tier !== 'free') {
    return null
  }

  const handleUpgradeClick = () => {
    if (!isAuthenticated) {
      // 인증되지 않은 경우 PayPal 결제 모달에서 처리
      // PaymentModalPayPal에서 인증 상태를 확인하고 로그인 유도
    }

    // 업그레이드 모달 열기 (PayPal 버전)
    openModal(MODAL_TYPES.PAYMENT, {
      plan,
      trigger,
      source: 'upgrade_banner'
    })
  }

  const planInfo = {
    basic: {
      name: 'Basic',
      icon: Zap,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    pro: {
      name: 'Pro',
      icon: Crown,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200'
    }
  }

  const currentPlan = planInfo[plan] || planInfo.pro
  const PlanIcon = currentPlan.icon

  // Compact variant (작은 배너)
  if (variant === 'compact') {
    return (
      <div className={`bg-gradient-to-r from-[#2E7D6E] to-[#3a9e8e] text-white p-3 rounded-lg flex items-center justify-between ${className}`}>
        <div className="flex items-center gap-2">
          <PlanIcon className="h-4 w-4" />
          <span className="text-sm font-medium">
            {currentPlan.name}으로 업그레이드
          </span>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={handleUpgradeClick}
          className="bg-white text-[#2E7D6E] hover:bg-gray-50 h-8 px-3 text-xs"
        >
          업그레이드
        </Button>
      </div>
    )
  }

  // Sticky variant (상단 고정 배너)
  if (variant === 'sticky') {
    return (
      <div className={`bg-gradient-to-r from-[#2E7D6E] to-[#3a9e8e] text-white py-2 px-4 ${className}`}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PlanIcon className="h-5 w-5" />
            <div className="flex items-center gap-2">
              <span className="font-medium">
                무료 사용량을 모두 사용했습니다
              </span>
              <Badge variant="secondary" className="bg-white text-[#2E7D6E] text-xs">
                {currentPlan.name}으로 업그레이드
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleUpgradeClick}
              className="bg-white text-[#2E7D6E] hover:bg-gray-50 h-8 px-4 text-sm"
            >
              지금 업그레이드
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
            
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-white hover:text-gray-200 transition-colors"
                aria-label="배너 닫기"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Default variant (카드형 배너)
  return (
    <div className={`bg-gradient-to-br from-[#2E7D6E] to-[#3a9e8e] text-white rounded-xl p-6 shadow-lg ${className}`}>
      {/* 모바일 대응: flex-col on mobile, flex-row on desktop */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-white bg-opacity-20 rounded-lg">
              <PlanIcon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold">
                {currentPlan.name} 플랜으로 업그레이드
              </h3>
              <p className="text-white text-opacity-90 text-sm">
                더 많은 기능과 무제한 사용량을 경험해보세요
              </p>
            </div>
          </div>

          {/* 주요 혜택 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span className="text-sm">무제한 AI 도구 사용</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span className="text-sm">프리미엄 템플릿</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span className="text-sm">우선 지원</span>
            </div>
          </div>
        </div>

        {/* CTA 버튼 영역 */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <Button
            size="lg"
            onClick={handleUpgradeClick}
            className="bg-white text-[#2E7D6E] hover:bg-gray-50 font-semibold px-8 py-3"
          >
            지금 업그레이드
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>

          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-white hover:text-gray-200 transition-colors text-sm underline md:ml-4"
            >
              나중에 하기
            </button>
          )}
        </div>
      </div>

      {/* 할인 정보 (있는 경우) */}
      <div className="mt-4 pt-4 border-t border-white border-opacity-20">
        <div className="flex items-center justify-between text-sm">
          <span className="text-white text-opacity-80">
            💳 월간 결제 시 첫 달 50% 할인
          </span>
          <Badge variant="secondary" className="bg-white text-[#2E7D6E] text-xs">
            제한된 혜택
          </Badge>
        </div>
      </div>
    </div>
  )
}

// 사용량 제한 감지 시 자동으로 표시되는 래퍼 컴포넌트
export const UsageLimitUpgradeBanner = ({ className = '' }) => {
  const [dismissed, setDismissed] = React.useState(false)
  const { profile } = useAuthStore()

  // Feature Flag 체크
  if (!canShowUpgradePrompts()) {
    return null
  }

  // 이미 유료 사용자이거나 dismiss된 경우
  if (dismissed || (profile?.subscription_tier && profile.subscription_tier !== 'free')) {
    return null
  }

  // 사용량 체크 (실제 로직에서는 usage_count와 limit 비교)
  const isNearLimit = profile?.usage_count && profile.usage_count >= 80 // 임시 로직
  
  if (!isNearLimit) {
    return null
  }

  return (
    <div className={`mb-6 ${className}`}>
      <UpgradeBanner
        variant="sticky"
        onDismiss={() => setDismissed(true)}
        trigger={UPGRADE_TRIGGERS.USAGE_LIMIT}
      />
    </div>
  )
}

export default UpgradeBanner