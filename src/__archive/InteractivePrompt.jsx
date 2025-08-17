// [자동 분류] 이 파일은 현재 사용되지 않으며 중복된 컴포넌트로 판단되어 아카이브 처리되었습니다.
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Search,
  ChevronDown,
  ChevronRight,
  Send,
  Eye,
  Grid3X3,
  List,
  Check,
} from "lucide-react";
import { usePromptStore } from "../store/promptStore.js";
import ComparisonModal from "./ComparisonModal";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const InteractivePrompt = ({ onNavigateToPrompts }) => {
  const { templates, selectedTemplate, setSelectedTemplate, setFieldValue } =
    usePromptStore();
  const [selectedValues, setSelectedValues] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [customInputs, setCustomInputs] = useState({});
  const [showCustomInput, setShowCustomInput] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'list'
  const [isModalOpen, setIsModalOpen] = useState(false);

  const currentTemplate =
    templates && templates.find((t) => t.id === selectedTemplate);

  // ✅ Static fields for the prompt generator
  const fields = [
    { id: 'persona', label: '페르소나', options: ['마케터', '개발자', '기획자', '디자이너', '직접 입력'] },
    { id: 'task', label: '주요 업무', options: ['콘텐츠 생성', '코드 리뷰', '아이디어 제안', '디자인 시안', '직접 입력'] },
    { id: 'style', label: '글쓰기 스타일', options: ['전문가처럼', '친근하게', '유머러스하게', '간결하게', '직접 입력'] },
    { id: 'tone', label: '어조', options: ['공식적인', '비공식적인', '객관적인', '설득적인', '직접 입력'] },
    { id: 'format', label: '출력 형식', options: ['줄글', '개조식', '표', '코드 블록', '직접 입력'] },
    { id: 'language', label: '언어', options: ['한국어', '영어', '일본어', '중국어', '직접 입력'] },
  ];

  // 카테고리 그룹
  const categorizedTemplates = templates
    ? templates.reduce((acc, template) => {
        const category = template.category || "기타";
        (acc[category] ||= []).push(template);
        return acc;
      }, {})
    : {};

  // 템플릿 선택
  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template.id);
    const defaults = Object.fromEntries(
      fields.map((f) => [f.id, f.options[0]])
    );
    setSelectedValues(defaults);
  };

  const handleFieldChange = (fieldId, value) => {
    if (value === "직접 입력") {
      setShowCustomInput((prev) => ({ ...prev, [fieldId]: true }));
    } else {
      setSelectedValues((prev) => ({ ...prev, [fieldId]: value }));
      setFieldValue?.(fieldId, value);
      setShowCustomInput((prev) => ({ ...prev, [fieldId]: false }));
    }
  };

  const handleCustomInput = (fieldId, value) => {
    setCustomInputs((prev) => ({ ...prev, [fieldId]: value }));
    setSelectedValues((prev) => ({ ...prev, [fieldId]: value }));
    setFieldValue?.(fieldId, value);
  };

  const handleUsePrompt = () => {
    onNavigateToPrompts?.({
      templateId: selectedTemplate,
      fieldValues: selectedValues,
    });
  };

  // ✅ 초기 자동 선택 + 기본값 주입
  useEffect(() => {
    if (templates && templates.length > 0 && !selectedTemplate) {
      const first = templates[0];
      setSelectedTemplate(first.id);
      const defaults = Object.fromEntries(
        fields.map((f) => [f.id, f.options[0]])
      );
      setSelectedValues(defaults);
    }
  }, [templates, selectedTemplate, setSelectedTemplate]);

  // 카테고리 자동 확장
  useEffect(() => {
    const initial = Object.keys(categorizedTemplates).reduce(
      (acc, cat) => ((acc[cat] = true), acc),
      {}
    );
    setExpandedCategories(initial);
  }, [templates]);

  // 검색
  const filteredTemplates = templates
    ? templates.filter((t) => {
        const q = searchQuery.trim().toLowerCase();
        return (
          t.title?.toLowerCase().includes(q) ||
          t.name?.toLowerCase().includes(q) ||
          t.category?.toLowerCase().includes(q) ||
          t.tags?.some((tag) => tag.toLowerCase().includes(q))
        );
      })
    : [];

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-t-2xl px-8 py-6 border border-slate-200/50">
        <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <span className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl text-white">
            🎯
          </span>
          원하는 대답 듣기
        </h3>
        <p className="text-slate-600 mt-2">
          템플릿을 선택하고 옵션을 조정하여 완벽한 프롬프트를 만드세요
        </p>
      </div>

      {/* 템플릿 선택 */}
      <div className="bg-white border-x border-slate-200/50 p-6">
        <div className="mb-6 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="템플릿 검색 (이름/카테고리/태그)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg ${
                viewMode === "grid"
                  ? "bg-emerald-100 text-emerald-600"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <Grid3X3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg ${
                viewMode === "list"
                  ? "bg-emerald-100 text-emerald-600"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="h-64 overflow-y-auto border border-slate-200 rounded-lg p-4 bg-slate-50">
          {viewMode === "grid" ? (
            <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {filteredTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    currentTemplate?.id === template.id
                      ? "border-emerald-500 bg-emerald-50 shadow-lg"
                      : "border-slate-200 hover:border-emerald-300 hover:shadow-md bg-white"
                  }`}
                >
                  <div className="text-center">
                    <span className="text-3xl mb-2 block">
                      {template.icon || "🧩"}
                    </span>
                    <h5 className="font-medium text-sm text-slate-900">
                      {template.title || template.name}
                    </h5>
                    <p className="text-xs text-slate-500 mt-1">
                      {template.category}
                    </p>
                    {currentTemplate?.id === template.id && (
                      <Check className="w-4 h-4 text-emerald-600 mx-auto mt-2" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {Object.entries(categorizedTemplates).map(([category, list]) => (
                <div key={category}>
                  <button
                    className="w-full flex items-center gap-2 px-2 py-1 text-left"
                    onClick={() =>
                      setExpandedCategories((prev) => ({
                        ...prev,
                        [category]: !prev[category],
                      }))
                    }
                  >
                    {expandedCategories[category] ? (
                      <ChevronDown />
                    ) : (
                      <ChevronRight />
                    )}
                    <span className="font-medium">{category}</span>
                  </button>
                  {expandedCategories[category] && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mt-2">
                      {list.map((template) => (
                        <button
                          key={template.id}
                          onClick={() => handleTemplateSelect(template)}
                          className={`p-3 rounded-lg border transition-all ${
                            currentTemplate?.id === template.id
                              ? "border-emerald-500 bg-emerald-50 shadow-sm"
                              : "border-slate-200 hover:border-emerald-300 hover:shadow"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">
                              {template.icon || "🧩"}
                            </span>
                            <div>
                              <div className="text-sm font-medium">
                                {template.title || template.name}
                              </div>
                              <div className="text-xs text-slate-500">
                                {template.category}
                              </div>
                            </div>
                          </div>
                          {currentTemplate?.id === template.id && (
                            <div className="flex items-center justify-center mt-2">
                              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 옵션 + 미리보기 */}
      <div className="bg-white rounded-b-2xl border border-t-0 border-slate-200/50 p-6">
        {currentTemplate ? (
          <div className="grid grid-cols-2 gap-6">
            {/* 왼쪽: 옵션 */}
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {currentTemplate.icon || "📝"}
                  </span>
                  <div>
                    <h3 className="font-bold text-slate-900">
                      {currentTemplate.title || currentTemplate.name}
                    </h3>
                    <p className="text-sm text-slate-600">
                      {currentTemplate.category}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-slate-700">옵션 설정</h4>
                {fields.map((field) => (
                  <div key={field.id} className="space-y-2">
                    <label className="text-sm font-medium text-slate-600">
                      {field.label || field.id}:
                    </label>
                    <select
                      value={showCustomInput[field.id] ? '직접 입력' : selectedValues[field.id] || ''}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500"
                    >
                      {field.options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    {showCustomInput[field.id] && (
                      <Input
                        type="text"
                        placeholder="직접 입력하세요"
                        value={customInputs[field.id] || ""}
                        onChange={(e) =>
                          handleCustomInput(field.id, e.target.value)
                        }
                        className="mt-2 h-8 text-sm"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 오른쪽: 생성 미리보기 */}
            <div>
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    생성 미리보기
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    {Object.keys(selectedValues).length === 0 ? (
                      <p className="text-slate-500">
                        왼쪽에서 옵션을 선택하면 오른쪽에 자동으로 문장이
                        채워집니다.
                      </p>
                    ) : (
                      <>
                        <p>
                          당신은{" "}
                          <strong>
                            {currentTemplate.title || currentTemplate.name}
                          </strong>{" "}
                          생성을 도와주는 전문가입니다.
                        </p>
                        <div className="mt-2">
                          <span className="font-semibold text-emerald-600">
                            [컨텍스트]
                          </span>
                          <p>
                            {Object.entries(selectedValues)
                              .slice(0, 1)
                              .map(([_, v]) => `${v}`)
                              .join(" ")}
                          </p>
                        </div>
                        <div>
                          <span className="font-semibold text-emerald-600">
                            [목표]
                          </span>
                          <p>
                            {Object.entries(selectedValues)
                              .slice(1, 3)
                              .map(([_, v]) => `${v}`)
                              .join(" ")}{" "}
                            관련 작업을 수행합니다.
                          </p>
                        </div>
                        <div>
                          <span className="font-semibold text-emerald-600">
                            [상세 요구사항]
                          </span>
                          <ul className="list-disc list-inside mt-1">
                            {Object.entries(selectedValues)
                              .map(([k, v]) => (
                                <li key={k}>
                                  {fields.find(f => f.id === k)?.label}: {v}
                                </li>
                              ))}
                          </ul>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-center gap-4 mt-6 pt-6 border-t border-slate-200">
                <Button variant="outline" onClick={() => setIsModalOpen(true)}>
                  비교 보기
                </Button>
                <Button onClick={handleUsePrompt}>
                  <Send className="w-4 h-4 mr-2" />이 프롬프트 사용하기
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <span className="text-5xl mb-3">🎯</span>
            <p className="text-lg font-medium">템플릿을 선택하세요</p>
            <p className="text-sm mt-1">
              위에서 원하는 템플릿을 선택하면 옵션이 표시됩니다
            </p>
          </div>
        )}
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