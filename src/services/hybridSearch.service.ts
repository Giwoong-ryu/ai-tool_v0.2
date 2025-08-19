/**
 * Hybrid Search Service
 * Orchestrates FTS + Vector reranking pipeline
 * Performance targets: <300ms total search time
 */

import { supabase } from '@/lib/supabase'

// =====================================================
// Types & Interfaces
// =====================================================

export interface SearchFilters {
  itemTypes?: string[]
  categories?: string[]
  tags?: string[]
}

export interface SearchResult {
  id: string
  item_type: 'tool' | 'workflow' | 'prompt'
  item_id: string
  title: string
  description: string
  category: string
  tags: string[]
  search_rank: number
  popularity_score: number
  final_score: number
  match_type: 'hybrid' | 'fts_only'
}

export interface SearchResponse {
  results: SearchResult[]
  total_count: number
  duration_ms: number
  match_type: 'hybrid' | 'fts_only'
  has_more: boolean
  next_cursor?: string
}

export interface SearchSuggestion {
  suggestion: string
  item_count: number
  category: string
}

export interface SearchMetrics {
  total_queries: number
  avg_duration_ms: number
  p95_duration_ms: number
  avg_results_count: number
  slow_queries_count: number
}

// =====================================================
// Search Service Class
// =====================================================

class HybridSearchService {
  private cache = new Map<string, SearchResponse>()
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes
  private readonly MAX_CACHE_SIZE = 100
  
  /**
   * Primary search method with hybrid FTS + vector reranking
   */
  async search(
    query: string,
    filters: SearchFilters = {},
    options: {
      limit?: number
      useVectorRerank?: boolean
      offset?: number
    } = {}
  ): Promise<SearchResponse> {
    const startTime = performance.now()
    
    try {
      // Check cache first
      const cacheKey = this.buildCacheKey(query, filters, options)
      const cached = this.getFromCache(cacheKey)
      if (cached) {
        return cached
      }

      // Generate query embedding if vector reranking is enabled
      let queryEmbedding: number[] | null = null
      if (options.useVectorRerank !== false && query.trim().length > 0) {
        queryEmbedding = await this.generateEmbedding(query)
      }

      // Execute hybrid search
      const { data, error } = await supabase.rpc('hybrid_search', {
        query_input: query,
        query_embedding_input: queryEmbedding,
        item_types: filters.itemTypes,
        categories: filters.categories,
        tags_filter: filters.tags,
        fts_limit: 100, // Get broad candidates
        final_limit: options.limit || 20,
        use_vector_rerank: queryEmbedding !== null
      })

      if (error) {
        console.error('Hybrid search error:', error)
        throw new Error(`Search failed: ${error.message}`)
      }

      const duration = performance.now() - startTime
      const response: SearchResponse = {
        results: data || [],
        total_count: data?.length || 0,
        duration_ms: Math.round(duration),
        match_type: data?.[0]?.match_type || 'fts_only',
        has_more: (data?.length || 0) >= (options.limit || 20),
        next_cursor: this.buildNextCursor(options.offset || 0, options.limit || 20)
      }

      // Cache successful results
      this.setCache(cacheKey, response)
      
      return response
    } catch (error) {
      console.error('Search service error:', error)
      throw error
    }
  }

  /**
   * Fast FTS-only search for immediate feedback
   */
  async searchFTS(
    query: string,
    filters: SearchFilters = {},
    limit: number = 20,
    offset: number = 0
  ): Promise<SearchResult[]> {
    const { data, error } = await supabase.rpc('search_fts', {
      query_input: query,
      item_types: filters.itemTypes,
      categories: filters.categories,
      tags_filter: filters.tags,
      limit_count: limit,
      offset_count: offset
    })

    if (error) {
      console.error('FTS search error:', error)
      throw new Error(`FTS search failed: ${error.message}`)
    }

    return data?.map(item => ({
      ...item,
      final_score: item.ts_rank,
      match_type: 'fts_only' as const
    })) || []
  }

  /**
   * Get search suggestions for autocomplete
   */
  async getSuggestions(
    partialQuery: string,
    limit: number = 10
  ): Promise<SearchSuggestion[]> {
    if (partialQuery.length < 2) return []

    const cacheKey = `suggestions:${partialQuery}:${limit}`
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached as SearchSuggestion[]

    const { data, error } = await supabase.rpc('get_search_suggestions', {
      partial_query: partialQuery,
      limit_count: limit
    })

    if (error) {
      console.error('Suggestions error:', error)
      return []
    }

    const suggestions = data || []
    this.setCache(cacheKey, suggestions, 10 * 60 * 1000) // 10 minute cache for suggestions
    
    return suggestions
  }

  /**
   * Get search performance metrics
   */
  async getMetrics(hoursBack: number = 24): Promise<SearchMetrics> {
    const { data, error } = await supabase.rpc('get_search_metrics', {
      hours_back: hoursBack
    })

    if (error) {
      console.error('Metrics error:', error)
      throw new Error(`Metrics failed: ${error.message}`)
    }

    return data?.[0] || {
      total_queries: 0,
      avg_duration_ms: 0,
      p95_duration_ms: 0,
      avg_results_count: 0,
      slow_queries_count: 0
    }
  }

  // =====================================================
  // Private Helper Methods
  // =====================================================

  /**
   * Generate embedding using OpenAI API
   * TODO: Replace with your embedding service
   */
  private async generateEmbedding(text: string): Promise<number[] | null> {
    try {
      // This would typically call your embedding service
      // For now, return null to use FTS-only mode
      console.warn('Embedding generation not implemented - using FTS-only mode')
      return null
      
      // Example implementation:
      // const response = await fetch('/api/embeddings', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ text })
      // })
      // const { embedding } = await response.json()
      // return embedding
    } catch (error) {
      console.error('Embedding generation failed:', error)
      return null
    }
  }

  private buildCacheKey(
    query: string, 
    filters: SearchFilters, 
    options: any
  ): string {
    return `search:${query}:${JSON.stringify(filters)}:${JSON.stringify(options)}`
  }

  private getFromCache(key: string): any {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data
    }
    this.cache.delete(key)
    return null
  }

  private setCache(key: string, data: any, ttl: number = this.CACHE_TTL): void {
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  private buildNextCursor(offset: number, limit: number): string {
    return Buffer.from(JSON.stringify({ offset: offset + limit })).toString('base64')
  }

  /**
   * Clear cache manually
   */
  clearCache(): void {
    this.cache.clear()
  }
}

// =====================================================
// Singleton Export
// =====================================================

export const hybridSearchService = new HybridSearchService()
export default hybridSearchService