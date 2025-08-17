/**
 * Jest 테스트 환경 설정 파일
 * 
 * 접근성 테스트를 위한 전역 설정과 모킹을 포함합니다.
 */

import '@testing-library/jest-dom'
import { configure } from '@testing-library/react'

// Testing Library 설정
configure({
  // 접근성 테스트를 위해 더 긴 대기 시간 설정
  asyncUtilTimeout: 5000,
  // 테스트 실패 시 더 자세한 정보 출력
  getElementError: (message, container) => {
    const prettifiedDOM = container ? container.innerHTML : 'DOM 없음'
    return new Error(
      `${message}\n\n현재 DOM 구조:\n${prettifiedDOM}`
    )
  }
})

// IntersectionObserver 전역 모킹
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {
    return null
  }
  disconnect() {
    return null
  }
  unobserve() {
    return null
  }
}

// ResizeObserver 전역 모킹
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {
    return null
  }
  disconnect() {
    return null
  }
  unobserve() {
    return null
  }
}

// matchMedia 모킹 (반응형 테스트용)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// localStorage 모킹
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock

// CSS 트랜지션 비활성화 (테스트 속도 향상)
const style = document.createElement('style')
style.innerHTML = `
  *, *::before, *::after {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    transition-duration: 0s !important;
    transition-delay: 0s !important;
  }
`
document.head.appendChild(style)

// 콘솔 에러 중 특정 메시지 필터링
const originalError = console.error
console.error = (...args) => {
  // React 18의 예상되는 경고 메시지들 필터링
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning: ReactDOM.render is deprecated') ||
     args[0].includes('Warning: React.createFactory is deprecated') ||
     args[0].includes('validateDOMNesting'))
  ) {
    return
  }
  originalError.call(console, ...args)
}

// 테스트 전후 정리
beforeEach(() => {
  // localStorage 초기화
  localStorageMock.clear()
  
  // 포커스 초기화
  if (document.activeElement && document.activeElement !== document.body) {
    ;(document.activeElement as HTMLElement).blur()
  }
  
  // DOM 정리
  document.body.innerHTML = ''
})

afterEach(() => {
  // 타이머 정리
  jest.clearAllTimers()
  
  // 모든 모킹 초기화
  jest.clearAllMocks()
})

// 전역 테스트 타임아웃 설정
jest.setTimeout(10000)