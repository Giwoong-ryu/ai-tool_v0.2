// src/store/promptStore.js
import { create } from "zustand";

/* ---------- 자동 기본값 규칙 ---------- */
const DEFAULT_RULES = {
  // 공통
  length: ["보통 (500-800자)", "보통 (1000-1500자)"],
  tone: ["정중하고 격식있게", "전문적이고 간결하게"],
  // 프레젠테이션
  toneStyle: ["모던·심플", "미니멀·클린"],
  slideCount: ["10장 내외", "5장 내외"],
  contentStructure: ["Agenda→Why→How→Demo→Q&A"],
  tool: ["PowerPoint", "Google Slides"],
  // SNS
  platform: ["인스타그램"],
  content_type: ["제품/서비스 소개", "정보/팁 공유"],
  // 이메일
  urgency: ["보통", "중요"],
};
const normalizeOptionList = (opt) => {
  if (!Array.isArray(opt?.options)) return [];
  return opt.options.map((v) => (typeof v === "string" ? v : v?.value ?? ""));
};
const pickByRules = (key, values) => {
  const prefs = DEFAULT_RULES[key];
  if (Array.isArray(prefs)) {
    const hit = prefs.find((p) => values.includes(p));
    if (hit) return hit;
  }
  return values[0] ?? "";
};
/* ------------------------------------ */

const usePromptStore = create((set, get) => ({
  // 상태
  currentTemplate: null,
  selectedOptions: {},
  generatedPrompt: "",
  isAdvancedMode: false,
  extraOptions: {},

  // 기본 추천값 설정
  defaultOptions: {
    role: "전문가",
    company: "",
    level: "중급",
    tone: "정중하고 격식있게",
    length: "보통 (500-800자)",
    position: "소프트웨어 엔지니어",
    experience: "신입",
    selectedQuestions: "",
  },

  // 템플릿 목록
  templates: [
    {
      id: "resume_cover_letter",
      name: "자기소개서 / 커버레터",
      category: "취업",
      description: "입사지원서나 자기소개서 작성을 위한 프롬프트",
      icon: "📝",
      prompt: `{{company}}의 {{role}} 직무에 지원하는 자기소개서를 작성해주세요.

제가 {{level}} 수준의 경험을 가지고 있으며, 다음과 같은 내용을 포함해서 {{tone}} 어조로 {{length}} 분량으로 작성해주세요:

1. 지원 동기 및 회사에 대한 관심
2. 관련 경험 및 성과
3. 보유 역량 및 기술
4. 입사 후 포부 및 기여 방안

기본 요구사항:
- 구체적인 경험과 성과를 포함해주세요
- 해당 직무와 연관성을 강조해주세요
- 차별화된 강점을 부각해주세요{{선택질문}}`,
      options: [
        {
          key: "position",
          label: "지원 직무",
          type: "select",
          options: [
            "소프트웨어 엔지니어",
            "프로덕트 매니저",
            "UI/UX 디자이너",
            "데이터 분석가",
            "마케팅 전문가",
            "영업 관리자",
          ],
          required: true,
        },
        {
          key: "company",
          label: "회사명",
          type: "text",
          placeholder: "지원하는 회사명을 입력하세요",
          required: false,
        },
        {
          key: "experience",
          label: "경력 수준",
          type: "select",
          options: [
            "신입",
            "1~3년차",
            "3~5년차",
            "5~10년차",
            "10년차 이상",
            "시니어급",
          ],
          required: true,
        },
        {
          key: "tone",
          label: "작성 톤",
          type: "select",
          options: [
            "정중하고 격식있게",
            "친근하고 자연스럽게",
            "전문적이고 간결하게",
            "유머러스하고 재치있게",
            "감성적이고 따뜻하게",
            "단호하고 설득력있게",
          ],
          required: true,
        },
        {
          key: "length",
          label: "분량",
          type: "select",
          options: [
            "마이크로카피 (50자 이하)",
            "짧게 (200-400자)",
            "보통 (500-800자)",
            "길게 (1000-1500자)",
            "아주 길게 (2000자 이상)",
          ],
          required: true,
        },
      ],
    },
    {
      id: "blog_article",
      name: "블로그 글 작성",
      category: "콘텐츠",
      description: "블로그나 기술 문서 작성을 위한 프롬프트",
      icon: "📚",
      options: [
        {
          key: "topic",
          label: "주제",
          type: "text",
          placeholder: "작성하고 싶은 주제를 입력하세요",
          required: true,
        },
        {
          key: "target_audience",
          label: "대상 독자",
          type: "select",
          options: [
            "일반인",
            "초보자",
            "중급자",
            "전문가",
            "10대",
            "20-30대",
            "40-50대 이상",
          ],
          required: true,
        },
        {
          key: "style",
          label: "글 스타일",
          type: "select",
          options: [
            "정보 전달형",
            "스토리텔링형",
            "가이드/튜토리얼",
            "의견/리뷰형",
            "사례 중심형",
            "논쟁/토론형",
          ],
          required: true,
        },
        {
          key: "length",
          label: "글 길이",
          type: "select",
          options: [
            "짧게 (500-800자)",
            "보통 (1000-1500자)",
            "길게 (2000자 이상)",
          ],
          required: true,
        },
      ],
    },
    {
      id: "ppt_presentation",
      name: "PPT 프레젠테이션",
      category: "비즈니스",
      description: "프레젠테이션 제작을 위한 프롬프트",
      icon: "📊",
      prompt: `{{subject}} 주제로 {{slideCount}} 분량의 프레젠테이션을 제작해주세요.

프레젠테이션 정보:
- 발표 주제: {{subject}}
- 슬라이드 수: {{slideCount}}
- 톤 & 스타일: {{toneStyle}}
- 사용 툴: {{tool}}
- 컨텐츠 구조: {{contentStructure}}

작성 요구사항:
1. 명확한 스토리라인과 논리적 흐름 구성
2. 각 슬라이드의 제목과 핵심 내용 정리
3. 발표 대상의 관심과 수준에 맞는 내용 구성
4. 시각적 요소 활용 제안 (그래프, 이미지, 도표 등)
5. 강력한 오프닝과 임팩트 있는 마무리

결과물 형태:
- 슬라이드별 제목과 주요 내용
- 각 슬라이드에 대한 발표 스크립트 포인트
- 시각 자료 활용 제안{{선택질문}}

프레젠테이션 구성안을 작성해주세요.`,
      options: [
        {
          key: "subject",
          label: "발표 주제",
          type: "select",
          options: [
            "교육 워크숍",
            "비즈니스 제안",
            "기술 발표",
            "제품 소개",
            "연구 발표",
            "마케팅 전략",
            "데이터 분석",
          ],
          required: true,
        },
        {
          key: "slideCount",
          label: "슬라이드 수",
          type: "select",
          options: [
            "5장 내외",
            "10장 내외",
            "15장 내외",
            "20장 내외",
            "30장 내외",
          ],
          required: true,
        },
        {
          key: "toneStyle",
          label: "톤 & 스타일",
          type: "select",
          options: [
            "모던·심플",
            "미니멀·클린",
            "밝고 경쾌함",
            "견고·신뢰",
            "창의적·실험적",
            "격식·포멀",
          ],
          required: true,
        },
        {
          key: "tool",
          label: "사용 툴",
          type: "select",
          options: [
            "PowerPoint",
            "Google Slides",
            "Keynote",
            "Canva",
            "Figma",
            "Prezi",
            "SlideShare",
          ],
          required: true,
        },
        {
          key: "contentStructure",
          label: "컨텐츠 구조",
          type: "select",
          options: [
            "Agenda→Why→How→Demo→Q&A",
            "문제→해결→결과→행동",
            "현황→분석→전략→실행",
            "도입→전개→결론",
            "서론→본론→결론",
            "기승전결",
            "자유 형식",
          ],
          required: true,
        },
      ],
    },
    {
      id: "social_media",
      name: "소셜미디어 포스팅",
      category: "마케팅",
      description: "SNS 게시물 작성을 위한 프롬프트",
      icon: "📱",
      options: [
        {
          key: "platform",
          label: "플랫폼",
          type: "select",
          options: [
            "인스타그램",
            "페이스북",
            "X (트위터)",
            "블로그",
            "링크드인",
            "유튜브 스크립트",
            "틱톡",
          ],
          required: true,
        },
        {
          key: "content_type",
          label: "콘텐츠 유형",
          type: "select",
          options: [
            "제품/서비스 소개",
            "정보/팁 공유",
            "브랜드 스토리",
            "이벤트/프로모션",
            "고객 후기/사례",
            "Q&A",
          ],
          required: true,
        },
        {
          key: "tone",
          label: "톤앤매너",
          type: "select",
          options: [
            "친근하고 캐주얼",
            "전문적이고 신뢰감",
            "유머러스하고 재미있게",
            "감성적이고 따뜻하게",
          ],
          required: true,
        },
      ],
    },
    {
      id: "email_writing",
      name: "이메일 작성",
      category: "비즈니스",
      description: "비즈니스 이메일 작성을 위한 프롬프트",
      icon: "📧",
      options: [
        {
          key: "email_type",
          label: "이메일 유형",
          type: "select",
          options: [
            "업무 요청",
            "회의 일정 조율",
            "제안서 발송",
            "고객 문의 답변",
            "사과/해명",
            "감사/축하",
            "제휴/협력 제안",
          ],
          required: true,
        },
        {
          key: "recipient",
          label: "수신자",
          type: "select",
          options: [
            "상사",
            "동료",
            "부하직원",
            "고객",
            "외부 파트너",
            "잠재 고객",
            "교수/선생님",
          ],
          required: true,
        },
        {
          key: "urgency",
          label: "긴급도",
          type: "select",
          options: ["긴급", "중요", "보통", "참고용", "답변 불필요"],
          required: true,
        },
      ],
    },
  ],

  // 액션
  setCurrentTemplate: (template) => {
    get().initializeWithDefaults(template);
  },

  setSelectedOption: (key, value) =>
    set((state) => ({
      selectedOptions: {
        ...state.selectedOptions,
        [key]: value,
      },
    })),

  setExtraOption: (key, value) =>
    set((state) => ({
      extraOptions: {
        ...state.extraOptions,
        [key]: value,
      },
    })),

  toggleAdvancedMode: () =>
    set((state) => {
      const newIsAdvancedMode = !state.isAdvancedMode;
      return {
        isAdvancedMode: newIsAdvancedMode,
        extraOptions: newIsAdvancedMode ? state.extraOptions : {},
      };
    }),

  // 기본값 가져오기 헬퍼
  getDefaultValue: (key, template = null) => {
    const state = get();
    const currentTemplate = template || state.currentTemplate;

    if (state.defaultOptions[key]) {
      return state.defaultOptions[key];
    }

    if (currentTemplate?.options) {
      const option = currentTemplate.options.find((opt) => opt.key === key);
      if (option?.options && option.options.length > 0) {
        const firstOption = option.options[0];
        return typeof firstOption === "string"
          ? firstOption
          : firstOption.value;
      }
    }

    return "";
  },

  // 현재 선택값 또는 기본값 가져오기
  getValueOrDefault: (key) => {
    const state = get();
    return state.selectedOptions[key] || state.getDefaultValue(key);
  },

  // 프롬프트에서 사용할 모든 값들 가져오기
  getAllValues: () => {
    const state = get();
    return {
      ...state.defaultOptions,
      ...state.selectedOptions,
      ...(state.isAdvancedMode ? state.extraOptions : {}),
    };
  },

  // 현재 값이 기본값인지 확인
  isDefaultValue: (key) => {
    const state = get();
    const currentValue = state.selectedOptions[key];
    const defaultValue = state.getDefaultValue(key);
    return !currentValue || currentValue === defaultValue;
  },

  // 최적 기본값 해결(옵션 기반 자동 + 규칙 우선 + 템플릿 overrides)
  resolveDefaults: (template = null) => {
    const state = get();
    const t = template || state.currentTemplate;
    if (!t) return {};

    const out = {};

    // 1) 옵션 목록 기반 동적 기본값
    t.options?.forEach((opt) => {
      const values = normalizeOptionList(opt);
      if (values.length) {
        out[opt.key] = pickByRules(opt.key, values);
      } else {
        out[opt.key] = "";
      }
    });

    // 2) 템플릿 개별 overrides 지원
    if (t.defaults && typeof t.defaults === "object") {
      Object.assign(out, t.defaults);
    } else if (typeof t.defaults === "function") {
      Object.assign(out, t.defaults(out, t));
    }

    return out;
  },

  // 초기화 및 최적 기본값 적용
  initializeWithDefaults: (template) => {
    const optimizedDefaults = get().resolveDefaults(template);
    set({
      currentTemplate: template,
      selectedOptions: optimizedDefaults,
    });
  },

  generatePrompt: () => {
    const { currentTemplate, selectedOptions } = get();
    if (!currentTemplate) return "";

    let prompt = generatePromptText(currentTemplate, selectedOptions);
    set({ generatedPrompt: prompt });
    return prompt;
  },

  resetPrompt: () =>
    set({
      currentTemplate: null,
      selectedOptions: {},
      generatedPrompt: "",
      extraOptions: {},
    }),
}));

// 프롬프트 생성 로직 (교체본)
const generatePromptText = (template, options) => {
  const BL = "\n\n"; // 문단 간 1줄 공백
  const li = (arr) => arr.map((s) => `- ${s}`).join("\n");
  const get = (v, d) => (v && String(v).trim().length ? v : d);

  switch (template.id) {
    case "resume_cover_letter": {
      const job = get(options.position, "지원 직무");
      const company = get(options.company, "지원 회사");
      const exp = get(options.experience, "경력");
      const tone = get(options.tone, "정중하고 격식있게");
      const length = get(options.length, "보통 (500-800자)");

      return [
        `# 자기소개서 생성 요청`,
        `## 기본 정보\n${li([
          `지원 직무: ${job}`,
          `회사명: ${company}`,
          `경력 수준: ${exp}`,
          `톤: ${tone}`,
          `분량: ${length}`,
        ])}`,
        `## 출력 구성\n${li([
          "도입: 직무 적합성 한 문장 요약",
          "지원 동기: 회사/산업 리서치 1개 연결",
          "핵심 경험 2~3개: STAR(상황-과제-행동-결과)로 각 4~5문장",
          "강점 요약과 기여 약속",
        ])}`,
        `## 생성 지침(자동 반영)\n${li([
          "성과 지표 예시: 매출 +%, 비용 -%, 리드타임 -%, 반품률 -%, CS해결시간 -%",
          "규모·기간 표기: 팀원 n명, 예산 ₩, 기간 n개월",
          "역량 키워드: 문제정의, 실험설계, 데이터기반 의사결정, 자동화, 협업 리더십",
          "회사 연결 포인트: 최신 제품/IR/블로그/고객 리뷰에서 1가지",
        ])}`,
        `## 형식 가이드\n${li([
          "제목 없음. 문단 사이 빈 줄 1줄",
          "능동태 문장, 구체 수치/기간/규모 포함",
          "진부한 표현(성실/열정) 남용 금지",
        ])}`,
      ].join(BL);
    }

    case "blog_article": {
      const topic = get(options.topic, "미정 주제");
      const audience = get(options.target_audience, "일반인");
      const style = get(options.style, "정보 전달형");
      const length = get(options.length, "보통 (1000-1500자)");

      return [
        `# 블로그 글 생성`,
        `## 글 정보\n${li([
          `주제: ${topic}`,
          `대상: ${audience}`,
          `스타일: ${style}`,
          `길이: ${length}`,
        ])}`,
        `## 출력 구조\n${li([
          "제목",
          "TL;DR 2~3문장 요약",
          "본문: H2 3~5개, 각 섹션 2~3단락(단락 사이 빈 줄)",
          "결론 및 Next Step",
          "Key Takeaways 불릿 3~5개",
          "FAQ 2~3개(Q/A 형식, 선택)",
        ])}`,
        `## 추천 선택지\n${li([
          "예시/수치/간단 코드(해당 시) 포함",
          "비교 표(장단점 3~5개) 제안",
          "신뢰원 1~2개 자연스러운 인용",
        ])}`,
        `## 톤 가이드\n${li([
          "간결 명확. 한 문장 20자 내외 권장",
          "과한 수식어 지양. 능동태",
        ])}`,
      ].join(BL);
    }

    case "ppt_presentation": {
      const subject = get(options.subject, "발표 주제");
      const slides = get(options.slideCount, "10장 내외");
      const toneStyle = get(options.toneStyle, "모던·심플");
      const tool = get(options.tool, "PowerPoint");
      const structure = get(
        options.contentStructure,
        "Agenda→Why→How→Demo→Q&A"
      );

      return [
        `# PPT 구성안 생성`,
        `## 발표 정보\n${li([
          `주제: ${subject}`,
          `슬라이드 수: ${slides}`,
          `톤&스타일: ${toneStyle}`,
          `툴: ${tool}`,
          `구조: ${structure}`,
        ])}`,
        `## 슬라이드 템플릿(예시)\n${li([
          "Slide 1: 제목 · 목표 · 핵심 메시지 1줄",
          "Slide 2: 문제정의(현황/인사이트 수치 3개)",
          "Slide 3: 해결전략(프레임워크/원리 3포인트)",
          "Slide 4: 실행계획(타임라인/담당/지표)",
          "Slide 5: 기대효과(정량/정성 지표)",
          "Slide N: 데모/사례/FAQ",
          "Last: 요약 · CTA",
        ])}`,
        `## 작성 규칙\n${li([
          "슬라이드당 핵심 포인트 3~5개(문장이 아닌 명사구)",
          "그래프/도표 제안은 괄호로 표기",
          "한 슬라이드 한 메시지",
        ])}`,
      ].join(BL);
    }

    case "social_media": {
      const platform = get(options.platform, "인스타그램");
      const ctype = get(options.content_type, "제품/서비스 소개");
      const tone = get(options.tone, "친근하고 캐주얼");

      return [
        `# SNS 포스팅 생성`,
        `## 설정\n${li([
          `플랫폼: ${platform}`,
          `유형: ${ctype}`,
          `톤: ${tone}`,
        ])}`,
        `## 출력 형식\n${li([
          "본문 1개(3~6문장). 문단 사이 빈 줄",
          "후킹 첫 문장 1개",
          "CTA 1문장",
          "해시태그 10개 내외(코어 3 + 롱테일 7, 소문자, 공백 없음)",
          "대체 문구 2개(한 줄씩)",
        ])}`,
        `## 추천 선택지\n${li([
          "Hook 패턴: 의문형/수치 제시/공감 트리거",
          "이모지는 문장당 0~2개 제한",
          "플랫폼 길이 가이드 준수(IG 125자 이내 핵심)",
        ])}`,
      ].join(BL);
    }

    case "email_writing": {
      const etype = get(options.email_type, "업무 요청");
      const recipient = get(options.recipient, "동료");
      const urgency = get(options.urgency, "보통");

      return [
        `# 비즈니스 이메일 생성`,
        `## 조건\n${li([
          `유형: ${etype}`,
          `수신자: ${recipient}`,
          `긴급도: ${urgency}`,
        ])}`,
        `## 출력 형식\n${li([
          "Subject: 55자 이내, 핵심 키워드 앞 배치",
          "Greeting",
          "Purpose 한 문단(두괄식)",
          "Details 한 문단(불릿 3개 가능)",
          "Action(요청/기한/담당) 한 문단",
          "Closing · Sign-off",
        ])}`,
        `## 추천 선택지\n${li([
          "Subject 포맷: [요청/확인/공유] + 핵심 + 기한",
          "CTA 예시: 승인 요청, 회신 요청, 일정 확정",
          "숫자·기한·링크 명시, 모호어 금지",
        ])}`,
        `## 톤 가이드\n${li([
          "정중하고 간결. 수동태 지양",
          "문장 길이 15~20자 권장",
        ])}`,
      ].join(BL);
    }

    default:
      return "요청하신 내용에 맞춰 작성해주세요.";
  }
};

export { usePromptStore };
