// src/components/PaymentResult.jsx
import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Button } from './ui/button.jsx'
import { Alert, AlertDescription } from './ui/alert.jsx'
import { CheckCircle, XCircle, Loader2, Home, CreditCard } from 'lucide-react'
import { PaymentService } from '../services/paymentService.js'
import { supabase } from '../lib/supabase.js'
import useAuthStore from '../store/authStore.js'
import toast from 'react-hot-toast'

const PaymentResult = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [isProcessing, setIsProcessing] = useState(true)
  const [result, setResult] = useState(null)
  const { user, updateProfile } = useAuthStore()

  // URL 파라미터에서 결제 정보 추출
  const paymentKey = searchParams.get('paymentKey')
  const orderId = searchParams.get('orderId')
  const amount = searchParams.get('amount')
  const success = searchParams.get('success') === 'true'

  useEffect(() => {
    if (!paymentKey || !orderId || !amount) {
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
  }, [paymentKey, orderId, amount, success])

  const handlePaymentSuccess = async () => {
    try {
      setIsProcessing(true)

      // 결제 확인 및 구독 활성화
      await PaymentService.confirmPayment(paymentKey, orderId, parseInt(amount))

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
          amount: parseInt(amount)
        }
      })

    } catch (error) {
      console.error('Payment success handling error:', error)
      setResult({
        success: false,
        message: '결제 확인 중 오류가 발생했습니다. 고객센터에 문의해주세요.',
        details: {
          orderId,
          error: error.message
        }
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePaymentFailure = async () => {
    try {
      // 결제 실패 상태 업데이트
      const failReason = searchParams.get('message') || '결제가 실패했습니다.'
      
      // DB에 실패 정보 기록
      await supabase
        .from('payments')
        .update({
          status: 'failed',
          failed_reason: failReason
        })
        .eq('order_id', orderId)

      setResult({
        success: false,
        message: failReason,
        details: { orderId }
      })

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

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-500" />
          <h2 className="text-xl font-semibold">결제 처리 중...</h2>
          <p className="text-gray-600">잠시만 기다려주세요.</p>
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
                  <h3 className="font-semibold mb-2">결제 정보</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>주문번호:</span>
                      <span className="font-mono">{result.details.orderId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>결제금액:</span>
                      <span className="font-semibold">
                        ₩{result.details.amount?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 성공 액션 버튼 */}
              <div className="space-y-3">
                <Button onClick={handleGoHome} className="w-full" size="lg">
                  <Home className="h-4 w-4 mr-2" />
                  서비스 이용하기
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/account/billing')}
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
              {result.details?.orderId && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                  <h3 className="font-semibold mb-2">참조 정보</h3>
                  <div className="text-sm">
                    <div className="flex justify-between">
                      <span>주문번호:</span>
                      <span className="font-mono">{result.details.orderId}</span>
                    </div>
                  </div>
                </div>
              )}

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
              <div className="mt-6 text-sm text-gray-500">
                <p>문제가 지속되면 고객센터에 문의해주세요.</p>
                <p>이메일: support@easypick.co.kr</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default PaymentResult
