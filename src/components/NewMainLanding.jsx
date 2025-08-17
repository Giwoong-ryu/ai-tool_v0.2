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
      {/* Hero Section과 Our Story Section */}
      <div className="content-with-nav">
        <EasyPickHero
          onAuthClick={onAuthClick}
          onProPlanClick={onProPlanClick}
        />
        <EasyPickOurStory />
      </div>

      {/* Testimonials - 위아래 라인 흰색으로 변경 */}
      <div className="space-y-20">
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
  );
};

export default NewMainLanding;