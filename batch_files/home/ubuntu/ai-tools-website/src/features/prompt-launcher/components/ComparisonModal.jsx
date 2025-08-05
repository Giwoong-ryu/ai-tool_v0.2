import React from 'react';
import usePromptStore from '../../../store/promptStore';

const ComparisonModal = () => {
  const { 
    isComparisonModalOpen, 
    setComparisonModalOpen, 
    currentTemplate, 
    finalPrompt 
  } = usePromptStore();

  if (!isComparisonModalOpen || !currentTemplate) return null;

  const getDefaultPrompt = () => {
    let defaultPrompt = currentTemplate.template;
    
    // 기본값으로 변수 치환
    defaultPrompt = defaultPrompt.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return currentTemplate.defaults[key] || match;
    });
    
    return defaultPrompt;
  };

  const handleSendToAI = () => {
    // 클립보드에 복사
    navigator.clipboard.writeText(finalPrompt);
    
    // 추천 모델로 새 탭 열기
    const primaryModel = currentTemplate.modelHints?.primary;
    let targetUrl = '';

    switch (primaryModel) {
      case 'ChatGPT':
        targetUrl = 'https://chat.openai.com/';
        break;
      case 'Claude':
        targetUrl = 'https://claude.ai/';
        break;
      case 'Gemini':
        targetUrl = 'https://gemini.google.com/';
        break;
      default:
        targetUrl = 'https://www.google.com/search?q=' + encodeURIComponent(primaryModel + ' AI');
    }

    if (targetUrl) {
      window.open(targetUrl, '_blank');
    }
    
    setComparisonModalOpen(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">프롬프트 비교</h2>
          <button
            onClick={() => setComparisonModalOpen(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 내용 */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 기본 프롬프트 */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-800">기본 프롬프트</h3>
                <span className="text-sm text-gray-500">
                  {getDefaultPrompt().length}자
                </span>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 min-h-[200px]">
                <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                  {getDefaultPrompt()}
                </p>
              </div>
            </div>

            {/* 맞춤 프롬프트 */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-800">맞춤 프롬프트</h3>
                <span className="text-sm text-gray-500">
                  {finalPrompt.length}자
                </span>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 min-h-[200px]">
                <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                  {finalPrompt}
                </p>
              </div>
            </div>
          </div>

          {/* 차이점 요약 */}
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h4 className="font-medium text-gray-800 mb-2">변경 사항 요약</h4>
            <div className="text-sm text-gray-600">
              <p>문자 수 차이: {finalPrompt.length - getDefaultPrompt().length}자</p>
              <p>추천 모델: {currentTemplate.modelHints?.primary}</p>
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end space-x-3">
          <button
            onClick={() => setComparisonModalOpen(false)}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            수정하기
          </button>
          <button
            onClick={handleSendToAI}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            {currentTemplate.modelHints?.primary}로 전송
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComparisonModal;

