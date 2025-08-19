// src/pages/PaymentFail.jsx - 토스페이먼츠 결제 실패 페이지
import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card.jsx'
import { Button } from '../components/ui/button.jsx'
import { Alert, AlertDescription } from '../components/ui/alert.jsx'
import { XCircle, AlertTriangle, CreditCard, RefreshCw } from 'lucide-react'
import { PaymentService } from '../services/paymentService.js'
import { supabase } from '../lib/supabase.js'
import toast from 'react-hot-toast'

const PaymentFail = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  const [paymentInfo, setPaymentInfo] = useState(null)
  const [isRetrying, setIsRetrying] = useState(false)
  
  // URL 파라미터에서 오류 정보 추출
  const code = searchParams.get('code')
  const message = searchParams.get('message')
  const orderId = searchParams.get('orderId')

  useEffect(() => {
    const updateFailedPayment = async () => {
      if (!orderId) return

      try {
        // 결제 실패 상태를 DB에 기록
        await supabase
          .from('payments')
          .update({
            status: 'failed',
            failed_reason: message || '결제 실패',
            updated_at: new Date().toISOString()
          })
          .eq('order_id', orderId)

        // 결제 정보 조회
        const { data: payment } = await supabase
          .from('payments')
          .select('*')
          .eq('order_id', orderId)
          .single()

        if (payment) {
          setPaymentInfo(payment)
        }
      } catch (error) {
        console.error('Failed payment update error:', error)
      }
    }

    updateFailedPayment()
  }, [orderId, message])

  const getErrorMessage = () => {
    const errorMessages = {
      'PAY_PROCESS_CANCELED': '사용자가 결제를 취소했습니다.',
      'PAY_PROCESS_ABORTED': '결제 진행 중 오류가 발생했습니다.',
      'REJECT_CARD_COMPANY': '카드사에서 결제를 거절했습니다.',
      'INVALID_CARD_NUMBER': '잘못된 카드 번호입니다.',
      'NOT_SUPPORTED_INSTALLMENT': '지원하지 않는 할부 개월 수입니다.',
      'EXCEED_MAX_CARD_INSTALLMENT': '설정 가능한 최대 할부 개월 수를 초과했습니다.',
      'INVALID_EXPIRED_YEAR': '잘못된 유효연도입니다.',
      'INVALID_EXPIRED_MONTH': '잘못된 유효월입니다.',
      'EXCEED_MAX_DAILY_PAYMENT_COUNT': '하루 결제 가능 횟수를 초과했습니다.',
      'NOT_AVAILABLE_BANK': '은행 서비스 시간이 아닙니다.',
      'EXCEED_MAX_ONE_DAY_WITHDRAW_AMOUNT': '일일 출금 한도를 초과했습니다.',
      'EXCEED_MAX_ONE_TIME_WITHDRAW_AMOUNT': '1회 출금 한도를 초과했습니다.',
      'CARD_PROCESSING_ERROR': '카드사 처리 중 오류가 발생했습니다.',
      'CARD_LOST_OR_STOLEN': '분실 또는 도난 카드입니다.',
      'RESTRICTED_TRANSFER_ACCOUNT': '계좌 이체가 제한된 계좌입니다.',
      'INVALID_ACCOUNT_INFO': '계좌 정보가 일치하지 않습니다.',
      'FORBIDDEN_REQUEST': '허용되지 않은 요청입니다.',
      'MAX_NORMAL_PAYMENT_EXCEED': '정상 결제 한도를 초과했습니다.',
      'MAX_PAYMENT_MONEY_EXCEED': '결제 금액 한도를 초과했습니다.',
      'MAX_GUEST_PAYMENT_EXCEED': '비회원 결제 한도를 초과했습니다.'
    }

    return errorMessages[code] || message || '알 수 없는 오류가 발생했습니다.'
  }

  const getErrorSolution = () => {
    const solutions = {
      'PAY_PROCESS_CANCELED': '결제를 다시 시도하시거나 다른 결제 수단을 이용해보세요.',
      'REJECT_CARD_COMPANY': '다른 카드를 사용하시거나 카드사에 문의해보세요.',
      'INVALID_CARD_NUMBER': '카드 번호를 다시 확인해주세요.',
      'NOT_SUPPORTED_INSTALLMENT': '일시불 또는 다른 할부 개월 수를 선택해주세요.',
      'INVALID_EXPIRED_YEAR': '카드의 유효기간을 다시 확인해주세요.',
      'INVALID_EXPIRED_MONTH': '카드의 유효기간을 다시 확인해주세요.',
      'EXCEED_MAX_DAILY_PAYMENT_COUNT': '내일 다시 시도하시거나 다른 결제 수단을 이용해보세요.',
      'NOT_AVAILABLE_BANK': '은행 영업시간에 다시 시도해보세요.',
      'EXCEED_MAX_ONE_DAY_WITHDRAW_AMOUNT': '다른 계좌나 결제 수단을 이용해보세요.',
      'CARD_LOST_OR_STOLEN': '카드사에 문의하여 카드 상태를 확인해보세요.',
      'RESTRICTED_TRANSFER_ACCOUNT': '다른 계좌나 결제 수단을 이용해보세요.',
      'INVALID_ACCOUNT_INFO': '계좌 정보를 다시 확인해주세요.'
    }

    return solutions[code] || '다른 결제 수단을 시도하거나 고객센터에 문의해주세요.'
  }

  const handleRetryPayment = async () => {
    if (!paymentInfo) return

    setIsRetrying(true)
    try {
      // 새로운 결제 요청 생성
      const planType = PaymentService.extractPlanFromOrderId(paymentInfo.order_id)
      const isYearly = paymentInfo.amount > (planType === 'basic' ? 9800 : 19800)
      
      const { payment, paymentData } = await PaymentService.createPayment(
        paymentInfo.user_id,
        planType,
        isYearly ? 'yearly' : 'monthly'
      )

      // 토스페이먼츠 결제 처리
      await PaymentService.requestTossPayment(paymentData)
      
    } catch (error) {
      console.error('Retry payment error:', error)
      toast.error('결제 재시도 중 오류가 발생했습니다.')
    } finally {
      setIsRetrying(false)
    }
  }

  const handleGoToHome = () => {
    navigate('/')
  }

  const handleContactSupport = () => {
    window.open('mailto:support@easypick.ai?subject=결제 문의&body=결제 실패 관련 문의입니다.', '_blank')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* 실패 메시지 */}
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-red-600">결제 실패</h1>
                <p className="text-gray-600 mt-2">
                  결제 처리 중 문제가 발생했습니다.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 오류 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              오류 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>오류 원인:</strong> {getErrorMessage()}
              </AlertDescription>
            </Alert>

            <Alert>
              <AlertDescription>
                <strong>해결 방법:</strong> {getErrorSolution()}
              </AlertDescription>
            </Alert>

            {/* 결제 정보 */}
            {paymentInfo && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-medium mb-3">실패한 결제 정보</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">주문 번호:</span>
                    <span className="ml-2 font-mono">{paymentInfo.order_id}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">결제 금액:</span>
                    <span className="ml-2 font-semibold">
                      {PaymentService.formatPrice(paymentInfo.amount)}
                    </span>
                  </div>
                  {code && (
                    <div className="md:col-span-2">
                      <span className="text-gray-600">오류 코드:</span>
                      <span className="ml-2 font-mono text-red-600">{code}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 안내 사항 */}
        <Alert>
          <CreditCard className="h-4 w-4" />
          <AlertDescription>
            카드나 계좌에서 금액이 차감되었다면, 실패한 결제는 자동으로 취소되어 
            영업일 기준 3-5일 내에 환불됩니다.
          </AlertDescription>
        </Alert>

        {/* 액션 버튼 */}
        <div className="space-y-3">
          {paymentInfo && (
            <Button 
              onClick={handleRetryPayment} 
              disabled={isRetrying}
              className="w-full"
              size="lg"
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  다시 결제하는 중...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  다시 결제하기
                </>
              )}
            </Button>
          )}
          
          <div className="flex gap-3">
            <Button onClick={handleGoToHome} variant="outline" className="flex-1">
              홈으로 돌아가기
            </Button>
            <Button onClick={handleContactSupport} variant="outline" className="flex-1">
              고객센터 문의
            </Button>
          </div>
        </div>

        {/* 도움말 */}
        <Card className="border-dashed">
          <CardContent className="py-4">
            <h4 className="font-medium mb-2">자주 발생하는 문제</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• 카드 한도 초과: 카드사에 문의하여 한도를 확인해보세요</li>
              <li>• 해외결제 차단: 카드사에 해외결제 허용을 요청하세요</li>
              <li>• 보안카드/OTP: 카드사 앱에서 결제 승인을 확인하세요</li>
              <li>• 인터넷뱅킹: 은행 홈페이지에서 이체한도를 확인하세요</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default PaymentFail