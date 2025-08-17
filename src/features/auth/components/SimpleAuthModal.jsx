// src/features/auth/components/SimpleAuthModal.jsx
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
import toast from 'react-hot-toast'

const SimpleAuthModal = ({ open, onOpenChange, onSuccess }) => {
  const [mode, setMode] = useState('signup')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  
  // 폼 데이터
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  // AuthStore를 안전하게 사용
  let signIn = () => Promise.resolve({ error: null })
  let signUp = () => Promise.resolve({ error: null })
  let resetPassword = () => Promise.resolve({ error: null })
  
  try {
    const authData = useAuthStore()
    signIn = authData.signIn
    signUp = authData.signUp
    resetPassword = authData.resetPassword
  } catch (error) {
    console.warn('Auth store error in SimpleAuthModal:', error)
  }

  // 모드 변경시 폼 리셋
  React.useEffect(() => {
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    })
    setMessage('')
  }, [mode])

  // 입력값 변경 처리
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  // 로그인 처리
  const handleSignIn = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    try {
      console.log('🔑 로그인 시도:', formData.email)
      const { error } = await signIn(formData.email, formData.password)
      
      if (!error) {
        console.log('✅ 로그인 성공')
        toast.success('로그인되었습니다!')
        
        setTimeout(() => {
          onSuccess?.()
          onOpenChange(false)
        }, 1000)
      } else {
        console.error('❌ 로그인 실패:', error)
        setMessage(error.message || '로그인에 실패했습니다.')
      }
    } catch (error) {
      console.error('❌ 로그인 오류:', error)
      setMessage('로그인 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 회원가입 처리
  const handleSignUp = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    // 간단한 검증
    if (!formData.name || formData.name.length < 2) {
      setMessage('이름은 최소 2자 이상이어야 합니다.')
      setIsLoading(false)
      return
    }

    if (!formData.email || !formData.email.includes('@')) {
      setMessage('올바른 이메일을 입력해주세요.')
      setIsLoading(false)
      return
    }

    if (!formData.password || formData.password.length < 6) {
      setMessage('비밀번호는 최소 6자 이상이어야 합니다.')
      setIsLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setMessage('비밀번호가 일치하지 않습니다.')
      setIsLoading(false)
      return
    }

    try {
      const { error } = await signUp(formData.email, formData.password, formData.name)
      
      if (!error) {
        setMessage('회원가입이 완료되었습니다! 이메일을 확인해주세요.')
        toast.success('회원가입 성공!')
        setTimeout(() => {
          setMode('signin')
        }, 2000)
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
  const handleReset = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    if (!formData.email || !formData.email.includes('@')) {
      setMessage('올바른 이메일을 입력해주세요.')
      setIsLoading(false)
      return
    }

    try {
      const { error } = await resetPassword(formData.email)
      
      if (!error) {
        setMessage('비밀번호 재설정 이메일을 보냈습니다.')
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

  // 소셜 로그인 처리 (Google, Kakao만)
  const handleSocialLogin = async (provider) => {
    setIsLoading(true)
    setMessage('')

    try {
      console.log(`🔐 ${provider} 소셜 로그인 시도`)
      
      // 실제 OAuth 시도
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        console.error(`❌ ${provider} OAuth 실패:`, error)
        
        // OAuth 설정 오류나 스코프 오류시 데모 모드로 처리
        if (error.message.includes('not enabled') || 
            error.message.includes('Unsupported provider') ||
            error.message.includes('invalid_scope') ||
            error.message.includes('KOE205') ||
            error.code === 'KOE205') {
          console.log(`🎭 ${provider} 데모 모드로 전환 (오류: ${error.message})`)
          toast.info(`${provider} 설정 중... 데모 모드로 진행합니다.`)
          await handleDemoSocialLogin(provider)
        } else {
          setMessage(`${provider} 로그인 중 오류가 발생했습니다: ${error.message}`)
          toast.error(`${provider} 로그인에 실패했습니다.`)
        }
      } else {
        console.log(`✅ ${provider} 로그인 리다이렉트 시작`)
        toast.success(`${provider} 로그인 중...`)
      }
    } catch (error) {
      console.error('Social login error:', error)
      // 에러 발생시에도 데모 모드로 처리
      await handleDemoSocialLogin(provider)
    } finally {
      setIsLoading(false)
    }
  }

  // 데모 소셜 로그인 처리
  const handleDemoSocialLogin = async (provider) => {
    try {
      console.log(`🎭 ${provider} 데모 로그인 처리`)
      
      // 데모 사용자 데이터 생성
      const demoUser = {
        email: `demo-${provider}@example.com`,
        password: 'demo123456',
        name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} 사용자`
      }

      // 자동으로 회원가입 시도 (이미 존재하면 로그인)
      let { error } = await signUp(demoUser.email, demoUser.password, demoUser.name)
      
      if (error && error.message.includes('already registered')) {
        // 이미 존재하면 로그인 시도
        const loginResult = await signIn(demoUser.email, demoUser.password)
        error = loginResult.error
      }

      if (!error) {
        toast.success(`${provider} 데모 로그인 성공!`)
        setTimeout(() => {
          onSuccess?.()
          onOpenChange(false)
        }, 1500)
      } else {
        setMessage(`${provider} 데모 로그인에 실패했습니다.`)
      }
    } catch (error) {
      console.error('Demo social login error:', error)
      setMessage('데모 로그인 중 오류가 발생했습니다.')
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

  const handleSubmit = (e) => {
    switch (mode) {
      case 'signup': return handleSignUp(e)
      case 'reset': return handleReset(e)
      default: return handleSignIn(e)
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 이름 입력 (회원가입시에만) */}
          {mode === 'signup' && (
            <div className="space-y-2">
              <Label htmlFor="name">이름</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="이름을 입력하세요"
                  className="pl-10"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          )}

          {/* 이메일 입력 */}
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="이메일을 입력하세요"
                className="pl-10"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* 비밀번호 입력 (재설정시 제외) */}
          {mode !== 'reset' && (
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="비밀번호를 입력하세요 (최소 6자)"
                  className="pl-10 pr-10"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
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
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="비밀번호를 다시 입력하세요"
                  className="pl-10 pr-10"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
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

        {/* 소셜 로그인 버튼들 - Google, Kakao만 */}
        <div className="space-y-3">
          <p className="text-center text-sm text-gray-500">소셜 로그인으로 간편하게</p>
          
          <Button
            type="button"
            variant="outline"
            className="w-full flex items-center gap-3 h-12 hover:bg-gray-50 transition-colors"
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
            className="w-full flex items-center gap-3 h-12 hover:bg-yellow-50 transition-colors"
            onClick={() => handleSocialLogin('kakao')}
            disabled={isLoading}
          >
            <div className="w-5 h-5 bg-yellow-400 rounded flex items-center justify-center">
              <span className="text-black text-xs font-bold">K</span>
            </div>
            카카오로 계속하기
          </Button>
          
          <div className="text-center text-xs text-gray-400 bg-blue-50 p-2 rounded">
            💡 Google은 실제 OAuth, 카카오는 현재 데모 모드로 작동합니다.
          </div>
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

export default SimpleAuthModal