import React from "react";
import { motion } from "framer-motion";
import { Search, Star } from "lucide-react";

// 재사용 가능한 UI 컴포넌트를 별도로 분리합니다.
const Button = ({ children, className, ...props }) => (
  <button
    className={`rounded-md px-4 py-2 font-medium transition-colors ${className}`}
    {...props}
  >
    {children}
  </button>
);

const Card = ({ children, className, ...props }) => (
  <div
    className={`rounded-xl border bg-card text-card-foreground shadow-sm ${className}`}
    {...props}
  >
    {children}
  </div>
);

const CardContent = ({ children, className, ...props }) => (
  <div className={`p-6 ${className}`} {...props}>
    {children}
  </div>
);

// 재사용 가능한 검색 입력 컴포넌트 (정의 누락 수정)
const SearchInput = ({ placeholder }) => (
  <div className="relative flex h-16 w-full max-w-xl items-center rounded-lg bg-white shadow-lg px-4 border border-gray-200">
    <Search className="h-6 w-6 text-gray-400" />
    <textarea
      placeholder={placeholder}
      className="ml-4 w-full bg-transparent text-gray-800 placeholder-gray-400 focus:outline-none resize-none overflow-hidden h-full py-4 text-lg"
      rows="2"
    />
  </div>
);

// AI 도구 랭킹 아이템 컴포넌트
const ToolRankingItem = ({ rank, icon, name, category, rating, reviews }) => (
  <div className="flex items-center space-x-4 p-4 rounded-lg hover:bg-gray-100 transition-colors">
    <div className="text-2xl font-bold text-gray-400 w-8 text-center">
      {rank}
    </div>
    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm border border-gray-200 p-2">
      <img
        src={icon}
        alt={`${name} 아이콘`}
        className="w-full h-full object-contain"
      />
    </div>
    <div className="flex-1">
      <h4 className="font-semibold text-gray-900">{name}</h4>
      <div className="flex items-center space-x-2 mt-1">
        <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-medium">
          {category}
        </span>
        <div className="flex items-center">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${
                i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
              }`}
            />
          ))}
          <span className="ml-2 text-sm text-gray-500">
            {rating.toFixed(1)}
          </span>
        </div>
        <span className="text-sm text-gray-500">({reviews})</span>
      </div>
    </div>
    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm">
      바로가기
    </Button>
  </div>
);

// 전체 웹페이지 컴포넌트
const NewMainLanding = ({ onNavigateToPrompts, onNavigate, onAuthClick, onProPlanClick }) => {
  // Framer Motion 애니메이션 variants
  const container = {
    hidden: { opacity: 0, y: 40 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 80,
        damping: 14,
        staggerChildren: 0.15,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  // AI 랭킹 데이터 (임시)
  const aiTools = [
    {
      rank: 1,
      icon: "/images/logos/chatgpt.svg",
      name: "ChatGPT",
      category: "대화형 AI",
      rating: 4.8,
      reviews: "2.1k",
    },
    {
      rank: 2,
      icon: "/images/logos/midjourney.svg",
      name: "Midjourney",
      category: "이미지 생성",
      rating: 4.7,
      reviews: "1.5k",
    },
    {
      rank: 3,
      icon: "/images/logos/copilot.svg",
      name: "Adobe Firefly",
      category: "이미지 편집",
      rating: 4.6,
      reviews: "1.2k",
    },
    {
      rank: 4,
      icon: "/images/logos/gemini.svg",
      name: "Google Bard",
      category: "대화형 AI",
      rating: 4.5,
      reviews: "1.0k",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-gray-800 relative">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-lg border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 justify-between">
            <div className="flex items-center">
              <img
                src="./images/이지픽.png"
                alt="이지픽 로고"
                className="h-8 mr-2"
              />
              <div className="text-xl font-bold text-gray-900">이지픽</div>
              <div className="hidden md:block ml-10">
                <div className="flex items-baseline space-x-8">
                  <a
                    onClick={() => onNavigate("tools")}
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium cursor-pointer"
                  >
                    AI 도구
                  </a>
                  <a
                    onClick={() => onNavigate("prompts")}
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium cursor-pointer"
                  >
                    프롬프트
                  </a>
                  <a
                    onClick={() => onNavigate("workflows")}
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium cursor-pointer"
                  >
                    워크플로우
                  </a>
                </div>
              </div>
            </div>
            <div>
              <Button 
                onClick={onAuthClick}
                className="bg-gray-900 hover:bg-gray-800 text-white"
              >
                로그인
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section (2번 사진 디자인 적용) */}
      <section className="relative w-full min-h-screen flex items-center overflow-hidden py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row items-center gap-16">
          {/* Left Side: Text and Search */}
          <div className="md:w-1/2 text-center md:text-left">
            <motion.div variants={container} initial="hidden" animate="show">
              {/* 헤드라인 (폰트 및 색상 변경) */}
              <motion.h1
                variants={item}
                className="font-urbanist text-6xl lg:text-7xl font-bold leading-tight tracking-tight text-gray-900"
              >
                애플리케이션
                <br />
                라이브러리
              </motion.h1>
              <motion.div variants={item} className="mt-12">
                <SearchInput placeholder="어떤 작업을 하고 싶으신가요?" />
              </motion.div>
              <motion.div variants={item} className="mt-6">
                <Button 
                  onClick={onAuthClick}
                  className="w-full max-w-xl bg-blue-600 hover:bg-blue-700 text-white text-lg"
                >
                  로그인
                </Button>
              </motion.div>
            </motion.div>
          </div>
          {/* Right Side: Mockup Image */}
          <div className="md:w-1/2 flex justify-center md:justify-end">
            <img
              src="./images/mockup.png"
              alt="이지픽 서비스 목업"
              className="w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100"
            />
          </div>
        </div>
      </section>

      {/* Feature 1: 스마트 검색 (1번 사진 디자인 적용) */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-6">
                나에게 딱 맞는 AI 도구 찾기
              </h3>
              <p className="text-lg text-gray-700 leading-relaxed">
                수많은 AI 도구 중 나에게 꼭 필요한 것을 찾기 어려웠나요?
                이지픽은 하고싶은 작업만 입력하면 자동으로 AI모델을
                추천해줍니다.
              </p>
            </div>
            {/* AI 랭킹 섹션 - 1번 사진 디자인 적용 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
              <div className="space-y-4">
                {aiTools.map((tool) => (
                  <ToolRankingItem key={tool.rank} {...tool} />
                ))}
              </div>
            </div>
          </div>

          {/* Feature 2: 프롬프트 라이브러리 (3, 4번 사진 디자인 적용) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">
                    PPT(슬라이드) 작성
                  </h4>
                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-medium">
                    프레젠테이션
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      발표 주제
                    </label>
                    <select className="w-full text-sm bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-700">
                      <option>교육 워크숍</option>
                      <option>비즈니스 제안</option>
                      <option>기술 발표</option>
                      <option>제품 소개</option>
                      <option>연구 발표</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      슬라이드 수
                    </label>
                    <select className="w-full text-sm bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-700">
                      <option>5장 내외</option>
                      <option>10장 내외</option>
                      <option>15장 내외</option>
                      <option>20장 내외</option>
                      <option>제한없음</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      톤 & 스타일
                    </label>
                    <select className="w-full text-sm bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-700">
                      <option>모던·심플</option>
                      <option>클래식·정중</option>
                      <option>창의적·역동</option>
                      <option>미니멀·깔끔</option>
                      <option>따뜻·친근</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      사용 툴
                    </label>
                    <select className="w-full text-sm bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-700">
                      <option>PowerPoint</option>
                      <option>Google Slides</option>
                      <option>Keynote</option>
                      <option>Canva</option>
                      <option>Figma</option>
                    </select>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    콘텐츠 구조
                  </label>
                  <select className="w-full text-sm bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-700">
                    <option>Agenda→Why→How→Demo→Q&A</option>
                    <option>문제→해결→결과→행동</option>
                    <option>현황→분석→전략→실행</option>
                  </select>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <button
                    onClick={() =>
                      onNavigateToPrompts &&
                      onNavigateToPrompts({ templateId: "ppt_creator_001" })
                    }
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-3 px-4 rounded-md transition-colors"
                  >
                    프롬프트 생성하러 가기
                  </button>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    선택한 옵션으로 맞춤형 PPT 프롬프트를 생성합니다
                  </p>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <h3 className="text-3xl font-bold text-gray-900 mb-6">
                프롬프트가 다르면 결과도 다릅니다, 딱맞는 프롬프트 30초 만에
                자동 완성
              </h3>
              <p className="text-lg text-gray-700 leading-relaxed">
                더 이상 프롬프트 때문에 고민하지 마세요. 이지픽의 방대한
                라이브러리에서 원하는 템플릿을 선택하고, 몇 번의 클릭만으로
                당신의 아이디어를 현실로 만들어 줄 전문가급 프롬프트를
                생성하세요.
              </p>
            </div>
          </div>

          {/* Feature 3: 쉬운 통합 (3번 사진 이모지 적용) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-6">
                작업에 필요한 여러 AI앱을 찾아줍니다.
              </h3>
              <p className="text-lg text-gray-700 leading-relaxed">
                하고싶은 내용만 입력하면 가장 알맞는 앱들을 연동해주고
                사용방법까지 알려줍니다, 아이디어가 떠오르는 순간부터 결과물을
                얻기까지의 모든 과정을 단절 없이 이어줍니다.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
              <div className="space-y-6">
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center">
                    <span className="text-xl">📝</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      프롬프트 생성
                    </h4>
                    <p className="text-sm text-gray-600">
                      템플릿 선택 → 옵션 설정
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <div className="w-px h-8 bg-gray-300"></div>
                </div>
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center">
                    <span className="text-xl">🔗</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      AI 모델 연동
                    </h4>
                    <p className="text-sm text-gray-600">
                      클립보드 복사 → 바로 전송
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <div className="w-px h-8 bg-gray-300"></div>
                </div>
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center">
                    <span className="text-xl">📈</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">결과 분석</h4>
                    <p className="text-sm text-gray-600">
                      품질 평가 → 개선 제안
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              사용자 후기
            </h2>
            <p className="text-lg text-gray-700">
              실제 사용자들이 경험한 이지픽의 효과를 확인해보세요
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-gray-200">
              <CardContent className="p-6">
                <blockquote className="text-gray-700 mb-4">
                  "프롬프트 검색이 정말 빠르고 정확해요. 마음에 드는 결과를
                  얻기위해 몇번씩 입력하고 또 입력하고 또 입력 했어야 했는데,
                  한번에 원하는 결과를 바로 찾을 수 있어서 업무 효율이 크게
                  올랐습니다."
                </blockquote>
                <div className="text-sm text-gray-500">
                  김ㅇ은, 콘텐츠 매니저
                </div>
              </CardContent>
            </Card>
            <Card className="border-gray-200">
              <CardContent className="p-6">
                <blockquote className="text-gray-700 mb-4">
                  "템플릿 덕분에 팀에서 매주 몇 시간씩 절약하고 있어요. 프롬프트
                  작성이 이렇게 쉬워질 줄 몰랐네요."
                </blockquote>
                <div className="text-sm text-gray-500">박ㅇ호, 마케팅 팀장</div>
              </CardContent>
            </Card>
            <Card className="border-gray-200">
              <CardContent className="p-6">
                <blockquote className="text-gray-700 mb-4">
                  "AI 도구 비교 기능이 정말 유용해요. 이것 저것 다 써볼 필요없이
                  알맞는 AI를 선택할 수 있어서 시간도 많이 절약됐습니다."
                </blockquote>
                <div className="text-sm text-gray-500">
                  이ㅇ영, 프로덕트 디자이너
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              유연하고 간단한 요금제
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="border-gray-200">
              <CardContent className="p-8">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    일반사용자
                  </h3>
                  <div className="text-4xl font-bold text-gray-900 mb-6">
                    무료
                  </div>
                  <ul className="space-y-4 mb-8 text-left text-gray-700">
                    <li>무제한 프롬프트 생성</li>
                    <li>템플릿 갤러리 이용</li>
                    <li>기본 고객 지원</li>
                  </ul>
                  <Button 
                    onClick={onAuthClick}
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white"
                  >
                    무료로 시작하기
                  </Button>
                </div>
              </CardContent>
            </Card>
            <Card className="border-indigo-600 border-2">
              <CardContent className="p-8">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    프로사용자
                  </h3>
                  <div className="text-4xl font-bold text-gray-900 mb-6">
                    월 9,000원
                  </div>
                  <ul className="space-y-4 mb-8 text-left text-gray-700">
                    <li>추가 고급 분석 기능</li>
                    <li>AI 도구 연동 북마크</li>
                    <li>작성 프롬프트 다운 가능</li>
                  </ul>
                  <Button 
                    onClick={onProPlanClick}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    프로 선택하기
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA (버튼 색상 변경) */}
      <section className="py-16 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            더 똑똑하게 창작을 시작하세요.
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            30초만에 가입하고 첫 번째 프롬프트를 무료로 생성해보세요.
          </p>
          <Button 
            onClick={onAuthClick}
            className="bg-white hover:bg-gray-100 text-gray-900 px-8 py-3"
          >
            내 계정 만들기
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                프롬프트
              </h3>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-gray-600 hover:text-gray-900">
                    모든 프롬프트
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-gray-900">
                    사용 사례
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-gray-900">
                    카테고리
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                제품
              </h3>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-gray-600 hover:text-gray-900">
                    미리보기
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-gray-900">
                    자주 묻는 질문
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-gray-900">
                    문서
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                계정
              </h3>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-gray-600 hover:text-gray-900">
                    회원가입
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-gray-900">
                    로그인
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-gray-900">
                    고객지원
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                회사
              </h3>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-gray-600 hover:text-gray-900">
                    회사소개
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-gray-900">
                    블로그
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-gray-900">
                    문의하기
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900 mb-2">이지픽</div>
              <p className="text-gray-600">
                © 2024 이지픽(EazyPick). All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
      <style>{`
        /* 배경 그라디언트 애니메이션 키프레임 (Hero 섹션에서 사용하지 않으므로 주석 처리 또는 삭제 가능)
        @keyframes gradient-xy {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-xy {
          background-size: 400% 400%;
          animation: gradient-xy 15s ease infinite;
        }
        */

        /* 폰트 임포트 */
        /* 폰트 파일이 없을 경우 404 에러가 발생합니다.
        로컬에 폰트 파일을 다운로드하거나 CDN 링크를 사용해야 합니다.
        @import url('https://fonts.googleapis.com/css2?family=Urbanist:wght@700;800;900&display=swap');
        */
        .font-urbanist {
          font-family: 'Urbanist', sans-serif;
        }
      `}</style>
    </div>
  );
};

export default NewMainLanding;
