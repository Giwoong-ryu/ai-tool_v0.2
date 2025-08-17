// src/app.jsx - 수정된 완전 버전
import React, { useState, useEffect, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { Loader2 } from 'lucide-react'

import NavigationBar from './components/NavigationBar.jsx';

// Eager-loaded components (critical for initial render)
import NewMainLanding from './components/NewMainLanding.jsx'
import SimpleAuthModal from './features/auth/components/SimpleAuthModal.jsx'
import PaymentModal from './features/payment/components/PaymentModal.jsx'

// Lazy-loaded components (code splitting)
const AIToolsGrid = React.lazy(() => import('./components/AIToolsGrid.jsx'))
const PaymentResult = React.lazy(() => import('./components/PaymentResult.jsx'))
const PromptLauncher = React.lazy(() => import('./features/prompt-launcher/PromptLauncher.jsx'))
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

// Store
import useAuthStore from './store/authStore.js'

// Styles
import './App.css'

// 앱 레이아웃 컴포넌트
const AppLayout = ({ children, onAuthClick, onPaymentClick }) => {
  const navigate = useNavigate()
  const location = useLocation()
  
  // 현재 경로에 따라 currentView 자동 설정
  const getCurrentView = () => {
    const path = location.pathname
    console.log('Current path:', path) // 디버그용
    if (path === '/tools') return 'tools'
    if (path === '/prompts') return 'prompts'
    if (path === '/workflows') return 'workflows'

    return 'home'
  }
  
  const currentView = getCurrentView()
  console.log('Current view:', currentView) // 디버그용
  
  // Store를 안전하게 사용
  let user = null
  let profile = null
  let isAuthenticated = false
  let signOut = () => {}
  
  try {
    const authData = useAuthStore()
    user = authData.user
    profile = authData.profile
    isAuthenticated = authData.isAuthenticated
    signOut = authData.signOut
  } catch (error) {
    console.warn('Auth store error in AppLayout:', error)
  }

  return (
    <div className="min-h-screen bg-background">
      <NavigationBar onAuthClick={onAuthClick} onProPlanClick={onPaymentClick} />

      {/* 메인 콘텐츠 */}
      <main className="pt-[100px] min-h-screen bg-white">
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

function App() {
  // React State 먼저 선언
  const [currentView, setCurrentView] = useState('home')
  const [promptData, setPromptData] = useState(null)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState('basic')
  const [authReady, setAuthReady] = useState(false)
  
  // Zustand store - 안전하게 사용
  let user = null
  let profile = null
  let isAuthenticated = false
  let isLoading = true
  let initialize = () => {}
  
  try {
    const authData = useAuthStore()
    user = authData.user
    profile = authData.profile
    isAuthenticated = authData.isAuthenticated
    isLoading = authData.isLoading
    initialize = authData.initialize
  } catch (error) {
    console.warn('Auth store error in App:', error)
    isLoading = false
  }

  // 앱 초기화
  useEffect(() => {
    console.log('🚀 앱 초기화 시작')
    try {
      initialize()
      setAuthReady(true)
    } catch (error) {
      console.warn('Initialize error:', error)
      setAuthReady(true)
    }
  }, [])

  // 인증 상태 변화 모니터링
  useEffect(() => {
    console.log('🔍 인증 상태:', {
      isAuthenticated,
      hasUser: !!user,
      hasProfile: !!profile,
      userEmail: user?.email
    })
  }, [isAuthenticated, user, profile])

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

  // 네비게이션 처리 - React Router 사용
  const handleNavigate = (view) => {
    setCurrentView(view)
    // React Router Navigate 대신 직접 이동하지 않고 상태만 변경
  }

  // 로딩 중 표시
  if (!authReady || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500 mb-4" />
          <p className="text-gray-600">앱을 로드하는 중...</p>
        </div>
      </div>
    )
  }

  // 라우터 기반 앱
  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Routes>
          {/* 홈 페이지 (랜딩) - 자체 네비게이션 사용 */}
          <Route 
            path="/" 
            element={
              <NewMainLanding 
                onNavigateToPrompts={handleNavigateToPrompts} 
                onNavigate={handleNavigate}
                onAuthClick={() => setAuthModalOpen(true)}
                onProPlanClick={() => handlePaymentClick('pro')}
              />
            } 
          />

          {/* AI 도구 페이지 */}
          <Route 
            path="/tools" 
            element={
              <AppLayout 
                onAuthClick={() => setAuthModalOpen(true)}
                onPaymentClick={handlePaymentClick}
              >
                <Suspense fallback={<PageLoader />}>
                  <AIToolsGrid />
                </Suspense>
              </AppLayout>
            } 
          />

          {/* 프롬프트 페이지 */}
          <Route 
            path="/prompts" 
            element={
              <AppLayout 
                onAuthClick={() => setAuthModalOpen(true)}
                onPaymentClick={handlePaymentClick}
              >
                <Suspense fallback={<PageLoader />}>
                  <PromptLauncher initialData={promptData} />
                </Suspense>
              </AppLayout>
            } 
          />

          {/* 워크플로우 페이지 */}
          <Route 
            path="/workflows" 
            element={
              <AppLayout 
                onAuthClick={() => setAuthModalOpen(true)}
                onPaymentClick={handlePaymentClick}
              >
                <Suspense fallback={<PageLoader />}>
                  <WorkflowGrid />
                </Suspense>
              </AppLayout>
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
        <SimpleAuthModal 
          open={authModalOpen} 
          onOpenChange={setAuthModalOpen}
          onSuccess={() => {
            setAuthModalOpen(false)
            // 로그인 성공 후 결제 모달이 열려야 하는 경우
            if (selectedPlan && selectedPlan !== 'basic') {
              setTimeout(() => setPaymentModalOpen(true), 500)
            }
          }}
        />
        
        <PaymentModal
          open={paymentModalOpen}
          onOpenChange={setPaymentModalOpen}
          plan={selectedPlan}
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
    </Router>
  )
}

export default App
