import React from 'react';
import usePromptStore from '../../../store/promptStore';

const SelectionPanel = () => {
  const { 
    currentTemplate, 
    selections, 
    checkedQuestions,
    isAdvancedMode,
    updateSelection, 
    toggleQuestion 
  } = usePromptStore();

  if (!currentTemplate) return null;

  const renderInputElement = (key, options) => {
    const currentValue = selections[key] || currentTemplate.defaults[key];
    
    if (options.length > 5) {
      // 드롭다운
      return (
        <select
          value={currentValue}
          onChange={(e) => updateSelection(key, e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    } else {
      // 버튼 그룹
      return (
        <div className="flex flex-wrap gap-2">
          {options.map((option) => (
            <button
              key={option}
              onClick={() => updateSelection(key, option)}
              className={`px-4 py-2 rounded-md border transition-colors ${
                currentValue === option
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      );
    }
  };

  const getConditionalQuestions = () => {
    return currentTemplate.questions.filter(q => {
      return Object.entries(q.when).every(([key, value]) => {
        return (selections[key] || currentTemplate.defaults[key]) === value;
      });
    });
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">선택 패널</h3>
        <div className="flex items-center space-x-2">
          {Object.keys(selections).length > 0 && (
            <span className="text-sm text-gray-500">
              {Object.keys(selections).length}개 변경됨
            </span>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(currentTemplate.options).map(([key, options]) => (
          <div key={key} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 capitalize">
              {key}
              {selections[key] && selections[key] !== currentTemplate.defaults[key] && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                  수정됨
                </span>
              )}
            </label>
            {renderInputElement(key, options)}
            {currentTemplate.defaults[key] && (
              <p className="text-xs text-gray-500">
                기본값: {currentTemplate.defaults[key]}
              </p>
            )}
          </div>
        ))}

        {/* 조건부 질문 */}
        {isAdvancedMode && getConditionalQuestions().length > 0 && (
          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-3">추가 질문</h4>
            <div className="space-y-3">
              {getConditionalQuestions().map((q, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id={`question-${index}`}
                    checked={checkedQuestions.includes(q.ask)}
                    onChange={() => toggleQuestion(q.ask)}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label 
                    htmlFor={`question-${index}`}
                    className="text-sm text-gray-700 cursor-pointer"
                  >
                    {q.ask}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 리셋 버튼 */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <button
          onClick={() => {
            Object.keys(selections).forEach(key => {
              updateSelection(key, currentTemplate.defaults[key]);
            });
          }}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          기본값으로 리셋
        </button>
      </div>
    </div>
  );
};

export default SelectionPanel;

