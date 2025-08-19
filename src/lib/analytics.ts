// EasyPick 통합 분석 라이브러리
// 목적: FE 공통 track() 헬퍼 + GA4/Edge 병렬 송신
// 작성자: Claude Analytics Specialist

import analyticsService from '@/services/analyticsService.js'

// 표준 이벤트 타입 정의
export type StandardEvent = 
  | 'select_template'
  | 'compile_prompt' 
  | 'start_workflow'
  | 'complete_step'
  | 'tool_interaction'
  | 'search'
  | 'page_view'
  | 'engagement'
  | 'subscription'
  | 'error'
  | 'conversion'

// 이벤트 파라미터 타입
export interface EventParams {
  // 템플릿 선택
  template_id?: string
  template_type?: 'prompt' | 'workflow' | 'ai_tool'
  category?: string
  
  // 프롬프트 컴파일
  prompt_id?: string
  prompt_length?: number
  model_type?: string
  success?: boolean
  
  // 워크플로
  workflow_id?: string
  workflow_type?: string
  step_count?: number
  step_number?: number
  step_type?: string
  time_spent?: number
  
  // 도구 상호작용
  tool_id?: string
  tool_name?: string
  action_type?: 'view' | 'click' | 'use' | 'bookmark' | 'share'
  
  // 검색
  search_term?: string
  result_count?: number
  filters?: Record<string, any>
  
  // 사용자 참여
  engagement_type?: 'scroll' | 'click' | 'hover' | 'focus' | 'dwell'
  engagement_time?: number
  element?: string
  
  // 구독/결제
  action?: 'start' | 'complete' | 'cancel' | 'upgrade' | 'downgrade'
  plan_type?: 'free' | 'pro' | 'team'
  amount?: number
  currency?: string
  
  // 오류
  error_type?: string
  error_message?: string
  error_context?: string
  
  // 페이지 뷰
  page_name?: string
  page_title?: string
  page_path?: string
  
  // 전환
  conversion_name?: string
  value?: number
  
  // 공통 메타데이터
  user_id?: string
  session_id?: string
  timestamp?: string
  [key: string]: any
}

// 샘플링 설정
const SAMPLING_RATES = {
  // 고빈도 이벤트는 샘플링
  'page_view': 0.1,      // 10% 샘플링
  'engagement': 0.05,    // 5% 샘플링
  'search': 0.2,         // 20% 샘플링
  
  // 중요 이벤트는 100% 수집
  'select_template': 1.0,
  'compile_prompt': 1.0,
  'start_workflow': 1.0,
  'complete_step': 1.0,
  'subscription': 1.0,
  'conversion': 1.0,
  'error': 1.0,
  
  // 기타 이벤트
  'tool_interaction': 0.5  // 50% 샘플링
}

// 이벤트 검증 규칙
const EVENT_VALIDATION = {
  'select_template': ['template_id', 'template_type'],
  'compile_prompt': ['prompt_id', 'model_type'],
  'start_workflow': ['workflow_id', 'workflow_type'],
  'complete_step': ['workflow_id', 'step_number'],
  'tool_interaction': ['tool_id', 'action_type'],
  'search': ['search_term'],
  'subscription': ['action', 'plan_type'],
  'error': ['error_type', 'error_message']
}

// 메인 track 함수
export async function track(
  eventName: StandardEvent,
  params: EventParams = {},
  options: {
    skipSampling?: boolean
    skipValidation?: boolean
    priorityLevel?: 'low' | 'normal' | 'high'
  } = {}
): Promise<boolean> {
  try {
    // 1. 이벤트 검증
    if (!options.skipValidation && !validateEvent(eventName, params)) {
      console.warn(`Invalid event parameters for ${eventName}:`, params)
      return false
    }
    
    // 2. 샘플링 체크 
    if (!options.skipSampling && !shouldSample(eventName)) {
      return true // 샘플링으로 건너뛰지만 성공으로 처리
    }
    
    // 3. 이벤트 정규화
    const normalizedParams = normalizeEventParams(eventName, params)
    
    // 4. 우선순위별 처리
    if (options.priorityLevel === 'high') {
      // 고우선순위 이벤트는 동기 처리
      await sendEventSync(eventName, normalizedParams)
    } else {
      // 일반 이벤트는 비동기 처리 (성능 최적화)
      sendEventAsync(eventName, normalizedParams)
    }
    
    return true
    
  } catch (error) {
    console.error('Event tracking failed:', error)
    
    // 실패한 이벤트도 로컬에 저장
    storeFailedEvent(eventName, params, error)
    return false
  }
}

// 이벤트 검증
function validateEvent(eventName: StandardEvent, params: EventParams): boolean {
  const requiredFields = EVENT_VALIDATION[eventName]
  if (!requiredFields) return true
  
  return requiredFields.every(field => {
    const hasField = params[field] !== undefined && params[field] !== null
    if (!hasField) {
      console.warn(`Missing required field '${field}' for event '${eventName}'`)
    }
    return hasField
  })
}

// 샘플링 결정
function shouldSample(eventName: StandardEvent): boolean {
  const rate = SAMPLING_RATES[eventName] ?? 1.0
  return Math.random() < rate
}

// 이벤트 파라미터 정규화
function normalizeEventParams(eventName: StandardEvent, params: EventParams): EventParams {
  const normalized = {
    ...params,
    event_name: eventName,
    timestamp: params.timestamp || new Date().toISOString(),
    page_url: window.location.href,
    page_title: document.title,
    user_agent: navigator.userAgent
  }
  
  // 이벤트별 기본값 설정
  switch (eventName) {
    case 'select_template':
      normalized.event_category = 'prompt_tools'
      normalized.event_label = `${params.template_type}_${params.category}`
      break
      
    case 'compile_prompt':
      normalized.event_category = 'prompt_tools'
      normalized.event_label = params.model_type
      normalized.value = params.prompt_length
      break
      
    case 'start_workflow':
    case 'complete_step':
      normalized.event_category = 'workflows'
      normalized.event_label = params.workflow_type || `step_${params.step_number}`
      normalized.value = params.step_count || params.time_spent
      break
      
    case 'tool_interaction':
      normalized.event_category = 'ai_tools'
      normalized.event_label = `${params.action_type}_${params.tool_name}`
      break
      
    case 'search':
      normalized.event_category = 'search'
      normalized.event_label = params.search_term
      break
      
    case 'subscription':
      normalized.event_category = 'subscription'
      normalized.event_label = `${params.action}_${params.plan_type}`
      normalized.value = params.amount
      break
  }
  
  return normalized
}

// 동기 이벤트 전송 (고우선순위)
async function sendEventSync(eventName: StandardEvent, params: EventParams): Promise<void> {
  // GA4와 Edge Function 병렬 호출
  await Promise.allSettled([
    sendToGA4(eventName, params),
    sendToEdge(eventName, params)
  ])
}

// 비동기 이벤트 전송 (일반)
function sendEventAsync(eventName: StandardEvent, params: EventParams): void {
  // 다음 이벤트 루프에서 실행 (논블로킹)
  setTimeout(() => {
    Promise.allSettled([
      sendToGA4(eventName, params),
      sendToEdge(eventName, params)
    ]).catch(error => {
      console.error('Async event sending failed:', error)
    })
  }, 0)
}

// GA4 전송
async function sendToGA4(eventName: StandardEvent, params: EventParams): Promise<void> {
  try {
    // 기존 analyticsService의 적절한 메서드 호출
    switch (eventName) {
      case 'select_template':
        await analyticsService.trackTemplateSelect(
          params.template_id, 
          params.template_type, 
          params.category
        )
        break
      case 'compile_prompt':
        await analyticsService.trackPromptCompile(
          params.prompt_id,
          params.prompt_length,
          params.model_type,
          params.success
        )
        break
      case 'start_workflow':
        await analyticsService.trackWorkflowStart(
          params.workflow_id,
          params.workflow_type,
          params.step_count
        )
        break
      case 'complete_step':
        await analyticsService.trackWorkflowStep(
          params.workflow_id,
          params.step_number,
          params.step_type,
          params.time_spent
        )
        break
      default:
        await analyticsService.trackEvent(eventName, params)
    }
  } catch (error) {
    console.error('GA4 tracking failed:', error)
    throw error
  }
}

// Edge Function 전송
async function sendToEdge(eventName: StandardEvent, params: EventParams): Promise<void> {
  try {
    // analyticsService의 sendToEdgeFunction 메서드 직접 사용
    await analyticsService.sendToEdgeFunction({
      event_name: eventName,
      ...params
    })
  } catch (error) {
    console.error('Edge Function tracking failed:', error)
    throw error
  }
}

// 실패한 이벤트 저장 (재시도용)
function storeFailedEvent(eventName: StandardEvent, params: EventParams, error: any): void {
  try {
    const failedEvents = JSON.parse(localStorage.getItem('failed_analytics_events') || '[]')
    failedEvents.push({
      event_name: eventName,
      params,
      error: error.message,
      failed_at: new Date().toISOString(),
      retry_count: 0
    })
    
    // 최대 50개만 보관
    if (failedEvents.length > 50) {
      failedEvents.splice(0, failedEvents.length - 50)
    }
    
    localStorage.setItem('failed_analytics_events', JSON.stringify(failedEvents))
  } catch (storageError) {
    console.error('Failed to store failed event:', storageError)
  }
}

// 실패한 이벤트 재시도
export async function retryFailedEvents(): Promise<number> {
  try {
    const failedEvents = JSON.parse(localStorage.getItem('failed_analytics_events') || '[]')
    let retriedCount = 0
    const remainingEvents = []
    
    for (const event of failedEvents) {
      if (event.retry_count < 3) { // 최대 3회 재시도
        try {
          await track(event.event_name, event.params, { skipSampling: true })
          retriedCount++
        } catch (error) {
          event.retry_count++
          remainingEvents.push(event)
        }
      }
    }
    
    localStorage.setItem('failed_analytics_events', JSON.stringify(remainingEvents))
    return retriedCount
  } catch (error) {
    console.error('Failed to retry events:', error)
    return 0
  }
}

// 사용자 ID 설정
export function setUserId(userId: string): void {
  analyticsService.setUserId(userId)
}

// 편의 함수들 (기존 API와 호환성 유지)
export const trackTemplateSelect = (templateId: string, templateType: string, category: string) =>
  track('select_template', { template_id: templateId, template_type, category })

export const trackPromptCompile = (promptId: string, promptLength: number, modelType: string, success = true) =>
  track('compile_prompt', { prompt_id: promptId, prompt_length: promptLength, model_type: modelType, success })

export const trackWorkflowStart = (workflowId: string, workflowType: string, stepCount: number) =>
  track('start_workflow', { workflow_id: workflowId, workflow_type: workflowType, step_count: stepCount })

export const trackWorkflowStep = (workflowId: string, stepNumber: number, stepType: string, timeSpent: number) =>
  track('complete_step', { workflow_id: workflowId, step_number: stepNumber, step_type: stepType, time_spent: timeSpent })

export const trackToolInteraction = (toolId: string, toolName: string, actionType: string, category: string) =>
  track('tool_interaction', { tool_id: toolId, tool_name: toolName, action_type: actionType, category })

export const trackSearch = (query: string, resultCount: number, filters = {}) =>
  track('search', { search_term: query, result_count: resultCount, filters })

export const trackPageView = (pageName: string, pageTitle = document.title) =>
  track('page_view', { page_name: pageName, page_title: pageTitle, page_path: window.location.pathname })

export const trackError = (errorType: string, errorMessage: string, context: string) =>
  track('error', { error_type: errorType, error_message: errorMessage, error_context: context }, { priorityLevel: 'high' })

export const trackSubscription = (action: string, planType: string, amount: number) =>
  track('subscription', { action, plan_type: planType, amount }, { priorityLevel: 'high' })

export const trackConversion = (conversionName: string, value: number, currency = 'KRW') =>
  track('conversion', { conversion_name: conversionName, value, currency }, { priorityLevel: 'high' })

// 배치 이벤트 전송 (성능 최적화)
export async function trackBatch(events: Array<{ name: StandardEvent; params: EventParams }>): Promise<number> {
  let successCount = 0
  
  for (const event of events) {
    try {
      await track(event.name, event.params)
      successCount++
    } catch (error) {
      console.error(`Batch event failed: ${event.name}`, error)
    }
  }
  
  return successCount
}

// 실시간 이벤트 스트림 (WebSocket 기반, 선택적)
export class EventStream {
  private ws: WebSocket | null = null
  private queue: Array<{ name: StandardEvent; params: EventParams }> = []
  
  connect(url: string): void {
    this.ws = new WebSocket(url)
    this.ws.onopen = () => this.flushQueue()
    this.ws.onclose = () => setTimeout(() => this.connect(url), 5000) // 재연결
  }
  
  send(eventName: StandardEvent, params: EventParams): void {
    const event = { name: eventName, params }
    
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(event))
    } else {
      this.queue.push(event)
    }
  }
  
  private flushQueue(): void {
    while (this.queue.length > 0 && this.ws?.readyState === WebSocket.OPEN) {
      const event = this.queue.shift()!
      this.ws.send(JSON.stringify(event))
    }
  }
}

export default {
  track,
  setUserId,
  retryFailedEvents,
  trackTemplateSelect,
  trackPromptCompile,
  trackWorkflowStart,
  trackWorkflowStep,
  trackToolInteraction,
  trackSearch,
  trackPageView,
  trackError,
  trackSubscription,
  trackConversion,
  trackBatch,
  EventStream
}

/* 사용 예시

// 1. 기본 사용법
import { track } from '@/lib/analytics'

await track('select_template', {
  template_id: 'blog_post_template',
  template_type: 'prompt',
  category: '콘텐츠 제작'
})

// 2. 편의 함수 사용
import { trackPromptCompile } from '@/lib/analytics'

await trackPromptCompile('prompt_123', 150, 'gpt-4', true)

// 3. 배치 전송
import { trackBatch } from '@/lib/analytics'

await trackBatch([
  { name: 'start_workflow', params: { workflow_id: 'wf_1', workflow_type: 'blog' } },
  { name: 'complete_step', params: { workflow_id: 'wf_1', step_number: 1 } }
])

// 4. 실시간 스트림 (선택적)
import { EventStream } from '@/lib/analytics'

const stream = new EventStream()
stream.connect('wss://api.easypick.ai/events')
stream.send('tool_interaction', { tool_id: 'chatgpt', action_type: 'use' })

*/