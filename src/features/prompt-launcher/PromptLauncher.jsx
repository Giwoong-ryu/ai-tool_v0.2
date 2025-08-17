// src/features/prompt-launcher/PromptLauncher.jsx - UI/UX 개선 버전
import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import {
  Search,
  Grid3X3,
  List,
  Check,
  Lightbulb,
  Target,
  Zap,
  ArrowRight,
  Sparkles,
  Eye,
  Send,
  ChevronDown,
  ChevronUp,
  Settings,
} from "lucide-react";
import { usePromptStore } from "../../store/promptStore";
import ComparisonModal from "./components/ComparisonModal";

// 컴포넌트 외부로 이동하여 재렌더링 시 재생성 방지
const additionalFields = [
  {
    id: "persona",
    label: "페르소나",
    type: "select",
    options: [
      {
        value: "마케터",
        description: "트렌드 분석과 소비자 중심 사고가 강조됩니다.",
      },
      {
        value: "개발자",
        description: "논리적 구조와 문제 해결 능력이 강조됩니다.",
      },
      {
        value: "기획자",
        description: "전략적 사고와 사용자 경험 설계가 강조됩니다.",
      },
      {
        value: "디자이너",
        description: "시각적 표현과 창의적 아이디어가 강조됩니다.",
      },
      { value: "직접 입력", description: "원하는 페르소나를 직접 입력합니다." },
    ],
  },
  {
    id: "task",
    label: "주요 업무",
    type: "select",
    options: [
      {
        value: "콘텐츠 생성",
        description: "블로그 글, SNS 게시물 등 텍스트 콘텐츠를 만듭니다.",
      },
      {
        value: "코드 리뷰",
        description: "작성된 코드의 오류를 찾고 개선점을 제안합니다.",
      },
      {
        value: "아이디어 제안",
        description: "새로운 서비스나 제품에 대한 아이디어를 제시합니다.",
      },
      {
        value: "디자인 시안",
        description: "UI/UX 디자인 또는 그래픽 시안을 생성합니다.",
      },
      {
        value: "보고서 작성",
        description: "특정 주제에 대한 분석 보고서를 작성합니다.",
      },
      { value: "직접 입력", description: "원하는 업무를 직접 입력합니다." },
    ],
  },
  {
    id: "style",
    label: "글쓰기 스타일",
    type: "select",
    options: [
      {
        value: "전문가처럼",
        description: "깊이 있는 지식과 신뢰감을 전달합니다.",
      },
      { value: "친근하게", description: "부드럽고 편안한 어조로 소통합니다." },
      {
        value: "유머러스하게",
        description: "재미있고 위트 있는 표현을 사용합니다.",
      },
      {
        value: "간결하게",
        description: "핵심만 명확하게 전달하여 가독성을 높입니다.",
      },
      {
        value: "감성적으로",
        description: "독자의 감성을 자극하는 표현을 사용합니다.",
      },
      {
        value: "직접 입력",
        description: "원하는 글쓰기 스타일을 직접 입력합니다.",
      },
    ],
  },
  {
    id: "tone",
    label: "어조",
    type: "select",
    options: [
      {
        value: "공식적인",
        description: "격식과 예의를 갖춘 비즈니스 어조입니다.",
      },
      {
        value: "비공식적인",
        description: "편안하고 자유로운 대화체 어조입니다.",
      },
      {
        value: "객관적인",
        description: "사실과 데이터를 기반으로 중립적인 어조입니다.",
      },
      {
        value: "설득적인",
        description: "상대방의 동의를 이끌어내는 논리적인 어조입니다.",
      },
      {
        value: "단호한",
        description: "명확하고 흔들림 없는 의지를 전달하는 어조입니다.",
      },
      { value: "직접 입력", description: "원하는 어조를 직접 입력합니다." },
    ],
  },
  {
    id: "format",
    label: "출력 형식",
    type: "select",
    options: [
      { value: "줄글", description: "일반적인 문단 형식의 텍스트입니다." },
      { value: "개조식", description: "핵심 내용을 요약한 목록 형식입니다." },
      { value: "표", description: "데이터를 행과 열로 정리한 표 형식입니다." },
      {
        value: "코드 블록",
        description: "프로그래밍 코드나 스크립트 형식입니다.",
      },
      { value: "대화형", description: "질문과 답변이 오가는 대화 형식입니다." },
      {
        value: "직접 입력",
        description: "원하는 출력 형식을 직접 입력합니다.",
      },
    ],
  },
];

const PromptLauncher = ({ initialData }) => {
  const location = useLocation();
  
  // Store 사용
  const {
    templates = [],
    currentTemplate,
    setCurrentTemplate,
    selectedOptions = {},
    setSelectedOption,
    isAdvancedMode, // isAdvancedMode 상태 가져오기
    toggleAdvancedMode, // toggleAdvancedMode 액션 가져오기
    extraOptions,
    setExtraOption,
  } = usePromptStore();

  // Local state
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [selectedValues, setSelectedValues] = useState({});
  const [showCustomInput, setShowCustomInput] = useState({});
  const [customInputs, setCustomInputs] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // URL 파라미터에서 검색어 추출 및 추천 템플릿 설정
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const queryParam = urlParams.get('q');
    if (queryParam) {
      setSearchQuery(queryParam);
      // 검색어에 기반한 추천 템플릿 자동 선택
      const recommendedTemplate = findRecommendedTemplate(queryParam);
      if (recommendedTemplate) {
        setCurrentTemplate(recommendedTemplate);
      }
    }
  }, [location.search, setCurrentTemplate]);
  
  // 검색어에 기반한 템플릿 추천 함수
  const findRecommendedTemplate = (query) => {
    const queryLower = query.toLowerCase();
    const keywords = {
      '자기소개서': 'resume_cover_letter',
      '커버레터': 'resume_cover_letter', 
      '이력서': 'resume_cover_letter',
      '프레젠테이션': 'ppt_presentation',
      'ppt': 'ppt_presentation',
      '발표': 'ppt_presentation',
      '이메일': 'email_writing',
      '메일': 'email_writing',
      '보고서': 'report_writing',
      '마케팅': 'marketing_copy'
    };
    
    for (const [keyword, templateId] of Object.entries(keywords)) {
      if (queryLower.includes(keyword)) {
        return templates.find(t => t.id === templateId);
      }
    }
    
    // 기본값으로 첫 번째 템플릿 반환
    return templates[0];
  };
  const [selectedAITool, setSelectedAITool] = useState(null);
  const [isToolModalOpen, setIsToolModalOpen] = useState(false);
  // const [showAdditionalOptions, setShowAdditionalOptions] = useState(false); // 추가 옵션 토글 상태 (이제 isAdvancedMode와 연동)

  const getFieldsForTemplate = useCallback((template) => {
    if (!template) return { basic: [], additional: [] };
    const basic = template.options || [];
    const basicKeys = basic.map((f) => f.key);
    const additional = additionalFields.filter(
      (af) => !basicKeys.includes(af.id)
    );
    return { basic, additional };
  }, []);

  const { basic: basicFields, additional: finalAdditionalFields } =
    getFieldsForTemplate(currentTemplate);

  // 카테고리별 템플릿 그룹화
  const categorizedTemplates = templates.reduce((acc, template) => {
    const category = template.category || "기타";
    if (!acc[category]) acc[category] = [];
    acc[category].push(template);
    return acc;
  }, {});

  // 템플릿 필터링
  const filteredTemplates = templates.filter(
    (t) =>
      (t.name && t.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.description &&
        t.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.category &&
        t.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // 템플릿 선택 핸들러
  const handleTemplateSelect = (template) => {
    console.log("[DEBUG] Template selected:", template);
    setCurrentTemplate(template);
  };

  useEffect(() => {
    console.log(
      "[DEBUG] useEffect triggered. currentTemplate:",
      currentTemplate
    );
    if (currentTemplate) {
      const { basic, additional } = getFieldsForTemplate(currentTemplate);
      const allFields = [...basic, ...additional];

      const defaults = allFields.reduce((acc, f) => {
        const key = f.key || f.id;
        // 옵션이 객체 형태일 경우 value를 기본값으로 설정
        if (f.options && f.options.length > 0) {
          acc[key] =
            f.options[0].value !== undefined
              ? f.options[0].value
              : f.options[0];
        } else {
          acc[key] = "";
        }
        return acc;
      }, {});

      console.log("[DEBUG] Setting default values:", defaults);
      setSelectedValues(defaults);
      Object.entries(defaults).forEach(([key, value]) => {
        // 기본 필드는 selectedOptions에, 추가 필드는 extraOptions에 저장
        const isBasicField = basic.some(f => (f.key || f.id) === key);
        if (isBasicField) {
          setSelectedOption(key, value);
        } else if (isAdvancedMode) {
          setExtraOption(key, value);
        }
      });
    } else {
      console.log("[DEBUG] No currentTemplate, skipping effect.");
    }
  }, [currentTemplate, setSelectedOption, setExtraOption, getFieldsForTemplate, isAdvancedMode]);

  // 필드 값 변경 핸들러
  const handleFieldChange = (fieldId, value) => {
    // '직접 입력' 옵션이 객체 형태일 경우 value 속성으로 비교
    const isDirectInput =
      (typeof value === "object" &&
        value !== null &&
        value.value === "직접 입력") ||
      value === "직접 입력";

    if (isDirectInput) {
      setShowCustomInput((prev) => ({ ...prev, [fieldId]: true }));
      const newValue = customInputs[fieldId] || "";
      setSelectedValues((prev) => ({ ...prev, [fieldId]: newValue }));
      setSelectedOption(fieldId, newValue);
    } else {
      setShowCustomInput((prev) => ({ ...prev, [fieldId]: false }));
      // 옵션이 객체 형태일 경우 value 속성을 저장
      const finalValue =
        typeof value === "object" && value !== null && value.value !== undefined
          ? value.value
          : value;
      setSelectedValues((prev) => ({ ...prev, [fieldId]: finalValue }));
      setSelectedOption(fieldId, finalValue);
    }
  };

  const handleCustomInput = (fieldId, value) => {
    setCustomInputs((prev) => ({ ...prev, [fieldId]: value }));
    setSelectedValues((prev) => ({ ...prev, [fieldId]: value }));
    setSelectedOption(fieldId, value);
  };

  // 추가 옵션 필드 변경 핸들러
  const handleExtraFieldChange = (fieldId, value) => {
    // '직접 입력' 옵션이 객체 형태일 경우 value 속성으로 비교
    const isDirectInput =
      (typeof value === "object" &&
        value !== null &&
        value.value === "직접 입력") ||
      value === "직접 입력";

    if (isDirectInput) {
      setShowCustomInput((prev) => ({ ...prev, [fieldId]: true }));
      const newValue = customInputs[fieldId] || "";
      setSelectedValues((prev) => ({ ...prev, [fieldId]: newValue }));
      setExtraOption(fieldId, newValue);
    } else {
      setShowCustomInput((prev) => ({ ...prev, [fieldId]: false }));
      // 옵션이 객체 형태일 경우 value 속성을 저장
      const finalValue =
        typeof value === "object" && value !== null && value.value !== undefined
          ? value.value
          : value;
      setSelectedValues((prev) => ({ ...prev, [fieldId]: finalValue }));
      setExtraOption(fieldId, finalValue);
    }
  };

  // 추가 옵션 커스텀 입력 핸들러
  const handleExtraCustomInput = (fieldId, value) => {
    setCustomInputs((prev) => ({ ...prev, [fieldId]: value }));
    setSelectedValues((prev) => ({ ...prev, [fieldId]: value }));
    setExtraOption(fieldId, value);
  };

  // AI 도구 추천 데이터
  const aiToolsDatabase = {
    취업: [
      {
        name: "ChatGPT",
        logo: "/images/ai-logos/chatgpt.png",
        description: "자기소개서 작성에 최적",
        url: "https://chat.openai.com",
        pros: ["다양한 형식 지원", "자연스러운 문체", "빠른 응답"],
        cons: ["가끔 판업적인 표현", "한국어 뉴앙스 부족"],
        usage: '프롬프트를 붙여넣고 "더 자연스럽게 수정해주세요" 추가 요청',
      },
    ],
  };

  // 카테고리별 AI 도구 추천
  const getRecommendedTools = (category) => {
    return aiToolsDatabase[category] || aiToolsDatabase["취업"];
  };

  // 프롬프트 복사
  const copyToClipboard = () => {
    const promptText = generatePromptText();
    navigator.clipboard.writeText(promptText);
    alert("프롬프드가 클립보드에 복사되었습니다!");
  };

  const openAITool = (tool) => {
    setSelectedAITool(tool);
    setIsToolModalOpen(true);
  };

  // 프롬프트 텍스트 생성
  const generatePromptText = () => {
    if (!currentTemplate) return "";

    console.log(
      "[DEBUG] Generating prompt for template ID: ",
      currentTemplate.id
    );

    const options = { ...selectedValues };

    let basePrompt = "";

    switch (currentTemplate.id) {
      case "resume_cover_letter":
        console.log("[DEBUG] Matched template: resume_cover_letter");
        basePrompt = `당신은 전문 취업 컨설턴트입니다. 다음 조건에 맞는 ${ 
          options.position || "[지원 직무]"
        } 자기소개서를 작성해주세요.

**기본 정보:**
- 지원 직무: ${options.position || "미지정"}
- 회사명: ${options.company || "[회사명]"}
- 경력 수준: ${options.experience || "[경력 수준]"}
- 작성 톤: ${options.tone || "정중하고 격식있게"}
- 분량: ${options.length || "보통 (500자 내외)"}

**작성 요구사항:**
1. 지원 동기를 구체적이고 진정성 있게 표현해주세요.
2. 관련 경험이나 역량을 구체적 사례와 함께 제시해주세요.
3. 회사와의 적합성을 강조해주세요.
4. 입사 후 기여할 수 있는 가치를 명시해주세요.
5. 선택한 톤에 맞게 자연스럽게 작성해주세요.

**추가 지침:**
- 일반적이거나 진부한 표현은 피하고 구체적으로 작성해주세요.
- 지원자의 개성과 전문성이 드러나도록 작성해주세요.
- 읽는 사람이 매력을 느낄 수 있도록 작성해주세요.`;
        break;
      case "blog_article":
        console.log("[DEBUG] Matched template: blog_article");
        basePrompt = `당신은 전문 콘텐츠 작가입니다. 다음 조건에 맞는 블로그 글을 작성해주세요.

**글 정보:**
- 주제: ${options.topic || "[주제]"}
- 대상 독자: ${options.target_audience || "[대상 독자]"}
- 글 스타일: ${options.style || "정보 전달형"}
- 글 길이: ${options.length || "보통 (1000-1500자)"}

**작성 요구사항:**
1. 매력적인 제목과 도입부로 독자의 관심을 끌어주세요.
2. 논리적이고 체계적인 구성으로 내용을 전개해주세요.
3. 대상 독자의 수준에 맞는 설명과 예시를 활용해주세요.
4. 읽기 쉽고 이해하기 쉬운 문체를 사용해주세요.
5. 마무리에서 핵심 내용을 정리하고 행동을 유도해주세요.`;
        break;
      case "ppt_presentation":
        console.log("[DEBUG] Matched template: ppt_presentation");
        basePrompt = `당신은 프레젠테이션 전문가입니다. 다음 조건에 맞는 PPT 구성안과 내용을 작성해주세요.

**발표 정보:**
- 발표 주제: ${options.topic || "[발표 주제]"}
- 슬라이드 수: ${options.slide_count || "10-15장"}
- 발표 대상: ${options.audience || "[발표 대상]"}
- 발표 목적: ${options.purpose || "정보 공유"}

**작성 요구사항:**
1. 명확한 스토리라인과 논리적 흐름을 구성해주세요.
2. 각 슬라이드의 제목과 핵심 내용을 정리해주세요.
3. 발표 대상의 관심과 수준에 맞는 내용을 구성해주세요.
4. 시각적 요소 활용을 제안해주세요. (그래프, 이미지, 도표 등)
5. 강력한 오프닝과 임팩트 있는 마무리를 만들어주세요.`;
        break;
      case "social_media":
        console.log("[DEBUG] Matched template: social_media");
        basePrompt = `당신은 소셜미디어 마케팅 전문가입니다. 다음 조건에 맞는 SNS 포스팅을 작성해주세요.

**포스팅 정보:**
- 플랫폼: ${options.platform || "[플랫폼]"}
- 콘텐츠 유형: ${options.content_type || "[콘텐츠 유형]"}
- 톤앤매너: ${options.tone || "친근하고 캐주얼"}

**작성 요구사항:**
1. 플랫폼 특성에 맞는 최적화된 형태로 작성해주세요.
2. 첫 문장에서 즉시 관심을 끌 수 있는 훅을 활용해주세요.
3. 선택한 톤앤매너에 맞는 자연스러운 문체를 사용해주세요.
4. 적절한 해시태그를 제안해주세요. (플랫폼별 최적 개수)
5. 댓글이나 참여를 유도하는 CTA를 포함해주세요.`;
        break;
      case "email_writing":
        console.log("[DEBUG] Matched template: email_writing");
        basePrompt = `당신은 비즈니스 커뮤니케이션 전문가입니다. 다음 조건에 맞는 이메일을 작성해주세요.

**이메일 정보:**
- 이메일 유형: ${options.email_type || "[이메일 유형]"}
- 수신자: ${options.recipient || "[수신자]"}
- 긴급도: ${options.urgency || "일반"}

**작성 요구사항:**
1. 명확하고 구체적인 제목을 작성해주세요.
2. 정중하면서도 효율적인 인사말을 사용해주세요.
3. 목적과 요청사항을 명확히 제시해주세요.
4. 수신자 입장을 고려한 배려 있는 표현을 사용해주세요.
5. 명확한 액션 아이템과 마감일을 제시해주세요.`;
        break;
      default:
        console.log(
          "[DEBUG] No template match found for ID: ",
          currentTemplate.id,
          ". Using default prompt."
        );
        basePrompt = "요청하신 내용에 맞는 텍스트를 작성해주세요.";
    }

    // 고급 모드일 때만 추가 옵션 포함
    if (isAdvancedMode && extraOptions) {
      const additionalPromptParts = finalAdditionalFields
        .map((field) => {
          const value = extraOptions[field.id];
          if (value && value !== "직접 입력") {
            return `${field.label}: ${value}`;
          }
          return null;
        })
        .filter(Boolean);

      if (additionalPromptParts.length > 0) {
        return `${basePrompt}` +
          `

**추가 옵션:**
- ${additionalPromptParts.join("\n- ")}`;
      }
    }

    return basePrompt;
  };

  console.log("[DEBUG] Rendering component. currentTemplate:", currentTemplate);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-full mb-4">
            <Sparkles className="w-4 h-4" />
            <span className="font-medium text-sm">AI 프롬프트 생성기</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            더 나은 결과를 위한 프롬프트 제작소
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            원하는 결과를 명확히 하고, 선택만 하면 최적화된 프롬프트가
            완성됩니다.
          </p>
        </div>

        {/* 진행 단계 */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4 bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center space-x-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${ 
                  !currentTemplate
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                1
              </div>
              <span className="font-medium text-gray-700">템플릿 선택</span>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300" />
            <div className="flex items-center space-x-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${ 
                  currentTemplate
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                2
              </div>
              <span className="font-medium text-gray-700">옵션 설정</span>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300" />
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-semibold text-sm">
                3
              </div>
              <span className="font-medium text-gray-700">프롬프트 생성</span>
            </div>
          </div>
        </div>

        {/* 메인 콘텐츠 - 반응형 레이아웃 */}
        {/* 모바일: 상단 템플릿 설정 + 하단 결과, 데스크톱: 기존 레이아웃 */}
        
        {/* 모바일 상단 템플릿 설정 패널 */}
        <div className="md:hidden mb-6">
          <div className="sticky top-[100px] z-40 bg-gray-50 pb-4">
            <div className="bg-white rounded-xl shadow-sm border p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">템플릿 & 설정</h3>
                <button
                  onClick={toggleAdvancedMode}
                  className="px-3 py-1 text-xs bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  {isAdvancedMode ? "간단" : "고급"}
                </button>
              </div>

              {/* 템플릿 선택 */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="text-sm font-medium">템플릿</h4>
                  <span className="text-xs text-gray-500">
                    ({filteredTemplates.length}개)
                  </span>
                </div>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-3 py-2 w-full text-sm h-9"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  {filteredTemplates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateSelect(template)}
                      className={`p-2 rounded-lg border text-left transition-all ${ 
                        currentTemplate?.id === template.id
                          ? "border-blue-500 bg-blue-50 text-blue-900"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{template.icon || "📝"}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium truncate">
                            {template.name}
                          </div>
                        </div>
                        {currentTemplate?.id === template.id && (
                          <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 옵션 설정 */}
              {currentTemplate && (
                <div className="border-t pt-3">
                  <h4 className="text-sm font-medium mb-3">옵션 설정</h4>
                  <div className="space-y-3">
                    {/* 기본 정보 섹션 */}
                    {basicFields.length > 0 && (
                      <div className="space-y-2">
                        {basicFields.map((option) => (
                          <div key={option.key} className="space-y-1">
                            <label className="block text-xs font-medium text-gray-700">
                              {option.label}
                              {option.required && (
                                <span className="text-red-500 ml-1">*</span>
                              )}
                            </label>
                            <div>
                              {option.type === "text" ? (
                                <Input
                                  type="text"
                                  placeholder={option.placeholder || "입력하세요"}
                                  value={selectedValues[option.key] || ""}
                                  onChange={(e) =>
                                    handleFieldChange(option.key, e.target.value)
                                  }
                                  className="w-full text-sm h-8"
                                />
                              ) : option.type === "select" ? (
                                <>
                                  <select
                                    value={
                                      showCustomInput[option.key]
                                        ? "직접 입력"
                                        : selectedValues[option.key] || ""
                                    }
                                    onChange={(e) =>
                                      handleFieldChange(option.key, e.target.value)
                                    }
                                    className="w-full px-2 py-1 text-xs border rounded bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                  >
                                    {option.options?.map((opt) => (
                                      <option key={opt} value={opt}>
                                        {opt}
                                      </option>
                                    ))}
                                  </select>
                                  {showCustomInput[option.key] && (
                                    <Input
                                      type="text"
                                      placeholder="직접 입력하세요"
                                      value={customInputs[option.key] || ""}
                                      onChange={(e) =>
                                        handleCustomInput(option.key, e.target.value)
                                      }
                                      className="mt-2 h-8 text-sm"
                                    />
                                  )}
                                </>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 추가 옵션 섹션 */}
                    {isAdvancedMode && finalAdditionalFields.length > 0 && (
                      <div className="border-t pt-3">
                        <h5 className="text-xs font-semibold text-gray-600 mb-2">
                          추가 옵션
                        </h5>
                        <div className="space-y-2">
                          {finalAdditionalFields.map((field) => (
                            <div key={field.id} className="space-y-1">
                              <label className="block text-xs font-medium text-gray-700">
                                {field.label}
                              </label>
                              <div>
                                <select
                                  value={
                                    showCustomInput[field.id]
                                      ? "직접 입력"
                                      : (extraOptions?.[field.id] || "")
                                  }
                                  onChange={(e) =>
                                    handleExtraFieldChange(field.id, e.target.value)
                                  }
                                  className="w-full px-2 py-1 text-xs border rounded bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                >
                                  {field.options.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                      {opt.value}
                                    </option>
                                  ))}
                                </select>
                                {showCustomInput[field.id] && (
                                  <Input
                                    type="text"
                                    placeholder="직접 입력하세요"
                                    value={customInputs[field.id] || ""}
                                    onChange={(e) =>
                                      handleExtraCustomInput(field.id, e.target.value)
                                    }
                                    className="mt-2 h-8 text-sm"
                                  />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 모바일 프롬프트 결과 */}
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <h3 className="text-lg font-semibold mb-4">생성된 프롬프트</h3>
            <div className="bg-gray-50 rounded-lg p-4 min-h-[300px] max-h-[400px] overflow-y-auto mb-4">
              {currentTemplate ? (
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
                  {generatePromptText()}
                </pre>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <Sparkles className="w-12 h-12 mx-auto mb-3" />
                    <p>프롬프트가 여기에 표시됩니다</p>
                  </div>
                </div>
              )}
            </div>

            {/* 모바일 AI 도구 추천 & 액션 버튼 */}
            {currentTemplate && (
              <div className="space-y-3">
                {/* AI 도구 추천 */}
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">
                    🎯 추천 AI 도구
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {getRecommendedTools(currentTemplate.category).map(
                      (tool, index) => (
                        <button
                          key={index}
                          onClick={() => openAITool(tool)}
                          className="bg-white rounded p-2 text-left hover:bg-blue-100 transition-colors border"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{tool.icon}</span>
                            <span className="text-xs font-medium">
                              {tool.name}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {tool.description}
                          </div>
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* 액션 버튼 */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsModalOpen(true)}
                    className="w-full"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    상세 비교
                  </Button>
                  <Button
                    onClick={copyToClipboard}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    복사하기
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 데스크톱 레이아웃 */}
        <div className="hidden md:grid grid-cols-4 gap-6">
          {/* 왼쪽: 템플릿 선택 (1/4 너비) */}
          <div className="col-span-1">
            <div className="bg-white rounded-xl shadow-sm border p-6 h-full">
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-3">템플릿 선택</h3>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-3 py-2 w-full text-sm"
                  />
                </div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-1.5 rounded text-xs ${ 
                        viewMode === "grid"
                          ? "bg-blue-100 text-blue-600"
                          : "text-gray-400"
                      }`}
                    >
                      <Grid3X3 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-1.5 rounded text-xs ${ 
                        viewMode === "list"
                          ? "bg-blue-100 text-blue-600"
                          : "text-gray-400"
                      }`}
                    >
                      <List className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="text-xs text-gray-500">
                    {filteredTemplates.length}개
                  </span>
                </div>
              </div>

              {/* 템플릿 목록 - 더 큰 높이 */}
              <div className="h-96 overflow-y-auto border rounded-lg p-3 bg-gray-50">
                {viewMode === "grid" ? (
                  <div className="grid grid-cols-1 gap-2">
                    {filteredTemplates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => handleTemplateSelect(template)}
                        className={`p-3 rounded-lg border-2 transition-all text-center ${ 
                          currentTemplate?.id === template.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                      >
                        <div className="text-xl mb-1">
                          {template.icon || "📝"}
                        </div>
                        <div className="text-xs font-medium text-gray-900">
                          {template.name}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 truncate">
                          {template.description}
                        </div>
                        {currentTemplate?.id === template.id && (
                          <Check className="w-3 h-3 text-blue-600 mx-auto mt-1" />
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(categorizedTemplates).map(
                      ([category, categoryTemplates]) => (
                        <div key={category}>
                          <h4 className="text-xs font-semibold text-gray-600 mb-2">
                            {category}
                          </h4>
                          <div className="space-y-1">
                            {categoryTemplates
                              .filter((t) => filteredTemplates.includes(t))
                              .map((template) => (
                                <button
                                  key={template.id}
                                  onClick={() => handleTemplateSelect(template)}
                                  className={`w-full flex items-center gap-2 p-2 rounded border text-left ${ 
                                    currentTemplate?.id === template.id
                                      ? "border-blue-500 bg-blue-50"
                                      : "border-gray-200 bg-white hover:bg-gray-50"
                                  }`}
                                >
                                  <span className="text-sm">
                                    {template.icon || "📝"}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-xs font-medium truncate">
                                      {template.name}
                                    </div>
                                    <div className="text-xs text-gray-500 truncate">
                                      {template.description}
                                    </div>
                                  </div>
                                  {currentTemplate?.id === template.id && (
                                    <Check className="w-3 h-3 text-blue-600" />
                                  )}
                                </button>
                              ))}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 오른쪽: 옵션 설정 & 프롬프트 (3/4 너비) */}
          <div className="col-span-3">
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="grid grid-cols-3 gap-6 p-6 h-full">
                {/* 왼쪽: 옵션 설정 (1/3) */}
                <div className="col-span-1 flex flex-col">
                  <h3 className="text-lg font-semibold mb-4">옵션 설정</h3>
                  <button
                    onClick={toggleAdvancedMode}
                    className="mb-4 px-4 py-2 rounded-md text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                  >
                    {isAdvancedMode ? "간단 모드로 전환" : "고급 모드로 전환"}
                  </button>
                  <div className="flex-1">
                    {currentTemplate ? (
                      <div className="space-y-4">
                        {/* 기본 정보 섹션 */}
                        {basicFields.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-800 mb-3">
                              기본 정보
                            </h4>
                            <div className="space-y-3">
                              {basicFields.map((option) => (
                                <div key={option.key} className="space-y-1">
                                  <label className="block text-xs font-medium text-gray-700">
                                    {option.label}
                                    {option.required && (
                                      <span className="text-red-500 ml-1">
                                        *
                                      </span>
                                    )}
                                  </label>
                                  <div>
                                    {option.type === "text" ? (
                                      <Input
                                        type="text"
                                        placeholder={
                                          option.placeholder || "입력하세요"
                                        }
                                        value={selectedValues[option.key] || ""}
                                        onChange={(e) =>
                                          handleFieldChange(
                                            option.key,
                                            e.target.value
                                          )
                                        }
                                        className="w-full text-sm h-8"
                                      />
                                    ) : option.type === "select" ? (
                                      <>
                                        <select
                                          value={
                                            showCustomInput[option.key]
                                              ? "직접 입력"
                                              : selectedValues[option.key] || ""
                                          }
                                          onChange={(e) =>
                                            handleFieldChange(
                                              option.key,
                                              e.target.value
                                            )
                                          }
                                          className="w-full px-2 py-1 text-xs border rounded bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                          {option.options?.map((opt) => (
                                            <option key={opt} value={opt}>
                                              {opt}
                                            </option>
                                          ))}
                                        </select>
                                        {showCustomInput[option.key] && (
                                          <Input
                                            type="text"
                                            placeholder="직접 입력하세요"
                                            value={
                                              customInputs[option.key] || ""
                                            }
                                            onChange={(e) =>
                                              handleCustomInput(
                                                option.key,
                                                e.target.value
                                              )
                                            }
                                            className="mt-2 h-8 text-sm"
                                          />
                                        )}
                                      </>
                                    ) : null}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 추가 옵션 섹션 */}
                        {isAdvancedMode && finalAdditionalFields.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-800 mb-3 pt-4 border-t">
                              추가 옵션
                            </h4>
                            <div className="space-y-3">
                              {finalAdditionalFields.map((field) => (
                                <div key={field.id} className="space-y-1">
                                  <label className="block text-xs font-medium text-gray-700">
                                    {field.label}
                                  </label>
                                  <div>
                                    <select
                                      value={
                                        showCustomInput[field.id]
                                          ? "직접 입력"
                                          : (extraOptions?.[field.id] || "")
                                      }
                                      onChange={(e) =>
                                        handleExtraFieldChange(
                                          field.id,
                                          e.target.value
                                        )
                                      }
                                      className="w-full px-2 py-1 text-xs border rounded bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                      {field.options.map((opt) => (
                                        <option
                                          key={opt.value}
                                          value={opt.value}
                                        >
                                          {opt.value}
                                        </option>
                                      ))}
                                    </select>
                                    {showCustomInput[field.id] && (
                                      <Input
                                        type="text"
                                        placeholder="직접 입력하세요"
                                        value={customInputs[field.id] || ""}
                                        onChange={(e) =>
                                          handleExtraCustomInput(
                                            field.id,
                                            e.target.value
                                          )
                                        }
                                        className="mt-2 h-8 text-sm"
                                      />
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-gray-400">
                        <div className="text-center">
                          <Target className="w-8 h-8 mx-auto mb-2" />
                          <p className="text-xs">템플릿을 선택해주세요</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 오른쪽: 프롬프트 미리보기 (2/3) */}
                <div className="col-span-2 flex flex-col">
                  <h3 className="text-lg font-semibold mb-4">
                    생성된 프롬프트
                  </h3>
                  <div className="flex-1 bg-gray-50 rounded-lg p-4 min-h-[500px] max-h-[600px] overflow-y-auto">
                    {currentTemplate ? (
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
                        {generatePromptText()}
                      </pre>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-400">
                        <div className="text-center">
                          <Sparkles className="w-12 h-12 mx-auto mb-3" />
                          <p>프롬프트가 여기에 표시됩니다</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* AI 도구 추천 & 액션 버튼 */}
                  {currentTemplate && (
                    <div className="mt-4 space-y-3">
                      {/* AI 도구 추천 */}
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                        <h4 className="text-sm font-medium text-blue-900 mb-2">
                          🎯 추천 AI 도구
                        </h4>
                        <div className="grid grid-cols-3 gap-2">
                          {getRecommendedTools(currentTemplate.category).map(
                            (tool, index) => (
                              <button
                                key={index}
                                onClick={() => openAITool(tool)}
                                className="bg-white rounded p-2 text-left hover:bg-blue-100 transition-colors border"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">{tool.icon}</span>
                                  <span className="text-xs font-medium">
                                    {tool.name}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {tool.description}
                                </div>
                              </button>
                            )
                          )}
                        </div>
                      </div>

                      {/* 액션 버튼 */}
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          onClick={() => setIsModalOpen(true)}
                          className="flex-1"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          상세 비교
                        </Button>
                        <Button
                          onClick={copyToClipboard}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          복사하기
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 도움말 */}
        <div className="mt-8 bg-blue-50 rounded-xl p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            💡 더 좋은 결과를 얻는 팁
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm text-blue-800">
            <div>✓ 구체적인 선택: 상세한 옵션을 선택할수록 정확한 결과</div>
            <div>✓ 목적 명확화: 작업 목적을 명확히 하면 더 좋은 결과</div>
            <div>✓ 예시 활용: 고급 모드에서 예시를 추가하면 더 정확</div>
            <div>✓ 반복 개선: 결과를 보고 옵션을 조정해보세요</div>
          </div>
        </div>
      </div>

      {/* AI 도구 상세 모달 */}
      {selectedAITool && (
        <div
          className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${ 
            isToolModalOpen ? "block" : "hidden"
          }`}
        >
          <div class="bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div class="p-6">
              {/* 모달 헤더 */}
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-3">
                  <span class="text-2xl">{selectedAITool.icon}</span>
                  <h3 class="text-xl font-bold">{selectedAITool.name}</h3>
                </div>
                <button
                  onClick={() => setIsToolModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* 도구 설명 */}
              <p className="text-gray-600 mb-4">{selectedAITool.description}</p>

              {/* 사용법 */}
              <div class="mb-4">
                <h4 className="font-semibold text-gray-800 mb-2">📝 사용법</h4>
                <div class="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">
                    {selectedAITool.usage}
                  </p>
                </div>
              </div>

              {/* 장단점 */}
              <div class="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="font-semibold text-green-700 mb-2">✅ 장점</h4>
                  <ul className="text-sm space-y-1">
                    {selectedAITool.pros.map((pro, index) => (
                      <li key={index} className="text-green-600">
                        • {pro}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-red-700 mb-2">⚠️ 단점</h4>
                  <ul className="text-sm space-y-1">
                    {selectedAITool.cons.map((con, index) => (
                      <li key={index} className="text-red-600">
                        • {con}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* 액션 버튼 */}
              <div class="flex gap-3">
                <Button
                  onClick={() => {
                    copyToClipboard();
                    window.open(selectedAITool.url, "_blank");
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  프롬프트 복사 후 {selectedAITool.name} 열기
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.open(selectedAITool.url, "_blank")}
                  className="flex-1"
                >
                  {selectedAITool.name}만 열기
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 비교 모달 */}
      <ComparisonModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} />
    </div>
  );
};

export default PromptLauncher;
