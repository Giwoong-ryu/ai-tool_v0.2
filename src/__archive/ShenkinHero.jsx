// [자동 분류] 이 파일은 현재 사용되지 않으며 중복된 컴포넌트로 판단되어 아카이브 처리되었습니다.
// src/components/ShenkinHero.jsx

import React from "react";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";

// 재사용 가능한 버튼 컴포넌트들을 모두 포함합니다.
const PrimaryButton = ({ children, className, ...props }) => (
  <button
    className={`inline-flex items-center justify-center rounded-[8px] px-8 py-3 font-medium transition-colors bg-[#7D8E82] text-white
                hover:bg-[#66786C] focus:outline-none focus:ring-2 focus:ring-[#98A59A] focus:ring-offset-2 focus:ring-offset-black
                ${className}`}
    {...props}
  >
    {children}
  </button>
);

const SecondaryButton = ({ children, className, ...props }) => (
  <button
    className={`inline-flex items-center justify-center rounded-[8px] px-8 py-3 font-medium transition-colors border-2 border-[rgba(255,255,255,0.2)] text-[rgba(255,255,255,0.7)]
                hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#98A59A] focus:ring-offset-2 focus:ring-offset-black
                ${className}`}
    {...props}
  >
    {children}
  </button>
);

const ShenkinHero = () => {
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="relative h-screen flex items-center justify-center bg-black">
      {/* 배경 그라디언트 오버레이 */}
      <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.3)] to-transparent" />

      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 max-w-screen-xl mx-auto text-white">
        <motion.div
          className="flex flex-col items-center text-center space-y-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* 인포 배지 */}
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center space-x-1.5 px-4 py-1 rounded-[24px] bg-[rgba(125,142,130,0.12)] text-[#98A59A] text-sm"
          >
            <MapPin className="h-4 w-4" />
            <span>NEWTOWN, SYDNEY</span>
          </motion.div>

          {/* 타이틀 */}
          <motion.h1
            variants={itemVariants}
            className="font-poppins font-extrabold uppercase tracking-tighter leading-none"
            style={{ fontSize: "clamp(3.5rem, 8vw, 6rem)" }}
          >
            SHENKIN
            <br />
            COFFEE
            <br />
            ROASTERS
          </motion.h1>

          {/* 서브타이틀 */}
          <motion.h2
            variants={itemVariants}
            className="font-bold text-white max-w-md"
            style={{ fontSize: "clamp(1.25rem, 2.5vw, 2rem)" }}
          >
            THE FLAVOR OF TRADITION
            <br />
            IN EVERY CUP
          </motion.h2>

          {/* 카피 */}
          <motion.p
            variants={itemVariants}
            className="text-[#B3B8B6] max-w-md"
            style={{ lineHeight: "1.6" }}
          >
            Shenkin Coffee Roasters brings the authentic taste of Sydney's
            coffee culture to your neighborhood. Experience our handcrafted
            blends and artisanal pastries.
          </motion.p>

          {/* 버튼 그룹 */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 pt-4"
          >
            <PrimaryButton>VIEW MENU</PrimaryButton>
            <SecondaryButton>OUR STORY</SecondaryButton>
          </motion.div>

          {/* 컨버전 지표 */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-8 pt-8 text-white"
          >
            <div className="flex flex-col items-center">
              <span
                className="font-bold"
                style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}
              >
                7
              </span>
              <span className="text-xs font-light tracking-wide">
                DAYS OPEN
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span
                className="font-bold"
                style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}
              >
                6 AM
              </span>
              <span className="text-xs font-light tracking-wide">
                FIRST COFFEE
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span
                className="font-bold"
                style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}
              >
                100%
              </span>
              <span className="text-xs font-light tracking-wide">
                FRESH DAILY
              </span>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Tailwind에 Poppins 폰트를 사용하기 위한 설정 */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;700;800&display=swap');
        .font-poppins {
          font-family: 'Poppins', sans-serif;
        }
      `}</style>
    </div>
  );
};

export default ShenkinHero;