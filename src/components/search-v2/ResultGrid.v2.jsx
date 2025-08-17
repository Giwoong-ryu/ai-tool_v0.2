import React from "react";

export default function ResultGridV2({ items = [], onSelect }) {
  return (
    <div className="gridv2">
      {items.map((it) => (
        <button
          key={it.id}
          className="gridv2-card"
          onClick={() => onSelect?.(it)}
          aria-label={`${it.title} 상세 열기`}
        >
          <div className={`gridv2-chip type-${it.type}`}>{it.type}</div>
          <h3 className="gridv2-title">{it.title}</h3>
          <p className="gridv2-desc">{it.summary}</p>
        </button>
      ))}
    </div>
  );
}
