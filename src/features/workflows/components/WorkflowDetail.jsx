import React from 'react';

const WorkflowDetail = ({ workflow, onClose, onStartWorkflow }) => {
  if (!workflow) return null;

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case '초급':
        return 'bg-green-100 text-green-800 border-green-200';
      case '중급':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case '고급':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStepIcon = (index) => {
    return (
      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
        {index + 1}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-visible">
        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-900">{workflow.title}</h2>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getDifficultyColor(workflow.difficulty)}`}>
              {workflow.difficulty}
            </span>
          </div>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 내용 */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* 기본 정보 */}
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>예상 시간: {workflow.estimatedTime}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <span>카테고리: {workflow.category}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span>{workflow.steps.length}단계</span>
              </div>
            </div>
            <p className="text-gray-700 leading-relaxed">{workflow.description}</p>
          </div>

          {/* 워크플로우 단계 */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">워크플로우 단계</h3>
            <div className="space-y-4">
              {workflow.steps.map((step, index) => (
                <div key={step.order} className="flex items-start space-x-4">
                  {getStepIcon(index)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-medium text-gray-900">{step.action}</h4>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {step.tool}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm">{step.description}</p>
                  </div>
                  {index < workflow.steps.length - 1 && (
                    <div className="absolute left-4 mt-8 w-0.5 h-8 bg-gray-200"></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 태그 */}
          {workflow.tags && workflow.tags.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">관련 태그</h3>
              <div className="flex flex-wrap gap-2">
                {workflow.tags.map((tag, index) => (
                  <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 팁 섹션 */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="font-medium text-blue-900 mb-1">워크플로우 팁</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• 각 단계를 순서대로 진행하세요</li>
                  <li>• 중간 결과물을 저장해두면 나중에 활용할 수 있습니다</li>
                  <li>• 필요에 따라 단계를 건너뛰거나 반복할 수 있습니다</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            닫기
          </button>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                // 워크플로우 북마크 기능 (추후 구현)
              }}
              className="px-4 py-2 text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50 transition-colors"
            >
              북마크
            </button>
            <button
              onClick={() => onStartWorkflow(workflow)}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              워크플로우 시작
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowDetail;

