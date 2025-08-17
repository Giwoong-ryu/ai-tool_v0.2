import React from "react";
import PromptSuccessStory from "../components/PromptSuccessStory.jsx";

const TestPromptPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 (네비게이션 공간 확보) */}
      <div className="h-20 bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            프롬프트 성공 사례 테스트
          </h1>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <main>
        <PromptSuccessStory />
      </main>

      {/* 더 좋은 결과를 얻는 팁 섹션 - 완전히 분리 */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="font-display font-bold text-3xl text-center mb-12 text-gray-900">
            💡 더 좋은 결과를 얻는 팁
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* 팁 카드 1 */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-start space-x-3">
                <span className="text-2xl">🎯</span>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    구체적으로 작성하기
                  </h3>
                  <p className="text-sm text-gray-600">
                    "마케팅 콘텐츠" 대신 "20대 여성을 위한 뷰티 제품 인스타그램
                    광고 문구"처럼 구체적으로 작성하세요.
                  </p>
                </div>
              </div>
            </div>

            {/* 팁 카드 2 */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-start space-x-3">
                <span className="text-2xl">📝</span>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    예시 추가하기
                  </h3>
                  <p className="text-sm text-gray-600">
                    원하는 스타일의 예시를 1-2개 포함하면 AI가 더 정확하게
                    이해합니다.
                  </p>
                </div>
              </div>
            </div>

            {/* 팁 카드 3 */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-start space-x-3">
                <span className="text-2xl">🔄</span>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    반복 수정하기
                  </h3>
                  <p className="text-sm text-gray-600">
                    첫 결과가 마음에 들지 않으면 프롬프트를 조금씩 수정해가며
                    원하는 결과를 찾아가세요.
                  </p>
                </div>
              </div>
            </div>

            {/* 팁 카드 4 */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-start space-x-3">
                <span className="text-2xl">⚙️</span>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    고급 설정 활용
                  </h3>
                  <p className="text-sm text-gray-600">
                    톤, 길이, 형식 등 세부 설정을 조정하여 더 정교한 결과를 얻을
                    수 있습니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TestPromptPage;
