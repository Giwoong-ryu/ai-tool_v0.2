// [자동 분류] 이 파일은 현재 사용되지 않으며 중복된 컴포넌트로 판단되어 아카이브 처리되었습니다.
// 임시 AI 도구 페이지
import React from 'react'

const SimpleAIToolsPage = () => {
  const tools = [
    {
      name: 'ChatGPT',
      description: '대화형 AI로 텍스트 생성, 질문 답변, 번역 등을 수행합니다.',
      url: 'https://chat.openai.com',
      category: '텍스트 생성',
      icon: '🤖'
    },
    {
      name: 'Midjourney',
      description: 'AI를 이용한 고품질 이미지 및 아트워크 생성 도구입니다.',
      url: 'https://midjourney.com',
      category: '이미지 생성',
      icon: '🎨'
    },
    {
      name: 'Claude',
      description: 'Anthropic의 대화형 AI 어시스턴트입니다.',
      url: 'https://claude.ai',
      category: 'AI 어시스턴트',
      icon: '💭'
    },
    {
      name: 'Perplexity',
      description: 'AI 기반 검색 엔진으로 정확한 정보를 제공합니다.',
      url: 'https://perplexity.ai',
      category: '검색',
      icon: '🔍'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">AI 도구 추천</h1>
          <p className="text-lg text-gray-600">업무 효율을 높여줄 AI 도구들을 발견해보세요</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool, index) => (
            <div key={index} className="bg-white rounded-lg p-6 shadow-sm border hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-3xl">{tool.icon}</div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{tool.name}</h3>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {tool.category}
                  </span>
                </div>
              </div>
              
              <p className="text-gray-600 mb-4">{tool.description}</p>
              
              <button
                onClick={() => window.open(tool.url, '_blank')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
              >
                사용하기
              </button>
            </div>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <div className="bg-blue-50 rounded-lg p-6 inline-block">
            <p className="text-blue-800">
              <strong>더 많은 AI 도구가 준비 중입니다!</strong><br/>
              새로운 도구들이 계속 추가될 예정이니 자주 방문해주세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SimpleAIToolsPage