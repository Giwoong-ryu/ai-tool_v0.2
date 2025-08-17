// src/components/billing/PaymentModalPayPal.jsx
import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog.jsx'
import { Button } from '../ui/button.jsx'
import { Badge } from '../ui/badge.jsx'
import { Separator } from '../ui/separator.jsx'
import { Alert, AlertDescription } from '../ui/alert.jsx'
import { Check, Crown, Zap, Loader2, LogIn, AlertCircle } from 'lucide-react'
import PayPalButton from '../../features/payment/components/PayPalButton.jsx'
import useAuthStore from '../../store/authStore.js'
import useModalStore, { MODAL_TYPES } from '../../store/modalStore.js'
import { canUseTossPayments, isBillingEnabled } from '../../lib/featureFlags.js'
import toast from 'react-hot-toast'

const PaymentModalPayPal = ({ isOpen, onClose, plan = 'pro', onAuthRequired }) => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentStep, setPaymentStep] = useState('plan') // 'plan', 'payment', 'success'
  
  // Auth Store
  const { user, profile, isAuthenticated, isLoading } = useAuthStore()
  
  // Modal Store에서 데이터 가져오기
  const { getModalData, closeModal } = useModalStore()
  const modalData = getModalData(MODAL_TYPES.PAYMENT)

  // Feature Flag 체크
  if (!isBillingEnabled()) {
    return null
  }

  // 플랜 정보 정의
  const plans = {
    basic: {
      name: 'Basic',
      price: 9900, // 월 9,900원
      yearlyPrice: 99000, // 연 99,000원 (2개월 무료)
      icon: Zap,
      color: 'text-blue-500',
      features: [
        '월 1,000회 AI 도구 사용',
        '기본 템플릿 모음',
        '이메일 지원',
        '기본 워크플로우'
      ]
    },
    pro: {
      name: 'Pro',
      price: 19900, // 월 19,900원
      yearlyPrice: 199000, // 연 199,000원 (2개월 무료)
      icon: Crown,
      color: 'text-yellow-500',
      features: [
        '무제한 AI 도구 사용',
        '프리미엄 템플릿 전체',
        '우선 지원 (24시간)',
        '고급 워크플로우',
        'API 접근 권한',
        '커스텀 브랜딩'
      ]
    }
  }

  const currentPlan = plans[plan] || plans.pro
  const PlanIcon = currentPlan.icon

  // 인증되지 않은 경우 로그인 안내
  if (!isAuthenticated && !isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center flex items-center justify-center gap-2">
              <LogIn className="h-5 w-5 text-[#2E7D6E]" />
              로그인 필요
            </DialogTitle>
          </DialogHeader>
          
          <div className="text-center py-6 space-y-4">
            <div className="p-4 bg-[#2E7D6E] bg-opacity-10 rounded-lg">
              <PlanIcon className={`h-8 w-8 mx-auto mb-2 ${currentPlan.color}`} />
              <p className="text-gray-600 mb-2">
                <strong>{currentPlan.name} 플랜</strong> 구독을 위해
              </p>
              <p className="text-gray-600">
                먼저 로그인해주세요.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={() => {
                  onClose()
                  if (onAuthRequired) onAuthRequired()
                }}
                className="bg-[#2E7D6E] hover:bg-[#2a6b5d] flex-1"
              >
                로그인하기
              </Button>
              <Button 
                variant="outline" 
                onClick={onClose}
                className="flex-1"
              >
                나중에
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // 이미 유료 사용자인 경우
  if (profile?.subscription_tier && profile.subscription_tier !== 'free') {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-[#2E7D6E]">
              이미 구독 중입니다
            </DialogTitle>
          </DialogHeader>
          
          <div className="text-center py-6 space-y-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <Check className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="text-gray-600">
                현재 <strong>{profile.subscription_tier}</strong> 플랜을 이용 중입니다.
              </p>
            </div>
            
            <Button onClick={onClose} className="w-full">
              확인
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // PayPal 결제 성공 핸들러
  const handlePaymentSuccess = async (details) => {
    setIsProcessing(true)
    
    try {
      // 여기서 백엔드에 결제 정보 전송 및 구독 활성화
      console.log('PayPal 결제 성공:', details)
      
      // 성공 단계로 이동
      setPaymentStep('success')
      
      toast.success('결제가 완료되었습니다!')
      
      // 3초 후 모달 닫기
      setTimeout(() => {
        onClose()
        setPaymentStep('plan')
      }, 3000)
      
    } catch (error) {
      console.error('결제 처리 중 오류:', error)
      toast.error('결제 처리 중 오류가 발생했습니다.')
    } finally {
      setIsProcessing(false)
    }
  }

  // PayPal 결제 오류 핸들러
  const handlePaymentError = (error) => {
    console.error('PayPal 결제 오류:', error)
    toast.error('결제 중 오류가 발생했습니다. 다시 시도해주세요.')
    setIsProcessing(false)
  }

  // PayPal 결제 취소 핸들러
  const handlePaymentCancel = () => {
    toast('결제가 취소되었습니다.')
    setIsProcessing(false)
  }

  // 결제 단계로 이동
  const proceedToPayment = () => {
    setPaymentStep('payment')
  }

  // 성공 화면
  if (paymentStep === 'success') {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-8 space-y-4">
            <div className="p-4 bg-green-50 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
              <Check className="h-10 w-10 text-green-500" />
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                결제 완료!
              </h2>
              <p className="text-gray-600">
                <strong>{currentPlan.name} 플랜</strong> 구독이 활성화되었습니다.
              </p>
            </div>
            
            <div className="bg-[#2E7D6E] bg-opacity-10 rounded-lg p-4">
              <p className="text-sm text-gray-600">
                이제 무제한으로 AI 도구를 사용하실 수 있습니다!
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // 결제 화면
  if (paymentStep === 'payment') {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <PlanIcon className={`h-6 w-6 ${currentPlan.color}`} />
                <span className="text-xl font-bold text-[#2E7D6E]">
                  {currentPlan.name} 플랜 결제
                </span>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* 결제 요약 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">{currentPlan.name} 플랜 (월간)</span>
                <span className="text-lg font-bold text-[#2E7D6E]">
                  ₩{currentPlan.price.toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                매월 자동 결제됩니다
              </p>
            </div>

            <Separator />

            {/* 포함된 기능 */}
            <div className="space-y-3">
              <h3 className="font-semibold">포함된 기능</h3>
              <div className="space-y-2">
                {currentPlan.features.slice(0, 4).map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* PayPal 결제 버튼 */}
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  PayPal로 안전하게 결제하세요
                </p>
              </div>

              {isProcessing ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-[#2E7D6E]" />
                  <span className="ml-2 text-gray-600">결제 처리 중...</span>
                </div>
              ) : (
                <PayPalButton
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  onCancel={handlePaymentCancel}
                />
              )}

              <div className="text-center">
                <button
                  onClick={() => setPaymentStep('plan')}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  ← 뒤로 가기
                </button>
              </div>
            </div>

            {/* 안내사항 */}
            <div className="text-xs text-gray-500 space-y-1 bg-gray-50 p-3 rounded-lg">
              <p>• PayPal을 통해 안전하게 결제됩니다.</p>
              <p>• 언제든지 구독을 취소할 수 있습니다.</p>
              <p>• 환불 정책은 이용약관을 참고해주세요.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // 플랜 선택 화면 (기본)
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <PlanIcon className={`h-6 w-6 ${currentPlan.color}`} />
              <span className="text-2xl font-bold text-[#2E7D6E]">
                {currentPlan.name} 플랜
              </span>
            </div>
            <p className="text-sm text-gray-600 font-normal">
              무제한 AI 도구 사용으로 업그레이드하세요
            </p>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 가격 정보 */}
          <div className="text-center bg-gradient-to-br from-[#2E7D6E] to-[#3a9e8e] text-white rounded-xl p-6">
            <div className="text-4xl font-bold mb-2">
              ₩{currentPlan.price.toLocaleString()}
            </div>
            <div className="text-white text-opacity-90">
              월 / 사용자
            </div>
            
            {/* 연간 할인 안내 */}
            <div className="mt-4 p-3 bg-white bg-opacity-20 rounded-lg">
              <p className="text-sm">
                💰 연간 결제 시 <strong>2개월 무료</strong>
              </p>
              <p className="text-xs text-white text-opacity-80 mt-1">
                월 ₩{Math.floor(currentPlan.yearlyPrice / 12).toLocaleString()} (₩{(currentPlan.price * 2).toLocaleString()} 절약)
              </p>
            </div>
          </div>

          {/* 현재 사용 현황 */}
          {profile && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                현재 <strong>{profile.usage_count || 0}회</strong> 사용하셨습니다.
                무료 플랜은 월 100회까지 사용 가능합니다.
              </AlertDescription>
            </Alert>
          )}

          {/* 포함된 기능 */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              포함된 모든 기능
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {currentPlan.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* CTA 버튼 */}
          <div className="space-y-3">
            <Button
              onClick={proceedToPayment}
              className="w-full h-12 text-lg bg-[#2E7D6E] hover:bg-[#2a6b5d]"
              size="lg"
            >
              {currentPlan.name} 플랜 시작하기
            </Button>
            
            <p className="text-center text-xs text-gray-500">
              언제든지 취소할 수 있으며, 첫 7일은 무료로 체험하실 수 있습니다.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default PaymentModalPayPal