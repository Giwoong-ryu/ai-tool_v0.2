import { TEMPLATE_KEYWORDS, LEXICONS } from "@/templates/registry";

export function classifyTemplate(q) {
  const text = (q || "").toLowerCase();
  let best = { id: null, score: 0 };
  for (const [id, words] of Object.entries(TEMPLATE_KEYWORDS)) {
    const s = words.reduce(
      (acc, w) => acc + (text.includes(w.toLowerCase()) ? 1 : 0),
      0
    );
    if (s > best.score) best = { id, score: s };
  }
  return best.score ? best.id : null;
}

const findOne = (text, list) =>
  list.find((v) => text.includes(v.toLowerCase()));

export function extractDefaults(id, q) {
  const t = (q || "").toLowerCase();
  const out = {};
  const pick = (k, dictKey = k) => {
    const hit = findOne(
      t,
      (LEXICONS[dictKey] || []).map((s) => s.toLowerCase())
    );
    if (hit) {
      // 원래 표기 복원
      out[k] = (LEXICONS[dictKey] || []).find((s) => s.toLowerCase() === hit);
    }
  };

  if (id === "resume_cover_letter") {
    pick("position");
    pick("experience");
    pick("tone");
    pick("length", "lengthRC");
  } else if (id === "blog_article") {
    pick("style");
    pick("length");
  } else if (id === "ppt_presentation") {
    pick("subject");
    pick("slideCount");
    pick("toneStyle");
    pick("tool");
    pick("contentStructure");
  } else if (id === "social_media") {
    pick("platform");
    pick("content_type");
    pick("tone");
  } else if (id === "email_writing") {
    pick("recipient");
    pick("urgency");
  }
  return out;
}
