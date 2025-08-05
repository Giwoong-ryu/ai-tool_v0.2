import React from 'react';
import { usePromptStore } from '../../../store/promptStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';

const ComparisonModal = () => {
  const { showComparison, toggleComparison, currentTemplate, selections, generatePrompt } = usePromptStore();

  if (!currentTemplate) return null;

  const defaultPrompt = currentTemplate.template.replace(/{{(\w+)}}/g, (match, key) => {
    return currentTemplate.defaults[key] || match;
  });

  const customPrompt = generatePrompt();

  return (
    <Dialog open={showComparison} onOpenChange={toggleComparison}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>프롬프트 비교</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-6 mt-4">
          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-700">기본 프롬프트</h3>
            <div className="p-4 bg-gray-50 rounded-md text-sm text-gray-800 leading-relaxed whitespace-pre-wrap min-h-[200px]">
              {defaultPrompt}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-3 text-blue-700">맞춤 프롬프트</h3>
            <div className="p-4 bg-blue-50 rounded-md text-sm text-gray-800 leading-relaxed whitespace-pre-wrap min-h-[200px]">
              {customPrompt}
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={toggleComparison}>
            수정하기
          </Button>
          <Button onClick={() => {
            navigator.clipboard.writeText(customPrompt);
            toggleComparison();
            alert('맞춤 프롬프트가 클립보드에 복사되었습니다!');
          }}>
            이대로 사용
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ComparisonModal;
