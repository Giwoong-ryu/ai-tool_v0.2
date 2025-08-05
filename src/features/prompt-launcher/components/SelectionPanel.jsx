import React from 'react';
import { usePromptStore } from '../../../store/promptStore';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Checkbox } from '../../../components/ui/checkbox';

const SelectionPanel = () => {
  const { currentTemplate, selections, setSelection, isAdvancedMode } = usePromptStore();

  if (!currentTemplate) return null;

  const handleSelectionChange = (key, value) => {
    setSelection(key, value);
  };

  const getSelectedValue = (key) => {
    return selections[key] || currentTemplate.defaults[key];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">선택 옵션</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentTemplate.fields?.map((field) => {
          // 고급 모드가 아니고 페르소나인 경우 숨김
          if (!isAdvancedMode && field.id === '페르소나') return null;
          
          return (
            <div key={field.id} className="space-y-2">
              <Label className="text-sm font-medium">{field.label}</Label>
              <Select 
                value={getSelectedValue(field.id)} 
                onValueChange={(value) => handleSelectionChange(field.id, value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={`선택: ${currentTemplate.defaults[field.id]}`} />
                </SelectTrigger>
                <SelectContent>
                  {field.options?.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        })}

        {/* 조건부 질문 (고급 모드에서만) */}
        {isAdvancedMode && currentTemplate.questions && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <Label className="text-sm font-medium">추가 질문</Label>
            <div className="mt-2 space-y-3">
              {currentTemplate.questions.map((question, index) => {
                // 조건 확인
                const conditionMet = Object.entries(question.when).every(([key, value]) => {
                  return getSelectedValue(key) === value;
                });

                if (!conditionMet) return null;

                return (
                  <div key={index} className="flex items-start space-x-2">
                    <Checkbox id={`question-${index}`} className="mt-0.5" />
                    <Label htmlFor={`question-${index}`} className="text-sm text-gray-700 leading-relaxed">
                      {question.ask}
                    </Label>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SelectionPanel;
