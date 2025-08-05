import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from 'lucide-react';
import { usePromptStore } from '../store/promptStore.js';
import ComparisonModal from './ComparisonModal';
import { Send, Eye } from 'lucide-react';

const InteractivePrompt = ({ onNavigateToPrompts }) => {
  const { templates, selectedTemplate, setSelectedTemplate, setFieldValue } = usePromptStore();
  const [selectedValues, setSelectedValues] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openPopovers, setOpenPopovers] = useState({});
  const [customInputs, setCustomInputs] = useState({});
  const [showCustomInput, setShowCustomInput] = useState({});
  const [isTemplateSelectOpen, setIsTemplateSelectOpen] = useState(false);

  const currentTemplate = templates && templates.find(t => t.id === selectedTemplate);

  useEffect(() => {
    if (templates && templates.length > 0 && !selectedTemplate) {
      const firstTemplate = templates[0];
      setSelectedTemplate(firstTemplate.id);
      setSelectedValues(firstTemplate.defaults || {});
    }
  }, [templates, selectedTemplate, setSelectedTemplate]);

  useEffect(() => {
    // When template changes, reset the values
    if (currentTemplate) {
      setSelectedValues(currentTemplate.defaults || {});
    }
  }, [currentTemplate?.id]);

  const handleFieldChange = (fieldId, value) => {
    if (value === "직접입력") {
      setShowCustomInput(prev => ({ ...prev, [fieldId]: true }));
      setOpenPopovers(prev => ({ ...prev, [fieldId]: false }));
    } else {
      setSelectedValues(prev => ({ ...prev, [fieldId]: value }));
      setFieldValue(fieldId, value);
      setShowCustomInput(prev => ({ ...prev, [fieldId]: false }));
      setOpenPopovers(prev => ({ ...prev, [fieldId]: false }));
    }
  };

  const handleCustomInput = (fieldId, value) => {
    setCustomInputs(prev => ({ ...prev, [fieldId]: value }));
    setSelectedValues(prev => ({ ...prev, [fieldId]: value }));
    setFieldValue(fieldId, value);
  };

  const handleTemplateChange = (templateId) => {
    setSelectedTemplate(templateId);
    setSelectedValues({});
    // 템플릿 변경 시 필드 값들도 초기화
    const template = templates.find(t => t.id === templateId);
    if (template && template.defaults) {
      setSelectedValues(template.defaults);
    }
    setIsTemplateSelectOpen(false);
  };

  const handleUsePrompt = () => {
    onNavigateToPrompts({ 
      templateId: selectedTemplate,
      fieldValues: selectedValues
    });
  };

  // 개별 필드 버튼 렌더링 함수
  const renderFieldButton = (fieldId) => {
    const field = currentTemplate.fields.find(f => f.id === fieldId);
    if (!field || !field.options || field.options.length === 0) {
      return <span className="text-slate-600">{currentTemplate.defaults[fieldId] || fieldId}</span>;
    }

    const currentValue = selectedValues[fieldId] || currentTemplate.defaults[fieldId] || field.options[0];
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

  // 인터랙티브한 프롬프트 렌더링 함수
  const renderInteractivePrompt = () => {
    if (!currentTemplate) return null;

    const parts = currentTemplate.template.split(/(\{\{.*?\}\})/g).filter(Boolean);

    return parts.map((part, index) => {
      const match = part.match(/\{\{(.*?)\}\}/);
      if (match) {
        const fieldId = match[1];
        const field = currentTemplate.fields.find(f => f.id === fieldId);
        
        // 필드가 없거나 옵션이 없으면 기본 텍스트 반환
        if (!field || !field.options || field.options.length === 0) {
          return <span key={index} className="text-slate-600">{currentTemplate.defaults[fieldId] || fieldId}</span>;
        }

        const currentValue = selectedValues[fieldId] || currentTemplate.defaults[fieldId] || field.options[0];
        const isCustomInput = showCustomInput[fieldId];

        if (isCustomInput) {
          return (
            <div key={index} className="inline-flex items-center gap-2 mx-1">
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
            key={index}
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
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200/50 overflow-hidden">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-slate-50 to-blue-50 px-8 py-6 border-b border-slate-200/50">
        <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <span className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl text-white text-lg">
            🎯
          </span>
          원하는 대답 듣기
        </h3>
        <p className="text-slate-600 mt-2">파란색 박스를 클릭해서 옵션을 선택하세요</p>
      </div>

      {/* 템플릿 선택기 */}
      <div className="px-8 py-6 border-b border-slate-200/50">
        <div 
          className="cursor-pointer bg-gradient-to-r from-slate-50 to-purple-50 p-4 rounded-xl border border-slate-200 hover:border-purple-300 transition-all duration-300"
          onClick={() => setIsTemplateSelectOpen(!isTemplateSelectOpen)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg text-white text-sm">
                📝
              </span>
              <div>
                <h4 className="font-semibold text-slate-900">프롬프트 템플릿 선택</h4>
                {selectedTemplate && (
                  <span className="text-sm text-purple-600 font-medium">
                    {templates?.find(t => t.id === selectedTemplate)?.title || '선택됨'}
                  </span>
                )}
              </div>
            </div>
            {isTemplateSelectOpen ? 
              <ChevronUp className="w-5 h-5 text-slate-600" /> : 
              <ChevronDown className="w-5 h-5 text-slate-600" />
            }
          </div>
        </div>
        {isTemplateSelectOpen && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            {templates?.map((template) => (
              <button
                key={template.id}
                onClick={() => handleTemplateChange(template.id)}
                className={`p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                  selectedTemplate === template.id
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                }`}
              >
                <h4 className="font-semibold text-slate-900 mb-2">{template.title || template.name}</h4>
                <p className="text-sm text-slate-600">{template.category}</p>
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* 인터랙티브 프롬프트 */}
      <div className="p-8 space-y-6">
        {/* 프롬프트 미리보기 */}
        <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
          <h4 className="text-sm font-semibold text-slate-600 mb-3">📋 프롬프트 미리보기</h4>
          <div className="bg-white rounded-lg p-6 border border-slate-300">
            <div className="text-base leading-relaxed text-slate-800 space-y-6">
              {currentTemplate?.id === 'intro_001' && (
                <>
                  {/* [역할/페르소나] 섹션 */}
                  <div className="space-y-3">
                    <div className="text-sm font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-md inline-block">
                      [역할/페르소나]
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      <span>당신은</span>
                      {currentTemplate?.fields?.find(f => f.id === '페르소나') && (
                        <>
                          {renderFieldButton('페르소나')}
                          <span>입니다.</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* [목표] 섹션 */}
                  <div className="space-y-3">
                    <div className="text-sm font-bold text-green-700 bg-green-50 px-3 py-1 rounded-md inline-block">
                      [목표]
                    </div>
                    <div className="space-y-2">
                      <div>아래 목적을 달성하기 위해, 사용자가 바로 실행/적용할 수 있는 수준으로</div>
                      <div>세부 단계 → 코드/수식 → 검증 방법 → 흔한 오류/대응까지 포함한 결과를 제시하세요.</div>
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="font-semibold">목표:</span>
                        {currentTemplate?.fields?.find(f => f.id === '경력') && renderFieldButton('경력')}
                        {currentTemplate?.fields?.find(f => f.id === '직무') && renderFieldButton('직무')}
                        <span>을 위한</span>
                        {currentTemplate?.fields?.find(f => f.id === '지원동기') && renderFieldButton('지원동기')} 
                        <span>기반 자기소개서 작성</span>
                      </div>
                    </div>
                  </div>

                  {/* [산출물 형식] 섹션 */}
                  <div className="space-y-3">
                    <div className="text-sm font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-md inline-block">
                      [산출물 형식]
                    </div>
                    <div className="space-y-2">
                      <div>• <span className="font-semibold">출력 언어:</span> 한국어</div>
                      <div className="flex flex-wrap items-center gap-1">
                        <span>• <span className="font-semibold">문체:</span></span>
                        {currentTemplate?.fields?.find(f => f.id === '어조') && renderFieldButton('어조')}
                      </div>
                      <div>• <span className="font-semibold">구조:</span> 자기소개 → 핵심경험 → 지원동기 → 포부 순으로 구성</div>
                      <div>• <span className="font-semibold">길이:</span> A4 1장 분량 (800-1000자)</div>
                    </div>
                  </div>

                  {/* [맥락/제약] 섹션 */}
                  <div className="space-y-3">
                    <div className="text-sm font-bold text-orange-700 bg-orange-50 px-3 py-1 rounded-md inline-block">
                      [맥락/제약]
                    </div>
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-1">
                        <span>• <span className="font-semibold">핵심 경험:</span></span>
                        {currentTemplate?.fields?.find(f => f.id === '선택질문') && renderFieldButton('선택질문')}
                        <span>에 대한 구체적 사례 포함</span>
                      </div>
                      <div>• <span className="font-semibold">목표 독자:</span> 채용담당자 및 실무진</div>
                      <div>• <span className="font-semibold">제약:</span> 성과 중심의 구체적 수치 포함 필수</div>
                    </div>
                  </div>

                  {/* [기대 품질] 섹션 */}
                  <div className="space-y-3">
                    <div className="text-sm font-bold text-red-700 bg-red-50 px-3 py-1 rounded-md inline-block">
                      [기대 품질]
                    </div>
                    <div className="space-y-2">
                      <div>• 결과는 "바로 제출 가능한 완성도"를 목표로 합니다.</div>
                      <div>• 추상적 표현보다는 <strong>구체적 사례와 성과 수치</strong>를 포함해야 합니다.</div>
                      <div>• 지원 기업의 가치와 연결된 스토리텔링을 구성하세요.</div>
                    </div>
                  </div>
                </>
              )}

              {currentTemplate?.id === 'research_001' && (
                <>
                  {/* [역할/페르소나] 섹션 */}
                  <div className="space-y-3">
                    <div className="text-sm font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-md inline-block">
                      [역할/페르소나]
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      <span>당신은</span>
                      {currentTemplate?.fields?.find(f => f.id === '전문분야') && renderFieldButton('전문분야')}
                      <span>분야의 리서치 어시스턴트입니다.</span>
                    </div>
                  </div>

                  {/* [목표] 섹션 */}
                  <div className="space-y-3">
                    <div className="text-sm font-bold text-green-700 bg-green-50 px-3 py-1 rounded-md inline-block">
                      [목표]
                    </div>
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-1">
                        {currentTemplate?.fields?.find(f => f.id === '조사주제') && renderFieldButton('조사주제')}
                        <span>에 대해</span>
                        {currentTemplate?.fields?.find(f => f.id === '조사범위') && renderFieldButton('조사범위')}
                        <span>로 조사하여 체계적으로 정리합니다.</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1">
                        <span>최종 목적:</span>
                        {currentTemplate?.fields?.find(f => f.id === '활용목적') && renderFieldButton('활용목적')}
                        <span>에 최적화된 자료 제공</span>
                      </div>
                    </div>
                  </div>

                  {/* [산출물 형식] 섹션 */}
                  <div className="space-y-3">
                    <div className="text-sm font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-md inline-block">
                      [산출물 형식]
                    </div>
                    <div className="space-y-2">
                      <div>• <span className="font-semibold">출력 언어:</span> 한국어</div>
                      <div className="flex flex-wrap items-center gap-1">
                        <span>• <span className="font-semibold">형식:</span></span>
                        {currentTemplate?.fields?.find(f => f.id === '출력형식') && renderFieldButton('출력형식')}
                      </div>
                      <div>• <span className="font-semibold">구조:</span> 요약 → 주요 발견사항 → 상세 분석 → 결론 및 제언</div>
                      <div>• <span className="font-semibold">길이:</span> 핵심 내용 중심으로 적정 분량</div>
                    </div>
                  </div>

                  {/* [맥락/제약] 섹션 */}
                  <div className="space-y-3">
                    <div className="text-sm font-bold text-orange-700 bg-orange-50 px-3 py-1 rounded-md inline-block">
                      [맥락/제약]
                    </div>
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-1">
                        <span>• <span className="font-semibold">신뢰도 기준:</span></span>
                        {currentTemplate?.fields?.find(f => f.id === '신뢰도요구사항') && renderFieldButton('신뢰도요구사항')}
                        <span>만 사용</span>
                      </div>
                      <div>• <span className="font-semibold">출처 명시:</span> 모든 데이터와 정보에 출처 표기 필수</div>
                      <div>• <span className="font-semibold">객관성:</span> 편향 없는 중립적 관점 유지</div>
                    </div>
                  </div>

                  {/* [기대 품질] 섹션 */}
                  <div className="space-y-3">
                    <div className="text-sm font-bold text-red-700 bg-red-50 px-3 py-1 rounded-md inline-block">
                      [기대 품질]
                    </div>
                    <div className="space-y-2">
                      <div>• 결과는 <strong>즉시 업무에 활용 가능한 수준</strong>을 목표로 합니다.</div>
                      <div>• <strong>구체적 데이터와 수치</strong>를 포함하여 신뢰성을 높입니다.</div>
                      <div>• 핵심 인사이트와 실행 가능한 제언을 포함하세요.</div>
                    </div>
                  </div>
                </>
              )}

              {currentTemplate?.id === 'manual_001' && (
                <>
                  {/* [역할/페르소나] 섹션 */}
                  <div className="space-y-3">
                    <div className="text-sm font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-md inline-block">
                      [역할/페르소나]
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      <span>당신은</span>
                      {currentTemplate?.fields?.find(f => f.id === '분야') && renderFieldButton('분야')}
                      <span>분야의 테크니컬 라이터입니다.</span>
                    </div>
                  </div>

                  {/* [목표] 섹션 */}
                  <div className="space-y-3">
                    <div className="text-sm font-bold text-green-700 bg-green-50 px-3 py-1 rounded-md inline-block">
                      [목표]
                    </div>
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-1">
                        {currentTemplate?.fields?.find(f => f.id === '입력내용') && renderFieldButton('입력내용')}
                        <span>을</span>
                        {currentTemplate?.fields?.find(f => f.id === '대상사용자') && renderFieldButton('대상사용자')}
                        <span>가 쉽게 따라할 수 있는</span>
                        {currentTemplate?.fields?.find(f => f.id === '매뉴얼형식') && renderFieldButton('매뉴얼형식')}
                        <span>로 변환합니다.</span>
                      </div>
                      <div>현장에서 즉시 적용 가능하도록 구체적이고 실무적인 가이드를 제작합니다.</div>
                    </div>
                  </div>

                  {/* [산출물 형식] 섹션 */}
                  <div className="space-y-3">
                    <div className="text-sm font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-md inline-block">
                      [산출물 형식]
                    </div>
                    <div className="space-y-2">
                      <div>• <span className="font-semibold">출력 언어:</span> 한국어</div>
                      <div className="flex flex-wrap items-center gap-1">
                        <span>• <span className="font-semibold">세부 요구사항:</span></span>
                        {currentTemplate?.fields?.find(f => f.id === '세부요구사항') && renderFieldButton('세부요구사항')}
                      </div>
                      <div>• <span className="font-semibold">구조:</span> 개요 → 준비사항 → 단계별 실행 → 검증 → 문제해결</div>
                      <div>• <span className="font-semibold">스타일:</span> 간결하고 명확한 설명, 시각적 가독성 중시</div>
                    </div>
                  </div>

                  {/* [맥락/제약] 섹션 */}
                  <div className="space-y-3">
                    <div className="text-sm font-bold text-orange-700 bg-orange-50 px-3 py-1 rounded-md inline-block">
                      [맥락/제약]
                    </div>
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-1">
                        <span>• <span className="font-semibold">검증 방법:</span></span>
                        {currentTemplate?.fields?.find(f => f.id === '검증방법') && renderFieldButton('검증방법')}
                        <span>포함 필수</span>
                      </div>
                      <div>• <span className="font-semibold">사용자 레벨:</span> 대상 사용자의 지식 수준에 맞는 설명 깊이 조절</div>
                      <div>• <span className="font-semibold">실무 적용:</span> 이론보다는 실제 적용 가능한 내용 중심</div>
                    </div>
                  </div>

                  {/* [기대 품질] 섹션 */}
                  <div className="space-y-3">
                    <div className="text-sm font-bold text-red-700 bg-red-50 px-3 py-1 rounded-md inline-block">
                      [기대 품질]
                    </div>
                    <div className="space-y-2">
                      <div>• 결과는 <strong>"보고 따라하면 바로 되는"</strong> 수준을 목표로 합니다.</div>
                      <div>• <strong>단계별 상세 설명과 주의사항</strong>을 포함하여 실수를 방지합니다.</div>
                      <div>• 문제 발생 시 해결 방법과 대안을 제시하세요.</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>


        {/* 특징 설명 */}
        <div className="grid grid-cols-2 gap-4 text-xs text-slate-500">
          <div>
            <span className="font-medium">• 실시간 업데이트:</span> 선택사항이 바뀔 때마다 즉시 반영
          </div>
          <div>
            <span className="font-medium">• 이모지 아이콘:</span> 직접입력은 ✏️, 선택은 🔽로 구분
          </div>
          <div>
            <span className="font-medium">• 깔끔한 표시:</span> "당신은 [신입] [마케터]입니다..." 형식
          </div>
          <div>
            <span className="font-medium">• 호버 효과:</span> 마우스 오버 시 파란색 테두리
          </div>
        </div>
      </div>
      
      {/* 버튼 영역 */}
      <div className="px-8 pb-8">
        <div className="flex justify-center items-center space-x-4">
          <Button 
            variant="outline" 
            onClick={() => setIsModalOpen(true)}
            className="px-8 py-3 border-2 border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl font-medium transition-all duration-300 flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            상세 비교
          </Button>
          <Button 
            onClick={handleUsePrompt} 
            disabled={!currentTemplate}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-12 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            ✅ 전송하기
          </Button>
        </div>
      </div>
      
      <ComparisonModal 
        isOpen={isModalOpen} 
        onOpenChange={setIsModalOpen} 
        onUsePrompt={handleUsePrompt} 
      />
    </div>
  );
};

export default InteractivePrompt;