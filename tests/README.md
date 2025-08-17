# Search V2 테스트 설정 가이드

이 가이드는 Search V2 접근성 및 스모크 테스트를 실행하기 위한 환경 설정 방법을 설명합니다.

## 테스트 의존성 설치

### 1. Jest 및 Testing Library 설치
```bash
# 메인 테스트 프레임워크
pnpm add -D jest @jest/environment-jsdom

# React Testing Library
pnpm add -D @testing-library/react @testing-library/jest-dom @testing-library/user-event

# 접근성 테스트
pnpm add -D jest-axe axe-core

# TypeScript 지원 (필요한 경우)
pnpm add -D ts-jest @types/jest
```

### 2. Vite와 Jest 통합 (대안)
Vite 프로젝트에서는 Vitest 사용을 권장:
```bash
# Vitest (Vite 네이티브 테스트 프레임워크)
pnpm add -D vitest @vitest/ui jsdom

# Testing Library (Vitest와 호환)
pnpm add -D @testing-library/react @testing-library/jest-dom @testing-library/user-event

# 접근성 테스트
pnpm add -D jest-axe axe-core
```

## 설정 파일 구성

### Jest 설정 (jest.config.js)
```javascript
export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.css$': 'identity-obj-proxy'
  },
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
    '^.+\\.jsx?$': 'babel-jest'
  },
  collectCoverageFrom: [
    'src/components/search-v2/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
}
```

### Vitest 설정 (vitest.config.ts)
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    globals: true,
    css: true
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})
```

## package.json 스크립트 추가

### Jest 기반
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:a11y": "jest tests/a11y.smoke.test.tsx",
    "test:ci": "jest --ci --coverage --watchAll=false"
  }
}
```

### Vitest 기반
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:a11y": "vitest run tests/a11y.smoke.test.tsx"
  }
}
```

## 테스트 실행

### 전체 테스트 실행
```bash
pnpm test
```

### 접근성 테스트만 실행
```bash
pnpm test:a11y
```

### 커버리지 포함 실행
```bash
pnpm test:coverage
```

### 감시 모드 (개발 중)
```bash
pnpm test:watch
```

## CI/CD 설정

### GitHub Actions 워크플로우 (.github/workflows/test.yml)
```yaml
name: Search V2 Tests
on:
  push:
    branches: [main, develop]
    paths: ['src/components/search-v2/**', 'tests/**']
  pull_request:
    branches: [main]
    paths: ['src/components/search-v2/**', 'tests/**']

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'pnpm'
          
      - name: Install dependencies
        run: pnpm install
        
      - name: Run accessibility tests
        run: pnpm test:a11y
        
      - name: Run all tests with coverage
        run: pnpm test:coverage
        
      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
          fail_ci_if_error: true
```

## 테스트 파일 구조

```
tests/
├── setup.js                 # 전역 테스트 설정
├── a11y.smoke.test.tsx      # 접근성 및 스모크 테스트
├── helpers/                 # 테스트 유틸리티
│   ├── focus-trap.ts        # 포커스 트랩 테스트 헬퍼
│   ├── keyboard.ts          # 키보드 이벤트 헬퍼
│   └── viewport.ts          # 반응형 테스트 헬퍼
└── __mocks__/              # 모킹 파일들
    ├── intersection-observer.js
    └── resize-observer.js
```

## 테스트 실행 예시

### 성공적인 테스트 출력
```
 PASS  tests/a11y.smoke.test.tsx
  Search V2 Accessibility & Smoke Tests
    1. Combobox ARIA 테스트 (APG 기준)
      ✓ should have required ARIA attributes (152ms)
      ✓ should update aria-activedescendant on keyboard navigation (298ms)
      ✓ should navigate options with arrow keys and select with Enter (341ms)
    2. Dialog ARIA 테스트 (MDN/APG 기준)
      ✓ should have required dialog attributes when side sheet opens (187ms)
      ✓ should move focus to close button when dialog opens (203ms)
      ✓ should return focus to trigger when dialog closes (156ms)
    3. Focus Trap 테스트 (a11y-collective/UXPin 기준)
      ✓ should trap focus within dialog (289ms)
      ✓ should handle Shift+Tab reverse navigation (201ms)
      ✓ should close dialog on Escape key (143ms)

Test Suites: 1 passed, 1 total
Tests:       9 passed, 9 total
Snapshots:   0 total
Time:        2.847s
```

### 실패 시 디버깅 정보
```
 FAIL  tests/a11y.smoke.test.tsx
  Search V2 Accessibility & Smoke Tests
    1. Combobox ARIA 테스트 (APG 기준)
      ✗ should update aria-activedescendant on keyboard navigation (298ms)

  ● Search V2 Accessibility & Smoke Tests › 1. Combobox ARIA 테스트 (APG 기준) › should update aria-activedescendant on keyboard navigation

    expect(received).toMatch(expected)

    Expected pattern: /hub-suggest-listbox-opt-0/
    Received: null

    원인: aria-activedescendant 속성이 갱신되지 않음
    재현 절차:
    1. 검색창에 "블로그" 입력
    2. ArrowDown 키 누르기
    3. aria-activedescendant 값 확인
    예상: "hub-suggest-listbox-opt-0"
    실제: null

    현재 DOM 구조:
    <div role="combobox" aria-expanded="true" aria-controls="hub-suggest-listbox">
      <input value="블로그" />
    </div>
```

## 성능 최적화

### 테스트 실행 속도 개선
```javascript
// tests/setup.js에 추가
// CSS 애니메이션 비활성화
const style = document.createElement('style')
style.innerHTML = `
  *, *::before, *::after {
    animation-duration: 0s !important;
    transition-duration: 0s !important;
  }
`
document.head.appendChild(style)

// 테스트 타임아웃 최적화
jest.setTimeout(5000) // 기본값보다 낮게 설정
```

### 병렬 실행 설정
```json
{
  "scripts": {
    "test:parallel": "jest --maxWorkers=4",
    "test:ci": "jest --ci --maxWorkers=2"
  }
}
```

## 접근성 검증 도구 통합

### axe-core 규칙 커스터마이징
```javascript
// tests/setup.js
import { configureAxe } from 'jest-axe'

const axe = configureAxe({
  rules: {
    // 특정 규칙 비활성화 (필요시)
    'color-contrast': { enabled: false },
    // 커스텀 규칙 추가
    'focus-trap': { enabled: true }
  }
})
```

## 문제 해결

### 공통 오류 및 해결방법

1. **jsdom 환경에서 CSS 미적용**
   ```bash
   pnpm add -D identity-obj-proxy
   ```

2. **ESM 모듈 오류**
   ```json
   // package.json
   {
     "type": "module",
     "jest": {
       "preset": "ts-jest/presets/default-esm"
     }
   }
   ```

3. **React 18 호환성 문제**
   ```bash
   pnpm add -D @testing-library/react@^14.0.0
   ```

---

> 모든 테스트가 통과한 후에만 Search V2 기능을 프로덕션에 배포하세요.