// src/components/common/InlineInput.jsx - 인라인 텍스트 입력 컴포넌트
import React, { useState, useRef, useEffect } from "react";
import { cn } from "../../lib/utils";

const InlineInput = ({
  value = "",
  onCommit,
  onCancel,
  className,
  ...props
}) => {
  const [currentValue, setCurrentValue] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      onCommit?.(currentValue);
    } else if (e.key === "Escape") {
      onCancel?.();
    }
  };

  const handleBlur = () => {
    onCommit?.(currentValue);
  };

  return (
    <input
      ref={inputRef}
      type="text"
      value={currentValue}
      onChange={(e) => setCurrentValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      className={cn(
        "inline-block px-1 border-b border-indigo-500 bg-white dark:bg-neutral-900 text-indigo-700 w-[16ch]",
        className
      )}
      {...props}
    />
  );
};

export default InlineInput;