// src/app.jsx
import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { Loader2 } from 'lucide-react'

// Components
import NewMainLanding from './components/NewMainLanding.jsx'
import AIToolsGrid from './components/AIToolsGrid.jsx'
import PaymentResult from './components/PaymentResult.jsx'
import PromptLauncher from './features/prompt-launcher/PromptLauncher.jsx'
import WorkflowGrid from './features/workflows/components/WorkflowGrid.jsx'
import AuthModal from './features/auth/components/AuthModal.jsx'
import PaymentModal from './features/payment/components/PaymentModal.jsx'

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
const AppLayout = ({ children, currentView, onNavigate, onAuthClick, onPaymentClick }) => {
  const { user, profile, isAuthenticated, signOut } = useAuthStore()

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <header className="fixed top-0 w-full bg-neutral-0/95 backdrop-blur-lg border-b border-neutral-200/60 shadow-glass z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              onClick={() => onNavigate('home')}
              className="flex items-center space-x-3 hover:bg-neutral-50 px-4 py-3 rounded-lg"
            >
              <div className="w-10 h-10 flex items-center justify-center bg-primary-50 rounded-lg">
                <img src="/favicon.png" alt="이지픽 로고" className="w-8 h-8" />
              </div>
              <span className="font-display text-heading font-bold text-neutral-900">이지픽</span>
            </Button>
          </div>
          
          <nav className="hidden md:flex items-center space-x-2">
            <Button 
              variant={currentView === 'tools' ? 'default' : 'ghost'} 
              className={`font-body text-body-sm font-medium px-6 py-3 rounded-lg ${
                currentView === 'tools' 
                  ? 'bg-primary-500 text-neutral-0 shadow-elev' 
                  : 'text-neutral-700 hover:bg-neutral-50'
              }`}
              onClick={() => onNavigate('tools')}
            >
              AI 도구
            </Button>
            <Button 
              variant={currentView === 'prompts' ? 'default' : 'ghost'} 
              className={`font-body text-body-sm font-medium px-6 py-3 rounded-lg ${
                currentView === 'prompts' 
                  ? 'bg-primary-500 text-neutral-0 shadow-elev' 
                  : 'text-neutral-700 hover:bg-neutral-50'
              }`}
              onClick={() => onNavigate('prompts')}
            >
              프롬프트
            </Button>
            <Button 
              variant={currentView === 'workflows' ? 'default' : 'ghost'} 
              className={`font-body text-body-sm font-medium px-6 py-3 rounded-lg ${
                currentView === 'workflows' 
                  ? 'bg-primary-500 text-neutral-0 shadow-elev' 
                  : 'text-neutral-700 hover:bg-neutral-50'
              }`}
              onClick={() => onNavigate('workflows')}
            >
              워크플로우
            </Button>
          </nav>
          
          <div className="flex items-center space-x-3">
            {/* 구독 상태 표시 */}
            {isAuthenticated && profile?.subscription_tier !== 'free' && (
              <Badge className={`${
                profile.subscription_tier === 'pro' 
                  ? 'bg-yellow-100 text-yellow-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {profile.subscription_tier === 'pro' ? 'PRO' : 'BASIC'}
              </Badge>
            )}

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="p-0 h-auto">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user?.user_metadata?.avatar_url} />
                      <AvatarFallback className="bg-primary-100 text-primary-600 font-medium">
                        {profile?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-body text-body-sm">
                    <div className="flex flex-col space-y-1">
                      <p className="font-medium text-neutral-900">{profile?.name || '사용자'}</p>
                      <p className="text-xs text-neutral-500">{user?.email}</p>
                      {profile && (
                        <p className="text-xs text-neutral-400">
                          이번 달 사용량: {profile.usage_count}/{profile.monthly_limit === -1 ? '무제한' : profile.monthly_limit}
                        </p>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="font-body text-body-sm">
                    프로필 설정
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onNavigate('bookmarks')}
                    className="font-body text-body-sm"
                  >
                    내 북마크
                  </DropdownMenuItem>
                  {profile?.subscription_tier === 'free' && (
                    <DropdownMenuItem 
                      onClick={() => onPaymentClick('basic')}
                      className="font-body text-body-sm text-blue-600"
                    >
                      플랜 업그레이드
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={signOut}
                    className="font-body text-body-sm text-red-600"
                  >
                    로그아웃
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                onClick={onAuthClick} 
                className="bg-primary-500 hover:bg-primary-600 text-neutral-0 font-body text-body-sm font-medium px-6 py-3 rounded-lg"
              >
                로그인
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="pt-24">
        {children}
      </main>
    </div>
  )
}

// 모바일 네비게이션 컴포넌트
const MobileNavigation = ({ currentView, onNavigate }) => (
  <div className="fixed bottom-0 left-0 right-0 bg-neutral-0/95 backdrop-blur-lg border-t border-neutral-200/60 shadow-glass md:hidden z-50">
    <div className="grid grid-cols-4 py-3">
      <Button 
        variant="ghost" 
        className={`flex flex-col items-center py-3 rounded-lg mx-1 ${
          currentView === 'home' ? 'bg-primary-50 text-primary-600' : 'hover:bg-neutral-50'
        }`}
        onClick={() => onNavigate('home')}
      >
        <div className="w-8 h-8 flex items-center justify-center mb-2 bg-primary-50 rounded-lg">
          <img src="/favicon.png" alt="홈 아이콘" className="w-6 h-6" />
        </div>
        <span className="font-body text-body-sm font-medium text-neutral-700">홈</span>
      </Button>
      <Button 
        variant="ghost" 
        className={`flex flex-col items-center py-3 rounded-lg mx-1 ${
          currentView === 'tools' ? 'bg-primary-50 text-primary-600' : 'hover:bg-neutral-50'
        }`}
        onClick={() => onNavigate('tools')}
      >
        <div className="w-8 h-8 flex items-center justify-center mb-2 bg-neutral-100 rounded-lg">
          <span className="text-lg">🛠️</span>
        </div>
        <span className="font-body text-body-sm font-medium text-neutral-700">도구</span>
      </Button>
      <Button 
        variant="ghost" 
        className={`flex flex-col items-center py-3 rounded-lg mx-1 ${
          currentView === 'prompts' ? 'bg-primary-50 text-primary-600' : 'hover:bg-neutral-50'
        }`}
        onClick={() => onNavigate('prompts')}
      >
        <div className="w-8 h-8 flex items-center justify-center mb-2 bg-neutral-100 rounded-lg">
          <span className="text-lg">💬</span>
        </div>
        <span className="font-body text-body-sm font-medium text-neutral-700">프롬프트</span>
      </Button>
      <Button 
        variant="ghost" 
        className={`flex flex-col items-center py-3 rounded-lg mx-1 ${
          currentView === 'workflows' ? 'bg-primary-50 text-primary-600' : 'hover:bg-neutral-50'
        }`}
        onClick={() => onNavigate('workflows')}
      >
        <div className="w-8 h-8 flex items-center justify-center mb-2 bg-neutral-100 rounded-lg">
          <span className="text-lg">⚡</span>
        </div>
        <span className="font-body text-body-sm font-medium text-neutral-700">워크플로우</span>
      </Button>
    </div>
  </div>
)

function App() {
  const [currentView, setCurrentView] = useState('home')
  const [promptData, setPromptData] = useState(null)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState('basic')
  
  const { user, profile, isAuthenticated, isLoading, initialize } = useAuthStore()

  // 앱 초기화
  useEffect(() => {
    initialize()
  }, [initialize])

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

  // 로딩 중 표시
  if (isLoading) {
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
          {/* 홈 페이지 (랜딩) */}
          <Route 
            path="/" 
            element={
              <div>
                <NewMainLanding 
                  onNavigateToPrompts={handleNavigateToPrompts} 
                  onNavigate={handleNavigate}
                  onAuthClick={() => setAuthModalOpen(true)}
                  onProPlanClick={() => handlePaymentClick('pro')}
                />
                
                {/* 모바일 네비게이션 */}
                <MobileNavigation 
                  currentView={currentView}
                  onNavigate={handleNavigate}
                />
              </div>
            } 
          />

          {/* AI 도구 페이지 */}
          <Route 
            path="/tools" 
            element={
              <AppLayout 
                currentView="tools"
                onNavigate={handleNavigate}
                onAuthClick={() => setAuthModalOpen(true)}
                onPaymentClick={handlePaymentClick}
              >
                <AIToolsGrid />
              </AppLayout>
            } 
          />

          {/* 프롬프트 페이지 */}
          <Route 
            path="/prompts" 
            element={
              <AppLayout 
                currentView="prompts"
                onNavigate={handleNavigate}
                onAuthClick={() => setAuthModalOpen(true)}
                onPaymentClick={handlePaymentClick}
              >
                <PromptLauncher initialData={promptData} />
              </AppLayout>
            } 
          />

          {/* 워크플로우 페이지 */}
          <Route 
            path="/workflows" 
            element={
              <AppLayout 
                currentView="workflows"
                onNavigate={handleNavigate}
                onAuthClick={() => setAuthModalOpen(true)}
                onPaymentClick={handlePaymentClick}
              >
                <WorkflowGrid />
              </AppLayout>
            } 
          />

          {/* 결제 성공/실패 페이지 */}
          <Route path="/payment/success" element={<PaymentResult />} />
          <Route path="/payment/fail" element={<PaymentResult />} />

          {/* 404 리다이렉트 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* 글로벌 모달들 */}
        <AuthModal 
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
