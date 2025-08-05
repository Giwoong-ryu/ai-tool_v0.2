import React, { useState, useEffect } from 'react';
import usePromptStore from '../../../store/promptStore';
import templatesData from '../data/templates.json';

const TemplateSelector = () => {
  const { currentTemplate, setCurrentTemplate } = usePromptStore();
  const [templates, setTemplates] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('전체');

  useEffect(() => {
    setTemplates(templatesData);
  }, []);

  const categories = ['전체', ...new Set(templates.map(t => t.category))];
  
  const filteredTemplates = selectedCategory === '전체' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory);

  const handleTemplateSelect = (template) => {
    setCurrentTemplate(template);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">템플릿 선택</h3>
        <span className="text-sm text-gray-500">
          {filteredTemplates.length}개 템플릿
        </span>
      </div>

      {/* 카테고리 필터 */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* 템플릿 목록 */}
      <div className="space-y-3">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            onClick={() => handleTemplateSelect(template)}
            className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
              currentTemplate?.id === template.id
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h4 className="font-medium text-gray-900">{template.title}</h4>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                    {template.category}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {template.template.substring(0, 100)}...
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>변수: {Object.keys(template.options).length}개</span>
                    <span>추천: {template.modelHints?.primary}</span>
                  </div>
                  
                  {currentTemplate?.id === template.id && (
                    <div className="flex items-center text-blue-600">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs font-medium">선택됨</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-500">해당 카테고리에 템플릿이 없습니다</p>
        </div>
      )}
    </div>
  );
};

export default TemplateSelector;

