// WorkflowGrid.jsx - 사용자 중심의 실행 가능한 워크플로우
import React, { useState } from "react";
import { Card, CardContent } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import {
  Play,
  Clock,
  ArrowRight,
  ExternalLink,
  CheckCircle,
  Circle,
  Lightbulb,
  Zap,
  Target,
  TrendingUp,
  Filter,
  Search,
} from "lucide-react";
import { aiUsageGuides } from "../../../data/aiTools";

const WorkflowGrid = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [completedSteps, setCompletedSteps] = useState({});

  // 카테고리 필터링
  const categories = [
    { id: "all", name: "전체", icon: Target },
    { id: "콘텐츠", name: "콘텐츠 제작", icon: Lightbulb },
    { id: "마케팅", name: "마케팅", icon: TrendingUp },
    { id: "비즈니스", name: "비즈니스", icon: Zap },
    { id: "교육", name: "교육/학습", icon: Target },
  ];

  // 필터링된 워크플로우
  const filteredWorkflows = aiUsageGuides.filter((workflow) => {
    const matchesCategory =
      selectedCategory === "all" ||
      workflow.keywords.some(
        (keyword) => getCategoryFromKeywords(keyword) === selectedCategory
      );

    const matchesSearch =
      !searchQuery ||
      workflow.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      workflow.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      workflow.keywords.some((keyword) =>
        keyword.toLowerCase().includes(searchQuery.toLowerCase())
      );

    return matchesCategory && matchesSearch;
  });

  // 키워드로부터 카테고리 추론
  function getCategoryFromKeywords(keyword) {
    const categoryMap = {
      콘텐츠: ["콘텐츠", "블로그", "영상", "글쓰기", "유튜브", "썸네일"],
      마케팅: ["마케팅", "SNS", "광고", "홍보", "이메일", "브랜딩"],
      비즈니스: ["비즈니스", "보고서", "PPT", "프레젠테이션", "회의"],
      교육: ["교육", "강의", "학습", "요약", "노트"],
    };

    for (const [category, keywords] of Object.entries(categoryMap)) {
      if (keywords.some((k) => keyword.includes(k))) {
        return category;
      }
    }
    return "기타";
  }

  // 단계 완료 토글
  const toggleStepCompletion = (workflowId, stepIndex) => {
    const key = `${workflowId}-${stepIndex}`;
    setCompletedSteps((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // 워크플로우 시작하기 (실제 도구로 연결)
  const startWorkflow = (workflow) => {
    // 첫 번째 도구로 직접 이동
    if (workflow.steps.length > 0) {
      const firstStep = workflow.steps[0];
      const toolUrl = getToolUrl(firstStep.tool_name);

      if (toolUrl) {
        window.open(toolUrl, "_blank");
      } else {
        // 기본적으로 구글 검색으로 이동
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(
          firstStep.tool_name + " AI tool"
        )}`;
        window.open(searchUrl, "_blank");
      }
    } else {
    }
  };

  // 도구 URL 매핑 (실제 데이터에 맞게 수정)
  const getToolUrl = (toolName) => {
    // 정확한 매칭을 위해 대소문자 및 공백 제거
    const normalizedName = toolName.trim();

    const toolUrls = {
      // 기본 대화형 AI
      ChatGPT: "https://chat.openai.com",
      "ChatGPT/Gemini": "https://chat.openai.com",
      Gemini: "https://gemini.google.com",
      "Gemini/ChatGPT": "https://gemini.google.com",
      Claude: "https://claude.ai",

      // 한국 AI 도구
      "Wrtn (뤼튼)": "https://wrtn.ai",
      "Naver Clova X": "https://clova.naver.com/clova-x",

      // 이미지/디자인
      Midjourney: "https://www.midjourney.com",
      "DALL-E 3": "https://chat.openai.com", // ChatGPT에서 DALL-E 3 사용
      "DALL-E 3/Midjourney": "https://chat.openai.com",
      "Midjourney/DALL-E 3": "https://www.midjourney.com",
      "Adobe Firefly": "https://firefly.adobe.com",
      "Canva Magic Studio": "https://www.canva.com/magic-studio",
      Karlo: "https://kakaobrain.com/service/karlo",
      "Leonardo.Ai": "https://leonardo.ai",
      "Remove.bg": "https://www.remove.bg",
      Remini: "https://remini.ai",

      // 텍스트/문서
      "Copy.ai": "https://www.copy.ai",
      Writesonic: "https://writesonic.com",
      "Writesonic/Jasper": "https://writesonic.com",
      Jasper: "https://www.jasper.ai",
      "Jasper/Writesonic": "https://www.jasper.ai",
      "DeepL 번역": "https://www.deepl.com/translator",
      "DeepL Write": "https://www.deepl.com/write",
      GrammarlyGo: "https://www.grammarly.com",

      // 동영상
      HeyGen: "https://www.heygen.com",
      Synthesia: "https://www.synthesia.io",
      "D-ID": "https://www.d-id.com",
      RunwayML: "https://runwayml.com",
      "Vrew (브루)": "https://vrew.me",
      "CapCut (AI Features)": "https://www.capcut.com",
      Descript: "https://www.descript.com",
      "Pictory AI": "https://pictory.ai",

      // 음성
      ElevenLabs: "https://elevenlabs.io",
      "ElevenLabs (API)": "https://elevenlabs.io/api",
      "Otter.ai": "https://otter.ai",
      "Otter.ai/Vrew": "https://otter.ai",
      Krisp: "https://krisp.ai",

      // 생산성/분석
      "Beautiful.ai": "https://www.beautiful.ai",
      "Beautiful.ai/Gamma/Tome": "https://www.beautiful.ai",
      Gamma: "https://gamma.app",
      "Gamma/Tome": "https://gamma.app",
      "Perplexity AI": "https://www.perplexity.ai",
      "AdCreative.ai": "https://adcreative.ai",
      "ManyChat (AI)": "https://manychat.com",
      Typeface: "https://www.typeface.ai",

      // 기타 추가 도구들
      Mapify: "https://mapify.so",
      EdrawMind: "https://www.edrawsoft.com/edrawmind",
      "Lilys AI": "https://lilys.ai",
      "Kasa (AI Features)": "https://kasa.co.kr",
      "무하유 (카피킬러)": "https://www.copykiller.com",
      "무하유 (GPT킬러)": "https://www.copykiller.com/gptkiller",
      "Galileo AI": "https://www.usegalileo.ai",
      "Resume.io": "https://resume.io",

      // Microsoft/Notion 등 대기업 도구들
      "Notion AI": "https://notion.so",
      "Microsoft Copilot": "https://copilot.microsoft.com",
      "Microsoft Copilot (Word)": "https://office.com",
    };

    // 정확히 매치되는 URL 찾기
    let url = toolUrls[normalizedName];

    // 매치가 안 되더라도 부분 매치 시도
    if (!url) {
      // 주요 키워드 기반 매칭
      const lowerName = normalizedName.toLowerCase();
      if (lowerName.includes("chatgpt") || lowerName.includes("gpt")) {
        url = "https://chat.openai.com";
      } else if (lowerName.includes("gemini")) {
        url = "https://gemini.google.com";
      } else if (lowerName.includes("claude")) {
        url = "https://claude.ai";
      } else if (lowerName.includes("뤼튼") || lowerName.includes("wrtn")) {
        url = "https://wrtn.ai";
      } else if (lowerName.includes("midjourney")) {
        url = "https://www.midjourney.com";
      } else if (lowerName.includes("canva")) {
        url = "https://www.canva.com/magic-studio";
      } else if (lowerName.includes("gamma")) {
        url = "https://gamma.app";
      } else if (lowerName.includes("beautiful")) {
        url = "https://www.beautiful.ai";
      }
    }

    return url || null;
  };

  // 소요 시간 계산
  const getEstimatedTime = (stepsLength) => {
    const baseTime = stepsLength * 5;
    const minTime = Math.max(baseTime - 10, 5); // 최소 5분
    const maxTime = baseTime + 5;
    return `${minTime}-${maxTime}분`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 bg-purple-50 text-purple-600 px-4 py-2 rounded-full mb-4">
            <Zap className="w-4 h-4" />
            <span className="font-medium text-sm">AI 워크플로우</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AI 도구 연계 워크플로우
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            여러 AI 도구를 연결하여 복잡한 작업을 효율적으로 완성하는 검증된
            워크플로우를 제공합니다.
          </p>
        </div>

        {/* 필터 & 검색 */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* 카테고리 필터 */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedCategory === category.id
                        ? "bg-purple-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {category.name}
                  </button>
                );
              })}
            </div>

            {/* 검색 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="워크플로우 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>
        </div>

        {/* 워크플로우 그리드 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {filteredWorkflows.map((workflow) => (
            <Card
              key={workflow.id}
              className="overflow-hidden hover:shadow-lg transition-shadow"
            >
              <CardContent className="p-6">
                {/* 헤더 */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {workflow.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3">
                      {workflow.description}
                    </p>

                    {/* 메타 정보 */}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {getEstimatedTime(workflow.steps.length)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Target className="w-4 h-4" />
                        {workflow.steps.length}단계
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      startWorkflow(workflow);
                    }}
                    className="bg-purple-500 hover:bg-purple-600 text-white relative"
                    type="button"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    시작하기
                  </Button>
                </div>

                {/* 키워드 태그 */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {workflow.keywords.slice(0, 4).map((keyword, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                  {workflow.keywords.length > 4 && (
                    <Badge variant="outline" className="text-xs">
                      +{workflow.keywords.length - 4}
                    </Badge>
                  )}
                </div>

                {/* 단계 미리보기 */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 text-sm">
                    단계별 진행
                  </h4>
                  {workflow.steps.map((step, index) => {
                    const isCompleted =
                      completedSteps[`${workflow.id}-${index}`];
                    const toolUrl = getToolUrl(step.tool_name);

                    return (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 rounded-lg bg-gray-50"
                      >
                        {/* 단계 완료 체크 */}
                        <button
                          onClick={() =>
                            toggleStepCompletion(workflow.id, index)
                          }
                          className="mt-1"
                        >
                          {isCompleted ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <Circle className="w-5 h-5 text-gray-400" />
                          )}
                        </button>

                        {/* 단계 내용 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-purple-600">
                              {step.step_number}단계
                            </span>
                            <span className="text-sm font-semibold text-gray-900">
                              {step.tool_name}
                            </span>
                            {toolUrl && (
                              <button
                                onClick={() => window.open(toolUrl, "_blank")}
                                className="text-blue-500 hover:text-blue-700"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            {step.tool_action}
                          </p>
                          {step.details && (
                            <p className="text-xs text-gray-500">
                              {step.details}
                            </p>
                          )}
                        </div>

                        {/* 화살표 (마지막 단계 제외) */}
                        {index < workflow.steps.length - 1 && (
                          <ArrowRight className="w-4 h-4 text-gray-400 mt-1" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* 진행률 표시 */}
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      진행률:{" "}
                      {
                        workflow.steps.filter(
                          (_, index) =>
                            completedSteps[`${workflow.id}-${index}`]
                        ).length
                      }
                      /{workflow.steps.length}
                    </span>
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full transition-all"
                        style={{
                          width: `${
                            (workflow.steps.filter(
                              (_, index) =>
                                completedSteps[`${workflow.id}-${index}`]
                            ).length /
                              workflow.steps.length) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 결과가 없을 때 */}
        {filteredWorkflows.length === 0 && (
          <div className="text-center py-12">
            <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              검색 조건에 맞는 워크플로우가 없습니다
            </h3>
            <p className="text-gray-500">
              다른 키워드로 검색하거나 카테고리를 변경해보세요.
            </p>
          </div>
        )}

        {/* 도움말 섹션 */}
        <div className="mt-12 bg-blue-50 rounded-xl p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            💡 워크플로우 활용 팁
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              ✓ 각 단계를 순서대로 따라하면 최적의 결과를 얻을 수 있습니다
            </div>
            <div>✓ 체크박스로 진행 상황을 관리하며 효율적으로 작업하세요</div>
            <div>
              ✓ 외부 링크 아이콘을 클릭하면 해당 AI 도구로 바로 이동합니다
            </div>
            <div>✓ 완료된 워크플로우는 나만의 템플릿으로 활용하세요</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowGrid;
