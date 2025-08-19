// src/features/auth/components/ClerkAuthModal.jsx
import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog.jsx'
import { Button } from '../../../components/ui/button.jsx'
import { SignIn, SignUp, useSignIn, useSignUp, useUser, useAuth } from '@clerk/clerk-react'
import { X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '../../../components/ui/alert.jsx'
import { syncClerkToSupabase, syncUserProfile } from '../../../lib/clerk.js'
import toast from 'react-hot-toast'

const ClerkAuthModal = ({ open, onOpenChange, onSuccess, defaultMode = 'sign-up' }) => {
  const [mode, setMode] = useState(defaultMode) // 'sign-up', 'sign-in'
  const [isLoading, setIsLoading] = useState(false)
  const [syncStatus, setSyncStatus] = useState('idle') // 'idle', 'syncing', 'success', 'error'
  const [message, setMessage] = useState('')

  const { user, isLoaded: userLoaded } = useUser()
  const { getToken, isSignedIn } = useAuth()

  // 인증 성공 시 Supabase 동기화 처리
  useEffect(() => {
    const handleAuthSuccess = async () => {
      if (userLoaded && isSignedIn && user && syncStatus === 'idle') {
        setSyncStatus('syncing')
        setMessage('계정 정보를 동기화하는 중...')

        try {
          // 1. JWT 토큰 동기화
          const token = await getToken({ template: 'supabase' })
          if (token) {
            const jwtSyncResult = await syncClerkToSupabase({ 
              getToken: () => Promise.resolve(token) 
            })
            
            if (!jwtSyncResult) {
              throw new Error('JWT 동기화 실패')
            }
          }

          // 2. 사용자 프로필 동기화
          const profile = await syncUserProfile(user)
          if (!profile) {
            throw new Error('프로필 동기화 실패')
          }

          setSyncStatus('success')
          setMessage('로그인이 완료되었습니다!')
          
          toast.success(`환영합니다, ${user.firstName || '사용자'}님!`)

          // 성공 콜백 호출
          if (onSuccess) {
            setTimeout(() => {
              onSuccess({
                user: {
                  id: user.id,
                  email: user.emailAddresses[0]?.emailAddress,
                  name: user.fullName || user.firstName,
                  avatar_url: user.imageUrl
                },
                profile
              })
            }, 1000)
          }

          // 모달 닫기
          setTimeout(() => {
            onOpenChange(false)
            resetState()
          }, 1500)

        } catch (error) {
          console.error('❌ 인증 동기화 오류:', error)
          setSyncStatus('error')
          setMessage('계정 동기화 중 오류가 발생했습니다. 다시 시도해주세요.')
          toast.error('로그인 처리 중 오류가 발생했습니다.')
        }
      }
    }

    handleAuthSuccess()
  }, [userLoaded, isSignedIn, user, getToken, syncStatus, onSuccess, onOpenChange])

  // 상태 초기화
  const resetState = () => {
    setSyncStatus('idle')
    setMessage('')
    setIsLoading(false)
  }

  // 모달 닫기 시 상태 초기화
  useEffect(() => {
    if (!open) {
      setTimeout(resetState, 300) // 애니메이션 후 초기화
    }
  }, [open])

  // Clerk 컴포넌트 공통 props
  const getClerkProps = () => ({
    appearance: {
      elements: {
        formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-md transition-colors',
        formFieldInput: 'border border-gray-300 rounded-md px-3 py-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors',
        footerActionLink: 'text-blue-600 hover:text-blue-700 font-medium transition-colors',
        card: 'shadow-none border-0 bg-transparent',
        headerTitle: 'text-2xl font-bold text-gray-900 text-center mb-2',
        headerSubtitle: 'text-gray-600 text-center text-sm mb-6',
        socialButtonsBlockButton: 'border border-gray-300 hover:bg-gray-50 rounded-md py-2.5 px-4 transition-colors',
        socialButtonsBlockButtonText: 'text-gray-700 font-medium',
        dividerLine: 'bg-gray-200',
        dividerText: 'text-gray-500 text-sm',
        formFieldLabel: 'text-gray-700 font-medium text-sm mb-1 block',
        alertError: 'bg-red-50 border border-red-200 text-red-800 rounded-md p-3 text-sm',
        identityPreviewEditButton: 'text-blue-600 hover:text-blue-700 text-sm font-medium',
        formFieldSuccessText: 'text-green-600 text-sm mt-1',
        footer: 'mt-6'
      },
      layout: {
        socialButtonsPlacement: 'top',
        socialButtonsVariant: 'blockButton',
        termsPageUrl: '/terms',
        privacyPageUrl: '/privacy'
      },
      variables: {
        colorPrimary: '#2563eb',
        colorText: '#111827',
        colorTextSecondary: '#6b7280',
        colorBackground: '#ffffff',
        colorInputBackground: '#ffffff',
        colorInputText: '#111827',
        borderRadius: '0.375rem',
        spacingUnit: '0.5rem'
      }
    },
    localization: {
      signUp: {
        start: {
          title: '계정 만들기',
          subtitle: 'EasyPick에 오신 것을 환영합니다!',
          actionText: '이미 계정이 있으신가요?',
          actionLink: '로그인'
        }
      },
      signIn: {
        start: {
          title: '로그인',
          subtitle: 'EasyPick 계정으로 로그인하세요',
          actionText: '계정이 없으신가요?',
          actionLink: '회원가입'
        }
      }
    },
    afterSignUpUrl: window.location.origin,
    afterSignInUrl: window.location.origin,
    signUpUrl: '#',
    signInUrl: '#'
  })

  const renderSyncingState = () => (
    <div className="flex flex-col items-center justify-center py-8 space-y-4">
      {syncStatus === 'syncing' && (
        <>
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <div className="text-center">
            <p className="font-medium text-gray-900">계정 설정 중...</p>
            <p className="text-sm text-gray-600 mt-1">잠시만 기다려주세요</p>
          </div>
        </>
      )}
      
      {syncStatus === 'success' && (
        <>
          <CheckCircle2 className="h-8 w-8 text-green-600" />
          <div className="text-center">
            <p className="font-medium text-gray-900">로그인 완료!</p>
            <p className="text-sm text-gray-600 mt-1">환영합니다</p>
          </div>
        </>
      )}
      
      {syncStatus === 'error' && (
        <>
          <AlertCircle className="h-8 w-8 text-red-600" />
          <div className="text-center">
            <p className="font-medium text-gray-900">오류가 발생했습니다</p>
            <p className="text-sm text-gray-600 mt-1">다시 시도해주세요</p>
          </div>
          <Button 
            variant="outline" 
            onClick={resetState}
            className="mt-4"
          >
            다시 시도
          </Button>
        </>
      )}
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader className="relative">
          <DialogTitle className="text-center text-2xl font-bold">
            {syncStatus !== 'idle' ? '계정 처리 중' : (mode === 'sign-up' ? '회원가입' : '로그인')}
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-6 w-6 p-0"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        {/* 상태 메시지 */}
        {message && syncStatus !== 'idle' && (
          <Alert className={`mb-4 ${syncStatus === 'success' ? 'border-green-200 bg-green-50' : 
                            syncStatus === 'error' ? 'border-red-200 bg-red-50' : 
                            'border-blue-200 bg-blue-50'}`}>
            <AlertDescription className={`${syncStatus === 'success' ? 'text-green-800' : 
                                         syncStatus === 'error' ? 'text-red-600' : 
                                         'text-blue-800'}`}>
              {message}
            </AlertDescription>
          </Alert>
        )}

        {/* 동기화 상태 렌더링 */}
        {syncStatus !== 'idle' ? (
          renderSyncingState()
        ) : (
          // Clerk 인증 컴포넌트
          <div className="space-y-4">
            {mode === 'sign-up' ? (
              <SignUp
                {...getClerkProps()}
                routing="virtual"
                onClerkAPIResponseError={(error) => {
                  console.error('회원가입 오류:', error)
                  toast.error('회원가입 중 오류가 발생했습니다.')
                }}
              />
            ) : (
              <SignIn
                {...getClerkProps()}
                routing="virtual"
                onClerkAPIResponseError={(error) => {
                  console.error('로그인 오류:', error)
                  toast.error('로그인 중 오류가 발생했습니다.')
                }}
              />
            )}

            {/* 모드 전환 링크 */}
            <div className="text-center text-sm pt-4 border-t border-gray-200">
              {mode === 'sign-in' ? (
                <p className="text-gray-600">
                  계정이 없으신가요?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('sign-up')}
                    className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    회원가입
                  </button>
                </p>
              ) : (
                <p className="text-gray-600">
                  이미 계정이 있으신가요?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('sign-in')}
                    className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    로그인
                  </button>
                </p>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default ClerkAuthModal