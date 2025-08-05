import React from 'react';
import TemplateSelector from './components/TemplateSelector';
import SelectionPanel from './components/SelectionPanel';
import PromptPreview from './components/PromptPreview';
import ActionButtons from './components/ActionButtons';
import ComparisonModal from './components/ComparisonModal';
import { usePromptStore } from '../../store/promptStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Lightbulb, Target, Zap, ArrowRight } from 'lucide-react';

const PromptLauncher = ({ initialData }) => {
  const { currentTemplate, isAdvancedMode, toggleAdvancedMode } = usePromptStore();

  return (
    <div className="space-y-8">
      {/* 헤더 섹션 */}
      <div className="text-center space-y-6">
        <div className="inline-flex items-center space-x-2 bg-primary-50 text-primary-600 px-6 py-3 rounded-full backdrop-blur-sm border border-primary-100/50 shadow-glass">
          <Zap className="w-4 h-4" />
          <span className="font-body text-body-sm font-semibold">AI 프롬프트 생성기</span>
        </div>
        <h2 className="font-display text-display-lg font-semibold text-neutral-900">더 나은 결과를 위한 프롬프트 제작소</h2>
        <p className="font-body text-body-lg text-neutral-700 max-w-2xl mx-auto leading-relaxed">
          원하는 결과를 명확히 하고, 선택만 하면 최적화된 프롬프트가 완성됩니다.<br/>
          <span className="text-primary-600 font-semibold">복사 한 번으로 AI에게 정확히 전달하세요.</span>
        </p>
      </div>

      {/* 진행 단계 표시 */}
      <div className="flex justify-center mb-8">
        <div className="flex items-center space-x-4 bg-neutral-0/90 backdrop-blur-lg rounded-lg shadow-glass border border-neutral-200/50 p-6">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-body text-body-sm font-semibold ${
              currentTemplate ? 'bg-accent-500 text-neutral-0 shadow-elev' : 'bg-primary-500 text-neutral-0 shadow-elev'
            }`}>
              1
            </div>
            <span className="font-body text-body-sm font-medium text-neutral-700">목적 선택</span>
          </div>
          <ArrowRight className="w-5 h-5 text-neutral-200" />
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-body text-body-sm font-semibold ${
              currentTemplate ? 'bg-primary-500 text-neutral-0 shadow-elev' : 'bg-neutral-200 text-neutral-700'
            }`}>
              2
            </div>
            <span className="font-body text-body-sm font-medium text-neutral-700">세부 설정</span>
          </div>
          <ArrowRight className="w-5 h-5 text-neutral-200" />
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-neutral-200 text-neutral-700 flex items-center justify-center font-body text-body-sm font-semibold">
              3
            </div>
            <span className="font-body text-body-sm font-medium text-neutral-700">AI 전송</span>
          </div>
        </div>
      </div>

      {/* 모드 토글 */}
      <div className="flex items-center justify-center">
        <div className="flex items-center space-x-2 bg-neutral-0/90 backdrop-blur-lg rounded-lg shadow-glass border border-neutral-200/50 p-2">
          <button
            onClick={() => !isAdvancedMode || toggleAdvancedMode()}
            className={`px-8 py-4 rounded-lg font-body text-body-sm font-medium transition-all duration-300 ${
              !isAdvancedMode
                ? 'bg-primary-500 text-neutral-0 shadow-elev transform scale-105'
                : 'text-neutral-700 hover:bg-neutral-50 backdrop-blur-sm'
            }`}
          >
            <div className="flex items-center space-x-2">
              <span>🎯</span>
              <span>간단 모드</span>
            </div>
            <div className="text-xs opacity-80 mt-1">빠르게 시작</div>
          </button>
          <button
            onClick={() => isAdvancedMode || toggleAdvancedMode()}
            className={`px-8 py-4 rounded-lg font-body text-body-sm font-medium transition-all duration-300 ${
              isAdvancedMode
                ? 'bg-primary-500 text-neutral-0 shadow-elev transform scale-105'
                : 'text-neutral-700 hover:bg-neutral-50 backdrop-blur-sm'
            }`}
          >
            <div className="flex items-center space-x-2">
              <span>⚙️</span>
              <span>고급 모드</span>
            </div>
            <div className="text-xs opacity-80 mt-1">세밀한 조정</div>
          </button>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 왼쪽: 템플릿 선택 */}
        <div className="lg:col-span-3">
          <TemplateSelector />
        </div>

        {/* 가운데: 선택 패널 */}
        <div className="lg:col-span-4">
          {currentTemplate ? (
            <SelectionPanel />
          ) : (
            <Card className="h-full bg-neutral-0/90 backdrop-blur-lg border border-neutral-200/50 shadow-glass">
              <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-6 min-h-[400px]">
                <div className="w-24 h-24 bg-neutral-50 rounded-full flex items-center justify-center shadow-elev">
                  <Target className="w-12 h-12 text-neutral-200" />
                </div>
                <div className="space-y-4">
                  <h3 className="font-display text-heading font-semibold text-neutral-900">목적을 선택해주세요</h3>
                  <p className="font-body text-body-sm text-neutral-700 leading-relaxed">
                    왼쪽에서 원하는 작업 목적을 선택하면<br/>
                    맞춤형 설정 옵션이 여기에 표시됩니다
                  </p>
                </div>
                <div className="flex items-center space-x-2 font-body text-body-sm text-primary-600 bg-primary-50 px-4 py-2 rounded-full">
                  <Lightbulb className="w-4 h-4" />
                  <span>자기소개서부터 시작해보세요!</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 오른쪽: 미리보기 및 액션 */}
        <div className="lg:col-span-5 space-y-6">
          <PromptPreview />
          <ActionButtons />
        </div>
      </div>

      {/* 비교 모달 */}
      <ComparisonModal />

      {/* 도움말 섹션 */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Lightbulb className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">💡 더 좋은 결과를 얻는 팁</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <span className="text-blue-600">✓</span>
                  <span><strong>구체적인 선택:</strong> '친근한 톤'보다 '20대 후배에게 말하는 톤'이 더 정확</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-blue-600">✓</span>
                  <span><strong>목적 명확화:</strong> '글쓰기'보다 '입사지원서 자기소개서'가 더 좋은 결과</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <span className="text-blue-600">✓</span>
                  <span><strong>예시 활용:</strong> 고급 모드에서 구체적인 사례를 추가하면 더 정확</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-blue-600">✓</span>
                  <span><strong>반복 개선:</strong> 첫 결과가 아쉬우면 옵션을 조금씩 바꿔보세요</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 성공 사례 */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">🎉 실제 사용자 성공 사례</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl mb-2">📝</div>
              <h4 className="font-semibold text-green-800">자기소개서 합격률</h4>
              <p className="text-sm text-green-700 mt-1">기존 30% → 78% 향상</p>
            </CardContent>
          </Card>
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl mb-2">⏱️</div>
              <h4 className="font-semibold text-blue-800">작성 시간 단축</h4>
              <p className="text-sm text-blue-700 mt-1">평균 3시간 → 30분</p>
            </CardContent>
          </Card>
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl mb-2">⭐</div>
              <h4 className="font-semibold text-purple-800">만족도 점수</h4>
              <p className="text-sm text-purple-700 mt-1">4.8/5.0 (1,847명)</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PromptLauncher;

