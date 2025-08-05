import React, { useEffect, useState } from 'react'
import { Button } from '../../../components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card.jsx'
import { Alert, AlertDescription } from '../../../components/ui/alert.jsx'
import { Loader2 } from 'lucide-react'
import { loadPayPalScript, createPayPalOrder, capturePayPalOrder } from '../config/paypal.js'
import useAuthStore from '../../../store/authStore.js'

function PayPalButton({ onSuccess, onError, onCancel }) {
  const [loading, setLoading] = useState(true)
  const [paypalLoaded, setPaypalLoaded] = useState(false)
  const user = useAuthStore((state) => state.user)

  useEffect(() => {
    loadPayPalScript()
      .then((paypal) => {
        setPaypalLoaded(true)
        setLoading(false)
        
        // PayPal 버튼 렌더링
        paypal.Buttons({
          createOrder: async (data, actions) => {
            try {
              const orderData = await createPayPalOrder()
              return actions.order.create(orderData)
            } catch (error) {
              console.error('주문 생성 실패:', error)
              onError && onError(error)
              throw error
            }
          },
          onApprove: async (data, actions) => {
            try {
              // 결제 승인
              const details = await actions.order.capture()
              
              // 백엔드에 결제 확인 요청
              const result = await capturePayPalOrder(details.id)
              
              if (result.success) {
                onSuccess && onSuccess(details)
              } else {
                throw new Error('결제 처리 실패')
              }
            } catch (error) {
              console.error('결제 승인 실패:', error)
              onError && onError(error)
            }
          },
          onCancel: (data) => {
            onCancel && onCancel(data)
          },
          onError: (err) => {
            console.error('PayPal 오류:', err)
            onError && onError(err)
          },
          style: {
            layout: 'vertical',
            color: 'gold',
            shape: 'rect',
            label: 'paypal'
          }
        }).render('#paypal-button-container')
      })
      .catch((error) => {
        console.error('PayPal SDK 로드 실패:', error)
        setLoading(false)
        onError && onError(error)
      })
  }, [onSuccess, onError, onCancel])

  if (!user) {
    return (
      <Alert>
        <AlertDescription>
          결제하려면 먼저 로그인해주세요.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="w-full">
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      )}
      <div id="paypal-button-container" className={loading ? 'hidden' : ''}></div>
    </div>
  )
}

export default PayPalButton
