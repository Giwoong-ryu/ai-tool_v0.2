// src/test/workflow-runner-integration.test.js
// Step 6: 러너 저장/재개 골격 통합 테스트

import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import WorkflowRunner from '../components/WorkflowRunner.v2.tsx'
import SharedWorkflowPage from '../pages/share/[token].tsx'

// Mock 데이터
const mockWorkflow = {
  id: 'test-workflow-1',
  title: '테스트 워크플로우',
  description: '통합 테스트용 워크플로우',
  steps: [
    {
      id: 'step-1',
      tool_action: '첫 번째 단계',
      type: 'manual',
      details: '수동으로 실행하는 단계입니다.',
      tool_name: 'Manual',
      estimated_time: '5분',
      difficulty: 'easy'
    },
    {
      id: 'step-2', 
      tool_action: '두 번째 단계',
      type: 'instruction',
      details: '지시사항을 따라 실행하는 단계입니다.',
      tool_name: 'ChatGPT',
      estimated_time: '10분',
      difficulty: 'medium'
    },
    {
      id: 'step-3',
      tool_action: '세 번째 단계',
      type: 'generator',
      details: '자동으로 생성되는 단계입니다.',
      tool_name: 'AI Generator',
      estimated_time: '3분',
      difficulty: 'easy'
    }
  ]
}

const mockUser = {
  id: 'test-user-1',
  email: 'test@example.com'
}

// 테스트 래퍼 컴포넌트
const TestWrapper = ({ children }) => {
  return (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  )
}

describe('WorkflowRunner Integration Tests', () => {
  let testRunId = null
  let testShareToken = null

  beforeEach(async () => {
    // 테스트 실행 전 정리
    if (testRunId) {
      await supabase
        .from('workflow_runs')
        .delete()
        .eq('id', testRunId)
    }
  })

  afterEach(async () => {
    // 테스트 후 정리
    if (testRunId) {
      await supabase
        .from('workflow_runs')
        .delete()
        .eq('id', testRunId)
    }
  })

  test('워크플로우 실행 생성 및 기본 UI 렌더링', async () => {
    render(
      <TestWrapper>
        <WorkflowRunner 
          workflowId="test-workflow-1"
          workflow={mockWorkflow}
        />
      </TestWrapper>
    )

    // 로딩 상태 확인
    expect(screen.getByText('워크플로우 로딩 중...')).toBeInTheDocument()

    // 워크플로우 제목 확인
    await waitFor(() => {
      expect(screen.getByText('테스트 워크플로우')).toBeInTheDocument()
    })

    // 진행률 표시 확인
    expect(screen.getByText('0/3 단계 완료')).toBeInTheDocument()
    expect(screen.getByText('0%')).toBeInTheDocument()

    // 단계 카드들 확인
    expect(screen.getByText('첫 번째 단계')).toBeInTheDocument()
    expect(screen.getByText('두 번째 단계')).toBeInTheDocument()
    expect(screen.getByText('세 번째 단계')).toBeInTheDocument()
  })

  test('단계 완료 및 진행률 업데이트', async () => {
    render(
      <TestWrapper>
        <WorkflowRunner 
          workflowId="test-workflow-1"
          workflow={mockWorkflow}
        />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('테스트 워크플로우')).toBeInTheDocument()
    })

    // 첫 번째 단계 완료 처리
    const firstStepCard = screen.getByText('첫 번째 단계').closest('[data-testid="step-card"]')
    const completeButton = firstStepCard.querySelector('[data-testid="complete-button"]')
    
    if (completeButton) {
      fireEvent.click(completeButton)

      await waitFor(() => {
        expect(screen.getByText('1/3 단계 완료')).toBeInTheDocument()
      })
    }
  })

  test('단계 메모 추가 기능', async () => {
    render(
      <TestWrapper>
        <WorkflowRunner 
          workflowId="test-workflow-1"
          workflow={mockWorkflow}
        />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('테스트 워크플로우')).toBeInTheDocument()
    })

    // 첫 번째 단계 확장
    const firstStepCard = screen.getByText('첫 번째 단계').closest('[data-testid="step-card"]')
    const expandButton = firstStepCard.querySelector('[data-testid="expand-button"]')
    
    if (expandButton) {
      fireEvent.click(expandButton)

      // 메모 입력란 확인
      await waitFor(() => {
        const noteTextarea = screen.getByPlaceholderText('이 단계에 대한 메모를 입력하세요...')
        expect(noteTextarea).toBeInTheDocument()

        // 메모 입력
        fireEvent.change(noteTextarea, { target: { value: '테스트 메모입니다.' } })
        
        // 메모 추가 버튼 클릭
        const addButton = screen.getByText('추가')
        fireEvent.click(addButton)
      })
    }
  })

  test('자동 저장 기능 확인', async () => {
    const { container } = render(
      <TestWrapper>
        <WorkflowRunner 
          workflowId="test-workflow-1"
          workflow={mockWorkflow}
        />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('테스트 워크플로우')).toBeInTheDocument()
    })

    // 자동 저장 상태 표시 확인
    const saveIndicator = container.querySelector('[data-testid="save-indicator"]')
    expect(saveIndicator).toBeInTheDocument()

    // 변경 사항 발생 시 자동 저장 트리거 확인
    // (실제 구현에서는 30초 간격으로 저장)
  })

  test('실행 취소/다시 실행 기능', async () => {
    render(
      <TestWrapper>
        <WorkflowRunner 
          workflowId="test-workflow-1"
          workflow={mockWorkflow}
        />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('테스트 워크플로우')).toBeInTheDocument()
    })

    // 실행 취소 버튼 확인 (초기에는 비활성화)
    const undoButton = screen.getByTestId('undo-button')
    expect(undoButton).toBeDisabled()

    // 다시 실행 버튼 확인 (초기에는 비활성화)
    const redoButton = screen.getByTestId('redo-button')
    expect(redoButton).toBeDisabled()

    // 액션 수행 후 실행 취소 가능 상태 확인
    // (단계 완료 등의 액션 후 테스트)
  })

  test('공유 토큰 생성 및 공유 링크', async () => {
    render(
      <TestWrapper>
        <WorkflowRunner 
          workflowId="test-workflow-1"
          workflow={mockWorkflow}
        />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('테스트 워크플로우')).toBeInTheDocument()
    })

    // 공유 버튼 클릭
    const shareButton = screen.getByText('공유')
    fireEvent.click(shareButton)

    // 공유 토큰 생성 확인
    await waitFor(() => {
      expect(screen.getByText('공유 링크 생성됨')).toBeInTheDocument()
    })
  })
})

describe('SharedWorkflowPage Integration Tests', () => {
  test('유효한 토큰으로 공유 페이지 접근', async () => {
    // Mock 공유 토큰
    const mockToken = 'test-share-token-123'
    
    // URL 파라미터 모킹
    jest.mock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useParams: () => ({ token: mockToken })
    }))

    render(
      <TestWrapper>
        <SharedWorkflowPage />
      </TestWrapper>
    )

    // 로딩 상태 확인
    expect(screen.getByText('공유된 워크플로우를 불러오는 중...')).toBeInTheDocument()

    // 페이지 헤더 확인
    await waitFor(() => {
      expect(screen.getByText('공유된 워크플로우')).toBeInTheDocument()
      expect(screen.getByText('읽기 전용 · 실시간 동기화 불가')).toBeInTheDocument()
    })
  })

  test('잘못된 토큰으로 접근 시 오류 처리', async () => {
    const invalidToken = 'invalid-token-123'
    
    jest.mock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useParams: () => ({ token: invalidToken })
    }))

    render(
      <TestWrapper>
        <SharedWorkflowPage />
      </TestWrapper>
    )

    // 오류 메시지 확인
    await waitFor(() => {
      expect(screen.getByText('공유된 워크플로우를 찾을 수 없습니다.')).toBeInTheDocument()
    })

    // 홈으로 돌아가기 버튼 확인
    expect(screen.getByText('홈으로 돌아가기')).toBeInTheDocument()
  })

  test('공유 페이지에서 단계 정보 복사', async () => {
    const mockToken = 'test-share-token-123'
    
    render(
      <TestWrapper>
        <SharedWorkflowPage />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('공유된 워크플로우')).toBeInTheDocument()
    })

    // 단계 카드의 복사 버튼 확인
    const copyButtons = screen.getAllByTestId('copy-step-button')
    expect(copyButtons.length).toBeGreaterThan(0)

    // 복사 기능 테스트
    if (copyButtons[0]) {
      fireEvent.click(copyButtons[0])
      
      await waitFor(() => {
        expect(screen.getByText('복사 완료')).toBeInTheDocument()
      })
    }
  })

  test('공유 링크 복사 기능', async () => {
    const mockToken = 'test-share-token-123'
    
    render(
      <TestWrapper>
        <SharedWorkflowPage />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('링크 복사')).toBeInTheDocument()
    })

    // 링크 복사 버튼 클릭
    const copyLinkButton = screen.getByText('링크 복사')
    fireEvent.click(copyLinkButton)

    await waitFor(() => {
      expect(screen.getByText('링크 복사됨')).toBeInTheDocument()
    })
  })
})

describe('Database Integration Tests', () => {
  test('Supabase 함수 호출 테스트', async () => {
    // create_workflow_run 함수 테스트
    const { data: runId, error: createError } = await supabase
      .rpc('create_workflow_run', {
        p_workflow_id: 'test-workflow-1',
        p_title: '테스트 실행',
        p_description: '통합 테스트용',
        p_workflow_data: mockWorkflow
      })

    expect(createError).toBeNull()
    expect(runId).toBeDefined()

    if (runId) {
      testRunId = runId

      // initialize_run_steps 함수 테스트
      const { data: stepCount, error: initError } = await supabase
        .rpc('initialize_run_steps', {
          p_run_id: runId,
          p_workflow_data: mockWorkflow
        })

      expect(initError).toBeNull()
      expect(stepCount).toBe(3)

      // generate_share_token 함수 테스트
      const { data: shareToken, error: tokenError } = await supabase
        .rpc('generate_share_token', { run_id: runId })

      expect(tokenError).toBeNull()
      expect(shareToken).toBeDefined()
      expect(typeof shareToken).toBe('string')

      if (shareToken) {
        testShareToken = shareToken

        // get_shared_run 함수 테스트
        const { data: sharedData, error: sharedError } = await supabase
          .rpc('get_shared_run', { token: shareToken })

        expect(sharedError).toBeNull()
        expect(sharedData).toBeDefined()
        expect(sharedData.length).toBe(1)
        expect(sharedData[0].run_data.title).toBe('테스트 실행')
      }
    }
  })

  test('단계 상태 업데이트 테스트', async () => {
    if (!testRunId) return

    // 단계 조회
    const { data: steps, error: stepsError } = await supabase
      .from('workflow_run_steps')
      .select('*')
      .eq('run_id', testRunId)
      .order('step_number')

    expect(stepsError).toBeNull()
    expect(steps.length).toBe(3)

    if (steps.length > 0) {
      const firstStep = steps[0]

      // 단계 상태 업데이트
      const { error: updateError } = await supabase
        .rpc('update_step_status', {
          p_step_id: firstStep.id,
          p_status: 'completed',
          p_notes: '테스트 완료',
          p_output_data: { result: 'success' }
        })

      expect(updateError).toBeNull()

      // 업데이트 확인
      const { data: updatedStep, error: fetchError } = await supabase
        .from('workflow_run_steps')
        .select('*')
        .eq('id', firstStep.id)
        .single()

      expect(fetchError).toBeNull()
      expect(updatedStep.status).toBe('completed')
      expect(updatedStep.notes).toBe('테스트 완료')
      expect(updatedStep.output_data.result).toBe('success')
    }
  })

  test('히스토리 추적 테스트', async () => {
    if (!testRunId) return

    const { data: steps } = await supabase
      .from('workflow_run_steps')
      .select('*')
      .eq('run_id', testRunId)
      .limit(1)

    if (steps && steps.length > 0) {
      const stepId = steps[0].id

      // 히스토리 조회
      const { data: history, error: historyError } = await supabase
        .rpc('get_step_history', {
          p_step_id: stepId,
          p_limit: 10
        })

      expect(historyError).toBeNull()
      expect(Array.isArray(history)).toBe(true)
    }
  })
})

// 성능 테스트
describe('Performance Tests', () => {
  test('대용량 단계 처리 성능', async () => {
    const largeWorkflow = {
      ...mockWorkflow,
      steps: Array.from({ length: 50 }, (_, i) => ({
        id: `step-${i + 1}`,
        tool_action: `단계 ${i + 1}`,
        type: 'manual',
        details: `대용량 테스트 단계 ${i + 1}`,
        tool_name: 'Manual'
      }))
    }

    const startTime = Date.now()

    const { data: runId, error } = await supabase
      .rpc('create_workflow_run', {
        p_workflow_id: 'large-workflow-test',
        p_title: '대용량 워크플로우 테스트',
        p_description: '50개 단계 성능 테스트',
        p_workflow_data: largeWorkflow
      })

    expect(error).toBeNull()

    if (runId) {
      const { data: stepCount } = await supabase
        .rpc('initialize_run_steps', {
          p_run_id: runId,
          p_workflow_data: largeWorkflow
        })

      const endTime = Date.now()
      const processingTime = endTime - startTime

      expect(stepCount).toBe(50)
      expect(processingTime).toBeLessThan(5000) // 5초 이내

      // 정리
      await supabase
        .from('workflow_runs')
        .delete()
        .eq('id', runId)
    }
  })
})