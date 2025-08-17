import React from "react";
import { motion } from "framer-motion";
import { Search, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore.js";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar.jsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu.jsx";
import { Badge } from "./ui/badge.jsx";
import EasyPickHero from "./EasyPickHero.jsx";
import EasyPickOurStory from "./EasyPickOurStory.jsx";
import PricingCompact from "./PricingCompact.jsx";
import NavigationBar from "./NavigationBar";

// 재사용 가능한 UI 컴포넌트들
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

// 재사용 가능한 검색 입력 컴포넌트
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
    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm border border-gray-200">
      <span className="text-2xl">{icon}</span>
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
    <Button className="btn-brand-ghost text-sm">바로가기</Button>
  </div>
);

// 모바일 네비게이션 컴포넌트
const MobileNavigation = ({ currentView, navigate }) => (
  <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200 shadow-lg md:hidden z-fixed">
    <div className="grid grid-cols-4 py-3">
      <button
        className={`flex flex-col items-center py-3 rounded-lg mx-1 ${
          currentView === "home"
            ? "bg-blue-50 text-blue-600"
            : "hover:bg-gray-50"
        }`}
        onClick={() => navigate("/")}
      >
        <div className="w-8 h-8 flex items-center justify-center mb-2 bg-blue-50 rounded-lg">
          <span className="text-lg">🏠</span>
        </div>
        <span className="text-xs font-medium text-gray-700">홈</span>
      </button>
      <button
        className={`flex flex-col items-center py-3 rounded-lg mx-1 ${
          currentView === "tools"
            ? "bg-blue-50 text-blue-600"
            : "hover:bg-gray-50"
        }`}
        onClick={() => navigate("/tools")}
      >
        <div className="w-8 h-8 flex items-center justify-center mb-2 bg-gray-100 rounded-lg">
          <span className="text-lg">🛠️</span>
        </div>
        <span className="text-xs font-medium text-gray-700">도구</span>
      </button>
      <button
        className={`flex flex-col items-center py-3 rounded-lg mx-1 ${
          currentView === "prompts"
            ? "bg-blue-50 text-blue-600"
            : "hover:bg-gray-50"
        }`}
        onClick={() => navigate("/prompts")}
      >
        <div className="w-8 h-8 flex items-center justify-center mb-2 bg-gray-100 rounded-lg">
          <span className="text-lg">💬</span>
        </div>
        <span className="text-xs font-medium text-gray-700">프롬프트</span>
      </button>
      <button
        className={`flex flex-col items-center py-3 rounded-lg mx-1 ${
          currentView === "workflows"
            ? "bg-blue-50 text-blue-600"
            : "hover:bg-gray-50"
        }`}
        onClick={() => navigate("/workflows")}
      >
        <div className="w-8 h-8 flex items-center justify-center mb-2 bg-gray-100 rounded-lg">
          <span className="text-lg">⚡</span>
        </div>
        <span className="text-xs font-medium text-gray-700">워크플로우</span>
      </button>
    </div>
  </div>
);

// 메인 컴포넌트
const NewMainLanding = ({
  onNavigateToPrompts,
  onNavigate,
  onAuthClick,
  onProPlanClick,
}) => {
  const navigate = useNavigate();
  const [showPaidPlans, setShowPaidPlans] = React.useState(false);

  // AuthStore를 안전하게 사용
  let user = null;
  let profile = null;
  let isAuthenticated = false;
  let signOut = () => {};

  try {
    const authData = useAuthStore();
    user = authData.user;
    profile = authData.profile;
    isAuthenticated = authData.isAuthenticated;
    signOut = authData.signOut;
  } catch (error) {
    console.warn("Auth store error in NewMainLanding:", error);
  }

  // 외부 클릭시 드롭다운 닫기
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      const dropdown = document.getElementById("user-dropdown");
      const avatar = event.target.closest("[data-avatar-trigger]");

      if (dropdown && !dropdown.contains(event.target) && !avatar) {
        dropdown.classList.add("hidden");
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

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
      icon: "🤖",
      name: "ChatGPT",
      category: "대화형 AI",
      rating: 4.8,
      reviews: "2.1k",
    },
    {
      rank: 2,
      icon: "🎨",
      name: "Midjourney",
      category: "이미지 생성",
      rating: 4.7,
      reviews: "1.5k",
    },
    {
      rank: 3,
      icon: "🖼️",
      name: "Adobe Firefly",
      category: "이미지 편집",
      rating: 4.6,
      reviews: "1.2k",
    },
    {
      rank: 4,
      icon: "💬",
      name: "Google Bard",
      category: "대화형 AI",
      rating: 4.5,
      reviews: "1.0k",
    },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-800 relative">
      <NavigationBar
        onAuthClick={onAuthClick}
        onProPlanClick={onProPlanClick}
      />

      {/* Hero Section과 Our Story Section */}
      <div className="content-with-nav">
        <EasyPickHero
          onAuthClick={onAuthClick}
          onProPlanClick={onProPlanClick}
        />
        <EasyPickOurStory />
      </div>

      {/* Feature Sections */}
      <div className="space-y-20">
        <section className="section-spacing bg-white card-container section-compact">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
            {/* Feature 1: 스마트 검색 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center grid-compact">
              <div>
                <h3 className="text-3xl font-bold text-gray-900 mb-6">
                  나에게 딱 맞는 AI 도구 찾기
                </h3>
                <p className="text-lg text-gray-700 leading-relaxed">
                  수많은 AI 도구 중 나에게 꼭 필요한 것을 찾기 어려웠나요?
                  <br />
                  이지픽은 하고싶은 작업만 입력하면 자동으로 AI모델을
                  추천해줍니다.
                </p>
              </div>
              <div className="bg-slate-100 rounded-2xl p-8 shadow-sm border border-gray-200 card-compact">
                <div className="space-y-4">
                  {aiTools.map((tool) => (
                    <ToolRankingItem key={tool.rank} {...tool} />
                  ))}
                </div>
              </div>
            </div>

            {/* Feature 2: 프롬프트 라이브러리 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center grid-compact">
              <div className="order-2 lg:order-1 bg-slate-100 rounded-2xl p-8 shadow-sm border border-gray-200 card-compact">
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
                        <option>마케팅 전략</option>
                        <option>데이터 분석</option>
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
                        <option>25장 내외</option>
                        <option>30장 내외</option>
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
                        <option>유머러스</option>
                        <option>진지함</option>
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
                        <option>Prezi</option>
                        <option>SlideShare</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      컨텐츠 구조
                    </label>
                    <select className="w-full text-sm bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-700">
                      <option>Agenda→Why→How→Demo→Q&A</option>
                      <option>문제→해결→결과→행동</option>
                      <option>현황→분석→전략→실행</option>
                      <option>도입→전개→결론</option>
                      <option>서론→본론→결론</option>
                      <option>기승전결</option>
                      <option>자유 형식</option>
                    </select>
                  </div>

                  <div className="border-t border-gray-100 pt-4">
                    <button
                      onClick={() =>
                        onNavigateToPrompts &&
                        onNavigateToPrompts({ templateId: "ppt_creator_001" })
                      }
                      className="w-full bg-[rgb(96,121,111)] hover:bg-[rgb(50,70,60)] text-white text-sm font-medium py-3 px-4 rounded-md"
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
                <h3 className="text-3xl font-bold text-gray-900 mb-6 mt-tight">
                  &nbsp;&nbsp;프롬프트가 다르면 결과도 다릅니다,
                  <br /> &nbsp;&nbsp;딱맞는 프롬프트 30초 만에 자동 완성
                </h3>
                <p className="text-lg text-gray-700 leading-relaxed mt-tight">
                  &nbsp;&nbsp;더 이상 프롬프트 때문에 고민하지 마세요.
                  <br /> &nbsp;&nbsp;이지픽의 방대한 라이브러리에서 원하는
                  템플릿을 선택하고,
                  <br /> &nbsp;&nbsp;몇 번의 클릭만으로 당신의 아이디어를 현실로
                  만들어 줄
                  <br />
                  &nbsp;&nbsp;전문가급 프롬프트를 생성하세요.
                </p>
              </div>
            </div>

            {/* Feature 3: 쉬운 통합 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center grid-compact">
              <div>
                <h3 className="text-3xl font-bold text-gray-900 mb-6 mt-tight">
                  작업에 필요한 여러 AI앱을 찾아줍니다.
                </h3>
                <p className="text-lg text-gray-700 leading-relaxed mt-tight">
                  하고싶은 작업을 입력하면 알맞는 앱들을 연동해줍니다.
                  <br /> 아이디어가 떠오르는 순간부터 결과물을 얻기까지의 모든
                  과정을
                  <br /> 단절 없이 이어줍니다.
                </p>
              </div>
              <div className="bg-slate-100 rounded-2xl p-8 shadow-sm border border-gray-200 card-compact">
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
                      <p className="text-sm text-gray-600">복사 → 전송</p>
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

        {/* Testimonials - 위아래 라인 흰색으로 변경 */}
        <section className="section-spacing bg-gray-50 border-t border-b border-gray-200 py-8 section-compact">
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
              <Card className="border-gray-200 bg-white shadow-lg">
                <CardContent className="p-6">
                  <blockquote className="text-gray-700 mb-4">
                    "마음에 드는 결과를 얻기위해 몇번씩 입력하고 또 입력하고 또
                    입력 했어야 했는데, 한번에 원하는 결과를 바로 찾을 수 있어서
                    업무 효율이 크게 올랐습니다."
                  </blockquote>
                  <div className="text-sm text-gray-500">
                    김○은, 콘텐츠 매니저
                  </div>
                </CardContent>
              </Card>
              <Card className="border-gray-200 bg-white">
                <CardContent className="p-6">
                  <blockquote className="text-gray-700 mb-4">
                    "템플릿 덕분에 팀에서 매주 몇 시간씩 절약하고 있어요.
                    프롬프트 작성이 이렇게 쉬워질 줄 몰랐네요."
                  </blockquote>
                  <div className="text-sm text-gray-500">
                    박○호, 마케팅 팀장
                  </div>
                </CardContent>
              </Card>
              <Card className="border-gray-200 bg-white">
                <CardContent className="p-6">
                  <blockquote className="text-gray-700 mb-4">
                    "AI 도구 비교 기능이 정말 유용해요. 이것 저것 다 써볼
                    필요없이 알맞는 AI를 선택할 수 있어서 시간도 많이
                    절약됐습니다."
                  </blockquote>
                  <div className="text-sm text-gray-500">
                    이○영, 프로덕트 디자이너
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <PricingCompact />

        {/*
        <section className="section-spacing bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                유연하고 간단한 요금제
              </h2>
              <p className="text-lg text-gray-600">
                언제든 업그레이드 또는 취소 가능합니다
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {/* 무료 플랜 } 
              <div className="relative rounded-2xl bg-white border border-gray-200 p-8 shadow-sm hover:shadow-xl transition-all duration-300">
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-sm font-medium mb-4">
                    <span>👤</span> 개인용
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    무료
                  </h3>
                  <p className="text-gray-600 text-sm mb-6">AI 도구 탐색 시작하기</p>
                  <div className="text-4xl font-bold text-gray-900 mb-1">
                    ₩0
                  </div>
                  <div className="text-sm text-gray-500 mb-6">월간</div>
                  
                  <ul className="space-y-3 mb-8 text-left">
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">기본 AI 도구 검색</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">일일 10회 프롬프트 생성</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">커뮤니티 지원</span>
                    </li>
                  </ul>
                  
                  <Button
                    onClick={onAuthClick}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3"
                  >
                    무료로 시작하기
                  </Button>
                </div>
              </div>

              {/* 유료 플랜 보기 버튼 } 
              {!showPaidPlans && (
                <div className="md:col-span-2 flex justify-center items-center">
                  <Button
                    onClick={() => setShowPaidPlans(true)}
                    className="btn-brand font-semibold py-3 px-8 rounded-lg shadow-md"
                  >
                    유료 플랜 자세히 보기
                  </Button>
                </div>
              )}

              {showPaidPlans && (
                <>
                  {/* 프로 플랜 - 강조 } 
                  <div className="relative rounded-2xl bg-gradient-to-b from-blue-600 to-blue-700 text-white p-8 shadow-xl transform hover:scale-105 transition-all duration-300">
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wide">
                        🔥 가장 인기
                      </span>
                    </div>
                    <div className="text-center">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-sm font-medium mb-4">
                        <span>⚡</span> 프로페셔널
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">
                        Pro
                      </h3>
                      <p className="text-blue-100 text-sm mb-6">생산성을 극대화하세요</p>
                      <div className="text-4xl font-bold text-white mb-1">
                        ₩9,900
                      </div>
                      <div className="text-sm text-blue-100 mb-6">월간</div>
                      
                      <ul className="space-y-3 mb-8 text-left">
                        <li className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-white mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-white">무제한 프롬프트 생성</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-white mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-white">고급 AI 도구 추천</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-white mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-white">프롬프트 저장 & 내보내기</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-white mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-white">우선 이메일 지원</span>
                        </li>
                      </ul>
                      
                      <Button
                        onClick={onProPlanClick}
                        className="w-full bg-white hover:bg-gray-100 text-blue-600 font-bold py-3"
                      >
                        Pro 시작하기
                      </Button>
                    </div>
                  </div>

                  {/* 엔터프라이즈 플랜 } 
                  <div className="relative rounded-2xl bg-white border border-gray-200 p-8 shadow-sm hover:shadow-xl transition-all duration-300">
                    <div className="text-center">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-sm font-medium mb-4">
                        <span>🏢</span> 기업용
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        Enterprise
                      </h3>
                      <p className="text-gray-600 text-sm mb-6">팀 전체를 위한 솔루션</p>
                      <div className="text-4xl font-bold text-gray-900 mb-1">
                        맞춤형
                      </div>
                      <div className="text-sm text-gray-500 mb-6">가격 문의</div>
                      
                      <ul className="space-y-3 mb-8 text-left">
                        <li className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-gray-700">Pro의 모든 기능</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-gray-700">팀 협업 기능</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-gray-700">API 액세스</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-gray-700">전담 계정 관리자</span>
                        </li>
                      </ul>
                      
                      <Button
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3"
                      >
                        영업팀 문의
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
        */}

        {/* Footer */}
        <footer className="bg-gray-900 text-gray-400 mb-16 md:mb-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                  프롬프트
                </h3>
                <ul className="space-y-3">
                  <li>
                    <a href="#" className="hover:text-white">
                      모든 프롬프트
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white">
                      사용 사례
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white">
                      카테고리
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                  제품
                </h3>
                <ul className="space-y-3">
                  <li>
                    <a href="#" className="hover:text-white">
                      미리보기
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white">
                      자주 묻는 질문
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white">
                      문서
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                  계정
                </h3>
                <ul className="space-y-3">
                  <li>
                    <a href="#" className="hover:text-white">
                      회원가입
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white">
                      로그인
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white">
                      고객지원
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                  회사
                </h3>
                <ul className="space-y-3">
                  <li>
                    <a href="#" className="hover:text-white">
                      회사소개
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white">
                      블로그
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white">
                      문의하기
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-gray-700">
              <div className="text-center">
                <div className="text-xl font-bold text-white mb-2">이지픽</div>
                <p className="text-gray-400">
                  © 2025 이지픽(EazyPick). All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div>

      </div>
      {/* 모바일 네비게이션 */}
      <MobileNavigation currentView="home" navigate={navigate} />
      </div>
  );
};

export default NewMainLanding;
