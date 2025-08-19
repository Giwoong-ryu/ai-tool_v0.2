// EasyPick 통합 검색 허브 v2
// 목적: 목표 입력 + 도구/템플릿/워크플로우 3열 동시 제안
// ARIA Combobox 완전 지원, 반응형 디자인

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Search, Target, Sparkles, Workflow, Wrench, Filter, X, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import { Separator } from './ui/separator'
import { cn } from '../lib/utils'
import { AIToolIcon } from './AIToolIcon'
import { aiTools } from '../data/aiTools'
import { track } from '../lib/analytics'

// Types
interface SearchSuggestion {
  id: string
  title: string
  type: 'tool' | 'template' | 'workflow'
  category: string
  description?: string
  icon?: string
  rating?: number
  tags?: string[]
}

interface SearchHubProps {
  onToolSelect?: (tool: any) => void
  onTemplateSelect?: (template: any) => void
  onWorkflowSelect?: (workflow: any) => void
  className?: string
  maxSuggestions?: {
    desktop: number
    mobile: number
  }
}

// 간단한 디바운스 훅
const useDebounced = (value: string, delay: number = 250) => {
  const [debouncedValue, setDebouncedValue] = useState(value)
  
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  
  return debouncedValue
}

// 미디어 쿼리 훅
const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(false)
  
  useEffect(() => {
    const media = window.matchMedia(query)
    if (media.matches !== matches) {
      setMatches(media.matches)
    }
    
    const listener = () => setMatches(media.matches)
    media.addListener(listener)
    return () => media.removeListener(listener)
  }, [matches, query])
  
  return matches
}

// 템플릿 및 워크플로우 더미 데이터 (실제로는 API에서 가져옴)
const templateData = [
  {
    id: 'template-1',
    title: '블로그 글 작성',
    type: 'template' as const,
    category: '콘텐츠 제작',
    description: '매력적인 블로그 글을 작성하기 위한 프롬프트 템플릿',
    icon: 'PenTool',
    tags: ['블로그', '글쓰기', '콘텐츠']
  },
  {
    id: 'template-2', 
    title: '이메일 마케팅',
    type: 'template' as const,
    category: '마케팅',
    description: '효과적인 마케팅 이메일을 작성하는 템플릿',
    icon: 'Mail',
    tags: ['이메일', '마케팅', '캠페인']
  },
  {
    id: 'template-3',
    title: 'SNS 게시글',
    type: 'template' as const,
    category: '소셜미디어',
    description: '인스타그램, 페이스북용 매력적인 게시글 작성',
    icon: 'Share2',
    tags: ['SNS', '소셜미디어', '게시글']
  }
]

const workflowData = [
  {
    id: 'workflow-1',
    title: '콘텐츠 제작 파이프라인',
    type: 'workflow' as const,
    category: '콘텐츠',
    description: '아이디어부터 발행까지 전체 콘텐츠 제작 과정',
    icon: 'Workflow',
    tags: ['콘텐츠', '제작', '파이프라인']
  },
  {
    id: 'workflow-2',
    title: '제품 리뷰 작성',
    type: 'workflow' as const,
    category: '리뷰',
    description: '체계적이고 신뢰할 수 있는 제품 리뷰 작성',
    icon: 'Star',
    tags: ['리뷰', '제품', '평가']
  }
]

export default function SearchHubV2({ 
  onToolSelect,
  onTemplateSelect, 
  onWorkflowSelect,
  className,
  maxSuggestions = { desktop: 10, mobile: 6 }
}: SearchHubProps) {
  // State
  const [query, setQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [activeColumn, setActiveColumn] = useState<'tools' | 'templates' | 'workflows'>('tools')
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])

  // Refs
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Hooks
  const debouncedQuery = useDebounced(query, 300)
  const isMobile = useMediaQuery('(max-width: 768px)')
  const maxItems = isMobile ? maxSuggestions.mobile : maxSuggestions.desktop

  // IDs for ARIA
  const listboxId = 'search-hub-listbox'
  const inputId = 'search-hub-input'

  // 검색 및 필터링 로직
  const suggestions = useMemo(() => {
    if (!debouncedQuery) return { tools: [], templates: [], workflows: [] }

    const searchLower = debouncedQuery.toLowerCase()
    
    // AI 도구 필터링
    const filteredTools = aiTools
      .filter(tool => 
        tool.name.toLowerCase().includes(searchLower) ||
        tool.description.toLowerCase().includes(searchLower) ||
        tool.category.toLowerCase().includes(searchLower) ||
        (tool.features && tool.features.some(f => f.toLowerCase().includes(searchLower)))
      )
      .map(tool => ({
        id: tool.id.toString(),
        title: tool.name,
        type: 'tool' as const,
        category: tool.category,
        description: tool.description,
        icon: tool.icon,
        rating: tool.rating,
        tags: tool.features || []
      }))
      .slice(0, Math.floor(maxItems / 3))

    // 템플릿 필터링
    const filteredTemplates = templateData
      .filter(template =>
        template.title.toLowerCase().includes(searchLower) ||
        template.description.toLowerCase().includes(searchLower) ||
        template.category.toLowerCase().includes(searchLower) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchLower))
      )
      .slice(0, Math.floor(maxItems / 3))

    // 워크플로우 필터링
    const filteredWorkflows = workflowData
      .filter(workflow =>
        workflow.title.toLowerCase().includes(searchLower) ||
        workflow.description.toLowerCase().includes(searchLower) ||
        workflow.category.toLowerCase().includes(searchLower) ||
        workflow.tags.some(tag => tag.toLowerCase().includes(searchLower))
      )
      .slice(0, Math.floor(maxItems / 3))

    return {
      tools: filteredTools,
      templates: filteredTemplates,
      workflows: filteredWorkflows
    }
  }, [debouncedQuery, maxItems])

  // 전체 제안 수
  const totalSuggestions = suggestions.tools.length + suggestions.templates.length + suggestions.workflows.length

  // 키보드 네비게이션
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showSuggestions || totalSuggestions === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex(prev => Math.min(prev + 1, totalSuggestions - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex(prev => Math.max(prev - 1, 0))
        break
      case 'Tab':
        // 탭으로 컬럼 간 이동
        if (!e.shiftKey) {
          e.preventDefault()
          if (activeColumn === 'tools') setActiveColumn('templates')
          else if (activeColumn === 'templates') setActiveColumn('workflows')
          else setActiveColumn('tools')
        }
        break
      case 'Enter':
        if (activeIndex >= 0) {
          e.preventDefault()
          handleSelectSuggestion(activeIndex)
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setActiveIndex(-1)
        break
    }
  }, [showSuggestions, totalSuggestions, activeIndex, activeColumn])

  // 제안 선택 처리
  const handleSelectSuggestion = useCallback((index: number) => {
    let currentIndex = 0
    
    // 도구에서 찾기
    if (index < suggestions.tools.length) {
      const tool = suggestions.tools[index]
      onToolSelect?.(tool)
      track('tool_interaction', {
        tool_id: tool.id,
        tool_name: tool.title,
        action_type: 'select',
        category: tool.category
      })
      return
    }
    currentIndex += suggestions.tools.length
    
    // 템플릿에서 찾기
    if (index < currentIndex + suggestions.templates.length) {
      const template = suggestions.templates[index - currentIndex]
      onTemplateSelect?.(template)
      track('select_template', {
        template_id: template.id,
        template_type: 'prompt',
        category: template.category
      })
      return
    }
    currentIndex += suggestions.templates.length
    
    // 워크플로우에서 찾기
    if (index < currentIndex + suggestions.workflows.length) {
      const workflow = suggestions.workflows[index - currentIndex]
      onWorkflowSelect?.(workflow)
      track('start_workflow', {
        workflow_id: workflow.id,
        workflow_type: workflow.category
      })
    }
  }, [suggestions, onToolSelect, onTemplateSelect, onWorkflowSelect])

  // 검색어 변경 시 제안 표시
  useEffect(() => {
    if (debouncedQuery.trim()) {
      setShowSuggestions(true)
      setActiveIndex(-1)
    } else {
      setShowSuggestions(false)
    }
  }, [debouncedQuery])

  // 검색 추적
  useEffect(() => {
    if (debouncedQuery.trim()) {
      track('search', {
        search_term: debouncedQuery,
        result_count: totalSuggestions,
        search_type: 'global'
      })
    }
  }, [debouncedQuery, totalSuggestions])

  return (
    <div className={cn("w-full max-w-6xl mx-auto", className)}>
      {/* 검색 헤더 */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
            <Target className="w-8 h-8 text-blue-600" />
            무엇을 하고 싶나요?
          </h1>
          <p className="text-gray-600 text-lg">
            AI 도구, 템플릿, 워크플로우를 한 번에 검색하세요
          </p>
        </motion.div>
      </div>

      {/* 검색 입력란 */}
      <div className="relative mb-8">
        <div
          className="relative"
          role="combobox"
          aria-expanded={showSuggestions}
          aria-owns={listboxId}
          aria-haspopup="listbox"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              id={inputId}
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => debouncedQuery && setShowSuggestions(true)}
              onKeyDown={handleKeyDown}
              placeholder="예: 블로그 글 작성, ChatGPT, 콘텐츠 제작 워크플로우..."
              className="pl-12 pr-12 py-4 text-lg rounded-xl border-2 border-gray-200 focus:border-blue-500 transition-colors"
              aria-autocomplete="list"
              aria-controls={listboxId}
              aria-activedescendant={
                activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined
              }
            />
            {query && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
                onClick={() => {
                  setQuery('')
                  setShowSuggestions(false)
                  inputRef.current?.focus()
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* 검색 제안 */}
          <AnimatePresence>
            {showSuggestions && totalSuggestions > 0 && (
              <motion.div
                ref={suggestionsRef}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden"
                id={listboxId}
                role="listbox"
                aria-label="검색 제안"
              >
                <div className={cn(
                  "grid gap-4 p-6",
                  isMobile ? "grid-cols-1" : "grid-cols-3"
                )}>
                  {/* AI 도구 컬럼 */}
                  {suggestions.tools.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <Wrench className="w-4 h-4 text-blue-600" />
                        AI 도구
                      </div>
                      <div className="space-y-2">
                        {suggestions.tools.map((tool, index) => (
                          <SuggestionCard
                            key={tool.id}
                            item={tool}
                            index={index}
                            isActive={activeIndex === index}
                            onClick={() => handleSelectSuggestion(index)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 템플릿 컬럼 */}
                  {suggestions.templates.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <Sparkles className="w-4 h-4 text-green-600" />
                        템플릿
                      </div>
                      <div className="space-y-2">
                        {suggestions.templates.map((template, index) => {
                          const globalIndex = suggestions.tools.length + index
                          return (
                            <SuggestionCard
                              key={template.id}
                              item={template}
                              index={globalIndex}
                              isActive={activeIndex === globalIndex}
                              onClick={() => handleSelectSuggestion(globalIndex)}
                            />
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* 워크플로우 컬럼 */}
                  {suggestions.workflows.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <Workflow className="w-4 h-4 text-purple-600" />
                        워크플로우
                      </div>
                      <div className="space-y-2">
                        {suggestions.workflows.map((workflow, index) => {
                          const globalIndex = suggestions.tools.length + suggestions.templates.length + index
                          return (
                            <SuggestionCard
                              key={workflow.id}
                              item={workflow}
                              index={globalIndex}
                              isActive={activeIndex === globalIndex}
                              onClick={() => handleSelectSuggestion(globalIndex)}
                            />
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* 푸터 */}
                <div className="border-t border-gray-100 px-6 py-3 bg-gray-50">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      {totalSuggestions}개 결과 • 키보드로 탐색 가능
                    </span>
                    <div className="flex items-center gap-2">
                      <kbd className="px-2 py-1 bg-white border border-gray-200 rounded text-xs">↑↓</kbd>
                      <span>이동</span>
                      <kbd className="px-2 py-1 bg-white border border-gray-200 rounded text-xs">Enter</kbd>
                      <span>선택</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 빈 상태 또는 인기 항목 */}
      {!showSuggestions && !query && (
        <PopularItems
          onToolSelect={onToolSelect}
          onTemplateSelect={onTemplateSelect}
          onWorkflowSelect={onWorkflowSelect}
        />
      )}
    </div>
  )
}

// 제안 카드 컴포넌트
interface SuggestionCardProps {
  item: SearchSuggestion
  index: number
  isActive: boolean
  onClick: () => void
}

function SuggestionCard({ item, index, isActive, onClick }: SuggestionCardProps) {
  const typeColors = {
    tool: 'bg-blue-50 text-blue-700 border-blue-200',
    template: 'bg-green-50 text-green-700 border-green-200',
    workflow: 'bg-purple-50 text-purple-700 border-purple-200'
  }

  return (
    <div
      id={`suggestion-${index}`}
      role="option"
      aria-selected={isActive}
      className={cn(
        "p-3 rounded-lg border cursor-pointer transition-all duration-150",
        isActive 
          ? "bg-blue-50 border-blue-300 shadow-sm" 
          : "bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300"
      )}
      onClick={onClick}
      onMouseEnter={() => {}} // 마우스 호버 시 활성 인덱스 변경은 키보드 네비게이션과 충돌할 수 있어 제거
    >
      <div className="flex items-start gap-3">
        {item.type === 'tool' && item.icon && (
          <AIToolIcon name={item.icon} className="w-5 h-5 mt-0.5 flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-gray-900 truncate text-sm">
              {item.title}
            </h4>
            {item.rating && (
              <div className="flex items-center gap-1">
                <span className="text-yellow-400">★</span>
                <span className="text-xs text-gray-600">{item.rating}</span>
              </div>
            )}
          </div>
          {item.description && (
            <p className="text-xs text-gray-600 line-clamp-2 mb-2">
              {item.description}
            </p>
          )}
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={cn("text-xs", typeColors[item.type])}
            >
              {item.category}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  )
}

// 인기 항목 컴포넌트
interface PopularItemsProps {
  onToolSelect?: (tool: any) => void
  onTemplateSelect?: (template: any) => void
  onWorkflowSelect?: (workflow: any) => void
}

function PopularItems({ onToolSelect, onTemplateSelect, onWorkflowSelect }: PopularItemsProps) {
  const popularTools = aiTools.slice(0, 6)
  const popularTemplates = templateData.slice(0, 3)
  const popularWorkflows = workflowData.slice(0, 2)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="space-y-8"
    >
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          인기 있는 도구와 템플릿
        </h2>
        <p className="text-gray-600">
          많은 사용자들이 선택한 AI 도구와 템플릿을 확인해보세요
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* 인기 도구 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-blue-600" />
            인기 AI 도구
          </h3>
          <div className="grid gap-3">
            {popularTools.map((tool) => (
              <Card
                key={tool.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={async () => {
                  onToolSelect?.(tool)
                  // <mark>Step 4 Analytics: select_template 이벤트 추적</mark>
                  try {
                    await track('select_template', {
                      template_id: tool.id.toString(),
                      template_type: 'ai_tool',
                      category: tool.category,
                      search_context: 'popular_tools',
                      rating: tool.rating
                    })
                  } catch (error) {
                    console.warn('Analytics tracking failed:', error)
                  }
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <AIToolIcon name={tool.icon} className="w-8 h-8" />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{tool.name}</h4>
                      <p className="text-sm text-gray-600">{tool.category}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-400">★</span>
                      <span className="text-sm text-gray-600">{tool.rating}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* 인기 템플릿 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-green-600" />
            인기 템플릿
          </h3>
          <div className="grid gap-3">
            {popularTemplates.map((template) => (
              <Card
                key={template.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={async () => {
                  onTemplateSelect?.(template)
                  // <mark>Step 4 Analytics: select_template 이벤트 추적</mark>
                  try {
                    await track('select_template', {
                      template_id: template.id,
                      template_type: 'prompt',
                      category: template.category,
                      search_context: 'popular_templates'
                    })
                  } catch (error) {
                    console.warn('Analytics tracking failed:', error)
                  }
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">{template.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                      <Badge variant="outline" className="text-xs">
                        {template.category}
                      </Badge>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 mt-1" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* 인기 워크플로우 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Workflow className="w-5 h-5 text-purple-600" />
            인기 워크플로우
          </h3>
          <div className="grid gap-3">
            {popularWorkflows.map((workflow) => (
              <Card
                key={workflow.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={async () => {
                  onWorkflowSelect?.(workflow)
                  // <mark>Step 4 Analytics: select_template 이벤트 추적</mark>
                  try {
                    await track('select_template', {
                      template_id: workflow.id,
                      template_type: 'workflow',
                      category: workflow.category,
                      search_context: 'popular_workflows'
                    })
                  } catch (error) {
                    console.warn('Analytics tracking failed:', error)
                  }
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">{workflow.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">{workflow.description}</p>
                      <Badge variant="outline" className="text-xs">
                        {workflow.category}
                      </Badge>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 mt-1" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}