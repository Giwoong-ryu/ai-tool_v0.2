import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAutoTemplate } from "../../auto/autoTemplate";
import { usePromptStore } from "../../store/promptStore";
import PromptPanel from "./PromptPanel";
import TemplateGallery from "./TemplateGallery";
import { Button } from "../ui/button";
import { Search } from "lucide-react";

export default function PromptComposer() {
  const { templates, currentTemplate, setCurrentTemplate, resetPrompt } =
    usePromptStore();
  const [sp] = useSearchParams();
  const { applyFromQuery } = useAutoTemplate();
  const navigate = useNavigate();

  // 상단 검색바
  const [query, setQuery] = useState(sp.get("q") || "");
  const onSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    navigate(`?q=${encodeURIComponent(q)}`);
  };

  // ?q=... → 자동 분류 → compose 이동
  useEffect(() => {
    const q = sp.get("q");
    if (!q) return;
    const ok = applyFromQuery(q);
    if (!ok) return;
    const id = usePromptStore.getState().currentTemplate?.id;
    if (id)
      navigate(`?view=compose&template=${encodeURIComponent(id)}`, {
        replace: true,
      });
  }, [sp, applyFromQuery, navigate]);

  // URL(view, template) ↔ 스토어 동기화
  useEffect(() => {
    const view = sp.get("view") || "gallery";
    const tid = sp.get("template") || "";

    if (view !== "compose" || !tid) {
      if (view !== "gallery") {
        resetPrompt();
        setCurrentTemplate(null);
        navigate("?view=gallery", { replace: true });
      } else {
        setCurrentTemplate(null);
      }
      return;
    }

    const t = templates.find((x) => x.id === tid) || null;
    if (!t) {
      resetPrompt();
      setCurrentTemplate(null);
      navigate("?view=gallery", { replace: true });
      return;
    }
    if (!currentTemplate || currentTemplate.id !== t.id) setCurrentTemplate(t);
  }, [
    sp,
    templates,
    currentTemplate,
    setCurrentTemplate,
    resetPrompt,
    navigate,
  ]);

  const openTemplate = (id) =>
    navigate(`?view=compose&template=${encodeURIComponent(id)}`);
  const gotoGallery = () => {
    resetPrompt();
    setCurrentTemplate(null);
    navigate("?view=gallery", { replace: true });
  };

  return (
    <div className="max-w-[960px] xl:max-w-[1100px] mx-auto px-4 space-y-4">
      {/* 프롬프트 화면에서도 항상 보이는 검색바 */}
      <form onSubmit={onSearch} className="flex gap-2">
        <input
          className="flex-1 border rounded px-3 py-2"
          placeholder="예) 인스타 제품 소개 캐주얼 톤 / PPT 제품 소개 15장"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button type="submit" size="sm">
          <Search className="w-4 h-4 mr-1" />
          검색
        </Button>
      </form>

      {currentTemplate ? (
        <PromptPanel onBack={gotoGallery} />
      ) : (
        <TemplateGallery
          templates={templates}
          onSelect={(id) => openTemplate(id)}
        />
      )}
    </div>
  );
}
