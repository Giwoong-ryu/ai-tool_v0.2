// [자동 분류] 이 파일은 현재 사용되지 않으며 중복된 컴포넌트로 판단되어 아카이브 처리되었습니다.
import React, { useState } from "react";

const Check = (p) => (
  <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" {...p}>
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 0 1 0 1.414l-7.5 7.5a1 1 0 0 1-1.414 0l-3-3A1 1 0 1 1 5.293 9.793L8.5 13l6.793-6.793a1 1 0 0 1 1.414 0Z" clipRule="evenodd"/>
  </svg>
);

export default function PricingCompact({ onProClick }) {
  const [open, setOpen] = useState(false);

  const free = [
    "AI 도구 추천 / 프롬프트 제안 기본 사용",
    "상세 페이지 및 사용 예시 열람",
    "즐겨찾기(북마크) 최대 20개",
    "최근 본 도구 로컬 저장",
    "주요 모델 간단 비교표",
  ];
  const pro = [
    "고급 필터(다중 조건 조합)",
    "프롬프트 템플릿 무제한 + 폴더",
    "사용 이력 기반 개인화 추천",
    "우선 지원",
  ];

  return (
    <section className="mt-24" aria-labelledby="pricing-compact-title">
      <div className="max-w-6xl mx-auto px-4">
        <div className="relative overflow-visible rounded-3xl border border-gray-200/80 bg-white/80 p-8 sm:p-10 shadow-[0_6px_24px_-10px_rgba(0,0,0,0.18)] backdrop-blur">
          {/* 점 패턴 */}
          <div aria-hidden className="pointer-events-none absolute inset-0 opacity-40"
               style={{ backgroundImage:"radial-gradient(#e5e7eb 1px,transparent 1px)", backgroundSize:"16px 16px" }}/>
          <div className="relative">
            {/* 헤더 */}
            <div className="flex flex-col items-center text-center">
              <div className="inline-flex items-center gap-2">
                <span className="badge-brand">FREE</span>
                <h2 id="pricing-compact-title" className="text-base sm:text-lg font-semibold text-gray-800">
                  무료로 제공되는 기능
                </h2>
              </div>
              <div className="mt-3 h-px w-16 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
            </div>

            {/* 리스트 */}
            <ul className="mt-6 grid gap-3 sm:grid-cols-2 sm:gap-4 max-w-3xl mx-auto">
              {free.map((t, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-900">
                  <Check className="w-4 h-4 mt-0.5 text-brand" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>

            {/* 버튼: 중앙, 단일 톤 */}
            <div className="mt-8 flex justify-center items-center gap-3">
              <a href="#start" className="bg-[rgb(96,121,111)] hover:bg-[rgb(50,70,60)] text-white h-11 px-5 rounded-xl flex items-center">바로 사용하기</a>
              <button type="button" onClick={() => setOpen(true)} className="btn-brand-ghost h-11 px-5 rounded-xl">
                Pro 기능
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pro 모달 */}
      {open && (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 top-[12vh] mx-auto w-[92%] max-w-md">
            <div className="relative rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 overflow-visible">
              <button onClick={() => setOpen(false)}
                      className="absolute top-3 right-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                      aria-label="닫기">
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor"><path fillRule="evenodd" d="M5.23 4.22a.75.75 0 011.06 0L10 7.94l3.71-3.72a.75.75 0 111.06 1.06L11.06 9l3.71 3.71a.75.75 0 11-1.06 1.06L10 10.06l-3.71 3.71a.75.75 0 11-1.06-1.06L8.94 9 5.23 5.28a.75.75 0 010-1.06z" clipRule="evenodd"/></svg>
              </button>

              <div className="p-6 sm:p-7">
                <h3 className="text-base font-semibold text-gray-900">Pro 기능</h3>
                <ul className="mt-4 space-y-3">
                  {pro.map((t, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-900">
                      <Check className="w-4 h-4 mt-0.5 text-brand" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex justify-end">
                  {onProClick
                    ? <button onClick={onProClick} className="btn-brand-ghost">자세히 보기</button>
                    : <a href="#/pricing" className="btn-brand-ghost">자세히 보기</a>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}