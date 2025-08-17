import React, { useEffect, useRef } from "react";

/**
 * 표준(데스크톱): 오른쪽 고정 시트
 * 모달(모바일): 스크림 + 포커스 트랩 + aria-modal
 * Material 권장: 우측 배치, 표준/모달 두 타입. :contentReference[oaicite:5]{index=5}
 * 모달은 포커스 트랩 필수. aria-modal 적용. :contentReference[oaicite:6]{index=6}
 */
export default function SideSheetV2({ open, onClose, item, isAdvanced }) {
  const closeRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (open && closeRef.current) {
      closeRef.current.focus(); // 초기 포커스. :contentReference[oaicite:7]{index=7}
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e) => {
      if (!open) return;
      if (e.key === "Escape") onClose?.();
      if (e.key === "Tab" && containerRef.current) {
        // 간단 포커스 트랩
        const focusables = containerRef.current.querySelectorAll(
          'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      {/* 스크림(모달 전용) */}
      <div
        className={`sheetv2-scrim ${open ? "is-open" : ""}`}
        aria-hidden={!open}
        onClick={onClose}
      />
      <aside
        ref={containerRef}
        className={`sheetv2 ${open ? "is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheetv2-title"
        aria-describedby="sheetv2-desc"
      >
        <div className="sheetv2-header">
          <h2 id="sheetv2-title">{item?.title ?? "상세"}</h2>
          <button
            ref={closeRef}
            className="sheetv2-close"
            onClick={onClose}
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        <div id="sheetv2-desc" className="sheetv2-body">
          <p className="sheetv2-sub">{item?.summary ?? "설명"}</p>

          <div className="sheetv2-section">
            <h3>핵심 옵션(Simple)</h3>
            <div className="sheetv2-fields">
              <label className="field">
                <span>목표</span>
                <input placeholder="예: 블로그 초안" />
              </label>
              <label className="field">
                <span>톤</span>
                <input placeholder="예: 친근하게" />
              </label>
              <label className="field">
                <span>분량</span>
                <input placeholder="예: 1,000자" />
              </label>
            </div>
          </div>

          {isAdvanced && (
            <div className="sheetv2-section">
              <h3>추가 옵션(Advanced)</h3>
              <div className="sheetv2-fields">
                <label className="field">
                  <span>타깃</span>
                  <input placeholder="예: 20–30대" />
                </label>
                <label className="field">
                  <span>금지어</span>
                  <input placeholder="예: 광고성 표현 제외" />
                </label>
                <label className="field">
                  <span>참고URL</span>
                  <input placeholder="예: https://..." />
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="sheetv2-footer">
          <button className="btn primary">복사</button>
          <button className="btn">즐겨찾기</button>
          <button className="btn">실행</button>
          <button className="btn">공유</button>
        </div>
      </aside>
    </>
  );
}
