// src/features/prompt-launcher/components/SelectionPanel.jsx
import React, { useEffect, useMemo, useState } from "react";
import { usePromptStore } from "../../../store/promptStore";

// UI 의존 최소화: 기본 HTML + Tailwind만 사용 (라이브러리 경로 차이 방지)
const Pill = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`h-8 px-3 rounded-md border text-sm transition
      ${
        active
          ? "bg-emerald-50 border-emerald-300 text-emerald-700"
          : "bg-white border-slate-300 text-slate-700 hover:border-emerald-300"
      }`}
  >
    {children}
  </button>
);

export default function SelectionPanel() {
  const store = usePromptStore();
  const { currentTemplate } = store || {};

  // ---- 1) 스키마 정규화: fields / options / controls / parameters 모두 지원
  const fields = useMemo(() => {
    const t = currentTemplate;
    if (!t) return [];
    if (Array.isArray(t.fields)) return t.fields;

    // options: { fieldId: ['a','b'] } 또는 { fieldId: {label:'', value:''} }
    if (t.options && typeof t.options === "object") {
      return Object.entries(t.options).map(([id, opts]) => ({
        id,
        label: id,
        type: "toggle",
        options: Array.isArray(opts) ? opts : Object.values(opts),
      }));
    }
    if (Array.isArray(t.controls)) return t.controls;
    if (Array.isArray(t.parameters)) return t.parameters;
    return [];
  }, [currentTemplate]);

  // ---- 2) 기본값 세팅
  const [selected, setSelected] = useState({});
  useEffect(() => {
    if (!currentTemplate) return;
    const defaults =
      currentTemplate.defaults ||
      Object.fromEntries(
        fields.map((f) => [f.id, (f.options && f.options[0]) || ""])
      );
    setSelected(defaults);

    // 스토어에 값 반영 시도(함수 존재할 때만)
    try {
      if (typeof store?.setFieldValue === "function") {
        Object.entries(defaults).forEach(([k, v]) => store.setFieldValue(k, v));
      } else if (typeof store?.setSelections === "function") {
        store.setSelections(defaults);
      }
    } catch {}
  }, [currentTemplate, fields]);

  // ---- 3) 값 변경
  const applyChange = (fieldId, value) => {
    setSelected((prev) => ({ ...prev, [fieldId]: value }));
    try {
      if (typeof store?.setFieldValue === "function")
        store.setFieldValue(fieldId, value);
      else if (typeof store?.setSelections === "function")
        store.setSelections({ ...selected, [fieldId]: value });
    } catch {}
  };

  if (!currentTemplate) {
    return (
      <div className="border rounded-lg p-6 text-slate-500">
        템플릿을 먼저 선택해주세요.
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-6 bg-white">
      <div className="mb-4">
        <div className="text-sm text-slate-500">
          {currentTemplate.category || "카테고리"}
        </div>
        <div className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <span className="text-2xl">{currentTemplate.icon || "🧩"}</span>
          {currentTemplate.title || currentTemplate.name || "선택한 템플릿"}
        </div>
      </div>

      <div className="space-y-4">
        {fields.length === 0 ? (
          <div className="text-slate-500 text-sm">
            이 템플릿은 별도의 옵션이 없습니다.
          </div>
        ) : (
          fields.map((f) => (
            <div key={f.id} className="flex items-start gap-3">
              <label className="w-28 shrink-0 text-sm font-medium text-slate-600 pt-1">
                {f.label || f.id}
              </label>

              <div className="flex-1">
                {(f.options?.length ?? 0) > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {(f.options || []).map((opt) => {
                      const val =
                        typeof opt === "string"
                          ? opt
                          : opt.value ?? opt.label ?? String(opt);
                      const label =
                        typeof opt === "string"
                          ? opt
                          : opt.label ?? opt.value ?? String(opt);
                      return (
                        <Pill
                          key={val}
                          active={(selected[f.id] ?? "") === val}
                          onClick={() => applyChange(f.id, val)}
                        >
                          {label}
                        </Pill>
                      );
                    })}
                    {/* 직접입력 스위치 */}
                    <Pill active={false} onClick={() => applyChange(f.id, "")}>
                      직접입력
                    </Pill>
                    {(selected[f.id] ?? "") === "" && (
                      <input
                        type="text"
                        className="mt-2 w-full h-9 px-3 border rounded-md text-sm"
                        placeholder={`${f.label || f.id} 값을 입력하세요`}
                        value={selected[f.id] ?? ""}
                        onChange={(e) => applyChange(f.id, e.target.value)}
                      />
                    )}
                  </div>
                ) : (
                  <input
                    type="text"
                    className="w-full h-9 px-3 border rounded-md text-sm"
                    placeholder={`${f.label || f.id} 값을 입력하세요`}
                    value={selected[f.id] ?? ""}
                    onChange={(e) => applyChange(f.id, e.target.value)}
                  />
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
