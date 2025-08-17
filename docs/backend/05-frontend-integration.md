# Search V2 프론트엔드 연동 가이드

Search V2 백엔드 API와 프론트엔드 통합을 위한 완전한 연동 가이드입니다.

## API 클라이언트 설정

### 기본 API 클라이언트

```typescript
// src/services/searchV2Service.ts
interface SearchV2Config {
  baseURL: string
  timeout: number
  retries: number
}

const config: SearchV2Config = {
  baseURL: process.env.VITE_API_BASE_URL || '/api',
  timeout: 5000,
  retries: 2
}

// 응답 타입 정의
export interface SearchItem {
  id: string
  type: 'tool' | 'template' | 'workflow'
  title: string
  summary: string
  tags: string[]
  body: Record<string, any>
  score: {
    fts_rank: number
    vector_similarity: number
    combined_score: number
  }
  created_at: string
  updated_at: string
}

export interface SearchResponse {
  items: SearchItem[]
  pagination: {
    page: number
    size: number
    total: number
    pages: number
  }
  performance: {
    took_ms: number
    stages: {
      fts_ms: number
      vector_ms: number
      total_candidates: number
    }
  }
}

export interface SuggestionsResponse {
  suggestions: Array<{
    id: string
    title: string
    type: 'tool' | 'template' | 'workflow'
    summary: string
    match_reason: 'title' | 'summary' | 'tags'
  }>
  took_ms: number
}

export interface SearchParams {
  q?: string
  page?: number
  size?: number
  type?: 'tool' | 'template' | 'workflow'
}

// HTTP 클라이언트 설정
class SearchV2Client {
  private baseURL: string
  private timeout: number
  private retries: number

  constructor(config: SearchV2Config) {
    this.baseURL = config.baseURL
    this.timeout = config.timeout
    this.retries = config.retries
  }

  private async request<T>(
    endpoint: string, 
    params: Record<string, any> = {}
  ): Promise<T> {
    const url = new URL(endpoint, this.baseURL)
    
    // 쿼리 파라미터 추가
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.append(key, String(value))
      }
    })

    let lastError: Error

    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), this.timeout)

        const response = await fetch(url.toString(), {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error?.message || `HTTP ${response.status}`)
        }

        return await response.json()
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error')
        
        if (attempt < this.retries && this.isRetryableError(lastError)) {
          await this.delay(1000 * attempt)
          continue
        }
        
        throw lastError
      }
    }

    throw lastError!
  }

  private isRetryableError(error: Error): boolean {
    return error.name === 'AbortError' || 
           error.message.includes('network') ||
           error.message.includes('timeout')
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async search(params: SearchParams): Promise<SearchResponse> {
    return this.request<SearchResponse>('/search', params)
  }

  async getSuggestions(query: string, limit: number = 8): Promise<SuggestionsResponse> {
    return this.request<SuggestionsResponse>('/search/suggestions', { q: query, limit })
  }

  async healthCheck(): Promise<{ status: string }> {
    try {
      const response = await fetch(`${this.baseURL}/search`, { method: 'HEAD' })
      return { status: response.ok ? 'healthy' : 'unhealthy' }
    } catch {
      return { status: 'unhealthy' }
    }
  }
}

export const searchV2Client = new SearchV2Client(config)
```

## React Hook 구현

### 검색 상태 관리 Hook

```typescript
// src/hooks/useSearchV2.ts
import { useState, useEffect, useCallback, useRef } from 'react'
import { searchV2Client, SearchParams, SearchResponse, SearchItem } from '../services/searchV2Service'

interface UseSearchV2Options {
  debounceMs?: number
  autoSearch?: boolean
  initialParams?: SearchParams
}

interface UseSearchV2Return {
  // 상태
  results: SearchItem[]
  loading: boolean
  error: string | null
  pagination: SearchResponse['pagination'] | null
  performance: SearchResponse['performance'] | null
  
  // 액션
  search: (params: SearchParams) => Promise<void>
  clearResults: () => void
  loadMore: () => Promise<void>
  
  // 현재 파라미터
  currentParams: SearchParams
}

export function useSearchV2(options: UseSearchV2Options = {}): UseSearchV2Return {
  const {
    debounceMs = 300,
    autoSearch = false,
    initialParams = {}
  } = options

  // 상태 관리
  const [results, setResults] = useState<SearchItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<SearchResponse['pagination'] | null>(null)
  const [performance, setPerformance] = useState<SearchResponse['performance'] | null>(null)
  const [currentParams, setCurrentParams] = useState<SearchParams>(initialParams)

  // 디바운스 및 요청 관리
  const debounceRef = useRef<NodeJS.Timeout>()
  const abortControllerRef = useRef<AbortController>()

  const search = useCallback(async (params: SearchParams) => {
    // 이전 요청 취소
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // 디바운스 클리어
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    setCurrentParams(params)
    setError(null)

    // 빈 쿼리 처리
    if (!params.q?.trim() && !autoSearch) {
      setResults([])
      setPagination(null)
      setPerformance(null)
      return
    }

    const executeSearch = async () => {
      setLoading(true)
      abortControllerRef.current = new AbortController()

      try {
        const response = await searchV2Client.search({
          ...params,
          page: params.page || 1,
          size: params.size || 30
        })

        // 페이지가 1이면 새로운 결과, 아니면 추가
        if ((params.page || 1) === 1) {
          setResults(response.items)
        } else {
          setResults(prev => [...prev, ...response.items])
        }

        setPagination(response.pagination)
        setPerformance(response.performance)
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setError(err.message || '검색 중 오류가 발생했습니다')
        }
      } finally {
        setLoading(false)
        abortControllerRef.current = null
      }
    }

    // 디바운스 적용
    if (debounceMs > 0 && params.q) {
      debounceRef.current = setTimeout(executeSearch, debounceMs)
    } else {
      await executeSearch()
    }
  }, [debounceMs, autoSearch])

  const clearResults = useCallback(() => {
    setResults([])
    setPagination(null)
    setPerformance(null)
    setError(null)
    setCurrentParams({})
  }, [])

  const loadMore = useCallback(async () => {
    if (!pagination || pagination.page >= pagination.pages || loading) {
      return
    }

    await search({
      ...currentParams,
      page: pagination.page + 1
    })
  }, [search, currentParams, pagination, loading])

  // 정리 함수
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    results,
    loading,
    error,
    pagination,
    performance,
    search,
    clearResults,
    loadMore,
    currentParams
  }
}
```

### 제안(Suggestions) Hook

```typescript
// src/hooks/useSearchV2Suggestions.ts
import { useState, useEffect, useCallback, useRef } from 'react'
import { searchV2Client, SuggestionsResponse } from '../services/searchV2Service'

interface UseSearchV2SuggestionsOptions {
  debounceMs?: number
  minQueryLength?: number
  maxSuggestions?: number
}

interface UseSearchV2SuggestionsReturn {
  suggestions: SuggestionsResponse['suggestions']
  loading: boolean
  error: string | null
  getSuggestions: (query: string) => Promise<void>
  clearSuggestions: () => void
}

export function useSearchV2Suggestions(
  options: UseSearchV2SuggestionsOptions = {}
): UseSearchV2SuggestionsReturn {
  const {
    debounceMs = 150,
    minQueryLength = 1,
    maxSuggestions = 8
  } = options

  const [suggestions, setSuggestions] = useState<SuggestionsResponse['suggestions']>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const debounceRef = useRef<NodeJS.Timeout>()
  const abortControllerRef = useRef<AbortController>()

  const getSuggestions = useCallback(async (query: string) => {
    // 이전 요청 취소
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    setError(null)

    if (!query.trim() || query.length < minQueryLength) {
      setSuggestions([])
      return
    }

    const executeSuggestions = async () => {
      setLoading(true)
      abortControllerRef.current = new AbortController()

      try {
        const response = await searchV2Client.getSuggestions(query, maxSuggestions)
        setSuggestions(response.suggestions)
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setError(err.message || '제안 검색 중 오류가 발생했습니다')
          setSuggestions([])
        }
      } finally {
        setLoading(false)
        abortControllerRef.current = null
      }
    }

    debounceRef.current = setTimeout(executeSuggestions, debounceMs)
  }, [debounceMs, minQueryLength, maxSuggestions])

  const clearSuggestions = useCallback(() => {
    setSuggestions([])
    setError(null)
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    suggestions,
    loading,
    error,
    getSuggestions,
    clearSuggestions
  }
}
```

## 검색 컴포넌트 통합

### SearchHubV2 메인 컴포넌트 업데이트

```typescript
// src/components/search-v2/SearchHubV2.tsx
import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useSearchV2 } from '../../hooks/useSearchV2'
import { SearchInput } from './SearchInput'
import { SearchResults } from './SearchResults'
import { SearchFilters } from './SearchFilters'
import { SearchPerformance } from './SearchPerformance'

export function SearchHubV2() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)

  // URL 파라미터에서 초기 상태 설정
  const initialQuery = searchParams.get('q') || ''
  const initialType = searchParams.get('type') as 'tool' | 'template' | 'workflow' | undefined
  const initialPage = parseInt(searchParams.get('page') || '1')

  const {
    results,
    loading,
    error,
    pagination,
    performance,
    search,
    clearResults,
    loadMore,
    currentParams
  } = useSearchV2({
    debounceMs: 300,
    autoSearch: true,
    initialParams: {
      q: initialQuery,
      type: initialType,
      page: initialPage
    }
  })

  // 초기 검색 실행
  useEffect(() => {
    if (initialQuery || initialType) {
      search({
        q: initialQuery,
        type: initialType,
        page: 1
      })
    }
  }, []) // 빈 의존성 배열로 한 번만 실행

  // URL 파라미터 동기화
  const updateURLParams = (params: { q?: string; type?: string; page?: number }) => {
    const newSearchParams = new URLSearchParams(searchParams)
    
    Object.entries(params).forEach(([key, value]) => {
      if (value && value !== '') {
        newSearchParams.set(key, String(value))
      } else {
        newSearchParams.delete(key)
      }
    })

    setSearchParams(newSearchParams)
  }

  const handleSearch = async (query: string) => {
    const searchParams = {
      q: query,
      type: currentParams.type,
      page: 1
    }

    await search(searchParams)
    updateURLParams(searchParams)
  }

  const handleFilterChange = async (type: string) => {
    const filterType = type === 'all' ? undefined : type as 'tool' | 'template' | 'workflow'
    const searchParams = {
      q: currentParams.q,
      type: filterType,
      page: 1
    }

    await search(searchParams)
    updateURLParams(searchParams)
  }

  const handleItemClick = (item: any) => {
    setSelectedItem(item)
    setIsDetailOpen(true)
  }

  const handleLoadMore = async () => {
    await loadMore()
    updateURLParams({
      ...currentParams,
      page: (pagination?.page || 1) + 1
    })
  }

  return (
    <div className="search-hub-v2">
      {/* 검색 입력 */}
      <div className="search-input-container">
        <SearchInput
          initialValue={initialQuery}
          onSearch={handleSearch}
          loading={loading}
        />
      </div>

      {/* 필터 */}
      <div className="search-filters-container">
        <SearchFilters
          selectedType={currentParams.type || 'all'}
          onTypeChange={handleFilterChange}
          resultCount={pagination?.total || 0}
        />
      </div>

      {/* 성능 정보 (개발 환경에서만) */}
      {process.env.NODE_ENV === 'development' && performance && (
        <SearchPerformance performance={performance} />
      )}

      {/* 오류 메시지 */}
      {error && (
        <div className="search-error">
          <p>⚠️ {error}</p>
          <button onClick={() => search(currentParams)}>
            다시 시도
          </button>
        </div>
      )}

      {/* 검색 결과 */}
      <div className="search-results-container">
        <SearchResults
          items={results}
          loading={loading}
          onItemClick={handleItemClick}
          onLoadMore={pagination && pagination.page < pagination.pages ? handleLoadMore : undefined}
          hasMore={pagination ? pagination.page < pagination.pages : false}
        />
      </div>

      {/* 상세 모달 */}
      {isDetailOpen && selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          onClose={() => setIsDetailOpen(false)}
        />
      )}
    </div>
  )
}
```

### SearchInput 컴포넌트 (Combobox 패턴)

```typescript
// src/components/search-v2/SearchInput.tsx
import React, { useState, useRef, useEffect } from 'react'
import { useSearchV2Suggestions } from '../../hooks/useSearchV2Suggestions'

interface SearchInputProps {
  initialValue?: string
  onSearch: (query: string) => void
  loading?: boolean
}

export function SearchInput({ initialValue = '', onSearch, loading = false }: SearchInputProps) {
  const [query, setQuery] = useState(initialValue)
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  const inputRef = useRef<HTMLInputElement>(null)
  const listboxRef = useRef<HTMLUListElement>(null)

  const {
    suggestions,
    loading: suggestionsLoading,
    getSuggestions,
    clearSuggestions
  } = useSearchV2Suggestions({
    debounceMs: 150,
    minQueryLength: 1,
    maxSuggestions: 8
  })

  // 입력 변경 처리
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    setActiveIndex(-1)

    if (value.trim()) {
      getSuggestions(value)
      setIsOpen(true)
    } else {
      clearSuggestions()
      setIsOpen(false)
    }
  }

  // 검색 실행
  const executeSearch = (searchQuery: string = query) => {
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim())
      setIsOpen(false)
      setActiveIndex(-1)
      inputRef.current?.blur()
    }
  }

  // 키보드 네비게이션
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter') {
        executeSearch()
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        )
        break
      
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        )
        break
      
      case 'Enter':
        e.preventDefault()
        if (activeIndex >= 0 && suggestions[activeIndex]) {
          const selectedItem = suggestions[activeIndex]
          setQuery(selectedItem.title)
          executeSearch(selectedItem.title)
        } else {
          executeSearch()
        }
        break
      
      case 'Escape':
        setIsOpen(false)
        setActiveIndex(-1)
        break
    }
  }

  // 제안 항목 클릭
  const handleSuggestionClick = (suggestion: any) => {
    setQuery(suggestion.title)
    executeSearch(suggestion.title)
  }

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current && 
        !inputRef.current.contains(event.target as Node) &&
        listboxRef.current &&
        !listboxRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
        setActiveIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 활성 항목 스크롤 처리
  useEffect(() => {
    if (activeIndex >= 0 && listboxRef.current) {
      const activeElement = listboxRef.current.children[activeIndex] as HTMLElement
      if (activeElement) {
        activeElement.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [activeIndex])

  const showSuggestions = isOpen && suggestions.length > 0

  return (
    <div className="search-input-wrapper">
      {/* Combobox 입력 */}
      <div 
        role="combobox"
        aria-expanded={showSuggestions}
        aria-owns={showSuggestions ? "hub-suggest-listbox" : undefined}
        aria-controls={showSuggestions ? "hub-suggest-listbox" : undefined}
        aria-activedescendant={
          activeIndex >= 0 ? `hub-suggest-listbox-opt-${activeIndex}` : undefined
        }
        className="search-input-combobox"
      >
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="AI 도구, 템플릿, 워크플로우 검색..."
          aria-label="AI 도구 검색"
          aria-autocomplete="list"
          className="search-input"
          disabled={loading}
        />
        
        {/* 검색 버튼 */}
        <button
          onClick={() => executeSearch()}
          disabled={loading || !query.trim()}
          className="search-button"
          aria-label="검색 실행"
        >
          {loading ? '검색중...' : '🔍'}
        </button>
      </div>

      {/* 제안 목록 */}
      {showSuggestions && (
        <ul
          ref={listboxRef}
          id="hub-suggest-listbox"
          role="listbox"
          aria-label="검색 제안"
          className="suggestions-list"
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion.id}
              id={`hub-suggest-listbox-opt-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              onClick={() => handleSuggestionClick(suggestion)}
              className={`suggestion-item ${index === activeIndex ? 'active' : ''}`}
            >
              <div className="suggestion-content">
                <span className="suggestion-title">{suggestion.title}</span>
                <span className="suggestion-type">{suggestion.type}</span>
              </div>
              <div className="suggestion-summary">{suggestion.summary}</div>
            </li>
          ))}
        </ul>
      )}

      {/* 로딩 인디케이터 */}
      {suggestionsLoading && (
        <div className="suggestions-loading">
          제안 검색 중...
        </div>
      )}
    </div>
  )
}
```

## 상태 관리 통합 (Zustand)

### SearchV2 Store

```typescript
// src/store/searchV2Store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { SearchItem, SearchParams } from '../services/searchV2Service'

interface SearchHistory {
  query: string
  timestamp: number
  resultCount: number
}

interface RecentlyViewed {
  item: SearchItem
  timestamp: number
}

interface SearchV2Store {
  // 검색 히스토리
  searchHistory: SearchHistory[]
  addToHistory: (query: string, resultCount: number) => void
  clearHistory: () => void
  
  // 최근 본 아이템
  recentlyViewed: RecentlyViewed[]
  addToRecentlyViewed: (item: SearchItem) => void
  clearRecentlyViewed: () => void
  
  // 즐겨찾기
  favorites: string[]
  toggleFavorite: (itemId: string) => void
  isFavorite: (itemId: string) => boolean
  
  // 검색 설정
  searchSettings: {
    resultsPerPage: number
    autoSuggestions: boolean
    saveHistory: boolean
  }
  updateSettings: (settings: Partial<SearchV2Store['searchSettings']>) => void
}

export const useSearchV2Store = create<SearchV2Store>()(
  persist(
    (set, get) => ({
      // 검색 히스토리
      searchHistory: [],
      addToHistory: (query, resultCount) => {
        if (!get().searchSettings.saveHistory) return
        
        set(state => ({
          searchHistory: [
            { query, resultCount, timestamp: Date.now() },
            ...state.searchHistory.filter(h => h.query !== query).slice(0, 19)
          ]
        }))
      },
      clearHistory: () => set({ searchHistory: [] }),

      // 최근 본 아이템
      recentlyViewed: [],
      addToRecentlyViewed: (item) => {
        set(state => ({
          recentlyViewed: [
            { item, timestamp: Date.now() },
            ...state.recentlyViewed.filter(rv => rv.item.id !== item.id).slice(0, 49)
          ]
        }))
      },
      clearRecentlyViewed: () => set({ recentlyViewed: [] }),

      // 즐겨찾기
      favorites: [],
      toggleFavorite: (itemId) => {
        set(state => ({
          favorites: state.favorites.includes(itemId)
            ? state.favorites.filter(id => id !== itemId)
            : [...state.favorites, itemId]
        }))
      },
      isFavorite: (itemId) => get().favorites.includes(itemId),

      // 검색 설정
      searchSettings: {
        resultsPerPage: 30,
        autoSuggestions: true,
        saveHistory: true
      },
      updateSettings: (settings) => {
        set(state => ({
          searchSettings: { ...state.searchSettings, ...settings }
        }))
      }
    }),
    {
      name: 'search-v2-store',
      version: 1
    }
  )
)
```

## 애널리틱스 통합

### 검색 이벤트 추적

```typescript
// src/utils/searchAnalytics.ts
interface SearchEvent {
  event_name: string
  search_term?: string
  results_count?: number
  response_time_ms?: number
  selected_item_id?: string
  selected_item_type?: string
  search_filters?: Record<string, any>
}

class SearchAnalytics {
  private isEnabled: boolean

  constructor() {
    this.isEnabled = !!window.gtag || !!window.dataLayer
  }

  trackSearch(params: {
    query: string
    resultsCount: number
    responseTime: number
    filters?: Record<string, any>
  }) {
    if (!this.isEnabled) return

    const event: SearchEvent = {
      event_name: 'search',
      search_term: params.query,
      results_count: params.resultsCount,
      response_time_ms: params.responseTime,
      search_filters: params.filters
    }

    this.sendEvent(event)
  }

  trackItemClick(params: {
    itemId: string
    itemType: string
    query: string
    position: number
  }) {
    if (!this.isEnabled) return

    const event: SearchEvent = {
      event_name: 'search_result_click',
      selected_item_id: params.itemId,
      selected_item_type: params.itemType,
      search_term: params.query
    }

    this.sendEvent(event)
  }

  trackSuggestionClick(params: {
    suggestion: string
    originalQuery: string
  }) {
    if (!this.isEnabled) return

    const event: SearchEvent = {
      event_name: 'search_suggestion_click',
      search_term: params.suggestion
    }

    this.sendEvent(event)
  }

  private sendEvent(event: SearchEvent) {
    // Google Analytics 4
    if (window.gtag) {
      window.gtag('event', event.event_name, {
        custom_map: event,
        send_to: 'GA_MEASUREMENT_ID'
      })
    }

    // 커스텀 애널리틱스
    if (window.dataLayer) {
      window.dataLayer.push({
        event: event.event_name,
        ...event
      })
    }

    // 개발 환경에서 로그
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Search Analytics:', event)
    }
  }
}

export const searchAnalytics = new SearchAnalytics()
```

## 에러 바운더리 및 폴백

### SearchV2 에러 바운더리

```typescript
// src/components/search-v2/SearchV2ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class SearchV2ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('SearchV2 Error:', error, errorInfo)
    
    // 에러 리포팅 서비스로 전송
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: error.message,
        fatal: false
      })
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="search-v2-error-boundary">
          <h3>⚠️ 검색 기능에 문제가 발생했습니다</h3>
          <p>잠시 후 다시 시도해주세요.</p>
          <button onClick={this.handleRetry}>
            다시 시도
          </button>
          <details>
            <summary>오류 세부사항</summary>
            <pre>{this.state.error?.message}</pre>
          </details>
        </div>
      )
    }

    return this.props.children
  }
}
```

## 배포 및 환경 설정

### 환경 변수 설정

```bash
# .env.production
VITE_API_BASE_URL=https://api.easyick.com
VITE_SEARCH_TIMEOUT=5000
VITE_SEARCH_RETRIES=2
VITE_ENABLE_SEARCH_ANALYTICS=true
VITE_SEARCH_DEBUG=false

# .env.development
VITE_API_BASE_URL=http://localhost:3000/api
VITE_SEARCH_TIMEOUT=10000
VITE_SEARCH_RETRIES=3
VITE_ENABLE_SEARCH_ANALYTICS=true
VITE_SEARCH_DEBUG=true
```

### Vite 프록시 설정 (개발 환경)

```typescript
// vite.config.ts
export default defineConfig({
  // ... 기존 설정
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
```

### 프로덕션 빌드 최적화

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'search-v2': [
            './src/services/searchV2Service.ts',
            './src/hooks/useSearchV2.ts',
            './src/components/search-v2/SearchHubV2.tsx'
          ]
        }
      }
    }
  }
})
```

---

> 다음 단계: 백엔드 테스트 스펙 및 벤치마크 가이드 작성 (06-backend-testing.md)