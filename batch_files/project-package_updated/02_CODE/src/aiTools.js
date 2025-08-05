// src/data/aiTools.js
export const aiTools = [
  // 1. ChatGPT
  {
    id: 1,
    name: "ChatGPT",
    category: "대화", // 세분화된 카테고리
    rating: 4.9,
    description: "범용 대화형 생성 AI의 표준. 자연스러운 언어 처리, 방대한 지식 기반, 코드/문서/상담/기획 등 다방면 활용. 대화·코드·차트 올인원 생태계.",
    strengths: [
      "대부분의 질문에 바로 답변, 전문·일상 대화 모두 자연스러움",
      "글쓰기·요약·번역·기획 등 글 생산에 강력 (마케팅, 이메일, 보고서 등)",
      "코드 생성·오류 수정 등 프로그래밍 학습/실전 모두 활용 가능",
      "다양한 템플릿/프롬프트로 정보정리·학습·자동화 가능",
      "대화·코드·차트 올인원 생태계"
    ],
    weaknesses: [
      "최신 뉴스/이슈/트렌드는 즉시 반영 안 됨 (업데이트 지연)",
      "긴 대화/문맥에서 앞서 말한 내용 일부 잊거나 혼동",
      "코드/수식/전문용어에서 오류나 과장 설명 가끔 발생",
      "무료는 GPT-3.5만 사용, 이미지/파일 업로드 등 제한",
      "근거 자동 제공 안 됨 → 숫자·사실은 따로 검증 필수"
    ],
    freeLimitations:
      "무료 사용시 최신 모델(GPT-4o 등) 및 고급 플러그인, 파일업로드/분석 불가. API 사용 불가. GPT-4o·파일 분석 안됨.",
    features: ["자연어 대화", "코드 생성/디버깅", "문서 요약", "다국어 번역", "아이디어"],
    usecases: [
      {
        title: "보고서/기획서 작성",
        detail: "초안 작성, 아이디어 구체화, 내용 보완",
        example: "예: '마케팅 기획서 초안 작성'",
      },
      {
        title: "학습 및 연구 보조",
        detail: "복잡한 개념 설명, 자료 요약, 아이디어 확장",
        example: "예: '양자역학 쉽게 설명해 줘'",
      },
      {
        title: "코딩 및 개발 지원",
        detail: "코드 생성, 오류 디버깅, 개발 문서 작성",
        example: "예: 'Python으로 웹 스크래핑 코드 작성'",
      },
    ],
    integrations: ["API", "웹"],
    link: "https://chat.openai.com/",
    detail: "https://openai.com/chatgpt/",
    isKorean: false,
    isPopularKr: true,
    isPopular: true,
    // 경쟁 우위 정보
    competitiveAdvantage: [
      {
        targetTool: "Gemini",
        advantage: "범용성 및 안정적인 성능: 다양한 작업에 걸쳐 전반적으로 뛰어난 결과 제공, 특히 글쓰기 및 코드 생성에서 강점. 폭넓은 생태계와 사용자 커뮤니티가 강점입니다."
      },
      {
        targetTool: "Claude",
        advantage: "긴 컨텍스트 처리 능력은 Claude가 더 강할 수 있으나, ChatGPT는 더 넓은 기능 범위와 강력한 API 연동성을 제공합니다."
      }
    ]
  },
  // 2. Gemini
  {
    id: 2,
    name: "Gemini",
    category: "대화", // 세분화된 카테고리
    rating: 4.8,
    description: "구글의 최신 AI 모델. 멀티모달 기능(텍스트, 이미지, 오디오, 비디오) 통합, 강력한 추론 능력과 정보 검색. 멀티모달 + 구글 Docs·Drive 통합 편집 최강.",
    strengths: [
      "최신 구글 정보 반영 (Google Search 통합)",
      "텍스트 외 이미지, 오디오, 비디오 등 멀티모달 입력 처리",
      "복잡한 추론 및 분석 능력 (데이터 분석, 보고서 작성)",
      "다국어 성능 우수, 특히 한국어 자연스러움",
      "멀티모달 + 구글 Docs·Drive 통합 편집 최강"
    ],
    weaknesses: [
      "아직 일부 기능은 실험 단계",
      "긴 문맥 유지에 한계",
      "때때로 일반적인 질문에 과도하게 장황한 답변",
      "무료 버전은 기능 제한적",
      "Ultra $249 고가; 한글 미세 뉘앙스는 HyperCLOVA X가 더 자연"
    ],
    freeLimitations:
      "무료 버전은 Gemini Pro 모델 사용, Advanced 모델(Ultra) 및 추가 기능은 유료. Pro 모델 접근 불가.",
    features: [
      "멀티모달",
      "실시간 정보 검색",
      "코드 생성",
      "텍스트/이미지/음성 분석",
    ],
    usecases: [
      {
        title: "최신 정보 검색 및 요약",
        detail: "구글 검색 연동으로 실시간 정보 제공 및 분석",
        example: "예: '오늘의 주식 시장 동향 알려줘'",
      },
      {
        title: "보고서 및 자료 분석",
        detail: "방대한 데이터에서 핵심 정보 추출 및 시각화",
        example: "예: '2024년 경제 전망 보고서 분석'",
      },
      {
        title: "아이디어 브레인스토밍",
        detail: "다양한 아이디어 생성 및 시나리오 구상",
        example: "예: '새로운 제품 마케팅 아이디어 제안'",
      },
    ],
    integrations: ["Google Workspace", "API", "웹"],
    link: "https://gemini.google.com/",
    detail: "https://gemini.google.com/",
    isKorean: true,
    isPopularKr: true,
    isPopular: true,
    // 경쟁 우위 정보
    competitiveAdvantage: [
      {
        targetTool: "ChatGPT",
        advantage: "멀티모달 기능: 텍스트뿐만 아니라 이미지, 음성 등 다양한 입력 형태를 이해하고 처리하는 능력이 ChatGPT보다 우수합니다. 구글 서비스와의 강력한 연동성도 차별점입니다."
      },
      {
        targetTool: "Bing AI Copilot",
        advantage: "범용성 및 기능 확장성: Bing AI Copilot이 검색에 특화되어 있다면, Gemini는 구글 생태계 전반과 연동되며 더 다양한 확장 기능을 제공합니다."
      }
    ]
  },
  // 3. Wrtn (뤼튼)
  {
    id: 3,
    name: "Wrtn (뤼튼)",
    category: "텍스트생성", // 세분화된 카테고리
    rating: 4.5,
    description: "한국어에 특화된 AI 글쓰기 도구. 다양한 글쓰기 템플릿과 스타일을 지원하며, 사용자의 의도를 잘 파악하여 자연스러운 한국어 문장을 생성.",
    strengths: [
      "한국어 글쓰기 특화: 자연스러운 한국어 문장 생성 및 문맥 이해 능력 우수",
      "다양한 글쓰기 템플릿: 블로그, 광고 문구, 자기소개서 등 다양한 유형 지원",
      "직관적인 인터페이스: 사용하기 쉬운 UI로 초보자도 쉽게 활용 가능",
      "실시간 아이디어 제안: 글쓰기 과정에서 다양한 아이디어 및 키워드 제안"
    ],
    weaknesses: [
      "일부 복잡하거나 전문적인 글쓰기에서는 정확도 한계",
      "영어나 다른 언어 지원은 ChatGPT/Gemini 대비 미흡",
      "장문의 글 생성 시 논리적 일관성 유지 어려움 발생 가능"
    ],
    freeLimitations: "무료 사용 가능 (일일 사용량 제한 또는 특정 기능 제한)",
    features: ["한국어 글쓰기", "다양한 템플릿", "아이디어 제안", "문장 교정"],
    usecases: [
      { title: "블로그 글 작성", detail: "주어진 키워드로 블로그 게시물 초안 생성", example: "예: 'AI 트렌드에 대한 블로그 글'" },
      { title: "광고 문구 제작", detail: "제품/서비스 특징에 맞는 광고 문구 제안", example: "예: '새로운 커피 광고 문구'" },
      { title: "자소서 및 보고서 초안", detail: "기본 정보 입력 시 자소서/보고서 초안 생성", example: "예: '자기소개서 성장 과정 작성'" }
    ],
    integrations: [],
    link: "https://wrtn.ai/",
    detail: "https://wrtn.ai/",
    isKorean: true,
    isPopularKr: true,
    isPopular: false,
    // 경쟁 우위 정보
    competitiveAdvantage: [
      {
        targetTool: "ChatGPT / Gemini",
        advantage: "한국어 특화 및 다양한 국내 템플릿 제공으로 한국어 콘텐츠 생성에 매우 유리합니다. 직관적인 웹 인터페이스가 강점입니다."
      },
      {
        targetTool: "Copy.ai",
        advantage: "Copy.ai가 영문 콘텐츠 생성에 강하다면, 뤼튼은 한국어 문맥과 신조어에 대한 이해도가 높아 자연스러운 한국어 콘텐츠 생성에 우위가 있습니다."
      }
    ]
  },
  // 4. Karlo
  {
    id: 4,
    name: "Karlo",
    category: "이미지", // 기존 카테고리 유지
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
    // 경쟁 우위 정보
    competitiveAdvantage: [
      {
        targetTool: "Midjourney / Stable Diffusion",
        advantage: "한국어 프롬프트에 대한 이해도가 매우 높고, 한국 문화 요소를 반영한 이미지 생성에 특화되어 있습니다."
      }
    ]
  },
  // 5. Naver Clova X
  {
    id: 5,
    name: "Naver Clova X",
    category: "대화", // 세분화된 카테고리
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
    // 경쟁 우위 정보
    competitiveAdvantage: [
      {
        targetTool: "ChatGPT / Gemini",
        advantage: "가장 한국적인 질문과 맥락을 잘 이해하며, 네이버 서비스(검색, 쇼핑, 뉴스)와의 강력한 연동을 통해 국내 정보에 대한 강점을 가집니다."
      },
      {
        targetTool: "Wrtn (뤼튼)",
        advantage: "뤼튼이 한국어 글쓰기 템플릿에 강하다면, 클로바X는 네이버 생태계 연동을 통한 정보 검색 및 복합적인 한국어 대화에 더 강점이 있습니다."
      }
    ]
  },
  // 6. Notion AI
  {
    id: 6,
    name: "Notion AI",
    category: "생산성", // 기존 카테고리 유지
    rating: 4.7,
    description: "노션 문서 내에서 작동하는 AI 비서. 문서 요약, 아이디어 브레인스토밍, 글쓰기 등 생산성 작업에 특화.",
    strengths: [
      "노션 통합: 노션 워크스페이스 내에서 직접 AI 기능 활용 가능",
      "문서 기반 작업 효율화: 문서 요약, 번역, 초안 작성 등 작업 시간 단축",
      "다양한 템플릿 지원: 회의록, 보고서, 블로그 등 템플릿 기반 글쓰기 지원",
      "콘텍스트 이해: 현재 문서 내용을 기반으로 답변 생성 및 보완"
    ],
    weaknesses: [
      "노션 사용자에게만 유용: 노션 외부에서는 사용 불가",
      "범용적인 대화나 복잡한 프로그래밍 작업에는 한계",
      "무료 사용 제한적: 유료 플랜 구독 시 추가 기능 제공"
    ],
    freeLimitations: "무료 사용은 20회 제한. 이후 유료 플랜 구독 필요.",
    features: ["문서 요약", "글쓰기 보조", "아이디어 생성", "번역"],
    usecases: [
      { title: "회의록 자동 요약", detail: "노션 회의록 내용 요약 및 핵심 정리", example: "예: '지난주 회의록 5줄 요약'" },
      { title: "블로그 게시물 초안", detail: "간단한 아이디어로 블로그 글 초안 생성", example: "예: '노션 AI 활용법 블로그 글 작성'" },
      { title: "기존 문서 개선", detail: "작성 중인 문서의 문단 확장, 어조 변경", example: "예: '이 문단 좀 더 전문적으로 바꿔줘'" }
    ],
    integrations: ["Notion"],
    link: "https://www.notion.so/ko-kr/product/ai",
    detail: "https://www.notion.so/ko-kr/product/ai",
    isKorean: true,
    isPopularKr: true,
    isPopular: true,
    // 경쟁 우위 정보
    competitiveAdvantage: [
      {
        targetTool: "ChatGPT / Gemini",
        advantage: "노션 워크스페이스 내에서 직접 AI 기능을 활용하여 문서 작업의 효율성을 극대화하는 데 특화되어 있습니다."
      }
    ]
  },
  // 7. Kakao i (원래 id: 8) - 스니펫의 id:7 위치에 카카오아이 데이터가 있음
  {
    id: 7, // 원래 8번이었으나, 스니펫의 id:7 위치에 있어 통일
    name: "Kakao i",
    category: "음성", // 기존 카테고리 유지
    rating: 4.4,
    description: "카카오가 개발한 AI 플랫폼. 음성 인식, 자연어 처리, 이미지 분석 등 다양한 AI 기술을 제공하며, 카카오 서비스와 연동.",
    strengths: [
      "한국어 처리 능력: 한국어 음성 인식 및 자연어 처리 기술이 뛰어남",
      "카카오 서비스 연동: 카카오톡, 카카오미니 등 카카오 생태계와 연동하여 편리하게 이용",
      "폭넓은 적용 분야: 스마트 스피커, 자동차, 가전 등 다양한 기기에 적용 가능",
      "지속적인 업데이트: 카카오의 기술력으로 지속적인 기능 개선 및 확장"
    ],
    weaknesses: [
      "일부 복잡한 명령이나 대화에서는 아직 한계",
      "카카오 서비스 의존도가 높아 다른 플랫폼에서는 활용 제한적",
      "개인 맞춤형 서비스는 아직 개선 필요"
    ],
    freeLimitations: "기본 기능 무료, 고급 기능 및 API 사용은 유료.",
    features: ["음성 인식", "자연어 처리", "이미지 분석", "카카오 연동"],
    usecases: [
      { title: "스마트 홈 제어", detail: "음성 명령으로 가전 기기 제어", example: "예: '거실 불 켜줘'" },
      { title: "카카오톡 메시지 전송", detail: "음성으로 카카오톡 메시지 보내기", example: "예: '엄마한테 잘 도착했다고 톡 보내줘'" },
      { title: "정보 검색", detail: "음성으로 날씨, 뉴스, 음악 등 정보 검색", example: "예: '오늘 날씨 어때?'" }
    ],
    integrations: ["KakaoTalk", "Kakao Mini", "Smart Home Devices"],
    link: "https://www.kakaocorp.com/page/service/service/Kakao_i",
    detail: "https://www.kakaocorp.com/page/service/service/Kakao_i",
    isKorean: true,
    isPopularKr: false,
    isPopular: false,
    // 경쟁 우위 정보
    competitiveAdvantage: [
      {
        targetTool: "Naver Clova X",
        advantage: "카카오 생태계(카카오톡, 카카오미니)와의 강력한 연동성을 통해 사용자 접근성이 높고 다양한 서비스에 활용됩니다."
      }
    ]
  },
  // 8. Toss AI (원래 id: 7. 스니펫에 없어서 Kakao i 뒤에 배치함)
  {
    id: 8, // 원래 7번이었으나, id 7번에 Kakao i 가 있어 8번으로 변경
    name: "Toss AI",
    category: "금융", // 새로운 카테고리 추가
    rating: 4.5,
    description: "토스 앱 내에서 금융 관련 질문에 답변하고 금융 정보를 제공하는 AI 서비스. 개인 맞춤형 금융 조언에 특화.",
    strengths: [
      "금융 전문성: 금융 관련 질문에 특화된 정보 제공",
      "개인 맞춤형 조언: 사용자 데이터를 기반으로 맞춤형 금융 상품 추천 및 절약 노하우 제공",
      "토스 앱 연동: 토스 앱 내에서 편리하게 이용 가능",
      "쉬운 설명: 복잡한 금융 용어를 쉽게 풀어 설명"
    ],
    weaknesses: [
      "금융 외 분야 질문에는 답변 불가",
      "아직 초기 단계로 답변의 깊이나 범위에 한계",
      "개인 정보 보호 및 보안에 대한 사용자 우려"
    ],
    freeLimitations: "토스 앱 사용자 누구나 무료 이용 가능.",
    features: ["금융 상담", "맞춤형 조언", "금융 정보 제공", "자산 관리"],
    usecases: [
      { title: "금융 상품 추천", detail: "사용자 소비 패턴 분석 후 적합한 금융 상품 추천", example: "예: '나에게 맞는 적금 상품 추천해줘'" },
      { title: "금융 용어 설명", detail: "어려운 금융 용어를 쉽게 설명", example: "예: 'LTV가 뭐야?'" },
      { title: "지출 분석", detail: "토스 가계부 연동 지출 분석 및 절약 팁 제공", example: "예: '이번 달 지출 분석해줘'" }
    ],
    integrations: ["Toss App"],
    link: "https://toss.im/toss-ai", // 실제 링크 확인 필요
    detail: "https://toss.im/toss-ai", // 실제 링크 확인 필요
    isKorean: true,
    isPopularKr: true,
    isPopular: false,
    // 경쟁 우위 정보 (금융 AI가 많지 않아 일반적인 우위 위주로 작성)
    competitiveAdvantage: [
      {
        targetTool: "은행 앱 챗봇",
        advantage: "토스 앱과의 긴밀한 연동을 통해 개인화된 금융 데이터를 기반으로 더욱 실용적인 맞춤형 금융 조언을 제공합니다."
      }
    ]
  },
  // 9. Midjourney
  {
    id: 9,
    name: "Midjourney",
    category: "이미지", // 기존 카테고리 유지
    rating: 4.7,
    description: "매우 높은 퀄리티의 예술적인 이미지를 생성하는 AI. 프롬프트 해석 능력이 뛰어나며, 독특하고 창의적인 결과물에 강점.",
    strengths: [
      "압도적인 이미지 퀄리티: 다른 이미지 AI 대비 예술적이고 고품질의 결과물 생성",
      "뛰어난 프롬프트 해석: 복잡하고 추상적인 프롬프트도 잘 이해하고 반영",
      "다양한 스타일 연출: 사진, 일러스트, 유화 등 폭넓은 스타일 구현 가능",
      "활발한 커뮤니티: 사용자 간 작품 공유 및 학습 용이"
    ],
    weaknesses: [
      "디스코드 기반: 사용 방식이 익숙하지 않을 수 있음",
      "유료 서비스: 무료 체험판 후 유료 구독 필요",
      "세부적인 객체 제어 어려움: 원하는 포즈나 배치 등 세밀한 조절이 어려울 수 있음",
      "인물 이미지 생성 시 특정 인물 재현 어려움"
    ],
    freeLimitations: "제한된 무료 체험 제공 (이후 유료 구독).",
    features: ["텍스트→이미지", "예술적 이미지", "고품질", "다양한 스타일"],
    usecases: [
      { title: "컨셉 아트 제작", detail: "게임, 영화, 애니메이션 등의 컨셉 이미지 생성", example: "예: '미래 도시의 풍경 컨셉 아트'" },
      { title: "NFT 아트 생성", detail: "독특하고 창의적인 NFT 아트워크 제작", example: "예: '추상적인 디지털 아트 NFT'" },
      { title: "마케팅 시각 자료", detail: "광고, 브랜딩에 필요한 고품질 이미지 생성", example: "예: '새로운 제품의 광고 이미지'" }
    ],
    integrations: ["Discord"],
    link: "https://www.midjourney.com/",
    detail: "https://www.midjourney.com/",
    isKorean: false,
    isPopularKr: true,
    isPopular: true,
    // 경쟁 우위 정보
    competitiveAdvantage: [
      {
        targetTool: "Stable Diffusion / DALL-E 3",
        advantage: "독보적인 예술적 이미지 생성 능력과 압도적인 이미지 퀄리티를 자랑합니다. 추상적이거나 창의적인 프롬프트 해석에 강점이 있습니다."
      }
    ]
  },
  // 10. Stable Diffusion
  {
    id: 10,
    name: "Stable Diffusion",
    category: "이미지", // 기존 카테고리 유지
    rating: 4.6,
    description: "오픈소스 기반의 이미지 생성 AI. 높은 자유도와 커스터마이징이 가능하며, 다양한 파생 모델 존재.",
    strengths: [
      "오픈소스: 사용자가 직접 모델을 커스터마이징하고 제어할 수 있는 높은 자유도",
      "다양한 파생 모델: 수많은 커뮤니티 제작 모델(LoRA 등)을 활용하여 폭넓은 스타일 구현",
      "로컬 환경 구축 가능: 개인 컴퓨터에 설치하여 인터넷 연결 없이 사용 가능",
      "무료 사용: 기본 모델은 무료로 이용 가능"
    ],
    weaknesses: [
      "높은 학습 곡선: 설치 및 사용법이 초보자에게 어려울 수 있음",
      "성능 좋은 그래픽 카드 요구: 고품질 이미지 생성을 위해 높은 사양의 GPU 필요",
      "프롬프트 엔지니어링의 중요성: 원하는 결과물을 얻기 위해 정확한 프롬프트 작성 능력 요구",
      "윤리적 문제 및 부적절한 이미지 생성 가능성"
    ],
    freeLimitations: "오픈소스이므로 무료 사용 가능. (로컬 환경 구축 시 하드웨어 필요)",
    features: ["텍스트→이미지", "오픈소스", "커스터마이징", "고해상도"],
    usecases: [
      { title: "개인 작업물 제작", detail: "자신만의 캐릭터, 배경, 일러스트 등 생성", example: "예: '나만의 웹툰 캐릭터 디자인'" },
      { title: "연구 및 개발", detail: "AI 이미지 생성 기술 연구 및 모델 개발", example: "예: '새로운 이미지 생성 알고리즘 테스트'" },
      { title: "콘텐츠 제작", detail: "블로그, 유튜브 썸네일 등 다양한 콘텐츠 이미지 생성", example: "예: '유튜브 영상 썸네일 이미지'" }
    ],
    integrations: ["API", "Local Install"],
    link: "https://stability.ai/stablediffusion",
    detail: "https://stability.ai/stablediffusion",
    isKorean: false,
    isPopularKr: true,
    isPopular: true,
    // 경쟁 우위 정보
    competitiveAdvantage: [
      {
        targetTool: "Midjourney / DALL-E 3",
        advantage: "완전한 오픈소스이며 높은 자유도와 커스터마이징이 강점입니다. 로컬 환경에서 실행 가능하여 개인 정보 보호 및 비용 절감에 유리합니다."
      }
    ]
  },
  // 11. DeepL 번역
  {
    id: 11,
    name: "DeepL 번역",
    category: "번역", // 세분화된 카테고리
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
    // 경쟁 우위 정보
    competitiveAdvantage: [
      {
        targetTool: "Google 번역 / Papago",
        advantage: "번역의 '자연스러움'과 '정확성'에서 높은 평가를 받습니다. 특히 유럽 언어와 한국어 번역에서 뛰어난 품질을 보여줍니다."
      }
    ]
  },
  // 12. Perplexity AI
  {
    id: 12,
    name: "Perplexity AI",
    category: "AI검색", // 세분화된 카테고리
    rating: 4.8,
    description: "대화형 검색 엔진. 실시간 웹 검색 기반의 정확한 답변과 출처 제공, 학술 및 정보 탐색에 최적화.",
    strengths: [
      "답변 출처 명확하게 제시 (논문, 뉴스 기사, 웹사이트 등)",
      "실시간 웹 검색 기반으로 최신 정보 제공",
      "질의응답을 통한 심층적인 정보 탐색 가능",
      "학술 연구, 뉴스 요약, 특정 주제 심층 분석에 유용",
      "실시간 Q&A + 근거 링크, 출처 투명"
    ],
    weaknesses: [
      "창의적 글쓰기나 코드 생성에는 약함",
      "일반적인 대화나 복잡한 추론에는 한계",
      "무료 버전 사용량 제한",
      "간결한 답변보다는 정보 제공에 초점",
      "링크가 유료 논문이면 전문 확인 불가; 검색 수 틀어막히면 중단"
    ],
    freeLimitations: "무료 버전은 질문 횟수 및 고급 기능 제한. (Copilot 기능 5회/4시간)",
    features: ["실시간 검색", "출처 제공", "요약", "관련 질문 추천"],
    usecases: [
      { title: "정보 조사", detail: "특정 주제에 대한 심층적인 정보 검색 및 요약", example: "예: '기후 변화의 최신 연구 동향 알려줘'" },
      { title: "리서치 자료 수집", detail: "학술 논문, 통계 자료 등 신뢰할 수 있는 출처 기반 자료 수집", example: "예: '2023년 대한민국 경제 성장률에 대한 보고서'" },
      { title: "뉴스 요약", detail: "최신 뉴스 기사를 읽고 핵심 내용 요약", example: "예: '오늘의 주요 뉴스 요약'" }
    ],
    integrations: ["웹"],
    link: "https://www.perplexity.ai/",
    detail: "https://www.perplexity.ai/",
    isKorean: true,
    isPopularKr: true,
    isPopular: true,
    // 경쟁 우위 정보
    competitiveAdvantage: [
      {
        targetTool: "ChatGPT / Gemini",
        advantage: "모든 답변에 대한 웹 출처를 명확하게 제시하여 정보의 신뢰도가 높습니다. 실시간 최신 정보 검색 및 학술 자료 조사에 특화되어 있습니다."
      },
      {
        targetTool: "Bing AI Copilot",
        advantage: "Bing AI Copilot과 유사하게 웹 검색 기반이지만, 더 깔끔하고 간결한 UI, 그리고 답변 출처의 투명성을 강조하여 학술적/연구적 사용에 더 적합합니다."
      }
    ]
  },
  // 13. Claude
  {
    id: 13,
    name: "Claude",
    category: "대화", // 세분화된 카테고리
    rating: 4.7,
    description: "Anthropic에서 개발한 AI 챗봇. 안전하고 유해하지 않은 답변에 초점, 긴 문맥 처리 능력과 추론 능력 강점. 220K 토큰, 초장문 분석·안전성 우위.",
    strengths: [
      "매우 긴 텍스트(소설, 보고서 등) 처리 및 요약/질의응답",
      "안전하고 유해성이 적은 답변 생성 (편향성 낮음)",
      "복잡한 추론 및 논리적 답변에 강점",
      "한국어 포함 다국어 지원 및 자연스러운 번역",
      "220K 토큰, 초장문 분석·안전성 우위"
    ],
    weaknesses: [
      "실시간 정보 접근 제한 (특정 시점까지 학습된 데이터)",
      "이미지/음성 등 멀티모달 기능은 아직 제한적",
      "코드 생성 및 디버깅은 ChatGPT보다 약함",
      "무료 버전은 기능 및 사용량 제한",
      "한글 표현 딱딱; Opus는 유료(모델 API 비용 부담)"
    ],
    freeLimitations:
      "무료 버전은 Claude 3 Sonnet 모델 사용 가능, 사용량 제한. Opus 모델 및 고급 기능은 유료. Sonnet 9K 제한.",
    features: ["긴 텍스트 처리", "안전한 답변", "논리적 추론", "코딩 지원"],
    usecases: [
      {
        title: "장문 문서 요약 및 분석",
        detail: "긴 보고서, 논문, 소설 등에서 핵심 내용 추출",
        example: "예: '500페이지 보고서 3줄 요약'",
      },
      {
        title: "콘텐츠 검토 및 수정",
        detail: "유해성, 편향성 검토 및 글쓰기 스타일 개선",
        example: "예: '작성한 글의 혐오 표현 검토'",
      },
      {
        title: "정책 문서/법률 자료 분석",
        detail: "복잡한 규정 이해 및 특정 조항 해석",
        example: "예: '개인정보보호법 주요 내용 설명'",
      },
    ],
    integrations: ["API", "웹"],
    link: "https://claude.ai/",
    detail: "https://www.anthropic.com/claude",
    isKorean: true,
    isPopularKr: true,
    isPopular: true,
    // 경쟁 우위 정보
    competitiveAdvantage: [
      {
        targetTool: "ChatGPT",
        advantage: "매우 긴 텍스트를 처리하고 요약하는 능력, 그리고 안전하고 윤리적인 답변 생성에 강점이 있습니다."
      },
      {
        targetTool: "Gemini",
        advantage: "멀티모달 기능에서는 Gemini가 우세하지만, Claude는 장문 텍스트 분석 및 추론에서 더 깊이 있는 성능을 보여줍니다."
      }
    ]
  },
  // 14. Canva AI
  {
    id: 14,
    name: "Canva AI",
    category: "디자인", // 기존 카테고리 유지
    rating: 4.5,
    description: "디자인 플랫폼 Canva에 통합된 AI 기능. 텍스트로 이미지 생성, 매직 편집, 디자인 자동화 등 시각 콘텐츠 제작을 돕는다.",
    strengths: [
      "직관적인 사용법: 디자인 경험이 없어도 쉽게 사용 가능",
      "캔바 플랫폼과의 완벽한 통합: 기존 디자인 작업 흐름 내에서 AI 기능 활용",
      "다양한 디자인 템플릿: AI가 생성한 이미지로 템플릿을 쉽게 커스터마이징",
      "매직 편집 기능: 이미지 배경 제거, 개체 지우기 등 강력한 편집 기능"
    ],
    weaknesses: [
      "전문적인 이미지 생성 AI 대비 자유도 제한적",
      "캔바 유료 플랜 구독 시 더 많은 기능 제공",
      "창의적이고 독특한 이미지 생성에는 미드저니/스테이블 디퓨전 대비 한계"
    ],
    freeLimitations: "무료 버전에서 일부 AI 기능 제한적으로 사용 가능. Pro/Enterprise 플랜에서 더 많은 기능 제공.",
    features: ["텍스트→이미지", "매직 편집", "디자인 자동화", "배경 제거"],
    usecases: [
      { title: "SNS 마케팅 이미지", detail: "소셜 미디어 게시물, 광고 배너 이미지 자동 생성", example: "예: '새로운 상품 출시 인스타그램 이미지'" },
      { title: "프레젠테이션 디자인", detail: "발표 자료에 들어갈 이미지 및 디자인 요소 자동 생성", example: "예: '회사 소개 PPT 디자인 개선'" },
      { title: "블로그/웹사이트 시각 자료", detail: "웹 콘텐츠에 필요한 이미지 생성 및 편집", example: "예: '블로그 게시물 헤더 이미지'" }
    ],
    integrations: ["Canva"],
    link: "https://www.canva.com/ai-tools/",
    detail: "https://www.canva.com/ai-tools/",
    isKorean: true,
    isPopularKr: true,
    isPopular: false,
    // 경쟁 우위 정보
    competitiveAdvantage: [
      {
        targetTool: "Adobe Photoshop / Illustrator",
        advantage: "디자인 전문 지식이 없어도 AI가 자동으로 레이아웃, 색상 등을 추천하여 누구나 쉽고 빠르게 전문적인 디자인을 만들 수 있습니다. 캔바 플랫폼 내에서 완벽하게 통합되어 효율적인 작업이 가능합니다."
      },
      {
        targetTool: "Midjourney / Stable Diffusion",
        advantage: "순수한 이미지 생성 능력에서는 전문 AI에 비해 부족할 수 있지만, 캔바의 방대한 디자인 템플릿과 매직 편집 기능을 활용하여 완성된 디자인 콘텐츠를 쉽게 제작할 수 있습니다."
      }
    ]
  },
  // 15. DeepL Write
  {
    id: 15,
    name: "DeepL Write",
    category: "교정/편집", // 세분화된 카테고리
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
    features: ["문법 교정", "문장 재구성", "어조 변경", "어휘 제안"],
    usecases: [
      { title: "영어 이메일 작성", detail: "비즈니스, 학술, 개인 이메일의 문법 및 표현 교정", example: "예: '영문 비즈니스 이메일 검토'" },
      { title: "영문 보고서/논문 교정", detail: "학술 문서의 문법적 오류 수정 및 표현 개선", example: "예: '영문 연구 보고서 문법 확인'" },
      { title: "영어 블로그/콘텐츠 작성", detail: "온라인 콘텐츠의 가독성과 정확성 향상", example: "예: '영어 블로그 게시물 어조 변경'" }
    ],
    integrations: ["Web App", "Browser Extension"],
    link: "https://www.deepl.com/write",
    detail: "https://www.deepl.com/write",
    isKorean: false,
    isPopularKr: true,
    isPopular: false,
    // 경쟁 우위 정보
    competitiveAdvantage: [
      {
        targetTool: "Grammarly",
        advantage: "DeepL 번역 엔진의 강력한 자연어 처리 기술을 기반으로 문맥을 더 깊이 이해하여, Grammarly보다 자연스러운 문장 재구성 및 표현 제안에서 강점을 보입니다."
      }
    ]
  },
  // 16. CLOVA Note
  {
    id: 16,
    name: "CLOVA Note",
    category: "음성", // 기존 카테고리 유지
    rating: 4.6,
    description: "네이버의 AI 음성 기록 서비스. 음성을 텍스트로 변환하고, 요약, 핵심 키워드 추출 등 회의록 작성에 특화.",
    strengths: [
      "높은 한국어 음성 인식률: 한국어 대화 기록에 매우 강점",
      "화자 분리 기능: 여러 화자의 대화를 구분하여 기록",
      "AI 요약 및 키워드 추출: 긴 회의 내용을 자동으로 요약하고 핵심 키워드 제시",
      "메모 및 검색 기능: 기록된 텍스트에서 특정 내용 검색 및 메모 추가 용이"
    ],
    weaknesses: [
      "음질이 좋지 않은 환경에서는 인식률 저하 가능",
      "녹음 파일 길이 및 사용량에 제한이 있을 수 있음",
      "다른 언어 지원은 제한적"
    ],
    freeLimitations: "월별 무료 사용 시간 제한. (300분/월)",
    features: ["음성→텍스트", "화자 분리", "AI 요약", "키워드 추출"],
    usecases: [
      { title: "회의록 자동 생성", detail: "회의 내용을 녹음하여 텍스트로 변환하고 요약", example: "예: '팀 회의록 자동으로 만들기'" },
      { title: "강의 내용 기록", detail: "강의 내용을 녹음 후 텍스트로 변환 및 핵심 정리", example: "예: '온라인 강의 필기 도우미'" },
      { title: "인터뷰 기록", detail: "인터뷰 녹취록 자동 생성 및 주요 내용 추출", example: "예: '인터뷰 녹음 파일 텍스트화'" }
    ],
    integrations: ["Naver Account"],
    link: "https://clovanote.naver.com/",
    detail: "https://clovanote.naver.com/",
    isKorean: true,
    isPopularKr: true,
    isPopular: true,
    // 경쟁 우위 정보
    competitiveAdvantage: [
      {
        targetTool: "OpenAI Whisper",
        advantage: "한국어 음성 인식률이 매우 높고, 화자 분리 및 AI 요약 기능이 통합되어 회의록 작성에 특히 최적화되어 있습니다."
      },
      {
        targetTool: "Descript / Vrew",
        advantage: "Descript나 Vrew가 영상 편집에 음성 기능을 통합했다면, 클로바노트는 순수 음성 기록 및 AI 요약 기능에 집중하여 한국어 회의록 작성에 특화된 편의성을 제공합니다."
      }
    ]
  },
  // 17. You.com
  {
    id: 17,
    name: "You.com",
    category: "AI검색", // 세분화된 카테고리
    rating: 4.5,
    description: "AI 기반의 개인화된 검색 엔진. 광고 없이 다양한 출처의 정보를 요약하고, 사용자가 원하는 앱을 선택하여 검색 결과를 맞춤 설정.",
    strengths: [
      "개인화된 검색 경험: 사용자가 선호하는 앱(소스)을 선택하여 검색 결과 맞춤 설정",
      "광고 없음: 불필요한 광고 없이 깔끔한 검색 결과 제공",
      "AI 요약 및 분석: 검색 결과를 AI가 요약하고 인사이트 제공",
      "코드 생성 및 글쓰기 기능: 검색 외에 간단한 생성 AI 기능도 제공"
    ],
    weaknesses: [
      "일반 검색 엔진 대비 인지도 및 사용자층 부족",
      "일부 특정 정보 검색 시 결과의 깊이가 부족할 수 있음",
      "한국어 처리 능력은 아직 개선 필요"
    ],
    freeLimitations: "기본 검색 기능 무료. AI 기능 사용량 제한.",
    features: ["개인화 검색", "광고 없음", "AI 요약", "코드/글쓰기"],
    usecases: [
      { title: "정보 탐색", detail: "다양한 소스에서 필요한 정보 빠르게 탐색 및 요약", example: "예: '최신 스마트폰 비교 검색'" },
      { title: "코드 검색 및 생성", detail: "개발 관련 코드 예시 검색 및 간단한 코드 생성", example: "예: '자바스크립트 배열 정렬 코드'" },
      { title: "개인화된 뉴스 요약", detail: "관심 분야의 뉴스 소스만 선택하여 요약", example: "예: 'IT 기술 뉴스 요약'" }
    ],
    integrations: [],
    link: "https://you.com/",
    detail: "https://you.com/",
    isKorean: false,
    isPopularKr: false,
    isPopular: false,
    // 경쟁 우위 정보
    competitiveAdvantage: [
      {
        targetTool: "Google / Naver 검색",
        advantage: "사용자가 검색 소스(앱)를 직접 선택하여 개인화된 검색 경험을 제공합니다. 광고 없이 깔끔한 UI에서 AI 요약 정보를 얻을 수 있습니다."
      },
      {
        targetTool: "Perplexity AI",
        advantage: "Perplexity AI가 출처 명확성에 집중한다면, You.com은 개인화된 검색 소스 선택과 광고 없는 환경을 통해 사용자 맞춤형 검색 경험에 강점을 가집니다."
      }
    ]
  },
  // 18. Kakao Brain KoGPT
  {
    id: 18,
    name: "Kakao Brain KoGPT",
    category: "텍스트생성", // 세분화된 카테고리
    rating: 4.5,
    description: "카카오 브레인이 개발한 한국어 특화 초거대 언어 모델. 한국어 텍스트 생성, 요약, 번역 등 다양한 자연어 처리 작업에 활용.",
    strengths: [
      "한국어 이해 및 생성 능력 탁월: 한국어 문맥과 뉘앙스에 대한 높은 이해도",
      "다양한 한국어 텍스트 작업: 시, 소설, 기사 등 다양한 형태의 한국어 콘텐츠 생성",
      "카카오 서비스와의 연동 가능성: 카카오 생태계 내에서 다양한 서비스에 적용",
      "지속적인 연구 개발: 카카오 브레인의 기술력으로 지속적인 성능 향상"
    ],
    weaknesses: [
      "일반 사용자 접근성: 주로 개발자나 기업용 API 형태로 제공",
      "범용 AI 챗봇 대비 기능 제한적",
      "최신 정보 반영은 학습 데이터에 의존"
    ],
    freeLimitations: "주로 API 형태로 제공되며, 사용량에 따라 유료.",
    features: ["한국어 텍스트 생성", "한국어 요약", "한국어 번역", "질의응답"],
    usecases: [
      { title: "한국어 콘텐츠 자동 생성", detail: "블로그 글, 마케팅 문구, 스토리 등 한국어 텍스트 생성", example: "예: '새로운 상품 소개 문구 생성'" },
      { title: "한국어 챗봇 개발", detail: "KoGPT를 기반으로 한 한국어 챗봇 구축", example: "예: '기업 고객 상담 챗봇 개발'" },
      { title: "데이터 분석 및 요약", detail: "대량의 한국어 텍스트 데이터 요약 및 핵심 정보 추출", example: "예: '뉴스 기사 데이터 요약'" }
    ],
    integrations: ["API"],
    link: "https://kakaobrain.com/service/kogpt",
    detail: "https://kakaobrain.com/service/kogpt",
    isKorean: true,
    isPopularKr: false,
    isPopular: false,
    // 경쟁 우위 정보
    competitiveAdvantage: [
      {
        targetTool: "HyperCLOVA X",
        advantage: "한국어 문맥과 뉘앙스에 대한 깊은 이해도를 바탕으로 매우 자연스러운 한국어 텍스트를 생성하며, 카카오 서비스와의 연동 가능성이 높습니다."
      },
      {
        targetTool: "ChatGPT / Gemini",
        advantage: "글로벌 범용 AI에 비해 한국어 특화된 성능을 제공하여, 한국어 기반의 심층적인 콘텐츠 생성 및 챗봇 개발에 강점을 가집니다."
      }
    ]
  },
  // 19. Bing AI Copilot
  {
    id: 19,
    name: "Bing AI Copilot",
    category: "AI검색", // 세분화된 카테고리
    rating: 4.6,
    description: "Microsoft Edge 브라우저 및 Bing 검색 엔진에 통합된 AI 챗봇. 실시간 웹 검색 기반의 답변과 이미지 생성 기능을 제공.",
    strengths: [
      "실시간 웹 검색: Bing 검색 엔진을 통해 최신 웹 정보에 접근하여 답변 생성",
      "이미지 생성 기능: DALL-E 3 기반의 이미지 생성 기능 제공",
      "Microsoft Edge 통합: 브라우저 사이드바에서 편리하게 AI 기능 사용 가능",
      "다양한 대화 스타일: 창의적, 균형 잡힌, 정밀함 등 대화 스타일 선택 가능"
    ],
    weaknesses: [
      "주로 Microsoft Edge 브라우저에 최적화",
      "일부 답변이 부정확하거나 편향될 수 있음",
      "한국어 답변의 자연스러움은 아직 개선 필요"
    ],
    freeLimitations: "기본 기능 무료. 사용량 및 고급 기능 제한.",
    features: ["실시간 웹 검색", "이미지 생성", "요약", "대화형 AI"],
    usecases: [
      { title: "정보 조사 및 비교", detail: "특정 주제에 대한 정보 검색 및 여러 웹사이트 내용 비교", example: "예: '전기차 모델별 장단점 비교'" },
      { title: "텍스트 요약 및 작성", detail: "웹페이지 내용 요약, 이메일, 보고서 초안 작성", example: "예: '긴 뉴스 기사 핵심 요약'" },
      { title: "이미지 생성", detail: "텍스트 설명 기반으로 다양한 이미지 생성", example: "예: '파란색 자동차가 있는 미래 도시 이미지'" }
    ],
    integrations: ["Microsoft Edge", "Bing Search"],
    link: "https://www.microsoft.com/ko-kr/bing/chat",
    detail: "https://www.microsoft.com/ko-kr/bing/chat",
    isKorean: true,
    isPopularKr: true,
    isPopular: true,
    // 경쟁 우위 정보
    competitiveAdvantage: [
      {
        targetTool: "Google / Naver 검색",
        advantage: "대화형 인터페이스를 통해 자연스럽게 질문하고 답변을 얻을 수 있으며, 검색과 AI 기능을 동시에 활용할 수 있습니다. DALL-E 3 기반의 이미지 생성 기능도 통합되어 있습니다."
      },
      {
        targetTool: "Perplexity AI",
        advantage: "Perplexity AI가 학술적 출처에 강하다면, Bing AI Copilot은 Microsoft Edge 브라우저와의 통합을 통해 웹 탐색 중 편리하게 AI 기능을 활용하는 데 강점이 있습니다."
      }
    ]
  },
  // 20. Leonardo.Ai
  {
    id: 20,
    name: "Leonardo.Ai",
    category: "이미지", // 기존 카테고리 유지
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
    features: ["텍스트→이미지", "사실적 이미지", "게임 에셋", "이미지 편집"],
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
    // 경쟁 우위 정보
    competitiveAdvantage: [
      {
        targetTool: "Midjourney / Stable Diffusion",
        advantage: "고품질의 사실적인 이미지 생성에 강점이 있으며, 게임 에셋 등 특정 산업에 특화된 모델을 제공하여 해당 분야에서 효율성을 높입니다."
      }
    ]
  },
  // 21. Runway ML
  {
    id: 21,
    name: "Runway ML",
    category: "동영상", // 기존 카테고리 유지
    rating: 4.7,
    description: "AI 기반 동영상 편집 및 생성 플랫폼. 텍스트, 이미지, 클립으로 영상 생성, 매직툴 등 영상 제작에 필요한 다양한 AI 기능 제공.",
    strengths: [
      "텍스트/이미지→동영상: 간단한 텍스트나 이미지로 동영상 생성 가능",
      "매직툴: 영상 배경 제거, 피사체 분리, 인페인팅 등 강력한 영상 편집 기능",
      "쉬운 인터페이스: 비전문가도 쉽게 동영상 제작 및 편집 가능",
      "다양한 AI 기능: 모션 트래킹, 인페인팅, 이미지 확장 등 영상 관련 AI 기능 통합"
    ],
    weaknesses: [
      "무료 버전 기능 및 사용량 제한: 고품질/긴 영상 제작은 유료 플랜 필요",
      "아직 완벽한 고품질 영상 생성에는 한계",
      "복잡한 스토리텔링 영상 제작에는 추가 작업 필요"
    ],
    freeLimitations: "무료 체험 크레딧 제공 (생성 시간/품질 제한).",
    features: ["텍스트→영상", "이미지→영상", "매직 편집", "영상 효과"],
    usecases: [
      { title: "SNS 숏폼 영상 제작", detail: "짧은 광고, 챌린지 영상 등 소셜 미디어용 영상 생성", example: "예: '틱톡 챌린지 영상 자동 생성'" },
      { title: "프레젠테이션 도입부", detail: "발표 자료의 인상적인 오프닝 영상 제작", example: "예: '회사 소개 영상 도입부'" },
      { title: "간단한 애니메이션", detail: "움직이는 이미지, 짧은 애니메이션 클립 제작", example: "예: '제품 설명 애니메이션 클립'" }
    ],
    integrations: [],
    link: "https://runwayml.com/",
    detail: "https://runwayml.com/",
    isKorean: false,
    isPopularKr: true,
    isPopular: true,
    // 경쟁 우위 정보
    competitiveAdvantage: [
      {
        targetTool: "Pika / Luma AI",
        advantage: "텍스트나 이미지를 동영상으로 변환하는 강력한 기능과 함께, 영상 배경 제거, 피사체 분리 등 영상 편집에 특화된 매직툴을 제공합니다."
      }
    ]
  },
  // 22. Descript
  {
    id: 22,
    name: "Descript",
    category: "동영상", // 기존 카테고리 유지
    rating: 4.6,
    description: "텍스트 편집하듯 오디오/비디오를 편집하는 AI 도구. 음성-텍스트 변환, 오디오/비디오 제거, 오버더빙 등 다양한 기능 제공.",
    strengths: [
      "텍스트 기반 편집: 음성/영상을 텍스트처럼 편집하여 직관적",
      "오디오/비디오 자동 제거: 불필요한 필러 단어, 침묵 구간 자동 삭제",
      "오버더빙 (Overdub): 텍스트 입력으로 특정 목소리로 음성 생성",
      "화자 분리 및 자막 생성: 여러 화자 구분 및 자동 자막 생성"
    ],
    weaknesses: [
      "무료 버전 기능 및 사용 시간 제한",
      "복잡한 비디오 효과나 고급 편집에는 전문 편집 도구 필요",
      "한국어 음성 인식은 영어 대비 정확도 낮을 수 있음"
    ],
    freeLimitations: "무료 버전은 월 1시간 전사 및 일부 기능 제한.",
    features: ["음성→텍스트", "영상 편집", "오버더빙", "자막 생성"],
    usecases: [
      { title: "팟캐스트 편집", detail: "오디오 파일에서 불필요한 부분 제거, 음질 개선", example: "예: '팟캐스트 에피소드 편집 및 자막 생성'" },
      { title: "유튜브 영상 편집", detail: "영상에서 말실수, 침묵 구간 빠르게 제거", example: "예: '유튜브 브이로그 영상 클린업'" },
      { title: "회의록 영상화", detail: "음성 녹음된 회의 내용을 텍스트 기반으로 편집하고 영상으로 제작", example: "예: '팀 회의 하이라이트 영상 제작'" }
    ],
    integrations: [],
    link: "https://www.descript.com/",
    detail: "https://www.descript.com/",
    isKorean: false,
    isPopularKr: true,
    isPopular: false,
    // 경쟁 우위 정보
    competitiveAdvantage: [
      {
        targetTool: "Vrew (브루)",
        advantage: "오디오/비디오를 '텍스트'로 편집하는 혁신적인 방식이 강점입니다. 특히 오버더빙(목소리 합성) 기능이 뛰어나고, 불필요한 필러 단어를 자동으로 제거하는 기능이 유용합니다."
      }
    ]
  },
  // 23. Animaker
  {
    id: 23,
    name: "Animaker",
    category: "동영상", // 기존 카테고리 유지
    rating: 4.3,
    description: "AI 기반 애니메이션 비디오 제작 플랫폼. 드래그 앤 드롭 방식으로 캐릭터, 배경, 효과를 활용하여 전문적인 애니메이션 생성.",
    strengths: [
      "쉬운 애니메이션 제작: 비전문가도 쉽게 애니메이션 비디오 제작 가능",
      "다양한 캐릭터 및 템플릿: 미리 만들어진 캐릭터, 배경, 템플릿 활용",
      "AI 보이스오버: 텍스트를 자연스러운 음성으로 변환하여 더빙",
      "애니메이션 효과 자동화: 복잡한 움직임이나 전환 효과를 AI가 자동 적용"
    ],
    weaknesses: [
      "무료 버전 기능 및 해상도 제한",
      "매우 복잡하거나 섬세한 애니메이션 제작에는 한계",
      "생성된 영상의 독창성이 부족할 수 있음"
    ],
    freeLimitations: "무료 버전은 워터마크, 낮은 해상도, 일부 기능 제한.",
    features: ["애니메이션", "텍스트→음성", "템플릿", "캐릭터 생성"],
    usecases: [
      { title: "교육용 콘텐츠", detail: "학습 내용을 설명하는 애니메이션 영상 제작", example: "예: '과학 개념 설명 애니메이션'" },
      { title: "마케팅/홍보 영상", detail: "제품/서비스를 소개하는 애니메이션 광고 제작", example: "예: '새로운 앱 홍보 애니메이션'" },
      { title: "SNS 짧은 영상", detail: "소셜 미디어에 올릴 재미있는 애니메이션 클립 제작", example: "예: '명절 인사 애니메이션'" }
    ],
    integrations: [],
    link: "https://www.animaker.com/",
    detail: "https://www.animaker.com/",
    isKorean: false,
    isPopularKr: false,
    isPopular: false,
    // 경쟁 우위 정보
    competitiveAdvantage: [
      {
        targetTool: "전문 애니메이션 툴",
        advantage: "전문 지식 없이도 드래그 앤 드롭 방식으로 쉽게 애니메이션 비디오를 제작할 수 있으며, 다양한 캐릭터와 템플릿을 활용할 수 있습니다."
      }
    ]
  },
  // 24. Murf.ai
  {
    id: 24,
    name: "Murf.ai",
    category: "음성", // 기존 카테고리 유지
    rating: 4.7,
    description: "AI 기반 텍스트-음성 변환(TTS) 플랫폼. 스튜디오 품질의 자연스러운 AI 보이스를 제공하며, 다양한 언어와 스타일 지원.",
    strengths: [
      "자연스러운 음성: 사람처럼 자연스러운 AI 보이스 생성",
      "다양한 언어 및 목소리: 여러 언어와 성별, 나이, 톤의 목소리 선택 가능",
      "음성 편집 기능: 피치, 속도, 감정 등 세부 조절 가능",
      "배경 음악 및 효과음 추가: 전문적인 오디오 콘텐츠 제작 지원"
    ],
    weaknesses: [
      "무료 버전 사용 시간 제한: 긴 음성 파일 생성은 유료 플랜 필요",
      "커스텀 목소리 생성은 유료",
      "매우 미묘한 감정 표현은 아직 한계"
    ],
    freeLimitations: "무료 버전은 10분 음성 생성 제한. 일부 목소리만 사용 가능.",
    features: ["텍스트→음성", "다국어 음성", "감정 조절", "음성 편집"],
    usecases: [
      { title: "오디오북 제작", detail: "텍스트 스크립트를 자연스러운 AI 음성으로 변환하여 오디오북 생성", example: "예: '소설 오디오북 제작'" },
      { title: "유튜브/팟캐스트 더빙", detail: "영상이나 팟캐스트 콘텐츠에 AI 보이스 더빙", example: "예: '강의 영상에 AI 성우 더빙'" },
      { title: "광고/내레이션", detail: "제품 광고, 안내 방송, 다큐멘터리 내레이션 생성", example: "예: '매장 안내 방송 제작'" }
    ],
    integrations: [],
    link: "https://murf.ai/",
    detail: "https://murf.ai/",
    isKorean: false,
    isPopularKr: true,
    isPopular: false,
    // 경쟁 우위 정보
    competitiveAdvantage: [
      {
        targetTool: "ElevenLabs",
        advantage: "스튜디오 품질의 자연스러운 AI 보이스와 다양한 언어 및 스타일 지원이 강점입니다. 음성 편집 기능으로 세부적인 피치, 속도, 감정 조절이 가능합니다."
      }
    ]
  },
  // 25. Pika
  {
    id: 25,
    name: "Pika",
    category: "동영상", // 기존 카테고리 유지
    rating: 4.5,
    description: "텍스트 또는 이미지를 기반으로 동영상을 생성하는 AI. 간단한 명령으로 짧은 애니메이션이나 영상 클립 제작에 특화.",
    strengths: [
      "빠른 동영상 생성: 텍스트나 이미지 몇 장으로 짧은 영상 빠르게 생성",
      "다양한 스타일 지원: 애니메이션, 실사, 만화 등 다양한 비디오 스타일 구현",
      "간단한 인터페이스: 쉬운 조작으로 비디오 제작 경험이 없어도 사용 가능",
      "AI 기반 애니메이션: 자연스러운 움직임과 전환 효과 자동 적용"
    ],
    weaknesses: [
      "무료 버전 사용량 제한: 긴 영상 제작이나 고품질 영상에는 한계",
      "생성된 영상의 품질이 아직 완벽하지 않을 수 있음",
      "세부적인 스토리텔링이나 복잡한 연출에는 부족"
    ],
    freeLimitations: "무료 버전은 생성 크레딧 및 기능 제한.",
    features: ["텍스트→영상", "이미지→영상", "짧은 영상", "애니메이션"],
    usecases: [
      { title: "SNS 숏폼 비디오", detail: "인스타그램 릴스, 틱톡 등 짧은 바이럴 영상 제작", example: "예: '제품 특징 설명 숏폼 영상'" },
      { title: "GIF/움짤 생성", detail: "텍스트나 이미지로 간단한 움직이는 이미지 제작", example: "예: '재미있는 GIF 애니메이션'" },
      { title: "콘텐츠 도입부/클립", detail: "유튜브 영상의 짧은 인트로 또는 하이라이트 클립 생성", example: "예: '브이로그 영상 오프닝'" }
    ],
    integrations: [],
    link: "https://pika.art/",
    detail: "https://pika.art/",
    isKorean: false,
    isPopularKr: false,
    isPopular: false,
    // 경쟁 우위 정보
    competitiveAdvantage: [
      {
        targetTool: "Runway ML",
        advantage: "간단한 텍스트나 이미지를 통해 짧은 동영상을 빠르게 생성하는 데 특화되어 있습니다. SNS 숏폼 콘텐츠 제작에 효율적입니다."
      }
    ]
  },
  // 26. Luma AI
  {
    id: 26,
    name: "Luma AI",
    category: "동영상", // 기존 카테고리 유지
    rating: 4.6,
    description: "3D 모델 생성 및 동영상 제작에 특화된 AI. 특히 3D 스캔 및 사실적인 장면 생성에 강점.",
    strengths: [
      "3D 스캔 (NeRF): 사진 여러 장으로 실제와 같은 3D 장면 생성",
      "사실적인 영상 생성: 텍스트/이미지를 기반으로 고품질의 사실적인 비디오 클립 생성",
      "쉬운 3D 에셋 제작: 게임, VR/AR 콘텐츠 제작에 필요한 3D 에셋 자동 생성",
      "카메라 경로 제어: 생성된 3D 장면에서 원하는 카메라 움직임 구현 가능"
    ],
    weaknesses: [
      "무료 버전 사용량 제한 및 기능 제한",
      "고품질 3D 스캔을 위해서는 좋은 사진 자료 필요",
      "일반적인 영상 편집보다는 3D 관련 특수 기능에 중점"
    ],
    freeLimitations: "무료 생성 크레딧 제공 (제한적).",
    features: ["3D 스캔", "텍스트→3D", "사실적 영상", "카메라 제어"],
    usecases: [
      { title: "3D 환경 구축", detail: "실제 공간을 3D 모델로 변환하여 VR/AR 콘텐츠 제작", example: "예: '내 방을 3D로 스캔하여 가상 공간 생성'" },
      { title: "제품 3D 모델링", detail: "제품 사진으로 3D 모델 생성 및 홍보 영상 제작", example: "예: '새로운 신발 3D 모델링 및 360도 영상'" },
      { title: "메타버스 콘텐츠", detail: "메타버스 플랫폼에 활용할 3D 에셋 및 장면 생성", example: "예: '가상 전시회 공간 디자인'" }
    ],
    integrations: [],
    link: "https://lumalabs.ai/",
    detail: "https://lumalabs.ai/",
    isKorean: false,
    isPopularKr: false,
    isPopular: false,
    // 경쟁 우위 정보
    competitiveAdvantage: [
      {
        targetTool: "전문 3D 모델링 툴",
        advantage: "사진만으로 실제와 같은 3D 장면을 생성하는 NeRF 기술이 강점입니다. 복잡한 모델링 지식 없이도 사실적인 3D 콘텐츠를 제작할 수 있습니다."
      }
    ]
  },
  // 27. Synthesia
  {
    id: 27,
    name: "Synthesia",
    category: "동영상", // 기존 카테고리 유지
    rating: 4.8,
    description: "AI 아바타를 활용하여 전문적인 영상을 생성하는 플랫폼. 텍스트를 입력하면 AI 아바타가 다양한 언어로 발표하는 영상 제작.",
    strengths: [
      "AI 아바타 활용: 실제 사람처럼 보이는 AI 아바타가 자연스럽게 말하는 영상 생성",
      "다국어 지원: 텍스트를 다양한 언어로 번역하여 AI 아바타가 발표",
      "시간 및 비용 절감: 촬영, 배우 섭외 없이 영상 콘텐츠 빠르게 제작",
      "다양한 템플릿: 교육, 마케팅, 기업 홍보 등 다양한 목적의 템플릿 제공"
    ],
    weaknesses: [
      "유료 서비스: 무료 체험은 매우 제한적이며, 본격적인 사용은 고가 플랜 필요",
      "아바타의 감정 표현은 아직 자연스럽지 않을 수 있음",
      "세부적인 연출이나 즉흥적인 대화에는 한계"
    ],
    freeLimitations: "무료 데모 영상 생성 가능 (짧은 시간 제한).",
    features: ["AI 아바타", "텍스트→영상", "다국어 더빙", "영상 템플릿"],
    usecases: [
      { title: "교육 및 훈련 영상", detail: "AI 강사가 특정 주제를 설명하는 교육 영상 제작", example: "예: '신입사원 온보딩 교육 영상'" },
      { title: "기업 홍보 및 마케팅", detail: "제품/서비스를 소개하는 AI 아바타 홍보 영상 제작", example: "예: '회사 비전 소개 영상'" },
      { title: "뉴스 브리핑", detail: "최신 뉴스를 AI 아바타가 브리핑하는 영상 제작", example: "예: '오늘의 주요 뉴스 AI 앵커'" }
    ],
    integrations: [],
    link: "https://www.synthesia.io/",
    detail: "https://www.synthesia.io/",
    isKorean: false,
    isPopularKr: true,
    isPopular: true,
    // 경쟁 우위 정보
    competitiveAdvantage: [
      {
        targetTool: "HeyGen",
        advantage: "다양한 언어로 AI 아바타가 발표하는 전문적인 영상을 대본 기반으로 빠르게 제작할 수 있습니다. 특히 기업용 교육 및 홍보 영상 제작에 특화되어 있습니다."
      }
    ]
  },
  // 28. Taskade AI
  {
    id: 28,
    name: "Taskade AI",
    category: "생산성", // 기존 카테고리 유지
    rating: 4.4,
    description: "협업 작업 관리 도구 Taskade에 통합된 AI 기능. 아이디어 브레인스토밍, 할 일 목록 생성, 문서 작성 등 팀 생산성 향상 지원.",
    strengths: [
      "워크스페이스 통합: 프로젝트 관리 및 노트 작성 도구 내에서 AI 기능 활용",
      "생산성 향상: 아이디어 정리, 초안 작성, 회의록 요약 등 업무 효율 증대",
      "다양한 템플릿: 회의록, 프로젝트 계획, 브레인스토밍 등 다양한 템플릿 지원",
      "협업 기능: 팀원들과 AI 생성 콘텐츠를 공유하고 함께 작업"
    ],
    weaknesses: [
      "Taskade 사용자에게만 유용: 외부 활용 제한적",
      "매우 복잡하거나 전문적인 AI 작업에는 한계",
      "무료 버전 사용 제한적"
    ],
    freeLimitations: "무료 버전은 사용량 및 일부 고급 기능 제한.",
    features: ["할 일 관리", "아이디어 생성", "문서 작성", "협업"],
    usecases: [
      { title: "프로젝트 계획", detail: "새로운 프로젝트 아이디어 브레인스토밍 및 할 일 목록 자동 생성", example: "예: '새로운 앱 개발 프로젝트 계획 초안'" },
      { title: "회의록 요약", detail: "회의 내용을 요약하고 핵심 할 일 추출", example: "예: '지난주 팀 회의록 요약 및 담당자 지정'" },
      { title: "콘텐츠 기획", detail: "블로그 글, 마케팅 캠페인 등 콘텐츠 기획 초안 작성", example: "예: '새로운 마케팅 캠페인 아이디어 생성'" }
    ],
    integrations: ["Taskade"],
    link: "https://www.taskade.com/ai/",
    detail: "https://www.taskade.com/ai/",
    isKorean: false,
    isPopularKr: false,
    isPopular: false,
    // 경쟁 우위 정보
    competitiveAdvantage: [
      {
        targetTool: "Notion AI",
        advantage: "프로젝트 관리 및 작업 흐름에 AI 기능을 직접 통합하여, 팀 협업 환경에서 아이디어 구상, 할 일 관리, 문서 작성 등 생산성을 높이는 데 특화되어 있습니다."
      }
    ]
  },
  // 29. GitHub Copilot
  {
    id: 29,
    name: "GitHub Copilot",
    category: "코딩", // 기존 카테고리 유지
    rating: 4.8,
    description: "GitHub와 OpenAI가 개발한 AI 코딩 도우미. 주석이나 함수명만으로 코드를 자동 완성하거나 제안하여 개발 생산성 향상.",
    strengths: [
      "코드 자동 완성: 개발자가 코드를 작성하는 동안 실시간으로 코드 제안 및 자동 완성",
      "다양한 언어 지원: Python, JavaScript, Java 등 여러 프로그래밍 언어 지원",
      "생산성 향상: 반복적인 코드 작성 시간 단축, 버그 감소",
      "주석 기반 코드 생성: 자연어 주석을 통해 원하는 코드 스니펫 생성"
    ],
    weaknesses: [
      "유료 서비스: 무료 체험 후 유료 구독 필요",
      "가끔 부정확하거나 비효율적인 코드 제안",
      "보안 및 저작권 문제: 공개된 코드 기반 학습으로 인한 잠재적 문제",
      "초보 개발자는 AI 코드에 너무 의존할 수 있음"
    ],
    freeLimitations: "무료 체험 기간 제공 (이후 유료). 학생 및 특정 오픈소스 기여자에게는 무료 제공.",
    features: ["코드 자동 완성", "코드 제안", "버그 수정", "다국어 코딩"],
    usecases: [
      { title: "빠른 코드 작성", detail: "반복적인 코드나 패턴을 자동으로 완성하여 개발 시간 단축", example: "예: '파이썬 리스트 정렬 함수 작성'" },
      { title: "버그 찾기 및 수정", detail: "작성된 코드의 잠재적 버그를 식별하고 수정 제안", example: "예: '자바스크립트 코드 오류 수정'" },
      { title: "새로운 언어 학습", detail: "익숙하지 않은 프로그래밍 언어의 구문이나 패턴 학습 보조", example: "예: 'Go 언어 기본 문법 학습'" }
    ],
    integrations: ["VS Code", "JetBrains IDEs", "Visual Studio", "Neovim"],
    link: "https://github.com/features/copilot",
    detail: "https://github.com/features/copilot",
    isKorean: false,
    isPopularKr: true,
    isPopular: true,
    // 경쟁 우위 정보
    competitiveAdvantage: [
      {
        targetTool: "Replit Ghostwriter / Cursor",
        advantage: "가장 폭넓은 IDE 지원과 강력한 코드 자동 완성 및 제안 기능을 제공하여 개발 생산성을 크게 향상시킵니다. GitHub와의 통합으로 코드 관리와 연동성이 뛰어납니다."
      }
    ]
  },
  // 30. Cursor
  {
    id: 30,
    name: "Cursor",
    category: "코딩", // 기존 카테고리 유지
    rating: 4.7,
    description: "AI 기반 코드 편집기. AI가 코드를 작성, 수정, 디버깅하고, 코드베이스를 이해하여 질문에 답변.",
    strengths: [
      "AI 통합 코드 에디터: 에디터 내에서 직접 AI와 대화하며 코딩 작업 수행",
      "코드 생성 및 수정: 주석이나 질문으로 코드 자동 생성, 리팩토링, 버그 수정",
      "코드베이스 이해: 전체 프로젝트 코드를 이해하여 맥락에 맞는 답변 제공",
      "자동 문서화: 코드에 대한 문서나 설명 자동으로 생성"
    ],
    weaknesses: [
      "유료 서비스: 무료 버전은 사용량 제한",
      "IDE 기능은 VS Code 기반이므로 익숙하지 않을 수 있음",
      "AI의 답변이 항상 정확하지 않을 수 있음"
    ],
    freeLimitations: "무료 사용량 제한. 더 많은 기능은 유료 플랜 필요.",
    features: ["AI 코드 편집", "코드 생성", "코드 디버깅", "코드 설명"],
    usecases: [
      { title: "새로운 기능 개발", detail: "자연어 명령으로 새로운 기능 코드 작성", example: "예: '사용자 인증 시스템 코드 생성해줘'" },
      { title: "코드 리팩토링", detail: "복잡한 코드를 AI가 더 효율적으로 리팩토링 제안", example: "예: '이 함수를 더 간결하게 리팩토링해줘'" },
      { title: "코드 이해 및 설명", detail: "이해하기 어려운 코드 블록에 대해 AI에게 질문하고 설명 듣기", example: "예: '이 레거시 코드의 동작 방식 설명해줘'" }
    ],
    integrations: ["VS Code (Fork)"],
    link: "https://www.cursor.ai/",
    detail: "https://www.cursor.ai/",
    isKorean: false,
    isPopularKr: true,
    isPopular: false,
    // 경쟁 우위 정보
    competitiveAdvantage: [
      {
        targetTool: "GitHub Copilot",
        advantage: "코드 에디터 자체에 AI 기능이 깊이 통합되어 있어, 코드베이스를 이해하고 자연어로 질문/명령하여 코드를 작성, 수정, 디버깅하는 데 특화되어 있습니다."
      }
    ]
  },
  // 31. Replit Ghostwriter
  {
    id: 31,
    name: "Replit Ghostwriter",
    category: "코딩", // 기존 카테고리 유지
    rating: 4.5,
    description: "온라인 IDE Replit에 통합된 AI 코딩 도우미. 코드 자동 완성, 코드 생성, 변환 등 실시간 코딩 지원.",
    strengths: [
      "온라인 IDE 통합: 웹 브라우저에서 바로 AI 코딩 환경 제공",
      "코드 자동 완성 및 제안: 실시간으로 코드를 제안하여 빠르게 개발",
      "코드 변환 및 설명: 다른 언어로 코드 변환, 코드 설명 등 지원",
      "다양한 프로그래밍 언어 지원: 여러 언어로 프로젝트 개발 가능"
    ],
    weaknesses: [
      "무료 버전 사용량 제한",
      "온라인 환경이므로 인터넷 연결 필수",
      "오프라인 IDE 대비 기능이 제한적일 수 있음"
    ],
    freeLimitations: "무료 사용 가능 (생성 크레딧 및 기능 제한).",
    features: ["온라인 IDE", "코드 자동 완성", "코드 변환", "코드 설명"],
    usecases: [
      { title: "빠른 프로토타이핑", detail: "새로운 아이디어의 코드를 웹에서 빠르게 작성 및 테스트", example: "예: '간단한 웹 애플리케이션 프로토타입 개발'" },
      { title: "코딩 학습", detail: "실시간 코드 제안을 받으며 효율적으로 코딩 학습", example: "예: '파이썬 기초 문법 익히기'" },
      { title: "협업 코딩", detail: "팀원들과 온라인에서 AI 도움을 받으며 실시간으로 협업", example: "예: '팀 프로젝트 코드 공동 작성'" }
    ],
    integrations: ["Replit"],
    link: "https://replit.com/site/ghostwriter",
    detail: "https://replit.com/site/ghostwriter",
    isKorean: false,
    isPopularKr: true,
    isPopular: false,
    // 경쟁 우위 정보
    competitiveAdvantage: [
      {
        targetTool: "GitHub Copilot / Cursor",
        advantage: "웹 브라우저 기반의 온라인 IDE에 AI 코딩 도우미가 통합되어 있어, 설치 없이 언제 어디서든 코딩 및 협업 작업이 가능합니다."
      }
    ]
  },
  // 32. Kaiber
  {
    id: 32,
    name: "Kaiber",
    category: "동영상", // 기존 카테고리 유지
    rating: 4.5,
    description: "텍스트나 오디오를 기반으로 독특한 AI 애니메이션 및 뮤직 비디오를 생성하는 도구. 예술적인 영상 제작에 특화.",
    strengths: [
      "예술적인 영상 생성: 창의적이고 독특한 스타일의 애니메이션/비디오 제작",
      "텍스트/오디오→영상: 텍스트 설명이나 음악을 기반으로 영상 생성",
      "뮤직 비디오 제작: 음악에 맞춰 비주얼을 자동 생성하여 뮤직 비디오 제작",
      "다양한 스타일 및 효과: 애니메이션, 실사, 추상 등 여러 스타일 지원"
    ],
    weaknesses: [
      "무료 체험 제한적: 본격적인 사용은 유료 구독 필요",
      "긴 영상이나 복잡한 스토리텔링에는 한계",
      "결과물의 품질이 프롬프트와 오디오에 따라 달라짐"
    ],
    freeLimitations: "제한된 무료 체험 크레딧 제공.",
    features: ["텍스트→영상", "오디오→영상", "뮤직 비디오", "예술적 영상"],
    usecases: [
      { title: "뮤직 비디오 제작", detail: "자작곡이나 음원에 맞춰 독특한 비디오 클립 생성", example: "예: '새로운 노래의 뮤직 비디오 아트워크'" },
      { title: "NFT 아트 영상", detail: "정적인 NFT 이미지를 움직이는 비디오 아트로 변환", example: "예: 'NFT 컬렉션 홍보 영상'" },
      { title: "실험적인 비주얼 아트", detail: "추상적인 개념이나 아이디어를 시각화한 영상 제작", example: "예: '개념 예술 비디오'" }
    ],
    integrations: [],
    link: "https://kaiber.ai/",
    detail: "https://kaiber.ai/",
    isKorean: false,
    isPopularKr: false,
    isPopular: false,
    // 경쟁 우위 정보
    competitiveAdvantage: [
      {
        targetTool: "Runway ML / Pika",
        advantage: "텍스트나 오디오를 기반으로 독특하고 예술적인 애니메이션 및 뮤직 비디오를 생성하는 데 특화되어 있습니다. 음악과의 싱크로나이즈 기능이 강점입니다."
      }
    ]
  },
  // 33. Remove.bg
  {
    id: 33,
    name: "Remove.bg",
    category: "디자인", // 기존 카테고리 유지
    rating: 4.8,
    description: "AI 기반 이미지 배경 제거 서비스. 인물, 사물 등 이미지에서 배경을 빠르고 정확하게 자동으로 제거.",
    strengths: [
      "간편한 사용법: 이미지 업로드만으로 배경 자동 제거",
      "높은 정확도: 복잡한 배경이나 머리카락 등 섬세한 부분도 정교하게 제거",
      "빠른 처리 속도: 몇 초 안에 배경이 제거된 이미지 제공",
      "API 지원: 대량의 이미지 처리 자동화 가능"
    ],
    weaknesses: [
      "고해상도 이미지 다운로드는 유료 크레딧 필요",
      "배경이 너무 복잡하거나 전경과 유사할 경우 완벽하지 않을 수 있음",
      "배경을 남겨야 하는 특정 상황에서는 수동 편집 필요"
    ],
    freeLimitations: "무료로 저해상도 이미지 다운로드 가능 (크레딧 필요). 고해상도는 유료 크레딧 필요.",
    features: ["배경 제거", "누끼 따기", "자동화", "고품질"],
    usecases: [
      { title: "쇼핑몰 제품 이미지", detail: "제품 사진에서 배경을 제거하여 깔끔한 상품 이미지 제작", example: "예: '새로운 옷 제품 상세 페이지 이미지'" },
      { title: "프로필 사진 편집", detail: "인물 사진의 배경을 투명하게 만들어 다른 배경에 합성", example: "예: 'SNS 프로필 사진 배경 교체'" },
      { title: "디자인 작업 보조", detail: "배경이 제거된 이미지를 활용하여 포스터, 배너 등 디자인", example: "예: '이벤트 포스터에 인물 합성'" }
    ],
    integrations: ["API", "Photoshop Plugin", "Figma Plugin"],
    link: "https://www.remove.bg/",
    detail: "https://www.remove.bg/",
    isKorean: false,
    isPopularKr: true,
    isPopular: true,
    // 경쟁 우위 정보
    competitiveAdvantage: [
      {
        targetTool: "전문 이미지 편집 툴",
        advantage: "간단한 업로드만으로 매우 정확하고 빠르게 이미지 배경을 제거합니다. 특히 대량의 이미지 처리나 웹/이커머스 용도의 자동화에 효율적입니다."
      }
    ]
  },
  // 34. Storytell.ai
  {
    id: 34,
    name: "Storytell.ai",
    category: "요약", // 세분화된 카테고리
    rating: 4.3,
    description: "AI 기반 오디오/비디오 콘텐츠 요약 및 핵심 정보 추출 도구. 회의, 강의, 팟캐스트 등 긴 콘텐츠의 핵심을 빠르게 파악.",
    strengths: [
      "콘텐츠 요약: 긴 오디오/비디오 콘텐츠의 핵심 내용을 자동으로 요약",
      "핵심 정보 추출: 중요한 키워드, 주제, 액션 아이템 등을 식별하여 제시",
      "시간 절약: 방대한 양의 콘텐츠를 직접 듣거나 보지 않고 빠르게 파악",
      "질의응답: 콘텐츠 내용에 대해 질문하고 AI로부터 답변 얻기"
    ],
    weaknesses: [
      "무료 사용량 제한: 긴 콘텐츠 처리는 유료 플랜 필요",
      "오디오/비디오 품질에 따라 인식률 영향",
      "아직 완벽한 요약이나 모든 뉘앙스 파악은 어려움"
    ],
    freeLimitations: "제한된 무료 사용량 제공.",
    features: ["오디오/영상 요약", "핵심 추출", "질의응답", "텍스트 변환"],
    usecases: [
      { title: "회의 내용 요약", detail: "녹음된 회의 내용을 텍스트로 변환하고 핵심 요약", example: "예: '지난 팀 회의 주요 결정 사항 요약'" },
      { title: "강의 노트 자동 생성", detail: "온라인 강의 영상/음성 요약 및 주요 개념 추출", example: "예: '온라인 강좌 핵심 내용 노트 만들기'" },
      { title: "팟캐스트 핵심 파악", detail: "긴 팟캐스트 에피소드의 주요 주제 및 내용 요약", example: "예: '이번 주 팟캐스트 하이라이트'" }
    ],
    integrations: [],
    link: "https://www.storytell.ai/",
    detail: "https://www.storytell.ai/",
    isKorean: false,
    isPopularKr: false,
    isPopular: false,
    // 경쟁 우위 정보
    competitiveAdvantage: [
      {
        targetTool: "CLOVA Note / Vrew",
        advantage: "오디오/비디오 콘텐츠의 '요약' 및 '핵심 정보 추출'에 특화되어 있습니다. 긴 회의, 강의, 팟캐스트의 핵심 내용을 빠르게 파악하는 데 강점을 보입니다."
      }
    ]
  },
  // 35. Pixian AI
  {
    id: 35,
    name: "Pixian AI",
    category: "이미지", // 기존 카테고리 유지
    rating: 4.4,
    description: "AI 기반의 이미지 편집 도구. 배경 제거, 이미지 향상, 개체 제거 등 다양한 이미지 편집 기능을 제공.",
    strengths: [
      "다양한 편집 기능: 배경 제거, 이미지 해상도 향상, 노이즈 제거 등",
      "간편한 사용법: 복잡한 기술 없이도 전문가 수준의 이미지 편집 가능",
      "빠른 처리 속도: AI가 자동으로 이미지 분석 및 편집 수행",
      "API 지원: 대량의 이미지 처리 자동화 가능"
    ],
    weaknesses: [
      "무료 사용량 제한: 고해상도 이미지 처리 또는 대량 작업은 유료 크레딧 필요",
      "매우 복잡하거나 예술적인 편집에는 한계",
      "부분적인 수동 보정은 필요할 수 있음"
    ],
    freeLimitations: "제한된 무료 크레딧 제공.",
    features: ["배경 제거", "이미지 향상", "개체 제거", "리사이징"],
    usecases: [
      { title: "온라인 쇼핑몰 이미지", detail: "제품 사진의 배경 제거 및 화질 개선", example: "예: '쇼핑몰 제품 이미지 보정'" },
      { title: "SNS 프로필/콘텐츠", detail: "개인 사진 배경 제거, 불필요한 요소 제거", example: "예: '여행 사진 배경 정리'" },
      { title: "디자인 자료 준비", detail: "디자인에 필요한 이미지의 배경을 제거하고 품질 향상", example: "예: '웹사이트 배너 이미지 준비'" }
    ],
    integrations: ["API"],
    link: "https://pixian.ai/",
    detail: "https://pixian.ai/",
    isKorean: false,
    isPopularKr: false,
    isPopular: false,
    // 경쟁 우위 정보
    competitiveAdvantage: [
      {
        targetTool: "Remove.bg",
        advantage: "Remove.bg가 배경 제거에 특화되어 있다면, Pixian AI는 배경 제거 외에도 이미지 향상, 개체 제거 등 다양한 AI 기반 이미지 편집 기능을 제공하여 다용도로 활용할 수 있습니다."
      }
    ]
  },
  // 36. Gamma
  {
    id: 36,
    name: "Gamma",
    category: "생산성", // 기존 카테고리 유지
    rating: 4.6,
    description: "AI 기반의 프레젠테이션 및 문서 생성 도구. 텍스트를 입력하면 자동으로 슬라이드나 문서를 디자인하고 구성.",
    strengths: [
      "자동 디자인: 텍스트만으로 프레젠테이션, 문서, 웹페이지를 자동으로 디자인",
      "템플릿 및 스타일: 다양한 디자인 템플릿과 스타일 제공",
      "시간 절약: 프레젠테이션 디자인에 드는 시간 대폭 단축",
      "협업 기능: 팀원들과 실시간으로 문서/슬라이드 공동 작업"
    ],
    weaknesses: [
      "무료 버전 사용 제한: 더 많은 기능은 유료 플랜 필요",
      "복잡하거나 매우 독창적인 디자인에는 수동 편집 필요",
      "AI가 생성한 내용의 정확성 검토 필요"
    ],
    freeLimitations: "제한된 무료 크레딧 제공. (초기 200크레딧, 초대 시 200크레딧)",
    features: ["프레젠테이션 자동화", "문서 생성", "디자인 템플릿", "협업"],
    usecases: [
      { title: "빠른 발표 자료 제작", detail: "아이디어만으로 프레젠테이션 슬라이드 자동 생성", example: "예: '신제품 발표 자료 5분 만에 만들기'" },
      { title: "보고서 초안 작성", detail: "회의록이나 요약 텍스트로 보고서 초안 생성", example: "예: '월간 업무 보고서 디자인 및 내용 구성'" },
      { title: "워크숍/세미나 자료", detail: "교육 자료나 세미나 발표 자료를 빠르게 디자인", example: "예: 'AI 입문자를 위한 세미나 슬라이드'" }
    ],
    integrations: [],
    link: "https://gamma.app/",
    detail: "https://gamma.app/",
    isKorean: false,
    isPopularKr: true,
    isPopular: false,
    // 경쟁 우위 정보
    competitiveAdvantage: [
      {
        targetTool: "PowerPoint / Google Slides",
        advantage: "텍스트 입력만으로 AI가 자동으로 슬라이드를 디자인하고 구성하여 프레젠테이션 제작 시간을 대폭 단축시킵니다. 특히 디자인에 익숙하지 않은 사용자에게 매우 유용합니다."
      },
      {
        targetTool: "Beautiful.ai / Slidebean",
        advantage: "Beautiful.ai나 Slidebean이 특정 프레젠테이션 유형에 특화되어 있다면, Gamma는 일반적인 문서 및 웹페이지 생성까지 지원하여 더 넓은 범위의 자동 디자인이 가능합니다."
      }
    ]
  },
  // 37. Vidio.ai
  {
    id: 37,
    name: "Vidio.ai",
    category: "동영상", // 기존 카테고리 유지
    rating: 4.4,
    description: "AI 기반의 동영상 생성 및 편집 도구. 텍스트를 입력하여 자동으로 영상 클립을 만들고, 자막, 배경 음악 등 추가.",
    strengths: [
      "텍스트→영상: 간단한 텍스트로 짧은 동영상 자동 생성",
      "자막 및 배경 음악 자동 추가: 영상에 필요한 요소 자동 적용",
      "다양한 영상 템플릿: 목적에 맞는 템플릿 선택하여 빠르게 제작",
      "쉬운 사용법: 비디오 제작 경험이 없어도 편리하게 사용"
    ],
    weaknesses: [
      "무료 버전 기능 및 길이 제한",
      "고품질 또는 복잡한 연출의 영상 제작에는 한계",
      "한국어 음성 변환이나 자막은 품질이 낮을 수 있음"
    ],
    freeLimitations: "제한된 무료 영상 생성 및 워터마크.",
    features: ["텍스트→영상", "자동 자막", "배경 음악", "영상 템플릿"],
    usecases: [
      { title: "SNS 광고 영상", detail: "짧은 제품 소개나 이벤트 홍보 영상 제작", example: "예: '새로운 앱 광고 영상'" },
      { title: "교육용 짧은 클립", detail: "특정 개념을 설명하는 짧은 교육용 비디오 제작", example: "예: '30초 금융 상식 영상'" },
      { title: "뉴스 요약 영상", detail: "텍스트 뉴스 기사를 기반으로 요약 영상 생성", example: "예: '오늘의 IT 뉴스 브리핑 영상'" }
    ],
    integrations: [],
    link: "https://vidio.ai/",
    detail: "https://vidio.ai/",
    isKorean: false,
    isPopularKr: false,
    isPopular: false,
    // 경쟁 우위 정보
    competitiveAdvantage: [
      {
        targetTool: "Runway ML / Pika",
        advantage: "텍스트 입력만으로 짧은 동영상을 자동으로 생성하고, 자막 및 배경 음악을 자동으로 추가하여 빠르고 쉽게 SNS용 콘텐츠나 설명 영상을 만들 수 있습니다."
      }
    ]
  },
  // 38. Napkin
  {
    id: 38,
    name: "Napkin",
    category: "생산성", // 기존 카테고리 유지
    rating: 4.2,
    description: "AI 기반 아이디어 관리 및 확장 도구. 메모나 생각을 입력하면 AI가 관련 아이디어를 제안하고 연결하여 새로운 인사이트 발견.",
    strengths: [
      "아이디어 확장: 단편적인 메모에서 AI가 새로운 아이디어 확장 제안",
      "지식 연결: 서로 다른 아이디어 간의 연관성 발견 및 연결",
      "시각적 정리: 아이디어를 그래프나 맵 형태로 시각화하여 정리",
      "창의적 사고 증진: 기존 사고방식을 넘어 새로운 관점 제시"
    ],
    weaknesses: [
      "무료 사용량 제한 및 고급 기능은 유료",
      "AI의 제안이 항상 유용하지 않을 수 있음",
      "한국어 아이디어 처리 능력은 영어 대비 부족"
    ],
    freeLimitations: "제한된 무료 사용량 제공.",
    features: ["아이디어 관리", "아이디어 확장", "지식 연결", "시각화"],
    usecases: [
      { title: "브레인스토밍 보조", detail: "새로운 프로젝트 아이디어를 AI와 함께 브레인스토밍", example: "예: '새로운 서비스 아이디어 구상'" },
      { title: "창작 활동 지원", detail: "소설, 시나리오, 그림 등 창작 소재 및 영감 얻기", example: "예: '새로운 소설의 줄거리 아이디어'" },
      { title: "학습 및 연구", detail: "복잡한 개념들 간의 관계를 파악하고 새로운 관점 발견", example: "예: '역사적 사건들 간의 인과 관계 분석'" }
    ],
    integrations: [],
    link: "https://www.napkin.ai/",
    detail: "https://www.napkin.ai/",
    isKorean: false,
    isPopularKr: false,
    isPopular: false,
    // 경쟁 우위 정보
    competitiveAdvantage: [
      {
        targetTool: "MindMeister / Boardmix",
        advantage: "단편적인 메모나 생각에서 AI가 관련 아이디어를 제안하고 연결하여 새로운 인사이트를 발견하는 데 특화되어 있습니다. 창의적 사고를 확장하는 데 유리합니다."
      }
    ]
  },
  // 39. Vrew (브루)
  {
    id: 39,
    name: "Vrew (브루)",
    category: "동영상", // 기존 카테고리 유지
    rating: 4.7,
    description: "AI 기반 동영상 편집 프로그램. 음성을 텍스트로 자동 변환하고, 텍스트 편집하듯 영상을 편집할 수 있어 편리하다.",
    strengths: [
      "음성→텍스트 자동 변환: 영상의 음성을 정확하게 텍스트로 변환하여 자막 자동 생성",
      "텍스트 기반 편집: 텍스트를 수정하듯 영상을 편집하여 직관적",
      "자동 자막 및 번역: 생성된 자막을 자동으로 번역하여 다국어 영상 제작 용이",
      "간편한 영상 편집: 컷 편집, 배경 음악, 효과음 등 기본적인 편집 기능 제공"
    ],
    weaknesses: [
      "무료 버전 사용량 제한: 긴 영상 편집은 유료 플랜 필요",
      "고급 영상 효과나 전문적인 색 보정 등은 한계",
      "음질이 좋지 않은 영상은 인식률 저하 가능"
    ],
    freeLimitations: "무료 버전은 월 120분 영상 편집 제한.",
    features: ["음성→텍스트", "자동 자막", "텍스트 기반 편집", "영상 편집"],
    usecases: [
      { title: "유튜브 영상 편집", detail: "영상 대본 기반으로 빠르게 영상 편집 및 자막 생성", example: "예: '유튜브 강의 영상 편집'" },
      { title: "강의/회의 영상 편집", detail: "녹화된 강의나 회의 영상을 텍스트로 편집하여 효율성 증대", example: "예: '온라인 세미나 영상 핵심 정리'" },
      { title: "숏폼 비디오 제작", detail: "짧은 영상 클립을 만들고 자막을 빠르게 추가", example: "예: '틱톡 숏폼 영상 자막 넣기'" }
    ],
    integrations: [],
    link: "https://vrew.com/",
    detail: "https://vrew.com/",
    isKorean: true,
    isPopularKr: true,
    isPopular: true,
    // 경쟁 우위 정보
    competitiveAdvantage: [
      {
        targetTool: "Descript",
        advantage: "한국어 음성 인식 및 텍스트 기반 영상 편집에 매우 강합니다. 국내 사용자에게 특화된 자동 자막 및 번역 기능을 제공하여 영상 제작 효율을 높입니다."
      }
    ]
  },
  // 40. Lilys (릴리스)
  {
    id: 40,
    name: "Lilys (릴리스)",
    category: "생산성", // 기존 카테고리 유지
    rating: 4.3,
    description: "AI 기반의 개인 비서 및 정보 관리 도구. 이메일 작성, 요약, 일정 관리 등 일상 및 업무 생산성 향상 지원.",
    strengths: [
      "개인 맞춤형 비서: 사용자 패턴 학습을 통해 맞춤형 정보 및 제안",
      "이메일/문서 작성: AI가 이메일 초안 작성, 문서 요약 등 지원",
      "일정 관리 및 알림: 일정 추천, 알림 설정 등 효율적인 시간 관리",
      "정보 관리: 중요한 정보 자동 분류 및 검색 용이"
    ],
    weaknesses: [
      "무료 사용량 제한: 고급 기능은 유료 플랜 필요",
      "복잡하거나 전문적인 업무 처리에는 한계",
      "개인 정보 보안에 대한 우려"
    ],
    freeLimitations: "제한된 무료 사용량 제공.",
    features: ["개인 비서", "이메일 작성", "일정 관리", "정보 요약"],
    usecases: [
      { title: "이메일 초안 작성", detail: "간단한 키워드로 비즈니스/개인 이메일 초안 생성", example: "예: '거래처에 보낼 미팅 확인 이메일'" },
      { title: "문서 요약 및 정리", detail: "긴 문서나 웹페이지 내용 요약 및 핵심 정리", example: "예: '뉴스레터 주요 내용 요약'" },
      { title: "일상 업무 자동화", detail: "반복적인 업무 알림 설정, 간단한 보고서 작성 지원", example: "예: '매일 아침 오늘의 할 일 정리'" }
    ],
    integrations: ["Email Clients", "Calendar Apps"],
    link: "https://lilys.ai/", // 실제 링크 확인 필요
    detail: "https://lilys.ai/", // 실제 링크 확인 필요
    isKorean: true,
    isPopularKr: false,
    isPopular: false,
    // 경쟁 우위 정보
    competitiveAdvantage: [
      {
        targetTool: "Notion AI / Taskade AI",
        advantage: "개인 비서 기능에 초점을 맞춰 이메일 작성, 일정 관리, 정보 요약 등 일상 및 업무 자동화에 특화되어 있습니다. 사용자 패턴을 학습하여 맞춤형 정보를 제공합니다."
      }
    ]
  },
  // 41. Boardmix
  {
    id: 41,
    name: "Boardmix",
    category: "협업", // 새로운 카테고리 추가
    rating: 4.5,
    description: "AI 기반의 온라인 화이트보드 협업 도구. 브레인스토밍, 다이어그램, 프로젝트 계획 등 시각적 협업을 AI로 지원.",
    strengths: [
      "AI 브레인스토밍: AI가 아이디어 제안, 키워드 연결하여 효율적인 브레인스토밍",
      "다이어그램 자동 생성: 텍스트를 기반으로 순서도, 마인드맵 등 다이어그램 자동 생성",
      "실시간 협업: 팀원들과 함께 실시간으로 아이디어 공유 및 작업",
      "다양한 템플릿: 회의, 기획, 디자인 등 다양한 협업 템플릿 제공"
    ],
    weaknesses: [
      "무료 버전 기능 및 저장 공간 제한",
      "복잡한 다이어그램이나 대규모 프로젝트에는 한계",
      "인터넷 연결이 불안정할 경우 사용 어려움"
    ],
    freeLimitations: "무료 버전은 파일 수 및 기능 제한.",
    features: ["AI 화이트보드", "마인드맵", "다이어그램", "실시간 협업"],
    usecases: [
      { title: "팀 브레인스토밍", detail: "AI 도움을 받아 새로운 프로젝트 아이디어 발산 및 정리", example: "예: '신제품 기획 아이디어 회의'" },
      { title: "프로젝트 계획 시각화", detail: "프로젝트 진행 상황, 워크플로우를 다이어그램으로 자동 생성", example: "예: '새로운 기능 개발 프로젝트 순서도'" },
      { title: "교육 자료 제작", detail: "학습 내용을 마인드맵이나 플로우차트로 시각화", example: "예: '복잡한 개념 설명 마인드맵'" }
    ],
    integrations: [],
    link: "https://boardmix.com/",
    detail: "https://boardmix.com/",
    isKorean: false,
    isPopularKr: false,
    isPopular: false,
    // 경쟁 우위 정보
    competitiveAdvantage: [
      {
        targetTool: "Miro / Mural",
        advantage: "온라인 화이트보드 기능에 AI를 통합하여 브레인스토밍 및 다이어그램 자동 생성 기능을 제공합니다. 특히 팀의 시각적 협업 효율을 높이는 데 강점이 있습니다."
      }
    ]
  },
  // 42. MindMeister
  {
    id: 42,
    name: "MindMeister",
    category: "생산성", // 기존 카테고리 유지 (아이디어는 생산성에 포함)
    rating: 4.4,
    description: "온라인 마인드맵 도구에 AI 기능이 통합되어 아이디어 생성 및 시각화 지원. 복잡한 생각을 정리하고 공유하는 데 유용.",
    strengths: [
      "직관적인 마인드맵: 아이디어를 시각적으로 쉽게 정리하고 연결",
      "AI 아이디어 제안: 입력된 키워드나 주제로 AI가 새로운 아이디어 확장",
      "협업 기능: 팀원들과 실시간으로 마인드맵 공동 작업",
      "다양한 내보내기 옵션: PDF, 이미지, 워드 등으로 마인드맵 내보내기"
    ],
    weaknesses: [
      "무료 버전 생성 개수 제한",
      "AI 기능은 보조 역할이며, 핵심 아이디어는 사용자에게서 나와야 함",
      "장문의 텍스트 처리에는 적합하지 않음"
    ],
    freeLimitations: "무료 버전은 마인드맵 3개까지 생성 가능.",
    features: ["마인드맵", "아이디어 생성", "시각화", "협업"],
    usecases: [
      { title: "강의/회의 내용 정리", detail: "복잡한 강의 내용이나 회의록을 마인드맵으로 시각화하여 정리", example: "예: '프로젝트 기획 회의 마인드맵'" },
      { title: "새로운 아이디어 발상", detail: "브레인스토밍 과정에서 AI가 아이디어 가지 확장 지원", example: "예: '새로운 앱 서비스 기능 아이디어'" },
      { title: "학습 내용 요약", detail: "학습할 내용을 마인드맵으로 구조화하여 효율적인 학습", example: "예: '역사 과목 핵심 정리 마인드맵'" }
    ],
    integrations: ["Google Workspace", "Microsoft 365"],
    link: "https://www.mindmeister.com/",
    detail: "https://www.mindmeister.com/",
    isKorean: false,
    isPopularKr: false,
    isPopular: false,
    // 경쟁 우위 정보
    competitiveAdvantage: [
      {
        targetTool: "XMind / FreeMind",
        advantage: "온라인 마인드맵 도구에 AI 기능을 통합하여 아이디어 생성 및 시각화를 돕습니다. 실시간 협업 기능이 뛰어나 팀 단위의 아이디어 정리에 유리합니다."
      },
      {
        targetTool: "Napkin",
        advantage: "Napkin이 단편적인 아이디어 확장/연결에 특화되었다면, MindMeister는 AI를 활용하여 마인드맵 형태로 복잡한 아이디어를 구조화하고 협업하는 데 강점이 있습니다."
      }
    ]
  },
  // 43. Consensus
  {
    id: 43,
    name: "Consensus",
    category: "AI검색", // 세분화된 카테고리
    rating: 4.7,
    description: "AI 기반 학술 검색 엔진. 과학 논문에서 직접 증거를 찾아 질문에 답변하고, 연구 내용을 요약.",
    strengths: [
      "학술적 증거 기반: 과학 논문에서 직접 추출한 정보로 답변의 신뢰도 높음",
      "연구 내용 요약: 복잡한 학술 논문을 AI가 쉽게 요약",
      "관련 논문 추천: 질문과 관련된 추가 논문 추천",
      "시간 절약: 방대한 학술 자료를 일일이 읽지 않고 핵심 정보 파악"
    ],
    weaknesses: [
      "주로 과학 및 의학 분야에 특화: 다른 분야의 정보는 제한적",
      "무료 사용량 제한: 더 많은 검색 및 기능은 유료 구독 필요",
      "답변이 간혹 너무 요약되어 추가적인 자료 탐색 필요"
    ],
    freeLimitations: "무료 검색 횟수 제한. (월 20회)",
    features: ["학술 검색", "논문 요약", "증거 기반 답변", "관련 논문"],
    usecases: [
      { title: "학술 연구 자료 수집", detail: "특정 연구 주제에 대한 최신 논문 및 증거 검색", example: "예: '인공지능의 의료 적용 사례 논문 검색'" },
      { title: "논문 요약 및 이해", detail: "어렵고 긴 논문의 핵심 내용을 빠르게 요약하고 이해", example: "예: '최신 암 연구 논문 요약'" },
      { title: "보고서 작성 보조", detail: "학술적 근거가 필요한 보고서 작성 시 자료 수집", example: "예: '기후 변화 보고서에 인용할 데이터 찾기'" }
    ],
    integrations: [],
    link: "https://consensus.app/",
    detail: "https://consensus.app/",
    isKorean: false,
    isPopularKr: true,
    isPopular: false,
    // 경쟁 우위 정보
    competitiveAdvantage: [
      {
        targetTool: "Perplexity AI / 일반 검색 엔진",
        advantage: "일반 검색 엔진과 달리 '과학 논문'에서 직접 증거를 찾아 답변하고 요약하여, 학술적 정보의 신뢰도와 깊이가 매우 높습니다. 특히 연구자에게 유용합니다."
      }
    ]
  },
  // 44. Scite.ai
  {
    id: 44,
    name: "Scite.ai",
    category: "AI검색", // 세분화된 카테고리
    rating: 4.6,
    description: "학술 논문의 인용문을 분석하여 주장의 지지 또는 반박 여부를 보여주는 AI 도구. 연구의 신뢰성을 검증하는 데 유용.",
    strengths: [
      "인용문 분석: 특정 주장이 다른 논문에서 어떻게 인용되고 지지/반박되는지 분석",
      "신뢰성 검증: 연구 결과나 주장의 신뢰도를 객관적으로 평가",
      "관련 논문 탐색: 특정 주장에 대한 다양한 관점의 논문 쉽게 찾기",
      "시간 절약: 수많은 논문을 직접 읽지 않고도 핵심 정보 파악"
    ],
    weaknesses: [
      "주로 학술 연구자에게 유용: 일반 사용자에게는 어려울 수 있음",
      "무료 사용량 제한: 모든 기능 사용을 위해서는 유료 구독 필요",
      "비영어권 논문 분석에는 한계"
    ],
    freeLimitations: "제한된 무료 검색 및 분석 횟수 제공.",
    features: ["인용 분석", "논문 검증", "학술 검색", "데이터 시각화"],
    usecases: [
      { title: "논문 작성 시 인용 검증", detail: "자신이 인용할 논문의 주장이 다른 연구에서 어떻게 평가되는지 확인", example: "예: '이 연구 결과가 다른 논문에서 지지되는지 확인'" },
      { title: "연구 주제 신뢰성 평가", detail: "새로운 연구 주제나 가설에 대한 기존 연구의 지지 여부 파악", example: "예: '최근 발표된 이론의 신뢰도 분석'" },
      { title: "학술 자료 조사", detail: "특정 주장에 대한 찬반 논문들을 효율적으로 검색", example: "예: '특정 치료법의 효과에 대한 논문 동향 파악'" }
    ],
    integrations: [],
    link: "https://scite.ai/",
    detail: "https://scite.ai/",
    isKorean: false,
    isPopularKr: false,
    isPopular: false,
    // 경쟁 우위 정보
    competitiveAdvantage: [
      {
        targetTool: "Consensus",
        advantage: "학술 논문의 '인용 문맥'을 분석하여 특정 주장이 다른 연구에서 어떻게 지지되거나 반박되는지 보여주는 데 특화되어 있습니다. 연구의 신뢰성 검증에 강력합니다."
      }
    ]
  },
  // 45. Copy.ai
  {
    id: 45,
    name: "Copy.ai",
    category: "텍스트생성", // 세분화된 카테고리
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
    features: ["마케팅 글쓰기", "광고 문구", "블로그 생성", "이메일 작성"],
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
    // 경쟁 우위 정보
    competitiveAdvantage: [
      {
        targetTool: "Wrtn (뤼튼)",
        advantage: "다양한 마케팅 콘텐츠 유형에 특화되어 있으며, 특히 영문 콘텐츠 생성에서 폭넓은 템플릿과 빠른 생성 속도를 자랑합니다."
      }
    ]
  },
  // 46. 무하유 (카피킬러)
  {
    id: 46,
    name: "무하유 (카피킬러)",
    category: "교정/편집", // 세분화된 카테고리 (표절 검사는 교정/편집의 하위로 볼 수 있음)
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
    features: ["표절 검사", "출처 분석", "유사율 검사", "문서 보안"],
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
    // 경쟁 우위 정보
    competitiveAdvantage: [
      {
        targetTool: "Grammarly (표절 검사 기능)",
        advantage: "방대한 한국어 데이터베이스를 기반으로 높은 정확도의 한국어 문서 표절 검사를 제공하며, 상세한 분석 보고서를 통해 표절 의심 구간과 출처를 명확히 제시합니다."
      }
    ]
  },
  // 47. 무하유 (GPT킬러)
  {
    id: 47,
    name: "무하유 (GPT킬러)",
    category: "교정/편집", // 세분화된 카테고리 (AI 텍스트 탐지 기능)
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
    features: ["AI 텍스트 탐지", "챗봇 판별", "표절 검사 연동", "문서 보안"],
    usecases: [
      { title: "학생 과제 평가", detail: "학생이 제출한 과제가 AI 챗봇으로 작성되었는지 확인", example: "예: '대학생 레포트 AI 작성 여부 검사'" },
      { title: "콘텐츠 신뢰성 검증", detail: "온라인에 유포되는 정보가 AI에 의해 생성되었는지 확인", example: "예: '뉴스 기사 AI 작성 여부 판별'" },
      { title: "입사 지원서 검토", detail: "지원자가 제출한 자기소개서 등이 AI로 작성되었는지 확인", example: "예: '자기소개서 AI 사용 여부 검사'" }
    ],
    integrations: [],
    link: "https://www.copykiller.com/gptkiller/", // 실제 GPT킬러 링크 확인 필요
    detail: "https://www.copykiller.com/gptkiller/", // 실제 GPT킬러 링크 확인 필요
    isKorean: true,
    isPopularKr: true,
    isPopular: false,
    // 경쟁 우위 정보
    competitiveAdvantage: [
      {
        targetTool: "Turnitin",
        advantage: "AI 챗봇이 생성한 텍스트를 탐지하는 데 특화되어 있으며, 기존 표절 검사 기능과 연동하여 AI 사용 여부와 표절 여부를 동시에 검증할 수 있어 교육 및 평가의 공정성 확보에 강력합니다."
      }
    ]
  },
  // 48. 무하유 (몬스터) - (이전 카테고리 '채용' 그대로 유지)
  {
    id: 48,
    name: "무하유 (몬스터)",
    category: "채용", // 새로운 카테고리 추가
    rating: 4.5,
    description: "AI 기반의 채용 솔루션. 자기소개서 분석, 면접 질문 생성 등 인사 업무를 AI로 효율화.",
    strengths: [
      "자기소개서 분석: AI가 지원자의 자기소개서를 분석하여 핵심 역량, 강점/약점 파악",
      "면접 질문 생성: 지원자의 자소서 기반 맞춤형 면접 질문 자동 생성",
      "채용 과정 효율화: 서류 검토 시간 단축, 공정성 확보",
      "데이터 기반 인재 발굴: AI 분석을 통해 적합한 인재 선별"
    ],
    weaknesses: [
      "유료 서비스: 주로 기업용 솔루션으로 제공",
      "AI 분석의 한계: 인간적인 판단이나 미묘한 뉘앙스 파악은 어려움",
      "데이터 편향성 문제 발생 가능성"
    ],
    freeLimitations: "기업용 솔루션으로, 무료 체험은 문의 필요.",
    features: ["자소서 분석", "면접 질문 생성", "인재 추천", "채용 자동화"],
    usecases: [
      { title: "서류 전형 효율화", detail: "수많은 자기소개서를 AI가 빠르게 분석하여 적합한 인재 선별", example: "예: '신입사원 서류 전형 자동 심사'" },
      { title: "면접 준비 지원", detail: "AI가 기본적인 질문과 평가를 수행하여 면접관의 부담 경감", example: "예: 'AI 면접 후 심층 면접 진행'" },
      { title: "인재 데이터 분석", detail: "축적된 지원자 데이터를 AI로 분석하여 인재상 정립", example: "예: '성공적인 직무 수행을 위한 인재 특성 분석'" }
    ],
    integrations: [],
    link: "https://www.muhayu.com/service/monster/", // 실제 링크 확인 필요
    detail: "https://www.muhayu.com/service/monster/", // 실제 링크 확인 필요
    isKorean: true,
    isPopularKr: false,
    isPopular: false,
    // 경쟁 우위 정보
    competitiveAdvantage: [
      {
        targetTool: "뷰인터 (VIEWINTER)",
        advantage: "자기소개서 분석 및 면접 질문 생성 등 인사 채용 업무 전반을 AI로 효율화합니다. 서류 검토 시간 단축과 데이터 기반 인재 발굴에 강점이 있습니다."
      }
    ]
  },
  // 49. 뷰인터 (VIEWINTER) - (이전 카테고리 '채용' 그대로 유지)
  {
    id: 49,
    name: "뷰인터 (VIEWINTER)",
    category: "채용", // 새로운 카테고리 추가
    rating: 4.4,
    description: "AI 기반의 비대면 면접 솔루션. 지원자의 답변 내용을 분석하고 표정, 음성 등을 종합적으로 평가하여 객관적인 면접 결과를 제공.",
    strengths: [
      "객관적인 면접 평가: AI가 지원자의 답변 내용, 표정, 음성 등을 종합 분석하여 편향 없는 평가",
      "비대면 면접 효율화: 시간과 장소 제약 없이 언제든 면접 진행 가능",
      "다양한 평가 지표: 직무 역량, 인성, 커뮤니케이션 능력 등 다면적 평가",
      "면접 데이터 축적 및 분석: AI 기반 데이터로 채용 과정 개선"
    ],
    weaknesses: [
      "유료 서비스: 주로 기업용 솔루션으로 제공",
      "기술적 오류 가능성: AI의 인식이나 분석이 완벽하지 않을 수 있음",
      "지원자가 AI 면접에 익숙하지 않을 수 있음"
    ],
    freeLimitations: "기업용 솔루션으로, 무료 체험은 문의 필요.",
    features: ["AI 면접", "비대면 면접", "표정/음성 분석", "객관적 평가"],
    usecases: [
      { title: "초기 면접 자동화", detail: "대규모 지원자 대상 초기 면접을 AI로 진행하여 효율성 증대", example: "예: '신입사원 온라인 AI 면접 도입'" },
      { title: "면접관 부담 경감", detail: "AI가 기본적인 질문과 평가를 수행하여 면접관의 부담 경감", example: "예: 'AI 면접 후 심층 면접 진행'" },
      { title: "지원자 역량 분석", detail: "AI가 면접 데이터를 분석하여 지원자의 강점/약점 파악", example: "예: '영업 직무 지원자 커뮤니케이션 역량 평가'" }
    ],
    integrations: [],
    link: "https://www.viewinter.ai/",
    detail: "https://www.viewinter.ai/",
    isKorean: true,
    isPopularKr: false,
    isPopular: false,
    // 경쟁 우위 정보
    competitiveAdvantage: [
      {
        targetTool: "무하유 (몬스터)",
        advantage: "AI 기반 비대면 면접에 특화되어 지원자의 답변 내용, 표정, 음성 등을 종합적으로 분석하여 객관적인 면접 결과를 제공합니다. 대규모 초기 면접 자동화에 효율적입니다."
      }
    ]
  },
  // 50. 티키타카 (tikitaka) - (이전 카테고리 '음성' 그대로 유지)
  {
    id: 50,
    name: "티키타카 (tikitaka)",
    category: "음성", // 기존 카테고리 유지
    rating: 4.2,
    description: "AI 기반 음성 합성 및 대화 서비스. 자연스러운 AI 목소리를 생성하고, 텍스트를 음성으로 변환하거나 대화형 서비스를 구축.",
    strengths: [
      "자연스러운 음성 합성: 한국어에 특화된 자연스러운 AI 보이스 생성",
      "다양한 음성 스타일: 여러 감정과 어조의 목소리 선택 가능",
      "실시간 음성 변환: 텍스트를 입력하면 바로 음성으로 변환하여 사용",
      "대화형 서비스 구축: 챗봇에 음성 기능을 추가하여 대화형 서비스 구현"
    ],
    weaknesses: [
      "무료 사용량 제한 및 고급 기능은 유료",
      "매우 미묘한 감정 표현이나 즉흥적인 대화에는 한계",
      "복잡한 음성 제어는 아직 어려움"
    ],
    freeLimitations: "제한된 무료 사용량 제공.",
    features: ["음성 합성", "텍스트→음성", "대화형 AI", "음성 커스터마이징"],
    usecases: [
      { title: "콘텐츠 더빙", detail: "영상, 애니메이션 등에 AI 목소리로 더빙", example: "예: '유튜브 영상 내레이션 AI 음성으로 제작'" },
      { title: "오디오 가이드 제작", detail: "관광지, 전시회 등 오디오 가이드 제작", example: "예: '미술관 오디오 가이드 제작'" },
      { title: "음성 챗봇 개발", detail: "텍스트 챗봇에 음성 기능을 추가하여 사용자 경험 개선", example: "예: '고객 센터 음성 챗봇 구축'" }
    ],
    integrations: ["API"],
    link: "https://www.tikitaka.ai/", // 실제 링크 확인 필요
    detail: "https://www.tikitaka.ai/", // 실제 링크 확인 필요
    isKorean: true,
    isPopularKr: false,
    isPopular: false,
    // 경쟁 우위 정보
    competitiveAdvantage: [
      {
        targetTool: "ElevenLabs / Murf.ai",
        advantage: "한국어에 특화된 자연스러운 음성 합성 기술을 제공하며, 챗봇에 음성 기능을 추가하여 대화형 서비스를 구축하는 데 강점이 있습니다."
      }
    ]
  },
  // --- 기존에 누락되거나 수정되지 않았던 AI 도구들 (사용자 제공 데이터 기반) ---
  // ID 17까지만 제공되었던 이전 aiTools.js 파일과 사용자 제공 이미지 스니펫, 그리고 대화 내용을 기반으로 업데이트
  // 중복이 있거나 카테고리 분류가 명확하지 않은 경우, 가장 적합한 카테고리로 지정
  // 기존 aiTools.js 파일에 18~40번까지의 항목이 있었지만, 상세 정보가 없으므로
  // 여기서는 가장 최근에 사용자가 제공한 목록 (Beautiful.ai, EdrawMind AI 등)을 기준으로 추가합니다.
  // 이전에 중복으로 언급되었던 Toss AI (id: 7), Synthesia (id: 27), Taskade AI (id: 28) 등은
  // 위의 목록에서 이미 포함되었으므로 여기서는 제외됩니다.
  // Kakao Brain KoGPT (id: 18)와 Bing AI Copilot (id: 19), Leonardo.Ai (id: 20), Runway ML (id: 21),
  // Descript (id: 22), Animaker (id: 23), Murf.ai (id: 24), Pika (id: 25), Luma AI (id: 26),
  // GitHub Copilot (id: 29), Cursor (id: 30), Replit Ghostwriter (id: 31), Kaiber (id: 32),
  // Remove.bg (id: 33), Storytell.ai (id: 34), Pixian AI (id: 35), Gamma (id: 36),
  // Vidio.ai (id: 37), Napkin (id: 38), Vrew (브루) (id: 39), Lilys (릴리스) (id: 40),
  // Boardmix (id: 41), MindMeister (id: 42), Consensus (id: 43), Scite.ai (id: 44),
  // Copy.ai (id: 45), 무하유 (카피킬러) (id: 46), 무하유 (GPT킬러) (id: 47),
  // 무하유 (몬스터) (id: 48), 뷰인터 (VIEWINTER) (id: 49), 티키타카 (tikitaka) (id: 50)
  // 등은 이미 위 목록에 포함되었습니다.
  // 누락된 것으로 보이는 도구들을 아래에 추가합니다.

  // Beautiful.ai
  {
    id: 51,
    name: "Beautiful.ai",
    category: "생산성", // PPT·스토리 -> 생산성 (프레젠테이션 생성)
    rating: null,
    description: "자동 레이아웃 및 슬라이드 열람·체류시간 분석으로 팀 발표 성과 추적이 강력한 프레젠테이션 도구.",
    strengths: ["자동 레이아웃 + 슬라이드 열람·체류시간 분석으로 팀 발표 성과 추적 강력"],
    weaknesses: ["글꼴·칸 위치를 세밀히 못 바꿈 → 브랜드 가이드가 엄격하면 추가 편집 필요", "PDF·PPT 내보내기 불가"],
    freeLimitations: "PDF·PPT 내보내기 불가",
    features: ["자동 레이아웃", "발표 성과 추적"],
    usecases: [
      { title: "팀 발표 자료 제작", detail: "AI 기반 자동 레이아웃으로 효율적인 프레젠테이션 생성", example: "예: '팀 프로젝트 발표 자료 디자인'" }
    ],
    integrations: [],
    link: "https://www.beautiful.ai/",
    detail: "https://www.beautiful.ai/",
    isKorean: false,
    isPopularKr: false,
    isPopular: false,
    competitiveAdvantage: [
      {
        targetTool: "Gamma / Slidebean",
        advantage: "자동 레이아웃과 함께 슬라이드 열람 및 체류시간 분석 기능을 제공하여 팀 발표의 성과를 추적하고 개선하는 데 특화되어 있습니다."
      }
    ]
  },
  // EdrawMind AI
  {
    id: 52,
    name: "EdrawMind AI",
    category: "생산성", // MindMap -> 생산성 (아이디어/기획 도구)
    rating: null,
    description: "MindMap을 1클릭으로 PPT로 변환하여 논리 구조화에 최적화된 마인드맵 도구.",
    strengths: ["MindMap → PPT 1‑클릭, 논리 구조화 최상"],
    weaknesses: ["앱이 무거워 저사양 PC에서 렉; AI 크레딧 다 쓰면 그날 작업 중단"],
    freeLimitations: "하루 3회 AI 생성",
    features: ["마인드맵", "PPT 변환", "논리 구조화"],
    usecases: [
      { title: "아이디어 기획", detail: "마인드맵으로 아이디어를 논리적으로 구조화하고 PPT로 변환", example: "예: '신제품 기획 마인드맵 작성'" }
    ],
    integrations: [],
    link: "https://www.edrawmind.com/ai/",
    detail: "https://www.edrawmind.com/ai/",
    isKorean: false,
    isPopularKr: false,
    isPopular: false,
    competitiveAdvantage: [
      {
        targetTool: "MindMeister / Boardmix",
        advantage: "마인드맵을 원클릭으로 PPT로 변환하는 기능이 뛰어나 아이디어를 시각화하고 발표 자료로 빠르게 전환하는 데 매우 효율적입니다."
      }
    ]
  },
  // Slidebean (ID 23으로 이미 포함됨) -> 중복이므로 이 항목은 삭제

  // Notta
  {
    id: 53,
    name: "Notta",
    category: "음성", // 음성 인식 및 요약
    rating: null,
    description: "58개 언어의 자막 및 요약 기능을 제공하며, 자막 정확도와 다국어 지원이 뛰어난 음성 인식 도구.",
    strengths: ["58 언어 자막+요약, 자막 정확도·다국어 우위"],
    weaknesses: ["길게 녹음하면 잘려서 업로드 → 재결합 작업 필요"],
    freeLimitations: "월 120 분, 파일 3 분",
    features: ["음성 인식", "다국어 자막", "요약"],
    usecases: [
      { title: "다국어 회의록 작성", detail: "다양한 언어의 회의 음성을 텍스트로 변환하고 요약", example: "예: '글로벌 팀 회의록 자동 생성'" }
    ],
    integrations: [],
    link: "https://www.notta.ai/",
    detail: "https://www.notta.ai/",
    isKorean: false,
    isPopularKr: false,
    isPopular: false,
    competitiveAdvantage: [
      {
        targetTool: "CLOVA Note / OpenAI Whisper",
        advantage: "58개 언어에 대한 높은 자막 정확도와 요약 기능을 제공하여 다국어 환경에서의 음성 콘텐츠 처리에 강력한 우위를 가집니다."
      }
    ]
  },
  // HyperCLOVA X
  {
    id: 54,
    name: "HyperCLOVA X",
    category: "대화", // 한국어 특화 LLM (대화/생성)
    rating: null,
    description: "한국어 문맥 및 신조어 이해 정확도가 뛰어난 한국어 특화 LLM.",
    strengths: ["한국어 문맥·신조어 정확 1등"],
    weaknesses: ["해외 논문·영문 데이터 예시가 부족; 결과 편향 주의"],
    freeLimitations: "쿼터 제한",
    features: ["한국어 특화", "자연어 처리"],
    usecases: [
      { title: "한국어 콘텐츠 생성", detail: "한국어 문맥과 신조어를 정확히 반영한 콘텐츠 생성", example: "예: '최신 유행어 활용 블로그 글 작성'" }
    ],
    integrations: [],
    link: "https://clova.naver.com/hyperclova-x/", // 실제 링크 확인 필요
    detail: "https://clova.naver.com/hyperclova-x/", // 실제 링크 확인 필요
    isKorean: true,
    isPopularKr: true,
    isPopular: false,
    competitiveAdvantage: [
      {
        targetTool: "ChatGPT / Gemini",
        advantage: "한국어 문맥과 신조어에 대한 이해도가 압도적으로 높아, 가장 자연스럽고 정확한 한국어 답변 및 콘텐츠를 생성하는 데 독보적입니다."
      }
    ]
  },
  // Wordvice AI
  {
    id: 55,
    name: "Wordvice AI",
    category: "교정/편집", // 학술 특화 요약/교정
    rating: null,
    description: "기사·논문 전용 요약 모드를 제공하는 학술 특화 글쓰기 도구.",
    strengths: ["기사·논문 전용 요약 모드, 학술 특화"],
    weaknesses: ["긴 문서는 3~4번 나눠 넣어야 해 번거로움"],
    freeLimitations: "500단어/회",
    features: ["학술 요약", "문서 교정"],
    usecases: [
      { title: "학술 논문 요약", detail: "긴 학술 논문의 핵심 내용을 빠르게 요약하고 이해", example: "예: '영문 학술 논문 500단어 요약'" }
    ],
    integrations: [],
    link: "https://wordvice.ai/ko/ai-tools/ai-summarizer/", // 실제 링크 확인 필요
    detail: "https://wordvice.ai/ko/ai-tools/ai-summarizer/", // 실제 링크 확인 필요
    isKorean: false,
    isPopularKr: false,
    isPopular: false,
    competitiveAdvantage: [
      {
        targetTool: "DeepL Write / Grammarly",
        advantage: "특히 '학술 논문'과 '기사'에 특화된 요약 및 교정 기능을 제공하여, 연구자와 학생들에게 전문적인 글쓰기 보조 기능을 제공합니다."
      }
    ]
  },
  // Wrtn (ID 3으로 이미 포함됨) -> 중복이므로 이 항목은 삭제

  // Works AI
  {
    id: 56,
    name: "Works AI",
    category: "생산성", // 리서치 보고서 초안 생성
    rating: null,
    description: "리서치 결과를 서론·본론·결론으로 자동 분할하여 초안을 생성하는 도구.",
    strengths: ["리서치 결과를 서론·본론·결론으로 자동 분할 초안"],
    weaknesses: ["한글 프롬프트가 영어 UI 충돌 → 일부 메뉴 깨져 보일 때 있음"],
    freeLimitations: "2 문서/월",
    features: ["리서치 초안", "문서 자동 분할"],
    usecases: [
      { title: "리서치 보고서 초안", detail: "조사한 내용을 바탕으로 보고서의 서론/본론/결론을 자동 생성", example: "예: '시장 조사 보고서 초안 작성'" }
    ],
    integrations: [],
    link: "https://works.ai/", // 실제 링크 확인 필요
    detail: "https://works.ai/", // 실제 링크 확인 필요
    isKorean: false,
    isPopularKr: false,
    isPopular: false,
    competitiveAdvantage: [
      {
        targetTool: "ChatGPT / Notion AI",
        advantage: "리서치 결과를 서론, 본론, 결론으로 자동으로 구조화하여 보고서 초안을 효율적으로 생성하는 데 특화되어 있습니다."
      }
    ]
  },
  // 사람인 AI 코칭
  {
    id: 57,
    name: "사람인 AI 코칭",
    category: "채용", // 새로운 카테고리
    rating: null,
    description: "국내 서류 및 표절 검사를 지원하며, 한국 기업 맞춤형 AI 코칭을 제공.",
    strengths: ["국내 서류·표절 검사, 한국 기업 맞춤"],
    weaknesses: ["창의적 문장 생성 불가; “너무 교과서적” 평가 받을 수 있음"],
    freeLimitations: "기본 교정만",
    features: ["이력서 코칭", "표절 검사"],
    usecases: [
      { title: "이력서/자소서 첨삭", detail: "한국 기업 채용 기준에 맞춰 서류를 검토하고 교정 제안", example: "예: '자기소개서 문법 및 표현 검토'" }
    ],
    integrations: [],
    link: "https://www.saramin.co.kr/zf_user/AI-coaching", // 실제 링크 확인 필요
    detail: "https://www.saramin.co.kr/zf_user/AI-coaching", // 실제 링크 확인 필요
    isKorean: true,
    isPopularKr: true,
    isPopular: false,
    competitiveAdvantage: [
      {
        targetTool: "Resume.io",
        advantage: "한국 기업의 채용 문화와 기준에 맞춰 서류 검토 및 표절 검사 기능을 제공하여 국내 취업 준비생에게 최적화된 서비스를 제공합니다."
      }
    ]
  },
  // Monica MindMap
  {
    id: 58,
    name: "Monica MindMap",
    category: "생산성", // MindMap -> 생산성 (아이디어/기획 도구)
    rating: null,
    description: "노드 자동 확장 속도가 빠르고 직관적인 마인드맵 도구.",
    strengths: ["노드 자동 확장 속도 1등"],
    weaknesses: ["깊은 레벨 분기 예측 어려움; 큰 프로젝트엔 한계"],
    freeLimitations: "맵·노드 제한",
    features: ["자동 노드 확장", "마인드맵"],
    usecases: [
      { title: "아이디어 확장", detail: "키워드를 중심으로 AI가 마인드맵 노드를 자동으로 확장", example: "예: '새로운 서비스 아이디어 마인드맵 만들기'" }
    ],
    integrations: [],
    link: "https://monica.im/mind-map/", // 실제 링크 확인 필요
    detail: "https://monica.im/mind-map/", // 실제 링크 확인 필요
    isKorean: false,
    isPopularKr: false,
    isPopular: false,
    competitiveAdvantage: [
      {
        targetTool: "MindMeister / EdrawMind AI",
        advantage: "노드 자동 확장 속도가 매우 빠르고 직관적인 마인드맵 인터페이스를 제공하여, 실시간 브레인스토밍과 아이디어 정리에 효율적입니다."
      }
    ]
  },
  // GenSpark
  {
    id: 59,
    name: "GenSpark",
    category: "AI 에이전트", // 새로운 카테고리
    rating: null,
    description: "검색·문서·이미지 올인원 에이전트로 무료 크레딧이 넉넉한 도구.",
    strengths: ["검색·문서·이미지 올인원 Agent + 무료 크레딧 넉넉"],
    weaknesses: ["UI 대부분 영어; 프로젝트 이력 필터링 기능 없음"],
    freeLimitations: "300 크레딧/일",
    features: ["올인원 에이전트", "무료 크레딧"],
    usecases: [
      { title: "복합 정보 탐색", detail: "다양한 형식의 정보(검색, 문서, 이미지)를 통합적으로 분석하고 활용", example: "예: '특정 주제에 대한 종합 리서치 자료 수집'" }
    ],
    integrations: [],
    link: "https://genspark.ai/", // 실제 링크 확인 필요
    detail: "https://genspark.ai/", // 실제 링크 확인 필요
    isKorean: false,
    isPopularKr: false,
    isPopular: false,
    competitiveAdvantage: [
      {
        targetTool: "Perplexity AI / ChatGPT",
        advantage: "검색, 문서, 이미지 분석 기능을 통합한 '올인원' AI 에이전트로, 특히 넉넉한 무료 크레딧을 제공하여 다양한 정보 처리 작업을 통합적으로 수행할 수 있습니다."
      }
    ]
  },
  // Glide
  {
    id: 60,
    name: "Glide",
    category: "노코드", // 새로운 카테고리
    rating: null,
    description: "모바일 UI 속도가 빠르고 25k rows까지 지원하며 초보자 친화적인 UX를 가진 노코드 앱 개발 도구.",
    strengths: ["모바일 UI 속도·25k rows, 초보자 친화 UX"],
    weaknesses: ["백엔드 로직 복잡해지면 기능 부족; 배포 시 유료 필수"],
    freeLimitations: "1 앱·실시간 업데이트 0회",
    features: ["모바일 앱 개발", "노코드", "직관적 UX"],
    usecases: [
      { title: "간단한 모바일 앱 개발", detail: "초보자도 쉽고 빠르게 데이터 기반의 모바일 앱을 개발", example: "예: '고객 관리용 간단한 앱 만들기'" }
    ],
    integrations: [],
    link: "https://www.glideapps.com/",
    detail: "https://www.glideapps.com/",
    isKorean: false,
    isPopularKr: false,
    isPopular: false,
    competitiveAdvantage: [
      {
        targetTool: "AppSheet",
        advantage: "매우 빠른 모바일 UI 속도와 초보자 친화적인 사용자 경험을 제공하여, 코딩 지식 없이도 쉽고 효율적으로 데이터 기반의 모바일 앱을 개발할 수 있습니다."
      }
    ]
  },
  // Cursor (ID 30으로 이미 포함됨) -> 중복이므로 이 항목은 삭제

  // Tabnine Chat
  {
    id: 61,
    name: "Tabnine Chat",
    category: "코딩", // 기존 코딩 카테고리 유지
    rating: null,
    description: "로컬 모델로 보안이 뛰어나고 오프라인 환경에 최적화된 코딩 IDE.",
    strengths: ["로컬 모델로 보안 ↑, 오프라인 환경 최강"],
    weaknesses: ["한글 주석 넣으면 영어 코드 설명 섞임; 제안 품질 편차 큼"],
    freeLimitations: "150 제안/일",
    features: ["로컬 모델", "오프라인 지원", "코드 자동 완성"],
    usecases: [
      { title: "보안이 중요한 코딩", detail: "로컬 환경에서 코드를 작성하여 외부 유출 위험 없이 개발", example: "예: '사내 민감 프로젝트 코드 작성'" }
    ],
    integrations: [],
    link: "https://www.tabnine.com/", // 실제 링크 확인 필요
    detail: "https://www.tabnine.com/", // 실제 링크 확인 필요
    isKorean: false,
    isPopularKr: false,
    isPopular: false,
    competitiveAdvantage: [
      {
        targetTool: "GitHub Copilot / Cursor",
        advantage: "로컬 모델 기반으로 동작하여 코드 보안이 매우 뛰어나고, 인터넷 연결 없이 오프라인 환경에서도 강력한 코드 자동 완성 및 제안 기능을 제공합니다."
      }
    ]
  },
  // Maskara.ai
  {
    id: 62,
    name: "Maskara.ai",
    category: "생산성", // AI 도구 관리 -> 생산성
    rating: null,
    description: "Prompt Studio와 Notion·Airtable 연결을 지원하는 AI 도구 관리 솔루션.",
    strengths: ["Prompt Studio + Notion·Airtable 연결"],
    weaknesses: ["설명서 부족; 복잡 조건 로직은 오류 메시지 빈약"],
    freeLimitations: "5 프로젝트",
    features: ["프롬프트 관리", "데이터베이스 연동"],
    usecases: [
      { title: "AI 프롬프트 관리", detail: "자주 사용하는 AI 프롬프트를 체계적으로 관리하고 재사용", example: "예: '마케팅용 AI 프롬프트 템플릿 관리'" }
    ],
    integrations: ["Notion", "Airtable"],
    link: "https://maskara.ai/", // 실제 링크 확인 필요
    detail: "https://maskara.ai/", // 실제 링크 확인 필요
    isKorean: false,
    isPopularKr: false,
    isPopular: false,
    competitiveAdvantage: [
      {
        targetTool: "단순 AI 챗봇",
        advantage: "Prompt Studio 기능을 통해 AI 프롬프트를 체계적으로 관리하고 Notion, Airtable 등과 연동하여 AI 활용 생산성을 높이는 데 특화되어 있습니다."
      }
    ]
  },
  // 릴리스AI
  {
    id: 63,
    name: "릴리스AI",
    category: "요약", // 영상 요약 -> 요약
    rating: null,
    description: "YouTube·PDF·오디오 멀티 포맷 요약이 가능한 영상 요약 도구.",
    strengths: ["YouTube·PDF·오디오 멀티 포맷 요약"],
    weaknesses: ["영상 길수록 뉘앙스·감정 어긋날 수 있어 추가 검토 필요"],
    freeLimitations: "1 요약/일",
    features: ["멀티 포맷 요약", "영상 요약"],
    usecases: [
      { title: "멀티미디어 콘텐츠 요약", detail: "유튜브 영상, PDF 문서, 오디오 파일 등 다양한 형태의 콘텐츠 핵심 내용 요약", example: "예: '긴 유튜브 강의 요약'" }
    ],
    integrations: ["YouTube", "PDF", "Audio"],
    link: "https://lilys.ai/summary", // 실제 링크 확인 필요
    detail: "https://lilys.ai/summary", // 실제 링크 확인 필요
    isKorean: true,
    isPopularKr: true,
    isPopular: false,
    competitiveAdvantage: [
      {
        targetTool: "CLOVA Note / Vrew",
        advantage: "YouTube 영상, PDF, 오디오 파일 등 '멀티 포맷'의 콘텐츠를 요약하는 데 강력한 강점을 가집니다. 특히 다양한 형태의 긴 자료를 빠르게 파악해야 할 때 유용합니다."
      }
    ]
  },
  // ChatGPT Free (ID 1으로 이미 포함됨) -> 중복이므로 이 항목은 삭제

  // Resume.io
  {
    id: 64,
    name: "Resume.io",
    category: "생산성", // 이력서 -> 생산성
    rating: null,
    description: "키워드 자동 삽입으로 ATS 통과율을 높여주는 이력서 작성 도구.",
    strengths: ["키워드 자동 삽입, ATS 통과율↑"],
    weaknesses: ["한글 템플릿 없음 → 번역·역번역 중 어색한 표현 발생"],
    freeLimitations: "체험 끝나면 다운로드 차단",
    features: ["이력서 작성", "ATS 최적화"],
    usecases: [
      { title: "ATS 최적화 이력서 작성", detail: "AI가 키워드를 자동 삽입하여 채용 시스템(ATS) 통과율이 높은 이력서 생성", example: "예: '마케팅 직무 ATS 통과 이력서 작성'" }
    ],
    integrations: [],
    link: "https://resume.io/",
    detail: "https://resume.io/",
    isKorean: false,
    isPopularKr: false,
    isPopular: false,
    competitiveAdvantage: [
      {
        targetTool: "사람인 AI 코칭",
        advantage: "AI를 통해 이력서에 필요한 키워드를 자동으로 삽입하여 ATS(Applicant Tracking System) 통과율을 높이는 데 특화되어 있습니다."
      }
    ]
  },
  // Mapify
  {
    id: 65,
    name: "Mapify",
    category: "생산성", // MindMap -> 생산성
    rating: null,
    description: "PDF·영상도 맵+Q&A로 변환하여 포맷 지원이 최다인 마인드맵 도구.",
    strengths: ["PDF·영상도 맵+Q&A 변환, 포맷 지원 최다"],
    weaknesses: ["표·수식 많은 PDF는 요약 정확도 하락 → 수동 교정 필요"],
    freeLimitations: "10 맵/계정",
    features: ["멀티 포맷 마인드맵", "Q&A 변환"],
    usecases: [
      { title: "복합 자료 마인드맵", detail: "PDF 문서나 영상을 마인드맵으로 변환하고 Q&A 기능을 통해 내용 탐색", example: "예: '온라인 강의 영상 마인드맵 만들기'" }
    ],
    integrations: ["PDF", "Video"],
    link: "https://www.mapify.ai/", // 실제 링크 확인 필요
    detail: "https://www.mapify.ai/", // 실제 링크 확인 필요
    isKorean: false,
    isPopularKr: false,
    isPopular: false,
    competitiveAdvantage: [
      {
        targetTool: "MindMeister / EdrawMind AI",
        advantage: "PDF나 영상까지 마인드맵으로 변환하고 Q&A 기능을 제공하는 등 '최다 포맷'을 지원하여 다양한 형태의 자료를 마인드맵으로 구조화하는 데 매우 유용합니다."
      }
    ]
  },
  // Perplexity (ID 12으로 이미 포함됨) -> 중복이므로 이 항목은 삭제

  // Synthesia (ID 27으로 이미 포함됨) -> 중복이므로 이 항목은 삭제

  // DALL·E 3 (ID 8으로 이미 포함됨) -> 중복이므로 이 항목은 삭제

  // AppSheet
  {
    id: 66,
    name: "AppSheet",
    category: "노코드", // 새로운 카테고리 (노코드 앱)
    rating: null,
    description: "시트를 앱으로 변환하며, ML 예측 및 챗봇 기능을 통해 업무 자동화에 강점을 가진 노코드 앱 도구.",
    strengths: ["시트→앱, ML 예측 + 챗봇, 업무 자동화 강점"],
    weaknesses: ["구글 계정 필수·G Workspace 없으면 연동이 번거로움"],
    freeLimitations: "10 테스터·배포 제한",
    features: ["노코드 앱 개발", "업무 자동화", "ML 예측"],
    usecases: [
      { title: "업무 자동화 앱 개발", detail: "스프레드시트 데이터를 기반으로 업무 자동화 및 ML 예측 기능이 포함된 앱 개발", example: "예: '재고 관리 자동화 앱 만들기'" }
    ],
    integrations: ["Google Workspace"],
    link: "https://www.appsheet.com/",
    detail: "https://www.appsheet.com/",
    isKorean: false,
    isPopularKr: false,
    isPopular: false,
    competitiveAdvantage: [
      {
        targetTool: "Glide",
        advantage: "스프레드시트를 기반으로 앱을 개발하며, 머신러닝 예측 및 챗봇 기능을 통합하여 복잡한 업무 자동화 솔루션 구현에 강점이 있습니다. 구글 워크스페이스와의 연동성이 뛰어납니다."
      }
    ]
  },
  // Copilot Agent
  {
    id: 67,
    name: "Copilot Agent",
    category: "코딩", // 기존 코딩 카테고리 유지
    rating: null,
    description: "IDE 실시간 코드 완성 및 PR 리뷰를 지원하는 코딩 에이전트.",
    strengths: ["IDE 실시간 완성 + PR 리뷰 Agent"],
    weaknesses: ["AI 제안이 틀린 경우 그대로 merge 위험; 9월 API 변경 예정"],
    freeLimitations: "월 2k 코드 완성·Agent 세션 제한",
    features: ["코드 완성", "PR 리뷰", "AI 코딩"],
    usecases: [
      { title: "코드 개발 효율화", detail: "IDE 내에서 실시간으로 코드를 완성하고, AI 기반 PR 리뷰를 통해 개발 생산성 향상", example: "예: '새로운 기능 코드 작성 및 리뷰 자동화'" }
    ],
    integrations: [],
    link: "https://copilot.ai/", // 실제 링크 확인 필요
    detail: "https://copilot.ai/", // 실제 링크 확인 필요
    isKorean: false,
    isPopularKr: false,
    isPopular: false,
    competitiveAdvantage: [
      {
        targetTool: "GitHub Copilot",
        advantage: "IDE 내에서의 실시간 코드 완성 기능과 더불어 PR(Pull Request) 리뷰 기능을 제공하여 코드 품질 향상 및 협업 효율 증대에 특화되어 있습니다."
      }
    ]
  },
  // Claude 4 Opus (ID 3으로 이미 포함됨 - Claude의 하위 모델이므로 별도 항목 대신 기존 Claude에 특징 추가) -> 중복이므로 이 항목은 삭제

  // Manus Agent
  {
    id: 68,
    name: "Manus Agent",
    category: "AI 에이전트", // 기존 카테고리 유지
    rating: null,
    description: "자연어 지시로 일 자동화가 가능한 자율 에이전트 기능 제공.",
    strengths: ["자연어 지시 → 일 자동화, 자율 Agent 기능"],
    weaknesses: ["한글 인터페이스 미완; 실수 시 대형 반복 실행 위험"],
    freeLimitations: "3 플레이북/월",
    features: ["자연어 자동화", "자율 에이전트"],
    usecases: [
      { title: "반복 업무 자동화", detail: "자연어 명령을 통해 반복적인 업무를 AI가 자율적으로 실행하고 자동화", example: "예: '이메일 확인 후 특정 내용 자동 회신'" }
    ],
    integrations: [],
    link: "https://manus.ai/", // 실제 링크 확인 필요
    detail: "https://manus.ai/", // 실제 링크 확인 필요
    isKorean: false,
    isPopularKr: false,
    isPopular: false,
    competitiveAdvantage: [
      {
        targetTool: "Taskade AI",
        advantage: "자연어 지시를 통해 다양한 일상 및 업무를 AI가 자율적으로 실행하고 자동화하는 '자율 에이전트' 기능에 초점을 맞춥니다."
      }
    ]
  }
];

// 카테고리별 분류를 위한 유틸리티 함수
export const getToolsByCategory = (category) => {
  return aiTools.filter(tool => tool.category === category);
};

// 인기 도구 (isPopularKr이 true인 것)
export const getPopularTools = () => {
  return aiTools.filter(tool => tool.isPopularKr);
};

// 무료 도구 (freeLimitations 필드 존재 여부로 판단) - 실제 price 속성이 없어 freeLimitations로 대체
export const getFreeTools = () => {
  return aiTools.filter(tool => tool.freeLimitations && tool.freeLimitations.includes("무료"));
};

// 카테고리 목록 - UI에 표시될 카테고리 (id, name, icon)
export const categories = [
  { id: 'all', name: '전체', icon: '🔍' },
  // 텍스트 세분화
  { id: '대화', name: '대화', icon: '💬' },
  { id: '텍스트생성', name: '텍스트 생성', icon: '✍️' },
  { id: '번역', name: '번역', icon: '🌐' },
  { id: '요약', name: '요약', icon: '📄' },
  { id: '교정/편집', name: '교정/편집', icon: '✏️' },
  // 기존 카테고리
  { id: '이미지', name: '이미지', icon: '🎨' },
  { id: '동영상', name: '동영상', icon: '🎬' },
  { id: '음성', name: '음성', icon: '🎵' },
  { id: '코딩', name: '코딩', icon: '💻' },
  { id: '생산성', name: '생산성', icon: '⚡' },
  { id: 'AI검색', name: 'AI 검색', icon: '🔎' },
  { id: '디자인', name: '디자인', icon: '🎯' },
  // 새로 추가된 카테고리 (데이터에 따라 추가)
  { id: '금융', name: '금융', icon: '💰' },
  { id: '채용', name: '채용', icon: '🤝' },
  { id: '협업', name: '협업', icon: '👥' },
  { id: '노코드', name: '노코드', icon: '🧩' }, // 노코드 앱
  { id: 'AI 에이전트', name: 'AI 에이전트', icon: '🤖' },
  // { id: '기타', name: '기타', icon: '⚙️' } // 필요한 경우 추가
];
