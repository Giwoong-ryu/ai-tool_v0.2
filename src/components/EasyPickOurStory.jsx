// [자동 분류] 이 파일은 현재 사용되지 않으며 중복된 컴포넌트로 판단되어 아카이브 처리되었습니다.
import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const EasyPickOurStory = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="py-16 lg:py-24 bg-white"
      style={{
        background: `
          radial-gradient(circle at 20% 80%, rgba(125, 142, 130, 0.03) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(37, 99, 235, 0.02) 0%, transparent 50%),
          #FFFFFF
        `,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <motion.div
            className={`transition-all duration-700 transform delay-100 ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-8 opacity-0"
            }`}
          >
            <h1
              className="text-5xl lg:text-6xl font-bold leading-tight"
              style={{ color: "#26312C" }}
            >
              더 쉽고 빠르게 AI를 사용해보세요
            </h1>
          </motion.div>

          <motion.p
            className={`max-w-3xl mx-auto text-lg lg:text-xl leading-relaxed mt-8 transition-all duration-700 transform delay-200 ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-8 opacity-0"
            }`}
            style={{ color: "rgba(38,49,44,0.8)" }}
          >
            Eazy Pick은 AI 도구 사용의 복잡함을 해결합니다.
            <br className="hidden sm:block" />
            계속 질문하고 수정하는 대신, 한 번에 PICK하는 간단한 경험을
            제공합니다.
          </motion.p>

          <motion.div
            className={`mt-8 transition-all duration-700 transform delay-400 ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-8 opacity-0"
            }`}
          ></motion.div>
        </div>

        {/* AI 도구 찾기 섹션 */}
        <div className="space-y-16">
          {/* Feature 2: 프롬프트 라이브러리 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              className={`order-2 lg:order-1 bg-slate-100 rounded-2xl p-8 shadow-sm border border-gray-200 transition-all duration-700 transform delay-400 ${
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-8 opacity-0"
              }`}
            >
              <div className="border border-gray-200 rounded-lg p-6 bg-white">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">
                    PPT(슬라이드) 작성
                  </h4>
                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-medium">
                    프레젠테이션
                  </span>
                </div>
                {/* 5개 드롭다운을 flex-wrap으로 2줄 배치 */}
                <div className="flex flex-wrap gap-3 w-full mb-4">
                  <div className="flex flex-col w-[48%]">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      발표 주제
                    </label>
                    <select className="w-full text-sm bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-700">
                      <option>교육 워크숍</option>
                      <option>마케팅 기획</option>
                      <option>신제품 발표</option>
                      <option>사내 보고</option>
                      <option>기타</option>
                      <option>직접 입력</option>
                    </select>
                  </div>
                  <div className="flex flex-col w-[48%]">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      슬라이드 수
                    </label>
                    <select className="w-full text-sm bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-700">
                      <option>5장 내외</option>
                      <option>10장 내외</option>
                      <option>15장 내외</option>
                      <option>직접 입력</option>
                    </select>
                  </div>
                  <div className="flex flex-col w-[48%]">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      톤 & 스타일
                    </label>
                    <select className="w-full text-sm bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-700">
                      <option>모던·심플</option>
                      <option>클래식·격식</option>
                      <option>창의·유쾌</option>
                      <option>직접 입력</option>
                    </select>
                  </div>
                  <div className="flex flex-col w-[48%]">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      사용 툴
                    </label>
                    <select className="w-full text-sm bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-700">
                      <option>PowerPoint</option>
                      <option>Google Slides</option>
                      <option>Keynote</option>
                      <option>직접 입력</option>
                    </select>
                  </div>
                  <div className="flex flex-col w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      콘텐츠 구조
                    </label>
                    <select className="w-full text-sm bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-gray-700">
                      <option>Agenda→Why→How→Demo→Q&A</option>
                      <option>문제→해결→효과</option>
                      <option>도입→전개→결론</option>
                      <option>직접 입력</option>
                    </select>
                  </div>
                </div>
                <div className="border-t border-gray-100 pt-4">
                  <button
                    onClick={() => navigate("/prompts")}
                    className="w-full bg-[rgb(96,121,111)] hover:bg-[rgb(50,70,60)] text-white text-sm font-medium py-3 px-4 rounded-md transition-colors"
                  >
                    프롬프트 생성하러 가기
                  </button>
                </div>
              </div>
            </motion.div>

            <motion.div
              className={`order-1 lg:order-2 transition-all duration-700 transform delay-600 ${
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-8 opacity-0"
              }`}
            >
              <h3
                className="text-3xl font-bold mb-6"
                style={{ color: "#26312C" }}
              >
                프롬프트가 다르면 결과도 다릅니다
                <br />
                딱맞는 프롬프트 30초 만에 자동 완성
              </h3>
              <p
                className="text-lg leading-relaxed"
                style={{ color: "rgba(38,49,44,0.8)" }}
              >
                더 이상 프롬프트 때문에 고민하지 마세요.
                <br />
                이지픽의 방대한 라이브러리에서 원하는 템플릿을 선택하고,
                <br />몇 번의 클릭만으로 당신의 아이디어를 현실로 만들어 줄
                전문가급 프롬프트를 생성하세요.
              </p>
            </motion.div>
          </div>

          {/* Feature 3: 쉬운 통합 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              className={`transition-all duration-700 transform delay-800 ${
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-8 opacity-0"
              }`}
            >
              <h3
                className="text-3xl font-bold mb-6"
                style={{ color: "#26312C" }}
              >
                작업에 필요한 여러 AI앱을 찾아줍니다
              </h3>
              <p
                className="text-lg leading-relaxed"
                style={{ color: "rgba(38,49,44,0.8)" }}
              >
                하고싶은 작업을 입력하면 알맞는 앱들을 연동해줍니다.
                <br />
                아이디어가 떠오르는 순간부터 결과물을 얻기까지의 모든 과정을
                <br />
                단절 없이 이어줍니다.
              </p>
            </motion.div>

            <motion.div
              className={`bg-slate-100 rounded-2xl p-8 shadow-sm border border-gray-200 transition-all duration-700 transform delay-1000 ${
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-8 opacity-0"
              }`}
            >
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
            </motion.div>
          </div>

          {/* Feature 1: 스마트 검색 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              className={`order-2 lg:order-1 bg-slate-100 rounded-2xl p-8 shadow-sm border border-gray-200 transition-all duration-700 transform delay-200 ${
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-8 opacity-0"
              }`}
            >
              <div className="space-y-4">
                {[
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
                ].map((tool) => (
                  <div
                    key={tool.rank}
                    className="flex items-center space-x-4 p-4 bg-white rounded-lg shadow-sm"
                  >
                    <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center text-sm font-bold text-gray-600">
                      {tool.rank}
                    </div>
                    <div className="text-2xl">{tool.icon}</div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">
                        {tool.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {tool.category}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-1">
                        <span className="text-yellow-400">⭐</span>
                        <span className="text-sm font-medium text-gray-700">
                          {tool.rating}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {tool.reviews}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              className={`order-1 lg:order-2 transition-all duration-700 transform ${
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-8 opacity-0"
              }`}
            >
              <h3
                className="text-3xl font-bold mb-6"
                style={{ color: "#26312C" }}
              >
                나에게 딱 맞는 AI 도구 찾기
              </h3>
              <p
                className="text-lg leading-relaxed"
                style={{ color: "rgba(38,49,44,0.8)" }}
              >
                수많은 AI 도구 중 나에게 꼭 필요한 것을 찾기 어려웠나요?
                <br />
                이지픽은 하고싶은 작업만 입력하면 자동으로 AI모델을
                추천해줍니다.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Bottom Section */}
        <motion.div
          className={`mt-20 text-center transition-all duration-700 transform delay-1000 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          <div
            className="inline-flex items-center gap-3 px-6 py-3 rounded-full"
            style={{
              background: "rgba(96, 121, 111, 0.08)",
              border: "1px solid rgba(96, 121, 111, 0.15)",
            }}
          >
            <div
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: "#60796F" }}
            />
            <span className="text-sm font-medium" style={{ color: "#60796F" }}>
              매일 새로운 AI 사용법이 추가됩니다
            </span>
          </div>
        </motion.div>

        {/* Success Metrics - 카드 안에 넣기 */}
        <motion.div
          className={`mt-16 transition-all duration-700 transform delay-1200 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  number: "70%",
                  label: "평균 작업시간 단축",
                  desc: "기존 30분 걸리던 작업을 5분만에 완료",
                },
                {
                  number: "100+",
                  label: "검증된 사례",
                  desc: "실제 사용자들이 확인한 유용한 방법들",
                },
                {
                  number: "24/7",
                  label: "실시간 업데이트",
                  desc: "매일 새로운 AI 도구와 사용법이 추가됩니다",
                },
              ].map((metric, index) => (
                <div key={metric.label} className="group text-center">
                  <motion.div
                    className="text-4xl lg:text-5xl font-bold mb-2 transition-colors duration-300"
                    style={{ color: "#60796F" }}
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    {metric.number}
                  </motion.div>
                  <div
                    className="text-lg font-semibold mb-2"
                    style={{ color: "#26312C" }}
                  >
                    {metric.label}
                  </div>
                  <div
                    className="text-sm"
                    style={{ color: "rgba(38,49,44,0.6)" }}
                  >
                    {metric.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default EasyPickOurStory;
