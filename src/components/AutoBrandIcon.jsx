import React, { useMemo, useState } from "react";

/* 도메인/URL → 도메인만 추출 */
function toDomain(input = "") {
  const s = String(input || "").trim();
  try {
    const u = new URL(/^https?:\/\//.test(s) ? s : `https://${s}`);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return s.replace(/^https?:\/\/(www\.)?/, "").split("/")[0];
  }
}

/**
 * AutoBrandIcon (2025-08)
 * 1) Logo.dev 공식 로고 → 2) Google S2 → 3) DuckDuckGo ip3 → 4) /favicon.ico
 *    실패 시 모노그램 표시
 * - 필요 prop: domain 또는 url(둘 중 하나)
 * - name: 접근성(alt) 및 모노그램 문자
 */
export default function AutoBrandIcon({
  domain,
  url,
  name = "",
  size = 56,
  className = "",
}) {
  const d = useMemo(() => toDomain(domain || url), [domain, url]);
  const [idx, setIdx] = useState(0);

  // 공개키: env 우선, 없으면 네가 준 키 사용 (Logo.dev 문서상 pk_는 client-side safe)
  const LOGO_DEV_PK =
    import.meta.env?.VITE_LOGO_DEV_PK || "pk_NiznXewmTcqkp2L4ZUvXag";

  // 레티나 대비: 소스는 2배로 요청
  const px = Math.max(64, size * 2);

  // 후보 URL들 (존재하는 것부터 순차 시도)
  const candidates = useMemo(() => {
    if (!d) return [];
    return [
      // 1) Logo.dev: 공식 로고 (CDN, 토큰은 ?token= 으로 전달)
      // docs: https://docs.logo.dev/logo-images/introduction
      `https://img.logo.dev/${d}?size=${px}&token=${LOGO_DEV_PK}`,

      // 2) Google S2: PNG 파비콘, &sz=로 고해상도 힌트
      // https://www.google.com/s2/favicons?domain=<d>&sz=<n>
      `https://www.google.com/s2/favicons?domain=${d}&sz=${px}`,

      // 3) DuckDuckGo ip3: 다수 도메인에서 잘 동작, 실패 시 404 반환
      // https://icons.duckduckgo.com/ip3/<domain>.ico
      `https://icons.duckduckgo.com/ip3/${d}.ico`,

      // 4) 전통 경로
      `https://${d}/favicon.ico`,
    ];
  }, [d, px, LOGO_DEV_PK]);

  const src = candidates[idx];

  // 모두 실패 → 모노그램
  if (!d || idx >= candidates.length) {
    return (
      <div
        className={`h-14 w-14 rounded-xl bg-white border border-[color:var(--brand-weak)] flex items-center justify-center ${className}`}
        title={name || d}
      >
        <span className="text-sm font-semibold" style={{ color: "var(--brand)" }}>
          {(name || d || "?").slice(0, 1).toUpperCase()}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name || d}
      loading="lazy"
      decoding="async"
      crossOrigin="anonymous"
      onError={() => setIdx((i) => i + 1)} // 실패 시 다음 후보로
      style={{ width: size, height: size }}     // ✅ 크기 고정 제거
      className={`rounded-xl bg-white object-contain aspect-square p-2 
                  border border-[color:var(--brand-weak)] ${className}`}
      draggable="false"
    />
  );
}