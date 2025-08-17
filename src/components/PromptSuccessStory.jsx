import React, { useState } from "react";
import { Card, CardContent } from "./ui/card";

const PromptSuccessStory = () => {
  const [expandedItems, setExpandedItems] = useState({});

  const handleToggle = (itemId) => {
    setExpandedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const successStories = [
    {
      id: "info-delivery",
      type: "정보 전달형",
      description: "스크립트 짤 때 정말 유용합니다!",
      icon: "📝",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-100",
      iconBgColor: "bg-blue-100",
      checkboxColor: "text-blue-600",
      toggleBgColor: "bg-blue-50",
      toggleBorderColor: "border-blue-100",
      additionalTasks: [
        {
          id: "task1",
          title:
            "예시 활용: 고급 모드에서 구체적인 사례를 추가하면 더 정확한 결과를 얻을 수 있습니다",
          content:
            '구체적인 사례를 포함하면 AI가 더 정확하게 이해합니다. 예를 들어, "온라인 쇼핑몰 고객 응대" 대신 "의류 쇼핑몰에서 사이즈 문의하는 고객 응대"처럼 구체적으로 작성해보세요.',
        },
        {
          id: "task2",
          title: "반복 개선: 첫 결과가 아쉬우면 세부 조금씩 바꿔보세요",
          content:
            "한 번에 완벽한 결과를 기대하기보다는, 결과를 보고 조금씩 수정해가며 원하는 방향으로 개선해 나가세요. 톤, 길이, 스타일 등을 하나씩 조정해보면 좋습니다.",
        },
      ],
    },
    {
      id: "storytelling",
      type: "스토리텔링",
      description: "가이드/튜토리얼 작성이 이렇게 쉬워질 줄 몰랐어요!",
      icon: "⭐",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-100",
      iconBgColor: "bg-purple-100",
      checkboxColor: "text-purple-600",
      toggleBgColor: "bg-purple-50",
      toggleBorderColor: "border-purple-100",
      additionalTasks: [
        {
          id: "task3",
          title: "내러티브 구조: 기승전결이 명확한 스토리 구조를 설정하세요",
          content:
            "독자의 관심을 끌고 유지하려면 명확한 시작, 중간, 끝이 있어야 합니다. 문제 제기 → 갈등 고조 → 해결 과정 → 결론의 흐름을 만들어보세요.",
        },
        {
          id: "task4",
          title: "감정 연결: 독자가 공감할 수 있는 감정적 요소를 추가하세요",
          content:
            "단순한 정보 전달보다는 독자가 감정적으로 연결될 수 있는 요소를 포함시키면 더 강력한 스토리가 됩니다. 개인적 경험이나 구체적인 사례를 활용해보세요.",
        },
      ],
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-6">
        <h2 className="font-display font-bold text-4xl text-center mb-12 text-gray-900">
          실제 사용자 성공 사례
        </h2>

        <div className="space-y-6">
          {successStories.map((story) => (
            <div
              key={story.id}
              className={`rounded-2xl p-8 border ${story.borderColor} ${story.bgColor} shadow-sm hover:shadow-md transition-all duration-300`}
              style={{
                background: `linear-gradient(to bottom right, ${
                  story.bgColor === "bg-blue-50"
                    ? "rgb(239 246 255)"
                    : "rgb(250 245 255)"
                }, white)`,
              }}
            >
              <div className="flex items-start space-x-4">
                <div
                  className={`w-12 h-12 rounded-full ${story.iconBgColor} flex items-center justify-center flex-shrink-0`}
                >
                  <span className="text-2xl">{story.icon}</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">
                    {story.type}
                  </h3>
                  <p className="text-gray-600 mb-4">{story.description}</p>

                  {/* 추가 작업 섹션 */}
                  {story.additionalTasks &&
                    story.additionalTasks.length > 0 && (
                      <div className="mt-6 space-y-3">
                        <h4 className="font-medium text-gray-700 mb-3">
                          추가 작업
                        </h4>

                        {story.additionalTasks.map((task) => (
                          <div key={task.id} className="relative">
                            {/* 체크박스와 라벨 컨테이너 */}
                            <div className="relative">
                              {/* 체크박스 라벨 */}
                              <label className="flex items-start cursor-pointer group">
                                <input
                                  type="checkbox"
                                  className={`mt-0.5 mr-3 w-5 h-5 ${story.checkboxColor} rounded focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer`}
                                  onChange={() => handleToggle(task.id)}
                                  checked={expandedItems[task.id] || false}
                                />
                                <span className="text-gray-700 group-hover:text-gray-900 transition-colors select-none flex-1">
                                  {task.title}
                                </span>
                              </label>

                              {/* 토글 콘텐츠 - 체크박스 바로 아래, 같은 컨테이너 내부에 위치 */}
                              {expandedItems[task.id] && (
                                <div className="mt-3 ml-8 animate-fadeInUp">
                                  <div
                                    className={`p-4 ${story.toggleBgColor} rounded-lg border ${story.toggleBorderColor}`}
                                  >
                                    <p className="text-sm text-gray-600">
                                      {task.content}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                  {/* 팁 박스 */}
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      💡{" "}
                      <strong>
                        생성된 프롬프트를 복사해서 AI 도구에 붙여넣으세요
                      </strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ChatGPT 시작하기 버튼 */}
        <div className="mt-12 text-center">
          <button
            className="px-12 py-4 rounded-xl text-white font-medium text-lg inline-flex items-center space-x-2 transition-all duration-300 hover:scale-105 hover:shadow-lg"
            style={{
              background: "linear-gradient(135deg, #7D8E82 0%, #60796F 100%)",
            }}
            onClick={() => (window.location.href = "/prompts")}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <span>ChatGPT에서 사용하기</span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default PromptSuccessStory;
