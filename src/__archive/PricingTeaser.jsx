// [자동 분류] 이 파일은 현재 사용되지 않으며 중복된 컴포넌트로 판단되어 아카이브 처리되었습니다.
import React from "react";

export default function PricingTeaser() {
  return (
    <section className="mt-20">
      <div className="max-w-5xl mx-auto px-4">
        {/* 헤드라인은 작고 중립 톤 */}
        <h2 className="text-sm font-semibold text-gray-500 tracking-wide mb-3">
          요금제 안내 (베타)
        </h2>

        {/* 점선 테두리 + 연한 배경으로 “존재만 알림” */}
        <div className="rounded-xl border border-dashed border-gray-300 bg-white/60 p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-sm text-gray-600 leading-relaxed">
              지금은 <span className="font-medium text-gray-800">핵심 기능 대부분을 무료</span>로 사용하실 수 있어요.
              정식 요금제는 준비 중이며 공개 시 메일로 가볍게 알려드릴게요.
            </p>

            {/* 알림 신청 (동작 연결 전까지는 e.preventDefault) */}
            <form
              onSubmit={(e) => e.preventDefault()}
              className="flex w-full sm:w-auto items-center gap-2"
              aria-label="요금제 출시 알림 신청"
            >
              <input
                type="email"
                required
                placeholder="이메일 입력"
                className="w-full sm:w-64 h-10 rounded-md border border-gray-300 bg-white px-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
              <button
                type="submit"
                className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 hover:bg-gray-50"
              >
                알림받기
              </button>
            </form>
          </div>
          <p className="mt-2 text-xs text-gray-400">
            * 알림만 드립니다. 광고는 보내지 않아요.
          </p>
        </div>
      </div>
    </section>
  );
}