// src/data/aiUsageGuides.js
export const aiUsageGuides = [
  {
    id: 'workflow-1',
    title: '블로그 게시물 작성 워크플로우',
    description: 'AI 도구들을 활용하여 효과적인 블로그 게시물을 기획하고 작성하는 과정입니다.',
    keywords: ['블로그', '글쓰기', '콘텐츠', '마케팅'],
    steps: [
      { step_number: 1, tool_name: 'AI 아이디어 생성기 (예: ChatGPT)', tool_action: '게시물 주제 및 키워드 브레인스토밍', details: '핵심 주제와 관련 키워드를 AI에게 문의하여 아이디어를 확장합니다.' },
      { step_number: 2, tool_name: 'AI 글쓰기 도구 (예: Wrtn, Copy.ai)', tool_action: '게시물 초안 작성', details: '생성된 아이디어를 바탕으로 AI에게 초안 작성을 요청하고 필요한 내용을 추가합니다.' },
      { step_number: 3, tool_name: 'AI 번역/교정 도구 (예: DeepL Write)', tool_action: '내용 교정 및 문법 검토', details: '작성된 초안의 문법, 어휘, 문맥을 AI의 도움을 받아 교정하고 개선합니다.' },
      { step_number: 4, tool_name: 'AI 이미지 생성기 (예: Midjourney, Karlo)', tool_action: '게시물에 사용할 이미지 생성', details: '게시물 내용과 어울리는 고품질 이미지를 AI로 생성하여 시각적 요소를 강화합니다.' },
    ]
  },
  {
    id: 'workflow-2',
    title: '마케팅 카피라이팅 자동화',
    description: 'AI를 활용하여 다양한 마케팅 채널에 맞는 매력적인 카피를 빠르게 생성하는 방법입니다.',
    keywords: ['마케팅', '카피라이팅', '광고', '소셜 미디어'],
    steps: [
      { step_number: 1, tool_name: 'AI 마케팅 카피 생성기 (예: Copy.ai, Jasper)', tool_action: '제품/서비스 특징 입력', details: '제품 또는 서비스의 주요 특징과 목표 고객을 AI에 입력하여 맞춤형 카피를 생성합니다.' },
      { step_number: 2, tool_name: 'AI 아이디어 확장 (예: Gemini)', tool_action: '다양한 버전의 카피 생성', details: '생성된 카피를 바탕으로 더 다양한 길이와 톤의 대안을 AI에게 요청합니다.' },
      { step_number: 3, tool_name: 'AI A/B 테스트 최적화 (예: Optimizely)', tool_action: '성과 예측 및 최적화', details: '생성된 카피들의 예상 성과를 AI로 분석하고 최적의 카피를 선정합니다.' },
    ]
  },
];
