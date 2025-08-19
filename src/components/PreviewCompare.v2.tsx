// EasyPick 2열 미리보기 비교 컴포넌트 v2 (TypeScript)
// 목적: Simple/Advanced 2열 비교 + 클릭 교체
// Step 5: 변경 키 <mark> 하이라이트, aria-live="polite" 접근성

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Eye, 
  EyeOff, 
  Copy, 
  Check,
  ChevronLeft,
  ChevronRight,
  Settings2,
  RotateCcw,
  Diff,
  ArrowRight,
  ArrowLeftRight,
  Zap,
  AlertCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { ScrollArea } from './ui/scroll-area'
import { Separator } from './ui/separator'
import { cn } from '../lib/utils'
import { track } from '../lib/analytics'

// Types
export interface FieldChange {
  key: string
  label: string
  type: 'added' | 'modified' | 'removed'
  original: any
  modified: any
  category: 'basic' | 'content' | 'meta' | 'other'
  importance?: 'high' | 'medium' | 'low'
}

export interface TemplateSchema {
  options?: Array<{
    key: string
    label: string
    type: string
    required?: boolean
    category?: string
  }>
}

export interface PreviewCompareProps {
  originalData?: Record<string, any>
  modifiedData?: Record<string, any>
  templateSchema?: TemplateSchema | null
  onApply?: (data: Record<string, any>) => void
  onRevert?: () => void
  onFieldSelect?: (fieldKey: string, selected: boolean) => void
  className?: string
  autoSelectChanges?: boolean
  enableLiveUpdates?: boolean
}

export interface ChangeStats {
  total: number
  added: number
  modified: number
  removed: number
  selected: number
}

// 컴포넌트
export default function PreviewCompareV2({
  originalData = {},
  modifiedData = {},
  templateSchema = null,
  onApply,
  onRevert,
  onFieldSelect,
  className,
  autoSelectChanges = true,
  enableLiveUpdates = true
}: PreviewCompareProps) {
  
  // State
  const [viewMode, setViewMode] = useState<'simple' | 'advanced'>('simple')
  const [selectedChanges, setSelectedChanges] = useState<Set<string>>(new Set())
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [liveMessage, setLiveMessage] = useState<string>('')
  const [showDiff, setShowDiff] = useState<boolean>(false)
  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set())

  // 변경사항 분석
  const changes = useMemo((): FieldChange[] => {
    const changeList: FieldChange[] = []
    const allKeys = new Set([...Object.keys(originalData), ...Object.keys(modifiedData)])
    
    allKeys.forEach(key => {
      const original = originalData[key]
      const modified = modifiedData[key]
      
      if (original !== modified) {
        changeList.push({
          key,
          label: getFieldLabel(key, templateSchema),
          type: getChangeType(original, modified),
          original,
          modified,
          category: getFieldCategory(key, templateSchema),
          importance: getFieldImportance(key, templateSchema)
        })
      }
    })
    
    return changeList
  }, [originalData, modifiedData, templateSchema])

  // 변경사항 통계
  const changeStats = useMemo((): ChangeStats => {
    const stats = changes.reduce((acc, change) => {
      acc[change.type] = (acc[change.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return {
      total: changes.length,
      added: stats.added || 0,
      modified: stats.modified || 0,
      removed: stats.removed || 0,
      selected: selectedChanges.size
    }
  }, [changes, selectedChanges.size])

  // 미리보기 데이터 생성
  const previewData = useMemo(() => {
    const result = { ...originalData }
    
    changes.forEach(change => {
      if (selectedChanges.size === 0 || selectedChanges.has(change.key)) {
        if (change.type === 'removed') {
          delete result[change.key]
        } else {
          result[change.key] = change.modified
        }
      }
    })
    
    return result
  }, [originalData, changes, selectedChanges])

  // 자동 선택 처리
  useEffect(() => {
    if (autoSelectChanges && changes.length > 0) {
      // 중요도가 높은 변경사항만 자동 선택
      const importantChanges = changes.filter(c => c.importance === 'high')
      if (importantChanges.length > 0) {
        setSelectedChanges(new Set(importantChanges.map(c => c.key)))
      } else {
        setSelectedChanges(new Set(changes.map(c => c.key)))
      }
    }
  }, [changes, autoSelectChanges])

  // 라이브 메시지 업데이트
  useEffect(() => {
    if (enableLiveUpdates && changes.length > 0) {
      const message = `${changeStats.total}개의 변경사항이 감지되었습니다. ${changeStats.selected}개가 선택되었습니다.`
      setLiveMessage(message)
      
      // 3초 후 메시지 클리어
      const timer = setTimeout(() => setLiveMessage(''), 3000)
      return () => clearTimeout(timer)
    }
  }, [changes.length, changeStats, enableLiveUpdates])

  // 필드 정보 헬퍼 함수들
  const getFieldLabel = useCallback((key: string, schema?: TemplateSchema | null): string => {
    if (!schema?.options) return key
    const option = schema.options.find(opt => opt.key === key)
    return option?.label || key
  }, [])

  const getChangeType = useCallback((original: any, modified: any): 'added' | 'modified' | 'removed' => {
    if (original === undefined) return 'added'
    if (modified === undefined) return 'removed'
    return 'modified'
  }, [])

  const getFieldCategory = useCallback((key: string, schema?: TemplateSchema | null): 'basic' | 'content' | 'meta' | 'other' => {
    const basicFields = ['tone', 'length', 'style', 'target_audience']
    const contentFields = ['topic', 'subject', 'content', 'keywords']
    const metaFields = ['company', 'recipient', 'urgency', 'call_to_action']
    
    if (basicFields.includes(key)) return 'basic'
    if (contentFields.includes(key)) return 'content'
    if (metaFields.includes(key)) return 'meta'
    return 'other'
  }, [])

  const getFieldImportance = useCallback((key: string, schema?: TemplateSchema | null): 'high' | 'medium' | 'low' => {
    const highImportance = ['topic', 'content', 'target_audience']
    const mediumImportance = ['tone', 'style', 'keywords']
    
    if (highImportance.includes(key)) return 'high'
    if (mediumImportance.includes(key)) return 'medium'
    return 'low'
  }, [])

  // 이벤트 핸들러들
  const handleCopy = useCallback(async (text: string, fieldKey: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(fieldKey)
      setLiveMessage('클립보드에 복사되었습니다')
      
      // 분석 추적
      await track('tool_interaction', {
        tool_id: 'preview_compare',
        action_type: 'copy',
        field_key: fieldKey
      })
      
      setTimeout(() => {
        setCopiedField(null)
        setLiveMessage('')
      }, 2000)
    } catch (error) {
      console.error('복사 실패:', error)
      setLiveMessage('복사에 실패했습니다')
    }
  }, [])

  const toggleChange = useCallback((changeKey: string) => {
    setSelectedChanges(prev => {
      const newSet = new Set(prev)
      const isSelected = newSet.has(changeKey)
      
      if (isSelected) {
        newSet.delete(changeKey)
      } else {
        newSet.add(changeKey)
      }
      
      // 외부 콜백 호출
      onFieldSelect?.(changeKey, !isSelected)
      
      // 라이브 메시지 업데이트
      setLiveMessage(`${changeKey} 필드가 ${isSelected ? '선택 해제' : '선택'}되었습니다`)
      
      return newSet
    })
  }, [onFieldSelect])

  const toggleAllChanges = useCallback(() => {
    const allSelected = selectedChanges.size === changes.length
    
    if (allSelected) {
      setSelectedChanges(new Set())
      setLiveMessage('모든 변경사항이 선택 해제되었습니다')
    } else {
      setSelectedChanges(new Set(changes.map(c => c.key)))
      setLiveMessage('모든 변경사항이 선택되었습니다')
    }
  }, [changes, selectedChanges.size])

  const handleApply = useCallback(async () => {
    const appliedData = { ...originalData }
    
    changes.forEach(change => {
      if (selectedChanges.size === 0 || selectedChanges.has(change.key)) {
        if (change.type === 'removed') {
          delete appliedData[change.key]
        } else {
          appliedData[change.key] = change.modified
        }
      }
    })
    
    onApply?.(appliedData)
    setLiveMessage(`${selectedChanges.size}개 변경사항이 적용되었습니다`)
    
    // 분석 추적
    await track('tool_interaction', {
      tool_id: 'preview_compare',
      action_type: 'apply_changes',
      changes_count: selectedChanges.size
    })
  }, [originalData, changes, selectedChanges, onApply])

  const handleRevert = useCallback(async () => {
    setSelectedChanges(new Set())
    onRevert?.()
    setLiveMessage('모든 변경사항이 되돌려졌습니다')
    
    // 분석 추적
    await track('tool_interaction', {
      tool_id: 'preview_compare',
      action_type: 'revert_changes'
    })
  }, [onRevert])

  // 스타일링 헬퍼
  const getChangeTypeColor = useCallback((type: string): string => {
    switch (type) {
      case 'added': return 'bg-green-100 text-green-800 border-green-200'
      case 'modified': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'removed': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }, [])

  const getCategoryColor = useCallback((category: string): string => {
    switch (category) {
      case 'basic': return 'bg-purple-100 text-purple-800'
      case 'content': return 'bg-blue-100 text-blue-800'
      case 'meta': return 'bg-gray-100 text-gray-800'
      default: return 'bg-yellow-100 text-yellow-800'
    }
  }, [])

  // 값 렌더링
  const renderValue = useCallback((value: any, maxLength = 100, isHighlighted = false) => {
    if (value === undefined || value === null) {
      return <span className="text-gray-400 italic">없음</span>
    }
    
    const stringValue = String(value)
    const displayValue = stringValue.length <= maxLength 
      ? stringValue 
      : stringValue.substring(0, maxLength) + '...'
    
    // Step 5: <mark> 하이라이트 적용
    if (isHighlighted) {
      return (
        <mark className="bg-yellow-200 px-1 rounded" aria-label="변경된 값">
          {displayValue}
        </mark>
      )
    }
    
    return <span title={stringValue}>{displayValue}</span>
  }, [])

  const toggleExpanded = useCallback((fieldKey: string) => {
    setExpandedFields(prev => {
      const newSet = new Set(prev)
      if (newSet.has(fieldKey)) {
        newSet.delete(fieldKey)
      } else {
        newSet.add(fieldKey)
      }
      return newSet
    })
  }, [])

  return (
    <div className={cn('w-full space-y-4', className)}>
      {/* Step 5: aria-live="polite" 접근성 라이브 리전 */}
      <div 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
        role="status"
        aria-label="변경사항 상태 알림"
      >
        {liveMessage}
      </div>

      {/* 헤더 */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Diff className="w-5 h-5 text-blue-600" />
            변경사항 미리보기
          </h3>
          
          {/* 변경사항 통계 */}
          <div className="flex items-center gap-2">
            {changeStats.added > 0 && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <motion.span
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  +{changeStats.added}
                </motion.span>
              </Badge>
            )}
            {changeStats.modified > 0 && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <motion.span
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  ~{changeStats.modified}
                </motion.span>
              </Badge>
            )}
            {changeStats.removed > 0 && (
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                <motion.span
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  -{changeStats.removed}
                </motion.span>
              </Badge>
            )}
          </div>
        </div>

        {/* 뷰 모드 토글 */}
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'simple' | 'advanced')} className="w-auto">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="simple" className="text-sm">
              Simple
            </TabsTrigger>
            <TabsTrigger value="advanced" className="text-sm">
              Advanced
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </motion.div>

      {/* 변경사항이 없는 경우 */}
      {changes.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <Eye className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">변경사항이 없습니다</p>
                <p className="text-sm text-gray-400 mt-1">원본과 수정본이 동일합니다</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* 변경사항이 있는 경우 */}
      {changes.length > 0 && (
        <Tabs value={viewMode} className="w-full">
          {/* Simple 모드 - 2열 비교 */}
          <TabsContent value="simple" className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {/* 원본 열 */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-gray-600 flex items-center gap-2">
                    <ChevronLeft className="w-4 h-4" />
                    원본
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      <AnimatePresence>
                        {changes.map((change, index) => (
                          <motion.div
                            key={`original-${change.key}`}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="p-3 rounded-lg bg-gray-50 border border-gray-200"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{change.label}</span>
                                <Badge variant="outline" className={getCategoryColor(change.category)}>
                                  {change.category}
                                </Badge>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopy(String(change.original), `original-${change.key}`)}
                                disabled={!change.original}
                                aria-label={`${change.label} 원본 값 복사`}
                              >
                                {copiedField === `original-${change.key}` ? (
                                  <Check className="w-4 h-4 text-green-600" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                            <div className="text-sm text-gray-700">
                              {renderValue(change.original, 100)}
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* 수정본 열 */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-blue-600 flex items-center gap-2">
                    <ChevronRight className="w-4 h-4" />
                    수정본
                    {selectedChanges.size > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {selectedChanges.size}개 선택
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      <AnimatePresence>
                        {changes.map((change, index) => (
                          <motion.div
                            key={`modified-${change.key}`}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            transition={{ delay: index * 0.05 }}
                            className={cn(
                              'p-3 rounded-lg border-2 cursor-pointer transition-all duration-200',
                              selectedChanges.has(change.key) 
                                ? 'border-blue-300 bg-blue-50 shadow-md' 
                                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                            )}
                            onClick={() => toggleChange(change.key)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                toggleChange(change.key)
                              }
                            }}
                            aria-pressed={selectedChanges.has(change.key)}
                            aria-label={`${change.label} 변경사항 ${selectedChanges.has(change.key) ? '선택됨' : '선택 안됨'}`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{change.label}</span>
                                <Badge 
                                  variant="outline" 
                                  className={getChangeTypeColor(change.type)}
                                >
                                  {change.type === 'added' && '추가'}
                                  {change.type === 'modified' && '수정'}
                                  {change.type === 'removed' && '삭제'}
                                </Badge>
                                {change.importance === 'high' && (
                                  <AlertCircle className="w-3 h-3 text-orange-500" title="중요한 변경사항" />
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                {selectedChanges.has(change.key) && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="w-2 h-2 bg-blue-500 rounded-full"
                                  />
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleCopy(String(change.modified), `modified-${change.key}`)
                                  }}
                                  disabled={!change.modified}
                                  aria-label={`${change.label} 수정 값 복사`}
                                >
                                  {copiedField === `modified-${change.key}` ? (
                                    <Check className="w-4 h-4 text-green-600" />
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                            <div className="text-sm text-gray-700">
                              {/* Step 5: 선택된 변경사항에 <mark> 하이라이트 적용 */}
                              {renderValue(change.modified, 100, selectedChanges.has(change.key))}
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Advanced 모드 - 상세 테이블 */}
          <TabsContent value="advanced" className="space-y-4">
            {/* 제어 패널 */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleAllChanges}
                        className="flex items-center gap-2"
                      >
                        {selectedChanges.size === changes.length ? (
                          <>
                            <EyeOff className="w-4 h-4" />
                            전체 해제
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4" />
                            전체 선택
                          </>
                        )}
                      </Button>
                      
                      <Separator orientation="vertical" className="h-6" />
                      
                      <span className="text-sm text-gray-600">
                        {selectedChanges.size}/{changes.length} 선택됨
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowDiff(!showDiff)}
                        className="flex items-center gap-2"
                      >
                        <ArrowLeftRight className="w-4 h-4" />
                        {showDiff ? '일반 보기' : '차이점 보기'}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedChanges(new Set())}
                        disabled={selectedChanges.size === 0}
                        className="flex items-center gap-2"
                      >
                        <RotateCcw className="w-4 h-4" />
                        초기화
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* 상세 비교 테이블 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="text-left p-4 w-12">선택</th>
                          <th className="text-left p-4">필드</th>
                          <th className="text-left p-4">타입</th>
                          <th className="text-left p-4 min-w-[200px]">원본</th>
                          <th className="text-left p-4 min-w-[200px]">수정본</th>
                          <th className="text-left p-4 w-20">작업</th>
                        </tr>
                      </thead>
                      <tbody>
                        <AnimatePresence>
                          {changes.map((change, index) => (
                            <motion.tr
                              key={change.key}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              transition={{ delay: index * 0.02 }}
                              className={cn(
                                'border-b hover:bg-gray-50 transition-colors',
                                selectedChanges.has(change.key) && 'bg-blue-50'
                              )}
                            >
                              <td className="p-4">
                                <input
                                  type="checkbox"
                                  checked={selectedChanges.has(change.key)}
                                  onChange={() => toggleChange(change.key)}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  aria-label={`${change.label} 선택`}
                                />
                              </td>
                              <td className="p-4">
                                <div className="space-y-1">
                                  <div className="font-medium flex items-center gap-2">
                                    {change.label}
                                    {change.importance === 'high' && (
                                      <AlertCircle className="w-3 h-3 text-orange-500" />
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-500">{change.key}</div>
                                  <Badge variant="outline" className={getCategoryColor(change.category)}>
                                    {change.category}
                                  </Badge>
                                </div>
                              </td>
                              <td className="p-4">
                                <Badge 
                                  variant="outline" 
                                  className={getChangeTypeColor(change.type)}
                                >
                                  {change.type === 'added' && '추가'}
                                  {change.type === 'modified' && '수정'}
                                  {change.type === 'removed' && '삭제'}
                                </Badge>
                              </td>
                              <td className="p-4">
                                <div className="max-w-xs">
                                  <div className="text-sm break-words">
                                    {renderValue(change.original, 80)}
                                  </div>
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="max-w-xs">
                                  <div className="text-sm break-words">
                                    {/* Step 5: Advanced 모드에서도 <mark> 하이라이트 */}
                                    {renderValue(change.modified, 80, selectedChanges.has(change.key))}
                                  </div>
                                </div>
                              </td>
                              <td className="p-4">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleChange(change.key)}
                                  aria-label={`${change.label} 토글`}
                                  className="hover:bg-blue-100"
                                >
                                  {selectedChanges.has(change.key) ? (
                                    <Check className="w-4 h-4 text-green-600" />
                                  ) : (
                                    <ArrowRight className="w-4 h-4" />
                                  )}
                                </Button>
                              </td>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      )}

      {/* 액션 버튼 */}
      {changes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 flex items-center gap-2">
                  {selectedChanges.size > 0 ? (
                    <>
                      <Zap className="w-4 h-4 text-blue-500" />
                      <span>
                        <mark className="bg-yellow-200 px-1 rounded">{selectedChanges.size}개</mark> 변경사항이 적용됩니다
                      </span>
                    </>
                  ) : (
                    '적용할 변경사항을 선택하세요'
                  )}
                </div>
                
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={handleRevert}
                    disabled={selectedChanges.size === 0}
                    className="flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    되돌리기
                  </Button>
                  
                  <Button
                    onClick={handleApply}
                    disabled={selectedChanges.size === 0}
                    className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    적용하기 ({selectedChanges.size})
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}