// src/components/AIToolsGrid.jsx
import React, { useState, useEffect, useCallback } from 'react'
import { Input } from './ui/input.jsx'
import { Button } from './ui/button.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select.jsx'
import { Badge } from './ui/badge.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card.jsx'
import { Separator } from './ui/separator.jsx'
import { 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Star, 
  Eye, 
  Bookmark, 
  BookmarkCheck,
  ExternalLink,
  Loader2,
  SlidersHorizontal,
  X
} from 'lucide-react'
import { AIToolsService } from '../services/aiToolsService.js'
import useAuthStore from '../store/authStore.js'
import { useDebounce } from '../hooks/useDebounce.js'
import toast from 'react-hot-toast'

const AIToolsGrid = () => {
  // 상태 관리
  const [tools, setTools] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    category: 'all',
    subcategory: '',
    pricing: [],
    minRating: 0,
    verifiedOnly: false,
    featuredOnly: false,
    tags: []
  })
  const [sortBy, setSortBy] = useState('popularity')
  const [viewMode, setViewMode] = useState('grid') // 'grid' 또는 'list'
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalPages: 0,
    count: 0
  })

  // 메타데이터
  const [categories, setCategories] = useState({})
  const [popularTags, setPopularTags] = useState([])
  const [bookmarkedTools, setBookmarkedTools] = useState(new Set())

  const { user, checkUsageLimit, incrementUsage } = useAuthStore()
  const debouncedSearchQuery = useDebounce(searchQuery, 500)

  // 초기 데이터 로드
  useEffect(() => {
    loadInitialData()
  }, [])

  // 검색/필터 변경시 도구 목록 갱신
  useEffect(() => {
    searchTools(1) // 첫 페이지부터 시작
  }, [debouncedSearchQuery, filters, sortBy])

  const loadInitialData = async () => {
    try {
      const [categoriesResult, tagsResult] = await Promise.all([
        AIToolsService.getCategories(),
        AIToolsService.getPopularTags(30)
      ])

      if (categoriesResult.data) {
        setCategories(categoriesResult.data)
      }

      if (tagsResult.data) {
        setPopularTags(tagsResult.data)
      }

      // 초기 도구 목록 로드
      await searchTools(1)

    } catch (error) {
      console.error('Initial data load error:', error)
      toast.error('데이터 로드 중 오류가 발생했습니다.')
    }
  }

  const searchTools = async (page = pagination.page) => {
    try {
      setLoading(true)

      const result = await AIToolsService.searchTools(
        debouncedSearchQuery,
        filters,
        {
          sortBy,
          page,
          limit: pagination.limit
        }
      )

      setTools(result.data)
      setPagination({
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        count: result.count
      })

      // 로그인된 사용자의 북마크 상태 확인
      if (user && result.data.length > 0) {
        const toolIds = result.data.map(tool => tool.id)
        const bookmarkStatus = await AIToolsService.checkBookmarkStatus(user.id, toolIds)
        
        const bookmarkedSet = new Set()
        Object.entries(bookmarkStatus).forEach(([toolId, isBookmarked]) => {
          if (isBookmarked) bookmarkedSet.add(toolId)
        })
        setBookmarkedTools(bookmarkedSet)
      }

    } catch (error) {
      console.error('Search tools error:', error)
      toast.error('검색 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 북마크 토글
  const handleBookmarkToggle = async (toolId) => {
    if (!user) {
      toast.error('로그인이 필요합니다.')
      return
    }

    try {
      const { isBookmarked } = await AIToolsService.toggleBookmark(user.id, toolId)
      
      const newBookmarkedTools = new Set(bookmarkedTools)
      if (isBookmarked) {
        newBookmarkedTools.add(toolId)
        toast.success('북마크에 추가되었습니다.')
      } else {
        newBookmarkedTools.delete(toolId)
        toast.success('북마크에서 제거되었습니다.')
      }
      setBookmarkedTools(newBookmarkedTools)

    } catch (error) {
      console.error('Bookmark toggle error:', error)
      toast.error('북마크 처리 중 오류가 발생했습니다.')
    }
  }

  // 도구 클릭 처리 (사용량 체크)
  const handleToolClick = async (tool) => {
    // 사용량 체크 (로그인된 사용자만)
    if (user) {
      const canUse = await checkUsageLimit()
      if (!canUse) {
        toast.error('월 사용량을 초과했습니다. 플랜을 업그레이드해주세요.')
        return
      }
      
      // 사용량 증가
      await incrementUsage()
      
      // 활동 기록
      await AIToolsService.logActivity(
        user.id,
        'view',
        'tool',
        tool.id,
        { tool_name: tool.name, category: tool.category }
      )
    }

    // 외부 링크로 이동
    window.open(tool.website_url, '_blank', 'noopener,noreferrer')
  }

  // 필터 초기화
  const resetFilters = () => {
    setFilters({
      category: 'all',
      subcategory: '',
      pricing: [],
      minRating: 0,
      verifiedOnly: false,
      featuredOnly: false,
      tags: []
    })
    setSearchQuery('')
  }

  // 태그 토글
  const toggleTag = (tag) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }))
  }

  // 가격 유형 토글
  const togglePricing = (pricing) => {
    setFilters(prev => ({
      ...prev,
      pricing: prev.pricing.includes(pricing)
        ? prev.pricing.filter(p => p !== pricing)
        : [...prev.pricing, pricing]
    }))
  }

  // 페이지 변경
  const handlePageChange = (newPage) => {
    searchTools(newPage)
  }

  // 도구 카드 렌더링
  const renderToolCard = (tool) => {
    const isBookmarked = bookmarkedTools.has(tool.id)

    return (
      <Card key={tool.id} className="group hover:shadow-lg transition-all duration-200 border border-gray-200 hover:border-gray-300">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                {tool.logo_url ? (
                  <img
                    src={tool.logo_url}
                    alt={`${tool.name} logo`}
                    className="w-8 h-8 object-contain"
                    onError={(e) => {
                      e.target.style.display = 'none'
                      e.target.nextSibling.style.display = 'flex'
                    }}
                  />
                ) : null}
                <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                  {tool.name.charAt(0).toUpperCase()}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg font-semibold text-gray-900 truncate">
                  {tool.name}
                  {tool.is_verified && (
                    <Badge className="ml-2 bg-blue-100 text-blue-800 text-xs">
                      인증됨
                    </Badge>
                  )}
                </CardTitle>
                <p className="text-sm text-gray-500 capitalize">{tool.category}</p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                handleBookmarkToggle(tool.id)
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {isBookmarked ? (
                <BookmarkCheck className="h-4 w-4 text-blue-500" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <CardDescription className="text-sm text-gray-600 line-clamp-2 mb-4">
            {tool.short_description || tool.description}
          </CardDescription>

          {/* 태그들 */}
          {tool.tags && tool.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {tool.tags.slice(0, 3).map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleTag(tag)
                  }}
                >
                  {tag}
                </Badge>
              ))}
              {tool.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-500">
                  +{tool.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* 통계 정보 */}
          <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
            <div className="flex items-center gap-4">
              {tool.rating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{tool.rating.toFixed(1)}</span>
                </div>
              )}
              
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{tool.view_count?.toLocaleString() || 0}</span>
              </div>

              {tool.bookmark_count > 0 && (
                <div className="flex items-center gap-1">
                  <Bookmark className="h-4 w-4" />
                  <span>{tool.bookmark_count}</span>
                </div>
              )}
            </div>

            {/* 가격 유형 */}
            <Badge
              className={`text-xs ${
                tool.pricing_type === 'free'
                  ? 'bg-green-100 text-green-800'
                  : tool.pricing_type === 'freemium'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-orange-100 text-orange-800'
              }`}
            >
              {tool.pricing_type === 'free' ? '무료' : 
               tool.pricing_type === 'freemium' ? '프리미엄' : '유료'}
            </Badge>
          </div>

          {/* 액션 버튼 */}
          <Button
            onClick={() => handleToolClick(tool)}
            className="w-full"
            variant="default"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            도구 사용하기
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI 도구 찾기</h1>
        <p className="text-gray-600">
          {pagination.count > 0 ? `총 ${pagination.count.toLocaleString()}개의 AI 도구` : 'AI 도구를 검색해보세요'}
        </p>
      </div>

      {/* 검색 및 필터 */}
      <div className="mb-6 space-y-4">
        {/* 검색바 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="AI 도구를 검색하세요..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 h-12 text-lg"
          />
        </div>

        {/* 필터 및 정렬 */}
        <div className="flex flex-wrap items-center gap-4">
          {/* 카테고리 선택 */}
          <Select value={filters.category} onValueChange={(value) => 
            setFilters(prev => ({ ...prev, category: value, subcategory: '' }))
          }>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="카테고리 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">모든 카테고리</SelectItem>
              {Object.keys(categories).map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 서브카테고리 선택 */}
          {filters.category !== 'all' && categories[filters.category]?.length > 0 && (
            <Select value={filters.subcategory} onValueChange={(value) => 
              setFilters(prev => ({ ...prev, subcategory: value }))
            }>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="세부 카테고리" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">전체</SelectItem>
                {categories[filters.category].map((subcategory) => (
                  <SelectItem key={subcategory} value={subcategory}>
                    {subcategory}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* 정렬 */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="정렬" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popularity">인기순</SelectItem>
              <SelectItem value="rating">평점순</SelectItem>
              <SelectItem value="newest">최신순</SelectItem>
              <SelectItem value="name">이름순</SelectItem>
              <SelectItem value="views">조회수순</SelectItem>
            </SelectContent>
          </Select>

          {/* 고급 필터 토글 */}
          <Button
            variant="outline"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            고급 필터
          </Button>

          {/* 뷰 모드 */}
          <div className="flex border rounded-lg">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* 필터 초기화 */}
          {(searchQuery || filters.category !== 'all' || filters.tags.length > 0 || filters.pricing.length > 0) && (
            <Button variant="ghost" onClick={resetFilters}>
              <X className="h-4 w-4 mr-2" />
              초기화
            </Button>
          )}
        </div>

        {/* 고급 필터 */}
        {showAdvancedFilters && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            {/* 가격 유형 필터 */}
            <div>
              <h3 className="font-medium mb-2">가격 유형</h3>
              <div className="flex flex-wrap gap-2">
                {['free', 'freemium', 'paid'].map((pricing) => (
                  <Badge
                    key={pricing}
                    className={`cursor-pointer ${
                      filters.pricing.includes(pricing)
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    onClick={() => togglePricing(pricing)}
                  >
                    {pricing === 'free' ? '무료' : 
                     pricing === 'freemium' ? '프리미엄' : '유료'}
                  </Badge>
                ))}
              </div>
            </div>

            {/* 인기 태그 */}
            <div>
              <h3 className="font-medium mb-2">인기 태그</h3>
              <div className="flex flex-wrap gap-2">
                {popularTags.slice(0, 15).map(({ tag, count }) => (
                  <Badge
                    key={tag}
                    className={`cursor-pointer ${
                      filters.tags.includes(tag)
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    onClick={() => toggleTag(tag)}
                  >
                    {tag} ({count})
                  </Badge>
                ))}
              </div>
            </div>

            {/* 기타 필터 */}
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.verifiedOnly}
                  onChange={(e) => setFilters(prev => ({ ...prev, verifiedOnly: e.target.checked }))}
                />
                <span className="text-sm">인증된 도구만</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.featuredOnly}
                  onChange={(e) => setFilters(prev => ({ ...prev, featuredOnly: e.target.checked }))}
                />
                <span className="text-sm">추천 도구만</span>
              </label>
            </div>
          </div>
        )}

        {/* 적용된 필터 표시 */}
        {(filters.tags.length > 0 || filters.pricing.length > 0) && (
          <div className="flex flex-wrap gap-2">
            {filters.tags.map((tag) => (
              <Badge key={tag} className="bg-blue-100 text-blue-800">
                {tag}
                <button
                  onClick={() => toggleTag(tag)}
                  className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {filters.pricing.map((pricing) => (
              <Badge key={pricing} className="bg-green-100 text-green-800">
                {pricing === 'free' ? '무료' : pricing === 'freemium' ? '프리미엄' : '유료'}
                <button
                  onClick={() => togglePricing(pricing)}
                  className="ml-1 hover:bg-green-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* 로딩 상태 */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600">검색 중...</span>
        </div>
      )}

      {/* 도구 목록 */}
      {!loading && (
        <>
          {tools.length > 0 ? (
            <div className={`grid gap-6 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                : 'grid-cols-1'
            }`}>
              {tools.map(renderToolCard)}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Search className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                검색 결과가 없습니다
              </h3>
              <p className="text-gray-500 mb-4">
                다른 키워드로 검색해보시거나 필터를 조정해보세요.
              </p>
              <Button variant="outline" onClick={resetFilters}>
                필터 초기화
              </Button>
            </div>
          )}

          {/* 페이지네이션 */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center mt-8 gap-2">
              <Button
                variant="outline"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                이전
              </Button>
              
              {/* 페이지 번호들 */}
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const pageNum = Math.max(1, pagination.page - 2) + i
                if (pageNum > pagination.totalPages) return null
                
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === pagination.page ? 'default' : 'outline'}
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </Button>
                )
              })}
              
              <Button
                variant="outline"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
              >
                다음
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default AIToolsGrid
