// src/components/prompt/PromptPanel.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Copy, Send, Settings, Eye, Edit, LayoutGrid } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Checkbox } from "../ui/checkbox";
import { Switch } from "../ui/switch";
import { usePromptStore } from "../../store/promptStore";
import InlineSelect from "../common/InlineSelect";

const HIDE_INFO_SECTIONS = [
  "기본 정보",
  "글 정보",
  "발표 정보",
  "설정",
  "조건",
];

const PERSONA_OPTIONS = {
  resume_cover_letter: [
    "전문 취업 컨설턴트",
    "HR 전문가",
    "이력서 코치",
    "채용 담당자",
  ],
  blog_article: ["전문 콘텐츠 작가", "기술 문서 작성가", "에디터"],
  ppt_presentation: ["프레젠테이션 컨설턴트", "비즈니스 애널리스트"],
  social_media: ["소셜 마케터", "크리에이티브 카피라이터"],
  email_writing: ["비즈니스 커뮤니케이션 전문가", "CS 매니저"],
};

const ADVANCED_BY_TEMPLATE = {
  resume_cover_letter: [
    "핵심 성과를 수치로 2개 이상 포함",
    "경험 단락은 STAR 형식으로 구성",
    "회사/산업 리서치 1개 연결",
    "입사 후 90일 계획 제시",
  ],
  blog_article: [
    "도입부에 Hook 한 문장",
    "소제목에 핵심 키워드 포함",
    "예시·수치 또는 표 1개 이상",
    "FAQ 2개(Q/A) 추가",
  ],
  ppt_presentation: [
    "슬라이드당 포인트 3~5개 유지",
    "데모 슬라이드에 시각 자료 제안",
    "지표와 타임라인 명시",
    "마지막 슬라이드에 명확한 CTA",
  ],
  social_media: [
    "첫 문장 Hook 1개(의문/수치/공감)",
    "해시태그 코어3+롱테일7 구성",
    "이모지는 문장당 0~2개 제한",
    "CTA 1문장 포함",
  ],
  email_writing: [
    "Subject에 [요청/확인/공유] 접두사",
    "기한·담당·다음 단계 명확히",
    "불필요 수식어 제거, 능동태",
    "문장 길이 15~20자 유지",
  ],
};

export default function PromptPanel({ onBack }) {
  const {
    currentTemplate,
    selectedOptions,
    extraOptions,
    isAdvancedMode,
    setSelectedOption,
    setExtraOption,
    toggleAdvancedMode,
    getValueOrDefault,
    initializeWithDefaults,
    generatePrompt,
    generatedPrompt,
  } = usePromptStore();

  const [mode, setMode] = useState("preview");
  const [editedPrompt, setEditedPrompt] = useState("");
  const [selectedQuestions, setSelectedQuestions] = useState([]);

  useEffect(() => {
    if (currentTemplate) initializeWithDefaults(currentTemplate);
  }, [currentTemplate, initializeWithDefaults]);

  useEffect(() => {
    if (currentTemplate) generatePrompt();
  }, [
    currentTemplate,
    selectedOptions,
    extraOptions,
    isAdvancedMode,
    generatePrompt,
  ]);

  const extraRequests =
    selectedQuestions.length > 0
      ? "\n\n## 추가 요청사항\n" +
        selectedQuestions.map((q) => `- ${q}`).join("\n")
      : "";

  useEffect(() => {
    if (mode === "edit")
      setEditedPrompt((generatedPrompt || "") + extraRequests);
  }, [generatedPrompt, extraRequests, mode]);

  const prunedGenerated = useMemo(() => {
    if (!generatedPrompt) return "";
    let out = generatedPrompt;
    for (const h of HIDE_INFO_SECTIONS) {
      const re = new RegExp(`\\n## ${h}[\\s\\S]*?(?=\\n## |\\n# |$)`, "g");
      out = out.replace(re, "");
    }
    return out.trim();
  }, [generatedPrompt]);

  const handleCopy = () => {
    const txt =
      mode === "edit"
        ? editedPrompt
        : (prunedGenerated || generatedPrompt || "") + extraRequests;
    navigator.clipboard.writeText(txt);
  };
  const handleSend = () => {
    const txt =
      mode === "edit"
        ? editedPrompt
        : (prunedGenerated || generatedPrompt || "") + extraRequests;
    console.debug("send:", txt);
  };
  const handleQuestionToggle = (q, ck) =>
    setSelectedQuestions((prev) =>
      ck ? [...prev, q] : prev.filter((x) => x !== q)
    );

  const InlineBuilder = () => {
    const roleOpts = PERSONA_OPTIONS[currentTemplate.id] || ["전문가"];
    const role = getValueOrDefault("role") || roleOpts[0];

    const S = (k) => (
      <InlineSelect
        value={getValueOrDefault(k)}
        options={
          currentTemplate.options.find((o) => o.key === k)?.options || []
        }
        onChange={(v) => setSelectedOption(k, v)}
      />
    );

    const T = (k, ph) => (
      <input
        type="text"
        className="underline underline-offset-4 px-1 py-0.5 border-b focus:outline-none"
        placeholder={ph}
        value={getValueOrDefault(k)}
        onChange={(e) => setSelectedOption(k, e.target.value)}
      />
    );

    // 값별 우측 요약 설명
    const DESCR = {
      // 공통(자소서)
      position: {
        "소프트웨어 엔지니어": "백엔드/프론트·협업 중심",
        "프로덕트 매니저": "문제정의/우선순위/실행",
        "UI/UX 디자이너": "리서치·와이어프레임·테스트",
        "데이터 분석가": "지표·실험·인사이트",
        "마케팅 전문가": "퍼널/카피/성과지표",
        "영업 관리자": "파이프라인·성과·리더십",
      },
      experience: {
        신입: "프로젝트·학습 중심",
        "1~3년차": "기여·성장 강조",
        "3~5년차": "핵심 성과 제시",
        "5~10년차": "임팩트·리더십",
        "10년차 이상": "조직 성과·전략",
        시니어급: "조직/프로덕트 리딩",
      },
      tone: {
        "정중하고 격식있게": "보수적·문장 길이 안정",
        "전문적이고 간결하게": "불필요 수식 제거",
        "친근하고 자연스럽게": "대화체·완곡",
        "유머러스하고 재치있게": "가벼운 위트 허용",
        "감성적이고 따뜻하게": "스토리·동기",
        "단호하고 설득력있게": "논리·근거 중심",
      },
      length: {
        "마이크로카피 (50자 이하)": "CTA/헤드라인",
        "짧게 (200-400자)": "요점 정리",
        "보통 (500-800자)": "표준 분량",
        "길게 (1000-1500자)": "사례 상세",
        "아주 길게 (2000자 이상)": "리포트형",
      },

      // 블로그
      target_audience: {
        초급자: "용어 설명·예시 많음",
        중급자: "실무 팁·모범사례",
        전문가: "심화·레퍼런스",
        일반인: "비유·스토리텔링",
      },
      style: {
        "정보 전달형": "개요→핵심→요약",
        튜토리얼형: "단계별 절차·코드",
        "비교 분석형": "표·장단점",
        "케이스 스터디": "배경·과정·성과",
        오피니언: "주장·근거",
      },

      // PPT
      subject: {
        "제품 소개": "데모·가치 제안",
        "비즈니스 제안": "문제→해결·ROI",
        "기술 발표": "원리·벤치마크",
        "교육 워크숍": "목표·실습",
        "연구 발표": "방법·결과·의의",
        "마케팅 전략": "시장/경쟁/전략",
        "데이터 분석": "인사이트·권고",
      },
      slideCount: {
        "5장 내외": "핵심 위주",
        "10장 내외": "표준 구성",
        "15장 내외": "근거 풍부",
        "20장 내외": "리뷰/보고",
        "30장 내외": "심층 분석",
      },
      toneStyle: {
        "모던·심플": "여백·짧은 문장",
        "미니멀·클린": "아이콘/단색",
        "밝고 경쾌함": "활기·헤드라인",
        "견고·신뢰": "보수적 타이포",
        "창의적·실험적": "독창 레이아웃",
        "격식·포멀": "컨설팅 룩",
      },
      tool: {
        PowerPoint: "사내 템플릿 호환",
        "Google Slides": "실시간 협업",
        Keynote: "애플 환경 최적",
        Canva: "템플릿 다양",
        Figma: "디자인 협업",
        Prezi: "줌 내러티브",
        SlideShare: "공개 공유",
      },
      contentStructure: {
        "Agenda→Why→How→Demo→Q&A": "데모 포함 표준",
        "문제→해결→결과→행동": "의사결정 유도",
        "현황→분석→전략→실행": "전략 보고",
        "도입→전개→결론": "강연형",
        "서론→본론→결론": "학술형",
        기승전결: "스토리텔링",
        "자유 형식": "상황 맞춤",
      },

      // SNS
      platform: {
        인스타그램: "이미지·해시태그",
        페이스북: "링크·커뮤니티",
        "X (트위터)": "짧은 문장·스레드",
        블로그: "장문·SEO",
        링크드인: "B2B·전문성",
        "유튜브 스크립트": "후킹·타임코드",
        틱톡: "짧은 훅·트렌드",
      },
      content_type: {
        "제품/서비스 소개": "특징→이점→CTA",
        "정보/팁 공유": "리스트·핵심팁",
        "브랜드 스토리": "미션/가치",
        "이벤트/프로모션": "기간·혜택",
        "고객 후기/사례": "증거·인용",
        "Q&A": "질문→답",
      },

      // 이메일
      email_type: {
        요청: "기한/담당/다음 단계",
        공지: "핵심 요점·링크",
        사과: "원인·재발방지",
        제안: "가치·다음 액션",
        안내: "절차·문의창구",
      },
      recipient: {
        상사: "배경·옵션·제안",
        동료: "맥락·담당·협업",
        부하직원: "명확 지시·기한",
        고객: "공손·이득·CTA",
        "외부 파트너": "합의·타임라인",
        "잠재 고객": "가치 제안",
        "교수/선생님": "정중·요점정리",
      },
      urgency: {
        긴급: "제목에 [긴급]",
        중요: "우선순위·기한",
        보통: "표준 응답",
        참고용: "FYI·No action",
        "답변 불필요": "NOREPLY",
      },
    };

    const getDesc = (k) => DESCR[k]?.[getValueOrDefault(k)] || "";

    const RowSel = ({ k, label }) => (
      <div className="flex items-center gap-2 text-sm py-0.5">
        <span className="w-32 shrink-0 text-gray-600">{label}</span>
        <div className="flex-1">
          <InlineSelect
            value={getValueOrDefault(k)}
            options={
              currentTemplate.options.find((o) => o.key === k)?.options || []
            }
            onChange={(v) => setSelectedOption(k, v)}
          />
        </div>
        <span className="ml-2 w-56 text-xs text-gray-500 truncate">
          {getDesc(k)}
        </span>
      </div>
    );

    const RowInput = ({ k, label, ph, desc }) => (
      <div className="flex items-center gap-2 text-sm py-0.5">
        <span className="w-32 shrink-0 text-gray-600">{label}</span>
        <div className="flex-1">
          <input
            type="text"
            className="underline underline-offset-4 px-1 py-0.5 border-b focus:outline-none w-full"
            placeholder={ph}
            value={getValueOrDefault(k)}
            onChange={(e) => setSelectedOption(k, e.target.value)}
          />
        </div>
        <span className="ml-2 w-56 text-xs text-gray-500 truncate">
          {desc || "선택 사항"}
        </span>
      </div>
    );

    switch (currentTemplate.id) {
      case "resume_cover_letter":
        return (
          <div className="space-y-1">
            <RowSel k="role" label="페르소나" />
            <RowSel k="position" label="지원 직무" />
            <RowInput k="company" label="회사명" ph="회사명" desc="선택 입력" />
            <RowSel k="experience" label="경력 수준" />
            <RowSel k="tone" label="어조" />
            <RowSel k="length" label="분량" />
          </div>
        );

      case "blog_article":
        return (
          <div className="space-y-1">
            <RowSel k="role" label="페르소나" />
            <RowInput
              k="topic"
              label="주제"
              ph="예: 리액트 성능 최적화"
              desc="키워드 1~3개"
            />
            <RowSel k="target_audience" label="대상 독자" />
            <RowSel k="style" label="글 스타일" />
            <RowSel k="length" label="분량" />
          </div>
        );

      case "ppt_presentation":
        return (
          <div className="space-y-1">
            <RowSel k="role" label="페르소나" />
            <RowSel k="subject" label="발표 주제" />
            <RowSel k="slideCount" label="슬라이드 수" />
            <RowSel k="toneStyle" label="톤·스타일" />
            <RowSel k="tool" label="툴" />
            <RowSel k="contentStructure" label="구조" />
          </div>
        );

      case "social_media":
        return (
          <div className="space-y-1">
            <RowSel k="role" label="페르소나" />
            <RowSel k="platform" label="플랫폼" />
            <RowSel k="content_type" label="유형" />
            <RowSel k="tone" label="톤" />
          </div>
        );

      case "email_writing":
        return (
          <div className="space-y-1">
            <RowSel k="role" label="페르소나" />
            <RowSel k="email_type" label="이메일 유형" />
            <RowSel k="recipient" label="수신자" />
            <RowSel k="urgency" label="긴급도" />
          </div>
        );

      default:
        return (
          <div className="text-sm leading-relaxed">
            <InlineSelect
              value={role}
              options={roleOpts}
              onChange={(v) => setSelectedOption("role", v)}
            />{" "}
            관점에서 아래 지시사항에 맞춰 작성해주세요.
          </div>
        );
    }
  };

  if (!currentTemplate) return null;

  return (
    <Card className="p-4 md:p-6 space-y-4 max-w-[960px] xl:max-w-[1100px] mx-auto">
      <CardContent className="p-0 space-y-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{currentTemplate.name}</h3>
          {typeof onBack === "function" && (
            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
              className="gap-1"
            >
              <LayoutGrid className="w-4 h-4" />
              템플릿 보기
            </Button>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMode(mode === "preview" ? "edit" : "preview")}
              className="flex items-center gap-2"
            >
              {mode === "preview" ? (
                <Edit className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
              {mode === "preview" ? "편집" : "미리보기"}
            </Button>

            <div className="flex items-center gap-2">
              <Switch
                id="advanced-mode"
                checked={isAdvancedMode}
                onCheckedChange={toggleAdvancedMode}
                size="sm"
              />
              <label
                htmlFor="advanced-mode"
                className="text-sm text-gray-600 cursor-pointer"
              >
                고급 모드
              </label>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy}>
              <Copy className="w-4 h-4 mr-2" />
              복사
            </Button>
            <Button size="sm" onClick={handleSend}>
              <Send className="w-4 h-4 mr-2" />
              전송
            </Button>
          </div>
        </div>

        <div className="min-h-[420px] border rounded-lg p-4 bg-white space-y-4">
          <InlineBuilder />

          {mode === "edit" ? (
            <Textarea
              value={editedPrompt}
              onChange={(e) => setEditedPrompt(e.target.value)}
              className="w-full min-h-[280px] resize-none border rounded text-sm leading-relaxed"
              placeholder="프롬프트를 자유롭게 편집하세요..."
            />
          ) : (
            <pre className="whitespace-pre-wrap text-sm leading-relaxed">
              {prunedGenerated || generatedPrompt}
              {extraRequests}
            </pre>
          )}
        </div>

        {isAdvancedMode && (
          <div className="space-y-3 border-t pt-4">
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                추가 요청사항(템플릿 맞춤 선택)
              </h4>
              <div className="grid grid-cols-1 gap-2">
                {(ADVANCED_BY_TEMPLATE[currentTemplate?.id] || []).map((q) => (
                  <label
                    key={q}
                    className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-gray-50"
                  >
                    <Checkbox
                      checked={selectedQuestions.includes(q)}
                      onCheckedChange={(ck) =>
                        setSelectedQuestions((prev) =>
                          ck ? [...prev, q] : prev.filter((x) => x !== q)
                        )
                      }
                    />
                    <span className="text-sm text-gray-700">{q}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500 text-center">
          프롬프트는 자동 생성됩니다 • 모든 값은 본문 상단에서 한 줄씩 선택/입력
          • Ctrl+Enter: 전송 • Esc: 미리보기
        </div>
      </CardContent>
    </Card>
  );
}
