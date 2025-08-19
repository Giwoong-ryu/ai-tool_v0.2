// EasyPick 사이드 패널 v2
// 목적: 우측 고정 미리보기, 모바일 모달, 실시간 컴파일, 변경 하이라이트
// ARIA 완전 지원, 접근성 최적화

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Copy, 
  Save, 
  Play, 
  Pause, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  Maximize2, 
  Minimize2,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Clock,
  Zap
} from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Switch } from './ui/switch'
import { Progress } from './ui/progress'
import { Alert, AlertDescription } from './ui/alert'
import { Separator } from './ui/separator'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from './ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { cn } from '../lib/utils'
import { track } from '../lib/analytics'
import useAuthStore from '../store/authStore'

// Types
interface SideSheetProps {
  isOpen: boolean
  onClose: () => void
  item?: {
    id: string
    title: string
    type: 'tool' | 'template' | 'workflow'
    description?: string
    category?: string
    template?: string
    fields?: FieldConfig[]
    preview?: string
  }
  className?: string
}

interface FieldConfig {
  id: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'number'
  placeholder?: string
  required?: boolean
  options?: string[]
  defaultValue?: string
  description?: string
}

interface FormData {
  [key: string]: string | number
}

interface CompileResult {
  success: boolean
  content: string
  error?: string
  metadata?: {
    characterCount: number
    wordCount: number
    estimatedTokens: number
  }
}

// 미디어 쿼리 훅
const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(false)
  
  useEffect(() => {
    const media = window.matchMedia(query)
    setMatches(media.matches)
    
    const listener = () => setMatches(media.matches)
    media.addListener(listener)
    return () => media.removeListener(listener)
  }, [query])
  
  return matches
}

// 디바운스 훅
const useDebounced = <T,>(value: T, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value)
  
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  
  return debouncedValue
}

export default function SideSheetV2({ isOpen, onClose, item, className }: SideSheetProps) {
  // State
  const [formData, setFormData] = useState<FormData>({})
  const [isCompiling, setIsCompiling] = useState(false)
  const [compiledResult, setCompiledResult] = useState<CompileResult | null>(null)
  const [isAutoCompile, setIsAutoCompile] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)
  const [changedFields, setChangedFields] = useState<Set<string>>(new Set())
  const [lastCompileTime, setLastCompileTime] = useState<Date | null>(null)
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form')
  const [isLivePreview, setIsLivePreview] = useState(true)

  // Refs
  const sheetContentRef = useRef<HTMLDivElement>(null)
  const liveRegionRef = useRef<HTMLDivElement>(null)
  const firstInputRef = useRef<HTMLInputElement>(null)

  // Hooks
  const isMobile = useMediaQuery('(max-width: 768px)')
  const { checkPermission, executeWithGuard } = useAuthStore()
  const debouncedFormData = useDebounced(formData, 500)

  // 폼 필드 기본값 설정
  const defaultFields: FieldConfig[] = useMemo(() => [
    {
      id: 'goal',
      label: '목표',
      type: 'text',
      placeholder: '예: 매력적인 블로그 글 작성',
      required: true,
      description: '작업의 목표를 명확하게 입력하세요'
    },
    {
      id: 'tone',
      label: '톤 앤 매너',
      type: 'select',
      options: ['친근한', '전문적인', '유머러스한', '진지한', '캐주얼한'],
      defaultValue: '친근한',
      description: '원하는 글의 톤을 선택하세요'
    },
    {
      id: 'length',
      label: '분량',
      type: 'text',
      placeholder: '예: 1,000자 또는 10분 분량',
      description: '원하는 콘텐츠 분량을 입력하세요'
    },
    {
      id: 'target',
      label: '타겟 독자',
      type: 'text',
      placeholder: '예: 20-30대 직장인',
      description: '주요 타겟 독자층을 입력하세요'
    },
    {
      id: 'context',
      label: '추가 맥락',
      type: 'textarea',
      placeholder: '추가적인 요구사항이나 배경 정보를 입력하세요',
      description: '더 정확한 결과를 위한 추가 정보'
    }
  ], [])

  const fields = item?.fields || defaultFields

  // 초기 폼 데이터 설정
  useEffect(() => {
    if (item && isOpen) {
      const initialData: FormData = {}
      fields.forEach(field => {
        if (field.defaultValue) {
          initialData[field.id] = field.defaultValue
        }
      })
      setFormData(initialData)
      setChangedFields(new Set())
      setCompiledResult(null)
      
      // 첫 번째 입력 필드에 포커스
      setTimeout(() => {
        firstInputRef.current?.focus()
      }, 100)
    }
  }, [item, isOpen, fields])

  // 실시간 컴파일
  useEffect(() => {
    if (isAutoCompile && isLivePreview && Object.keys(debouncedFormData).length > 0) {
      handleCompile(true)
    }
  }, [debouncedFormData, isAutoCompile, isLivePreview])

  // 라이브 리전 업데이트
  const updateLiveRegion = useCallback((message: string) => {
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = message
    }
  }, [])

  // 폼 데이터 변경 처리
  const handleFieldChange = useCallback((fieldId: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }))
    setChangedFields(prev => new Set([...prev, fieldId]))
    
    // 변경 사항 알림
    updateLiveRegion(`${fields.find(f => f.id === fieldId)?.label} 필드가 변경되었습니다`)
  }, [fields, updateLiveRegion])

  // 컴파일 처리
  const handleCompile = useCallback(async (isBackground = false) => {
    if (!item || isCompiling) return

    // 필수 필드 검증
    const requiredFields = fields.filter(f => f.required)
    const missingFields = requiredFields.filter(f => !formData[f.id])
    
    if (missingFields.length > 0 && !isBackground) {
      updateLiveRegion(`필수 필드를 입력해주세요: ${missingFields.map(f => f.label).join(', ')}`)
      return
    }

    setIsCompiling(true)
    if (!isBackground) {
      updateLiveRegion('컴파일을 시작합니다')
    }

    try {
      // 권한 확인
      const permission = await checkPermission('compile')
      if (!permission.allowed) {
        throw new Error('컴파일 권한이 없습니다. 업그레이드가 필요합니다.')
      }

      // 프롬프트 생성 (실제로는 API 호출)
      const prompt = generatePrompt(item, formData)
      
      // 가상의 컴파일 결과 (실제로는 AI API 호출)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const result: CompileResult = {
        success: true,
        content: prompt,
        metadata: {
          characterCount: prompt.length,
          wordCount: prompt.split(' ').length,
          estimatedTokens: Math.ceil(prompt.length / 4)
        }
      }

      setCompiledResult(result)
      setLastCompileTime(new Date())
      setChangedFields(new Set())

      if (!isBackground) {
        updateLiveRegion('컴파일이 완료되었습니다')
      }

      // 분석 추적
      await track('compile_prompt', {
        prompt_id: `${item.id}_${Date.now()}`,
        template_id: item.id,
        model_type: 'gpt-4',
        prompt_length: result.metadata?.characterCount || 0,
        success: result.success
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '컴파일 중 오류가 발생했습니다'
      setCompiledResult({
        success: false,
        content: '',
        error: errorMessage
      })
      updateLiveRegion(`컴파일 실패: ${errorMessage}`)
    } finally {
      setIsCompiling(false)
    }
  }, [item, formData, fields, isCompiling, checkPermission, updateLiveRegion])

  // 프롬프트 생성 함수
  const generatePrompt = useCallback((item: any, data: FormData): string => {
    const template = item.template || `
당신은 전문적인 ${item.type === 'tool' ? 'AI 어시스턴트' : '콘텐츠 작성자'}입니다.

목표: {goal}
톤 앤 매너: {tone}
분량: {length}
타겟 독자: {target}

추가 맥락:
{context}

위 조건에 맞춰 ${item.title}을/를 작성해주세요.
`

    let result = template
    Object.entries(data).forEach(([key, value]) => {
      result = result.replace(new RegExp(`{${key}}`, 'g'), String(value || ''))
    })

    return result.trim()
  }, [])

  // 복사 처리
  const handleCopy = useCallback(async () => {
    if (!compiledResult?.content) return

    try {
      await navigator.clipboard.writeText(compiledResult.content)
      updateLiveRegion('클립보드에 복사되었습니다')
      
      await track('tool_interaction', {
        tool_id: item?.id || 'unknown',
        action_type: 'copy',
        category: 'content'
      })
    } catch (error) {
      updateLiveRegion('복사에 실패했습니다')
    }
  }, [compiledResult, item, updateLiveRegion])

  // 저장 처리
  const handleSave = useCallback(async () => {
    if (!compiledResult?.content || !item) return

    try {
      // 실제로는 API 호출로 저장
      updateLiveRegion('저장되었습니다')
      
      await track('tool_interaction', {
        tool_id: item.id,
        action_type: 'save',
        category: 'content'
      })
    } catch (error) {
      updateLiveRegion('저장에 실패했습니다')
    }
  }, [compiledResult, item, updateLiveRegion])

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'Enter':
            e.preventDefault()
            handleCompile()
            break
          case 's':
            e.preventDefault()
            handleSave()
            break
          case 'c':
            if (e.shiftKey) {
              e.preventDefault()
              handleCopy()
            }
            break
        }
      }

      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleCompile, handleSave, handleCopy, onClose])

  if (!item) return null

  const sheetContent = (
    <div 
      ref={sheetContentRef}
      className="h-full flex flex-col"
    >
      {/* 라이브 리전 (스크린 리더용) */}
      <div
        ref={liveRegionRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      {/* 헤더 */}
      <div className="flex items-center justify-between p-6 border-b">
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            {item.type === 'template' && <Sparkles className="w-5 h-5 text-green-600" />}
            {item.title}
          </h2>
          {item.description && (
            <p className="text-sm text-gray-600 mt-1">{item.description}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline">{item.category}</Badge>
            {item.type && (
              <Badge variant="secondary">{item.type}</Badge>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* <mark>Step 4: 미리보기 하이라이트 개선 - 실시간 프리뷰 토글</mark> */}
          <div className="flex items-center gap-2">
            <Label htmlFor="live-preview" className="text-sm">
              실시간
            </Label>
            <Switch
              id="live-preview"
              checked={isLivePreview}
              onCheckedChange={setIsLivePreview}
              aria-label="실시간 미리보기 토글"
            />
          </div>

          {/* 자동 컴파일 토글 */}
          <div className="flex items-center gap-2">
            <Label htmlFor="auto-compile" className="text-sm">
              자동
            </Label>
            <Switch
              id="auto-compile"
              checked={isAutoCompile}
              onCheckedChange={setIsAutoCompile}
              aria-label="자동 컴파일 토글"
            />
          </div>

          {!isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              aria-label={isExpanded ? "축소" : "확대"}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          )}

          <Button variant="ghost" size="sm" onClick={onClose} aria-label="닫기">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'form' | 'preview')} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2 mx-6 mt-4">
          <TabsTrigger value="form">설정</TabsTrigger>
          <TabsTrigger value="preview" disabled={!compiledResult}>
            미리보기
            {isCompiling && <Clock className="w-3 h-3 ml-1 animate-spin" />}
          </TabsTrigger>
        </TabsList>

        {/* 폼 탭 */}
        <TabsContent value="form" className="flex-1 px-6 py-4 space-y-6 overflow-y-auto">
          {fields.map((field, index) => (
            <div key={field.id} className="space-y-2">
              <Label 
                htmlFor={field.id}
                className={cn(
                  "text-sm font-medium",
                  field.required && "after:content-['*'] after:text-red-500 after:ml-1"
                )}
              >
                {field.label}
                {/* <mark>Step 4: 미리보기 하이라이트 개선 - 변경된 필드 표시</mark> */}
                {changedFields.has(field.id) && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="ml-2 inline-flex items-center"
                    aria-live="polite"
                    aria-label="필드가 변경됨"
                  >
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  </motion.span>
                )}
              </Label>
              
              {field.description && (
                <p className="text-xs text-gray-500">{field.description}</p>
              )}

              {field.type === 'text' && (
                <Input
                  id={field.id}
                  ref={index === 0 ? firstInputRef : undefined}
                  value={formData[field.id] || ''}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  placeholder={field.placeholder}
                  required={field.required}
                  aria-describedby={field.description ? `${field.id}-desc` : undefined}
                  className={cn(
                    /* <mark>Step 4: 미리보기 하이라이트 개선 - 입력 필드 강조</mark> */
                    changedFields.has(field.id) && "ring-2 ring-blue-200 border-blue-400 bg-blue-50/50 transition-all duration-200"
                  )}
                />
              )}

              {field.type === 'textarea' && (
                <Textarea
                  id={field.id}
                  value={formData[field.id] || ''}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  placeholder={field.placeholder}
                  required={field.required}
                  rows={3}
                  aria-describedby={field.description ? `${field.id}-desc` : undefined}
                  className={cn(
                    /* <mark>Step 4: 미리보기 하이라이트 개선 - 입력 필드 강조</mark> */
                    changedFields.has(field.id) && "ring-2 ring-blue-200 border-blue-400 bg-blue-50/50 transition-all duration-200"
                  )}
                />
              )}

              {field.type === 'select' && field.options && (
                <Select
                  value={formData[field.id] as string || ''}
                  onValueChange={(value) => handleFieldChange(field.id, value)}
                >
                  <SelectTrigger 
                    className={cn(
                      changedFields.has(field.id) && "ring-2 ring-blue-200 border-blue-400"
                    )}
                  >
                    <SelectValue placeholder={field.placeholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {field.type === 'number' && (
                <Input
                  id={field.id}
                  type="number"
                  value={formData[field.id] || ''}
                  onChange={(e) => handleFieldChange(field.id, Number(e.target.value))}
                  placeholder={field.placeholder}
                  required={field.required}
                  aria-describedby={field.description ? `${field.id}-desc` : undefined}
                  className={cn(
                    /* <mark>Step 4: 미리보기 하이라이트 개선 - 입력 필드 강조</mark> */
                    changedFields.has(field.id) && "ring-2 ring-blue-200 border-blue-400 bg-blue-50/50 transition-all duration-200"
                  )}
                />
              )}
            </div>
          ))}

          {/* 컴파일 버튼 */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={() => handleCompile()}
              disabled={isCompiling}
              className="flex-1"
            >
              {isCompiling ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  컴파일 중...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  컴파일
                </>
              )}
            </Button>
          </div>
        </TabsContent>

        {/* 미리보기 탭 */}
        <TabsContent value="preview" className="flex-1 px-6 py-4 overflow-y-auto">
          {compiledResult ? (
            <div className="space-y-4">
              {/* 상태 표시 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {compiledResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span className="text-sm text-gray-600">
                    {lastCompileTime && `${lastCompileTime.toLocaleTimeString()} 컴파일`}
                  </span>
                </div>
                
                {compiledResult.metadata && (
                  <div className="text-xs text-gray-500">
                    {compiledResult.metadata.characterCount}자 • {compiledResult.metadata.wordCount}단어
                  </div>
                )}
              </div>

              {compiledResult.success ? (
                <Card>
                  <CardContent className="p-4">
                    <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                      {compiledResult.content}
                    </pre>
                  </CardContent>
                </Card>
              ) : (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {compiledResult.error}
                  </AlertDescription>
                </Alert>
              )}

              {/* 액션 버튼 */}
              {compiledResult.success && (
                <div className="flex gap-2">
                  <Button onClick={handleCopy} variant="outline" className="flex-1">
                    <Copy className="w-4 h-4 mr-2" />
                    복사
                  </Button>
                  <Button onClick={handleSave} variant="outline" className="flex-1">
                    <Save className="w-4 h-4 mr-2" />
                    저장
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>먼저 설정 탭에서 컴파일을 진행해주세요</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )

  // 모바일에서는 Sheet 사용, 데스크톱에서는 고정 사이드바
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="bottom" className="h-[90vh]">
          {sheetContent}
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 배경 오버레이 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-40"
            onClick={onClose}
          />
          
          {/* 사이드 패널 */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={cn(
              "fixed top-0 right-0 h-screen bg-white shadow-xl z-50 border-l",
              isExpanded ? "w-2/3" : "w-1/3",
              className
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby="sidesheet-title"
          >
            {sheetContent}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}