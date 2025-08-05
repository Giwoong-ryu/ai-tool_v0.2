import React, { useState } from 'react';
import usePromptStore from '../../../store/promptStore';

const ActionButtons = () => {
  const { 
    finalPrompt, 
    currentTemplate, 
    selections,
    checkedQuestions,
    saveBookmark,
    setComparisonModalOpen 
  } = usePromptStore();
  
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopyToClipboard = async () => {
    if (!finalPrompt) return;
    
    try {
      await navigator.clipboard.writeText(finalPrompt);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('클립보드 복사 실패:', err);
    }
  };

  const handleSendToAI = () => {
    if (!finalPrompt || !currentTemplate) return;

    // 클립보드에 복사
    handleCopyToClipboard();

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
  };

  const handleSaveBookmark = () => {
    if (!finalPrompt || !currentTemplate) return;

    const newBookmark = {
      id: `bm_${Date.now()}`,
      title: `${currentTemplate.title} - ${new Date().toLocaleDateString()}`,
      templateId: currentTemplate.id,
      finalPrompt: finalPrompt,
      selections: selections,
      checkedQuestions: checkedQuestions,
      modelPrimary: currentTemplate.modelHints?.primary || 'N/A',
      tags: [currentTemplate.category, currentTemplate.title],
      createdAt: new Date().toISOString(),
    };

    saveBookmark(newBookmark);
  };

  const handleExport = (format) => {
    if (!finalPrompt) return;

    const filename = `prompt_${Date.now()}.${format}`;
    const content = format === 'md' 
      ? `# ${currentTemplate?.title || '프롬프트'}\n\n${finalPrompt}` 
      : finalPrompt;
    
    const blob = new Blob([content], { type: `text/${format}` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const isDisabled = !finalPrompt || !currentTemplate;

  return (
    <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
      <div className="space-y-4">
        {/* 메인 액션 버튼 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            onClick={handleSendToAI}
            disabled={isDisabled}
            className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors ${
              isDisabled
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
            }`}
          >
            {currentTemplate?.modelHints?.primary || 'AI'}로 전송
          </button>

          <button
            onClick={() => setComparisonModalOpen(true)}
            disabled={isDisabled}
            className={`w-full py-3 px-4 rounded-lg font-semibold border transition-colors ${
              isDisabled
                ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                : 'border-blue-600 text-blue-600 hover:bg-blue-50'
            }`}
          >
            미리보기 비교
          </button>
        </div>

        {/* 보조 액션 버튼들 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <button
            onClick={handleCopyToClipboard}
            disabled={isDisabled}
            className={`py-2 px-3 rounded-md text-sm font-medium border transition-colors ${
              copySuccess
                ? 'border-green-500 text-green-600 bg-green-50'
                : isDisabled
                ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {copySuccess ? '복사됨!' : '복사'}
          </button>

          <button
            onClick={handleSaveBookmark}
            disabled={isDisabled}
            className={`py-2 px-3 rounded-md text-sm font-medium border transition-colors ${
              isDisabled
                ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            북마크
          </button>

          <button
            onClick={() => handleExport('txt')}
            disabled={isDisabled}
            className={`py-2 px-3 rounded-md text-sm font-medium border transition-colors ${
              isDisabled
                ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            TXT
          </button>

          <button
            onClick={() => handleExport('md')}
            disabled={isDisabled}
            className={`py-2 px-3 rounded-md text-sm font-medium border transition-colors ${
              isDisabled
                ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            MD
          </button>
        </div>

        {/* 상태 정보 */}
        {currentTemplate && (
          <div className="pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>문자 수: {finalPrompt.length}</span>
              <span>추천 모델: {currentTemplate.modelHints?.primary}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActionButtons;

