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
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

// 폼 검증 스키마
const signInSchema = z.object({
  email: z.string().email('올바른 이메일을 입력해주세요'),
  password: z.string().min(6, '비밀번호는 최소 6자 이상이어야 합니다')
})

const signUpSchema = z.object({
  name: z.string().min(2, '이름은 최소 2자 이상이어야 합니다'),
  email: z.string().email('올바른 이메일을 입력해주세요'),
  password: z.string().min(6, '비밀번호는 최소 6자 이상이어야 합니다'),
  confirmPassword: z.string().min(6, '비밀번호 확인을 입력해주세요')
}).refine((data) => data.password === data.confirmPassword, {
  message: "비밀번호가 일치하지 않습니다",
  path: ["confirmPassword"]
})

const resetSchema = z.object({
  email: z.string().email('올바른 이메일을 입력해주세요')
})

const AuthModal = ({ open, onOpenChange, onSuccess }) => {
  const [mode, setMode] = useState('signin') // 'signin', 'signup', 'reset'
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
    formState: { errors },
    reset: resetForm,
    watch
  } = useForm({
    resolver: zodResolver(getSchema())
  })

  // 모드 변경시 폼 리셋
  React.useEffect(() => {
    resetForm()
    setMessage('')
  }, [mode, resetForm])

  // 로그인 처리
  const handleSignIn = async (data) => {
    setIsLoading(true)
    setMessage('')

    try {
      const { error } = await signIn(data.email, data.password)
      
      if (!error) {
        onSuccess?.()
        onOpenChange(false)
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
        setTimeout(() => {
          setMode('signin')
        }, 3000)
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
        setTimeout(() => {
          setMode('signin')
        }, 3000)
      }
    } catch (error) {
      setMessage('비밀번호 재설정 중 오류가 발생했습니다.')
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
                  className="pl-10"
                  {...register('name')}
                />
              </div>
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
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
                className="pl-10"
                {...register('email')}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
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
                  placeholder="비밀번호를 입력하세요"
                  className="pl-10 pr-10"
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
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password.message}</p>
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
                  className="pl-10 pr-10"
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
              {errors.confirmPassword && (
                <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
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
