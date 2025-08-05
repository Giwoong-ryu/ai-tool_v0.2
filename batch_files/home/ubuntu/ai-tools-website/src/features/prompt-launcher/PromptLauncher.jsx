import React from 'react';
import TemplateSelector from './components/TemplateSelector';
import SelectionPanel from './components/SelectionPanel';
import PromptPreview from './components/PromptPreview';
import ActionButtons from './components/ActionButtons';
import ComparisonModal from './components/ComparisonModal';
import usePromptStore from '../../store/promptStore';

const PromptLauncher = () => {
  const { currentTemplate, isAdvancedMode, toggleAdvancedMode } = usePromptStore();

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">프롬프트 생성기</h2>
        <p className="text-gray-600">목적에 맞는 프롬프트를 쉽게 생성하고 AI 모델에 바로 전송하세요</p>
      </div>

      {/* 모드 토글 */}
      <div className="flex items-center justify-center">
        <div className="flex items-center space-x-3 bg-white rounded-lg shadow-md border border-gray-200 p-1">
          <button
            onClick={() => !isAdvancedMode || toggleAdvancedMode()}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              !isAdvancedMode
                ? 'bg-blue-500 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            심플 모드
          </button>
          <button
            onClick={() => isAdvancedMode || toggleAdvancedMode()}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              isAdvancedMode
                ? 'bg-blue-500 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            고급 모드
          </button>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 왼쪽: 템플릿 선택 */}
        <div className="lg:col-span-1">
          <TemplateSelector />
        </div>

        {/* 가운데: 선택 패널 */}
        <div className="lg:col-span-1">
          {currentTemplate ? (
            <SelectionPanel />
          ) : (
            <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 min-h-[400px] flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg>
                </div>
                <p className="text-gray-500">템플릿을 선택하면 설정 옵션이 여기에 표시됩니다</p>
              </div>
            </div>
          )}
        </div>

        {/* 오른쪽: 미리보기 및 액션 */}
        <div className="lg:col-span-1 space-y-6">
          <PromptPreview />
          <ActionButtons />
        </div>
      </div>

      {/* 비교 모달 */}
      <ComparisonModal />

      {/* 도움말 섹션 */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">프롬프트 생성기 사용법</h3>
            <ul className="text-blue-800 space-y-1 text-sm">
              <li>• <strong>1단계:</strong> 왼쪽에서 목적에 맞는 템플릿을 선택하세요</li>
              <li>• <strong>2단계:</strong> 가운데에서 원하는 옵션을 선택하고 설정하세요</li>
              <li>• <strong>3단계:</strong> 오른쪽에서 생성된 프롬프트를 확인하고 AI 모델로 전송하세요</li>
              <li>• <strong>팁:</strong> 고급 모드에서는 추가 질문과 세부 설정을 사용할 수 있습니다</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptLauncher;

