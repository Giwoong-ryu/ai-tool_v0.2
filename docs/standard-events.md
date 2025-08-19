# EasyPick 표준 이벤트 정의 및 매개변수 규격

## 개요

EasyPick 플랫폼의 모든 사용자 상호작용과 시스템 이벤트를 추적하기 위한 표준화된 이벤트 스키마입니다. 이 문서는 GA4 Analytics와 내부 usage_events 시스템 모두에서 일관된 데이터 수집을 보장합니다.

## 이벤트 파이프라인 아키텍처

```
Frontend track() → GA4 & Edge Function (병렬) → usage_events DB → 월별 집계
```

## 표준 이벤트 타입

### 1. Template & Prompt Events

#### `select_template`
**목적**: 사용자가 프롬프트 템플릿을 선택했을 때  
**권한 체크**: 없음 (free action)  
**샘플링**: 100% (중요 이벤트)

**필수 매개변수**:
- `template_id` (string): 템플릿 고유 ID
- `template_type` (string): 템플릿 유형 - `'prompt' | 'workflow' | 'ai_tool'`

**선택적 매개변수**:
- `category` (string): 템플릿 카테고리 (예: '콘텐츠 제작', '마케팅', '개발')
- `template_name` (string): 템플릿 표시명
- `source` (string): 접근 경로 - `'browse' | 'search' | 'recommendation' | 'bookmark'`

**GA4 매핑**:
```javascript
{
  event_category: 'prompt_tools',
  event_label: `${template_type}_${category}`,
  item_id: template_id,
  content_type: template_type
}
```

**사용 예시**:
```javascript
track('select_template', {
  template_id: 'blog_post_template_001',
  template_type: 'prompt',
  category: '콘텐츠 제작',
  template_name: '블로그 포스트 작성',
  source: 'search'
})
```

---

#### `compile_prompt`
**목적**: 프롬프트 컴파일/생성 요청  
**권한 체크**: ✅ `compile` 액션 (월 20회 제한)  
**샘플링**: 100% (사용량 차감 이벤트)

**필수 매개변수**:
- `prompt_id` (string): 생성된 프롬프트 ID
- `model_type` (string): 사용된 AI 모델 - `'gpt-4' | 'gpt-3.5' | 'claude' | 'custom'`

**선택적 매개변수**:
- `prompt_length` (number): 생성된 프롬프트 길이
- `template_id` (string): 기반 템플릿 ID (있는 경우)
- `success` (boolean): 컴파일 성공 여부 (기본값: true)
- `error_code` (string): 실패 시 에러 코드
- `processing_time` (number): 처리 시간 (ms)

**GA4 매핑**:
```javascript
{
  event_category: 'prompt_tools',
  event_label: model_type,
  value: prompt_length,
  custom_model_type: model_type,
  custom_success: success
}
```

**사용 예시**:
```javascript
track('compile_prompt', {
  prompt_id: 'prompt_12345',
  model_type: 'gpt-4',
  prompt_length: 150,
  template_id: 'blog_post_template_001',
  success: true,
  processing_time: 1200
})
```

---

### 2. Workflow Events

#### `start_workflow`
**목적**: 워크플로우 실행 시작  
**권한 체크**: ✅ `workflow_run` 액션  
**샘플링**: 100% (중요 이벤트)

**필수 매개변수**:
- `workflow_id` (string): 워크플로우 고유 ID
- `workflow_type` (string): 워크플로우 유형

**선택적 매개변수**:
- `step_count` (number): 총 단계 수
- `workflow_name` (string): 워크플로우 표시명
- `estimated_duration` (number): 예상 소요 시간 (분)
- `run_id` (string): 실행 세션 ID

**GA4 매핑**:
```javascript
{
  event_category: 'workflows',
  event_label: workflow_type,
  value: step_count,
  custom_workflow_id: workflow_id
}
```

---

#### `complete_step`
**목적**: 워크플로우 단계 완료  
**권한 체크**: ✅ `workflow_run` 액션  
**샘플링**: 100%

**필수 매개변수**:
- `workflow_id` (string): 워크플로우 ID
- `step_number` (number): 완료된 단계 번호

**선택적 매개변수**:
- `step_type` (string): 단계 유형
- `step_name` (string): 단계 명
- `time_spent` (number): 단계 소요 시간 (초)
- `run_id` (string): 실행 세션 ID
- `success` (boolean): 단계 성공 여부
- `output_data` (object): 단계 출력 데이터

**GA4 매핑**:
```javascript
{
  event_category: 'workflows',
  event_label: `${step_type}_step_${step_number}`,
  value: time_spent
}
```

---

### 3. Tool Interaction Events

#### `tool_interaction`
**목적**: AI 도구와의 상호작용 추적  
**권한 체크**: 조건부 (`ai_tool_access` - Pro 기능일 경우)  
**샘플링**: 50%

**필수 매개변수**:
- `tool_id` (string): 도구 고유 ID
- `action_type` (string): 액션 유형 - `'view' | 'click' | 'use' | 'bookmark' | 'share'`

**선택적 매개변수**:
- `tool_name` (string): 도구 표시명
- `category` (string): 도구 카테고리
- `tool_url` (string): 도구 URL
- `interaction_duration` (number): 상호작용 시간 (초)
- `feature_used` (string): 사용된 특정 기능

**GA4 매핑**:
```javascript
{
  event_category: 'ai_tools',
  event_label: `${action_type}_${tool_name}`,
  custom_tool_category: category
}
```

---

### 4. Search & Discovery Events

#### `search`
**목적**: 검색 기능 사용 추적  
**권한 체크**: 없음  
**샘플링**: 20%

**필수 매개변수**:
- `search_term` (string): 검색어

**선택적 매개변수**:
- `result_count` (number): 검색 결과 수
- `filters` (object): 적용된 필터
- `search_type` (string): 검색 유형 - `'tools' | 'templates' | 'workflows' | 'global'`
- `result_clicked` (boolean): 결과 클릭 여부
- `search_duration` (number): 검색 소요 시간 (ms)

**GA4 매핑**:
```javascript
{
  event_category: 'search',
  event_label: search_term,
  value: result_count,
  search_term: search_term
}
```

---

### 5. User Engagement Events

#### `page_view`
**목적**: 페이지 뷰 추적 (SPA 네비게이션)  
**권한 체크**: 없음  
**샘플링**: 10%

**필수 매개변수**:
- `page_name` (string): 페이지 식별명

**선택적 매개변수**:
- `page_title` (string): 페이지 제목 (기본값: document.title)
- `page_path` (string): 페이지 경로 (기본값: window.location.pathname)
- `referrer` (string): 이전 페이지
- `load_time` (number): 페이지 로드 시간 (ms)

---

#### `engagement`
**목적**: 사용자 참여도 측정  
**권한 체크**: 없음  
**샘플링**: 5%

**필수 매개변수**:
- `engagement_type` (string): 참여 유형 - `'scroll' | 'click' | 'hover' | 'focus' | 'dwell'`

**선택적 매개변수**:
- `engagement_time` (number): 참여 시간 (초)
- `element` (string): 상호작용한 요소
- `scroll_depth` (number): 스크롤 깊이 (%, scroll 타입일 때)
- `page_section` (string): 페이지 섹션

---

### 6. Business Events

#### `subscription`
**목적**: 구독/결제 관련 이벤트  
**권한 체크**: 없음  
**샘플링**: 100% (중요 비즈니스 이벤트)

**필수 매개변수**:
- `action` (string): 액션 유형 - `'start' | 'complete' | 'cancel' | 'upgrade' | 'downgrade'`
- `plan_type` (string): 플랜 유형 - `'free' | 'pro' | 'team'`

**선택적 매개변수**:
- `amount` (number): 결제 금액
- `currency` (string): 통화 (기본값: 'KRW')
- `payment_method` (string): 결제 수단
- `subscription_id` (string): 구독 ID
- `previous_plan` (string): 이전 플랜 (업그레이드/다운그레이드 시)

**GA4 매핑**:
```javascript
{
  event_category: 'subscription',
  event_label: `${action}_${plan_type}`,
  value: amount,
  currency: currency,
  transaction_id: subscription_id
}
```

---

#### `conversion`
**목적**: 주요 전환 이벤트 추적  
**권한 체크**: 없음  
**샘플링**: 100%

**필수 매개변수**:
- `conversion_name` (string): 전환 이벤트명
- `value` (number): 전환 가치

**선택적 매개변수**:
- `currency` (string): 통화 (기본값: 'KRW')
- `conversion_stage` (string): 전환 단계
- `campaign_id` (string): 캠페인 ID

---

### 7. System Events

#### `error`
**목적**: 에러 및 예외 상황 추적  
**권한 체크**: 없음  
**샘플링**: 100% (중요 시스템 이벤트)

**필수 매개변수**:
- `error_type` (string): 에러 유형
- `error_message` (string): 에러 메시지

**선택적 매개변수**:
- `error_context` (string): 에러 발생 컨텍스트
- `error_code` (string): 에러 코드
- `stack_trace` (string): 스택 트레이스 (개발 환경에서만)
- `user_action` (string): 에러 발생 시 사용자 액션

**GA4 매핑**:
```javascript
{
  event_category: 'errors',
  event_label: error_type,
  custom_error_code: error_code
}
```

---

## 이벤트 매개변수 공통 규칙

### 자동 추가 매개변수
모든 이벤트에 자동으로 추가되는 매개변수:

```javascript
{
  // 세션 정보
  session_id: string,        // 세션 ID
  user_id?: string,          // 사용자 ID (로그인 시)
  
  // 페이지 정보
  page_url: string,          // 현재 페이지 URL
  page_title: string,        // 페이지 제목
  user_agent: string,        // User-Agent
  
  // 타임스탬프
  timestamp: string,         // ISO 8601 형식
  
  // 이벤트 메타데이터
  event_name: string,        // 이벤트명
  processed_at: string       // 서버 처리 시간
}
```

### 매개변수 명명 규칙

1. **snake_case** 사용: `template_id`, `user_action`
2. **명확한 의미**: `btn_click` (❌) → `button_clicked` (✅)
3. **일관된 접미사**:
   - `_id`: 고유 식별자
   - `_type`: 분류/유형
   - `_count`: 개수
   - `_time`: 시간 (초 단위)
   - `_duration`: 기간 (초 단위)

### 데이터 타입 제한

- **String**: 최대 100자, GA4 호환을 위해 영숫자와 언더스코어만
- **Number**: 정수 또는 소수점 2자리까지
- **Boolean**: true/false
- **Object**: JSONB로 저장, 최대 1KB

## 권한 검증 매핑

```javascript
const PROTECTED_EVENTS = {
  'compile_prompt': 'compile',      // 프롬프트 컴파일
  'start_workflow': 'workflow_run', // 워크플로우 실행
  'complete_step': 'workflow_run',  // 단계 완료
  'tool_interaction': 'ai_tool_access' // AI 도구 액세스 (조건부)
}
```

## 샘플링 설정

```javascript
const SAMPLING_RATES = {
  // 고빈도 이벤트 (샘플링 적용)
  'page_view': 0.1,        // 10%
  'engagement': 0.05,      // 5%
  'search': 0.2,           // 20%
  'tool_interaction': 0.5, // 50%
  
  // 중요 이벤트 (100% 수집)
  'select_template': 1.0,
  'compile_prompt': 1.0,
  'start_workflow': 1.0,
  'complete_step': 1.0,
  'subscription': 1.0,
  'conversion': 1.0,
  'error': 1.0
}
```

## 통합 사용 예시

### 프론트엔드에서 이벤트 발송

```javascript
import { track } from '@/lib/analytics'

// 1. 템플릿 선택
await track('select_template', {
  template_id: 'blog_template_001',
  template_type: 'prompt',
  category: '콘텐츠 제작',
  source: 'search'
})

// 2. 프롬프트 컴파일 (권한 확인 포함)
await track('compile_prompt', {
  prompt_id: 'prompt_abc123',
  model_type: 'gpt-4',
  template_id: 'blog_template_001',
  prompt_length: 250
})

// 3. 에러 추적 (고우선순위)
await track('error', {
  error_type: 'api_timeout',
  error_message: 'OpenAI API timeout',
  error_context: 'prompt_compilation'
}, { priorityLevel: 'high' })
```

### 배치 이벤트 전송

```javascript
import { trackBatch } from '@/lib/analytics'

await trackBatch([
  {
    name: 'start_workflow',
    params: {
      workflow_id: 'content_creation_001',
      workflow_type: 'blog_creation',
      step_count: 5
    }
  },
  {
    name: 'complete_step',
    params: {
      workflow_id: 'content_creation_001',
      step_number: 1,
      step_type: 'outline',
      time_spent: 45
    }
  }
])
```

## 권한 에러 처리

권한이 없는 경우 Edge Function에서 402 상태 코드와 함께 상세 정보 반환:

```javascript
{
  "success": false,
  "processed": 0,
  "failed": 1,
  "errors": [
    "Quota exceeded for compile. Current: 20/20"
  ]
}
```

## 월별 집계 조회

```sql
-- 현재 월 사용자 사용량 조회
SELECT * FROM get_user_monthly_usage('user-uuid', 'compile', 0);

-- 할당량 초과 사용자 목록
SELECT * FROM usage_current_month_quota WHERE quota_exceeded = true;

-- 월별 시스템 통계
SELECT * FROM usage_monthly_system_summary 
WHERE month_start >= '2024-01-01'
ORDER BY month_start DESC;
```

이 표준 이벤트 규격을 통해 일관된 데이터 수집과 분석이 가능하며, GA4 Analytics와 내부 사용량 추적 시스템 간의 완벽한 동기화를 보장합니다.