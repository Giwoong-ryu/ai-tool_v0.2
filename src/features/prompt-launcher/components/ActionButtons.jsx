import React from 'react';
import { usePromptStore } from '../../../store/promptStore';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';

const ActionButtons = () => {
  const { currentTemplate, selections, generatePrompt, toggleComparison, saveBookmark } = usePromptStore();

  const handleCopyAndSend = () => {
    if (!currentTemplate) return;

    const prompt = generatePrompt();
    
    // 클립보드에 복사
    navigator.clipboard.writeText(prompt).then(() => {
      alert('프롬프트가 클립보드에 복사되었습니다!');
    });

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

  const handleBookmark = () => {
    saveBookmark();
    alert('북마크에 저장되었습니다!');
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-3">
          <Button 
            onClick={handleCopyAndSend}
            disabled={!currentTemplate}
            className="w-full"
            size="lg"
          >
            📋 복사 + AI 모델로 전송
          </Button>
          
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              onClick={toggleComparison}
              disabled={!currentTemplate}
              size="sm"
            >
              비교보기
            </Button>
            <Button 
              variant="outline" 
              onClick={handleBookmark}
              disabled={!currentTemplate}
              size="sm"
            >
              북마크
            </Button>
          </div>

          {currentTemplate && (
            <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
              <p className="text-xs text-blue-800">
                <strong>추천:</strong> {currentTemplate.modelHints?.primary} - {currentTemplate.modelHints?.rationale}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ActionButtons;
