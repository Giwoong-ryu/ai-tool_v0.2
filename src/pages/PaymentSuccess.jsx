// src/pages/PaymentSuccess.jsx - 토스페이먼츠 결제 성공 페이지
import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card.jsx'
import { Button } from '../components/ui/button.jsx'
import { Badge } from '../components/ui/badge.jsx'
import { Alert, AlertDescription } from '../components/ui/alert.jsx'
import { CheckCircle, Loader2, CreditCard, Calendar, Receipt } from 'lucide-react'
import { PaymentService } from '../services/paymentService.js'
import useAuthStore from '../store/authStore.js'
import toast from 'react-hot-toast'

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user, updateProfile } = useAuthStore()
  
  const [isProcessing, setIsProcessing] = useState(true)
  const [paymentResult, setPaymentResult] = useState(null)
  const [error, setError] = useState(null)
  
  // URL 파라미터에서 결제 정보 추출
  const paymentKey = searchParams.get('paymentKey')
  const orderId = searchParams.get('orderId')
  const amount = parseInt(searchParams.get('amount') || '0')

  useEffect(() => {
    const processPayment = async () => {
      if (!paymentKey || !orderId || !amount) {
        setError('결제 정보가 올바르지 않습니다.')
        setIsProcessing(false)
        return
      }

      try {
        // 결제 확인 처리
        const result = await PaymentService.confirmPayment(paymentKey, orderId, amount)
        setPaymentResult(result.paymentResult)
        
        // 사용자 프로필 새로고침
        if (user) {
          await updateProfile()
        }
        
        toast.success('결제가 성공적으로 완료되었습니다!')
        
      } catch (error) {
        console.error('Payment confirmation failed:', error)
        setError(error.message || '결제 확인 중 오류가 발생했습니다.')
        toast.error('결제 확인에 실패했습니다.')
      } finally {
        setIsProcessing(false)
      }
    }

    processPayment()
  }, [paymentKey, orderId, amount, user, updateProfile])

  const handleGoToHome = () => {
    navigate('/')
  }

  const handleViewHistory = () => {
    navigate('/profile') // 프로필 페이지로 이동 (결제 내역 확인)
  }

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-500" />
              <div>
                <h3 className="text-lg font-semibold">결제 확인 중</h3>
                <p className="text-gray-600">잠시만 기다려주세요...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <CreditCard className="h-8 w-8 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-600">결제 확인 실패</h3>
                <p className="text-gray-600 mt-2">{error}</p>
              </div>
              <Button onClick={handleGoToHome} className="w-full">
                홈으로 돌아가기
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* 성공 메시지 */}
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-green-600">결제 완료!</h1>
                <p className="text-gray-600 mt-2">
                  구독이 성공적으로 활성화되었습니다.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 결제 정보 */}
        {paymentResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                결제 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">결제 번호</p>
                  <p className="font-mono text-sm bg-gray-50 p-2 rounded">
                    {paymentResult.paymentKey?.substring(0, 16)}...
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">주문 번호</p>
                  <p className="font-mono text-sm bg-gray-50 p-2 rounded">
                    {paymentResult.orderId}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">결제 금액</p>
                  <p className="text-lg font-bold">
                    {PaymentService.formatPrice(paymentResult.totalAmount || amount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">결제 수단</p>
                  <Badge variant="outline">
                    {paymentResult.method || '토스페이먼츠'}
                  </Badge>
                </div>
              </div>
              
              {paymentResult.approvedAt && (
                <div>
                  <p className="text-sm font-medium text-gray-600">결제 완료 시간</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">
                      {new Date(paymentResult.approvedAt).toLocaleString('ko-KR')}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 안내 메시지 */}
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            구독이 활성화되었습니다. 이제 프리미엄 기능을 이용하실 수 있습니다.
            영수증은 등록하신 이메일로 발송됩니다.
          </AlertDescription>
        </Alert>

        {/* 액션 버튼 */}
        <div className="flex gap-3">
          <Button onClick={handleGoToHome} className="flex-1">
            홈으로 돌아가기
          </Button>
          <Button onClick={handleViewHistory} variant="outline" className="flex-1">
            결제 내역 보기
          </Button>
        </div>

        {/* 고객 지원 */}
        <Card className="border-dashed">
          <CardContent className="py-4">
            <p className="text-sm text-gray-600 text-center">
              결제나 구독에 문의사항이 있으시면{' '}
              <a href="mailto:support@easypick.ai" className="text-blue-600 hover:underline">
                support@easypick.ai
              </a>로 연락주세요.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default PaymentSuccess