// src/lib/utils.js
// clsx와 tailwind-merge 라이브러리가 설치되어 있어야 합니다.
// npm install clsx tailwind-merge 또는 yarn add clsx tailwind-merge

import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
