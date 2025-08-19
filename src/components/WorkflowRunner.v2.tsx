// src/components/WorkflowRunner.v2.tsx
import React, { useEffect, useState, useCallback } from 'react'
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
  Download,
  Upload,
  History,
  RefreshCw
} from 'lucide-react'
import { Button } from './ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card.jsx'
import { Badge } from './ui/badge.jsx'
import { Progress } from './ui/progress.jsx'
import { Textarea } from './ui/textarea.jsx'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip.jsx'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu.jsx'
import { Separator } from './ui/separator.jsx'
import { Alert, AlertDescription } from './ui/alert.jsx'
import { cn } from '../lib/utils.js'
import useWorkflowStore from '../store/workflowStore.js'
import { useToast } from './ui/use-toast.jsx'
import useRunnerSession from '../hooks/useRunnerSession.js'

// WorkflowRunner v2 interfaces
interface WorkflowRunnerProps {
  workflowId: string
  runId?: string
  workflow?: any
  initialRun?: any
  onComplete?: (runId: string, shareToken?: string) => void
  className?: string
}

export default function WorkflowRunner({ 
  workflowId, 
  runId, 
  workflow, 
  initialRun,
  onComplete,
  className 
}: WorkflowRunnerProps) {
  const { toast } = useToast()
  
  // Store state
  const {
    currentRun,
    steps,
    isLoading,
    error,
    isAutoSaving,
    lastSavedAt,
    hasUnsavedChanges,
    currentStepIndex,
    expandedSteps,
    viewMode,
    canUndo,
    canRedo,
    
    // Actions
    createRun,
    loadRun,
    startRun,
    pauseRun,
    completeRun,
    updateStepStatus,
    updateStepNotes,
    toggleStepExpanded,
    toggleStepCheck,
    setCurrentStep,
    saveRun,
    undo,
    redo,
    generateShareToken,
    resetState
  } = useWorkflowStore()

  // Local state
  const [noteInputs, setNoteInputs] = useState({})
  const [shareUrl, setShareUrl] = useState(null)
  const [showSessionManager, setShowSessionManager] = useState(false)

  // Session management
  const {
    sessionId,
    sessionKey,
    isActive: isSessionActive,
    availableSessions,
    isLoadingSessions,
    save: saveSession,
    resume: resumeSession,
    pause: pauseSession,
    complete: completeSession,
    refreshSessions,
    hasActiveSession,
    isRecoverable
  } = useRunnerSession(runId || currentRun?.id, {
    autoSave: true,
    resumeOnMount: true,
    saveOnUnload: true,
    sessionName: workflow?.title
  })

  // Initialize run
  useEffect(() => {
    if (runId) {
      loadRun(runId)
    } else if (workflow && !currentRun) {
      createRun(
        workflowId, 
        workflow.title, 
        workflow.description,
        workflow
      ).catch(console.error)
    }

    return () => {
      resetState()
    }
  }, [runId, workflowId, workflow])

  // Auto-save indicator
  const formatLastSaved = useCallback(() => {
    if (!lastSavedAt) return '저장된 적 없음'
    const date = new Date(lastSavedAt)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins === 0) return '방금 저장됨'
    if (diffMins < 60) return `${diffMins}분 전 저장됨`
    return date.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }, [lastSavedAt])

  // Step actions
  const handleStepComplete = async (stepId) => {
    const step = steps.find(s => s.id === stepId)
    if (!step) return

    const newStatus = step.status === 'completed' ? 'pending' : 'completed'
    const success = await updateStepStatus(stepId, newStatus)
    
    if (success) {
      toast({
        title: newStatus === 'completed' ? '단계 완료' : '완료 취소',
        description: `"${step.step_title}" ${newStatus === 'completed' ? '완료' : '미완료'}로 변경되었습니다.`
      })

      // Auto-advance to next step
      if (newStatus === 'completed') {
        const nextStep = steps.find(s => s.step_number === step.step_number + 1)
        if (nextStep) {
          setCurrentStep(nextStep.step_number - 1)
        }
      }
    }
  }

  const handleNoteUpdate = async (stepId) => {
    const notes = noteInputs[stepId]
    if (!notes?.trim()) return

    const success = await updateStepNotes(stepId, notes.trim())
    if (success) {
      setNoteInputs(prev => ({ ...prev, [stepId]: '' }))
      toast({
        title: '메모 추가됨',
        description: '단계에 메모가 성공적으로 추가되었습니다.'
      })
    }
  }

  const handleCopyStep = async (step) => {
    const textToCopy = `
단계 ${step.step_number}: ${step.step_title}
도구: ${step.step_config?.tool_name || '없음'}
설명: ${step.step_description || '설명 없음'}
${step.notes ? `메모: ${step.notes}` : ''}
${step.output_data ? `결과: ${JSON.stringify(step.output_data, null, 2)}` : ''}
    `.trim()

    try {
      await navigator.clipboard.writeText(textToCopy)
      toast({
        title: '복사 완료',
        description: '단계 정보가 클립보드에 복사되었습니다.'
      })
    } catch (error) {
      toast({
        title: '복사 실패',
        description: '클립보드 복사에 실패했습니다.',
        variant: 'destructive'
      })
    }
  }

  const handleOpenTool = (step) => {
    const toolName = step.step_config?.tool_name
    if (!toolName) return

    // Simple URL mapping - in real app, this would be more sophisticated
    const toolUrls = {
      'ChatGPT': 'https://chat.openai.com',
      'Claude': 'https://claude.ai',
      'Midjourney': 'https://www.midjourney.com',
      'Copy.ai': 'https://www.copy.ai',
      'Jasper': 'https://www.jasper.ai'
    }

    const url = toolUrls[toolName] || `https://www.google.com/search?q=${encodeURIComponent(toolName)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleShare = async () => {
    if (!currentRun) return

    try {
      const token = await generateShareToken()
      if (token) {
        const url = `${window.location.origin}/share/${token}`
        setShareUrl(url)
        
        await navigator.clipboard.writeText(url)
        toast({
          title: '공유 링크 생성됨',
          description: '링크가 클립보드에 복사되었습니다.'
        })
      }
    } catch (error) {
      toast({
        title: '공유 실패',
        description: '공유 링크 생성에 실패했습니다.',
        variant: 'destructive'
      })
    }
  }

  const handleRunComplete = async () => {
    if (!currentRun) return false

    const success = await completeRun()
    if (success) {
      toast({
        title: '워크플로우 완료!',
        description: '모든 단계가 성공적으로 완료되었습니다.'
      })

      if (onComplete) {
        onComplete(currentRun.id, currentRun.share_token)
      }
    }
    
    return success
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">워크플로우 로딩 중...</span>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          오류가 발생했습니다: {error}
        </AlertDescription>
      </Alert>
    )
  }

  // No run state
  if (!currentRun) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600">워크플로우를 로드할 수 없습니다.</p>
      </div>
    )
  }

  const progress = steps.length > 0 ? Math.round((steps.filter(s => s.status === 'completed').length / steps.length) * 100) : 0
  const completedSteps = steps.filter(s => s.status === 'completed').length

  return (
    <TooltipProvider>
      <div className={cn("max-w-4xl mx-auto p-4 space-y-6", className)}>
        {/* Header with progress */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold">{currentRun.title}</CardTitle>
                {currentRun.description && (
                  <p className="text-gray-600 mt-1">{currentRun.description}</p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {/* Run controls */}
                {currentRun.status === 'draft' && (
                  <Button onClick={startRun} size="sm">
                    <Play className="w-4 h-4 mr-1" />
                    시작
                  </Button>
                )}
                {currentRun.status === 'running' && (
                  <Button onClick={pauseRun} variant="outline" size="sm">
                    <Pause className="w-4 h-4 mr-1" />
                    일시정지
                  </Button>
                )}
                {currentRun.status === 'paused' && (
                  <Button onClick={startRun} size="sm">
                    <Play className="w-4 h-4 mr-1" />
                    재시작
                  </Button>
                )}

                {/* Action buttons */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={undo}
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
                      onClick={redo}
                      disabled={!canRedo}
                    >
                      <Redo className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>다시 실행</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={saveSession}
                      disabled={isAutoSaving || !hasUnsavedChanges || !hasActiveSession}
                    >
                      {isAutoSaving ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>세션 저장</TooltipContent>
                </Tooltip>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <History className="w-4 h-4 mr-1" />
                      세션
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={() => setShowSessionManager(true)}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      세션 관리
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={saveSession}
                      disabled={!hasActiveSession}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      수동 저장
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => pauseSession('User pause')}
                      disabled={!hasActiveSession}
                    >
                      <Pause className="w-4 h-4 mr-2" />
                      세션 일시정지
                    </DropdownMenuItem>
                    <Separator />
                    <DropdownMenuItem 
                      onClick={refreshSessions}
                      disabled={isLoadingSessions}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {isLoadingSessions ? '로딩 중...' : '세션 새로고침'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button onClick={handleShare} variant="outline" size="sm">
                  <Share2 className="w-4 h-4 mr-1" />
                  공유
                </Button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>{completedSteps}/{steps.length} 단계 완료</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>

            {/* Status indicators */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4">
                <Badge variant={
                  currentRun.status === 'completed' ? 'default' :
                  currentRun.status === 'running' ? 'secondary' :
                  currentRun.status === 'paused' ? 'outline' : 'destructive'
                }>
                  {currentRun.status === 'draft' && '준비'}
                  {currentRun.status === 'running' && '진행 중'}
                  {currentRun.status === 'paused' && '일시정지'}
                  {currentRun.status === 'completed' && '완료'}
                  {currentRun.status === 'failed' && '실패'}
                </Badge>
                
                {currentRun.status === 'running' && (
                  <div className="flex items-center text-green-600">
                    <Timer className="w-3 h-3 mr-1" />
                    <span>진행 중</span>
                  </div>
                )}
              </div>

              <div className="text-gray-500 flex items-center space-x-4">
                {hasActiveSession && (
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-xs">세션 활성</span>
                  </div>
                )}
                
                {isAutoSaving ? (
                  <span className="flex items-center">
                    <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600 mr-1" />
                    저장 중...
                  </span>
                ) : (
                  <span>{formatLastSaved()}</span>
                )}
                
                {sessionKey && (
                  <span className="text-xs text-blue-600 font-mono">
                    {sessionKey.slice(-8)}
                  </span>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Steps timeline */}
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
                  onToggleExpanded={() => toggleStepExpanded(step.id)}
                  onToggleComplete={() => handleStepComplete(step.id)}
                  onToggleCheck={() => toggleStepCheck(step.id)}
                  onNoteChange={(value) => setNoteInputs(prev => ({ ...prev, [step.id]: value }))}
                  onNoteSubmit={() => handleNoteUpdate(step.id)}
                  onCopy={() => handleCopyStep(step)}
                  onOpenTool={() => handleOpenTool(step)}
                  onSetActive={() => setCurrentStep(index)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Session Manager Modal */}
        {showSessionManager && (
          <SessionManagerModal
            isOpen={showSessionManager}
            onClose={() => setShowSessionManager(false)}
            availableSessions={availableSessions}
            currentSessionId={sessionId}
            onResumeSession={resumeSession}
            onRefreshSessions={refreshSessions}
            isLoading={isLoadingSessions}
          />
        )}

        {/* Complete workflow button */}
        {completedSteps === steps.length && currentRun.status !== 'completed' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center pt-6"
          >
            <Button 
              onClick={async () => {
                const success = await handleRunComplete()
                if (success && hasActiveSession) {
                  await completeSession()
                }
              }} 
              size="lg" 
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle2 className="w-5 h-5 mr-2" />
              워크플로우 완료하기
            </Button>
          </motion.div>
        )}
      </div>
    </TooltipProvider>
  )
}

// Session Manager Modal Component
function SessionManagerModal({ 
  isOpen, 
  onClose, 
  availableSessions, 
  currentSessionId, 
  onResumeSession, 
  onRefreshSessions,
  isLoading 
}) {
  const { toast } = useToast()
  
  const handleResumeSession = async (sessionKey) => {
    try {
      await onResumeSession(sessionKey)
      onClose()
      toast({
        title: '세션 복원됨',
        description: '이전 작업을 계속할 수 있습니다.'
      })
    } catch (error) {
      toast({
        title: '세션 복원 실패',
        description: error.message || '세션을 복원할 수 없습니다.',
        variant: 'destructive'
      })
    }
  }

  const formatSessionTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return '방금 전'
    if (diffMins < 60) return `${diffMins}분 전`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}시간 전`
    return `${Math.floor(diffMins / 1440)}일 전`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-96 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">세션 관리</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">사용 가능한 세션</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRefreshSessions}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600" />
              ) : (
                <RefreshCw className="w-3 h-3" />
              )}
            </Button>
          </div>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {availableSessions.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                사용 가능한 세션이 없습니다.
              </p>
            ) : (
              availableSessions.map((session) => (
                <div 
                  key={session.session_id}
                  className={cn(
                    "p-3 border rounded-lg cursor-pointer hover:bg-gray-50",
                    session.session_id === currentSessionId && "border-blue-500 bg-blue-50"
                  )}
                  onClick={() => handleResumeSession(session.session_key)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium truncate">
                        {session.session_name || session.run_title}
                      </h4>
                      <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                        <Badge variant={session.status === 'active' ? 'default' : 'secondary'}>
                          {session.status}
                        </Badge>
                        <span>{formatSessionTime(session.last_activity_at)}</span>
                        <span>{session.progress}% 완료</span>
                      </div>
                    </div>
                    
                    {session.session_id === currentSessionId && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full ml-2" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="pt-4 border-t">
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={onClose}
            >
              닫기
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Step card component
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
}) {
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
            {/* Step number and status */}
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center text-sm font-semibold">
                {index + 1}
              </div>
              <div className="mt-2">
                {statusIcons[step.status]}
              </div>
            </div>

            {/* Step content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-gray-900 truncate">
                  {step.step_title}
                </h3>
                {step.step_config?.tool_name && (
                  <Badge variant="outline" className="text-xs">
                    {step.step_config.tool_name}
                  </Badge>
                )}
                {step.step_config?.difficulty && (
                  <Badge 
                    variant={
                      step.step_config.difficulty === 'easy' ? 'secondary' :
                      step.step_config.difficulty === 'medium' ? 'default' : 'destructive'
                    }
                    className="text-xs"
                  >
                    {step.step_config.difficulty}
                  </Badge>
                )}
              </div>
              
              {step.step_description && (
                <p className="text-gray-600 mt-1 text-sm line-clamp-2">
                  {step.step_description}
                </p>
              )}

              {step.step_config?.estimated_time && (
                <div className="flex items-center text-xs text-gray-500 mt-1">
                  <Clock className="w-3 h-3 mr-1" />
                  예상 시간: {step.step_config.estimated_time}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
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
                    step.is_checked && "text-green-600"
                  )}
                >
                  <CheckCircle2 className={cn(
                    "w-4 h-4",
                    step.is_checked ? "fill-current" : ""
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
                {step.step_config?.tool_name && (
                  <DropdownMenuItem onClick={onOpenTool}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    도구 열기
                  </DropdownMenuItem>
                )}
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
              
              {/* Existing notes */}
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

              {/* Add note */}
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

              {/* Output data */}
              {step.output_data && Object.keys(step.output_data).length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">결과</h4>
                  <pre className="bg-gray-50 border rounded p-3 text-xs overflow-x-auto">
                    {JSON.stringify(step.output_data, null, 2)}
                  </pre>
                </div>
              )}

              {/* Timing info */}
              {(step.started_at || step.completed_at) && (
                <div className="mt-4 text-xs text-gray-500 space-y-1">
                  {step.started_at && (
                    <div>시작: {new Date(step.started_at).toLocaleString('ko-KR')}</div>
                  )}
                  {step.completed_at && (
                    <div>완료: {new Date(step.completed_at).toLocaleString('ko-KR')}</div>
                  )}
                  {step.actual_time_spent && (
                    <div>소요 시간: {Math.round(step.actual_time_spent / 60)}분</div>
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

