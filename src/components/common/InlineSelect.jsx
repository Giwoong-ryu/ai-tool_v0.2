// src/components/common/InlineSelect.jsx - Refactored
import React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Command, CommandItem } from "../ui/command";
import InlineInput from "./InlineInput";

export default function InlineSelect({ value, options = [], onChange }) {
  const list = Array.isArray(options) ? options : [];
  const [mode, setMode] = React.useState("select");
  const [open, setOpen] = React.useState(false);
  const openInput = () => setMode("input");

  if (mode === "pending") {
    return (
      <button
        onClick={openInput}
        title="클릭하여 입력"
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-dashed border-indigo-400 bg-indigo-50 text-indigo-700 cursor-text"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="opacity-80"
        >
          <path
            d="M9.16669 2.33333L11.0834 4.25L4.41669 10.9167H2.50002V9L9.16669 2.33333ZM10.5417 1.375L12.0417 2.875L10.5417 4.375L9.04169 2.875L10.5417 1.375ZM1.66669 12.5833H12.3334V11.6667H1.66669V12.5833Z"
            fill="currentColor"
          />
        </svg>
        직접 입력
      </button>
    );
  }

  if (mode === "input") {
    return (
      <InlineInput
        value={value}
        onCommit={(v) => {
          onChange(v);
          setMode("select");
        }}
        onCancel={() => setMode("select")}
      />
    );
  }

  return (
    <Popover
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setMode("select");
      }}
    >
      <PopoverTrigger asChild>
        <button type="button" className="underline underline-offset-4 text-indigo-600 hover:text-indigo-700 font-semibold px-1 py-0.5 rounded">
          {value || list[0] || "선택"}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="z-[60] w-64 p-0 bg-white dark:bg-neutral-900 border shadow-lg"
        side="bottom"
        align="start"
      >
        <Command>
          {list.map((opt) => (
            <CommandItem
              key={opt}
              onSelect={() => { onChange(opt); setMode("select"); setOpen(false); }}
              className="transition-all duration-150 hover:bg-gray-100 hover:scale-105 cursor-pointer"
            >
              {opt}
            </CommandItem>
          ))}
          <CommandItem
            onSelect={() => { setMode("pending"); setOpen(false); }}
            className="text-indigo-600 transition-all duration-150 hover:bg-gray-100 hover:scale-105 cursor-pointer"
          >
            직접 입력…
          </CommandItem>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
