import React, { useMemo } from 'react';
import usePromptStore from '../../../store/promptStore';

const PromptPreview = () => {
  const { currentTemplate, selections, finalPrompt } = usePromptStore();

  const highlightedPrompt = useMemo(() => {
    if (!currentTemplate || !finalPrompt) return '';

    let promptText = currentTemplate.template;

    // 변수 치환 및 하이라이트
    promptText = promptText.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      const selectedValue = selections[key];
      const defaultValue = currentTemplate.defaults[key];
      const valueToUse = selectedValue !== undefined ? selectedValue : defaultValue;

      if (selectedValue !== undefined && selectedValue !== defaultValue) {
        // 사용자가 변경한 값은 하이라이트
        return `<span class="bg-yellow-200 text-gray-900 px-1 rounded font-medium">${valueToUse}</span>`;
      } else {
        // 기본값은 일반 텍스트
        return `<span class="text-gray-700">${valueToUse}</span>`;
      }
    });

    return promptText;
  }, [currentTemplate, selections, finalPrompt]);

  if (!currentTemplate) {
    return (
      <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg shadow-inner min-h-[200px] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-500 text-lg">템플릿을 선택하면 프롬프트 미리보기가 여기에 표시됩니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">프롬프트 미리보기</h3>
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {currentTemplate.category}
          </span>
          {Object.keys(selections).length > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              {Object.keys(selections).length}개 수정됨
            </span>
          )}
        </div>
      </div>
      
      <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg min-h-[150px] border border-blue-200">
        <div 
          className="text-gray-800 leading-relaxed whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ __html: highlightedPrompt }}
        />
      </div>
      
      <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
        <span>문자 수: {finalPrompt.length}</span>
        <span>추천 모델: {currentTemplate.modelHints?.primary || 'N/A'}</span>
      </div>
    </div>
  );
};

export default PromptPreview;

