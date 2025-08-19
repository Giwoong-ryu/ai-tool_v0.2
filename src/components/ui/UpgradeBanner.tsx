// EasyPick 업그레이드 배너 컴포넌트
// 목적: 권한/쿼터 제한 시 자연스러운 업그레이드 유도
// 작성자: Claude Security Specialist

import { useState } from 'react'
import { X, Zap, Crown, Users, ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useFeatureFlag, type FeatureFlag, type UpgradeBannerProps } from '@/config/featureFlags'
import { analyticsService } from '@/services/analyticsService'

interface UpgradeBannerComponentProps extends UpgradeBannerProps {
  onDismiss?: () => void
  showDismiss?: boolean
  customTitle?: string
  customDescription?: string
  customCTA?: string
}

export function UpgradeBanner({
  feature,
  className = '',
  size = 'md',
  variant = 'banner',
  onDismiss,
  showDismiss = true,
  customTitle,
  customDescription,
  customCTA
}: UpgradeBannerComponentProps) {
  const [dismissed, setDismissed] = useState(false)
  const { hasFeature, upgradeInfo } = useFeatureFlag(feature)

  // 이미 기능을 가지고 있거나 배너가 닫혔으면 렌더링하지 않음
  if (hasFeature || dismissed) {
    return null
  }

  if (!upgradeInfo) {
    return null
  }

  const handleDismiss = () => {
    setDismissed(true)
    onDismiss?.()
    
    analyticsService.track('upgrade_banner_dismissed', {
      feature,
      variant,
      size
    })
  }

  const handleUpgradeClick = () => {
    analyticsService.track('upgrade_banner_clicked', {
      feature,
      variant,
      size,
      required_plan: upgradeInfo.requiredPlan,
      upgrade_url: upgradeInfo.upgradeUrl
    })
    
    window.location.href = upgradeInfo.upgradeUrl
  }

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'pro': return <Zap className="w-4 h-4" />
      case 'team': return <Users className="w-4 h-4" />
      default: return <Crown className="w-4 h-4" />
    }
  }

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'pro': return 'bg-gradient-to-r from-purple-500 to-pink-500'
      case 'team': return 'bg-gradient-to-r from-blue-500 to-cyan-500'
      default: return 'bg-gradient-to-r from-yellow-500 to-orange-500'
    }
  }

  const getPlanName = (plan: string) => {
    switch (plan) {
      case 'pro': return 'Pro'
      case 'team': return 'Team'
      default: return 'Premium'
    }
  }

  // 사이즈별 스타일
  const sizeStyles = {
    sm: 'p-3 text-sm',
    md: 'p-4 text-base',
    lg: 'p-6 text-lg'
  }

  // 배너 형태 (기본)
  if (variant === 'banner') {
    return (
      <Card className={`border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-50 to-pink-50 ${className}`}>
        <CardContent className={`${sizeStyles[size]} flex items-center justify-between`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${getPlanColor(upgradeInfo.requiredPlan)} text-white`}>
              {getPlanIcon(upgradeInfo.requiredPlan)}
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">
                {customTitle || upgradeInfo.title}
              </h4>
              <p className="text-gray-600 text-sm">
                {customDescription || upgradeInfo.description}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
              {getPlanName(upgradeInfo.requiredPlan)} 필요
            </Badge>
            <Button 
              onClick={handleUpgradeClick}
              size={size === 'sm' ? 'sm' : 'default'}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {customCTA || '업그레이드'}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
            {showDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // 모달 형태
  if (variant === 'modal') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-full max-w-md mx-4 bg-white">
          <CardContent className="p-6 text-center">
            {showDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="absolute top-2 right-2"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
            
            <div className={`inline-flex p-3 rounded-full ${getPlanColor(upgradeInfo.requiredPlan)} text-white mb-4`}>
              <Sparkles className="w-8 h-8" />
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {customTitle || `${upgradeInfo.title} 기능이 필요해요`}
            </h3>
            
            <p className="text-gray-600 mb-6">
              {customDescription || `${upgradeInfo.description} ${getPlanName(upgradeInfo.requiredPlan)} 플랜으로 업그레이드하시겠어요?`}
            </p>
            
            <div className="space-y-3">
              <Button 
                onClick={handleUpgradeClick}
                className={`w-full ${getPlanColor(upgradeInfo.requiredPlan)} hover:opacity-90`}
                size="lg"
              >
                {getPlanIcon(upgradeInfo.requiredPlan)}
                <span className="ml-2">{customCTA || `${getPlanName(upgradeInfo.requiredPlan)}로 업그레이드`}</span>
              </Button>
              
              {showDismiss && (
                <Button
                  variant="outline"
                  onClick={handleDismiss}
                  className="w-full"
                >
                  나중에
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 툴팁 형태
  if (variant === 'tooltip') {
    return (
      <div className={`inline-flex items-center space-x-2 px-3 py-2 bg-purple-100 text-purple-800 rounded-lg text-sm ${className}`}>
        {getPlanIcon(upgradeInfo.requiredPlan)}
        <span>{customTitle || `${getPlanName(upgradeInfo.requiredPlan)} 필요`}</span>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleUpgradeClick}
          className="text-purple-700 hover:text-purple-900 p-1 h-auto"
        >
          업그레이드
        </Button>
        {showDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-purple-400 hover:text-purple-600 p-1 h-auto"
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>
    )
  }

  return null
}

// 쿼터 초과 전용 배너
export function QuotaExceededBanner({
  quotaType,
  current,
  limit,
  resetDate,
  className = '',
  onUpgrade,
  onDismiss
}: {
  quotaType: string
  current: number
  limit: number
  resetDate: string
  className?: string
  onUpgrade?: () => void
  onDismiss?: () => void
}) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const handleDismiss = () => {
    setDismissed(true)
    onDismiss?.()
  }

  const handleUpgrade = () => {
    analyticsService.track('quota_exceeded_upgrade_clicked', {
      quota_type: quotaType,
      current_usage: current,
      limit,
      reset_date: resetDate
    })
    
    onUpgrade?.() || (window.location.href = '/pricing?reason=quota_exceeded')
  }

  const formatResetDate = (date: string) => {
    return new Intl.DateTimeFormat('ko-KR', {
      month: 'long',
      day: 'numeric'
    }).format(new Date(date))
  }

  const getQuotaDisplayName = (type: string) => {
    const names = {
      'compile': '컴파일',
      'save': '저장',
      'api_call': 'API 호출'
    }
    return names[type as keyof typeof names] || type
  }

  return (
    <Card className={`border-l-4 border-l-orange-500 bg-gradient-to-r from-orange-50 to-red-50 ${className}`}>
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 text-white">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">
              월간 {getQuotaDisplayName(quotaType)} 한도 초과
            </h4>
            <p className="text-gray-600 text-sm">
              {current}/{limit} 사용됨 • {formatResetDate(resetDate)}에 초기화
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="bg-orange-100 text-orange-700">
            한도 초과
          </Badge>
          <Button 
            onClick={handleUpgrade}
            size="sm"
            className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
          >
            무제한 사용
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// 팀 기능 프로모션 배너
export function TeamPromoBanner({
  className = '',
  onDismiss
}: {
  className?: string
  onDismiss?: () => void
}) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const handleUpgrade = () => {
    analyticsService.track('team_promo_clicked', {
      source: 'team_banner'
    })
    
    window.location.href = '/pricing?highlight=team'
  }

  const handleDismiss = () => {
    setDismissed(true)
    onDismiss?.()
    
    analyticsService.track('team_promo_dismissed', {
      source: 'team_banner'
    })
  }

  return (
    <Card className={`border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-cyan-50 ${className}`}>
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">
              팀과 함께 더 빠르게 작업하세요
            </h4>
            <p className="text-gray-600 text-sm">
              팀 멤버 초대, 공유 워크스페이스, 고급 권한 관리
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
            Team 플랜
          </Badge>
          <Button 
            onClick={handleUpgrade}
            size="sm"
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
          >
            팀 플랜 보기
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/* 사용 예시

// 1. 기본 업그레이드 배너
<UpgradeBanner 
  feature="ADVANCED_WORKFLOWS" 
  variant="banner"
  size="md"
/>

// 2. 모달 형태
<UpgradeBanner 
  feature="API_ACCESS" 
  variant="modal"
  onDismiss={() => setShowModal(false)}
/>

// 3. 툴팁 형태
<UpgradeBanner 
  feature="TEAM_BASIC" 
  variant="tooltip"
  customTitle="팀 기능"
/>

// 4. 쿼터 초과 배너
<QuotaExceededBanner
  quotaType="compile"
  current={20}
  limit={20}
  resetDate="2024-02-01"
  onUpgrade={() => router.push('/pricing')}
/>

// 5. FeatureGate와 함께 사용
<FeatureGate 
  feature="ADVANCED_WORKFLOWS"
  fallback={<UpgradeBanner feature="ADVANCED_WORKFLOWS" />}
>
  <AdvancedWorkflowEditor />
</FeatureGate>

*/