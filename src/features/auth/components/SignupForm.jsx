import React, { useState } from 'react'
import { Button } from '../../../components/ui/button.jsx'
import { Input } from '../../../components/ui/input.jsx'
import { Label } from '../../../components/ui/label.jsx'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../../components/ui/card.jsx'
import { Alert, AlertDescription } from '../../../components/ui/alert.jsx'
import useAuthStore from '../../../store/authStore.js'

function SignupForm({ onSwitchToLogin, onSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const signup = useAuthStore((state) => state.signup)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // 유효성 검사
    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }

    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.')
      return
    }

    setLoading(true)
    const result = await signup(email, password, name)
    
    if (result.success) {
      onSuccess && onSuccess()
    } else {
      setError(result.error || '회원가입에 실패했습니다.')
    }
    
    setLoading(false)
  }

  return (
    <Card className="w-full max-w-md shadow-elev">
      <CardHeader className="space-y-1">
        <CardTitle className="font-display text-heading font-bold text-neutral-900">
          회원가입
        </CardTitle>
        <CardDescription className="font-body text-body-sm text-neutral-600">
          이지픽 계정을 만들어 시작하세요
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="font-body text-body-sm font-medium text-neutral-700">
              이름
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="홍길동"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="font-body text-body-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-email" className="font-body text-body-sm font-medium text-neutral-700">
              이메일
            </Label>
            <Input
              id="signup-email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="font-body text-body-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-password" className="font-body text-body-sm font-medium text-neutral-700">
              비밀번호
            </Label>
            <Input
              id="signup-password"
              type="password"
              placeholder="6자 이상 입력"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="font-body text-body-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password" className="font-body text-body-sm font-medium text-neutral-700">
              비밀번호 확인
            </Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="비밀번호 재입력"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
            {loading ? '가입 중...' : '회원가입'}
          </Button>
        </form>
      </CardContent>
      <CardFooter>
        <p className="text-center w-full font-body text-body-sm text-neutral-600">
          이미 계정이 있으신가요?{' '}
          <Button
            variant="link"
            onClick={onSwitchToLogin}
            className="p-0 h-auto font-medium text-primary-500 hover:text-primary-600"
          >
            로그인하기
          </Button>
        </p>
      </CardFooter>
    </Card>
  )
}

export default SignupForm
