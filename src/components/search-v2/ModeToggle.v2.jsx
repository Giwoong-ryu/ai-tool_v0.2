import React from "react";

export default function ModeToggleV2({ value, onChange }) {
  return (
    <div className="modev2">
      <label className={`switch ${value ? "on" : "off"}`}>
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onChange?.(e.target.checked)}
          aria-label="Advanced 모드 전환"
        />
        <span className="knob" />
      </label>
      <span className="modev2-label">{value ? "Advanced" : "Simple"}</span>
    </div>
  );
}
