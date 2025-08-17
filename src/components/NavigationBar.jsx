import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useAuthStore from "../store/authStore.js";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar.jsx";
import { Badge } from "./ui/badge.jsx";
import { 
  Home, 
  Wrench, 
  MessageSquare, 
  Workflow,
  User
} from "lucide-react";

const Button = ({ children, className, ...props }) => (
  <button
    className={`rounded-md px-4 py-2 font-medium transition-colors ${className}`}
    {...props}
  >
    {children}
  </button>
);

const NavigationBar = ({ onAuthClick, onProPlanClick }) => {
  const navigate = useNavigate();
  const location = useLocation();

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
    console.warn("Auth store error in NavigationBar:", error);
  }

  // 외부 클릭시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      // 데스크톱 드롭다운
      const dropdown = document.getElementById("user-dropdown-hero");
      const avatar = event.target.closest("[data-avatar-trigger]");

      if (dropdown && !dropdown.contains(event.target) && !avatar) {
        dropdown.classList.add("hidden");
      }

      // 모바일 드롭다운
      const mobileDropdown = document.getElementById("mobile-user-dropdown");
      const mobileAvatar = event.target.closest("[data-mobile-avatar-trigger]");

      if (mobileDropdown && !mobileDropdown.contains(event.target) && !mobileAvatar) {
        mobileDropdown.classList.add("hidden");
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // 현재 경로에 따라 활성 탭 결정
  const getActiveTab = () => {
    if (location.pathname === '/') return 'home';
    if (location.pathname === '/tools') return 'tools';
    if (location.pathname === '/prompts') return 'prompts';
    if (location.pathname === '/workflows') return 'workflows';
    return 'home';
  };

  const activeTab = getActiveTab();

  // 모바일 네비게이션 아이템들
  const mobileNavItems = [
    { id: 'home', label: '홈', icon: Home, path: '/' },
    { id: 'tools', label: 'AI 도구', icon: Wrench, path: '/tools' },
    { id: 'prompts', label: '프롬프트', icon: MessageSquare, path: '/prompts' },
    { id: 'workflows', label: '워크플로우', icon: Workflow, path: '/workflows' },
  ];

  return (
    <>
      {/* 상단 네비게이션 */}
      <nav className="fixed top-0 w-full z-fixed bg-slate-50/90 backdrop-blur-xl border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-20 justify-between">
            {/* 로고 섹션 */}
            <div className="flex items-center">
              <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate("/")}>
                <div className="w-10 h-10 flex items-center justify-center bg-blue-50 rounded-lg">
                  <img
                    src="/favicon.png"
                    alt="이지픽 로고"
                    className="w-8 h-8"
                    loading="eager"
                    decoding="sync"
                  />
                </div>
                <span className="font-bold text-xl text-gray-900">이지픽</span>
              </div>

              {/* 데스크톱 메뉴 */}
              <div className="hidden md:block ml-10">
                <div className="flex items-baseline space-x-8">
                  <a
                    onClick={() => navigate("/tools")}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${
                      activeTab === 'tools'
                        ? 'bg-blue-100 text-blue-600'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    AI 도구
                  </a>
                  <a
                    onClick={() => navigate("/prompts")}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${
                      activeTab === 'prompts'
                        ? 'bg-blue-100 text-blue-600'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    프롬프트
                  </a>
                  <a
                    onClick={() => navigate("/workflows")}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${
                      activeTab === 'workflows'
                        ? 'bg-blue-100 text-blue-600'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    워크플로우
                  </a>
                </div>
              </div>
            </div>

            {/* 사용자 섹션 */}
            <div className="flex items-center space-x-3">
              {/* 구독 상태 표시 */}
              {isAuthenticated &&
                profile?.subscription_tier &&
                profile.subscription_tier !== "free" && (
                  <Badge
                    className={`${profile.subscription_tier === "pro"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {profile.subscription_tier === "pro" ? "PRO" : "BASIC"}
                  </Badge>
                )}

              {isAuthenticated ? (
                <div className="relative">
                  <button
                    data-avatar-trigger
                    onClick={() => {
                      const dropdown =
                        document.getElementById("user-dropdown-hero");
                      dropdown.classList.toggle("hidden");
                    }}
                    className="p-0 h-auto bg-transparent hover:bg-gray-50 rounded-full focus:outline-none"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user?.user_metadata?.avatar_url} />
                      <AvatarFallback className="bg-blue-100 text-blue-600 font-medium">
                        {profile?.name?.charAt(0)?.toUpperCase() ||
                          user?.email?.charAt(0)?.toUpperCase() ||
                          "U"}
                      </AvatarFallback>
                    </Avatar>
                  </button>

                  {/* 드롭다운 */}
                  <div
                    id="user-dropdown-hero"
                    className="hidden absolute right-0 mt-2 w-56 dropdown-content py-2 force-above"
                    style={{ zIndex: 9999 }}
                  >
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="font-medium text-gray-900">
                        {profile?.name || "사용자"}
                      </p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                      {profile && (
                        <p className="text-xs text-gray-400 mt-1">
                          이번 달 사용량: {profile.usage_count || 0}/
                          {profile.monthly_limit === -1
                            ? "무제한"
                            : profile.monthly_limit || 10}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        document
                          .getElementById("user-dropdown-hero")
                          .classList.add("hidden");
                        navigate("/tools");
                      }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                    >
                      AI 도구
                    </button>

                    <button
                      onClick={() => {
                        document
                          .getElementById("user-dropdown-hero")
                          .classList.add("hidden");
                        navigate("/prompts");
                      }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                    >
                      프롬프트
                    </button>

                    {(!profile || profile.subscription_tier === "free") && (
                      <button
                        onClick={() => {
                          onProPlanClick && onProPlanClick();
                          document
                            .getElementById("user-dropdown-hero")
                            .classList.add("hidden");
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-blue-600"
                      >
                        플랜 업그레이드
                      </button>
                    )}

                    <div className="border-t border-gray-100 mt-2 pt-2">
                      <button
                        onClick={() => {
                          signOut();
                          document
                            .getElementById("user-dropdown-hero")
                            .classList.add("hidden");
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-red-600"
                      >
                        로그아웃
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="hidden md:block">
                  <Button
                    onClick={onAuthClick}
                    className="bg-gray-900 hover:bg-gray-800 text-white"
                  >
                    로그인
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* 모바일 하단 네비게이션 */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-white border-t border-gray-200 shadow-lg flex justify-around items-center z-50">
        <div className="safe-area-inset-bottom absolute bottom-0 left-0 right-0 pointer-events-none"></div>
        
        {/* 메인 네비게이션 아이템들 */}
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`min-w-[64px] flex flex-col items-center justify-center px-2 py-1 transition-colors ${
                isActive 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[11px] font-medium mt-0.5 whitespace-nowrap truncate">
                {item.label}
              </span>
            </button>
          );
        })}

        {/* 사용자 아이콘 */}
        <button
          data-mobile-avatar-trigger
          onClick={() => {
            if (isAuthenticated) {
              const dropdown = document.getElementById("mobile-user-dropdown");
              dropdown.classList.toggle("hidden");
            } else {
              onAuthClick();
            }
          }}
          className={`min-w-[64px] flex flex-col items-center justify-center px-2 py-1 transition-colors ${
            isAuthenticated 
              ? 'text-gray-600 hover:text-gray-800 hover:bg-gray-50' 
              : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
          }`}
        >
          {isAuthenticated ? (
            <>
              <Avatar className="h-5 w-5">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback className="bg-blue-100 text-blue-600 font-medium text-xs">
                  {profile?.name?.charAt(0)?.toUpperCase() ||
                    user?.email?.charAt(0)?.toUpperCase() ||
                    "U"}
                </AvatarFallback>
              </Avatar>
              <span className="text-[11px] font-medium mt-0.5 whitespace-nowrap truncate">
                내 정보
              </span>
            </>
          ) : (
            <>
              <User className="w-5 h-5" />
              <span className="text-[11px] font-medium mt-0.5 whitespace-nowrap truncate">
                로그인
              </span>
            </>
          )}
        </button>

        {/* 모바일 사용자 드롭다운 */}
        {isAuthenticated && (
          <div
            id="mobile-user-dropdown"
            className="hidden absolute bottom-full left-0 right-0 bg-white border-t border-gray-200 shadow-lg"
            style={{ zIndex: 9999 }}
          >
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="font-medium text-gray-900">
                {profile?.name || "사용자"}
              </p>
              <p className="text-xs text-gray-500">{user?.email}</p>
              {profile && (
                <p className="text-xs text-gray-400 mt-1">
                  이번 달 사용량: {profile.usage_count || 0}/
                  {profile.monthly_limit === -1
                    ? "무제한"
                    : profile.monthly_limit || 10}
                </p>
              )}
            </div>

            {(!profile || profile.subscription_tier === "free") && (
              <button
                onClick={() => {
                  onProPlanClick && onProPlanClick();
                  document
                    .getElementById("mobile-user-dropdown")
                    .classList.add("hidden");
                }}
                className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 text-blue-600 border-b border-gray-100"
              >
                플랜 업그레이드
              </button>
            )}

            <button
              onClick={() => {
                signOut();
                document
                  .getElementById("mobile-user-dropdown")
                  .classList.add("hidden");
              }}
              className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 text-red-600"
            >
              로그아웃
            </button>
          </div>
        )}
      </nav>
    </>
  );
};

export default NavigationBar;
