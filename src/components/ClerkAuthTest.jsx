// src/components/ClerkAuthTest.jsx - Clerk 인증 테스트 컴포넌트
import React, { useState } from 'react'
import { useClerkAuth } from '../services/clerkAuthService.js'
import ClerkAuthModal from '../features/auth/components/ClerkAuthModal.jsx'
import { Button } from './ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card.jsx'
import { Badge } from './ui/badge.jsx'
import { Alert, AlertDescription } from './ui/alert.jsx'
import { Loader2, User, Shield, Database, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const ClerkAuthTest = () => {
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [testResults, setTestResults] = useState({})
  const [isRunningTests, setIsRunningTests] = useState(false)

  const { 
    user, 
    profile, 
    isAuthenticated, 
    isLoading,
    permissions,
    checkUsageLimit,
    incrementUsage,
    getSubscriptionStatus,
    getUsageStats 
  } = useClerkAuth()

  // 통합 테스트 실행
  const runIntegrationTests = async () => {
    if (!isAuthenticated) {
      toast.error('먼저 로그인해주세요.')
      return
    }

    setIsRunningTests(true)
    const results = {}

    try {
      // 1. 사용자 정보 테스트
      console.log('🧪 사용자 정보 테스트 시작...')
      results.userInfo = {
        hasUser: !!user,
        hasProfile: !!profile,
        hasEmail: !!user?.emailAddresses?.[0]?.emailAddress,
        emailVerified: user?.emailAddresses?.[0]?.verification?.status === 'verified',
        status: 'success'
      }

      // 2. 권한 시스템 테스트
      console.log('🧪 권한 시스템 테스트 시작...')
      results.permissions = {
        role: permissions?.role || 'unknown',
        hasPermissions: Array.isArray(permissions?.permissions) && permissions.permissions.length > 0,
        canCompilePrompt: permissions?.permissions?.includes('compile_prompt') || false,
        canRunWorkflow: permissions?.permissions?.includes('run_workflow') || false,
        status: 'success'
      }

      // 3. 사용량 제한 테스트
      console.log('🧪 사용량 제한 테스트 시작...')
      const canCompile = await checkUsageLimit('compile_prompt')
      const canSearch = await checkUsageLimit('search_query')
      results.usageLimits = {
        canCompilePrompt: canCompile,
        canSearchQuery: canSearch,
        testPassed: typeof canCompile === 'boolean',
        status: 'success'
      }

      // 4. 구독 상태 테스트
      console.log('🧪 구독 상태 테스트 시작...')
      const subscription = await getSubscriptionStatus()
      results.subscription = {
        hasSubscription: !!subscription,
        subscriptionStatus: subscription?.status || 'none',
        planType: subscription?.plan || 'free',
        status: 'success'
      }

      // 5. 사용량 통계 테스트
      console.log('🧪 사용량 통계 테스트 시작...')
      const usageStats = await getUsageStats('30 days')
      results.usageStats = {
        hasStats: !!usageStats,
        totalUsage: usageStats?.totalUsage || 0,
        eventTypes: Object.keys(usageStats?.byEventType || {}).length,
        status: 'success'
      }

      // 6. 사용량 기록 테스트
      console.log('🧪 사용량 기록 테스트 시작...')
      const recordResult = await incrementUsage('search_query', null, { test: true })
      results.usageRecording = {
        recordSuccess: !!recordResult,
        status: recordResult ? 'success' : 'warning'
      }

      console.log('✅ 모든 테스트 완료:', results)
      toast.success('모든 테스트가 완료되었습니다!')

    } catch (error) {
      console.error('❌ 테스트 중 오류:', error)
      results.error = {
        message: error.message,
        status: 'error'
      }
      toast.error('테스트 중 오류가 발생했습니다.')
    }

    setTestResults(results)
    setIsRunningTests(false)
  }

  // 테스트 결과 상태에 따른 아이콘
  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'warning':
        return <XCircle className="h-4 w-4 text-yellow-600" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <div className="h-4 w-4 bg-gray-300 rounded-full" />
    }
  }

  // 값에 따른 배지 색상
  const getBadgeVariant = (value) => {
    if (typeof value === 'boolean') {
      return value ? 'default' : 'secondary'
    }
    if (typeof value === 'string') {
      return value === 'success' || value === 'active' ? 'default' : 'secondary'
    }
    return 'secondary'
  }

  if (isLoading) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mr-3" />
          <span>Clerk 인증 확인 중...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Clerk + Supabase 인증 테스트
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 인증 상태 */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-gray-600" />
              <div>
                <p className="font-medium">인증 상태</p>
                <p className="text-sm text-gray-600">
                  {isAuthenticated ? `로그인됨: ${user?.firstName || '사용자'}` : '로그아웃됨'}
                </p>
              </div>
            </div>
            <Badge variant={isAuthenticated ? 'default' : 'secondary'}>
              {isAuthenticated ? '인증됨' : '미인증'}
            </Badge>
          </div>

          {/* 인증 버튼 */}
          <div className="flex gap-3">
            {!isAuthenticated ? (
              <Button onClick={() => setAuthModalOpen(true)}>
                로그인 / 회원가입
              </Button>
            ) : (
              <Button 
                onClick={runIntegrationTests}
                disabled={isRunningTests}
              >
                {isRunningTests ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    테스트 실행 중...
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4 mr-2" />
                    통합 테스트 실행
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 사용자 정보 */}
      {isAuthenticated && (
        <Card>
          <CardHeader>
            <CardTitle>사용자 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">이름</p>
                <p className="font-medium">{user?.fullName || user?.firstName || '설정되지 않음'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">이메일</p>
                <p className="font-medium">{user?.emailAddresses?.[0]?.emailAddress || '없음'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">역할</p>
                <Badge variant="outline">{permissions?.role || 'free'}</Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">권한 수</p>
                <Badge variant="outline">{permissions?.permissions?.length || 0}개</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 테스트 결과 */}
      {Object.keys(testResults).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>테스트 결과</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(testResults).map(([testName, result]) => (
              <div key={testName} className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  {getStatusIcon(result.status)}
                  <h4 className="font-medium capitalize">
                    {testName.replace(/([A-Z])/g, ' $1').trim()}
                  </h4>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(result)
                    .filter(([key]) => key !== 'status')
                    .map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}:
                        </span>
                        <Badge variant={getBadgeVariant(value)} className="ml-2">
                          {typeof value === 'boolean' 
                            ? (value ? '성공' : '실패')
                            : String(value)
                          }
                        </Badge>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 안내 메시지 */}
      <Alert>
        <AlertDescription>
          이 컴포넌트는 Clerk + Supabase 인증 통합을 테스트하기 위한 도구입니다. 
          로그인 후 "통합 테스트 실행" 버튼을 클릭하여 모든 기능이 정상적으로 작동하는지 확인할 수 있습니다.
        </AlertDescription>
      </Alert>

      {/* Clerk 인증 모달 */}
      <ClerkAuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        onSuccess={(authData) => {
          console.log('✅ 인증 성공:', authData)
          setAuthModalOpen(false)
          toast.success('로그인이 완료되었습니다!')
        }}
        defaultMode="sign-up"
      />
    </div>
  )
}

export default ClerkAuthTest