import { classifyTemplate, extractDefaults } from "./intent";
import { usePromptStore } from "@/store/promptStore";

export function useAutoTemplate() {
  const {
    templates,
    setCurrentTemplate,
    initializeWithDefaults,
    resolveDefaults,
  } = usePromptStore();

  const applyFromQuery = (q) => {
    const id = classifyTemplate(q);
    if (!id) return false;
    const t = templates.find((x) => x.id === id);
    if (!t) return false;

    const base = resolveDefaults(t); // 옵션 첫값 기반
    const mined = extractDefaults(id, q); // 검색어에서 추출
    const merged = { ...base, ...mined };

    setCurrentTemplate(t);
    initializeWithDefaults({ ...t, defaults: merged });
    return true;
  };

  return { applyFromQuery };
}
