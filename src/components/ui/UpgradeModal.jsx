// EasyPick 업그레이드 모달 컴포넌트
// 목적: 전환 최적화된 플랜 비교 및 업그레이드 유도 (한국 시장 특화)
// 작성자: Claude UX Specialist

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { 
  Check, X, Crown, Zap, Users, Star, ArrowRight, 
  Sparkles, Shield, Clock, TrendingUp, Heart,
  ChevronRight, Gift
} from 'lucide-react'
import { useFeatureFlag, PLAN_FEATURES, PLAN_LIMITS } from '@/config/featureFlags'
import { PaymentService } from '@/services/paymentService'
import { analyticsService } from '@/services/analyticsService'
import useAuthStore from '@/store/authStore'

export function UpgradeModal({ 
  open, 
  onOpenChange, 
  triggeredFeature = null, 
  defaultPlan = 'pro',
  source = 'modal'
}) {
  const [selectedPlan, setSelectedPlan] = useState(defaultPlan)
  const [billingCycle, setBillingCycle] = useState('monthly')
  const [showFeatureComparison, setShowFeatureComparison] = useState(false)
  const { user, profile } = useAuthStore()

  const currentTier = profile?.subscription_tier || 'free'

  // 모달이 열릴 때 이벤트 트래킹
  useEffect(() => {
    if (open) {
      analyticsService.track('upgrade_modal_viewed', {
        source,
        triggered_feature: triggeredFeature,
        current_tier: currentTier,
        default_plan: defaultPlan
      })
    }
  }, [open, source, triggeredFeature, currentTier, defaultPlan])

  // 플랜 정보 구성
  const plans = [
    {
      id: 'free',
      name: '무료',
      price: 0,
      originalPrice: 0,
      icon: Heart,
      color: 'text-gray-500',
      bgGradient: 'from-gray-100 to-gray-200',
      borderColor: 'border-gray-200',
      popular: false,
      badge: null,
      description: '시작하기에 완벽',
      features: [
        '기본 AI 도구 20개',
        '프롬프트 템플릿 10개',
        '기본 워크플로 5개',
        '월 20회 컴파일',
        '월 10회 저장',
        '개인 북마크'
      ],
      limitations: [
        '고급 AI 도구 제한',
        '프롬프트 생성 제한',
        '워크플로 제한',
        'API 액세스 불가',
        '팀 기능 불가'
      ]
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 9900,
      originalPrice: 12000,
      icon: Crown,
      color: 'text-purple-600',
      bgGradient: 'from-purple-500 to-pink-500',
      borderColor: 'border-purple-200',
      popular: true,
      badge: '가장 인기',
      description: '프로 사용자를 위한 완벽한 선택',
      features: [
        '모든 AI 도구 150개+ 무제한',
        '무제한 프롬프트 생성',
        '고급 워크플로 무제한',
        '무제한 컴파일 & 저장',
        'API 액세스 포함',
        '팀 협업 기능 (10명)',
        '우선 고객 지원',
        '고급 분석 대시보드'
      ],
      limitations: [
        '고급 팀 관리 제한',
        'SSO 연동 불가',
        '감사 로그 불가'
      ]
    },
    {
      id: 'team',
      name: 'Team',
      price: 29900,
      originalPrice: 39900,
      icon: Users,
      color: 'text-blue-600',
      bgGradient: 'from-blue-500 to-cyan-500',
      borderColor: 'border-blue-200',
      popular: false,
      badge: '기업용',
      description: '팀과 기업을 위한 최고의 솔루션',
      features: [
        'Pro 플랜의 모든 기능',
        '팀 멤버 50명까지',
        '고급 역할 기반 권한',
        'SSO 연동 (구글, 마이크로소프트)',
        '팀 활동 감사 로그',
        '전담 고객 성공 매니저',
        '50GB 클라우드 스토리지',
        '고급 보안 및 컴플라이언스'
      ],
      limitations: []
    }
  ]

  const selectedPlanInfo = plans.find(plan => plan.id === selectedPlan)

  // 가격 계산
  const calculatePrice = (plan, cycle) => {
    if (plan.price === 0) return 0
    if (cycle === 'yearly') {
      return Math.floor(plan.price * 12 * 0.8) // 20% 할인
    }
    return plan.price
  }

  const handlePlanSelect = (planId) => {
    setSelectedPlan(planId)
    analyticsService.track('upgrade_plan_selected', {
      plan: planId,
      source,
      billing_cycle: billingCycle
    })
  }

  const handleUpgrade = async () => {
    if (selectedPlan === 'free') {
      onOpenChange(false)
      return
    }

    if (!user) {
      analyticsService.track('upgrade_login_required', {
        plan: selectedPlan,
        source
      })
      // 로그인 모달 열기 로직 필요
      return
    }

    analyticsService.track('upgrade_initiated', {
      plan: selectedPlan,
      billing_cycle: billingCycle,
      source,
      triggered_feature: triggeredFeature
    })

    try {
      // PaymentModal 열기 또는 직접 결제 처리
      const { payment, paymentData } = await PaymentService.createPayment(
        user.id,
        selectedPlan,
        billingCycle
      )

      await PaymentService.requestTossPayment(paymentData)
      onOpenChange(false)
    } catch (error) {
      console.error('Upgrade error:', error)
    }
  }

  const formatPrice = (price) => {
    if (price === 0) return '무료'
    return new Intl.NumberFormat('ko-KR').format(price) + '원'
  }

  const PlanCard = ({ plan, isSelected }) => {
    const PlanIcon = plan.icon
    const totalPrice = calculatePrice(plan, billingCycle)
    const monthlyPrice = billingCycle === 'yearly' ? Math.floor(totalPrice / 12) : totalPrice
    const savings = billingCycle === 'yearly' && plan.price > 0 ? plan.price * 12 - totalPrice : 0

    return (
      <Card 
        className={`relative cursor-pointer transition-all duration-200 transform hover:scale-[1.02] ${
          isSelected 
            ? `ring-2 ring-offset-2 ${plan.id === 'pro' ? 'ring-purple-500' : plan.id === 'team' ? 'ring-blue-500' : 'ring-gray-400'}` 
            : 'hover:shadow-lg'
        }`}
        onClick={() => handlePlanSelect(plan.id)}
      >
        {plan.popular && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <Badge className="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-3 py-1">
              <Star className="w-3 h-3 mr-1" />
              {plan.badge}
            </Badge>
          </div>
        )}
        
        {plan.badge && !plan.popular && (
          <div className="absolute -top-3 right-4">
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              {plan.badge}
            </Badge>
          </div>
        )}

        <CardHeader className="text-center pb-4">
          <div className={`inline-flex p-3 rounded-full bg-gradient-to-r ${plan.bgGradient} text-white mb-2 mx-auto`}>
            <PlanIcon className="w-6 h-6" />
          </div>
          
          <div>
            <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
            <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
          </div>

          <div className="mt-4">
            {plan.price === 0 ? (
              <div className="text-2xl font-bold text-gray-900">무료</div>
            ) : (
              <div>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-3xl font-bold text-gray-900">
                    {formatPrice(monthlyPrice)}
                  </span>
                  <span className="text-gray-500">/ 월</span>
                </div>
                
                {billingCycle === 'yearly' && (
                  <div className="text-sm text-green-600 mt-1">
                    연간 {formatPrice(savings)} 절약
                  </div>
                )}
                
                {billingCycle === 'monthly' && plan.originalPrice > plan.price && (
                  <div className="text-sm text-gray-500 line-through">
                    {formatPrice(plan.originalPrice)}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* 주요 기능 */}
            <div className="space-y-2">
              {plan.features.slice(0, 4).map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{feature}</span>
                </div>
              ))}
              
              {plan.features.length > 4 && (
                <div className="text-sm text-gray-500">
                  +{plan.features.length - 4}개 더 많은 기능
                </div>
              )}
            </div>

            {/* 제한사항 (무료 플랜만) */}
            {plan.limitations.length > 0 && (
              <div className="pt-2 border-t border-gray-100">
                <div className="space-y-1">
                  {plan.limitations.slice(0, 2).map((limitation, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <X className="w-3 h-3 text-gray-400 flex-shrink-0" />
                      <span className="text-xs text-gray-500">{limitation}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-bold">
            {triggeredFeature ? '프리미엄 기능이 필요해요' : '더 많은 기능으로 업그레이드하세요'}
          </DialogTitle>
          <p className="text-gray-600 mt-2">
            {triggeredFeature ? 
              '이 기능을 사용하려면 플랜 업그레이드가 필요합니다.' :
              '이지픽의 모든 기능을 활용해보세요. 언제든 취소 가능합니다.'
            }
          </p>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[70vh] px-1">
          {/* 결제 주기 선택 */}
          <div className="flex justify-center mb-8">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => setBillingCycle('monthly')}
              >
                월간 결제
              </button>
              <button
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all relative ${
                  billingCycle === 'yearly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => setBillingCycle('yearly')}
              >
                연간 결제
                <Badge className="absolute -top-2 -right-1 bg-green-500 text-white text-xs px-1 py-0">
                  20% 할인
                </Badge>
              </button>
            </div>
          </div>

          {/* 플랜 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isSelected={selectedPlan === plan.id}
              />
            ))}
          </div>

          {/* 기능 비교 토글 */}
          <div className="text-center mb-6">
            <Button
              variant="ghost"
              onClick={() => setShowFeatureComparison(!showFeatureComparison)}
              className="text-gray-600 hover:text-gray-900"
            >
              {showFeatureComparison ? '기능 비교 숨기기' : '전체 기능 비교 보기'}
              <ChevronRight className={`w-4 h-4 ml-1 transition-transform ${showFeatureComparison ? 'rotate-90' : ''}`} />
            </Button>
          </div>

          {/* 상세 기능 비교 테이블 */}
          {showFeatureComparison && (
            <div className="mb-8 overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 pr-4 font-medium text-gray-900">기능</th>
                    {plans.map(plan => (
                      <th key={plan.id} className="text-center py-3 px-2 font-medium text-gray-900">
                        {plan.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {[
                    { feature: 'AI 도구 개수', free: '20개', pro: '150개+', team: '150개+' },
                    { feature: '프롬프트 생성', free: '월 10개', pro: '무제한', team: '무제한' },
                    { feature: '워크플로', free: '5개', pro: '무제한', team: '무제한' },
                    { feature: 'API 액세스', free: '❌', pro: '✅', team: '✅' },
                    { feature: '팀 협업', free: '❌', pro: '10명', team: '50명' },
                    { feature: '우선 지원', free: '❌', pro: '✅', team: '✅' },
                    { feature: 'SSO 연동', free: '❌', pro: '❌', team: '✅' },
                    { feature: '감사 로그', free: '❌', pro: '❌', team: '✅' }
                  ].map((row, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-3 pr-4 text-gray-700">{row.feature}</td>
                      <td className="text-center py-3 px-2">{row.free}</td>
                      <td className="text-center py-3 px-2">{row.pro}</td>
                      <td className="text-center py-3 px-2">{row.team}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 혜택 강조 섹션 */}
          {selectedPlan !== 'free' && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 mb-6">
              <div className="text-center">
                <Sparkles className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {selectedPlan === 'pro' ? 'Pro 플랜의 특별한 혜택' : 'Team 플랜의 완벽한 솔루션'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span>생산성 300% 향상</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span>시간 절약 평균 5시간/주</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-purple-500" />
                    <span>30일 환불 보장</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 하단 액션 버튼 */}
        <div className="border-t bg-white p-6 space-y-4">
          {selectedPlan === 'free' ? (
            <Button
              onClick={() => onOpenChange(false)}
              className="w-full"
              variant="outline"
            >
              무료로 계속하기
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">
                  총 {formatPrice(calculatePrice(selectedPlanInfo, billingCycle))}
                  {billingCycle === 'yearly' ? '/년' : '/월'}
                </div>
                {billingCycle === 'yearly' && (
                  <div className="text-sm text-green-600">
                    월간 결제 대비 {formatPrice(selectedPlanInfo.price * 12 - calculatePrice(selectedPlanInfo, billingCycle))} 절약!
                  </div>
                )}
              </div>
              
              <Button
                onClick={handleUpgrade}
                className={`w-full h-12 text-lg font-semibold bg-gradient-to-r ${selectedPlanInfo.bgGradient} hover:opacity-90`}
              >
                {selectedPlanInfo.icon && <selectedPlanInfo.icon className="w-5 h-5 mr-2" />}
                {selectedPlanInfo.name} 플랜 시작하기
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

              <div className="text-center">
                <Button
                  onClick={() => onOpenChange(false)}
                  variant="ghost"
                  className="text-gray-500 hover:text-gray-700"
                >
                  나중에 결정하기
                </Button>
              </div>
            </div>
          )}

          {/* 보안 및 신뢰 지표 */}
          <div className="flex items-center justify-center gap-6 text-xs text-gray-500 pt-2">
            <div className="flex items-center gap-1">
              <Shield className="w-3 h-3" />
              <span>SSL 보안 결제</span>
            </div>
            <div className="flex items-center gap-1">
              <Gift className="w-3 h-3" />
              <span>30일 환불 보장</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>언제든 취소 가능</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* 사용 예시

// 1. 기본 업그레이드 모달
<UpgradeModal 
  open={showUpgrade}
  onOpenChange={setShowUpgrade}
  defaultPlan="pro"
  source="header_button"
/>

// 2. 특정 기능으로 인한 업그레이드 모달
<UpgradeModal 
  open={showUpgrade}
  onOpenChange={setShowUpgrade}
  triggeredFeature="ADVANCED_WORKFLOWS"
  defaultPlan="pro"
  source="feature_gate"
/>

// 3. FeatureGate와 함께 사용
<FeatureGate 
  feature="API_ACCESS"
  fallback={
    <div>
      <p>API 액세스가 필요합니다</p>
      <Button onClick={() => setShowUpgrade(true)}>
        업그레이드
      </Button>
      <UpgradeModal 
        open={showUpgrade}
        onOpenChange={setShowUpgrade}
        triggeredFeature="API_ACCESS"
        source="api_gate"
      />
    </div>
  }
>
  <ApiKeyManager />
</FeatureGate>

*/