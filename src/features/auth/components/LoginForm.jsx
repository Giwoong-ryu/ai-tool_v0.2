import React, { useState } from 'react'
import { Button } from '../../../components/ui/button.jsx'
import { Input } from '../../../components/ui/input.jsx'
import { Label } from '../../../components/ui/label.jsx'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../../components/ui/card.jsx'
import { Alert, AlertDescription } from '../../../components/ui/alert.jsx'
import { Separator } from '../../../components/ui/separator.jsx'
import useAuthStore from '../../../store/authStore.js'
import { handleSocialLogin } from '../config/socialAuth.js'

function LoginForm({ onSwitchToSignup, onSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const login = useAuthStore((state) => state.login)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await login(email, password)
    
    if (result.success) {
      onSuccess && onSuccess()
    } else {
      setError(result.error || '로그인에 실패했습니다.')
    }
    
    setLoading(false)
  }
  
  const handleSocialLoginClick = async (provider) => {
    setError('')
    setLoading(true)
    
    try {
      const result = await handleSocialLogin(provider)
      if (result.success) {
        login(result.user.email, 'social-login', result.user)
        onSuccess && onSuccess()
      }
    } catch (error) {
      setError(`${provider} 로그인에 실패했습니다.`)
    }
    
    setLoading(false)
  }

  return (
    <Card className="w-full max-w-md shadow-elev">
      <CardHeader className="space-y-1">
        <CardTitle className="font-display text-heading font-bold text-neutral-900">
          로그인
        </CardTitle>
        <CardDescription className="font-body text-body-sm text-neutral-600">
          이지픽 계정에 로그인하세요
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* 소셜 로그인 버튼들 */}
          <div className="grid grid-cols-3 gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSocialLoginClick('google')}
              disabled={loading}
              className="font-body text-body-sm"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSocialLoginClick('naver')}
              disabled={loading}
              className="font-body text-body-sm"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#03C75A" d="M16.273 12.845L7.376 0H0v24h7.726V11.156L16.624 24H24V0h-7.727v12.845z"/>
              </svg>
              네이버
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSocialLoginClick('kakao')}
              disabled={loading}
              className="font-body text-body-sm"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#FEE500" d="M12 3c5.514 0 10 3.476 10 7.747 0 4.272-4.48 7.748-10 7.748-1.195 0-2.344-.164-3.409-.462l-3.814 2.739c-.285.203-.717.037-.768-.295l-.577-3.767C1.967 15.208 1 13.438 1 11.494 1 7.223 5.486 3 12 3z"/>
              </svg>
              카카오
            </Button>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-neutral-500">또는</span>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="font-body text-body-sm font-medium text-neutral-700">
              이메일
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="font-body text-body-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="font-body text-body-sm font-medium text-neutral-700">
              비밀번호
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="font-body text-body-sm"
            />
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription className="font-body text-body-sm">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <Button 
            type="submit" 
            className="w-full bg-primary-500 hover:bg-primary-600 text-neutral-0 font-body text-body-sm font-medium"
            disabled={loading}
          >
            {loading ? '로그인 중...' : '로그인'}
          </Button>
          
          <div className="pt-2">
            <p className="text-center font-body text-body-sm text-neutral-600">
              데모 계정: 아무 이메일과 비밀번호로 로그인 가능
            </p>
          </div>
        </form>
      </CardContent>
      <CardFooter>
        <p className="text-center w-full font-body text-body-sm text-neutral-600">
          계정이 없으신가요?{' '}
          <Button
            variant="link"
            onClick={onSwitchToSignup}
            className="p-0 h-auto font-medium text-primary-500 hover:text-primary-600"
          >
            회원가입하기
          </Button>
        </p>
      </CardFooter>
    </Card>
  )
}

export default LoginForm
