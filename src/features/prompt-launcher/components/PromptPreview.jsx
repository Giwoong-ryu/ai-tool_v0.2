import React, { useState } from 'react';
import { usePromptStore } from '../../../store/promptStore';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover';
import { Input } from '../../../components/ui/input';

const PromptPreview = () => {
  const { currentTemplate, selections, setFieldValue, generatePrompt } = usePromptStore();
  const [openPopovers, setOpenPopovers] = useState({});
  const [customInputs, setCustomInputs] = useState({});
  const [showCustomInput, setShowCustomInput] = useState({});

  const handleFieldChange = (fieldId, value) => {
    if (value === "직접입력") {
      setShowCustomInput(prev => ({ ...prev, [fieldId]: true }));
      setOpenPopovers(prev => ({ ...prev, [fieldId]: false }));
    } else {
      setFieldValue(fieldId, value);
      setShowCustomInput(prev => ({ ...prev, [fieldId]: false }));
      setOpenPopovers(prev => ({ ...prev, [fieldId]: false }));
    }
  };

  const handleCustomInput = (fieldId, value) => {
    setCustomInputs(prev => ({ ...prev, [fieldId]: value }));
    setFieldValue(fieldId, value);
  };

  // 개별 필드 버튼 렌더링 함수
  const renderFieldButton = (fieldId) => {
    const field = currentTemplate.fields?.find(f => f.id === fieldId);
    if (!field || !field.options || field.options.length === 0) {
      return <span className="text-slate-600">{currentTemplate.defaults[fieldId] || fieldId}</span>;
    }

    const currentValue = selections[fieldId] || currentTemplate.defaults[fieldId] || field.options[0];
    const isCustomInput = showCustomInput[fieldId];

    if (isCustomInput) {
      return (
        <div className="inline-flex items-center gap-2">
          <span>[</span>
          <Input
            type="text"
            placeholder="직접 입력하세요"
            value={customInputs[fieldId] || ''}
            onChange={(e) => handleCustomInput(fieldId, e.target.value)}
            className="w-32 h-8 px-2 py-1 text-sm border border-blue-300 rounded focus:border-blue-500"
            autoFocus
          />
          <span>]</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => setShowCustomInput(prev => ({ ...prev, [fieldId]: false }))}
          >
            ✕
          </Button>
        </div>
      );
    }

    return (
      <Popover
        open={openPopovers[fieldId] || false}
        onOpenChange={(isOpen) => setOpenPopovers(prev => ({ ...prev, [fieldId]: isOpen }))}
      >
        <PopoverTrigger asChild>
          <button 
            className="inline-flex items-center gap-1 px-3 py-1 mx-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg font-semibold transition-all duration-200 border border-blue-300 hover:border-blue-400 cursor-pointer"
          >
            <span>[{currentValue}]</span>
            <span className="text-xs">▼</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2 bg-white border border-slate-200 shadow-xl rounded-xl z-50">
          <div className="flex flex-col space-y-1 min-w-[150px]">
            {field.options.map(option => (
              <Button
                key={option}
                type="button"
                variant="ghost"
                className={`justify-start px-3 py-2 rounded-lg transition-all duration-200 text-left hover:bg-slate-50 ${
                  currentValue === option 
                    ? 'bg-blue-100 text-blue-800 font-semibold' 
                    : 'text-slate-700'
                }`}
                onClick={() => handleFieldChange(fieldId, option)}
              >
                <div className="flex items-center gap-2">
                  {option === "직접입력" ? (
                    <>
                      <span>✏️</span>
                      <span>{option}</span>
                    </>
                  ) : (
                    <span>{option}</span>
                  )}
                </div>
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    );
  };

  // 실제 프롬프트 생성
  const generatedPrompt = currentTemplate ? generatePrompt() : "템플릿을 선택해주세요.";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">📋 프롬프트 미리보기</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
          <div className="bg-white rounded-lg p-6 border border-slate-300">
            <div className="text-base leading-relaxed text-slate-800 whitespace-pre-wrap">
              {generatedPrompt}
            </div>
          </div>
        </div>
        {currentTemplate && (
          <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
            <span>추천 모델: {currentTemplate.modelHints?.primary}</span>
            <span>{Object.keys(selections).length}개 항목 변경됨</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PromptPreview;
