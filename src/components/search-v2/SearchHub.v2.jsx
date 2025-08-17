import React, { useEffect, useMemo, useRef, useState } from "react";
import ResultGridV2 from "./ResultGrid.v2";
import SideSheetV2 from "./SideSheet.v2";
import ModeToggleV2 from "./ModeToggle.v2";
import LoadingSkeletonV2 from "./LoadingSkeleton.v2";
import data from "../../fixtures/search-v2.json";

// 간단 디바운스
const useDebounced = (value, delay = 250) => {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
};

export default function SearchHubV2() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);

  // Combobox 상태
  const [showSuggest, setShowSuggest] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debouncedQ = useDebounced(q, 250);
  const listId = "hub-suggest-listbox";
  const inputRef = useRef(null);

  const suggestions = useMemo(() => {
    if (!debouncedQ) return [];
    const low = debouncedQ.toLowerCase();
    return data.items
      .filter(
        (it) =>
          it.title.toLowerCase().includes(low) ||
          it.tags.join(" ").toLowerCase().includes(low)
      )
      .slice(0, 8); // 데스크톱 최대 10, 모바일은 4–8 권장. 여기선 8로 컷. :contentReference[oaicite:2]{index=2}
  }, [debouncedQ]);

  const results = useMemo(() => {
    // V1: 제안 목록을 그대로 미리보기로 사용. 추후 FTS→pgvector 재정렬로 교체.
    return suggestions.length ? suggestions : data.items.slice(0, 6);
  }, [suggestions]);

  const onSelectCard = (item) => {
    setSelected(item);
    setOpen(true);
  };

  const onKeyDown = (e) => {
    if (!showSuggest) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      const pick = suggestions[activeIndex];
      setQ(pick.title); // 선택한 제안을 입력창에 복사·편집 가능. :contentReference[oaicite:3]{index=3}
      setShowSuggest(false);
    } else if (e.key === "Escape") {
      setShowSuggest(false);
    }
  };

  useEffect(() => {
    if (debouncedQ) setShowSuggest(true);
    else setShowSuggest(false);
  }, [debouncedQ]);

  return (
    <div className="hubv2-container">
      <header className="hubv2-header">
        <h1 className="hubv2-title">무엇을 하고 싶나요?</h1>
        <div
          className="hubv2-combobox"
          role="combobox"
          aria-expanded={showSuggest}
          aria-owns={listId}
          aria-controls={listId}
          aria-haspopup="listbox"
        >
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => setShowSuggest(Boolean(debouncedQ))}
            onKeyDown={onKeyDown}
            aria-autocomplete="list" /* :contentReference[oaicite:4]{index=4} */
            aria-controls={listId}
            aria-activedescendant={
              activeIndex >= 0 && showSuggest
                ? `${listId}-opt-${activeIndex}`
                : undefined
            }
            placeholder="예: 블로그 글 초안 만들기, PPT 목차 생성, 프롬프트 정리"
            className="hubv2-input"
            type="text"
          />
          {showSuggest && suggestions.length > 0 && (
            <ul id={listId} role="listbox" className="hubv2-suggest">
              {suggestions.map((s, idx) => (
                <li
                  id={`${listId}-opt-${idx}`}
                  key={s.id}
                  role="option"
                  aria-selected={activeIndex === idx}
                  className={`hubv2-suggest-item ${
                    activeIndex === idx ? "is-active" : ""
                  }`}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onMouseLeave={() => setActiveIndex(-1)}
                  onMouseDown={(e) => {
                    // mousedown에서 바로 blur되기 전에 반영
                    e.preventDefault();
                    setQ(s.title);
                    setShowSuggest(false);
                  }}
                >
                  <span className="hubv2-suggest-title">{s.title}</span>
                  <span className="hubv2-suggest-type">{s.type}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <ModeToggleV2 value={isAdvanced} onChange={setIsAdvanced} />
      </header>

      {loading ? (
        <LoadingSkeletonV2 />
      ) : (
        <ResultGridV2 items={results} onSelect={onSelectCard} />
      )}

      <SideSheetV2
        open={open}
        onClose={() => setOpen(false)}
        item={selected}
        isAdvanced={isAdvanced}
      />
    </div>
  );
}
