// src/pages/share/[token].tsx
import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertCircle, 
  Share2, 
  Copy, 
  ExternalLink,
  StickyNote,
  Timer,
  ArrowLeft,
  Calendar,
  User,
  BarChart3
} from 'lucide-react'
import { Button } from '../../components/ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card.jsx'
import { Badge } from '../../components/ui/badge.jsx'
import { Progress } from '../../components/ui/progress.jsx'
import { Separator } from '../../components/ui/separator.jsx'
import { Alert, AlertDescription } from '../../components/ui/alert.jsx'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui/tooltip.jsx'
import { cn } from '../../lib/utils.js'
import { supabase } from '../../lib/supabase.js'
import { useToast } from '../../components/ui/use-toast.jsx'

interface SharedRunData {
  id: string
  workflow_id: string
  title: string
  description?: string
  status: string
  progress: number
  total_steps: number
  completed_steps: number
  created_at: string
  completed_at?: string
  actual_completion_time?: number
  workflow_snapshot?: any
  is_completed: boolean
  completion_rate: number
}

interface SharedStep {
  id: string
  step_number: number
  step_title: string
  step_type: 'manual' | 'instruction' | 'generator'
  step_description?: string
  status: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'failed'
  is_checked: boolean
  notes?: string
  output_data?: any
  step_config?: any
  started_at?: string
  completed_at?: string
  actual_time_spent?: number
}

export default function SharedWorkflowPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [runData, setRunData] = useState<SharedRunData | null>(null)
  const [steps, setSteps] = useState<SharedStep[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!token) {
      setError('유효하지 않은 공유 링크입니다.')
      setIsLoading(false)
      return
    }

    loadSharedRun()
  }, [token])

  const loadSharedRun = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Get shared run data
      const { data: runResponse, error: runError } = await supabase
        .rpc('get_shared_run', { token })

      if (runError) {
        throw new Error(runError.message)
      }

      if (!runResponse || runResponse.length === 0) {
        throw new Error('공유된 워크플로우를 찾을 수 없습니다.')
      }

      const sharedRun = runResponse[0].run_data
      setRunData(sharedRun)

      // Get shared steps
      const { data: stepsData, error: stepsError } = await supabase
        .from('workflow_run_steps')
        .select('*')
        .eq('run_id', sharedRun.id)
        .order('step_number')

      if (stepsError) {
        throw new Error(stepsError.message)
      }

      setSteps(stepsData || [])

    } catch (error) {
      console.error('Load shared run error:', error)
      setError(error.message || '워크플로우를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast({
        title: '링크 복사됨',
        description: '공유 링크가 클립보드에 복사되었습니다.'
      })
    } catch (error) {
      toast({
        title: '복사 실패',
        description: '링크 복사에 실패했습니다.',
        variant: 'destructive'
      })
    }
  }

  const handleCopyStep = async (step: SharedStep) => {
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

  const toggleStepExpanded = (stepId: string) => {
    setExpandedSteps(prev => {
      const newSet = new Set(prev)
      if (newSet.has(stepId)) {
        newSet.delete(stepId)
      } else {
        newSet.add(stepId)
      }
      return newSet
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}시간 ${minutes}분`
    }
    return `${minutes}분`
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">공유된 워크플로우를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !runData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="mt-2">
              {error || '워크플로우를 찾을 수 없습니다.'}
            </AlertDescription>
          </Alert>
          <div className="mt-4 text-center">
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="mt-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              홈으로 돌아가기
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const completedSteps = steps.filter(s => s.status === 'completed').length
  const totalTime = runData.actual_completion_time

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate('/')}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  홈으로
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    공유된 워크플로우
                  </h1>
                  <p className="text-gray-600 text-sm">
                    읽기 전용 · 실시간 동기화 불가
                  </p>
                </div>
              </div>
              <Button onClick={handleCopyUrl} variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                링크 복사
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto p-4 space-y-6">
          {/* Run Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-xl font-bold">{runData.title}</CardTitle>
                  {runData.description && (
                    <p className="text-gray-600 mt-2">{runData.description}</p>
                  )}
                </div>
                <Badge variant={
                  runData.status === 'completed' ? 'default' :
                  runData.status === 'running' ? 'secondary' :
                  runData.status === 'paused' ? 'outline' : 'destructive'
                }>
                  {runData.status === 'draft' && '준비'}
                  {runData.status === 'running' && '진행 중'}
                  {runData.status === 'paused' && '일시정지'}
                  {runData.status === 'completed' && '완료'}
                  {runData.status === 'failed' && '실패'}
                </Badge>
              </div>

              {/* Progress */}
              <div className="space-y-3 mt-4">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{completedSteps}/{steps.length} 단계 완료</span>
                  <span>{Math.round(runData.completion_rate)}%</span>
                </div>
                <Progress value={runData.completion_rate} className="w-full" />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="flex items-center space-x-3 text-sm">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-gray-500">시작일</p>
                    <p className="font-medium">{formatDate(runData.created_at)}</p>
                  </div>
                </div>

                {runData.completed_at && (
                  <div className="flex items-center space-x-3 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <div>
                      <p className="text-gray-500">완료일</p>
                      <p className="font-medium">{formatDate(runData.completed_at)}</p>
                    </div>
                  </div>
                )}

                {totalTime && (
                  <div className="flex items-center space-x-3 text-sm">
                    <Timer className="w-4 h-4 text-blue-500" />
                    <div>
                      <p className="text-gray-500">총 소요시간</p>
                      <p className="font-medium">{formatDuration(totalTime)}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>
          </Card>

          {/* Steps Timeline */}
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {steps.map((step, index) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <SharedStepCard
                    step={step}
                    index={index}
                    isExpanded={expandedSteps.has(step.id)}
                    onToggleExpanded={() => toggleStepExpanded(step.id)}
                    onCopy={() => handleCopyStep(step)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <Card>
            <CardContent className="py-4">
              <div className="text-center text-sm text-gray-500">
                <p>이 워크플로우는 EasyPick에서 공유되었습니다.</p>
                <p className="mt-1">
                  자신만의 워크플로우를 만들어보세요! 
                  <Button variant="link" size="sm" onClick={() => navigate('/')}>
                    시작하기
                  </Button>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  )
}

// Shared step card component (read-only)
function SharedStepCard({
  step,
  index,
  isExpanded,
  onToggleExpanded,
  onCopy
}: {
  step: SharedStep
  index: number
  isExpanded: boolean
  onToggleExpanded: () => void
  onCopy: () => void
}) {
  const statusIcons = {
    pending: <Circle className="w-5 h-5 text-gray-400" />,
    in_progress: <Clock className="w-5 h-5 text-blue-500" />,
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
      'hover:shadow-md'
    )}>
      <CardHeader className="pb-3">
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
                {step.is_checked && (
                  <Badge variant="outline" className="text-xs text-green-600">
                    ✓ 체크됨
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
                  onClick={onCopy}
                  className="w-8 h-8 p-0"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>복사</TooltipContent>
            </Tooltip>

            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleExpanded}
              className="w-8 h-8 p-0"
            >
              {isExpanded ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
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
              
              {/* Notes */}
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

              {/* Output data */}
              {step.output_data && Object.keys(step.output_data).length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">결과</h4>
                  <pre className="bg-gray-50 border rounded p-3 text-xs overflow-x-auto">
                    {JSON.stringify(step.output_data, null, 2)}
                  </pre>
                </div>
              )}

              {/* Timing info */}
              {(step.started_at || step.completed_at) && (
                <div className="text-xs text-gray-500 space-y-1">
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