import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";

import NavigationBar from "./NavigationBar";

const EasyPickHero = ({ onAuthClick, onProPlanClick }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    setIsVisible(true);

    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      // 마우스 위치를 -1에서 1 사이의 값으로 변환 (더 부드러운 움직임)
      const x = (clientX / innerWidth - 0.5) * 2;
      const y = (clientY / innerHeight - 0.5) * 2;
      setMousePosition({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // 검색 처리 함수
  const handleSearch = (e) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      navigate(`/prompts?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  return (
    <div className="min-h-screen bg-slate-50 text-gray-800 relative">
      <NavigationBar
        onAuthClick={onAuthClick}
        onProPlanClick={onProPlanClick}
      />

      {/* Hero Section - 더 진한 세이지그린 풀 컬러 블록 */}
      <section
        className="relative min-h-screen flex justify-center overflow-hidden pt-20"
        style={{
          backgroundColor: "#111827", // Footer 배경색과 통일
        }}
      >
        {/* Geometric Pattern Overlay - 더 선명한 패턴 */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full">
            <pattern
              id="grid"
              width="60"
              height="60"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="30" cy="30" r="1" fill="white" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Content Container */}
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center"
          >
            {/* Location Badge - 흰색 배경으로 더 선명하게 */}
            <motion.div
              variants={itemVariants}
              className="inline-flex items-center gap-3 px-7 py-3 rounded-full mb-12"
              style={{
                background: "rgba(255, 255, 255, 0.15)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                marginTop: "4rem",
              }}
              whileHover={{ scale: 1.05 }}
            >
              <svg
                className="w-5 h-5 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-white text-lg font-medium tracking-wide">
                쉬운 AI 사용법
              </span>
            </motion.div>

            {/* Main Headline */}
            <motion.div variants={itemVariants} className="mb-12">
              <h1
                className="font-display font-extrabold text-white leading-none tracking-tight mb-6"
                style={{
                  fontSize: "clamp(5rem, 12vw, 9rem)", // 크기 증가: 4rem->5rem, 10vw->12vw, 7rem->9rem
                  textShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
                  letterSpacing: "-0.02em",
                }}
              >
                EAZY PICK
              </h1>

              <div className="space-y-3">
                <h2 className="font-display font-bold text-white text-3xl sm:text-4xl lg:text-5xl leading-tight">
                  AI를 쉽고 빠르게{" "}
                  <span className="text-[rgb(96,121,111)]">PICK</span> 해보세요
                </h2>
              </div>
            </motion.div>

            {/* 검색창 */}
            <motion.div
              variants={itemVariants}
              className="w-full px-4 mx-auto mb-16 md:w-[130%] md:-mx-[15%] md:px-0"
            >
              <div className="relative">
                {/* 그라데이션 보더 효과를 위한 래퍼 */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-2xl p-[2px]">
                  <div className="w-full h-full bg-[#111827] rounded-2xl"></div>
                </div>

                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none z-10">
                  <Search className="h-7 w-7 text-white/60" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearch}
                  placeholder="어떤 작업을 하실건가요? (예: 보고서 작성, PPT 제작)"
                  className="relative w-full h-20 pl-16 pr-6 text-lg bg-transparent border-0 rounded-2xl text-white placeholder:text-lg placeholder-white/60 focus:outline-none focus:ring-4 focus:ring-white/20 transition-all shadow-2xl z-10"
                />
              </div>
              <p className="text-center text-white/80 text-lg mt-6 font-medium">
                이것저것 길게 쓰지 않아도, 간단하게 원하는 것을 찾아 드립니다
              </p>
            </motion.div>
          </motion.div>
        </div>

        {/* Bottom Feature Strip 제거 - OurStory로 이동 */}

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30">
          <div className="flex flex-col items-center gap-2 text-white/50">
            <div className="text-xs font-medium tracking-wide uppercase">
              스크롤
            </div>
            <motion.div
              className="w-0.5 h-8 bg-white/50"
              animate={{
                scaleY: [1, 0.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default EasyPickHero;
