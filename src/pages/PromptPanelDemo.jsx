// src/pages/PromptPanelDemo.jsx - 통합 프롬프트 패널 데모 페이지
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { usePromptStore } from "../store/promptStore";
import PromptPanel from "../components/prompt/PromptPanel";

const PromptPanelDemo = () => {
  const { templates, setCurrentTemplate, currentTemplate } = usePromptStore();
  const [copiedPrompt, setCopiedPrompt] = useState("");

  const handleCopy = (prompt) => {
    setCopiedPrompt(prompt);
    setTimeout(() => setCopiedPrompt(""), 3000);
  };

  const handleSend = (prompt) => {
    console.log("AI에게 전송:", prompt);
    alert("AI에게 프롬프트를 전송했습니다!");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-full mb-4">
            <span className="font-medium text-sm">🚀 통합 프롬프트 패널 데모</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            새로운 프롬프트 생성 시스템
          </h1>
          <p className="text-gray-600">
            단일 패널에서 인라인 편집과 기본 추천값을 활용한 프롬프트 생성
          </p>
          {copiedPrompt && (
            <div className="mt-4 bg-green-100 text-green-800 px-3 py-2 rounded-lg text-sm inline-block">
              ✅ 프롬프트가 복사되었습니다!
            </div>
          )}
        </div>

        {/* 템플릿 선택이 없는 경우 */}
        {!currentTemplate && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">템플릿 선택</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <Card 
                  key={template.id} 
                  className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-200"
                  onClick={() => setCurrentTemplate(template)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{template.icon}</div>
                      <div>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <Badge variant="secondary" className="text-xs mt-1">
                          {template.category}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-gray-600">{template.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* 선택된 템플릿이 있는 경우 */}
        {currentTemplate && (
          <div className="space-y-6">
            {/* 템플릿 정보 */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{currentTemplate.icon}</div>
                    <div>
                      <CardTitle className="text-xl">{currentTemplate.name}</CardTitle>
                      <Badge variant="secondary" className="text-sm mt-1">
                        {currentTemplate.category}
                      </Badge>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => setCurrentTemplate(null)}
                  >
                    다른 템플릿 선택
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{currentTemplate.description}</p>
              </CardContent>
            </Card>

            {/* 통합 프롬프트 패널 */}
            <PromptPanel
              template={currentTemplate}
              onCopy={handleCopy}
              onSend={handleSend}
            />
          </div>
        )}

        {/* 기능 설명 */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>새로운 기능</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2 text-blue-600">✨ 인라인 편집</h4>
                <p className="text-sm text-gray-600">
                  파란색 텍스트를 클릭하여 바로 수정할 수 있습니다. 드롭다운에서 선택하거나 직접 입력이 가능합니다.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-green-600">🏷️ 기본 추천</h4>
                <p className="text-sm text-gray-600">
                  페이지 로딩 시 보편적 최선값이 즉시 표시되며 "(기본 추천)" 배지로 구분됩니다.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-purple-600">🔄 실시간 업데이트</h4>
                <p className="text-sm text-gray-600">
                  선택값이 변경되면 프롬프트가 실시간으로 업데이트되어 결과를 즉시 확인할 수 있습니다.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-orange-600">⚙️ 고급 모드</h4>
                <p className="text-sm text-gray-600">
                  고급 모드에서는 추가 질문을 체크하여 더 세밀한 프롬프트를 생성할 수 있습니다.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PromptPanelDemo;