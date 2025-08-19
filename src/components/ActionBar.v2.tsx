// EasyPick 액션바 v2
// 목적: 하단 고정 액션바 - 복사/즐겨찾기/실행/공유 + 업셀 가드 연동
// 반응형 디자인, 접근성 최적화

import React, { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Copy, 
  Heart, 
  HeartOff, 
  Play, 
  Share2, 
  Download, 
  Bookmark, 
  BookmarkCheck,
  ExternalLink,
  Zap,
  Crown,
  Users,
  ChevronUp,
  ChevronDown
} from 'lucide-react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from './ui/dropdown-menu'
import { cn } from '../lib/utils'
import { track } from '../lib/analytics'
import useAuthStore from '../store/authStore'
import { UpgradeBanner } from './ui/UpgradeBanner'

// Types
interface ActionBarProps {
  item?: {
    id: string
    title: string
    type: 'tool' | 'template' | 'workflow'
    category?: string
    url?: string
  }
  compiledContent?: string
  isVisible?: boolean
  isExpanded?: boolean
  onToggleExpanded?: () => void
  onClose?: () => void
  className?: string
}

interface ShareOption {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  action: () => void
  disabled?: boolean
}

// 로컬 스토리지 키
const FAVORITES_KEY = 'easypick_favorites'
const BOOKMARKS_KEY = 'easypick_bookmarks'

export default function ActionBarV2({
  item,
  compiledContent,
  isVisible = true,
  isExpanded = false,
  onToggleExpanded,
  onClose,
  className
}: ActionBarProps) {
  // State
  const [isFavorited, setIsFavorited] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [showUpgradeBanner, setShowUpgradeBanner] = useState(false)
  const [lastAction, setLastAction] = useState<string | null>(null)

  // Hooks
  const { 
    isAuthenticated, 
    checkPermission, 
    executeWithGuard, 
    hasFeature,
    getCurrentPlan 
  } = useAuthStore()

  // 즐겨찾기 및 북마크 상태 로드
  useEffect(() => {
    if (!item) return

    try {
      const favorites = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]')
      const bookmarks = JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '[]')
      
      setIsFavorited(favorites.includes(item.id))
      setIsBookmarked(bookmarks.includes(item.id))
    } catch (error) {
      console.error('Failed to load favorites/bookmarks:', error)
    }
  }, [item])

  // 복사 처리
  const handleCopy = useCallback(async () => {
    if (!item || !compiledContent) return

    try {
      await navigator.clipboard.writeText(compiledContent)
      setLastAction('copy')
      
      // <mark>Step 4 Analytics: compile_prompt 이벤트 추적</mark>
      try {
        await track('compile_prompt', {
          prompt_id: item.id,
          prompt_length: compiledContent.length,
          model_type: item.type === 'tool' ? 'ai_tool' : item.type,
          success: true,
          category: item.category || 'unknown'
        })
      } catch (analyticsError) {
        console.warn('Analytics tracking failed:', analyticsError)
      }

      // 성공 애니메이션 (3초 후 리셋)
      setTimeout(() => setLastAction(null), 3000)
      
    } catch (error) {
      console.error('Copy failed:', error)
    }
  }, [item, compiledContent])

  // 즐겨찾기 토글
  const handleToggleFavorite = useCallback(async () => {
    if (!item) return

    try {
      const favorites = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]')
      const newFavorites = isFavorited 
        ? favorites.filter((id: string) => id !== item.id)
        : [...favorites, item.id]
      
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites))
      setIsFavorited(!isFavorited)
      setLastAction(isFavorited ? 'unfavorite' : 'favorite')
      
      // 분석 추적
      await track('tool_interaction', {
        tool_id: item.id,
        tool_name: item.title,
        action_type: isFavorited ? 'unfavorite' : 'favorite',
        category: item.category || 'unknown'
      })

      setTimeout(() => setLastAction(null), 3000)

    } catch (error) {
      console.error('Toggle favorite failed:', error)
    }
  }, [item, isFavorited])

  // 북마크 토글
  const handleToggleBookmark = useCallback(async () => {
    if (!item) return

    try {
      const bookmarks = JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '[]')
      const newBookmarks = isBookmarked
        ? bookmarks.filter((id: string) => id !== item.id)
        : [...bookmarks, item.id]
      
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(newBookmarks))
      setIsBookmarked(!isBookmarked)
      setLastAction(isBookmarked ? 'unbookmark' : 'bookmark')
      
      // 분석 추적
      await track('tool_interaction', {
        tool_id: item.id,
        tool_name: item.title,
        action_type: isBookmarked ? 'unbookmark' : 'bookmark',
        category: item.category || 'unknown'
      })

      setTimeout(() => setLastAction(null), 3000)

    } catch (error) {
      console.error('Toggle bookmark failed:', error)
    }
  }, [item, isBookmarked])

  // 실행/열기 처리
  const handleExecute = useCallback(async () => {
    if (!item) return

    // Pro 기능인 경우 권한 체크
    if (item.type === 'workflow' || (item.type === 'tool' && !hasFeature('BASIC_TOOLS'))) {
      const permission = await checkPermission('ai_tool_access', item.id)
      if (!permission.allowed) {
        setShowUpgradeBanner(true)
        return
      }
    }

    try {
      if (item.url) {
        // 외부 도구 열기
        window.open(item.url, '_blank', 'noopener,noreferrer')
      } else if (item.type === 'workflow') {
        // 워크플로우 실행 (실제로는 라우터로 이동)
        console.log('Execute workflow:', item.id)
      }

      setLastAction('execute')

      // <mark>Step 4 Analytics: start_workflow 이벤트 추적</mark>
      try {
        if (item.type === 'workflow') {
          await track('start_workflow', {
            workflow_id: item.id,
            workflow_type: item.category || 'unknown',
            step_count: 1, // 기본값, 실제로는 워크플로우 메타데이터에서 가져와야 함
            action_source: 'action_bar'
          })
        } else {
          // 일반 도구 실행 추적
          await track('tool_interaction', {
            tool_id: item.id,
            tool_name: item.title,
            action_type: 'execute',
            category: item.category || 'unknown'
          })
        }
      } catch (analyticsError) {
        console.warn('Analytics tracking failed:', analyticsError)
      }

      setTimeout(() => setLastAction(null), 3000)

    } catch (error) {
      console.error('Execute failed:', error)
    }
  }, [item, checkPermission, hasFeature])

  // 공유 옵션
  const shareOptions: ShareOption[] = [
    {
      id: 'copy-link',
      label: '링크 복사',
      icon: Copy,
      action: async () => {
        if (!item) return
        const url = `${window.location.origin}/tools/${item.id}`
        await navigator.clipboard.writeText(url)
        setLastAction('share-link')
        setTimeout(() => setLastAction(null), 3000)
        
        await track('tool_interaction', {
          tool_id: item.id,
          tool_name: item.title,
          action_type: 'share',
          category: 'link'
        })
      }
    },
    {
      id: 'twitter',
      label: 'Twitter 공유',
      icon: ExternalLink,
      action: () => {
        if (!item) return
        const text = `${item.title} - EasyPick AI 도구`
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`
        window.open(url, '_blank', 'noopener,noreferrer')
        
        track('tool_interaction', {
          tool_id: item.id,
          tool_name: item.title,
          action_type: 'share',
          category: 'twitter'
        })
      }
    },
    {
      id: 'download',
      label: '결과 다운로드',
      icon: Download,
      action: () => {
        if (!compiledContent) return
        
        const blob = new Blob([compiledContent], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${item?.title || 'content'}.txt`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        track('tool_interaction', {
          tool_id: item?.id || 'unknown',
          action_type: 'download',
          category: 'content'
        })
      },
      disabled: !compiledContent
    }
  ]

  // 상태별 액션 메시지
  const getActionMessage = (action: string) => {
    switch (action) {
      case 'copy': return '복사되었습니다!'
      case 'favorite': return '즐겨찾기에 추가됨'
      case 'unfavorite': return '즐겨찾기에서 제거됨'
      case 'bookmark': return '북마크에 추가됨'
      case 'unbookmark': return '북마크에서 제거됨'
      case 'execute': return '실행됨'
      case 'share-link': return '링크가 복사됨'
      default: return ''
    }
  }

  if (!isVisible || !item) return null

  return (
    <TooltipProvider>
      <div className={cn("relative", className)}>
        {/* 업그레이드 배너 */}
        <AnimatePresence>
          {showUpgradeBanner && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96"
            >
              <UpgradeBanner
                feature="AI_TOOL_ACCESS"
                variant="modal"
                onDismiss={() => setShowUpgradeBanner(false)}
                customTitle="Pro 기능 필요"
                customDescription={`${item.title}은 Pro 플랜에서 사용 가능한 기능입니다.`}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* 액션 상태 메시지 */}
        <AnimatePresence>
          {lastAction && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50"
            >
              <div className="bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
                {getActionMessage(lastAction)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 메인 액션바 */}
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40"
        >
          <div className="max-w-6xl mx-auto px-4 py-3">
            {/* 확장 가능한 정보 영역 */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mb-4 p-4 bg-gray-50 rounded-lg overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{item.title}</h3>
                    <Badge variant="outline">{item.category}</Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">타입:</span>
                      <span className="ml-1 font-medium">{item.type}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">플랜:</span>
                      <span className="ml-1 font-medium">{getCurrentPlan()}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">상태:</span>
                      <span className="ml-1 text-green-600">사용 가능</span>
                    </div>
                    <div>
                      <span className="text-gray-500">결과:</span>
                      <span className="ml-1 font-medium">
                        {compiledContent ? '준비됨' : '대기 중'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 메인 액션 버튼들 */}
            <div className="flex items-center justify-between">
              {/* 왼쪽: 아이템 정보 및 확장 토글 */}
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleExpanded}
                  className="hidden md:flex"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronUp className="w-4 h-4" />
                  )}
                </Button>
                
                <div className="hidden md:block">
                  <h4 className="font-medium text-gray-900 text-sm">{item.title}</h4>
                  <p className="text-xs text-gray-500">{item.category}</p>
                </div>
              </div>

              {/* 가운데: 주요 액션 버튼들 */}
              <div className="flex items-center gap-2">
                {/* 복사 */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopy}
                      disabled={!compiledContent}
                      className={cn(
                        lastAction === 'copy' && "bg-green-50 border-green-300 text-green-700"
                      )}
                    >
                      <Copy className="w-4 h-4 md:mr-2" />
                      <span className="hidden md:inline">복사</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {compiledContent ? '결과 복사' : '먼저 컴파일해주세요'}
                  </TooltipContent>
                </Tooltip>

                {/* 즐겨찾기 */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleToggleFavorite}
                      className={cn(
                        isFavorited && "bg-red-50 border-red-300 text-red-700",
                        lastAction === 'favorite' && "bg-red-50 border-red-300 text-red-700",
                        lastAction === 'unfavorite' && "bg-gray-50 border-gray-300"
                      )}
                    >
                      {isFavorited ? (
                        <Heart className="w-4 h-4 md:mr-2 fill-current" />
                      ) : (
                        <HeartOff className="w-4 h-4 md:mr-2" />
                      )}
                      <span className="hidden md:inline">
                        {isFavorited ? '찜됨' : '찜하기'}
                      </span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isFavorited ? '즐겨찾기에서 제거' : '즐겨찾기에 추가'}
                  </TooltipContent>
                </Tooltip>

                {/* 북마크 */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleToggleBookmark}
                      className={cn(
                        isBookmarked && "bg-blue-50 border-blue-300 text-blue-700",
                        lastAction === 'bookmark' && "bg-blue-50 border-blue-300 text-blue-700",
                        lastAction === 'unbookmark' && "bg-gray-50 border-gray-300"
                      )}
                    >
                      {isBookmarked ? (
                        <BookmarkCheck className="w-4 h-4 md:mr-2 fill-current" />
                      ) : (
                        <Bookmark className="w-4 h-4 md:mr-2" />
                      )}
                      <span className="hidden md:inline">
                        {isBookmarked ? '북마크됨' : '북마크'}
                      </span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isBookmarked ? '북마크에서 제거' : '북마크에 추가'}
                  </TooltipContent>
                </Tooltip>

                {/* 실행/열기 */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      onClick={handleExecute}
                      className={cn(
                        "bg-blue-600 hover:bg-blue-700 text-white",
                        lastAction === 'execute' && "bg-green-600 hover:bg-green-700"
                      )}
                    >
                      <Play className="w-4 h-4 md:mr-2" />
                      <span className="hidden md:inline">
                        {item.type === 'tool' ? '도구 열기' : 
                         item.type === 'workflow' ? '워크플로우 실행' : '실행'}
                      </span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {item.type === 'tool' ? '외부 도구 열기' : 
                     item.type === 'workflow' ? '워크플로우 실행' : '실행'}
                  </TooltipContent>
                </Tooltip>

                {/* 공유 드롭다운 */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Share2 className="w-4 h-4 md:mr-2" />
                      <span className="hidden md:inline">공유</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {shareOptions.map((option, index) => (
                      <React.Fragment key={option.id}>
                        <DropdownMenuItem
                          onClick={option.action}
                          disabled={option.disabled}
                          className="cursor-pointer"
                        >
                          <option.icon className="w-4 h-4 mr-2" />
                          {option.label}
                        </DropdownMenuItem>
                        {index === 0 && <DropdownMenuSeparator />}
                      </React.Fragment>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* 오른쪽: 닫기 */}
              {onClose && (
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </TooltipProvider>
  )
}