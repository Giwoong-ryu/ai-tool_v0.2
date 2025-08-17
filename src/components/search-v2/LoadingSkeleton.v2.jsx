import React from "react";

export default function LoadingSkeletonV2() {
  return (
    <div aria-hidden className="skeletonv2">
      <div className="skl-input" />
      <div className="skl-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skl-card" />
        ))}
      </div>
    </div>
  );
}
