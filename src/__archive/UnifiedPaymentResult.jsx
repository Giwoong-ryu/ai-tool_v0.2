// [자동 분류] 이 파일은 현재 사용되지 않으며 중복된 컴포넌트로 판단되어 아카이브 처리되었습니다.
// src/components/UnifiedPaymentResult.jsx
import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Button } from './ui/button.jsx'
import { Alert, AlertDescription } from './ui/alert.jsx'
import { CheckCircle, XCircle, Loader2, Home, CreditCard } from 'lucide-react'
import { UnifiedPaymentService } from '../services/unifiedPaymentService.js'
import { confirmTossPayment, confirmPayPalPayment } from '../api/paymentAPI.js'
import { supabase } from '../lib/supabase.js'
import useAuthStore from '../store/authStore.js'
import toast from 'react-hot-toast'

const UnifiedPaymentResult = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [isProcessing, setIsProcessing] = useState(true)
  const [result, setResult] = useState(null)
  const { user, updateProfile } = useAuthStore()

  // URL 파라미터에서 결제 정보 추출
  const paymentKey = searchParams.get('paymentKey') // 토스페이먼츠
  const paypalOrderId = searchParams.get('paypalOrderId') // PayPal
  const orderId = searchParams.get('orderId')
  const amount = searchParams.get('amount')
  const success = searchParams.get('success') === 'true'
  const paymentMethod = searchParams.get('method') || 'auto'

  useEffect(() => {
    if (!orderId) {
      setResult({
        success: false,
        message: '잘못된 결제 정보입니다.'
      })
      setIsProcessing(false)
      return
    }

    if (success) {
      handlePaymentSuccess()
    } else {
      handlePaymentFailure()
    }
  }, [paymentKey, paypalOrderId, orderId, amount, success])

  const handlePaymentSuccess = async () => {
    try {
      setIsProcessing(true)

      let confirmationResult
      
      // 결제 방식에 따른 처리
      if (paymentKey) {
        // 토스페이먼츠 결제 확인
        confirmationResult = await confirmTossPayment(paymentKey, orderId, parseInt(amount))
      } else if (paypalOrderId) {
        // PayPal 결제 확인
        confirmationResult = await confirmPayPalPayment(paypalOrderId, orderId)
      } else {
        throw new Error('결제 정보가 부족합니다.')
      }

      if (confirmationResult.success) {
        // 결제 성공 후 구독 정보 업데이트
        await UnifiedPaymentService.updateSubscription(orderId)

        // 사용자 프로필 새로고침
        if (user) {
          const { data: updatedProfile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', user.id)
            .single()

          if (updatedProfile) {
            await updateProfile(updatedProfile)
          }
        }

        setResult({
          success: true,
          message: '결제가 성공적으로 완료되었습니다!',
          details: {
            orderId,
            amount: parseInt(amount),
            paymentMethod: paymentKey ? 'toss' : 'paypal',
            paymentData: confirmationResult.payment || confirmationResult.order
          }
        })

        toast.success('결제 완료! 구독이 활성화되었습니다.')
      } else {
        throw new Error(confirmationResult.message || '결제 확인 실패')
      }

    } catch (error) {
      console.error('Payment success handling error:', error)
      setResult({
        success: false,
        message: error.message || '결제 확인 중 오류가 발생했습니다. 고객센터에 문의해주세요.',
        details: {
          orderId,
          error: error.message,
          paymentMethod: paymentKey ? 'toss' : 'paypal'
        }
      })
      toast.error('결제 처리 중 오류가 발생했습니다.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePaymentFailure = async () => {
    try {
      const failReason = searchParams.get('message') || 
                         searchParams.get('code') || 
                         '결제가 실패했습니다.'
      
      // DB에 실패 정보 기록
      await supabase
        .from('payments')
        .update({
          status: 'failed',
          failed_reason: failReason,
          failed_at: new Date().toISOString()
        })
        .eq('order_id', orderId)

      setResult({
        success: false,
        message: failReason,
        details: { 
          orderId,
          paymentMethod: paymentKey ? 'toss' : 'paypal'
        }
      })

      toast.error('결제가 실패했습니다.')

    } catch (error) {
      console.error('Payment failure handling error:', error)
      setResult({
        success: false,
        message: '결제 처리 중 오류가 발생했습니다.',
        details: { orderId }
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleGoHome = () => {
    navigate('/')
  }

  const handleRetryPayment = () => {
    navigate('/pricing')
  }

  const handleViewBilling = () => {
    navigate('/account/billing')
  }

  const getPaymentMethodName = (method) => {
    switch (method) {
      case 'toss':
        return '토스페이먼츠'
      case 'paypal':
        return 'PayPal'
      default:
        return '결제'
    }
  }

  const formatAmount = (amount, method) => {
    if (method === 'toss') {
      return `₩${amount?.toLocaleString()}`
    } else {
      return `$${amount}`
    }
  }

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-500" />
          <h2 className="text-xl font-semibold">결제 처리 중...</h2>
          <p className="text-gray-600">잠시만 기다려주세요.</p>
          <div className="text-sm text-gray-500">
            {paymentKey ? '토스페이먼츠' : 'PayPal'} 결제를 확인하고 있습니다.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {result?.success ? (
            <>
              {/* 성공 아이콘 */}
              <div className="mb-6">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              </div>

              {/* 성공 메시지 */}
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                결제 완료!
              </h1>
              
              <Alert className="mb-6 border-green-200 bg-green-50">
                <AlertDescription className="text-green-800">
                  {result.message}
                </AlertDescription>
              </Alert>

              {/* 결제 상세 정보 */}
              {result.details && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                  <h3 className="font-semibold mb-3">결제 정보</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>주문번호:</span>
                      <span className="font-mono text-xs">{result.details.orderId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>결제방식:</span>
                      <span className="font-semibold">
                        {getPaymentMethodName(result.details.paymentMethod)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>결제금액:</span>
                      <span className="font-semibold text-blue-600">
                        {formatAmount(result.details.amount, result.details.paymentMethod)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>결제일시:</span>
                      <span>{new Date().toLocaleString('ko-KR')}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 혜택 안내 */}
              <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-semibold text-blue-800 mb-2">🎉 구독 혜택</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• 무제한 AI 도구 검색</li>
                  <li>• 고급 필터링 및 정렬</li>
                  <li>• 무제한 북마크 저장</li>
                  <li>• 월간 트렌드 리포트</li>
                  <li>• 우선 고객 지원</li>
                </ul>
              </div>

              {/* 성공 액션 버튼 */}
              <div className="space-y-3">
                <Button onClick={handleGoHome} className="w-full" size="lg">
                  <Home className="h-4 w-4 mr-2" />
                  서비스 이용하기
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={handleViewBilling}
                  className="w-full"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  결제 내역 확인
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* 실패 아이콘 */}
              <div className="mb-6">
                <XCircle className="h-16 w-16 text-red-500 mx-auto" />
              </div>

              {/* 실패 메시지 */}
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                결제 실패
              </h1>
              
              <Alert className="mb-6 border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">
                  {result.message}
                </AlertDescription>
              </Alert>

              {/* 실패 상세 정보 */}
              {result.details && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                  <h3 className="font-semibold mb-2">참조 정보</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>주문번호:</span>
                      <span className="font-mono text-xs">{result.details.orderId}</span>
                    </div>
                    {result.details.paymentMethod && (
                      <div className="flex justify-between">
                        <span>결제방식:</span>
                        <span>{getPaymentMethodName(result.details.paymentMethod)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 실패 원인별 안내 */}
              <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-semibold text-blue-800 mb-2">💡 해결 방법</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• 카드 잔액 및 한도를 확인해주세요</li>
                  <li>• 카드 정보가 정확한지 확인해주세요</li>
                  <li>• 다른 결제 방식을 시도해보세요</li>
                  <li>• 브라우저를 새로고침 후 재시도해주세요</li>
                </ul>
              </div>

              {/* 실패 액션 버튼 */}
              <div className="space-y-3">
                <Button onClick={handleRetryPayment} className="w-full" size="lg">
                  <CreditCard className="h-4 w-4 mr-2" />
                  다시 결제하기
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={handleGoHome}
                  className="w-full"
                >
                  <Home className="h-4 w-4 mr-2" />
                  홈으로 돌아가기
                </Button>
              </div>

              {/* 고객센터 안내 */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">고객센터</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>문제가 지속되면 고객센터에 문의해주세요.</p>
                  <p>📧 이메일: support@easypick.co.kr</p>
                  <p>📞 전화: 1588-0000 (평일 9시-18시)</p>
                  <p className="text-xs text-gray-500 mt-2">
                    주문번호를 함께 알려주시면 빠른 처리가 가능합니다.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default UnifiedPaymentResult