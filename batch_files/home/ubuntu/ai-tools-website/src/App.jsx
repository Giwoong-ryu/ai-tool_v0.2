import React, { useState } from 'react';
import Navigation from './components/Navigation';
import AIToolsGrid from './components/AIToolsGrid';
import WorkflowGrid from './features/workflows/components/WorkflowGrid';
import PromptLauncher from './features/prompt-launcher/PromptLauncher';

function App() {
  const [currentView, setCurrentView] = useState('tools');

  const renderCurrentView = () => {
    switch (currentView) {
      case 'tools':
        return <AIToolsGrid />;
      case 'workflows':
        return <WorkflowGrid />;
      case 'prompts':
        return <PromptLauncher />;
      default:
        return <AIToolsGrid />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-900">AI 도구 모음집</h1>
            </div>
            
            {/* 데스크톱에서만 표시되는 부제목 */}
            <div className="hidden md:block">
              <p className="text-sm text-gray-600">
                {currentView === 'tools' && '32개의 AI 도구와 18개의 연계 워크플로를 한눈에!'}
                {currentView === 'workflows' && 'AI 도구를 조합한 효율적인 워크플로를 발견하세요'}
                {currentView === 'prompts' && '목적에 맞는 프롬프트를 쉽게 생성하세요'}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* 네비게이션 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Navigation currentView={currentView} onViewChange={setCurrentView} />
      </div>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {renderCurrentView()}
      </main>

      {/* 푸터 */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-500 text-sm">
              © 2024 AI 도구 모음집. 효율적인 AI 활용을 위한 종합 가이드.
            </p>
            <div className="mt-4 flex items-center justify-center space-x-6 text-sm text-gray-400">
              <span>32개 AI 도구</span>
              <span>•</span>
              <span>18개 워크플로</span>
              <span>•</span>
              <span>프롬프트 생성기</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;

