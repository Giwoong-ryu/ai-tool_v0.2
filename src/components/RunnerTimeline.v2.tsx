// EasyPick 워크플로우 타임라인 v2
// 목적: 1→N 타임라인, 카드별 복사/열기/체크/메모, 상단 진행률·되돌리기·공유
// 범용 타임라인 컴포넌트로 재사용성 최적화

import React, { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Play, 
  Pause, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Copy, 
  ExternalLink, 
  StickyNote, 
  Undo, 
  Redo, 
  Share2, 
  Save,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  AlertCircle,
  Timer,
  ArrowRight,
  ArrowLeft,
  Target,
  Users,
  Zap
} from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader } from './ui/card'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Textarea } from './ui/textarea'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from './ui/dropdown-menu'
import { Separator } from './ui/separator'
import { Alert, AlertDescription } from './ui/alert'
import { cn } from '../lib/utils'
import { track } from '../lib/analytics'
import { useToast } from './ui/use-toast'

// Types
interface TimelineStep {
  id: string
  title: string
  description?: string
  status: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'failed'
  stepNumber: number
  notes?: string
  isChecked?: boolean
  estimatedTime?: string
  actualTimeSpent?: number
  startedAt?: string
  completedAt?: string
  outputData?: any
  config?: {
    toolName?: string
    difficulty?: 'easy' | 'medium' | 'hard'
    category?: string
    url?: string
  }
}

interface TimelineHeaderProps {
  title: string
  description?: string
  steps: TimelineStep[]
  currentStepIndex: number
  status: 'draft' | 'running' | 'paused' | 'completed' | 'failed'
  canUndo?: boolean
  canRedo?: boolean
  onStart?: () => void
  onPause?: () => void
  onUndo?: () => void
  onRedo?: () => void
  onSave?: () => void
  onShare?: () => void
  isAutoSaving?: boolean
  lastSavedAt?: Date
  hasUnsavedChanges?: boolean
}

interface RunnerTimelineProps {
  steps: TimelineStep[]
  currentStepIndex?: number
  expandedSteps?: Set<string>
  status?: 'draft' | 'running' | 'paused' | 'completed' | 'failed'
  canUndo?: boolean
  canRedo?: boolean
  isAutoSaving?: boolean
  lastSavedAt?: Date
  hasUnsavedChanges?: boolean
  header?: TimelineHeaderProps
  onStepClick?: (stepIndex: number) => void
  onStepComplete?: (stepId: string) => void
  onStepCheck?: (stepId: string) => void
  onStepExpand?: (stepId: string) => void
  onNoteAdd?: (stepId: string, note: string) => void
  onStepCopy?: (step: TimelineStep) => void
  onToolOpen?: (step: TimelineStep) => void
  onStart?: () => void
  onPause?: () => void
  onUndo?: () => void
  onRedo?: () => void
  onSave?: () => void
  onShare?: () => void
  className?: string
}

interface StepCardProps {
  step: TimelineStep
  index: number
  isExpanded: boolean
  isActive: boolean
  noteInput: string
  onToggleExpanded: () => void
  onToggleComplete: () => void
  onToggleCheck: () => void
  onNoteChange: (value: string) => void
  onNoteSubmit: () => void
  onCopy: () => void
  onOpenTool: () => void
  onSetActive: () => void
}

export default function RunnerTimelineV2({
  steps,
  currentStepIndex = 0,
  expandedSteps = new Set(),
  status = 'draft',
  canUndo = false,
  canRedo = false,
  isAutoSaving = false,
  lastSavedAt,
  hasUnsavedChanges = false,
  header,
  onStepClick,
  onStepComplete,
  onStepCheck,
  onStepExpand,
  onNoteAdd,
  onStepCopy,
  onToolOpen,
  onStart,
  onPause,
  onUndo,
  onRedo,
  onSave,
  onShare,
  className
}: RunnerTimelineProps) {
  
  // State
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({})
  const { toast } = useToast()

  // 진행률 계산
  const progress = useMemo(() => {
    if (steps.length === 0) return 0
    const completedSteps = steps.filter(s => s.status === 'completed').length
    return Math.round((completedSteps / steps.length) * 100)
  }, [steps])

  const completedSteps = steps.filter(s => s.status === 'completed').length

  // 마지막 저장 시간 포맷
  const formatLastSaved = useCallback(() => {
    if (!lastSavedAt) return '저장된 적 없음'
    const now = new Date()
    const diffMs = now.getTime() - lastSavedAt.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins === 0) return '방금 저장됨'
    if (diffMins < 60) return `${diffMins}분 전 저장됨`
    return lastSavedAt.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }, [lastSavedAt])

  // 단계 완료 처리
  const handleStepComplete = useCallback(async (stepId: string) => {
    const step = steps.find(s => s.id === stepId)
    if (!step) return

    const newStatus = step.status === 'completed' ? 'pending' : 'completed'
    onStepComplete?.(stepId)
    
    toast({
      title: newStatus === 'completed' ? '단계 완료' : '완료 취소',
      description: `"${step.title}" ${newStatus === 'completed' ? '완료' : '미완료'}로 변경되었습니다.`
    })

    // 다음 단계로 자동 이동
    if (newStatus === 'completed') {
      const nextStep = steps.find(s => s.stepNumber === step.stepNumber + 1)
      if (nextStep) {
        const nextIndex = steps.findIndex(s => s.id === nextStep.id)
        onStepClick?.(nextIndex)
      }
    }

    // <mark>Step 4 Analytics: complete_step 이벤트 추적</mark>
    try {
      await track('complete_step', {
        workflow_id: 'timeline',
        step_number: step.stepNumber,
        step_type: step.config?.category || 'workflow_step',
        time_spent: step.actualTimeSpent || 0,
        status_change: newStatus,
        step_title: step.title
      })
    } catch (analyticsError) {
      console.warn('Analytics tracking failed:', analyticsError)
    }
  }, [steps, onStepComplete, onStepClick, toast])

  // 메모 추가 처리
  const handleNoteUpdate = useCallback(async (stepId: string) => {
    const notes = noteInputs[stepId]
    if (!notes?.trim()) return

    onNoteAdd?.(stepId, notes.trim())
    setNoteInputs(prev => ({ ...prev, [stepId]: '' }))
    
    toast({
      title: '메모 추가됨',
      description: '단계에 메모가 성공적으로 추가되었습니다.'
    })
  }, [noteInputs, onNoteAdd, toast])

  // 단계 복사 처리
  const handleCopyStep = useCallback(async (step: TimelineStep) => {
    const textToCopy = `
단계 ${step.stepNumber}: ${step.title}
도구: ${step.config?.toolName || '없음'}
설명: ${step.description || '설명 없음'}
${step.notes ? `메모: ${step.notes}` : ''}
${step.outputData ? `결과: ${JSON.stringify(step.outputData, null, 2)}` : ''}
    `.trim()

    try {
      await navigator.clipboard.writeText(textToCopy)
      toast({
        title: '복사 완료',
        description: '단계 정보가 클립보드에 복사되었습니다.'
      })

      onStepCopy?.(step)
    } catch (error) {
      toast({
        title: '복사 실패',
        description: '클립보드 복사에 실패했습니다.',
        variant: 'destructive'
      })
    }
  }, [onStepCopy, toast])

  // 도구 열기 처리
  const handleOpenTool = useCallback((step: TimelineStep) => {
    const toolName = step.config?.toolName
    if (!toolName) return

    // 실제 URL이 있으면 사용, 없으면 검색
    const url = step.config?.url || `https://www.google.com/search?q=${encodeURIComponent(toolName)}`
    window.open(url, '_blank', 'noopener,noreferrer')
    
    onToolOpen?.(step)
  }, [onToolOpen])

  return (
    <TooltipProvider>
      <div className={cn("w-full max-w-4xl mx-auto space-y-6", className)}>
        {/* 타임라인 헤더 */}
        {header && (
          <TimelineHeader
            {...header}
            steps={steps}
            currentStepIndex={currentStepIndex}
            status={status}
            canUndo={canUndo}
            canRedo={canRedo}
            onStart={onStart}
            onPause={onPause}
            onUndo={onUndo}
            onRedo={onRedo}
            onSave={onSave}
            onShare={onShare}
            isAutoSaving={isAutoSaving}
            lastSavedAt={lastSavedAt}
            hasUnsavedChanges={hasUnsavedChanges}
          />
        )}

        {/* 간단한 진행률 표시 (헤더가 없는 경우) */}
        {!header && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  진행률
                </span>
                <span className="text-sm text-gray-600">
                  {completedSteps}/{steps.length} 완료 ({progress}%)
                </span>
              </div>
              <Progress value={progress} className="w-full" />
            </CardContent>
          </Card>
        )}

        {/* 타임라인 단계들 */}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
              >
                <StepCard
                  step={step}
                  index={index}
                  isExpanded={expandedSteps.has(step.id)}
                  isActive={index === currentStepIndex}
                  noteInput={noteInputs[step.id] || ''}
                  onToggleExpanded={() => onStepExpand?.(step.id)}
                  onToggleComplete={() => handleStepComplete(step.id)}
                  onToggleCheck={() => {
                    onStepCheck?.(step.id)
                    // <mark>Step 4 Analytics: complete_step 이벤트 추적 (체크버튼)</mark>
                    track('complete_step', {
                      workflow_id: 'timeline',
                      step_number: step.stepNumber,
                      step_type: 'check_toggle',
                      action_type: 'manual_check'
                    }).catch(error => console.warn('Analytics tracking failed:', error))
                  }}
                  onNoteChange={(value) => setNoteInputs(prev => ({ ...prev, [step.id]: value }))}
                  onNoteSubmit={() => handleNoteUpdate(step.id)}
                  onCopy={() => handleCopyStep(step)}
                  onOpenTool={() => handleOpenTool(step)}
                  onSetActive={() => onStepClick?.(index)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* 완료 버튼 */}
        {completedSteps === steps.length && status !== 'completed' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center pt-6"
          >
            <Button 
              size="lg" 
              className="bg-green-600 hover:bg-green-700"
              onClick={() => {
                toast({
                  title: '타임라인 완료!',
                  description: '모든 단계가 성공적으로 완료되었습니다.'
                })
                track('start_workflow', {
                  workflow_id: 'timeline',
                  workflow_type: 'timeline_completion'
                })
              }}
            >
              <CheckCircle2 className="w-5 h-5 mr-2" />
              타임라인 완료하기
            </Button>
          </motion.div>
        )}
      </div>
    </TooltipProvider>
  )
}

// 타임라인 헤더 컴포넌트
function TimelineHeader({
  title,
  description,
  steps,
  currentStepIndex,
  status,
  canUndo,
  canRedo,
  onStart,
  onPause,
  onUndo,
  onRedo,
  onSave,
  onShare,
  isAutoSaving,
  lastSavedAt,
  hasUnsavedChanges
}: TimelineHeaderProps) {
  
  const progress = steps.length > 0 ? Math.round((steps.filter(s => s.status === 'completed').length / steps.length) * 100) : 0
  const completedSteps = steps.filter(s => s.status === 'completed').length

  const formatLastSaved = useCallback(() => {
    if (!lastSavedAt) return '저장된 적 없음'
    const now = new Date()
    const diffMs = now.getTime() - lastSavedAt.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins === 0) return '방금 저장됨'
    if (diffMins < 60) return `${diffMins}분 전 저장됨`
    return lastSavedAt.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }, [lastSavedAt])

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Target className="w-6 h-6 text-blue-600" />
              {title}
            </h1>
            {description && (
              <p className="text-gray-600 mt-1">{description}</p>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {/* 실행 제어 */}
            {status === 'draft' && (
              <Button onClick={onStart} size="sm">
                <Play className="w-4 h-4 mr-1" />
                시작
              </Button>
            )}
            {status === 'running' && (
              <Button onClick={onPause} variant="outline" size="sm">
                <Pause className="w-4 h-4 mr-1" />
                일시정지
              </Button>
            )}
            {status === 'paused' && (
              <Button onClick={onStart} size="sm">
                <Play className="w-4 h-4 mr-1" />
                재시작
              </Button>
            )}

            {/* 실행 취소/다시 실행 */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onUndo}
                  disabled={!canUndo}
                >
                  <Undo className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>실행 취소</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onRedo}
                  disabled={!canRedo}
                >
                  <Redo className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>다시 실행</TooltipContent>
            </Tooltip>

            {/* 저장 */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onSave}
                  disabled={isAutoSaving || !hasUnsavedChanges}
                >
                  {isAutoSaving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>저장</TooltipContent>
            </Tooltip>

            {/* 공유 */}
            <Button onClick={onShare} variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-1" />
              공유
            </Button>
          </div>
        </div>

        {/* 진행률 바 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>{completedSteps}/{steps.length} 단계 완료</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>

        {/* 상태 표시 */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <Badge variant={
              status === 'completed' ? 'default' :
              status === 'running' ? 'secondary' :
              status === 'paused' ? 'outline' : 'destructive'
            }>
              {status === 'draft' && '준비'}
              {status === 'running' && '진행 중'}
              {status === 'paused' && '일시정지'}
              {status === 'completed' && '완료'}
              {status === 'failed' && '실패'}
            </Badge>
            
            {status === 'running' && (
              <div className="flex items-center text-green-600">
                <Timer className="w-3 h-3 mr-1" />
                <span>진행 중</span>
              </div>
            )}
          </div>

          <div className="text-gray-500">
            {isAutoSaving ? (
              <span className="flex items-center">
                <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600 mr-1" />
                저장 중...
              </span>
            ) : (
              <span>{formatLastSaved()}</span>
            )}
          </div>
        </div>
      </CardHeader>
    </Card>
  )
}

// 단계 카드 컴포넌트
function StepCard({
  step,
  index,
  isExpanded,
  isActive,
  noteInput,
  onToggleExpanded,
  onToggleComplete,
  onToggleCheck,
  onNoteChange,
  onNoteSubmit,
  onCopy,
  onOpenTool,
  onSetActive
}: StepCardProps) {
  
  const statusIcons = {
    pending: <Circle className="w-5 h-5 text-gray-400" />,
    in_progress: <Clock className="w-5 h-5 text-blue-500 animate-pulse" />,
    completed: <CheckCircle2 className="w-5 h-5 text-green-500" />,
    skipped: <Circle className="w-5 h-5 text-yellow-500" />,
    failed: <AlertCircle className="w-5 h-5 text-red-500" />
  }

  const stepColors = {
    pending: 'border-gray-200',
    in_progress: 'border-blue-300 bg-blue-50',
    completed: 'border-green-300 bg-green-50',
    skipped: 'border-yellow-300 bg-yellow-50',
    failed: 'border-red-300 bg-red-50'
  }

  return (
    <Card className={cn(
      'transition-all duration-200',
      stepColors[step.status],
      isActive && 'ring-2 ring-blue-500 ring-offset-2',
      'hover:shadow-md cursor-pointer'
    )}>
      <CardHeader 
        className="pb-3 cursor-pointer" 
        onClick={onSetActive}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            {/* 단계 번호 및 상태 */}
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center text-sm font-semibold">
                {index + 1}
              </div>
              <div className="mt-2">
                {statusIcons[step.status]}
              </div>
            </div>

            {/* 단계 내용 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-gray-900 truncate">
                  {step.title}
                </h3>
                {step.config?.toolName && (
                  <Badge variant="outline" className="text-xs">
                    {step.config.toolName}
                  </Badge>
                )}
                {step.config?.difficulty && (
                  <Badge 
                    variant={
                      step.config.difficulty === 'easy' ? 'secondary' :
                      step.config.difficulty === 'medium' ? 'default' : 'destructive'
                    }
                    className="text-xs"
                  >
                    {step.config.difficulty}
                  </Badge>
                )}
              </div>
              
              {step.description && (
                <p className="text-gray-600 mt-1 text-sm line-clamp-2">
                  {step.description}
                </p>
              )}

              {step.estimatedTime && (
                <div className="flex items-center text-xs text-gray-500 mt-1">
                  <Clock className="w-3 h-3 mr-1" />
                  예상 시간: {step.estimatedTime}
                </div>
              )}
            </div>
          </div>

          {/* 액션 버튼들 */}
          <div className="flex items-center space-x-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleCheck()
                  }}
                  className={cn(
                    "w-8 h-8 p-0",
                    step.isChecked && "text-green-600"
                  )}
                >
                  <CheckCircle2 className={cn(
                    "w-4 h-4",
                    step.isChecked ? "fill-current" : ""
                  )} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>체크 토글</TooltipContent>
            </Tooltip>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onCopy}>
                  <Copy className="w-4 h-4 mr-2" />
                  복사
                </DropdownMenuItem>
                {step.config?.toolName && (
                  <DropdownMenuItem onClick={onOpenTool}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    도구 열기
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onToggleComplete}>
                  {step.status === 'completed' ? (
                    <>
                      <Circle className="w-4 h-4 mr-2" />
                      완료 취소
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      완료 표시
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onToggleExpanded()
              }}
              className="w-8 h-8 p-0"
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent className="pt-0">
              <Separator className="mb-4" />
              
              {/* 기존 메모 */}
              {step.notes && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <StickyNote className="w-4 h-4 mr-1" />
                    메모
                  </h4>
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm">
                    {step.notes}
                  </div>
                </div>
              )}

              {/* 메모 추가 */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center">
                  <StickyNote className="w-4 h-4 mr-1" />
                  메모 추가
                </label>
                <div className="flex space-x-2">
                  <Textarea
                    placeholder="이 단계에 대한 메모를 입력하세요..."
                    value={noteInput}
                    onChange={(e) => onNoteChange(e.target.value)}
                    className="text-sm"
                    rows={2}
                  />
                  <Button
                    onClick={onNoteSubmit}
                    disabled={!noteInput.trim()}
                    size="sm"
                    className="self-start"
                  >
                    추가
                  </Button>
                </div>
              </div>

              {/* 출력 데이터 */}
              {step.outputData && Object.keys(step.outputData).length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">결과</h4>
                  <pre className="bg-gray-50 border rounded p-3 text-xs overflow-x-auto">
                    {JSON.stringify(step.outputData, null, 2)}
                  </pre>
                </div>
              )}

              {/* 시간 정보 */}
              {(step.startedAt || step.completedAt) && (
                <div className="mt-4 text-xs text-gray-500 space-y-1">
                  {step.startedAt && (
                    <div>시작: {new Date(step.startedAt).toLocaleString('ko-KR')}</div>
                  )}
                  {step.completedAt && (
                    <div>완료: {new Date(step.completedAt).toLocaleString('ko-KR')}</div>
                  )}
                  {step.actualTimeSpent && (
                    <div>소요 시간: {Math.round(step.actualTimeSpent / 60)}분</div>
                  )}
                </div>
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}