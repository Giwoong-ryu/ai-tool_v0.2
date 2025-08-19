// src/App-with-clerk.jsx - Clerk + Supabase 통합 버전
import React, { useState, useEffect, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { Loader2 } from 'lucide-react'

// Clerk Provider
import { ClerkProvider } from './lib/clerk.js'
import { useClerkAuth } from './services/clerkAuthService.js'

import NavigationBar from './components/NavigationBar.jsx'

// Eager-loaded components (critical for initial render)
import NewMainLanding from './components/NewMainLanding.jsx'
import ClerkAuthModal from './features/auth/components/ClerkAuthModal.jsx'
import PaymentModal from './features/payment/components/PaymentModal.jsx'

// Lazy-loaded components (code splitting)
const AIToolsGrid = React.lazy(() => import('./components/AIToolsGrid.jsx'))
const PaymentResult = React.lazy(() => import('./components/PaymentResult.jsx'))
const PromptComposer = React.lazy(() => import('./components/prompt/PromptComposer.jsx'))
const WorkflowGrid = React.lazy(() => import('./features/workflows/components/WorkflowGrid.jsx'))
const TestPromptPage = React.lazy(() => import('./pages/TestPromptPage.jsx'))

// UI Components
import { Button } from './components/ui/button.jsx'
import { Avatar, AvatarFallback, AvatarImage } from './components/ui/avatar.jsx'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from './components/ui/dropdown-menu.jsx'
import { Badge } from './components/ui/badge.jsx'

// Styles
import './App.css'

// 앱 레이아웃 컴포넌트 (Clerk 통합)
const AppLayoutWithClerk = ({ children, onAuthClick, onPaymentClick }) => {
  const navigate = useNavigate()
  const location = useLocation()
  
  // Clerk 인증 상태 사용
  const { user, profile, isAuthenticated, isLoading } = useClerkAuth()
  
  // 현재 경로에 따라 currentView 자동 설정
  const getCurrentView = () => {
    const path = location.pathname
    if (path === '/tools') return 'tools'
    if (path === '/prompts') return 'prompts'  
    if (path === '/workflows') return 'workflows'
    return 'home'
  }
  
  const currentView = getCurrentView()

  return (
    <div className="min-h-screen bg-background">
      <NavigationBar 
        onAuthClick={onAuthClick} 
        onProPlanClick={onPaymentClick}
        // Clerk 데이터 전달
        user={user}
        profile={profile}
        isAuthenticated={isAuthenticated}
      />

      {/* 메인 콘텐츠 */}
      <main className="pt-[100px] pb-16 md:pb-0 min-h-screen bg-white">
        {children}
      </main>
    </div>
  )
}

// Loading component for Suspense
const PageLoader = () => (
  <div className="min-h-[400px] flex items-center justify-center">
    <div className="text-center">
      <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500 mb-4" />
      <p className="text-gray-600 font-medium">페이지를 로드하는 중...</p>
    </div>
  </div>
)

// 메인 앱 컴포넌트 (Clerk Provider로 감싸짐)
const AppContent = () => {
  // React State
  const [currentView, setCurrentView] = useState('home')
  const [promptData, setPromptData] = useState(null)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState('basic')
  
  // Clerk 인증 상태
  const { 
    user, 
    profile, 
    isAuthenticated, 
    isLoading, 
    permissions,
    checkUsageLimit,
    incrementUsage 
  } = useClerkAuth()

  // 인증 상태 변화 모니터링
  useEffect(() => {
    console.log('🔍 Clerk 인증 상태:', {
      isAuthenticated,
      hasUser: !!user,
      hasProfile: !!profile,
      userEmail: user?.emailAddresses?.[0]?.emailAddress,
      role: permissions?.role,
      permissions: permissions?.permissions
    })
  }, [isAuthenticated, user, profile, permissions])

  // 랜딩페이지에서 프롬프트 페이지로 이동할 때 호출
  const handleNavigateToPrompts = (data) => {
    setPromptData(data)
    setCurrentView('prompts')
  }

  // 결제 모달 열기
  const handlePaymentClick = (plan = 'basic') => {
    if (!isAuthenticated) {
      setAuthModalOpen(true)
      return
    }
    setSelectedPlan(plan)
    setPaymentModalOpen(true)
  }

  // 네비게이션 처리
  const handleNavigate = (view) => {
    setCurrentView(view)
  }

  // 인증 성공 핸들러
  const handleAuthSuccess = (authData) => {
    console.log('✅ 인증 성공:', authData)
    setAuthModalOpen(false)
    
    // 로그인 성공 후 결제 모달이 열려야 하는 경우
    if (selectedPlan && selectedPlan !== 'basic') {
      setTimeout(() => setPaymentModalOpen(true), 500)
    }
  }

  // 로딩 중 표시
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500 mb-4" />
          <p className="text-gray-600">Clerk 인증을 확인하는 중...</p>
        </div>
      </div>
    )
  }

  // 라우터 기반 앱
  return (
    <div className="min-h-screen bg-background">
      <Routes>
        {/* 홈 페이지 (랜딩) */}
        <Route 
          path="/" 
          element={
            <AppLayoutWithClerk 
              onAuthClick={() => setAuthModalOpen(true)}
              onPaymentClick={handlePaymentClick}
            >
              <NewMainLanding 
                onNavigateToPrompts={handleNavigateToPrompts} 
                onNavigate={handleNavigate}
                onAuthClick={() => setAuthModalOpen(true)}
                onProPlanClick={() => handlePaymentClick('pro')}
                // Clerk 데이터 전달
                user={user}
                isAuthenticated={isAuthenticated}
                permissions={permissions}
              />
            </AppLayoutWithClerk>
          } 
        />

        {/* AI 도구 페이지 */}
        <Route 
          path="/tools" 
          element={
            <AppLayoutWithClerk 
              onAuthClick={() => setAuthModalOpen(true)}
              onPaymentClick={handlePaymentClick}
            >
              <Suspense fallback={<PageLoader />}>
                <AIToolsGrid 
                  user={user}
                  isAuthenticated={isAuthenticated}
                  permissions={permissions}
                />
              </Suspense>
            </AppLayoutWithClerk>
          } 
        />

        {/* 프롬프트 페이지 */}
        <Route 
          path="/prompts" 
          element={
            <AppLayoutWithClerk 
              onAuthClick={() => setAuthModalOpen(true)}
              onPaymentClick={handlePaymentClick}
            >
              <Suspense fallback={<PageLoader />}>
                <PromptComposer 
                  initialData={promptData}
                  user={user}
                  isAuthenticated={isAuthenticated}
                  permissions={permissions}
                  checkUsageLimit={checkUsageLimit}
                  incrementUsage={incrementUsage}
                />
              </Suspense>
            </AppLayoutWithClerk>
          } 
        />

        {/* 워크플로우 페이지 */}
        <Route 
          path="/workflows" 
          element={
            <AppLayoutWithClerk 
              onAuthClick={() => setAuthModalOpen(true)}
              onPaymentClick={handlePaymentClick}
            >
              <Suspense fallback={<PageLoader />}>
                <WorkflowGrid 
                  user={user}
                  isAuthenticated={isAuthenticated}
                  permissions={permissions}
                  checkUsageLimit={checkUsageLimit}
                  incrementUsage={incrementUsage}
                />
              </Suspense>
            </AppLayoutWithClerk>
          } 
        />

        {/* 결제 성공/실패 페이지 */}
        <Route path="/payment/success" element={<Suspense fallback={<PageLoader />}><PaymentResult /></Suspense>} />
        <Route path="/payment/fail" element={<Suspense fallback={<PageLoader />}><PaymentResult /></Suspense>} />

        {/* 테스트 페이지 */}
        <Route path="/test-prompt" element={<Suspense fallback={<PageLoader />}><TestPromptPage /></Suspense>} />

        {/* 404 리다이렉트 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* 글로벌 모달들 */}
      <ClerkAuthModal 
        open={authModalOpen} 
        onOpenChange={setAuthModalOpen}
        onSuccess={handleAuthSuccess}
        defaultMode="sign-up"
      />
      
      <PaymentModal
        open={paymentModalOpen}
        onOpenChange={setPaymentModalOpen}
        plan={selectedPlan}
        user={user}
        profile={profile}
      />

      {/* Toast 알림 */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#363636',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            fontSize: '14px',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  )
}

// 메인 App 컴포넌트 (ClerkProvider로 감싸기)
function App() {
  return (
    <ClerkProvider>
      <Router>
        <AppContent />
      </Router>
    </ClerkProvider>
  )
}

export default App