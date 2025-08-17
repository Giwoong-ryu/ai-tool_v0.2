// src/features/auth/components/AuthModal.jsx
import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog.jsx'
import { Button } from '../../../components/ui/button.jsx'
import { Input } from '../../../components/ui/input.jsx'
import { Label } from '../../../components/ui/label.jsx'
import { Separator } from '../../../components/ui/separator.jsx'
import { Alert, AlertDescription } from '../../../components/ui/alert.jsx'
import { Loader2, Mail, Lock, User, Eye, EyeOff } from 'lucide-react'
import useAuthStore from '../../../store/authStore.js'
import { supabase } from '../../../lib/supabase.js'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'

// 폼 검증 스키마 - 더 유연하게 수정
const signInSchema = z.object({
  email: z.string().min(1, '이메일을 입력해주세요').email('올바른 이메일 형식을 입력해주세요'),
  password: z.string().min(1, '비밀번호를 입력해주세요').min(6, '비밀번호는 최소 6자 이상이어야 합니다')
})

const signUpSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요').min(2, '이름은 최소 2자 이상이어야 합니다'),
  email: z.string().min(1, '이메일을 입력해주세요').email('올바른 이메일 형식을 입력해주세요'),
  password: z.string().min(1, '비밀번호를 입력해주세요').min(6, '비밀번호는 최소 6자 이상이어야 합니다'),
  confirmPassword: z.string().min(1, '비밀번호 확인을 입력해주세요')
}).refine((data) => data.password === data.confirmPassword, {
  message: "비밀번호가 일치하지 않습니다",
  path: ["confirmPassword"]
})

const resetSchema = z.object({
  email: z.string().min(1, '이메일을 입력해주세요').email('올바른 이메일 형식을 입력해주세요')
})

const AuthModal = ({ open, onOpenChange, onSuccess }) => {
  const [mode, setMode] = useState('signup') // 기본값을 signup으로 변경
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  const { signIn, signUp, resetPassword } = useAuthStore()

  // 폼 설정
  const getSchema = () => {
    switch (mode) {
      case 'signup': return signUpSchema
      case 'reset': return resetSchema
      default: return signInSchema
    }
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitted, touchedFields },
    reset: resetForm,
    clearErrors,
    watch
  } = useForm({
    resolver: zodResolver(getSchema()),
    mode: 'onBlur', // 포커스 잃을 때만 검증
    reValidateMode: 'onBlur', // 재검증도 포커스 잃을 때만
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    }
  })

  // 모드 변경시 폼 리셋
  React.useEffect(() => {
    resetForm({
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    })
    clearErrors()
    setMessage('')
  }, [mode, resetForm, clearErrors])

  // 로그인 처리
  const handleSignIn = async (data) => {
    setIsLoading(true)
    setMessage('')

    try {
      const { error } = await signIn(data.email, data.password)
      
      if (!error) {
        toast.success('로그인되었습니다!')
        onSuccess?.()
        onOpenChange(false)
      } else {
        setMessage(error.message || '로그인에 실패했습니다.')
      }
    } catch (error) {
      setMessage('로그인 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 회원가입 처리
  const handleSignUp = async (data) => {
    setIsLoading(true)
    setMessage('')

    try {
      const { error } = await signUp(data.email, data.password, data.name)
      
      if (!error) {
        setMessage('회원가입이 완료되었습니다! 이메일을 확인해주세요.')
        toast.success('회원가입 성공! 이메일을 확인해주세요.')
        setTimeout(() => {
          setMode('signin')
        }, 3000)
      } else {
        setMessage(error.message || '회원가입에 실패했습니다.')
      }
    } catch (error) {
      setMessage('회원가입 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 비밀번호 재설정 처리
  const handleReset = async (data) => {
    setIsLoading(true)
    setMessage('')

    try {
      const { error } = await resetPassword(data.email)
      
      if (!error) {
        setMessage('비밀번호 재설정 이메일을 보냈습니다. 이메일을 확인해주세요.')
        toast.success('비밀번호 재설정 이메일을 보냈습니다.')
        setTimeout(() => {
          setMode('signin')
        }, 3000)
      } else {
        setMessage(error.message || '비밀번호 재설정에 실패했습니다.')
      }
    } catch (error) {
      setMessage('비밀번호 재설정 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 소셜 로그인 처리
  const handleSocialLogin = async (provider) => {
    setIsLoading(true)
    setMessage('')

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        setMessage(`${provider} 로그인 중 오류가 발생했습니다.`)
        toast.error(`${provider} 로그인에 실패했습니다.`)
      }
    } catch (error) {
      console.error('Social login error:', error)
      setMessage('소셜 로그인 중 오류가 발생했습니다.')
      toast.error('소셜 로그인에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = (data) => {
    switch (mode) {
      case 'signup':
        return handleSignUp(data)
      case 'reset':
        return handleReset(data)
      default:
        return handleSignIn(data)
    }
  }

  const getTitle = () => {
    switch (mode) {
      case 'signup': return '회원가입'
      case 'reset': return '비밀번호 재설정'
      default: return '로그인'
    }
  }

  const getButtonText = () => {
    if (isLoading) return <Loader2 className="h-4 w-4 animate-spin" />
    
    switch (mode) {
      case 'signup': return '회원가입'
      case 'reset': return '재설정 이메일 보내기'
      default: return '로그인'
    }
  }

  // 에러 표시 조건 개선
  const shouldShowError = (fieldName) => {
    return (touchedFields[fieldName] || isSubmitted) && errors[fieldName]
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            {getTitle()}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* 이름 입력 (회원가입시에만) */}
          {mode === 'signup' && (
            <div className="space-y-2">
              <Label htmlFor="name">이름</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="name"
                  type="text"
                  placeholder="이름을 입력하세요"
                  className={`pl-10 ${shouldShowError('name') ? 'border-red-500 focus:border-red-500' : ''}`}
                  {...register('name')}
                />
              </div>
              {shouldShowError('name') && (
                <p className="text-sm text-red-600">{errors.name?.message}</p>
              )}
            </div>
          )}

          {/* 이메일 입력 */}
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="이메일을 입력하세요"
                className={`pl-10 ${shouldShowError('email') ? 'border-red-500 focus:border-red-500' : ''}`}
                {...register('email')}
              />
            </div>
            {shouldShowError('email') && (
              <p className="text-sm text-red-600">{errors.email?.message}</p>
            )}
          </div>

          {/* 비밀번호 입력 (재설정시 제외) */}
          {mode !== 'reset' && (
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="비밀번호를 입력하세요 (최소 6자)"
                  className={`pl-10 pr-10 ${shouldShowError('password') ? 'border-red-500 focus:border-red-500' : ''}`}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {shouldShowError('password') && (
                <p className="text-sm text-red-600">{errors.password?.message}</p>
              )}
            </div>
          )}

          {/* 비밀번호 확인 (회원가입시에만) */}
          {mode === 'signup' && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">비밀번호 확인</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="비밀번호를 다시 입력하세요"
                  className={`pl-10 pr-10 ${shouldShowError('confirmPassword') ? 'border-red-500 focus:border-red-500' : ''}`}
                  {...register('confirmPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {shouldShowError('confirmPassword') && (
                <p className="text-sm text-red-600">{errors.confirmPassword?.message}</p>
              )}
            </div>
          )}

          {/* 메시지 표시 */}
          {message && (
            <Alert className={message.includes('완료') || message.includes('보냈습니다') ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <AlertDescription className={message.includes('완료') || message.includes('보냈습니다') ? 'text-green-800' : 'text-red-600'}>
                {message}
              </AlertDescription>
            </Alert>
          )}

          {/* 제출 버튼 */}
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {getButtonText()}
          </Button>
        </form>

        <Separator />

        {/* 소셜 로그인 버튼들 */}
        <div className="space-y-3">
          <p className="text-center text-sm text-gray-500">소셜 로그인으로 간편하게</p>
          
          <Button
            type="button"
            variant="outline"
            className="w-full flex items-center gap-3 h-12"
            onClick={() => handleSocialLogin('google')}
            disabled={isLoading}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google로 계속하기
          </Button>
          
          <Button
            type="button"
            variant="outline"
            className="w-full flex items-center gap-3 h-12"
            onClick={() => handleSocialLogin('kakao')}
            disabled={isLoading}
          >
            <div className="w-5 h-5 bg-yellow-400 rounded flex items-center justify-center">
              <span className="text-black text-xs font-bold">K</span>
            </div>
            카카오로 계속하기
          </Button>
          
          <Button
            type="button"
            variant="outline"
            className="w-full flex items-center gap-3 h-12"
            onClick={() => handleSocialLogin('naver')}
            disabled={isLoading}
          >
            <div className="w-5 h-5 bg-green-500 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">N</span>
            </div>
            네이버로 계속하기
          </Button>
        </div>

        {/* 모드 전환 링크 */}
        <div className="space-y-2 text-center text-sm">
          {mode === 'signin' && (
            <>
              <p>
                계정이 없으신가요?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="text-blue-600 hover:underline font-medium"
                >
                  회원가입
                </button>
              </p>
              <p>
                <button
                  type="button"
                  onClick={() => setMode('reset')}
                  className="text-gray-500 hover:underline"
                >
                  비밀번호를 잊으셨나요?
                </button>
              </p>
            </>
          )}
          
          {mode === 'signup' && (
            <p>
              이미 계정이 있으신가요?{' '}
              <button
                type="button"
                onClick={() => setMode('signin')}
                className="text-blue-600 hover:underline font-medium"
              >
                로그인
              </button>
            </p>
          )}
          
          {mode === 'reset' && (
            <p>
              <button
                type="button"
                onClick={() => setMode('signin')}
                className="text-blue-600 hover:underline font-medium"
              >
                로그인으로 돌아가기
              </button>
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default AuthModal