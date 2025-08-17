// [자동 분류] 이 파일은 현재 사용되지 않으며 중복된 컴포넌트로 판단되어 아카이브 처리되었습니다.
// 임시 프롬프트 페이지
import React, { useState } from 'react'

const SimplePromptPage = () => {
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [generatedPrompt, setGeneratedPrompt] = useState('')

  const templates = [
    {
      id: 'resume',
      name: '자기소개서 작성',
      description: '입사지원용 자기소개서를 작성해보세요',
      icon: '📝'
    },
    {
      id: 'blog',
      name: '블로그 글 작성',
      description: '블로그나 기술 문서를 작성해보세요',
      icon: '📚'
    },
    {
      id: 'presentation',
      name: 'PPT 프레젠테이션',
      description: '프레젠테이션 구성안을 만들어보세요',
      icon: '📊'
    },
    {
      id: 'email',
      name: '이메일 작성',
      description: '비즈니스 이메일을 작성해보세요',
      icon: '📧'
    }
  ]

  const generatePrompt = (templateId) => {
    const prompts = {
      resume: `전문 취업 컨설턴트로서 다음 조건에 맞는 자기소개서를 작성해주세요:

1. 지원 직무에 대한 관심과 동기를 구체적으로 표현
2. 관련 경험이나 프로젝트를 구체적 사례와 함께 설명
3. 회사와의 적합성을 강조
4. 입사 후 기여할 수 있는 가치를 명시
5. 500-800자 내외로 작성

자기소개서를 작성해주세요.`,

      blog: `전문 콘텐츠 작가로서 다음 조건에 맞는 블로그 글을 작성해주세요:

1. 매력적인 제목과 도입부로 독자의 관심 유도
2. 논리적이고 체계적인 구성
3. 독자 수준에 맞는 설명과 예시 활용
4. 실질적인 도움이 되는 정보 제공
5. 1000-1500자 내외로 작성

블로그 글을 작성해주세요.`,

      presentation: `프레젠테이션 전문가로서 다음 조건에 맞는 PPT 구성안을 작성해주세요:

1. 명확한 스토리라인과 논리적 흐름
2. 각 슬라이드의 제목과 핵심 내용
3. 발표 대상의 관심과 수준 고려
4. 시각적 요소 활용 제안
5. 10-15장 분량으로 구성

PPT 구성안을 작성해주세요.`,

      email: `비즈니스 커뮤니케이션 전문가로서 다음 조건에 맞는 이메일을 작성해주세요:

1. 명확하고 구체적인 제목
2. 정중하면서도 효율적인 인사말
3. 목적과 요청사항을 명확히 제시
4. 수신자 입장을 고려한 배려 있는 표현
5. 명확한 액션 아이템과 마감일

전문적인 이메일을 작성해주세요.`
    }

    setGeneratedPrompt(prompts[templateId] || '프롬프트를 생성할 수 없습니다.')
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPrompt)
    alert('프롬프트가 클립보드에 복사되었습니다!')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">프롬프트 생성기</h1>
          <p className="text-lg text-gray-600">원하는 템플릿을 선택하고 최적화된 프롬프트를 생성해보세요</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 템플릿 선택 */}
          <div>
            <h2 className="text-xl font-semibold mb-4">템플릿 선택</h2>
            <div className="space-y-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedTemplate === template.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    setSelectedTemplate(template.id)
                    generatePrompt(template.id)
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{template.icon}</div>
                    <div>
                      <h3 className="font-semibold">{template.name}</h3>
                      <p className="text-sm text-gray-600">{template.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* 프롬프트 결과 */}
          <div>
            <h2 className="text-xl font-semibold mb-4">생성된 프롬프트</h2>
            <div className="bg-white border rounded-lg p-4 min-h-[400px]">
              {generatedPrompt ? (
                <div>
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 mb-4">
                    {generatedPrompt}
                  </pre>
                  <button
                    onClick={copyToClipboard}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    클립보드에 복사
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  왼쪽에서 템플릿을 선택하면 프롬프트가 생성됩니다
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-12 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">💡 사용 방법</h3>
          <div className="text-blue-800 space-y-1">
            <p>1. 원하는 템플릿을 선택하세요</p>
            <p>2. 생성된 프롬프트를 복사하세요</p>
            <p>3. ChatGPT, Claude 등 AI 도구에 붙여넣기 하세요</p>
            <p>4. 더 구체적인 정보를 추가하면 더 좋은 결과를 얻을 수 있습니다</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SimplePromptPage