// src/features/payment/components/PaymentModal.jsx
import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog.jsx'
import { Button } from '../../../components/ui/button.jsx'
import { Badge } from '../../../components/ui/badge.jsx'
import { Separator } from '../../../components/ui/separator.jsx'
import { Alert, AlertDescription } from '../../../components/ui/alert.jsx'
import { Check, Crown, Zap, Loader2, CreditCard } from 'lucide-react'
import { PaymentService } from '../../../services/paymentService.js'
import useAuthStore from '../../../store/authStore.js'
import toast from 'react-hot-toast'

const PaymentModal = ({ open, onOpenChange, plan = 'basic' }) => {
  const [selectedBilling, setSelectedBilling] = useState('monthly')
  const [isProcessing, setIsProcessing] = useState(false)
  const { user, profile, updateProfile } = useAuthStore()

  const currentPlan = PaymentService.PLANS[plan]

  if (!currentPlan) {
    return null
  }

  // 가격 계산
  const monthlyPrice = currentPlan.price
  const yearlyPrice = Math.floor(monthlyPrice * 12 * 0.8) // 20% 할인
  const yearlyMonthlyPrice = Math.floor(yearlyPrice / 12)
  const yearlySavings = (monthlyPrice * 12) - yearlyPrice

  const handlePayment = async () => {
    if (!user) {
      toast.error('로그인이 필요합니다.')
      return
    }

    setIsProcessing(true)

    try {
      // 결제 요청 생성
      const { payment, paymentData } = await PaymentService.createPayment(
        user.id,
        plan,
        selectedBilling
      )

      // 토스페이먼츠 결제창 호출
      await PaymentService.requestTossPayment(paymentData)

    } catch (error) {
      console.error('Payment process error:', error)
      
      if (error.code !== 'USER_CANCEL') {
        toast.error('결제 처리 중 오류가 발생했습니다.')
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const PlanIcon = plan === 'pro' ? Crown : Zap

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <PlanIcon className={`h-6 w-6 ${plan === 'pro' ? 'text-yellow-500' : 'text-blue-500'}`} />
              <span className="text-2xl font-bold">{currentPlan.name} 플랜</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 현재 구독 상태 */}
          {profile?.subscription_tier !== 'free' && (
            <Alert>
              <AlertDescription>
                현재 <strong>{profile.subscription_tier}</strong> 플랜을 사용 중입니다.
                {plan !== profile.subscription_tier && ' 플랜을 변경하시겠습니까?'}
              </AlertDescription>
            </Alert>
          )}

          {/* 요금제 선택 */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">요금제 선택</h3>
            
            {/* 월간 플랜 */}
            <div 
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                selectedBilling === 'monthly' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedBilling('monthly')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      selectedBilling === 'monthly' 
                        ? 'border-blue-500 bg-blue-500' 
                        : 'border-gray-300'
                    }`}>
                      {selectedBilling === 'monthly' && (
                        <div className="w-full h-full rounded-full bg-white transform scale-50"></div>
                      )}
                    </div>
                    <span className="font-medium">월간 결제</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">매월 자동 결제</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">₩{monthlyPrice.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">/ 월</div>
                </div>
              </div>
            </div>

            {/* 연간 플랜 */}
            <div 
              className={`border rounded-lg p-4 cursor-pointer transition-all relative ${
                selectedBilling === 'yearly' 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedBilling('yearly')}
            >
              <Badge className="absolute -top-2 -right-2 bg-green-500 text-white">
                20% 절약
              </Badge>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      selectedBilling === 'yearly' 
                        ? 'border-green-500 bg-green-500' 
                        : 'border-gray-300'
                    }`}>
                      {selectedBilling === 'yearly' && (
                        <div className="w-full h-full rounded-full bg-white transform scale-50"></div>
                      )}
                    </div>
                    <span className="font-medium">연간 결제</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    월 ₩{yearlyMonthlyPrice.toLocaleString()} (₩{yearlySavings.toLocaleString()} 절약)
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">₩{yearlyPrice.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">/ 년</div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* 포함된 기능 */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">포함된 기능</h3>
            <div className="space-y-2">
              {currentPlan.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* 결제 정보 */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">결제 정보</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span>플랜</span>
                <span>{currentPlan.name}</span>
              </div>
              <div className="flex justify-between">
                <span>결제 주기</span>
                <span>{selectedBilling === 'monthly' ? '월간' : '연간'}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg">
                <span>총 결제 금액</span>
                <span>
                  ₩{(selectedBilling === 'monthly' ? monthlyPrice : yearlyPrice).toLocaleString()}
                </span>
              </div>
              {selectedBilling === 'yearly' && (
                <div className="text-sm text-green-600 text-center">
                  월간 대비 ₩{yearlySavings.toLocaleString()} 절약!
                </div>
              )}
            </div>
          </div>

          {/* 결제 버튼 */}
          <Button
            onClick={handlePayment}
            disabled={isProcessing}
            className="w-full h-12 text-lg"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                결제 처리 중...
              </>
            ) : (
              <>
                <CreditCard className="h-5 w-5 mr-2" />
                ₩{(selectedBilling === 'monthly' ? monthlyPrice : yearlyPrice).toLocaleString()} 결제하기
              </>
            )}
          </Button>

          {/* 안내사항 */}
          <div className="text-xs text-gray-500 space-y-1">
            <p>• 결제는 토스페이먼츠를 통해 안전하게 처리됩니다.</p>
            <p>• 구독은 언제든지 취소할 수 있으며, 현재 기간이 끝날 때까지 서비스를 이용할 수 있습니다.</p>
            <p>• 환불 정책은 이용약관을 참고해주세요.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default PaymentModal
