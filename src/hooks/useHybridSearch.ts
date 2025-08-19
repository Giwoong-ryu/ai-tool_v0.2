/**
 * Custom Hook for Hybrid Search
 * Manages search state, caching, and performance optimization
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import { hybridSearchService, SearchResult, SearchFilters, SearchResponse } from '@/services/hybridSearch.service'

// =====================================================
// Types & Interfaces
// =====================================================

interface UseHybridSearchOptions {
  enableVectorRerank?: boolean
  debounceMs?: number
  initialLimit?: number
  autoSearch?: boolean
}

interface SearchState {
  query: string
  results: SearchResult[]
  suggestions: string[]
  isLoading: boolean
  isSuggesting: boolean
  hasMore: boolean
  error: string | null
  totalCount: number
  duration: number
  matchType: 'hybrid' | 'fts_only' | null
}

interface UseHybridSearchReturn extends SearchState {
  // Search actions
  search: (query: string, filters?: SearchFilters) => Promise<void>
  loadMore: () => Promise<void>
  clearResults: () => void
  
  // Filter actions
  setFilters: (filters: SearchFilters) => void
  filters: SearchFilters
  
  // Suggestion actions
  getSuggestions: (partial: string) => Promise<void>
  
  // Performance monitoring
  getMetrics: () => Promise<void>
  metrics: any
}

// =====================================================
// Custom Hook Implementation
// =====================================================

export const useHybridSearch = (options: UseHybridSearchOptions = {}): UseHybridSearchReturn => {
  const {
    enableVectorRerank = true,
    debounceMs = 300,
    initialLimit = 20,
    autoSearch = false
  } = options

  // =====================================================
  // State Management
  // =====================================================

  const [state, setState] = useState<SearchState>({
    query: '',
    results: [],
    suggestions: [],
    isLoading: false,
    isSuggesting: false,
    hasMore: false,
    error: null,
    totalCount: 0,
    duration: 0,
    matchType: null
  })

  const [filters, setFilters] = useState<SearchFilters>({})
  const [metrics, setMetrics] = useState<any>(null)

  // Refs for managing async operations
  const abortControllerRef = useRef<AbortController | null>(null)
  const currentOffsetRef = useRef(0)

  // Debounced query for auto-search
  const debouncedQuery = useDebounce(state.query, debounceMs)

  // =====================================================
  // Search Functions
  // =====================================================

  const search = useCallback(async (
    query: string, 
    newFilters: SearchFilters = {}
  ): Promise<void> => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Reset state for new search
    currentOffsetRef.current = 0
    setState(prev => ({
      ...prev,
      query,
      isLoading: true,
      error: null,
      results: [],
      hasMore: false
    }))

    const combinedFilters = { ...filters, ...newFilters }

    try {
      const startTime = performance.now()
      
      const response = await hybridSearchService.search(query, combinedFilters, {
        limit: initialLimit,
        useVectorRerank: enableVectorRerank,
        offset: 0
      })

      const duration = performance.now() - startTime

      setState(prev => ({
        ...prev,
        results: response.results,
        totalCount: response.total_count,
        hasMore: response.has_more,
        isLoading: false,
        duration: Math.round(duration),
        matchType: response.match_type
      }))

      currentOffsetRef.current = response.results.length

    } catch (error) {
      console.error('Search error:', error)
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Search failed'
      }))
    }
  }, [filters, initialLimit, enableVectorRerank])

  const loadMore = useCallback(async (): Promise<void> => {
    if (!state.hasMore || state.isLoading) return

    setState(prev => ({ ...prev, isLoading: true }))

    try {
      const response = await hybridSearchService.search(state.query, filters, {
        limit: initialLimit,
        useVectorRerank: enableVectorRerank,
        offset: currentOffsetRef.current
      })

      setState(prev => ({
        ...prev,
        results: [...prev.results, ...response.results],
        hasMore: response.has_more,
        isLoading: false
      }))

      currentOffsetRef.current += response.results.length

    } catch (error) {
      console.error('Load more error:', error)
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Load more failed'
      }))
    }
  }, [state.query, state.hasMore, state.isLoading, filters, initialLimit, enableVectorRerank])

  const clearResults = useCallback(() => {
    setState(prev => ({
      ...prev,
      query: '',
      results: [],
      suggestions: [],
      hasMore: false,
      error: null,
      totalCount: 0,
      duration: 0,
      matchType: null
    }))
    currentOffsetRef.current = 0
  }, [])

  // =====================================================
  // Suggestion Functions
  // =====================================================

  const getSuggestions = useCallback(async (partial: string): Promise<void> => {
    if (partial.length < 2) {
      setState(prev => ({ ...prev, suggestions: [] }))
      return
    }

    setState(prev => ({ ...prev, isSuggesting: true }))

    try {
      const suggestions = await hybridSearchService.getSuggestions(partial, 8)
      setState(prev => ({
        ...prev,
        suggestions: suggestions.map(s => s.suggestion),
        isSuggesting: false
      }))
    } catch (error) {
      console.error('Suggestions error:', error)
      setState(prev => ({
        ...prev,
        suggestions: [],
        isSuggesting: false
      }))
    }
  }, [])

  // =====================================================
  // Performance Monitoring
  // =====================================================

  const getMetrics = useCallback(async (): Promise<void> => {
    try {
      const metricsData = await hybridSearchService.getMetrics(24)
      setMetrics(metricsData)
    } catch (error) {
      console.error('Metrics error:', error)
    }
  }, [])

  // =====================================================
  // Effects
  // =====================================================

  // Auto-search on debounced query change
  useEffect(() => {
    if (autoSearch && debouncedQuery && debouncedQuery !== state.query) {
      search(debouncedQuery)
    }
  }, [debouncedQuery, autoSearch, search])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // =====================================================
  // Helper Functions
  // =====================================================

  const updateQuery = useCallback((newQuery: string) => {
    setState(prev => ({ ...prev, query: newQuery }))
  }, [])

  // =====================================================
  // Return Hook Interface
  // =====================================================

  return {
    // State
    ...state,
    filters,
    metrics,

    // Actions
    search,
    loadMore,
    clearResults,
    setFilters,
    getSuggestions,
    getMetrics,

    // For controlled input
    query: state.query,
    setQuery: updateQuery
  }
}

// =====================================================
// Debounce Hook (if not already available)
// =====================================================

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export default useHybridSearch