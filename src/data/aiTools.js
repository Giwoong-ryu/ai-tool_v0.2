// src/data/aiTools.js
// 총 35개의 AI 도구 (사용자님 파일 기반 + Microsoft Copilot 추가)
export const aiTools = [
  // 1. ChatGPT
  {
    id: 1,
    name: "ChatGPT",
    category: "대화",
    rating: 4.9,
    description: "범용 대화형 생성 AI의 표준. 자연스러운 언어 처리, 방대한 지식 기반, 코드/문서/상담/기획 등 다방면 활용.",
    logo: "/images/logos/chatgpt.svg",
    id: "chatgpt",
    strengths: [
      "대부분의 질문에 바로 답변, 전문·일상 대화 모두 자연스러움",
      "글쓰기·요약·번역·기획 등 글 생산에 강력 (마케팅, 이메일, 보고서 등)",
      "코드 생성·오류 수정 등 프로그래밍 학습/실전 모두 활용 가능",
      "다양한 템플릿/프롬프트로 정보정리·학습·자동화 가능",
    ],
    weaknesses: [
      "최신 뉴스/이슈/트렌드는 즉시 반영 안 됨 (업데이트 지연)",
      "긴 대화/문맥에서 앞서 말한 내용 일부 잊거나 혼동",
      "코드/수식/전문용어에서 오류나 과장 설명 가끔 발생",
      "무료는 GPT-3.5만 사용, 이미지/파일 업로드 등 제한",
    ],
    freeLimitations: "무료 사용시 최신 모델(GPT-4o 등) 및 고급 플러그인, 파일업로드/분석 불가. API 사용 불가.",
    features: ["자연어 대화", "코드 생성/디버깅", "문서 요약", "다국어 번역", "아이디어 제안", "범용성"],
    usecases: [
      { title: "회의록 자동 작성", detail: "회의 음성을 텍스트로 변환하고 요약", example: "예: '온라인 회의 요약 및 할 일 정리'" },
      { title: "마케팅 콘텐츠 생성", detail: "블로그 게시물, SNS 광고 문구 등 생성", example: "예: '새 제품 출시 블로그 글 초안 작성'" },
      { title: "학습 및 연구 보조", detail: "복잡한 개념 설명, 자료 요약, 아이디어 확장", example: "예: '양자역학 개념 쉽게 설명해줘'" },
      { title: "코드 디버깅 및 생성", detail: "오류 있는 코드 수정, 새 코드 작성 제안", example: "예: '파이썬 스크립트 에러 수정'" }
    ],
    integrations: ["API"],
    link: "https://openai.com/chatgpt/",
    detail: "https://chat.openai.com/",
    isKorean: false,
    isPopularKr: true,
    isPopular: true,
    competitiveAdvantage: [
      { vs: "Gemini", advantage: "범용성 및 안정적인 성능: 다양한 작업에 걸쳐 전반적으로 뛰어난 결과 제공, 특히 글쓰기 및 코드 생성에서 강점." },
      { vs: "Claude", advantage: "긴 컨텍스트 처리 능력: Claude가 더 강할 수 있으나, ChatGPT는 더 넓은 기능 범위와 강력한 생태계를 제공합니다." }
    ],
    icon: "MessageSquare"
  },
  // 2. Gemini
  {
    id: 2,
    name: "Gemini",
    domain: "gemini.google.com",
    category: "대화",
    rating: 4.8,
    description: "구글이 개발한 멀티모달 AI. 텍스트, 이미지, 음성 등 다양한 형태의 정보 이해 및 생성 가능. 구글 서비스와의 뛰어난 연동성.",
    logo: "/images/logos/gemini.svg",
    strengths: [
      "멀티모달 기능: 텍스트뿐 아니라 이미지, 음성, 영상까지 이해하고 처리하는 능력 뛰어남",
      "구글 서비스 연동: Gmail, Docs, YouTube 등 구글 생태계와의 자연스러운 연동으로 생산성 향상",
      "실시간 정보 검색: Google 검색 엔진을 통한 최신 정보 접근 용이",
      "다양한 확장 기능: 숙박 예약, 항공권 조회 등 다양한 외부 서비스와 연결 가능"
    ],
    weaknesses: [
      "초기 버전의 답변 정확도 논란 및 일부 편향된 답변",
      "복잡하거나 전문적인 코딩 작업에서 ChatGPT 대비 다소 부족할 수 있음",
      "응답 속도가 경우에 따라 느려질 수 있음"
    ],
    freeLimitations: "무료 버전 이용 가능 (사용량 제한). 고급 모델(Gemini Advanced)은 유료 구독 필요.",
    features: ["멀티모달 대화", "구글 서비스 연동", "실시간 웹 검색", "아이디어 브레인스토밍", "데이터 분석 (Advanced)"],
    usecases: [
      { title: "정보 검색 및 요약", detail: "최신 뉴스, 학술 자료 등 웹 정보 검색 및 요약", example: "예: '최신 AI 기술 동향 요약해줘'" },
      { title: "여행 계획 수립", detail: "구글 지도, 항공권 등 연동하여 여행 계획 제안", example: "예: '파리 3박 4일 여행 코스 추천'" },
      { title: "이미지/음성 분석", detail: "이미지나 음성 데이터를 입력하여 분석 및 설명", example: "예: '이 이미지에 보이는 사물 설명해줘'" },
      { title: "개인화된 학습 도우미", detail: "사용자 학습 패턴 분석하여 맞춤형 자료 제공", example: "예: '내 학습 진도에 맞는 영어 단어 추천'" }
    ],
    integrations: ["Google Workspace", "Google Search", "YouTube", "Third-party extensions"],
    link: "https://gemini.google.com/",
    detail: "https://gemini.google.com/",
    isKorean: false,
    isPopularKr: true,
    isPopular: true,
    competitiveAdvantage: [
      { vs: "ChatGPT", advantage: "실시간 정보 접근 및 멀티모달 이해: 최신 정보 검색에 강하며, 이미지와 음성을 통한 복합적인 이해 능력이 뛰어남." }
    ],
    icon: "Sparkles"
  },
  // 3. Claude
  {
    id: 3,
    name: "Claude",
    domain: "claude.ai",
    category: "대화",
    rating: 4.7,
    description: "Anthropic이 개발한 대규모 언어 모델. 특히 긴 텍스트 처리 및 요약, 창의적 글쓰기에 강점. 윤리적 AI 개발 중점.",
    logo: "/images/logos/claude.svg",
    strengths: [
      "긴 텍스트 처리 능력: 방대한 양의 문서나 대화 내용을 효과적으로 요약하고 이해",
      "안전하고 유해하지 않은 답변: AI 윤리를 중시하여 안전하고 책임감 있는 답변 생성",
      "창의적 글쓰기: 소설, 시나리오 등 창의적 콘텐츠 생성에 뛰어난 능력",
      "대화 흐름 유지: 복잡한 대화에서도 일관된 문맥 유지"
    ],
    weaknesses: [
      "최신 정보 반영에 시간 소요",
      "수학적 계산이나 논리적 추론에서 오류 발생 가능성",
      "때때로 지나치게 조심스러운 답변 제공"
    ],
    freeLimitations: "무료 버전 이용 가능 (사용량 제한). 고급 모델(Claude Pro)은 유료 구독 필요.",
    features: ["긴 문서 요약", "창의적 글쓰기", "질의응답", "콘텐츠 생성", "윤리적 AI"],
    usecases: [
      { title: "장문 요약 및 분석", detail: "긴 보고서, 논문 등을 빠르고 정확하게 요약", example: "예: '50페이지 보고서 핵심 요약'" },
      { title: "콘텐츠 창작", detail: "소설, 시나리오, 마케팅 문구 등 창의적 글쓰기", example: "예: 'SF 소설 시놉시스 작성'" },
      { title: "고객 지원 스크립트 작성", detail: "다양한 시나리오에 맞는 고객 응대 스크립트 생성", example: "예: '환불 관련 고객 응대 스크립트'" },
      { title: "아이디어 브레인스토밍", detail: "특정 주제에 대한 다양한 아이디어 제안", example: "예: '친환경 제품 아이디어 10가지'" }
    ],
    integrations: ["API"],
    link: "https://www.anthropic.com/index/claude",
    detail: "https://claude.ai/",
    isKorean: false,
    isPopularKr: true,
    isPopular: true,
    competitiveAdvantage: [
      { vs: "ChatGPT", advantage: "긴 텍스트 컨텍스트 처리: 훨씬 더 긴 문서를 한 번에 처리하고 요약하는 능력에서 강점." },
      { vs: "Gemini", advantage: "안정적이고 안전한 답변: 윤리적 가이드라인에 중점을 두어 유해하거나 편향된 답변을 피하는 데 더 강함." }
    ],
    icon: "AlignJustify"
  },
  // 4. Naver Clova X
  {
    id: 4,
    name: "Naver Clova X",
    domain: "clovax.naver.com",
    category: "대화",
    rating: 4.6,
    description: "네이버가 개발한 초거대 AI. 한국어 특화된 대화 및 콘텐츠 생성 능력과 네이버 서비스 연동이 강점.",
    strengths: [
      "한국어 특화: 가장 한국적인 질문과 맥락을 잘 이해하고 자연스러운 한국어 답변 생성",
      "네이버 서비스 연동: 네이버 검색, 쇼핑, 뉴스 등 다양한 네이버 서비스와 유기적으로 연결",
      "최신 한국 정보 반영: 국내 트렌드 및 최신 정보에 강점",
      "다양한 콘텐츠 생성: 블로그 글, 이메일, 요약 등 한국어 기반 콘텐츠 생성에 탁월"
    ],
    weaknesses: [
      "일부 전문적이거나 해외 정보에 대한 답변은 한계",
      "코딩 능력이나 논리적 추론은 아직 ChatGPT/Gemini 대비 부족",
      "해외 서비스와의 연동은 제한적"
    ],
    freeLimitations: "무료 사용 가능 (사용량 제한).",
    features: ["한국어 대화", "네이버 서비스 연동", "콘텐츠 생성", "정보 요약"],
    usecases: [
      { title: "국내 최신 정보 검색", detail: "네이버 검색 기반 최신 한국 정보 제공", example: "예: '오늘의 날씨와 미세먼지 알려줘'" },
      { title: "한국어 콘텐츠 제작", detail: "한국어 블로그 글, 광고 문구 등 생성", example: "예: '한국 여행 가이드 글 초안 작성'" },
      { title: "쇼핑 정보 비교", detail: "네이버 쇼핑 연동 상품 비교 및 추천", example: "예: '가성비 좋은 노트북 추천해줘'" }
    ],
    integrations: ["Naver Search", "Naver Shopping", "Naver News"],
    link: "https://clova.naver.com/clova-x/",
    detail: "https://clova.naver.com/clova-x/",
    isKorean: true,
    isPopularKr: true,
    isPopular: true,
    competitiveAdvantage: [
      { vs: "ChatGPT/Gemini", advantage: "한국어 최적화 및 국내 서비스 연동: 가장 한국적인 질문과 맥락을 이해하고 네이버 서비스와 유기적으로 연결되어 국내 사용자에게 최적." }
    ],
    icon: "BookText"
  },
  // 5. Wrtn (뤼튼)
  {
    id: 5,
    name: "Wrtn (뤼튼)",
    domain: "wrtn.ai",
    category: "문서편집",
    rating: 4.5,
    description: "한국어에 최적화된 AI 글쓰기 플랫폼. 다양한 글쓰기 템플릿과 스타일을 지원하며, 최신 AI 모델(Claude, GPT 등) 통합으로 한국어 문맥 이해와 감각적인 글쓰기에 강점.",
    strengths: [
      "한국어 최적화: 한국어 문맥 및 신조어 이해 정확도 높음",
      "다국적 모델 통합: Claude, GPT 등 다양한 AI 모델 선택 가능",
      "다양한 글쓰기 템플릿: 블로그, 광고 문구, 자기소개서 등 다양한 유형 지원",
      "SNS‧광고 문구 감각 우위: 감각적인 카피라이팅에 특화",
      "직관적인 인터페이스: 사용하기 쉬운 UI로 초보자도 쉽게 활용 가능"
    ],
    weaknesses: [
      "출력물 품질이 모델마다 상이함",
      "일부 복잡하거나 전문적인 글쓰기에서는 정확도 한계",
      "복잡 논리 설명은 약함; “광고 말투”가 과하게 들어갈 수 있음",
      "장문의 글 생성 시 논리적 일관성 유지 어려움 발생 가능"
    ],
    freeLimitations: "무료 사용 가능 (일일 사용량 및 템플릿 일부 제한).",
    features: ["한국어 글쓰기", "다국적 모델 통합", "다양한 템플릿", "아이디어 제안", "문장 교정", "광고 문구 생성"],
    usecases: [
      { title: "블로그 글 작성", detail: "주어진 키워드로 블로그 게시물 초안 생성", example: "예: 'AI 트렌드에 대한 블로그 글'" },
      { title: "광고 문구 제작", detail: "제품/서비스 특징에 맞는 광고 문구 제안", example: "예: '새로운 커피 광고 문구'" },
      { title: "자소서 및 보고서 초안", detail: "기본 정보 입력 시 자소서/보고서 초안 생성", example: "예: '자기소개서 성장 과정 작성'" }
    ],
    integrations: ["Claude", "GPT (내부 통합)"],
    link: "https://wrtn.ai/",
    detail: "https://wrtn.ai/",
    isKorean: true,
    isPopularKr: true,
    isPopular: false,
    competitiveAdvantage: [
      { vs: "ChatGPT / Gemini", advantage: "한국어 최적화 및 다양한 AI 모델을 한 플랫폼에서 선택하여 사용할 수 있는 강점이 있습니다." },
      { vs: "Copy.ai", advantage: "Copy.ai가 영문 콘텐츠 생성에 강하다면, 뤼튼은 한국어 문맥과 신조어에 대한 이해도가 높아 자연스러운 한국어 콘텐츠 생성에 우위가 있습니다." }
    ],
    icon: "AlignJustify"
  },
  // 6. DeepL 번역
  {
    id: 6,
    name: "DeepL 번역",
    id: "deepl",
    category: "문서편집",
    rating: 4.8,
    description: "인공지능 기반의 고품질 번역 서비스. 특히 유럽 언어 및 한국어 번역에서 자연스럽고 정확한 결과물 제공.",
    strengths: [
      "자연스러운 번역: 기계 번역임에도 불구하고 매우 자연스러운 문장 구사",
      "높은 정확도: 문맥을 잘 이해하여 번역 품질 우수",
      "다양한 언어 지원: 영어, 독일어, 프랑스어, 일본어, 한국어 등 주요 언어 지원",
      "문서 번역 지원: PDF, Word, PowerPoint 파일 전체 번역 기능"
    ],
    weaknesses: [
      "무료 버전 사용량 제한: 장문 번역 또는 문서 번역은 유료 구독 필요",
      "일부 마이너 언어 지원 부족",
      "전문 용어 번역 시 간혹 오류 발생 가능"
    ],
    freeLimitations: "무료 버전은 텍스트 5,000자 제한, 문서 파일 3개 제한 등.",
    features: ["다국어 번역", "문서 번역", "용어집", "번역 품질"],
    usecases: [
      { title: "해외 논문 번역", detail: "외국어 논문이나 자료를 한국어로 번역", example: "예: '영문 학술지 내용 번역'" },
      { title: "비즈니스 이메일 번역", detail: "해외 파트너와의 이메일 빠르고 정확하게 번역", example: "예: '영문 비즈니스 이메일 작성'" },
      { title: "웹 콘텐츠 번역", detail: "해외 웹사이트나 기사 내용을 번역하여 이해", example: "예: '해외 뉴스 기사 번역'" }
    ],
    integrations: ["API", "Browser Extension", "Desktop App"],
    link: "https://www.deepl.com/translator",
    detail: "https://www.deepl.com/translator",
    isKorean: true,
    isPopularKr: true,
    isPopular: true,
    competitiveAdvantage: [
      { vs: "Google 번역", advantage: "문맥을 이해하는 번역 품질이 뛰어나 더 자연스러운 결과물을 제공합니다." }
    ],
    icon: "Languages"
  },
  // 7. DeepL Write
  {
    id: 7,
    name: "DeepL Write",
    id: "deepl-write",
    category: "문서편집",
    rating: 4.7,
    description: "DeepL에서 개발한 AI 기반 글쓰기 도우미. 문법 오류 수정, 어조 변경, 문장 재구성 등 영작문 실력 향상에 도움.",
    strengths: [
      "높은 정확도의 문법/철자 교정: 자연스러운 영작문 지원",
      "다양한 표현 제안: 문맥에 맞는 어휘 및 문장 구조 제안",
      "어조 및 스타일 변경: 전문적, 친근함 등 원하는 어조로 변경 가능",
      "글쓰기 흐름 개선: 문장 연결 및 가독성 향상에 기여"
    ],
    weaknesses: [
      "주로 영어에 특화: 다른 언어 지원은 제한적",
      "장문 작성 시 논리적 흐름 검토는 사용자 역할",
      "창의적인 글쓰기보다는 교정 및 개선에 중점"
    ],
    freeLimitations: "무료 버전 사용량 제한. 더 많은 기능은 DeepL Pro 구독 필요.",
    features: ["문법 교정", "문장 재구성", "어조 변경", "어휘 제안", "영작문 개선"],
    usecases: [
      { title: "영어 이메일 작성 및 교정", detail: "비즈니스, 학술, 개인 이메일의 문법 및 표현 교정", example: "예: '영문 비즈니스 이메일 검토'" },
      { title: "영문 보고서/논문 교정", detail: "학술 문서의 문법적 오류와 표현 개선", example: "예: '영문 연구 보고서 문법 확인'" },
      { title: "영어 블로그/콘텐츠 작성", detail: "온라인 콘텐츠의 가독성과 정확성 향상", example: "예: '영어 블로그 게시물 어조 변경'" }
    ],
    integrations: ["Web App", "Browser Extension"],
    link: "https://www.deepl.com/write",
    detail: "https://www.deepl.com/write",
    isKorean: false,
    isPopularKr: true,
    isPopular: false,
    competitiveAdvantage: [
      { vs: "Grammarly", advantage: "DeepL 번역 엔진의 우수성을 바탕으로 문맥 이해도가 높아 더 자연스러운 문장 재구성을 제공합니다." }
    ],
    icon: "Edit3"
  },
  // 8. Storytell AI
  {
    id: 8,
    name: "Storytell AI",
    category: "문서편집",
    rating: 4.3,
    description: "AI 기반 오디오/비디오 콘텐츠 요약 및 핵심 정보 추출 도구. 회의, 강연, 팟캐스트 등 긴 콘텐츠의 핵심을 빠르게 파악. Canva 연동 가능.",
    strengths: [
      "콘텐츠 요약: 긴 오디오/비디오 콘텐츠의 핵심 내용을 자동으로 요약",
      "핵심 정보 추출: 중요한 키워드, 주제, 액션 아이템 등을 식별하여 제시",
      "시간 절약: 방대한 양의 콘텐츠를 직접 듣거나 보지 않고 빠르게 파악",
      "질의응답: 콘텐츠 내용에 대해 질문하고 AI로부터 답변 얻기",
      "Canva 연동: 시각화 도구와의 연동으로 실무용 콘텐츠 제작에 강력"
    ],
    weaknesses: [
      "무료 사용량 제한: 긴 콘텐츠 처리는 유료 플랜 필요",
      "오디오/비디오 품질에 따라 인식률 영향",
      "아직 완벽한 요약이나 모든 뉘앙스 파악은 어려움",
      "구체적 맞춤 설정은 제한적"
    ],
    freeLimitations: "제한된 무료 사용량 제공.",
    features: ["오디오/영상 요약", "핵심 추출", "질의응답", "텍스트 변환", "콘텐츠 자동화", "Canva 연동"],
    usecases: [
      { title: "회의 내용 요약", detail: "녹음된 회의 내용을 텍스트로 변환하고 핵심 요약", example: "예: '지난 팀 회의 주요 결정 사항 요약'" },
      { title: "강의 노트 자동 생성", detail: "온라인 강의 영상/음성 요약 및 주요 개념 추출", example: "예: '온라인 강좌 핵심 내용 노트 만들기'" },
      { title: "팟캐스트 핵심 파악", detail: "긴 팟캐스트 에피소드의 주요 주제 및 내용 요약", example: "예: '이번 주 팟캐스트 하이라이트'" }
    ],
    integrations: ["Canva"],
    link: "https://www.storytell.ai/",
    detail: "https://www.storytell.ai/",
    isKorean: false,
    isPopularKr: false,
    isPopular: false,
    competitiveAdvantage: [
      { vs: "CLOVA Note", advantage: "다양한 오디오/비디오 포맷을 지원하며, Canva 연동을 통해 시각적 콘텐츠 제작과 연계성이 더 높습니다." }
    ],
    icon: "Newspaper"
  },
  // 9. Copy.ai
  {
    id: 9,
    name: "Copy.ai",
    category: "문서편집",
    rating: 4.5,
    description: "AI 기반의 마케팅 콘텐츠 생성 도구. 블로그 글, 소셜 미디어 게시물, 광고 문구 등 다양한 형태의 마케팅 텍스트를 자동 생성.",
    strengths: [
      "다양한 마케팅 콘텐츠: 블로그 글, 이메일, 광고 문구 등 폭넓은 콘텐츠 유형 지원",
      "빠른 생성 속도: 짧은 시간 안에 여러 버전의 콘텐츠 생성",
      "템플릿 활용: 목적에 맞는 다양한 템플릿을 제공하여 쉽게 시작",
      "다국어 지원: 영어 외 다양한 언어로 콘텐츠 생성 가능"
    ],
    weaknesses: [
      "무료 버전 사용량 제한: 더 많은 단어 생성이나 고급 기능은 유료 플랜 필요",
      "매우 전문적이거나 특정 분야의 심층적인 내용은 한계",
      "AI 생성 콘텐츠의 사실 관계 확인 필요"
    ],
    freeLimitations: "월 2,000단어 무료 생성. 이후 유료 플랜 필요.",
    features: ["마케팅 글쓰기", "광고 문구", "블로그 생성", "이메일 작성", "다국어 지원"],
    usecases: [
      { title: "블로그 게시물 작성", detail: "주어진 주제로 블로그 게시물 초안 및 여러 섹션 생성", example: "예: 'AI 기술 동향 블로그 글 초안'" },
      { title: "소셜 미디어 콘텐츠", detail: "인스타그램, 페이스북 등 소셜 미디어 게시물 작성", example: "예: '새로운 제품 출시 인스타그램 문구'" },
      { title: "이메일 마케팅", detail: "뉴스레터, 프로모션 이메일 등 마케팅 이메일 작성", example: "예: '할인 프로모션 이메일 초안'" }
    ],
    integrations: [],
    link: "https://www.copy.ai/",
    detail: "https://www.copy.ai/",
    isKorean: false,
    isPopularKr: true,
    isPopular: false,
    competitiveAdvantage: [
      { vs: "Wrtn (뤼튼)", advantage: "영문 마케팅 콘텐츠 생성에 강하며, 폭넓은 템플릿과 빠른 생성 속도를 자랑합니다. 다국어 지원이 더 뛰어납니다." }
    ],
    icon: "FileText"
  },
  // 10. 무하유 (카피킬러)
  {
    id: 10,
    name: "무하유 (카피킬러)",
    category: "문서편집",
    rating: 4.6,
    description: "AI 기반 표절 검사 서비스. 문서의 표절률을 분석하고 출처를 제시하여 글의 신뢰성을 높이는 데 기여.",
    strengths: [
      "높은 표절 검출률: 방대한 데이터베이스 기반의 정확한 표절 검사",
      "상세한 분석 보고서: 표절 의심 구간, 출처, 유사율 등 상세 보고서 제공",
      "다양한 문서 형식 지원: 논문, 보고서, 자기소개서 등 여러 문서 검사 가능",
      "교육 및 연구 윤리 강화: 학술 및 교육 분야에서 표절 방지에 기여"
    ],
    weaknesses: [
      "무료 버전 기능 제한적: 유료 버전에서 더 많은 검사 및 기능 제공",
      "오류율 100% 제거는 어려움: 완벽한 표절 감지에는 한계",
      "텍스트 기반이므로 이미지 등 비텍스트 콘텐츠는 검사 불가"
    ],
    freeLimitations: "무료 표절 검사는 제한된 횟수 및 분량 제공.",
    features: ["표절 검사", "출처 분석", "유사율 검사", "문서 보안", "윤리 강화"],
    usecases: [
      { title: "논문/보고서 표절 검사", detail: "작성한 논문이나 보고서의 표절 여부 확인", example: "예: '졸업 논문 표절률 검사'" },
      { title: "자기소개서 표절 방지", detail: "지원서 작성 시 다른 사람의 글과 유사성 검토", example: "예: '자기소개서 표절 여부 확인'" },
      { title: "교육 자료 검토", detail: "교재나 학습 자료의 표절 여부 확인", example: "예: '강의 자료 표절 검사'" }
    ],
    integrations: [],
    link: "https://www.copykiller.com/",
    detail: "https://www.copykiller.com/",
    isKorean: true,
    isPopularKr: true,
    isPopular: false,
    competitiveAdvantage: [
      { vs: "무하유 (GPT킬러)", advantage: "표절 검사 자체에 특화되어 있으며, 방대한 국내외 데이터베이스를 기반으로 정확한 표절률을 분석합니다." }
    ],
    icon: "ClipboardList"
  },
  // 11. 무하유 (GPT킬러)
  {
    id: 11,
    name: "무하유 (GPT킬러)",
    category: "문서편집",
    rating: 4.5,
    description: "AI 챗봇(ChatGPT 등)이 생성한 텍스트를 탐지하는 서비스. 인간이 작성했는지 AI가 작성했는지 판별.",
    strengths: [
      "AI 생성 텍스트 탐지: 챗봇이 작성한 글인지 여부를 판별하여 신뢰성 검증",
      "표절 방지 기능과 연동: AI 생성 글과 표절을 동시에 검사하여 더욱 정확",
      "교육 및 평가의 공정성: 학생들이 AI를 사용하여 과제를 제출했는지 확인 가능",
      "다양한 텍스트 유형 분석: 보고서, 에세이, 기사 등 여러 유형 분석"
    ],
    weaknesses: [
      "100% 정확도 보장 어려움: AI 탐지 기술도 계속 발전 중",
      "무료 버전 기능 제한적: 유료 버전에서 더 많은 검사 및 기능 제공",
      "새로운 AI 모델의 글은 탐지에 어려움 있을 수 있음"
    ],
    freeLimitations: "제한된 무료 사용량 제공.",
    features: ["AI 텍스트 탐지", "챗봇 판별", "표절 검사 연동", "문서 보안", "공정성 확보"],
    usecases: [
      { title: "학생 과제 평가", detail: "학생이 제출한 과제가 AI 챗봇으로 작성되었는지 확인", example: "예: '대학생 레포트 AI 작성 여부 검사'" },
      { title: "콘텐츠 신뢰성 검증", detail: "온라인에 유포되는 정보가 AI에 의해 생성되었는지 확인", example: "예: '뉴스 기사 AI 작성 여부 판별'" },
      { title: "입사 지원서 검토", detail: "지원자가 제출한 자기소개서 등이 AI로 작성되었는지 확인", example: "예: '자기소개서 AI 사용 여부 검사'" }
    ],
    integrations: [],
    link: "https://www.copykiller.com/gptkiller/",
    detail: "https://www.copykiller.com/gptkiller/",
    isKorean: true,
    isPopularKr: true,
    isPopular: false,
    competitiveAdvantage: [
      { vs: "무하유 (카피킬러)", advantage: "AI가 생성한 텍스트를 탐지하는 데 특화되어 있어, 표절과 AI 생성 여부를 동시에 검증할 때 시너지가 좋습니다." }
    ],
    icon: "CheckShield"
  },
  // 12. Karlo
  {
    id: 12,
    name: "Karlo",
    category: "이미지/디자인",
    rating: 4.7,
    description: "카카오 브레인이 개발한 한국형 이미지 생성 AI. 텍스트 프롬프트로 다양한 스타일의 고품질 이미지 생성 가능. 한국 문화 특화 이미지 생성에 강점.",
    strengths: [
      "한국어 프롬프트 이해도 높음: 한국어 설명을 기반으로 이미지 생성 정확도 우수",
      "한국적 이미지 생성: 한복, 한국 건축물 등 한국 문화 요소를 반영한 이미지 생성에 강점",
      "다양한 스타일 지원: 실사, 애니메이션, 유화 등 폭넓은 이미지 스타일 구현",
      "빠른 이미지 생성 속도: 비교적 짧은 시간 안에 여러 이미지 생성 가능"
    ],
    weaknesses: [
      "복잡한 배경이나 구체적인 인물 묘사에서 아직 한계",
      "세부적인 디테일 표현에서 미드저니/스테이블 디퓨전 대비 부족",
      "윤리적 문제 및 편향성 발생 가능성"
    ],
    freeLimitations: "무료 사용 가능 (일일 크레딧 제한 또는 해상도 제한)",
    features: ["텍스트→이미지", "한국어 특화", "다양한 스타일", "빠른 생성"],
    usecases: [
      { title: "SNS 콘텐츠 제작", detail: "소셜 미디어 게시물용 이미지 생성", example: "예: '카페 홍보용 이미지'" },
      { title: "웹툰/일러스트 초안", detail: "웹툰 캐릭터나 배경 이미지 초안 생성", example: "예: '판타지 세계관 배경 이미지'" },
      { title: "마케팅 이미지", detail: "제품 광고, 이벤트 홍보 등 마케팅 이미지 생성", example: "예: '새로운 서비스 광고 배너'" }
    ],
    integrations: ["API"],
    link: "https://kakaobrain.com/service/karlo",
    detail: "https://kakaobrain.com/service/karlo",
    isKorean: true,
    isPopularKr: true,
    isPopular: true,
    competitiveAdvantage: [
      { vs: "Midjourney / Adobe Firefly", advantage: "한국어 프롬프트 이해도가 높고, 한복 등 한국 문화 요소를 반영한 이미지를 생성하는 데 특화되어 있습니다." }
    ],
    icon: "Image"
  },
  // 13. Midjourney
  {
    id: 13,
    name: "Midjourney",
    category: "이미지/디자인",
    rating: 4.7,
    description: "매우 높은 퀄리티의 예술적인 이미지를 생성하는 AI. Discord 기반으로 운영되며, 독특하고 창의적인 결과물로 유명.",
    strengths: [
      "독보적인 예술적 품질: 매우 미학적이고 시각적으로 인상적인 이미지 생성",
      "다양한 스타일 구현: 추상, 판타지, 사실주의 등 광범위한 예술 스타일 소화",
      "빠른 이미지 생성: 짧은 시간 내에 여러 고품질 시안 제공",
      "활발한 커뮤니티: Discord 기반으로 사용자 간 정보 공유 및 학습 용이"
    ],
    weaknesses: [
      "Discord 인터페이스 사용 필요 (별도의 웹 인터페이스 부재)",
      "무료 체험 제한적, 사실상 유료 구독 필수",
      "세부적인 이미지 요소 제어에 어려움",
      "텍스트 포함 이미지 생성 시 글자가 왜곡될 수 있음"
    ],
    freeLimitations: "매우 제한적인 무료 사용. 유료 구독 필수.",
    features: ["텍스트-이미지 생성", "다양한 스타일", "빠른 생성", "고품질 예술성"],
    usecases: [
      { title: "콘셉트 아트 생성", detail: "게임, 영화 등의 초기 시각 콘셉트 생성", example: "예: '사이버펑크 도시 콘셉트 아트'" },
      { title: "개인 작품 활동", detail: "개인 소장용 또는 포트폴리오용 예술 작품 생성", example: "예: '추상적인 유화 스타일 그림'" },
      { title: "마케팅 시각 자료", detail: "제품, 서비스의 광고에 활용할 독특한 이미지 생성", example: "예: '환상적인 분위기의 제품 이미지'" },
      { title: "디자인 영감", detail: "패션, 인테리어, 제품 디자인을 위한 시각적 영감 탐색", example: "예: '미래지향적 자동차 디자인'" }
    ],
    integrations: ["Discord"],
    link: "https://www.midjourney.com/",
    detail: "https://www.midjourney.com/",
    isKorean: false,
    isPopularKr: true,
    isPopular: true,
    competitiveAdvantage: [
      { vs: "Karlo / Adobe Firefly", advantage: "압도적인 예술적 퀄리티와 독창적인 이미지 생성에 강점이 있어, 감성적이고 유니크한 시각 자료 제작에 최적입니다." }
    ],
    icon: "Image"
  },
  // 14. Leonardo.Ai
  {
    id: 14,
    name: "Leonardo.Ai",
    category: "이미지/디자인",
    rating: 4.6,
    description: "고품질의 사실적인 이미지와 예술적인 이미지를 생성하는 AI. 게임, 미디어 아트 등 특정 산업에 특화된 모델 제공.",
    strengths: [
      "사실적인 이미지 생성: 인물, 풍경 등 현실과 같은 고품질 이미지 생성에 강점",
      "특정 산업 특화 모델: 게임 에셋, 미디어 아트 등 특정 용도에 최적화된 모델 제공",
      "쉬운 사용법: 직관적인 인터페이스로 초보자도 쉽게 이미지 생성 가능",
      "다양한 스타일 및 요소 제어: 이미지의 스타일, 색상, 구성 등 세부 제어 가능"
    ],
    weaknesses: [
      "무료 사용량 제한: 일일 생성 크레딧 제한",
      "일부 복잡한 개념 표현에는 한계",
      "인물 이미지 생성 시 손가락 등 디테일 부족할 수 있음"
    ],
    freeLimitations: "일일 무료 생성 크레딧 제공 (제한적). 더 많은 크레딧은 유료 구독 필요.",
    features: ["텍스트→이미지", "사실적 이미지", "게임 에셋", "이미지 편집", "스타일 제어"],
    usecases: [
      { title: "게임 에셋 제작", detail: "게임 캐릭터, 아이템, 배경 등 디자인 에셋 생성", example: "예: '판타지 게임 배경 이미지'" },
      { title: "제품 디자인 컨셉", detail: "새로운 제품의 디자인 컨셉 이미지 생성", example: "예: '미래형 스마트폰 디자인'" },
      { title: "광고/마케팅 이미지", detail: "브랜드 홍보, 광고 캠페인에 필요한 이미지 생성", example: "예: '새로운 서비스 광고 이미지'" }
    ],
    integrations: [],
    link: "https://leonardo.ai/",
    detail: "https://leonardo.ai/",
    isKorean: false,
    isPopularKr: true,
    isPopular: true,
    competitiveAdvantage: [
      { vs: "Midjourney / Adobe Firefly", advantage: "사실적 이미지 생성에 강하며, 특히 게임 에셋이나 특정 산업에 특화된 모델을 제공하여 차별화됩니다." }
    ],
    icon: "Image"
  },
  // 15. Remove.bg
  {
    id: 15,
    name: "Remove.bg",
    category: "이미지/디자인",
    rating: 4.8,
    description: "AI 기반 이미지 배경 제거 도구. 인물, 사물 등 어떤 이미지든 몇 초 안에 자동으로 배경을 투명하게 만듦.",
    strengths: [
      "정확하고 빠른 자동 배경 제거",
      "복잡한 가장자리(머리카락 등)도 깔끔하게 처리",
      "API 지원으로 대량 작업 자동화 가능",
      "간단한 인터페이스, 초보자도 쉽게 사용"
    ],
    weaknesses: [
      "무료 버전 이미지 해상도 제한",
      "때때로 복잡한 배경이나 투명한 개체 처리에 한계",
      "이미지 편집 기능은 제한적"
    ],
    freeLimitations: "무료 버전은 낮은 해상도(0.25 메가픽셀) 이미지 1개 다운로드 가능.",
    features: ["배경 제거", "자동 크롭", "고품질 결과", "간편 사용"],
    usecases: [
      { title: "쇼핑몰 제품 사진", detail: "제품 이미지를 깔끔한 배경으로 전환하여 상품성 향상", example: "예: '온라인 쇼핑몰 상품 이미지 배경 제거'" },
      { title: "개인 프로필 사진", detail: "사진 배경을 제거하여 다른 배경에 합성 또는 활용", example: "예: 'SNS 프로필 사진 배경 교체'" },
      { title: "콘텐츠 제작 (썸네일, 배너)", detail: "디자인 요소로 활용할 인물/사물 이미지 추출", example: "예: '유튜브 썸네일 인물 배경 제거'" }
    ],
    integrations: ["웹", "API", "포토샵 플러그인"],
    link: "https://www.remove.bg/",
    detail: "https://www.remove.bg/",
    isKorean: false,
    isPopularKr: true,
    isPopular: true,
    competitiveAdvantage: [
      { vs: "Canva AI", advantage: "배경 제거 기능에 특화되어 있으며, 속도와 정확성 면에서 매우 뛰어납니다." }
    ],
    icon: "ImageDown"
  },
  // 16. Adobe Firefly
  {
    id: 16,
    name: "Adobe Firefly",
    category: "이미지/디자인",
    rating: 4.8,
    description: "Adobe의 크리에이티브 애플리케이션에 통합된 AI. 고품질 텍스트→이미지 생성, 벡터 생성 등 전문적인 창작 활동 지원.",
    strengths: [
      "정밀하고 고해상도 이미지 생성: Adobe의 기술력 기반",
      "벡터 생성: 텍스트로 벡터 그래픽 생성 가능",
      "Adobe 제품군과의 연동: Photoshop, Illustrator 등과 원활한 작업",
      "창의적 연출: 다양한 스타일과 효과 적용 가능",
      "저작권 필터 엄격: 상업적 사용에 용이"
    ],
    weaknesses: [
      "유료 플랜 필수: 대부분의 고급 기능 사용을 위해 구독 필요",
      "초보자에겐 진입장벽 있음: Adobe 제품에 대한 이해 필요",
      "학습 필요"
    ],
    freeLimitations: "제한된 무료 사용 제공 (크레딧 기반).",
    features: ["텍스트→이미지", "벡터 생성", "고해상도 이미지", "Adobe 연동", "창의적 디자인", "저작권 관리"],
    usecases: [
      { title: "전문 그래픽 디자인", detail: "광고, 포스터, 브랜딩에 필요한 고품질 이미지 및 벡터 요소 생성", example: "예: '새로운 브랜드 로고 디자인 생성'" },
      { title: "콘셉트 아트 제작", detail: "영화, 게임, 웹툰 등의 콘셉트 아트를 고품질로 제작", example: "예: 'SF 영화 장면 콘셉트 아트'" },
      { title: "디자인 시안 제작", detail: "웹사이트, 앱 디자인에 필요한 그래픽 요소 생성", example: "예: '모바일 앱 아이콘 디자인 시안'" },
      { title: "개인 창작물", detail: "블로그, 유튜브 썸네일 등 개인 콘텐츠용 이미지", example: "예: '환상적인 숲 배경 이미지'" }
    ],
    integrations: ["Adobe Creative Cloud"],
    link: "https://firefly.adobe.com/",
    detail: "https://firefly.adobe.com/",
    isKorean: false,
    isPopularKr: true,
    isPopular: true,
    competitiveAdvantage: [
      { vs: "Midjourney", advantage: "Adobe 제품군과의 긴밀한 연동성으로 기존 디자이너 작업 흐름에 통합이 용이하며, 벡터 그래픽 생성 기능이 독보적입니다." }
    ],
    icon: "Palette"
  },
  // 17. RunwayML
  {
    id: 17,
    name: "RunwayML",
    category: "동영상",
    rating: 4.7,
    description: "텍스트나 이미지로 영상을 생성하고 편집하는 AI 도구. Gen-1, Gen-2 모델로 사실적인 영상 제작 가능.",
    strengths: [
      "텍스트-영상 생성: 텍스트 프롬프트만으로 새로운 영상 클립 생성",
      "이미지-영상 변환: 이미지를 기반으로 움직이는 영상 생성",
      "스타일 전이: 특정 이미지의 스타일을 영상에 적용 가능",
      "다양한 영상 편집 기능: 그린 스크린, 인페인팅, 모션 트래킹 등 전문 편집 도구 제공"
    ],
    weaknesses: [
      "고품질 영상 생성에는 시간과 크레딧 소모",
      "복잡한 스토리나 장편 영상 제작에는 아직 한계",
      "무료 사용 시 기능 및 사용량 제한"
    ],
    freeLimitations: "무료 크레딧 제한. 생성 영상에 워터마크. 일부 고급 기능 제한.",
    features: ["텍스트-영상 생성", "이미지-영상 변환", "영상 스타일 전이", "AI 영상 편집", "모션 트래킹"],
    usecases: [
      { title: "콘텐츠 크리에이터", detail: "유튜브 인트로/아웃트로, SNS 쇼츠 영상 등 짧은 영상 클립 제작", example: "예: '여행 브이로그 오프닝 영상 생성'" },
      { title: "마케팅 및 광고 영상", detail: "제품 홍보, 이벤트 소개 등 광고용 짧은 영상 제작", example: "예: '신제품 런칭 광고 영상 스케치'" },
      { title: "예술 및 실험 영상", detail: "추상적이거나 실험적인 시각 예술 작품 제작", example: "예: '꿈속의 장면을 영상으로 표현'" },
      { title: "영화 프리비주얼", detail: "영화 제작 전 시각적인 아이디어를 영상으로 구현", example: "예: '액션 장면의 초기 시각화'" }
    ],
    integrations: [],
    link: "https://runwayml.com/",
    detail: "https://runwayml.com/",
    isKorean: false,
    isPopularKr: true,
    isPopular: true,
    competitiveAdvantage: [
      { vs: "Midjourney (영상)", advantage: "영상 전문성: 이미지 생성 전문인 Midjourney와 달리, RunwayML은 영상 생성과 편집에 특화된 다양한 AI 기능 제공." },
      { vs: "CapCut (AI 기능)", advantage: "생성형 AI의 폭넓은 활용: CapCut이 기존 영상 편집에 AI 기능을 추가하는 방식이라면, RunwayML은 텍스트/이미지 기반의 새로운 영상 '생성'에 더 강력." }
    ],
    icon: "Film"
  },
  // 18. Descript
  {
    id: 18,
    name: "Descript",
    category: "동영상",
    rating: 4.6,
    description: "텍스트 편집하듯 오디오 및 영상 편집 도구. 스크립트를 편집하는 것처럼 오디오/영상을 쉽게 편집 가능하며, AI 기능 내장.",
    strengths: [
      "텍스트 기반 편집: 스크립트 텍스트를 수정하는 것처럼 영상/오디오 편집 가능 (오버더빙, 필러 워드 제거 등)",
      "AI 음성 복제 (Overdub): 자신의 목소리로 새로운 오디오를 생성하거나, 잘못된 부분을 수정",
      "노이즈 제거 및 음질 개선: AI 기반으로 오디오 노이즈를 효과적으로 제거",
      "다중 화자 인식 및 자동 전사: 여러 화자의 대화를 자동으로 텍스트로 변환",
      "영상 편집 기능 통합"
    ],
    weaknesses: [
      "무료 사용량 및 기능 제한",
      "복잡하거나 전문적인 영상 효과 구현에는 한계",
      "한국어 음성 복제나 전사 기능은 아직 완벽하지 않을 수 있음"
    ],
    freeLimitations: "월 1시간 전사, 워터마크 포함 내보내기. Overdub, Filler Word Pro 등 고급 기능 제한.",
    features: ["텍스트 기반 편집", "AI 음성 복제", "자동 전사", "노이즈 제거", "영상/오디오 편집"],
    usecases: [
      { title: "팟캐스트 편집", detail: "대본 수정하듯 오디오 편집, 불필요한 부분 제거, 음질 개선", example: "예: '팟캐스트 에피소드 편집 및 오버더빙'" },
      { title: "유튜브 영상 편집", detail: "말실수 제거, 자막 자동 생성, 영상 클립 편집", example: "예: '유튜브 강의 영상 편집 및 자막 추가'" },
      { title: "인터뷰 녹취록 생성", detail: "인터뷰 오디오를 정확한 텍스트로 변환 및 요약", example: "예: '회의 녹취록 자동 생성 및 요약'" },
      { title: "오디오북 수정", detail: "오디오북의 특정 구간을 텍스트로 수정하여 자연스럽게 음성 변경", example: "예: '오디오북 내 오디오 수정 및 개선'" }
    ],
    integrations: [],
    link: "https://www.descript.com/",
    detail: "https://www.descript.com/",
    isKorean: false,
    isPopularKr: true,
    isPopular: true,
    competitiveAdvantage: [
      { vs: "Adobe Audition/Premiere Pro", advantage: "텍스트 기반 편집: 전문 편집 툴보다 직관적이고 효율적인 텍스트 기반 편집 워크플로우 제공." },
      { vs: "ElevenLabs (복제)", advantage: "편집 워크플로우 통합: 단순히 음성 복제를 넘어, 복제된 음성을 영상/오디오 편집 워크플로우 내에서 바로 활용하고 수정 가능." }
    ],
    icon: "FileAudio"
  },
  // 19. HeyGen
  {
    id: 19,
    name: "HeyGen",
    category: "동영상",
    rating: 4.8,
    description: "AI 아바타를 활용한 영상 생성 플랫폼. 텍스트 입력만으로 아바타가 말하는 전문적인 영상을 쉽게 제작.",
    strengths: [
      "고품질 AI 아바타: 다양한 인종, 성별, 연령대의 사실적인 아바타 제공 (HeyGen보다 더 고품질)",
      "텍스트-영상 변환: 스크립트만 입력하면 아바타가 말하는 영상 자동 생성",
      "다국어 및 다양한 목소리 지원: 여러 언어와 목소리로 영상 제작 가능",
      "배경 및 템플릿 제공: 다양한 영상 배경과 전문 템플릿으로 빠른 제작",
      "얼굴 스왑 및 커스텀 아바타 (유료)"
    ],
    weaknesses: [
      "무료 사용 시 워터마크 및 영상 길이 제한",
      "아바타의 미묘한 표정이나 제스처는 아직 부자연스러울 수 있음",
      "복잡하거나 창의적인 영상 연출에는 한계"
    ],
    freeLimitations: "1분 영상 (워터마크 포함), 제한된 아바타/목소리, 1 크레딧/월.",
    features: ["AI 아바타 영상", "텍스트-영상", "다국어 지원", "커스텀 아바타", "영상 템플릿"],
    usecases: [
      { title: "교육 및 학습 영상", detail: "강의 내용, 교육 자료를 아바타가 설명하는 영상으로 제작", example: "예: 'AI 입문 강의 영상 제작'" },
      { title: "마케팅 및 홍보 영상", detail: "제품/서비스 소개, 이벤트 안내 등 짧은 홍보 영상 제작", example: "예: '신제품 런칭 홍보 영상 제작'" },
      { title: "기업 내부 교육 자료", detail: "직원 교육, 회사 정책 안내 등 내부용 영상 제작", example: "예: '신입사원 온보딩 교육 영상'" },
      { title: "뉴스 브리핑", detail: "데일리 뉴스, 날씨 정보 등을 아바타가 전달하는 영상", example: "예: '오늘의 AI 뉴스 브리핑 영상'" }
    ],
    integrations: [],
    link: "https://www.heygen.com/",
    detail: "https://www.heygen.com/",
    isKorean: true,
    isPopularKr: true,
    isPopular: true,
    competitiveAdvantage: [
      { vs: "RunwayML", advantage: "아바타 기반 영상: RunwayML이 생성형 AI 영상 자체에 집중한다면, HeyGen은 전문적인 AI 아바타를 활용한 비즈니스 영상 제작에 특화." }
    ],
    icon: "Video"
  },
  // 20. CapCut (AI Features)
  {
    id: 20,
    name: "CapCut (AI Features)",
    category: "동영상",
    rating: 4.7,
    description: "간편한 영상 편집 기능과 강력한 AI 기능을 결합한 모바일 및 데스크톱 영상 편집 앱.",
    strengths: [
      "AI 자동 캡션/자막: 영상의 음성을 자동으로 인식하여 자막 생성 및 번역",
      "AI 배경 제거: 인물이나 객체의 배경을 자동으로 제거하여 크로마키 효과 구현",
      "AI 보정 및 미화: 인물 영상 보정, 피부 보정, 메이크업 등 AI 기반 미화 기능",
      "AI 음악 추천 및 음성 변조: 영상 분위기에 맞는 음악 추천, 다양한 음성 변조 효과",
      "자동 편집 기능: AI가 자동으로 하이라이트 구간을 선택하여 영상 편집",
      "무료 사용 가능 (대부분 기능)"
    ],
    weaknesses: [
      "고급 전문가용 편집 기능은 부족할 수 있음",
      "모바일 버전의 경우 기기 성능에 따라 편집 속도 차이",
      "생성형 AI (예: 텍스트-영상) 기능은 아직 제한적",
      "내보내기 시 워터마크 (설정으로 제거 가능)"
    ],
    freeLimitations: "대부분의 AI 기능 무료 사용 가능. 일부 프리미엄 기능은 유료 구독 필요.",
    features: ["AI 자동 자막", "AI 배경 제거", "AI 보정", "AI 음악 추천", "자동 편집"],
    usecases: [
      { title: "숏폼 영상 제작", detail: "TikTok, YouTube Shorts, Instagram Reels 등 짧은 바이럴 영상 편집", example: "예: '챌린지 숏폼 영상 편집 및 자막 추가'" },
      { title: "개인 브이로그 편집", detail: "일상 브이로그의 배경 음악, 효과, 자막 등을 손쉽게 추가", example: "예: '여행 브이로그 빠르게 편집하기'" },
      { title: "교육용 영상 편집", detail: "강의 영상에 자동 자막을 추가하여 학습 효율 높이기", example: "예: '온라인 강의 영상에 한국어 자동 자막 추가'" },
      { title: "SNS 광고 영상", detail: "간단한 제품 홍보, 이벤트 소개 영상을 전문적으로 편집", example: "예: '신상품 SNS 광고 영상 제작'" }
    ],
    integrations: [],
    link: "https://www.capcut.com/",
    detail: "https://www.capcut.com/",
    isKorean: true,
    isPopularKr: true,
    isPopular: true,
    competitiveAdvantage: [
      { vs: "RunwayML", advantage: "간편한 편집과 무료 접근성: RunwayML이 생성형 AI 영상에 집중한다면, CapCut은 기존 영상 편집에 AI 기능을 통합하여 더 쉽고 무료로 접근 가능한 편집 환경 제공." },
      { vs: "Adobe Premiere Rush", advantage: "더 강력한 AI 기능과 무료 모델: Premiere Rush보다 더 다양한 AI 기반 편집 기능(자동 자막, 배경 제거 등)을 무료로 제공하여 초보자에게 유리." }
    ],
    icon: "Scissors"
  },
  // 21. Vrew (브루)
  {
    id: 21,
    name: "Vrew (브루)",
    category: "동영상",
    rating: 4.8,
    description: "한국어에 특화된 AI 기반 영상 편집 프로그램. 음성 인식으로 자동 자막 생성 및 텍스트 편집으로 영상 편집.",
    strengths: [
      "한국어 음성 인식 정확도: 한국어 영상에 특화된 높은 음성 인식 정확도로 자동 자막 생성",
      "텍스트 기반 편집: 스크립트 텍스트를 수정하는 것처럼 영상 편집 가능 (단어 삭제 시 영상 구간 삭제)",
      "AI 목소리 (TTS) 지원: 다양한 AI 목소리로 내레이션 추가 및 수정",
      "자동 구간 분석: 공백, 웃음소리 등을 자동으로 감지하여 편집 편의성 높임",
      "무료 사용 가능 (제한적)"
    ],
    weaknesses: [
      "복잡하거나 전문적인 영상 효과 구현은 제한적",
      "고해상도 영상 처리 시 시스템 요구 사양 높을 수 있음",
      "무료 사용 시 내보내기 길이, 음성 변환 시간 등 제한"
    ],
    freeLimitations: "무료 버전은 월 10시간 영상 길이, 월 1만자 AI 목소리, 워터마크 등 제한.",
    features: ["한국어 자동 자막", "텍스트 기반 편집", "AI 목소리", "자동 구간 분석", "노이즈 제거"],
    usecases: [
      { title: "유튜브 강의/리뷰 영상", detail: "긴 강의나 리뷰 영상에 자동으로 정확한 한국어 자막 추가 및 편집", example: "예: '유튜브 온라인 강의 영상 자막 생성 및 편집'" },
      { title: "인터뷰 영상 편집", detail: "인터뷰 내용을 텍스트로 보면서 불필요한 구간 쉽게 제거", example: "예: '인터뷰 영상 불필요한 말 제거'" },
      { title: "팟캐스트 영상화", detail: "오디오만 있는 팟캐스트에 AI 목소리와 자막을 추가하여 영상으로 변환", example: "예: '음성 팟캐스트에 AI 목소리 내레이션 추가'" },
      { title: "기업 홍보/교육 영상", detail: "간단한 기업 홍보 영상이나 내부 교육 자료를 빠르고 효율적으로 제작", example: "예: '신입사원 교육 영상 자동 자막 추가'" }
    ],
    integrations: [],
    link: "https://vrew.me/",
    detail: "https://vrew.me/",
    isKorean: true,
    isPopularKr: true,
    isPopular: false,
    competitiveAdvantage: [
      { vs: "CapCut", advantage: "한국어 특화 및 텍스트 편집: CapCut보다 한국어 음성 인식 정확도가 높으며, 텍스트 기반 편집 기능이 더 강력하여 한국어 콘텐츠 제작에 매우 유리." },
      { vs: "Descript", advantage: "한국어 최적화 및 접근성: Descript가 영어권에 더 강하다면, Vrew는 한국어에 특화되어 있고 국내 사용자가 접근하기 더 쉬운 인터페이스와 가격 정책을 제공." }
    ],
    icon: "VideoIcon"
  },
  // 22. Pictory AI
  {
    id: 22,
    name: "Pictory AI",
    category: "동영상",
    rating: 4.4,
    description: "텍스트나 블로그 게시물을 기반으로 자동으로 영상을 생성해주는 AI 도구. 마케팅 및 콘텐츠 제작에 유용.",
    strengths: [
      "텍스트-영상 자동 생성: 스크립트, 블로그 게시물, 기사 등을 입력하면 자동으로 영상 제작",
      "스톡 미디어 라이브러리: 방대한 스톡 영상, 이미지, 음악 라이브러리 제공",
      "음성 내레이션: AI 음성 또는 자신의 녹음 음성을 내레이션으로 추가",
      "자동 요약 및 하이라이트: 긴 텍스트를 영상에 맞는 짧은 스크립트로 요약",
      "브랜딩 요소 추가: 로고, 색상 등 브랜드 요소를 영상에 적용 가능"
    ],
    weaknesses: [
      "무료 체험 제한적 (워터마크 포함, 길이 제한)",
      "매우 복잡하거나 창의적인 영상 연출에는 한계",
      "생성된 영상의 편집 자유도는 다소 낮을 수 있음"
    ],
    freeLimitations: "3개 영상 무료 체험 (각 10분 이내, 워터마크 포함).",
    features: ["텍스트-영상", "블로그-영상", "자동 내레이션", "스톡 미디어", "브랜딩"],
    usecases: [
      { title: "블로그 게시물 영상화", detail: "기존 블로그 글을 영상 콘텐츠로 재활용하여 접근성 높이기", example: "예: '블로그 게시물을 유튜브 쇼츠 영상으로 변환'" },
      { title: "SNS 광고 영상", detail: "짧은 광고 스크립트를 입력하여 빠르게 SNS 광고 영상 제작", example: "예: '신규 제품 홍보용 짧은 영상 제작'" },
      { title: "교육/정보 전달 영상", detail: "복잡한 텍스트 정보를 시각적인 영상으로 쉽게 설명", example: "예: '경제 트렌드 요약 영상 제작'" },
      { title: "팟캐스트 요약 영상", detail: "팟캐스트 스크립트를 짧은 영상 요약본으로 제작", example: "예: '주간 팟캐스트 에피소드 요약 영상'" }
    ],
    integrations: [],
    link: "https://pictory.ai/",
    detail: "https://pictory.ai/",
    isKorean: false,
    isPopularKr: false,
    isPopular: false,
    competitiveAdvantage: [
      { vs: "RunwayML", advantage: "텍스트 기반 자동화: RunwayML이 생성형 영상에 집중한다면, Pictory AI는 특히 '텍스트나 블로그 게시물'을 기반으로 영상을 자동으로 생성하는 데 특화되어 콘텐츠 마케터에게 유리." },
      { vs: "HeyGen", advantage: "다양한 영상 스타일: HeyGen이 아바타 기반 영상에 집중한다면, Pictory AI는 스톡 영상과 이미지 기반의 다양한 스타일 영상을 텍스트로 쉽게 생성." }
    ],
    icon: "VideoText"
  },
  // 23. Otter.ai
  {
    id: 23,
    name: "Otter.ai",
    category: "음성",
    rating: 4.7,
    description: "음성 대화를 실시간으로 텍스트로 변환하고 요약해주는 AI 회의록 도구. 회의, 강의, 인터뷰 등에 활용.",
    strengths: [
      "정확한 실시간 전사: 음성 대화를 거의 실시간으로 높은 정확도로 텍스트로 변환",
      "화자 분리: 여러 화자를 자동으로 구분하여 누가 말했는지 표시",
      "자동 요약 및 키워드: 회의 내용을 자동으로 요약하고 주요 키워드 추출",
      "실행 항목(Action Item) 추출: 회의 중 결정된 실행 항목을 자동으로 파악",
      "줌(Zoom), 구글 미트(Google Meet) 등 연동",
      "클라우드 저장 및 검색 가능"
    ],
    weaknesses: [
      "무료 사용 시 전사 시간 제한 및 일부 기능 제한",
      "한국어 음성 인식은 영어만큼 완벽하지 않을 수 있음 (주로 영어에 특화)",
      "소음이 심한 환경에서는 정확도 저하 가능성",
      "프리미엄 기능은 유료 구독 필요"
    ],
    freeLimitations: "무료 사용 시 월 30분 전사, 최대 3개 음성 파일 업로드 제한. 요약, 키워드 추출 등 일부 기능 제한.",
    features: ["실시간 전사", "화자 분리", "회의 요약", "키워드 추출", "실행 항목"],
    usecases: [
      { title: "온라인 회의록 작성", detail: "Zoom, Google Meet 등 온라인 회의 내용을 자동으로 텍스트 변환 및 요약", example: "예: '주간 기획 회의록 자동 작성'" },
      { title: "강의 노트 자동화", detail: "온라인 강의 음성을 텍스트로 변환하여 효율적인 학습 노트 생성", example: "예: '대학교 온라인 강의 노트 필기 자동화'" },
      { title: "인터뷰 녹취록 생성", detail: "인터뷰 내용을 정확한 텍스트로 변환하여 분석 및 문서화", example: "예: '시장 조사 인터뷰 녹취록 작성'" },
      { title: "아이디어 브레인스토밍 기록", detail: "구두로 진행된 브레인스토밍 내용을 빠짐없이 기록하고 정리", example: "예: '신제품 아이디어 브레인스토밍 내용 기록'" }
    ],
    integrations: ["Zoom", "Google Meet", "Microsoft Teams"],
    link: "https://otter.ai/",
    detail: "https://otter.ai/",
    isKorean: false,
    isPopularKr: false,
    isPopular: true,
    competitiveAdvantage: [
      { vs: "Google Meet (자막)", advantage: "고급 회의 기능: Google Meet의 기본 자막 기능을 넘어, Otter.ai는 화자 분리, 자동 요약, 실행 항목 추출 등 회의록 관리에 특화된 고급 기능 제공." },
      { vs: "ChatGPT (전사/요약)", advantage: "실시간성 및 회의 특화: ChatGPT가 텍스트 기반의 요약에 강하다면, Otter.ai는 실시간 음성 전사와 회의 환경에 최적화된 기능으로 현장감 있는 회의록을 생성." }
    ],
    icon: "Mic"
  },
  // 24. Krisp
  {
    id: 24,
    name: "Krisp",
    category: "음성",
    rating: 4.7,
    description: "AI 기반의 노이즈 제거 앱. 온라인 회의, 통화, 녹음 시 배경 소음과 에코를 제거하여 깨끗한 음성을 전달.",
    strengths: [
      "강력한 노이즈 제거: 배경 소음(키보드 소리, 반려동물 소리, 주변 대화 등)과 에코를 효과적으로 제거",
      "양방향 노이즈 제거: 내 목소리뿐만 아니라 상대방의 목소리에 있는 노이즈도 제거",
      "다양한 앱 지원: Zoom, Teams, Skype, Google Meet 등 모든 커뮤니케이션 앱과 호환",
      "간편한 사용법: 원클릭으로 활성화/비활성화",
      "무료 사용 가능 (제한적)"
    ],
    weaknesses: [
      "무료 사용 시 시간 제한 (월 60분)",
      "매우 심한 소음이나 특정 유형의 노이즈는 완벽하게 제거되지 않을 수 있음",
      "CPU/메모리 사용량이 다소 높을 수 있음"
    ],
    freeLimitations: "무료 버전은 월 60분 노이즈 제거 시간 제공.",
    features: ["노이즈 제거", "에코 제거", "AI 음성 처리", "백그라운드 소음 제거"],
    usecases: [
      { title: "온라인 회의 음질 개선", detail: "집이나 시끄러운 환경에서 진행되는 온라인 회의에서 깨끗한 음성 전달", example: "예: '재택근무 중 온라인 회의 시 노이즈 제거'" },
      { title: "온라인 강의/튜토리얼", detail: "강의 녹음 시 불필요한 잡음 제거, 학습 효과 증대", example: "예: '온라인 강의 녹음 시 키보드 소음 제거'" },
      { title: "팟캐스트 녹음", detail: "전문 스튜디오 없이도 깨끗한 팟캐스트 오디오 녹음", example: "예: '집에서 팟캐스트 녹음 시 배경 소음 제거'" },
      { title: "고객 지원 센터", detail: "상담원과 고객 간의 통화 품질을 개선하여 명확한 소통", example: "예: '고객 상담 통화 중 배경 잡음 제거'" }
    ],
    integrations: ["Zoom", "Google Meet", "Microsoft Teams"],
    link: "https://krisp.ai/",
    detail: "https://krisp.ai/",
    isKorean: true,
    isPopularKr: false,
    isPopular: true,
    competitiveAdvantage: [
      { vs: "회의 앱 내장 노이즈 제거", advantage: "독립적이고 강력한 성능: Zoom 등 자체 노이즈 제거 기능보다 더 강력하고 다양한 유형의 노이즈를 제거하며, 모든 오디오 앱과 호환." },
      { vs: "Descript (노이즈 제거)", advantage: "실시간 처리: Descript가 편집 단계에서 노이즈를 제거한다면, Krisp는 실시간 통화 및 회의 중에 노이즈를 제거하여 즉각적인 커뮤니케이션 품질 향상." }
    ],
    icon: "VolumeX"
  },
  // 25. Typeface
  {
    id: 25,
    name: "Typeface",
    category: "생산성",
    rating: 4.5,
    description: "브랜드 콘텐츠 제작에 특화된 생성형 AI 플랫폼. 텍스트, 이미지 등 다양한 마케팅 소재를 일관된 브랜드 톤으로 생성.",
    strengths: [
      "브랜드 일관성 유지: 브랜드 가이드라인과 톤앤매너를 학습하여 모든 콘텐츠에 일관되게 적용",
      "다양한 마케팅 소재 생성: 블로그, SNS, 이메일, 광고 등 여러 채널에 맞는 콘텐츠 생성",
      "콘텐츠 재활용: 기존 콘텐츠를 다양한 형식과 길이로 변환",
      "이미지 생성 및 편집: 텍스트 프롬프트로 이미지 생성 및 기존 이미지 편집",
      "팀 협업 및 관리 기능"
    ],
    weaknesses: [
      "무료 사용은 제한적 (주로 기업용 유료 솔루션)",
      "한국어 등 비영어권 언어 지원은 영어만큼 완벽하지 않을 수 있음",
      "소규모 팀이나 개인 사용자에게는 비용 부담이 있을 수 있음"
    ],
    freeLimitations: "데모 또는 제한된 무료 체험 제공. 주로 기업용 유료 플랜.",
    features: ["브랜드 콘텐츠", "AI 텍스트 생성", "AI 이미지 생성", "콘텐츠 재활용", "팀 협업"],
    usecases: [
      { title: "마케팅 캠페인 통합", detail: "다양한 채널별로 일관된 메시지와 디자인의 마케팅 콘텐츠 생성", example: "예: '신제품 런칭 캠페인에 필요한 SNS 게시물, 이메일, 배너 일괄 생성'" },
      { title: "기업 블로그/뉴스레터", detail: "전문적이고 브랜드 톤에 맞는 블로그 글과 뉴스레터 초안 작성", example: "예: '기업의 최신 기술 뉴스레터 작성'" },
      { title: "제품 설명서 및 가이드", detail: "제품의 특징을 명확하게 설명하는 다양한 형식의 문서 생성", example: "예: '새로운 소프트웨어 사용 설명서 초안'" },
      { title: "영업/제안서 작성", detail: "잠재 고객에게 발송할 개인화된 영업 자료 및 제안서 생성", example: "예: 'IT 솔루션 제안서 맞춤형 콘텐츠 생성'" }
    ],
    integrations: ["API"],
    link: "https://www.typeface.ai/",
    detail: "https://www.typeface.ai/",
    isKorean: false,
    isPopularKr: false,
    isPopular: false,
    competitiveAdvantage: [
      { vs: "Jasper", advantage: "통합 콘텐츠 생성: Jasper가 주로 텍스트 생성에 강하다면, Typeface는 텍스트와 이미지 등 다양한 유형의 '브랜드 콘텐츠'를 통합적으로 생성하고 관리하는 데 특화." },
      { vs: "Canva Magic Studio", advantage: "브랜드 가이드라인 심층 적용: Canva가 범용적 디자인 툴이라면, Typeface는 브랜드의 엄격한 가이드라인을 학습하여 모든 생성 콘텐츠에 일관된 톤앤매너를 유지하는 데 더 강함." }
    ],
    icon: "Ruler"
  },
  // 26. Canva Magic Studio
  {
    id: 26,
    name: "Canva Magic Studio",
    category: "이미지/디자인",
    rating: 4.8,
    description: "Canva의 AI 기능 통합 플랫폼. 텍스트-이미지 생성, 매직 편집, 자동 디자인 등 다양한 AI 기반 디자인 도구 제공.",
    strengths: [
      "올인원 디자인 플랫폼: AI 기능과 기존 디자인 도구가 완벽하게 통합",
      "직관적인 사용법: 비전문가도 쉽게 고품질 디자인 생성 가능",
      "다양한 디자인 유형 지원: SNS 콘텐츠, 프레젠테이션, 포스터, 영상 등 모든 디자인 작업",
      "AI 이미지/텍스트 생성: 프롬프트 기반으로 이미지 및 텍스트 콘텐츠 생성",
      "매직 편집: 이미지에서 특정 객체 제거, 배경 변경 등 AI 기반 편집",
      "팀 협업 기능"
    ],
    weaknesses: [
      "무료 사용은 제한적 (일부 AI 기능만 체험 가능)",
      "매우 복잡하거나 독창적인 예술 작품 생성에는 한계가 있을 수 있음",
      "AI 기능의 사용량은 유료 플랜에서 제한될 수 있음"
    ],
    freeLimitations: "일부 Magic Studio 기능 무료 체험 가능. Pro 구독 시 모든 기능 무제한.",
    features: ["AI 이미지 생성", "AI 텍스트 생성", "매직 편집", "자동 디자인", "텍스트-이미지 변환", "영상 편집"],
    usecases: [
      { title: "SNS 콘텐츠 제작", detail: "AI로 이미지와 문구를 생성하여 인스타그램, 페이스북 게시물 디자인", example: "예: '새로운 커피숍 인스타그램 게시물 디자인'" },
      { title: "마케팅 자료 디자인", detail: "광고 배너, 브로슈어, 이메일 템플릿 등 마케팅 자료 생성 및 편집", example: "예: '온라인 이벤트 홍보 배너 디자인'" },
      { title: "프레젠테이션 디자인", detail: "AI가 제안하는 디자인으로 빠르고 전문적인 발표 자료 제작", example: "예: '분기별 실적 보고서 프레젠테이션 디자인'" },
      { title: "로고 및 브랜딩", detail: "간단한 로고 디자인이나 브랜드 색상에 맞는 시각 자료 생성", example: "예: '개인 브랜딩 로고 디자인'" }
    ],
    integrations: [],
    link: "https://www.canva.com/magic/",
    detail: "https://www.canva.com/magic-studio/",
    isKorean: true,
    isPopularKr: true,
    isPopular: true,
    competitiveAdvantage: [
      { vs: "Adobe Firefly", advantage: "올인원 접근성: Firefly가 이미지 생성에 특화되어 있다면, Canva Magic Studio는 이미지, 영상, 문서 등 다양한 디자인 작업에 AI를 통합하여 더 넓은 범위의 사용성을 제공." },
      { vs: "Beautiful.ai", advantage: "사용자 친화성과 다양성: Beautiful.ai가 프레젠테이션 자동 디자인에 강하다면, Canva는 훨씬 더 다양한 디자인 유형과 직관적인 편집 기능을 제공하여 비전문가도 쉽게 사용." }
    ],
    icon: "Sparkle"
  },
  // 27. AdCreative.ai
  {
    id: 27,
    name: "AdCreative.ai",
    category: "생산성",
    rating: 4.7,
    description: "AI 기반으로 고성능 광고 소재(배너, 텍스트)를 생성하고 최적화하여 마케팅 캠페인 성과를 높이는 도구.",
    strengths: [
      "AI 기반 고성능 광고 소재 생성: 전환율 높은 광고 배너, 텍스트를 빠르게 생성",
      "다양한 플랫폼 지원: Facebook, Instagram, Google Ads, LinkedIn 등 다양한 광고 채널에 최적화",
      "타겟 고객 분석: AI가 타겟 고객의 특성을 분석하여 맞춤형 소재 제안",
      "성과 예측 및 최적화: 생성된 소재의 예상 성과를 예측하고, A/B 테스트를 통해 최적화",
      "브랜드 키트 관리: 브랜드 로고, 색상, 폰트 등을 등록하여 일관된 광고 소재 제작"
    ],
    weaknesses: [
      "무료 체험 제한적 (생성 크레딧 소모)",
      "주로 유료 구독 기반으로 운영",
      "매우 특수한 광고 캠페인에는 세부적인 조정이 어려울 수 있음",
      "AI의 성과 예측이 항상 정확하지 않을 수 있음"
    ],
    freeLimitations: "무료 체험 크레딧 제공. 이후 유료 플랜 필요.",
    features: ["AI 광고 소재", "고성능 배너", "광고 텍스트", "성과 예측", "브랜드 키트"],
    usecases: [
      { title: "온라인 광고 캠페인", detail: "다양한 소셜 미디어 및 검색 광고 플랫폼에 필요한 배너 및 텍스트 소재 생성", example: "예: '페이스북 신제품 광고 배너 10종 생성'" },
      { title: "A/B 테스트 최적화", detail: "다양한 광고 소재를 빠르게 생성하여 어떤 소재가 가장 효과적인지 테스트", example: "예: '광고 소재 A/B 테스트용 배너 생성'" },
      { title: "제품 런칭 마케팅", detail: "신제품 출시 시 필요한 광고 소재를 대량으로 생성하고 배포", example: "예: '새로운 모바일 앱 런칭 광고 소재 일괄 생성'" },
      { title: "전자상거래 광고", detail: "온라인 쇼핑몰의 제품별 맞춤형 광고 소재를 자동으로 생성", example: "예: '여름 의류 할인 프로모션 광고 배너'" }
    ],
    integrations: ["Google Ads", "Facebook Ads", "Shopify"],
    link: "https://adcreative.ai/",
    detail: "https://adcreative.ai/",
    isKorean: false,
    isPopularKr: false,
    isPopular: true,
    competitiveAdvantage: [
      { vs: "Canva Magic Studio", advantage: "광고 성과 최적화: Canva가 범용적 디자인 툴이라면, AdCreative.ai는 특히 '광고 성과'와 '전환율'에 초점을 맞춰 AI가 광고 소재를 생성하고 최적화." },
      { vs: "Writesonic", advantage: "시각적 소재와 통합: Writesonic이 주로 광고 텍스트에 강하다면, AdCreative.ai는 광고 배너 등 시각적 소재와 텍스트를 통합적으로 생성하여 광고 캠페인에 더 적합." }
    ],
    icon: "Megaphone"
  },
  // 28. ManyChat (AI 기능)
  {
    id: 28,
    name: "ManyChat (AI)",
    category: "생산성",
    rating: 4.5,
    description: "메신저 기반 마케팅 자동화 플랫폼 ManyChat에 통합된 AI 기능. 챗봇의 대화 기능을 강화.",
    strengths: [
      "AI 기반 챗봇 대화: FAQ 응답, 고객 문의 처리 등 챗봇의 대화 품질 향상",
      "자연어 처리: 사용자 의도를 이해하고 상황에 맞는 답변 제공",
      "자동화된 마케팅 캠페인: AI 챗봇을 활용하여 리드 생성, 판매 촉진 등 자동화된 캠페인 실행",
      "다양한 메신저 플랫폼 지원: Facebook Messenger, Instagram DM, WhatsApp, Telegram 등",
      "코드 없는 구축: 비개발자도 쉽게 챗봇 구축 가능"
    ],
    weaknesses: [
      "무료 플랜은 기능 제한적 (AI 기능은 대부분 유료)",
      "복잡하거나 비정형적인 고객 문의는 여전히 한계",
      "한국어 처리 성능은 영어만큼 완벽하지 않을 수 있음"
    ],
    freeLimitations: "무료 플랜은 기본 기능만 제공. AI 기능 및 고급 자동화는 유료 플랜 필요.",
    features: ["AI 챗봇", "대화 자동화", "자연어 이해", "리드 생성", "메신저 마케팅"],
    usecases: [
      { title: "고객 지원 자동화", detail: "자주 묻는 질문에 대한 챗봇 자동 응답, 고객 문의 1차 분류", example: "예: '웹사이트 고객 문의 챗봇 자동 응답 시스템'" },
      { title: "제품 추천 및 판매", detail: "사용자 대화 기반으로 맞춤형 제품 추천 및 구매 유도", example: "예: '쇼핑몰 챗봇을 통한 제품 추천 및 할인 정보 제공'" },
      { title: "이벤트/프로모션 안내", detail: "이벤트 참여, 프로모션 정보 등을 챗봇을 통해 자동 전달", example: "예: '신규 이벤트 참여 안내 챗봇'" },
      { title: "리드 생성 및 자격 부여", detail: "잠재 고객과 대화하여 정보 수집 및 리드 자격 판단", example: "예: '부동산 상담 챗봇을 통한 잠재 고객 정보 수집'" }
    ],
    integrations: ["Facebook Messenger", "Instagram DM", "WhatsApp", "Telegram", "Shopify"],
    link: "https://manychat.com/features/ai",
    detail: "https://manychat.com/features/ai",
    isKorean: false,
    isPopularKr: false,
    isPopular: false,
    competitiveAdvantage: [
      { vs: "ChatGPT (챗봇)", advantage: "메신저 마케팅 통합: ChatGPT가 범용 챗봇 API라면, ManyChat AI는 특정 메신저 플랫폼에 최적화된 마케팅 자동화 및 챗봇 기능을 통합 제공." },
      { vs: "HubSpot Chatbot", advantage: "접근성 및 메신저 특화: HubSpot 챗봇이 CRM 연동에 강하다면, ManyChat은 메신저 플랫폼에 특화되어 비개발자도 쉽게 구축하고 활용 가능." }
    ],
    icon: "MessageSquareMore"
  },
  // 29. Synthesia
  {
    id: 29,
    name: "Synthesia",
    category: "동영상",
    rating: 4.8,
    description: "AI 아바타와 텍스트-음성 변환 기술을 활용하여 전문적인 영상을 빠르게 제작하는 플랫폼.",
    strengths: [
      "고품질 AI 아바타: 다양한 인종, 성별, 연령대의 사실적인 아바타 제공 (HeyGen보다 더 고품질)",
      "다국어 및 다양한 목소리: 120개 이상의 언어와 억양으로 AI 음성 생성",
      "커스텀 아바타 생성: 실제 인물의 모습으로 AI 아바타 생성 가능",
      "스크린 레코더 및 미디어 업로드: 화면 녹화, 이미지/영상 업로드 후 AI 아바타와 결합",
      "다양한 영상 템플릿 및 배경",
      "보안 및 기업용 기능 강화"
    ],
    weaknesses: [
      "가격이 매우 비싼 편 (주로 기업/전문가용)",
      "무료 체험 기능은 매우 제한적",
      "아바타의 미묘한 감정 표현이나 제스처는 아직 완벽하지 않음",
      "복잡한 인터랙션이나 연출에는 한계"
    ],
    freeLimitations: "무료 데모 영상 제공 (워터마크 포함). 유료 플랜 필수.",
    features: ["AI 아바타 영상", "텍스트-음성", "다국어 지원", "커스텀 아바타", "영상 템플릿"],
    usecases: [
      { title: "기업 교육 및 온보딩", detail: "직원 교육, 신입사원 온보딩 영상 등을 AI 아바타로 제작하여 시간 절약", example: "예: '사내 보안 정책 교육 영상 제작'" },
      { title: "제품/서비스 시연 영상", detail: "AI 아바타가 제품 사용법이나 서비스 특징을 설명하는 영상 제작", example: "예: '새로운 소프트웨어 기능 시연 영상'" },
      { title: "마케팅 및 영업 영상", detail: "개인화된 영업 메시지, 마케팅 캠페인 홍보 영상 제작", example: "예: '잠재 고객 대상 맞춤형 제품 소개 영상'" },
      { title: "뉴스 및 보고서 영상", detail: "텍스트 기반의 뉴스나 보고서 내용을 AI 아바타가 전달하는 영상 제작", example: "예: '주간 시장 동향 보고서 요약 영상'" }
    ],
    integrations: ["API", "PowerPoint", "Google Slides"],
    link: "https://www.synthesia.io/",
    detail: "https://www.synthesia.io/",
    isKorean: false,
    isPopularKr: false,
    isPopular: true,
    competitiveAdvantage: [
      { vs: "HeyGen", advantage: "아바타 품질 및 기업 기능: HeyGen보다 아바타의 사실성, 다국어 지원, 그리고 기업 고객을 위한 보안 및 커스터마이징 기능이 더 강력." },
      { vs: "RunwayML", advantage: "아바타 기반의 전문 영상 제작: RunwayML이 생성형 AI 영상 자체에 집중한다면, Synthesia는 전문적인 AI 아바타를 활용하여 비즈니스 및 교육용 영상을 빠르고 효율적으로 제작하는 데 특화." }
    ],
    icon: "Video"
  },
  // 30. ElevenLabs (API)
  {
    id: 30,
    name: "ElevenLabs (API)",
    category: "음성",
    rating: 4.8,
    description: "개발자들이 자신의 애플리케이션에 ElevenLabs의 고품질 음성 합성 및 음성 복제 기능을 통합할 수 있도록 제공하는 API 서비스.",
    strengths: [
      "초고품질 음성 합성: 매우 자연스럽고 감정 표현이 풍부한 음성을 프로그램적으로 생성",
      "정교한 음성 복제: 짧은 오디오 샘플로 특정 인물의 목소리를 정교하게 복제 가능",
      "다국어 및 다양한 감정 지원: 텍스트를 여러 언어와 감정으로 표현하는 음성으로 변환",
      "실시간 음성 변환 (low-latency): 낮은 지연 시간으로 실시간 음성 상호작용 구현 가능",
      "확장성과 유연성: 게임, 앱, 웹 서비스 등 다양한 플랫폼에 통합 가능"
    ],
    weaknesses: [
      "개발 지식 필요: API 연동 및 데이터 처리 능력 요구",
      "비용 발생: 사용량 기반으로 과금되며, 고품질/대량 사용 시 비용 증가",
      "윤리적 고려: 음성 복제 기술의 오용 가능성에 대한 주의 필요",
      "네트워크 지연 발생 가능성"
    ],
    freeLimitations: "무료 API 키 발급 및 제한된 사용량 제공. 이후 유료 플랜으로 전환.",
    features: ["음성 합성 API", "음성 복제 API", "다국어 음성", "실시간 음성", "감정 표현"],
    usecases: [
      { title: "AI 오디오북 서비스", detail: "수많은 전자책을 자동으로 고품질 오디오북으로 변환하여 제공", example: "예: '텍스트 기반 소설을 자연스러운 오디오북으로 변환 서비스 개발'" },
      { title: "게임 캐릭터 보이스", detail: "게임 내 NPC나 캐릭터의 대사를 ElevenLabs API로 실시간 생성", example: "예: '게임 내 퀘스트 대사 AI 음성으로 자동 생성'" },
      { title: "개인화된 AI 비서", detail: "사용자 맞춤형 목소리 또는 감정으로 응답하는 AI 비서 앱 개발", example: "예: '개인화된 음성 비서 앱에 ElevenLabs 음성 통합'" },
      { title: "교육 콘텐츠 내레이션", detail: "다국어 교육 영상에 AI 음성 내레이션을 자동으로 추가", example: "예: '온라인 외국어 학습 콘텐츠에 ElevenLabs 내레이션 추가'" }
    ],
    integrations: ["Python", "Node.js", "Java", "REST API"],
    link: "https://elevenlabs.io/api",
    detail: "https://elevenlabs.io/api",
    isKorean: true,
    isPopularKr: false,
    isPopular: true,
    competitiveAdvantage: [
      { vs: "Google Text-to-Speech API", advantage: "음성 품질 및 감정 표현: Google TTS API보다 훨씬 더 자연스럽고 인간의 감정 표현에 가까운 음성을 생성하며, 음성 복제 기능이 강력." },
      { vs: "Naver Clova Voice API", advantage: "글로벌 확장성: 한국어 외에도 다양한 언어와 억양을 고품질로 지원하여 글로벌 서비스 개발에 유리." }
    ],
    icon: "Volume2"
  },
  // 31. D-ID
  {
    id: 31,
    name: "D-ID",
    category: "동영상",
    rating: 4.6,
    description: "이미지나 텍스트를 통해 사실적인 디지털 휴먼 비디오를 생성하는 AI 플랫폼.",
    strengths: [
      "사진 기반 비디오 생성: 한 장의 사진과 오디오(텍스트-음성 변환 포함)만으로 말하는 비디오 생성",
      "다양한 아바타 옵션: 스톡 아바타, 사용자 업로드 이미지, 생성 AI 이미지 등 활용",
      "텍스트-음성 변환 통합: 다양한 언어와 목소리로 스크립트를 음성으로 변환",
      "높은 사실성: 아바타의 표정과 움직임이 자연스러움",
      "API 지원으로 시스템 통합 용이"
    ],
    weaknesses: [
      "무료 체험은 제한적 (워터마크, 짧은 길이)",
      "고품질 영상 생성에는 유료 구독 또는 크레딧 소모",
      "아바타의 하반신 움직임이나 복잡한 제스처 표현에는 한계",
      "한국어 음성 인식 및 아바타 립싱크는 영어만큼 자연스럽지 않을 수 있음"
    ],
    freeLimitations: "5분 무료 비디오 생성 (워터마크 포함). 이후 유료 플랜 필요.",
    features: ["디지털 휴먼 비디오", "사진-비디오 변환", "텍스트-음성 변환", "AI 아바타"],
    usecases: [
      { title: "뉴스 브리핑", detail: "사진 속 인물이 뉴스를 전달하는 형식의 짧은 영상 제작", example: "예: '데일리 뉴스 브리핑 영상 제작'" },
      { title: "개인화된 인사말/안내", detail: "사진 속 인물이 사용자 이름으로 맞춤형 메시지를 전달하는 영상", example: "예: '이벤트 참여자에게 보내는 맞춤형 감사 영상'" },
      { title: "마케팅 캠페인", detail: "가상 인물을 활용하여 제품/서비스를 소개하는 짧은 광고 영상 제작", example: "예: 'AI 인플루언서를 활용한 신제품 광고 영상'" },
      { title: "교육 콘텐츠", detail: "특정 전문가의 사진을 활용하여 강의 영상을 제작", example: "예: '역사적 인물이 설명하는 세계사 교육 영상'" }
    ],
    integrations: ["API", "PowerPoint"],
    link: "https://www.d-id.com/",
    detail: "https://www.d-id.com/",
    isKorean: false,
    isPopularKr: false,
    isPopular: true,
    competitiveAdvantage: [
      { vs: "HeyGen/Synthesia", advantage: "사진 기반 영상 생성: HeyGen이나 Synthesia가 주로 3D 아바타나 스톡 아바타를 활용한다면, D-ID는 '한 장의 사진'만으로도 인물이 말하는 영상을 생성하여 기존 이미지를 활용하는 데 용이." }
    ],
    icon: "UserVideo"
  },
  // 32. Kasa (AI 기능)
  {
    id: 32,
    name: "Kasa (AI Features)",
    category: "AI 검색",
    rating: 4.5,
    description: "부동산 데이터와 AI 기술을 결합하여 부동산 분석, 추천, 관리 등을 돕는 플랫폼.",
    strengths: [
      "AI 기반 부동산 분석: 시세 예측, 투자 가치 평가, 지역 분석 등",
      "맞춤형 부동산 추천: 사용자 조건에 맞는 매물 AI 추천",
      "방대한 부동산 데이터 통합: 실거래가, 매물 정보, 인구 통계 등 다양한 데이터 활용",
      "부동산 시장 트렌드 분석: AI가 분석한 시장 동향 및 전망 제공",
      "간편한 인터페이스 (모바일 앱 중심)"
    ],
    weaknesses: [
      "무료 사용 시 기능 및 데이터 접근 제한",
      "모든 데이터가 실시간으로 반영되지 않을 수 있음",
      "AI 분석은 참고 자료일 뿐, 최종 결정은 사용자 판단 필요",
      "주로 국내 부동산 시장에 특화 (글로벌은 제한적)"
    ],
    freeLimitations: "일부 기본 정보 열람 가능. 고급 분석, 맞춤 추천 등은 유료 구독 필요.",
    features: ["부동산 분석", "매물 추천", "시세 예측", "시장 트렌드", "데이터 시각화"],
    usecases: [
      { title: "부동산 투자 분석", detail: "특정 지역의 아파트/빌라 시세 변화 예측, 투자 수익률 분석", example: "예: '강남구 아파트 5년 시세 변화 예측 및 투자 가치 평가'" },
      { title: "내 집 마련 최적 매물 검색", detail: "예산, 평형, 선호도(역세권, 학군 등) 입력 → '사용자 조건에 맞는 최적의 AI 추천 매물 3가지' 제안 및 예상 수익률 분석" },
      { title: "부동산 시장 동향 파악", detail: "월별/분기별 부동산 시장 보고서 및 주요 트렌드 분석", example: "예: '2024년 주택 시장 주요 트렌드 분석'" },
      { title: "부동산 가치 평가", detail: "보유 중인 부동산의 현재 가치 및 향후 가치 변화 예측", example: "예: '내 상가 건물의 예상 임대 수익 및 가치 평가'" }
    ],
    integrations: [],
    link: "https://kasa.co.kr/",
    detail: "https://kasa.co.kr/",
    isKorean: true,
    isPopularKr: true,
    isPopular: false,
    competitiveAdvantage: [
      { vs: "직방/다방", advantage: "데이터 기반 분석 및 예측: 직방/다방이 매물 정보 탐색에 강하다면, Kasa는 AI 기반의 심층적인 데이터 분석과 시세 예측 기능을 통해 투자 의사결정을 돕는 데 강점." },
      { vs: "네이버 부동산", advantage: "맞춤형 추천 및 특화 분석: 네이버 부동산보다 더 개인화된 매물 추천과 함께 AI를 활용한 상세한 부동산 가치 분석 및 시장 트렌드 예측 제공." }
    ],
    icon: "Home"
  },
  // 33. Remini
  {
    id: 33,
    name: "Remini",
    category: "이미지/디자인",
    rating: 4.7,
    description: "오래되거나 흐릿한 사진/영상을 AI로 고화질로 복원하고 개선하는 앱. 인물 사진 보정에 특히 강점.",
    strengths: [
      "사진/영상 고화질 복원: 저해상도, 흐릿하거나 손상된 사진/영상을 선명하게 복원",
      "얼굴 보정 및 미화: 인물 사진의 얼굴 디테일을 선명하게 하고, 피부를 부드럽게 보정",
      "오래된 사진 복원: 흑백 사진 컬러화, 스크래치 제거 등 노후 사진 복원",
      "AI 아바타/프로필 사진 생성: 사용자의 사진으로 다양한 스타일의 AI 아바타 생성",
      "간편한 사용법 (모바일 앱 중심)"
    ],
    weaknesses: [
      "무료 사용 시 일일 사용 제한 및 광고 포함",
      "프리미엄 기능은 유료 구독 필수",
      "복원 과정에서 AI가 임의로 디테일을 생성하여 원본과 다소 달라질 수 있음",
      "고해상도 영상 복원은 시간 소요 및 크레딧 소모 큼"
    ],
    freeLimitations: "무료 사용 시 일일 횟수 제한 (광고 시청 필요). 유료 구독 시 무제한.",
    features: ["사진 고화질", "영상 고화질", "얼굴 보정", "AI 아바타", "흑백 사진 컬러화"],
    usecases: [
      { title: "오래된 가족 사진 복원", detail: "흐릿하거나 손상된 옛 가족 사진을 선명하게 복원", example: "예: '할머니의 낡은 흑백 사진을 컬러로 복원'" },
      { title: "SNS 프로필 사진 개선", detail: "저화질 셀카나 단체 사진을 선명하고 보기 좋게 보정", example: "예: '흐릿한 셀카를 고화질 프로필 사진으로 보정'" },
      { title: "영상 화질 개선", detail: "오래된 영상이나 스마트폰으로 찍은 저화질 영상을 고화질로 개선", example: "예: '10년 전 여행 영상을 고화질로 복원'" },
      { title: "AI 프로필 사진 생성", detail: "다양한 스타일의 AI 아바타 프로필 사진을 생성하여 사용", example: "예: '나만의 AI 프로필 사진 만들기'" }
    ],
    integrations: [],
    link: "https://remini.ai/",
    detail: "https://remini.ai/",
    isKorean: true,
    isPopularKr: true,
    isPopular: true,
    competitiveAdvantage: [
      { vs: "Photoshop (AI 기능)", advantage: "자동화된 고화질 복원: Photoshop이 수동 보정에 AI 기능을 추가하는 방식이라면, Remini는 AI가 자동으로 사진/영상의 화질을 복원하고 얼굴을 보정하는 데 특화되어 비전문가도 쉽게 사용." },
      { vs: "CapCut (보정)", advantage: "초고화질 복원 전문: CapCut의 보정 기능보다 Remini는 저화질 사진/영상의 '초고화질 복원'에 독보적인 기술력을 가짐." }
    ],
    icon: "ImageUp"
  },
  // 34. Galileo AI
  {
    id: 34,
    name: "Galileo AI",
    category: "이미지/디자인",
    rating: 4.7,
    description: "텍스트 프롬프트만으로 아름다운 UI 디자인을 생성하는 AI 도구. 디자이너의 워크플로우를 혁신.",
    strengths: [
      "텍스트-UI 디자인 생성: 간단한 텍스트 프롬프트로 완벽한 UI 디자인(스크린) 생성",
      "사용자 경험(UX) 최적화: AI가 디자인 원칙을 적용하여 직관적이고 사용자 친화적인 UI 제안",
      "편집 가능한 디자인: 생성된 디자인은 Figma, Sketch 등으로 내보내 편집 가능",
      "다양한 산업 및 스타일 지원: 앱, 웹사이트 등 다양한 플랫폼과 스타일의 UI 디자인",
      "디자인 영감 및 아이디어 제안"
    ],
    weaknesses: [
      "무료 사용은 제한적 (주로 대기 목록 또는 유료 구독)",
      "아주 복잡하거나 혁신적인 UI/UX 아이디어에는 한계가 있을 수 있음",
      "AI가 생성한 디자인에 대한 세부적인 수정 필요",
      "한글 프롬프트 이해도는 영어만큼 완벽하지 않을 수 있음"
    ],
    freeLimitations: "주로 대기 목록 또는 데모 제공. 유료 구독 기반.",
    features: ["텍스트-UI 디자인", "AI UI/UX", "편집 가능한 디자인", "디자인 영감", "Figma 연동"],
    usecases: [
      { title: "앱/웹사이트 UI 초안", detail: "새로운 앱이나 웹사이트의 초기 UI 디자인을 빠르게 생성", example: "예: '식물 관리 앱의 메인 화면 UI 디자인'" },
      { title: "디자인 시스템 구축", detail: "일관된 디자인 시스템에 기반한 UI 컴포넌트 및 레이아웃 생성", example: "예: '이커머스 웹사이트의 제품 상세 페이지 UI 디자인'" },
      { title: "디자인 영감 탐색", detail: "새로운 프로젝트를 위한 다양한 UI/UX 디자인 아이디어를 탐색", example: "예: '재택근무 관리 툴의 대시보드 UI 아이디어'" },
      { title: "클라이언트 제안서", detail: "클라이언트에게 보여줄 UI 시안을 빠르고 효과적으로 제작", example: "예: '온라인 교육 플랫폼의 로그인 페이지 UI 시안'" }
    ],
    integrations: ["Figma", "Sketch"],
    link: "https://www.usegalileo.ai/",
    detail: "https://www.usegalileo.ai/",
    isKorean: false,
    isPopularKr: false,
    isPopular: true,
    competitiveAdvantage: [
      { vs: "Figma", advantage: "AI 기반 자동 생성: Figma가 수동 디자인 툴이라면, Galileo AI는 텍스트 프롬프트로 UI 디자인을 자동으로 '생성'하여 초기 디자인 단계의 생산성을 획기적으로 높임." },
      { vs: "Midjourney/DALL-E (UI 이미지)", advantage: "실제 편집 가능한 UI 생성: 이미지 생성 AI가 UI의 '이미지'를 만든다면, Galileo AI는 Figma 등에서 편집 가능한 실제 'UI 요소'와 레이아웃을 생성하여 실용성 높음." }
    ],
    icon: "SquareTerminal"
  },
];

// 총 20개의 AI 활용법 (워크플로우)
export const aiUsageGuides = [
  // 1. 강의 영상 → 브랜드 슬라이드
  {
    id: 1,
    title: "강의 영상 → 브랜드 슬라이드",
    description: "강의 영상을 요약하고, 마인드맵으로 정리한 후, 브랜드 색상에 맞춰 발표 슬라이드를 자동 생성합니다.",
    keywords: ["강의", "영상", "슬라이드", "PPT", "요약", "마인드맵", "발표", "디자인"],
    steps: [
      {
        step_number: 1,
        tool_name: "Lilys AI",
        tool_icon: "BookText", // Lilys AI 아이콘
        tool_action: "강의 요약",
        details: "New summary 클릭 → YouTube URL 붙여넣기 → '교육 영상 15분 핵심만 요약' 선택 → Generate"
      },
      {
        step_number: 2,
        tool_name: "Mapify",
        tool_icon: "GanttChart", // Mapify 아이콘
        tool_action: "요약 결과를 마인드맵으로 변환",
        details: "요약 결과 오른쪽 ‘Copy text’ → Mapify → New Map > Paste text → 생성 후 Export PNG 저장"
      },
      {
        step_number: 3,
        tool_name: "EdrawMind",
        tool_icon: "Presentation", // EdrawMind 아이콘
        tool_action: "마인드맵을 발표 그림으로 변환",
        details: "Import > MindMap PNG → One-Click PPT 누르기"
      },
      {
        step_number: 4,
        tool_name: "Beautiful.ai",
        tool_icon: "LayoutDashboard", // Beautiful.ai 아이콘
        tool_action: "PPT 디자인 및 브랜드 색상 적용",
        details: "Upload PPT → 좌측 Themes > 내 브랜드 색 선택"
      }
    ]
  },
  // 2. 유튜브 콘텐츠 기획 및 제작
  {
    id: 2,
    title: "유튜브 콘텐츠 기획 및 제작",
    description: "유튜브 영상 아이디어 발상부터 스크립트 작성, 썸네일 디자인까지 AI로 효율적으로 진행합니다.",
    keywords: ["유튜브", "콘텐츠", "기획", "스크립트", "썸네일", "영상 제작"],
    steps: [
      {
        step_number: 1,
        tool_name: "ChatGPT/Gemini",
        tool_icon: "MessageSquare", // ChatGPT/Gemini 대표 아이콘 (또는 Sparkles)
        tool_action: "아이디어 브레인스토밍",
        details: "주제 입력 후 '유튜브 영상 아이디어 10가지 제안 및 각 아이디어별 예상 시청자 반응 분석' 요청"
      },
      {
        step_number: 2,
        tool_name: "Jasper/Writesonic",
        tool_icon: "FileText", // Jasper/Writesonic 대표 아이콘
        tool_action: "영상 스크립트 초안 작성",
        details: "선택된 아이디어를 바탕으로 '유튜브 영상 스크립트 초안 작성 (서론-본론-결론, 5분 길이)' 요청"
      },
      {
        step_number: 3,
        tool_name: "Midjourney/DALL-E 3",
        tool_icon: "Image", // Midjourney/DALL-E 3 대표 아이콘
        tool_action: "썸네일 이미지 생성",
        details: "스크립트 내용을 기반으로 '클릭률 높은 유튜브 썸네일 이미지 5가지 생성' 프롬프트 입력"
      },
      {
        step_number: 4,
        tool_name: "Canva Magic Studio",
        tool_icon: "Sparkle", // Canva Magic Studio 아이콘
        tool_action: "썸네일 최종 디자인",
        details: "생성된 썸네일 이미지 가져오기 → 텍스트 추가, 색상 보정, 로고 삽입 등 최종 디자인"
      }
    ]
  },
  // 3. SNS 마케팅 콘텐츠 자동 생성
  {
    id: 3,
    title: "SNS 마케팅 콘텐츠 자동 생성",
    description: "제품/서비스 홍보를 위한 SNS 게시물 이미지와 텍스트를 AI로 자동으로 생성합니다.",
    keywords: ["SNS", "마케팅", "콘텐츠", "인스타그램", "페이스북", "광고", "이미지", "카피"],
    steps: [
      {
        step_number: 1,
        tool_name: "Writesonic/Jasper",
        tool_icon: "FileText", // Writesonic/Jasper 대표 아이콘
        tool_action: "광고 카피 작성",
        details: "제품/서비스 특징 입력 후 '인스타그램/페이스북용 200자 내외 광고 카피 3가지' 생성 요청"
      },
      {
        step_number: 2,
        tool_name: "AdCreative.ai",
        tool_icon: "Megaphone", // AdCreative.ai 아이콘
        tool_action: "고성능 광고 배너 생성",
        details: "작성된 카피와 제품 이미지 업로드 → '전환율 높은 SNS 광고 배너 5가지' 생성 요청 → 최적화된 배너 선택"
      },
      {
        step_number: 3,
        tool_name: "Canva Magic Studio",
        tool_icon: "Sparkle", // Canva Magic Studio 아이콘
        tool_action: "게시물 최종 디자인 및 예약",
        details: "생성된 광고 배너 가져오기 → 브랜드 로고, 추가 텍스트 삽입 → SNS 채널에 맞게 크기 조정 후 예약 발행"
      }
    ]
  },
  // 4. 비즈니스 보고서 및 프레젠테이션 자동화
  {
    id: 4,
    title: "비즈니스 보고서 및 프레젠테이션 자동화",
    description: "방대한 데이터를 기반으로 비즈니스 보고서를 작성하고, 전문적인 프레젠테이션까지 AI로 한 번에 만듭니다.",
    keywords: ["보고서", "프레젠테이션", "PPT", "데이터", "요약", "분석"],
    steps: [
      {
        step_number: 1,
        tool_name: "ChatGPT/Gemini (Advanced)",
        tool_icon: "SquareFunction", // 데이터 분석 관련 아이콘 (또는 MessageSquare)
        tool_action: "데이터 분석 및 핵심 요약",
        details: "엑셀/CSV 데이터 업로드 (유료 모델 필요) → '데이터 분석 후 핵심적인 인사이트 5가지와 수치 요약' 요청"
      },
      {
        step_number: 2,
        tool_name: "Notion AI/Microsoft Copilot (Word)",
        tool_icon: "Microsoft", // Microsoft Copilot 아이콘
        tool_action: "보고서 초안 작성",
        details: "요약된 인사이트를 바탕으로 '주간/월간 비즈니스 보고서 초안 작성 (서론-분석결과-결론-제언 포함)' 요청"
      },
      {
        step_number: 3,
        tool_name: "Beautiful.ai/Gamma/Tome",
        tool_icon: "LayoutDashboard", // 프레젠테이션 관련 아이콘
        tool_action: "프레젠테이션 슬라이드 생성",
        details: "보고서 초안을 복사하여 붙여넣기 → '주요 내용을 요약한 10장 이내의 발표 슬라이드 자동 생성 (브랜드 색상 적용)' 요청"
      }
    ]
  },
  // 5. 온라인 강의/회의록 및 요약본 생성
  {
    id: 5,
    title: "온라인 강의/회의록 및 요약본 생성",
    description: "온라인 강의나 회의 내용을 AI로 자동으로 녹취하고, 핵심 요약본을 만들어 효율적인 학습 및 업무를 지원합니다.",
    keywords: ["회의록", "강의", "요약", "녹취", "음성", "텍스트"],
    steps: [
      {
        step_number: 1,
        tool_name: "Otter.ai/Vrew",
        tool_icon: "Mic", // 음성 관련 아이콘
        tool_action: "실시간 음성 전사 및 화자 분리",
        details: "온라인 회의/강의 시작 전 Otter.ai/Vrew 활성화 → '실시간 음성 기록 및 화자 자동 분리' 설정"
      },
      {
        step_number: 2,
        tool_name: "Krisp",
        tool_icon: "VolumeX", // 노이즈 제거 아이콘
        tool_action: "노이즈 제거 (선택 사항)",
        details: "마이크/스피커 설정에서 Krisp 활성화 → '배경 소음 및 에코 제거' 설정 (깨끗한 녹음 환경 조성)"
      },
      {
        step_number: 3,
        tool_name: "Otter.ai/Lilys AI",
        tool_icon: "BookText", // 요약 관련 아이콘
        tool_action: "자동 요약 및 실행 항목 추출",
        details: "녹음 완료 후 '회의록 자동 요약 및 주요 키워드, 실행 항목 추출' 요청 또는 Lilys AI에 녹취록 업로드하여 요약"
      },
      {
        step_number: 4,
        tool_name: "Notion AI/Microsoft Copilot",
        tool_icon: "NotebookText", // 문서/생산성 아이콘
        tool_action: "정리된 회의록 문서화",
        details: "요약된 내용을 Notion 페이지/Word 문서에 붙여넣기 → '깔끔한 회의록 형식으로 정리 및 주요 결정 사항 하이라이트' 요청"
      }
    ]
  },
  // 6. 개인 브랜딩 및 콘텐츠 강화
  {
    id: 6,
    title: "개인 브랜딩 및 콘텐츠 강화",
    description: "개인 브랜딩을 위한 프로필 사진, 소개 문구, 짧은 홍보 영상까지 AI로 제작하여 온라인 존재감을 강화합니다.",
    keywords: ["브랜딩", "프로필", "소개", "영상", "콘텐츠", "개인"],
    steps: [
      {
        step_number: 1,
        tool_name: "Remini/DALL-E 3/Midjourney",
        tool_icon: "ImageUp", // 이미지 관련 아이콘
        tool_action: "AI 프로필 사진 생성",
        details: "자신의 사진 업로드 또는 원하는 스타일 프롬프트 입력 → '전문적이고 매력적인 AI 프로필 사진 5가지' 생성 요청"
      },
      {
        step_number: 2,
        tool_name: "ChatGPT/Jasper",
        tool_icon: "MessageSquare", // 대화/텍스트 관련 아이콘
        tool_action: "개인 소개 문구/자기소개서 작성",
        details: "자신의 강점, 목표, 경험 입력 후 'LinkedIn 프로필, 웹사이트 자기소개 문구 초안 작성 (200자)' 요청"
      },
      {
        step_number: 3,
        tool_name: "HeyGen/Synthesia/D-ID",
        tool_icon: "Video", // 영상 관련 아이콘
        tool_action: "AI 아바타 소개 영상 제작",
        details: "작성된 소개 문구 복사 → 스톡 아바타 또는 생성된 AI 프로필 사진 활용 → '1분 내외의 자기소개/전문 분야 소개 영상' 생성"
      },
      {
        step_number: 4,
        tool_name: "Canva Magic Studio",
        tool_icon: "Sparkle", // 디자인 관련 아이콘
        tool_action: "개인 브랜딩 시각 자료 디자인",
        details: "생성된 이미지와 영상 활용 → '명함, 포트폴리오 웹사이트 배너, SNS 커버 이미지 등' 개인 브랜딩 시각 자료 디자인"
      }
    ]
  },
  // 7. 아이디어 발상 및 기획서 자동화
  {
    id: 7,
    title: "아이디어 발상 및 기획서 자동화",
    description: "새로운 프로젝트나 서비스 아이디어를 AI로 발상하고, 체계적인 기획서 초안까지 빠르게 완성합니다.",
    keywords: ["아이디어", "기획", "브레인스토밍", "기획서", "문서", "프로젝트"],
    steps: [
      {
        step_number: 1,
        tool_name: "Gemini/ChatGPT",
        tool_icon: "Sparkles", // 대화/아이디어 관련 아이콘
        tool_action: "아이디어 브레인스토밍",
        details: "주제 입력 (예: '친환경 스마트 도시 아이디어') → '5가지 혁신적인 아이디어 제안 및 각 아이디어별 SWOT 분석' 요청"
      },
      {
        step_number: 2,
        tool_name: "Mapify",
        tool_icon: "GanttChart", // 마인드맵 아이콘
        tool_action: "아이디어 마인드맵 정리",
        details: "생성된 아이디어 텍스트 복사 → Mapify에 붙여넣기 → '아이디어별 핵심 키워드 마인드맵' 자동 생성 및 시각화"
      },
      {
        step_number: 3,
        tool_name: "Notion AI/Microsoft Copilot (Word)",
        tool_icon: "NotebookText", // 문서/생산성 아이콘
        tool_action: "기획서 초안 작성",
        details: "마인드맵 내용을 바탕으로 '신규 서비스/프로젝트 기획서 초안 작성 (목표, 배경, 내용, 기대효과 포함)' 요청"
      },
      {
        step_number: 4,
        tool_name: "Beautiful.ai/Gamma",
        tool_icon: "LayoutDashboard", // PPT/발표 아이콘
        tool_action: "기획 발표용 슬라이드 디자인",
        details: "기획서 초안을 가져와 '주요 내용을 요약한 15장 이내의 기획 발표용 슬라이드' 자동 생성 및 디자인"
      }
    ]
  },
  // 8. 웹사이트 콘텐츠 생성 및 최적화
  {
    id: 8,
    title: "웹사이트 콘텐츠 생성 및 최적화",
    description: "웹사이트에 필요한 블로그 글, 제품 설명, FAQ 등을 AI로 생성하고 SEO까지 최적화합니다.",
    keywords: ["웹사이트", "콘텐츠", "블로그", "SEO", "제품 설명", "FAQ"],
    steps: [
      {
        step_number: 1,
        tool_name: "Perplexity AI",
        tool_icon: "Search", // 검색 아이콘
        tool_action: "최신 정보 및 트렌드 검색",
        details: "작성할 콘텐츠 주제(예: '최신 인공지능 기술 동향') 입력 → '관련 최신 뉴스, 연구 자료 및 주요 키워드' 검색 및 요약 (출처 포함)"
      },
      {
        step_number: 2,
        tool_name: "Writesonic/Jasper",
        tool_icon: "FileText", // 텍스트/문서편집 아이콘
        tool_action: "SEO 최적화 블로그 글/제품 설명 작성",
        details: "검색된 키워드와 내용을 바탕으로 'SEO 점수 높은 블로그 글 초안 (서론, 본론 3개, 결론 포함)' 생성 요청"
      },
      {
        step_number: 3,
        tool_name: "GrammarlyGo",
        tool_icon: "SpellCheck", // 교정/편집 아이콘
        tool_action: "콘텐츠 교정 및 개선",
        details: "작성된 콘텐츠를 복사하여 붙여넣기 → '문법, 맞춤법 오류 수정 및 가독성, 명확성 개선 제안 적용'"
      },
      {
        step_number: 4,
        tool_name: "DALL-E 3/Firefly",
        tool_icon: "Palette", // 이미지/디자인 아이콘
        tool_action: "웹사이트 삽입 이미지 생성",
        details: "콘텐츠 내용에 맞는 '고품질 웹사이트 삽입 이미지 3가지' 생성 프롬프트 입력"
      }
    ]
  },
  // 9. 다국어 콘텐츠 번역 및 현지화
  {
    id: 9,
    title: "다국어 콘텐츠 번역 및 현지화",
    description: "기존 콘텐츠를 AI로 빠르게 번역하고, 현지 문화에 맞게 현지화하여 글로벌 시장에 효과적으로 진출합니다.",
    keywords: ["번역", "현지화", "글로벌", "다국어", "콘텐츠"],
    steps: [
      {
        step_number: 1,
        tool_name: "DeepL 번역",
        tool_icon: "Languages", // 번역 아이콘
        tool_action: "콘텐츠 번역",
        details: "원본 텍스트(예: '제품 설명서')를 복사 → '영어를 포함한 3개 언어(일본어, 중국어)로 번역하고 각 언어별 뉘앙스 차이 설명' 요청"
      },
      {
        step_number: 2,
        tool_name: "ElevenLabs",
        tool_icon: "Volume2", // 음성 아이콘
        tool_action: "다국어 내레이션/음성 생성",
        details: "번역된 텍스트를 입력 → '각 언어별 자연스러운 AI 음성 내레이션' 생성 (성우 선택 및 감정 표현 조절)"
      },
      {
        step_number: 3,
        tool_name: "HeyGen/Synthesia",
        tool_icon: "Video", // 동영상 아이콘
        tool_action: "다국어 아바타 영상 제작",
        details: "생성된 다국어 음성과 스크립트를 활용 → '각 언어를 구사하는 AI 아바타 홍보 영상' 제작"
      }
    ]
  },
  // 10. 부동산 시장 분석 및 투자 가이드
  {
    id: 10,
    title: "부동산 시장 분석 및 투자 가이드",
    description: "AI 기반으로 부동산 시장 데이터를 분석하고, 개인 맞춤형 투자 매물을 추천하여 현명한 결정을 돕습니다.",
    keywords: ["부동산", "투자", "시장 분석", "시세", "매물", "추천"],
    steps: [
      {
        step_number: 1,
        tool_name: "Kasa (AI Features)",
        tool_icon: "Home", // 부동산 관련 아이콘
        tool_action: "부동산 시장 트렌드 분석",
        details: "원하는 지역(예: '강남구 아파트') 입력 → '최근 1년 시세 변동, 거래량, 주요 개발 호재 등' 데이터 분석 및 보고서 생성"
      },
      {
        step_number: 2,
        tool_name: "Kasa (AI Features)",
        tool_icon: "Home", // 부동산 관련 아이콘
        tool_action: "맞춤형 매물 추천",
        details: "예산, 평형, 선호도(역세권, 학군 등) 입력 → '사용자 조건에 맞는 최적의 AI 추천 매물 3가지' 제안 및 예상 수익률 분석"
      },
      {
        step_number: 3,
        tool_name: "ChatGPT/Gemini",
        tool_icon: "MessageSquare", // 대화 관련 아이콘
        tool_action: "투자 위험 요소 및 전략 자문",
        details: "추천된 매물 정보를 바탕으로 '해당 매물의 투자 위험 요소 및 장기 투자 전략'에 대한 AI 자문 요청"
      }
    ]
  },
  // 11. 강의 요약 → PPT 제작
  {
    id: 11,
    title: "강의 요약 → PPT 제작",
    description: "강의 영상의 핵심 내용을 요약하고, 이를 기반으로 마인드맵과 발표 자료를 효율적으로 생성합니다.",
    keywords: ["강의", "요약", "PPT", "프레젠테이션", "마인드맵", "교육"],
    steps: [
      {
        step_number: 1,
        tool_name: "Lilys AI",
        tool_icon: "BookText", // Lilys AI 아이콘
        tool_action: "강의 영상 핵심 요약",
        details: "Lilys AI 접속 → 'New summary' 클릭 → YouTube URL 붙여넣기 → '교육 영상 15분 핵심만 요약' 선택 → 'Generate' 클릭"
      },
      {
        step_number: 2,
        tool_name: "Mapify",
        tool_icon: "GanttChart", // Mapify 아이콘
        tool_action: "요약 결과를 마인드맵으로 변환",
        details: "Lilys AI 요약 결과 오른쪽 'Copy text' 클릭 → Mapify 접속 → 'New Map > Paste text' 선택 → '생성' 후 PNG 이미지로 저장"
      },
      {
        step_number: 3,
        tool_name: "EdrawMind",
        tool_icon: "Presentation", // EdrawMind 아이콘
        tool_action: "마인드맵을 발표 슬라이드로 변환",
        details: "EdrawMind 웹 버전 접속 → 'Import > MindMap PNG' 선택하여 마인드맵 이미지 업로드 → 'One-Click PPT' 버튼 클릭하여 PPT 자동 생성"
      },
      {
        step_number: 4,
        tool_name: "Beautiful.ai",
        tool_icon: "LayoutDashboard", // Beautiful.ai 아이콘
        tool_action: "PPT 디자인 및 브랜드 색상 적용",
        details: "Beautiful.ai 접속 → 'Upload PPT' 선택하여 생성된 PPT 파일 업로드 → 좌측 Themes 탭에서 '내 브랜드 색상' 선택하여 디자인 적용"
      }
    ]
  },
  // 12. 동영상으로 PPT 제작하기 (2단계 예시)
  {
    id: 12,
    title: "동영상으로 PPT 제작하기",
    description: "짧은 동영상 콘텐츠의 핵심 내용을 추출하고, 이를 기반으로 발표 자료를 빠르게 생성합니다.",
    keywords: ["동영상", "PPT", "제작", "요약", "발표", "콘텐츠"],
    steps: [
      {
        step_number: 1,
        tool_name: "Lilys AI",
        tool_icon: "BookText", // Lilys AI 아이콘
        tool_action: "원하는 동영상 내용 요약",
        details: "Lilys AI 접속 → 'New summary' 클릭 → 동영상 URL 붙여넣기 → '동영상 내용 핵심 요약' 선택 → 'Generate' 클릭"
      },
      {
        step_number: 2,
        tool_name: "Gamma",
        tool_icon: "LayoutDashboard", // Gamma 아이콘
        tool_action: "요약 내용을 기반으로 PPT 생성",
        details: "Gamma 접속 → '새 프레젠테이션' 생성 → 요약된 내용 붙여넣기 → '자동 슬라이드 생성' 기능 활용하여 PPT 초안 제작 및 디자인"
      }
    ]
  },
  // 13. 제품 리뷰 영상 제작 (2단계 예시)
  {
    id: 13,
    title: "제품 리뷰 영상 제작",
    description: "텍스트 기반으로 제품 리뷰 스크립트를 작성하고, AI 아바타를 활용하여 전문적인 리뷰 영상을 빠르게 만듭니다.",
    keywords: ["제품 리뷰", "영상 제작", "스크립트", "AI 아바타", "마케팅"],
    steps: [
      {
        step_number: 1,
        tool_name: "Writesonic",
        tool_icon: "FileText", // Writesonic 아이콘
        tool_action: "제품 리뷰 스크립트 작성",
        details: "Writesonic 접속 → '제품 리뷰' 템플릿 선택 → 제품명, 특징, 장단점 입력 → '스크립트 초안 생성' 요청"
      },
      {
        step_number: 2,
        tool_name: "HeyGen",
        tool_icon: "Video", // HeyGen 아이콘
        tool_action: "AI 아바타 활용 리뷰 영상 제작",
        details: "HeyGen 접속 → AI 아바타 선택 → 작성된 스크립트 붙여넣기 → '영상 생성' 클릭하여 아바타가 말하는 리뷰 영상 제작"
      }
    ]
  },
  // 14. 채용 자기소개서 초안 및 검토
  {
    id: 14,
    title: "채용 자기소개서 초안 및 검토",
    description: "AI를 활용하여 자기소개서 초안을 작성하고, 표절 및 AI 생성 여부를 검토하여 완성도를 높입니다.",
    keywords: ["자기소개서", "자소서", "채용", "취업", "글쓰기", "표절"],
    steps: [
      {
        step_number: 1,
        tool_name: "Wrtn (뤼튼)",
        tool_icon: "AlignJustify", // Wrtn 아이콘
        tool_action: "자기소개서 초안 작성",
        details: "Wrtn 접속 → '자기소개서' 템플릿 선택 → 성장 과정, 강점 등 핵심 내용 입력 → '초안 생성' 요청"
      },
      {
        step_number: 2,
        tool_name: "무하유 (카피킬러)",
        tool_icon: "ClipboardList", // 카피킬러 아이콘
        tool_action: "초안 표절 검사",
        details: "작성된 자소서 초안 복사 → 카피킬러에 붙여넣기 → '표절률 검사' 실행 → 유사 문장 확인 및 수정"
      },
      {
        step_number: 3,
        tool_name: "무하유 (GPT킬러)",
        tool_icon: "CheckShield", // GPT킬러 아이콘
        tool_action: "AI 생성 여부 검토",
        details: "수정된 자소서 내용 복사 → GPT킬러에 붙여넣기 → 'AI 생성 여부 판별' 실행 → AI가 작성한 것으로 의심되는 부분 확인 및 자연스럽게 수정"
      }
    ]
  },
  // 15. 이메일 마케팅 자동화
  {
    id: 15,
    title: "이메일 마케팅 자동화",
    description: "AI로 잠재 고객을 위한 매력적인 이메일 콘텐츠를 생성하고, 캠페인을 최적화합니다.",
    keywords: ["이메일", "마케팅", "자동화", "광고", "캠페인"],
    steps: [
      {
        step_number: 1,
        tool_name: "Copy.ai",
        tool_icon: "FileText", // Copy.ai 아이콘
        tool_action: "이메일 마케팅 카피 작성",
        details: "Copy.ai 접속 → 'Email Marketing' 템플릿 선택 → 캠페인 목적, 타겟 고객, 제품 정보 입력 → '다양한 이메일 카피' 생성 및 선택"
      },
      {
        step_number: 2,
        tool_name: "AdCreative.ai",
        tool_icon: "Megaphone", // AdCreative.ai 아이콘
        tool_action: "이메일 내 이미지 광고 소재 생성",
        details: "이메일 내용과 어울리는 이미지 프롬프트 입력 → '고성능 광고 배너' 생성 → 이메일 콘텐츠에 삽입"
      },
      {
        step_number: 3,
        tool_name: "GrammarlyGo",
        tool_icon: "SpellCheck", // GrammarlyGo 아이콘
        tool_action: "영문 이메일 최종 교정",
        details: "작성된 영문 이메일 복사 → GrammarlyGo에 붙여넣기 → '문법, 철자, 어조' 등 최종 교정 및 개선 제안 적용"
      }
    ]
  },
  // 16. 온라인 교육 자료 제작
  {
    id: 16,
    title: "온라인 교육 자료 제작",
    description: "교육 콘텐츠 기획부터 슬라이드 디자인, 음성 내레이션까지 AI로 효율적으로 만듭니다.",
    keywords: ["교육", "온라인 강의", "학습 자료", "PPT", "내레이션"],
    steps: [
      {
        step_number: 1,
        tool_name: "Gamma",
        tool_icon: "LayoutDashboard", // Gamma 아이콘
        tool_action: "강의 내용 기반 슬라이드 초안 생성",
        details: "Gamma 접속 → '새 프레젠테이션' 생성 → 강의 주제 및 핵심 내용 입력 → '자동 슬라이드 생성' 요청"
      },
      {
        step_number: 2,
        tool_name: "ElevenLabs",
        tool_icon: "Volume2", // ElevenLabs 아이콘
        tool_action: "AI 음성 내레이션 추가",
        details: "슬라이드별 텍스트 복사 → ElevenLabs에 붙여넣기 → '자연스러운 AI 음성 내레이션' 생성 → 영상에 삽입"
      },
      {
        step_number: 3,
        tool_name: "Canva Magic Studio",
        tool_icon: "Sparkle", // Canva Magic Studio 아이콘
        tool_action: "교육 자료 시각적 디자인 보강",
        details: "Gamma에서 생성된 슬라이드(PDF/PNG) 가져오기 → '매직 스튜디오' 활용하여 이미지, 아이콘 추가 및 최종 디자인 보강"
      }
    ]
  },
  // 17. 아이디어 시각화 및 마인드맵
  {
    id: 17,
    title: "아이디어 시각화 및 마인드맵",
    description: "복잡한 아이디어나 정보를 AI로 마인드맵으로 변환하고, 시각적으로 매력적인 자료로 만듭니다.",
    keywords: ["아이디어", "시각화", "마인드맵", "정리", "브레인스토밍"],
    steps: [
      {
        step_number: 1,
        tool_name: "Mapify",
        tool_icon: "GanttChart", // Mapify 아이콘
        tool_action: "텍스트를 마인드맵으로 자동 변환",
        details: "Mapify 접속 → 'New Map > Paste text' 선택 → 아이디어 텍스트 붙여넣기 → '마인드맵 자동 생성'"
      },
      {
        step_number: 2,
        tool_name: "EdrawMind",
        tool_icon: "Presentation", // EdrawMind 아이콘
        tool_action: "마인드맵을 PPT로 변환",
        details: "생성된 마인드맵 파일 가져오기 (PNG/JPG) → 'One-Click PPT' 기능으로 발표 자료 생성"
      },
      {
        step_number: 3,
        tool_name: "Canva Magic Studio",
        tool_icon: "Sparkle", // Canva Magic Studio 아이콘
        tool_action: "마인드맵/PPT 디자인 보강",
        details: "생성된 마인드맵 이미지 또는 PPT 파일 가져오기 → '매직 스튜디오' 활용하여 시각적 요소 추가 및 디자인 완성"
      }
    ]
  },
  // 18. SNS 숏폼 영상 제작
  {
    id: 18,
    title: "SNS 숏폼 영상 제작",
    description: "짧은 광고나 홍보 영상을 AI로 빠르게 생성하고 편집하여 소셜 미디어에 최적화된 콘텐츠를 만듭니다.",
    keywords: ["SNS", "숏폼", "영상", "광고", "틱톡", "인스타그램"],
    steps: [
      {
        step_number: 1,
        tool_name: "HeyGen",
        tool_icon: "Video", // HeyGen 아이콘
        tool_action: "AI 아바타 영상 스크립트 입력",
        details: "HeyGen 접속 → 아바타 선택 → '짧은 광고/홍보 스크립트' 입력 → 아바타가 말하는 영상 초안 생성"
      },
      {
        step_number: 2,
        tool_name: "CapCut (AI Features)",
        tool_icon: "Scissors", // CapCut 아이콘
        tool_action: "영상 편집 및 자동 자막 추가",
        details: "생성된 영상 가져오기 → 'AI 자동 자막' 기능 활성화 → 배경 음악, 효과 추가 및 불필요한 구간 편집"
      },
      {
        step_number: 3,
        tool_name: "Remini",
        tool_icon: "ImageUp", // Remini 아이콘
        tool_action: "최종 영상 고화질 및 보정",
        details: "편집 완료된 영상 업로드 → '영상 고화질 복원' 기능으로 최종 영상 품질 개선"
      }
    ]
  },
  // 19. 개인 포트폴리오/이력서 강화
  {
    id: 19,
    title: "개인 포트폴리오/이력서 강화",
    description: "AI로 개인 브랜딩을 위한 프로필 사진, 자기소개서, 포트폴리오 디자인을 자동화합니다.",
    keywords: ["포트폴리오", "이력서", "자기소개서", "브랜딩", "사진"],
    steps: [
      {
        step_number: 1,
        tool_name: "Remini",
        tool_icon: "ImageUp", // Remini 아이콘
        tool_action: "AI 프로필 사진 생성 및 보정",
        details: "자신의 사진 업로드 → 'AI 아바타/프로필 사진' 생성 또는 '저화질 사진 고화질 복원' 및 얼굴 보정"
      },
      {
        step_number: 2,
        tool_name: "ChatGPT/Gemini",
        tool_icon: "MessageSquare", // 대화 관련 아이콘
        tool_action: "개인 강점 분석 및 자기소개서 초안",
        details: "자신의 강점, 목표, 경험 입력 → '강점 분석 및 지원 직무에 맞는 자기소개서 초안' 요청"
      },
      {
        step_number: 3,
        tool_name: "Resume.io",
        tool_icon: "ClipboardList", // Resume.io 아이콘
        tool_action: "이력서 디자인 및 키워드 최적화",
        details: "작성된 자기소개서 내용 활용 → 'ATS 통과율 높은 이력서 템플릿' 선택 → 키워드 자동 삽입 및 디자인"
      },
      {
        step_number: 4,
        tool_name: "Canva Magic Studio",
        tool_icon: "Sparkle", // Canva Magic Studio 아이콘
        tool_action: "포트폴리오 디자인 및 시각화",
        details: "생성된 이미지와 텍스트 활용 → '개인 포트폴리오 웹사이트/PDF 디자인' 또는 '작업물 시각화' (템플릿 활용)"
      }
    ]
  },
  // 20. 블로그 콘텐츠 제작 및 SEO 최적화
  {
    id: 20,
    title: "블로그 콘텐츠 제작 및 SEO 최적화",
    description: "블로그 글 작성부터 SEO 최적화, 이미지 생성까지 AI로 효율적으로 처리하여 콘텐츠 도달률을 높입니다.",
    keywords: ["블로그", "콘텐츠", "SEO", "글쓰기", "이미지", "최적화"],
    steps: [
      {
        step_number: 1,
        tool_name: "Perplexity AI",
        tool_icon: "Search", // 검색 아이콘
        tool_action: "블로그 주제 및 키워드 리서치",
        details: "블로그 주제(예: 'AI 마케팅 트렌드') 입력 → '최신 정보, 관련 키워드, 잠재적 질문' 검색 및 요약 (출처 포함)"
      },
      {
        step_number: 2,
        tool_name: "Writesonic/Jasper",
        tool_icon: "FileText", // 텍스트/문서편집 아이콘
        tool_action: "SEO 최적화 블로그 글 초안 작성",
        details: "리서치 결과와 키워드를 바탕으로 'SEO 점수 높은 블로그 글 초안 (서론, 본론 3개, 결론 포함)' 생성 요청"
      },
      {
        step_number: 3,
        tool_name: "GrammarlyGo",
        tool_icon: "SpellCheck", // 교정/편집 아이콘
        tool_action: "영문 블로그 글 교정 및 개선",
        details: "작성된 영문 블로그 글 복사 → GrammarlyGo에 붙여넣기 → '문법, 스타일, 어조' 등 최종 교정 및 개선 제안 적용"
      },
      {
        step_number: 4,
        tool_name: "Midjourney/DALL-E 3",
        tool_icon: "Image", // 이미지 아이콘
        tool_action: "블로그 게시물 삽입 이미지 생성",
        details: "블로그 글의 내용에 맞는 '고품질 삽화 또는 대표 이미지 2-3가지' 생성 프롬프트 입력"
      }
    ]
  }
];

// 카테고리 목록
export const categories = [
  { id: 'all', name: '전체', icon: 'Globe' },
  { id: '대화', name: '대화', icon: 'MessageSquare' },
  { id: '문서편집', name: '문서편집', icon: 'FilePen' },
  { id: '이미지/디자인', name: '이미지/디자인', icon: 'Palette' },
  { id: '동영상', name: '동영상', icon: 'Video' },
  { id: '음성', name: '음성', icon: 'Mic' },
  { id: 'PPT/발표', name: 'PPT/발표', icon: 'Presentation' },
  { id: '생산성', name: '생산성', icon: 'Hourglass' },
  { id: '협업', name: '협업', icon: 'Users' },
  { id: 'AI 검색', name: 'AI 검색', icon: 'Search' },
  { id: '채용', name: '채용', icon: 'Handshake' },
  { id: '코딩/노코드', name: '코딩/노코드', icon: 'Laptop' },
];

// 총 20개의 AI 활용법 (워크플로우)
export const aiWorkflows = [
  // 1. 강의 영상 → 브랜드 슬라이드
  {
    id: 1,
    title: "강의 영상 → 브랜드 슬라이드",
    description: "강의 영상을 요약하고, 마인드맵으로 정리한 후, 브랜드 색상에 맞춰 발표 슬라이드를 자동 생성합니다.",
    keywords: ["강의", "영상", "슬라이드", "PPT", "요약", "마인드맵", "발표", "디자인"],
    steps: [
      {
        step_number: 1,
        tool_name: "Vrew (브루)",
        tool_action: "강의 요약",
        details: "YouTube URL 붙여넣기 → '교육 영상 15분 핵심만 요약' 선택 → Generate"
      },
      {
        step_number: 2,
        tool_name: "ChatGPT",
        tool_action: "요약 결과를 마인드맵으로 변환",
        details: "요약 결과를 바탕으로 마인드맵 형태로 정리 요청"
      },
      {
        step_number: 3,
        tool_name: "Canva Magic Studio",
        tool_action: "발표 슬라이드 생성",
        details: "마인드맵 내용을 바탕으로 PPT 슬라이드 생성 및 브랜드 색상 적용"
      }
    ]
  },
  // 2. 유튜브 콘텐츠 기획 및 제작
  {
    id: 2,
    title: "유튜브 콘텐츠 기획 및 제작",
    description: "유튜브 영상 아이디어 발상부터 스크립트 작성, 썸네일 디자인까지 AI로 효율적으로 진행합니다.",
    keywords: ["유튜브", "콘텐츠", "기획", "스크립트", "썸네일", "영상 제작"],
    steps: [
      {
        step_number: 1,
        tool_name: "ChatGPT",
        tool_action: "아이디어 브레인스토밍",
        details: "주제 입력 후 '유튜브 영상 아이디어 10가지 제안 및 각 아이디어별 예상 시청자 반응 분석' 요청"
      },
      {
        step_number: 2,
        tool_name: "Wrtn (뤼튼)",
        tool_action: "영상 스크립트 초안 작성",
        details: "선택된 아이디어를 바탕으로 '유튜브 영상 스크립트 초안 작성 (서론-본론-결론, 5분 길이)' 요청"
      },
      {
        step_number: 3,
        tool_name: "Midjourney",
        tool_action: "썸네일 이미지 생성",
        details: "스크립트 내용을 기반으로 '클릭률 높은 유튜브 썸네일 이미지 5가지 생성' 프롬프트 입력"
      },
      {
        step_number: 4,
        tool_name: "Canva Magic Studio",
        tool_action: "썸네일 최종 디자인",
        details: "생성된 썸네일 이미지 가져오기 → 텍스트 추가, 색상 보정, 로고 삽입 등 최종 디자인"
      }
    ]
  },
  // 3. SNS 마케팅 콘텐츠 자동 생성
  {
    id: 3,
    title: "SNS 마케팅 콘텐츠 자동 생성",
    description: "제품/서비스 홍보를 위한 SNS 게시물 이미지와 텍스트를 AI로 자동으로 생성합니다.",
    keywords: ["SNS", "마케팅", "콘텐츠", "인스타그램", "페이스북", "광고", "이미지", "카피"],
    steps: [
      {
        step_number: 1,
        tool_name: "Copy.ai",
        tool_action: "광고 카피 작성",
        details: "제품/서비스 특징 입력 후 '인스타그램/페이스북용 200자 내외 광고 카피 3가지' 생성 요청"
      },
      {
        step_number: 2,
        tool_name: "AdCreative.ai",
        tool_action: "고성능 광고 배너 생성",
        details: "작성된 카피와 제품 이미지 업로드 → '전환율 높은 SNS 광고 배너 5가지' 생성 요청 → 최적화된 배너 선택"
      },
      {
        step_number: 3,
        tool_name: "Canva Magic Studio",
        tool_action: "게시물 최종 디자인 및 예약",
        details: "생성된 광고 배너 가져오기 → 브랜드 로고, 추가 텍스트 삽입 → SNS 채널에 맞게 크기 조정 후 예약 발행"
      }
    ]
  }
];

// aiTools 유틸리티 함수들
export const getToolsByCategory = (category) => {
  if (category === 'all') return aiTools;
  return aiTools.filter(tool => tool.category === category);
};

export const getPopularTools = () => {
  return aiTools.filter(tool => tool.isPopularKr || tool.isPopular);
};

export const getFreeTools = () => {
  return aiTools.filter(tool => tool.freeLimitations && tool.freeLimitations.toLowerCase().includes("무료"));
};

export const searchTools = (query) => {
  const searchTerm = query.toLowerCase();
  return aiTools.filter(tool => 
    tool.name.toLowerCase().includes(searchTerm) ||
    tool.description.toLowerCase().includes(searchTerm) ||
    tool.category.toLowerCase().includes(searchTerm)
  );
};

export const getSortedTools = (sortBy = 'name') => {
  return [...aiTools].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'popular':
        return (b.isPopularKr || b.isPopular) - (a.isPopularKr || a.isPopular);
      default:
        return 0;
    }
  });
};
