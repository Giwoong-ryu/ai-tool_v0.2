// src/components/UpgradeSystemDemo.jsx - 업그레이드 시스템 통합 데모
import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card.jsx'
import { Button } from './ui/button.jsx'
import { Badge } from './ui/badge.jsx'
import { Alert, AlertDescription } from './ui/alert.jsx'
import { 
  Crown, Zap, Users, Settings, BookOpen, Workflow, 
  MessageSquare, BarChart3, Shield, Gift 
} from 'lucide-react'

// 업그레이드 시스템 컴포넌트들 import
import { UpgradeBanner, QuotaExceededBanner, TeamPromoBanner } from './ui/UpgradeBanner.tsx'
import { UpgradeModal } from './ui/UpgradeModal.jsx'
import { 
  FeatureGate, 
  useFeatureFlag, 
  featureFlags,
  type FeatureFlag 
} from '../config/featureFlags.ts'

// 스타일 import
import '../styles/billing-page.css'

const UpgradeSystemDemo = () => {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [selectedFeature, setSelectedFeature] = useState('ADVANCED_WORKFLOWS')
  const [currentPlan, setCurrentPlan] = useState('free') // 데모용 상태

  // 데모용 기능 목록
  const demoFeatures = [
    {
      id: 'ALL_AI_TOOLS',
      name: '모든 AI 도구',
      description: '150개 이상의 프리미엄 AI 도구 사용',
      icon: Zap,
      category: 'tools'
    },
    {
      id: 'UNLIMITED_PROMPTS',
      name: '무제한 프롬프트',
      description: '프롬프트 생성 제한 없음',
      icon: MessageSquare,
      category: 'prompts'
    },
    {
      id: 'ADVANCED_WORKFLOWS',
      name: '고급 워크플로',
      description: '복잡한 자동화 워크플로 구성',
      icon: Workflow,
      category: 'workflows'
    },
    {
      id: 'API_ACCESS',
      name: 'API 액세스',
      description: '개발자 API 및 webhook 연동',
      icon: Settings,
      category: 'api'
    },
    {
      id: 'TEAM_BASIC',
      name: '팀 협업',
      description: '팀 멤버 초대 및 공유 기능',
      icon: Users,
      category: 'team'
    },
    {
      id: 'ADVANCED_ANALYTICS',
      name: '고급 분석',
      description: '상세한 사용량 분석 및 인사이트',
      icon: BarChart3,
      category: 'analytics'
    }
  ]

  // 데모용 featureFlags 업데이트
  React.useEffect(() => {
    featureFlags.updatePlan(currentPlan as any)
  }, [currentPlan])

  const handleFeatureClick = (featureId: FeatureFlag) => {
    setSelectedFeature(featureId)
    setShowUpgradeModal(true)
  }

  const handlePlanSwitch = (plan: string) => {
    setCurrentPlan(plan)
  }

  return (
    <div className="billing-page max-w-6xl mx-auto p-6 space-y-8">
      {/* 헤더 */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold billing-brand-purple">
          업그레이드 시스템 데모
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          EasyPick AI Tools의 완성된 업그레이드 시스템을 체험해보세요. 
          무료 사용자에게는 업그레이드 유도, 유료 사용자에게는 모든 기능을 제공합니다.
        </p>
      </div>

      {/* 현재 플랜 시뮬레이터 */}
      <Card className="billing-container">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            플랜 시뮬레이터 (데모용)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 mb-4">
            {['free', 'pro', 'team'].map((plan) => (
              <Button
                key={plan}
                variant={currentPlan === plan ? 'default' : 'outline'}
                onClick={() => handlePlanSwitch(plan)}
                className={`capitalize ${
                  currentPlan === plan ? 'billing-cta-button primary' : 'billing-cta-button secondary'
                }`}
              >
                {plan === 'free' ? '무료' : plan === 'pro' ? 'Pro' : 'Team'}
              </Button>
            ))}
          </div>
          <div className="text-sm text-gray-600">
            <strong>현재 플랜:</strong> {currentPlan === 'free' ? '무료' : currentPlan.toUpperCase()}
            <br />
            <strong>이용 가능한 기능 수:</strong> {featureFlags.getPlanInfo().features.length}개
          </div>
        </CardContent>
      </Card>

      {/* 업그레이드 배너 예시들 */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">업그레이드 배너 예시</h2>
        
        {/* 기본 배너 */}
        <div className="space-y-3">
          <h3 className="text-lg font-medium">1. 기본 업그레이드 배너</h3>
          <UpgradeBanner 
            feature="ADVANCED_WORKFLOWS" 
            variant="banner"
            size="md"
          />
        </div>

        {/* 쿼터 초과 배너 */}
        <div className="space-y-3">
          <h3 className="text-lg font-medium">2. 쿼터 초과 배너</h3>
          <QuotaExceededBanner
            quotaType="compile"
            current={20}
            limit={20}
            resetDate="2024-02-01"
            onUpgrade={() => setShowUpgradeModal(true)}
          />
        </div>

        {/* 팀 프로모션 배너 */}
        <div className="space-y-3">
          <h3 className="text-lg font-medium">3. 팀 프로모션 배너</h3>
          <TeamPromoBanner />
        </div>
      </div>

      {/* 기능 게이트 데모 */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">기능 게이트 시스템</h2>
        <div className="billing-grid billing-grid-1 md:billing-grid-2 lg:billing-grid-3 gap-6">
          {demoFeatures.map((feature) => {
            const Icon = feature.icon
            const { hasFeature } = useFeatureFlag(feature.id as FeatureFlag)
            
            return (
              <Card 
                key={feature.id} 
                className={`billing-plan-card cursor-pointer ${
                  hasFeature ? 'opacity-100' : 'opacity-75'
                }`}
                onClick={() => !hasFeature && handleFeatureClick(feature.id as FeatureFlag)}
              >
                <CardContent className="p-6 text-center">
                  <div className={`billing-plan-icon ${hasFeature ? 'pro' : 'free'} mx-auto mb-4`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  
                  <h3 className="font-semibold mb-2 flex items-center justify-center gap-2">
                    {feature.name}
                    {hasFeature ? (
                      <Badge className="bg-green-100 text-green-700">이용 가능</Badge>
                    ) : (
                      <Badge variant="secondary">업그레이드 필요</Badge>
                    )}
                  </h3>
                  
                  <p className="text-sm text-gray-600 mb-4">{feature.description}</p>
                  
                  <FeatureGate
                    feature={feature.id as FeatureFlag}
                    fallback={
                      <Button 
                        onClick={() => handleFeatureClick(feature.id as FeatureFlag)}
                        className="billing-cta-button primary w-full"
                        size="sm"
                      >
                        <Crown className="w-4 h-4 mr-1" />
                        업그레이드
                      </Button>
                    }
                  >
                    <Button 
                      className="billing-cta-button secondary w-full"
                      size="sm"
                      disabled
                    >
                      <Gift className="w-4 h-4 mr-1" />
                      이용 중
                    </Button>
                  </FeatureGate>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* 설명 섹션 */}
      <Alert>
        <BookOpen className="h-4 w-4" />
        <AlertDescription>
          <strong>데모 설명:</strong> 위의 플랜 시뮬레이터로 다른 플랜을 선택해보세요. 
          무료 플랜에서는 업그레이드 배너와 제한 메시지가 표시되고, 
          유료 플랜에서는 모든 기능에 접근할 수 있습니다. 
          실제 서비스에서는 사용자의 구독 상태에 따라 자동으로 적용됩니다.
        </AlertDescription>
      </Alert>

      {/* 업그레이드 모달 */}
      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        triggeredFeature={selectedFeature as FeatureFlag}
        defaultPlan="pro"
        source="demo"
      />

      {/* CSS 스타일 데모 */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">CSS 스타일 데모</h2>
        
        <div className="billing-grid billing-grid-1 md:billing-grid-2 lg:billing-grid-3 gap-6">
          {/* 무료 플랜 카드 */}
          <div className="billing-plan-card">
            <div className="billing-plan-icon free">
              <Gift className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-center mb-2">무료 플랜</h3>
            <div className="billing-price-primary text-center">무료</div>
            <div className="billing-feature-list">
              <div className="billing-feature-item">
                <div className="billing-feature-icon check">✓</div>
                <div className="billing-feature-text">기본 AI 도구 20개</div>
              </div>
              <div className="billing-feature-item">
                <div className="billing-feature-icon x">✗</div>
                <div className="billing-feature-text disabled">고급 기능 제한</div>
              </div>
            </div>
          </div>

          {/* Pro 플랜 카드 */}
          <div className="billing-plan-card popular">
            <div className="billing-discount-badge">인기</div>
            <div className="billing-plan-icon pro">
              <Crown className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-center mb-2">Pro 플랜</h3>
            <div className="billing-price-primary text-center billing-korean-price">9,900원</div>
            <div className="billing-price-secondary text-center">/ 월</div>
            <div className="billing-savings text-center">연간 결제시 23,760원 절약</div>
            <div className="billing-feature-list">
              <div className="billing-feature-item">
                <div className="billing-feature-icon check">✓</div>
                <div className="billing-feature-text">모든 기능 무제한</div>
              </div>
              <div className="billing-feature-item">
                <div className="billing-feature-icon check">✓</div>
                <div className="billing-feature-text">우선 지원</div>
              </div>
            </div>
          </div>

          {/* Team 플랜 카드 */}
          <div className="billing-plan-card">
            <div className="billing-plan-icon team">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-center mb-2">Team 플랜</h3>
            <div className="billing-price-primary text-center billing-korean-price">29,900원</div>
            <div className="billing-price-secondary text-center">/ 월</div>
            <div className="billing-feature-list">
              <div className="billing-feature-item">
                <div className="billing-feature-icon check">✓</div>
                <div className="billing-feature-text">Pro 모든 기능</div>
              </div>
              <div className="billing-feature-item">
                <div className="billing-feature-icon check">✓</div>
                <div className="billing-feature-text">팀 관리 기능</div>
              </div>
            </div>
          </div>
        </div>

        {/* 쿼터 표시 예시 */}
        <div className="billing-quota-display">
          <div className="billing-quota-text">
            <span>API 사용량</span>
            <span>850 / 1,000</span>
          </div>
          <div className="billing-quota-bar">
            <div 
              className="billing-quota-progress warning" 
              style={{ width: '85%' }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UpgradeSystemDemo