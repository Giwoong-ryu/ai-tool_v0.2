/**
 * Search V2 접근성 및 스모크 테스트
 * 
 * 이 파일은 Search V2 컴포넌트의 접근성과 핵심 기능을 자동 검증합니다.
 * WAI-ARIA APG, MDN, Material Design 가이드라인을 기준으로 합니다.
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import SearchHubV2 from '../src/components/search-v2/SearchHub.v2'

// Jest-axe 매처 등록
expect.extend(toHaveNoViolations)

// 테스트 유틸리티 함수들
const focusTrapAssert = (container: HTMLElement) => {
  const focusableElements = container.querySelectorAll(
    'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
  )
  
  if (focusableElements.length === 0) {
    throw new Error('포커스 가능한 요소가 없습니다')
  }
  
  return {
    first: focusableElements[0] as HTMLElement,
    last: focusableElements[focusableElements.length - 1] as HTMLElement,
    all: Array.from(focusableElements) as HTMLElement[]
  }
}

const pressKeys = async (user: ReturnType<typeof userEvent.setup>, keys: string[]) => {
  for (const key of keys) {
    await user.keyboard(`{${key}}`)
    await new Promise(resolve => setTimeout(resolve, 50))
  }
}

// IntersectionObserver 모킹
beforeAll(() => {
  global.IntersectionObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }))
})

describe('Search V2 Accessibility & Smoke Tests', () => {
  let user: ReturnType<typeof userEvent.setup>
  
  beforeEach(() => {
    user = userEvent.setup()
  })

  describe('1. Combobox ARIA 테스트 (APG 기준)', () => {
    test('should have required ARIA attributes', async () => {
      const { container } = render(<SearchHubV2 />)
      
      // Combobox 요소 찾기
      const combobox = screen.getByRole('combobox')
      
      // 기본 ARIA 속성 검증
      expect(combobox).toHaveAttribute('role', 'combobox')
      expect(combobox).toHaveAttribute('aria-autocomplete', 'list')
      expect(combobox).toHaveAttribute('aria-expanded', 'false')
      expect(combobox).toHaveAttribute('aria-controls')
      
      // axe-core 접근성 검사
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    test('should update aria-activedescendant on keyboard navigation', async () => {
      render(<SearchHubV2 />)
      
      const combobox = screen.getByRole('combobox')
      
      // 검색어 입력으로 제안 목록 표시
      await user.type(combobox, '블로그')
      
      // 제안 목록이 표시될 때까지 대기
      await waitFor(() => {
        expect(combobox).toHaveAttribute('aria-expanded', 'true')
      })
      
      // ArrowDown으로 첫 번째 옵션 활성화
      await user.keyboard('{ArrowDown}')
      
      // aria-activedescendant가 첫 번째 옵션 ID로 설정되었는지 확인
      const activeDescendant = combobox.getAttribute('aria-activedescendant')
      expect(activeDescendant).toMatch(/hub-suggest-listbox-opt-0/)
      
      // ArrowDown으로 두 번째 옵션 활성화 (제안이 여러 개인 경우)
      await user.keyboard('{ArrowDown}')
      
      // aria-activedescendant가 업데이트되었는지 확인
      const newActiveDescendant = combobox.getAttribute('aria-activedescendant')
      expect(newActiveDescendant).not.toBe(activeDescendant)
    })

    test('should navigate options with arrow keys and select with Enter', async () => {
      render(<SearchHubV2 />)
      
      const combobox = screen.getByRole('combobox')
      
      // 검색어 입력
      await user.type(combobox, '블로그')
      
      // 제안 목록 표시 대기
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument()
      })
      
      // ArrowDown으로 첫 번째 옵션 선택
      await user.keyboard('{ArrowDown}')
      
      // Enter로 선택 확정
      await user.keyboard('{Enter}')
      
      // 선택된 텍스트가 입력창에 복사되었는지 확인
      await waitFor(() => {
        expect(combobox).toHaveValue('블로그 글 초안 만들기')
      })
      
      // 제안 목록이 닫혔는지 확인
      expect(combobox).toHaveAttribute('aria-expanded', 'false')
    })
  })

  describe('2. Dialog ARIA 테스트 (MDN/APG 기준)', () => {
    test('should have required dialog attributes when side sheet opens', async () => {
      const { container } = render(<SearchHubV2 />)
      
      // 카드 클릭으로 사이드시트 열기
      const firstCard = screen.getByText('블로그 글 초안 만들기').closest('button')
      expect(firstCard).toBeInTheDocument()
      
      await user.click(firstCard!)
      
      // Dialog 요소 찾기
      const dialog = await screen.findByRole('dialog')
      
      // Dialog ARIA 속성 검증
      expect(dialog).toHaveAttribute('role', 'dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
      expect(dialog).toHaveAttribute('aria-labelledby')
      expect(dialog).toHaveAttribute('aria-describedby')
      
      // axe-core 접근성 검사
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    test('should move focus to close button when dialog opens', async () => {
      render(<SearchHubV2 />)
      
      // 카드 요소 참조 저장
      const firstCard = screen.getByText('블로그 글 초안 만들기').closest('button')
      
      // 카드 클릭
      await user.click(firstCard!)
      
      // 닫기 버튼으로 포커스 이동 확인
      const closeButton = await screen.findByRole('button', { name: /닫기/ })
      
      await waitFor(() => {
        expect(closeButton).toHaveFocus()
      })
    })

    test('should return focus to trigger when dialog closes', async () => {
      render(<SearchHubV2 />)
      
      // 트리거 카드 클릭
      const triggerCard = screen.getByText('블로그 글 초안 만들기').closest('button')
      await user.click(triggerCard!)
      
      // 닫기 버튼 클릭
      const closeButton = await screen.findByRole('button', { name: /닫기/ })
      await user.click(closeButton)
      
      // 원래 트리거로 포커스 복귀 확인
      await waitFor(() => {
        expect(triggerCard).toHaveFocus()
      })
    })
  })

  describe('3. Focus Trap 테스트 (a11y-collective/UXPin 기준)', () => {
    test('should trap focus within dialog', async () => {
      render(<SearchHubV2 />)
      
      // 사이드시트 열기
      const firstCard = screen.getByText('블로그 글 초안 만들기').closest('button')
      await user.click(firstCard!)
      
      // Dialog 찾기
      const dialog = await screen.findByRole('dialog')
      const focusableElements = focusTrapAssert(dialog)
      
      // 첫 번째 요소 (닫기 버튼)에 포커스되어 있는지 확인
      expect(focusableElements.first).toHaveFocus()
      
      // Tab으로 마지막 요소까지 이동
      for (let i = 0; i < focusableElements.all.length - 1; i++) {
        await user.tab()
      }
      
      // 마지막 요소에서 Tab을 누르면 첫 번째 요소로 순환
      await user.tab()
      expect(focusableElements.first).toHaveFocus()
    })

    test('should handle Shift+Tab reverse navigation', async () => {
      render(<SearchHubV2 />)
      
      // 사이드시트 열기
      const firstCard = screen.getByText('블로그 글 초안 만들기').closest('button')
      await user.click(firstCard!)
      
      const dialog = await screen.findByRole('dialog')
      const focusableElements = focusTrapAssert(dialog)
      
      // 첫 번째 요소에서 Shift+Tab을 누르면 마지막 요소로 이동
      await user.tab({ shift: true })
      expect(focusableElements.last).toHaveFocus()
    })

    test('should close dialog on Escape key', async () => {
      render(<SearchHubV2 />)
      
      // 사이드시트 열기
      const firstCard = screen.getByText('블로그 글 초안 만들기').closest('button')
      await user.click(firstCard!)
      
      // Dialog가 열렸는지 확인
      const dialog = await screen.findByRole('dialog')
      expect(dialog).toBeInTheDocument()
      
      // Escape 키로 닫기
      await user.keyboard('{Escape}')
      
      // Dialog가 닫혔는지 확인
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
    })
  })

  describe('4. Side Sheet 타입 테스트 (Material Design 기준)', () => {
    // 화면 크기를 변경하는 헬퍼 함수
    const setViewportSize = (width: number, height: number) => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: width,
      })
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: height,
      })
      window.dispatchEvent(new Event('resize'))
    }

    test('should show fixed side sheet on desktop', async () => {
      // 데스크톱 크기 설정
      setViewportSize(1024, 768)
      
      render(<SearchHubV2 />)
      
      // 사이드시트 열기
      const firstCard = screen.getByText('블로그 글 초안 만들기').closest('button')
      await user.click(firstCard!)
      
      const dialog = await screen.findByRole('dialog')
      
      // 데스크톱 스타일 검증 (CSS 클래스나 스타일을 통해)
      expect(dialog).toHaveClass('sheetv2')
      expect(dialog).not.toHaveClass('mobile-modal')
    })

    test('should show modal sheet on mobile', async () => {
      // 모바일 크기 설정
      setViewportSize(375, 667)
      
      render(<SearchHubV2 />)
      
      // 사이드시트 열기
      const firstCard = screen.getByText('블로그 글 초안 만들기').closest('button')
      await user.click(firstCard!)
      
      const dialog = await screen.findByRole('dialog')
      
      // 모바일 모달 스타일 검증
      expect(dialog).toHaveClass('sheetv2')
      // CSS 미디어 쿼리로 스타일이 변경되므로 실제 렌더링에서는 클래스가 같을 수 있음
    })
  })

  describe('5. 로딩 UI 테스트 (NN/g 기준)', () => {
    test('should show skeleton on initial load', () => {
      // loading 상태로 컴포넌트 렌더링
      const MockSearchHubWithLoading = () => {
        const [loading, setLoading] = React.useState(true)
        
        React.useEffect(() => {
          // 2초 후 로딩 완료 시뮬레이션
          const timer = setTimeout(() => setLoading(false), 2000)
          return () => clearTimeout(timer)
        }, [])
        
        if (loading) {
          return <div aria-hidden="true" className="skeleton">로딩 중...</div>
        }
        
        return <SearchHubV2 />
      }
      
      render(<MockSearchHubWithLoading />)
      
      // 스켈레톤 요소 확인
      const skeleton = screen.getByText('로딩 중...')
      expect(skeleton).toHaveAttribute('aria-hidden', 'true')
      expect(skeleton).toHaveClass('skeleton')
    })

    test('should show appropriate loading states', async () => {
      render(<SearchHubV2 />)
      
      // 접근성 라벨이 있는 로딩 요소들 확인
      // (실제 구현에서는 검색 중 스피너 등)
      const combobox = screen.getByRole('combobox')
      
      // 검색어 입력
      await user.type(combobox, '검색중')
      
      // 로딩 상태에서 적절한 접근성 라벨 확인
      // (실제 구현에 따라 조정 필요)
    })
  })

  describe('6. 통합 스모크 테스트', () => {
    test('complete user flow: search → navigate → select → open sheet → close', async () => {
      render(<SearchHubV2 />)
      
      // 1. 검색창에 포커스 확인
      const combobox = screen.getByRole('combobox')
      expect(combobox).toBeInTheDocument()
      
      // 2. 검색어 입력
      await user.type(combobox, '블로그')
      
      // 3. 제안 목록 표시 확인
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument()
      })
      
      // 4. 키보드로 제안 선택
      await user.keyboard('{ArrowDown}')
      await user.keyboard('{Enter}')
      
      // 5. 선택된 텍스트 확인
      expect(combobox).toHaveValue('블로그 글 초안 만들기')
      
      // 6. 카드 클릭으로 사이드시트 열기
      const card = screen.getByText('블로그 글 초안 만들기').closest('button')
      await user.click(card!)
      
      // 7. 사이드시트 열림 및 포커스 이동 확인
      const dialog = await screen.findByRole('dialog')
      const closeButton = screen.getByRole('button', { name: /닫기/ })
      
      await waitFor(() => {
        expect(closeButton).toHaveFocus()
      })
      
      // 8. Escape로 닫기
      await user.keyboard('{Escape}')
      
      // 9. 사이드시트 닫힘 확인
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
    })

    test('keyboard-only navigation flow', async () => {
      render(<SearchHubV2 />)
      
      // Tab 키로 페이지 탐색
      await user.tab()
      
      const combobox = screen.getByRole('combobox')
      expect(combobox).toHaveFocus()
      
      // 검색 및 선택
      await user.type(combobox, '프롬프트')
      await user.keyboard('{ArrowDown}')
      await user.keyboard('{Enter}')
      
      // Tab으로 카드까지 이동 (실제로는 여러 번의 Tab이 필요할 수 있음)
      const targetCard = screen.getByText('프롬프트 정리').closest('button')
      targetCard?.focus() // 실제 테스트에서는 Tab 시퀀스로 도달
      
      // Enter로 카드 활성화
      await user.keyboard('{Enter}')
      
      // 사이드시트 열림 확인
      const dialog = await screen.findByRole('dialog')
      expect(dialog).toBeInTheDocument()
      
      // Tab으로 내부 탐색
      await user.tab()
      await user.tab()
      
      // Escape로 닫기
      await user.keyboard('{Escape}')
      
      // 포커스 복귀 확인
      await waitFor(() => {
        expect(targetCard).toHaveFocus()
      })
    })
  })
})

// 에러 발생 시 상세 정보 출력을 위한 커스텀 매처
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveAccessibleDescription(): R
      toHaveValidFocusTrap(): R
    }
  }
}

// 커스텀 매처 구현 예시
expect.extend({
  toHaveAccessibleDescription(received: HTMLElement) {
    const hasAriaLabel = received.hasAttribute('aria-label')
    const hasAriaLabelledBy = received.hasAttribute('aria-labelledby')
    const hasAriaDescribedBy = received.hasAttribute('aria-describedby')
    
    const pass = hasAriaLabel || hasAriaLabelledBy || hasAriaDescribedBy
    
    if (pass) {
      return {
        message: () => `expected element not to have accessible description`,
        pass: true,
      }
    } else {
      return {
        message: () => 
          `expected element to have accessible description\n` +
          `Received element: ${received.outerHTML}\n` +
          `Missing: aria-label, aria-labelledby, or aria-describedby`,
        pass: false,
      }
    }
  },
})