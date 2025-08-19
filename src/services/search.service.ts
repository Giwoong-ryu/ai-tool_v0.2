/**
 * EasyPick 통합 검색 서비스
 * 목적: FTS + 임베딩 재정렬 파이프라인, 캐싱, 로깅, 성능 최적화
 * 작성자: Claude Data Engineer
 */

import { supabase } from '../lib/supabase';
import { analyticsService } from './analyticsService';

// 검색 결과 타입 정의
export interface SearchResult {
  id: number;
  item_type: 'ai_tool' | 'workflow' | 'prompt_template';
  item_id: string;
  title: string;
  description: string;
  category: string;
  rating: number | null;
  popularity_score: number;
  is_korean: boolean;
  is_popular: boolean;
  tags: string[];
  metadata: Record<string, any>;
  search_type?: 'fts_only' | 'unified';
  fts_rank?: number;
  similarity_score?: number;
  final_score?: number;
  created_at: string;
}

// 검색 옵션
export interface SearchOptions {
  itemTypes?: ('ai_tool' | 'workflow' | 'prompt_template')[];
  category?: string;
  koreanOnly?: boolean;
  popularOnly?: boolean;
  ftsLimit?: number;
  finalLimit?: number;
  similarityThreshold?: number;
  useEmbedding?: boolean;
  enableCache?: boolean;
}

// 검색 통계
export interface SearchStats {
  query: string;
  resultsCount: number;
  searchTimeMs: number;
  searchType: 'fts_only' | 'unified';
  cacheHit: boolean;
}

// 임베딩 캐시 타입
interface EmbeddingCache {
  [query: string]: {
    embedding: number[];
    timestamp: number;
    ttl: number;
  };
}

class SearchService {
  private embeddingCache: EmbeddingCache = {};
  private resultCache: Map<string, { results: SearchResult[]; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5분 캐시
  private readonly EMBEDDING_TTL = 30 * 60 * 1000; // 30분 임베딩 캐시
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initCleanupInterval();
  }

  /**
   * 통합 검색 (FTS + 임베딩 재정렬)
   */
  async search(
    query: string, 
    options: SearchOptions = {}
  ): Promise<{ 
    results: SearchResult[]; 
    stats: SearchStats; 
  }> {
    const startTime = performance.now();
    const cacheKey = this.getCacheKey(query, options);
    
    try {
      // 캐시 확인
      if (options.enableCache !== false) {
        const cached = this.getFromCache(cacheKey);
        if (cached) {
          const stats: SearchStats = {
            query,
            resultsCount: cached.length,
            searchTimeMs: Math.round(performance.now() - startTime),
            searchType: cached[0]?.search_type || 'unified',
            cacheHit: true
          };
          
          // 캐시 히트 로깅 (무거운 작업은 비동기)
          this.logSearchAsync(query, stats, null);
          
          return { results: cached, stats };
        }
      }

      // 임베딩 생성 (선택적)
      let queryEmbedding: number[] | null = null;
      if (options.useEmbedding !== false && query.length > 2) {
        queryEmbedding = await this.getQueryEmbedding(query);
      }

      // 검색 실행
      const results = await this.executeSearch(query, queryEmbedding, options);
      
      const endTime = performance.now();
      const searchTimeMs = Math.round(endTime - startTime);
      
      // 결과 캐싱
      if (options.enableCache !== false && results.length > 0) {
        this.setCache(cacheKey, results);
      }

      const stats: SearchStats = {
        query,
        resultsCount: results.length,
        searchTimeMs,
        searchType: queryEmbedding ? 'unified' : 'fts_only',
        cacheHit: false
      };

      // 검색 로깅 (비동기)
      this.logSearchAsync(query, stats, null);

      return { results, stats };

    } catch (error) {
      console.error('Search error:', error);
      
      // 오류 로깅
      this.logSearchAsync(query, {
        query,
        resultsCount: 0,
        searchTimeMs: Math.round(performance.now() - startTime),
        searchType: 'fts_only',
        cacheHit: false
      }, error as Error);

      // Fallback to simple search
      return this.fallbackSearch(query, options);
    }
  }

  /**
   * FTS 전용 검색 (빠른 응답)
   */
  async searchFTS(
    query: string, 
    options: SearchOptions = {}
  ): Promise<{ results: SearchResult[]; stats: SearchStats }> {
    const startTime = performance.now();
    
    try {
      const { data, error } = await supabase.rpc('search_fts', {
        search_query: query,
        item_types: options.itemTypes || ['ai_tool', 'workflow', 'prompt_template'],
        category_filter: options.category || null,
        korean_only: options.koreanOnly || false,
        popular_only: options.popularOnly || false,
        limit_count: options.finalLimit || 20,
        offset_count: 0
      });

      if (error) throw error;

      const results: SearchResult[] = data || [];
      const searchTimeMs = Math.round(performance.now() - startTime);
      
      const stats: SearchStats = {
        query,
        resultsCount: results.length,
        searchTimeMs,
        searchType: 'fts_only',
        cacheHit: false
      };

      return { results, stats };

    } catch (error) {
      console.error('FTS search error:', error);
      return this.fallbackSearch(query, options);
    }
  }

  /**
   * 사용자 행동 로깅 (클릭, 체류시간)
   */
  async logUserAction(
    query: string,
    clickedItem: {
      itemType: string;
      itemId: string;
      position: number;
    } | null,
    dwellTimeMs: number = 0
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('search_logs')
        .insert({
          session_id: this.sessionId,
          query,
          query_type: 'unified',
          clicked_item_type: clickedItem?.itemType || null,
          clicked_item_id: clickedItem?.itemId || null,
          click_position: clickedItem?.position || null,
          dwell_time_ms: dwellTimeMs,
          results_count: null, // 별도 로그에서 기록됨
          search_time_ms: null
        });

      if (error) {
        console.error('User action logging error:', error);
      }
    } catch (error) {
      console.error('User action logging failed:', error);
    }
  }

  /**
   * 인기 검색어 조회
   */
  async getPopularQueries(limit: number = 10): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('search_logs')
        .select('query')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // 최근 7일
        .not('clicked_item_id', 'is', null) // 클릭이 있었던 검색만
        .order('created_at', { ascending: false });

      if (error) throw error;

      // 쿼리별 빈도 계산
      const queryCount = new Map<string, number>();
      data?.forEach(log => {
        const query = log.query?.trim().toLowerCase();
        if (query && query.length > 1) {
          queryCount.set(query, (queryCount.get(query) || 0) + 1);
        }
      });

      // 빈도순 정렬
      return Array.from(queryCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([query]) => query);

    } catch (error) {
      console.error('Popular queries fetch error:', error);
      return [];
    }
  }

  /**
   * 검색 제안 (자동완성)
   */
  async getSuggestions(query: string, limit: number = 8): Promise<string[]> {
    if (query.length < 2) return [];

    try {
      // 최근 검색어 기반 제안
      const popularQueries = await this.getPopularQueries(50);
      const suggestions = popularQueries
        .filter(q => q.includes(query.toLowerCase()))
        .slice(0, limit);

      // 부족하면 정적 제안 추가
      if (suggestions.length < limit) {
        const staticSuggestions = this.getStaticSuggestions(query);
        suggestions.push(...staticSuggestions.slice(0, limit - suggestions.length));
      }

      return suggestions;
    } catch (error) {
      console.error('Suggestions error:', error);
      return this.getStaticSuggestions(query).slice(0, limit);
    }
  }

  // Private methods

  private async executeSearch(
    query: string, 
    queryEmbedding: number[] | null, 
    options: SearchOptions
  ): Promise<SearchResult[]> {
    if (queryEmbedding) {
      // 통합 검색 (FTS + 임베딩)
      const { data, error } = await supabase.rpc('search_unified', {
        search_query: query,
        query_embedding: JSON.stringify(queryEmbedding),
        item_types: options.itemTypes || ['ai_tool', 'workflow', 'prompt_template'],
        category_filter: options.category || null,
        korean_only: options.koreanOnly || false,
        popular_only: options.popularOnly || false,
        fts_limit: options.ftsLimit || 50,
        final_limit: options.finalLimit || 20,
        similarity_threshold: options.similarityThreshold || 0.1
      });

      if (error) throw error;
      return data || [];
    } else {
      // FTS 전용 검색
      const { data, error } = await supabase.rpc('search_fts', {
        search_query: query,
        item_types: options.itemTypes || ['ai_tool', 'workflow', 'prompt_template'],
        category_filter: options.category || null,
        korean_only: options.koreanOnly || false,
        popular_only: options.popularOnly || false,
        limit_count: options.finalLimit || 20,
        offset_count: 0
      });

      if (error) throw error;
      return data || [];
    }
  }

  private async getQueryEmbedding(query: string): Promise<number[] | null> {
    // 캐시 확인
    const cached = this.embeddingCache[query];
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.embedding;
    }

    try {
      // OpenAI 임베딩 API 호출
      // 실제 구현시에는 환경변수에서 API 키를 가져와야 함
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          input: query,
          model: 'text-embedding-ada-002'
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const embedding = data.data?.[0]?.embedding;

      if (embedding) {
        // 캐시 저장
        this.embeddingCache[query] = {
          embedding,
          timestamp: Date.now(),
          ttl: this.EMBEDDING_TTL
        };
        return embedding;
      }

      return null;
    } catch (error) {
      console.error('Embedding generation error:', error);
      return null; // FTS 전용으로 fallback
    }
  }

  private async fallbackSearch(
    query: string, 
    options: SearchOptions
  ): Promise<{ results: SearchResult[]; stats: SearchStats }> {
    // 간단한 클라이언트 사이드 필터링으로 fallback
    // 실제로는 정적 데이터나 캐시된 결과를 사용
    const startTime = performance.now();
    
    const stats: SearchStats = {
      query,
      resultsCount: 0,
      searchTimeMs: Math.round(performance.now() - startTime),
      searchType: 'fts_only',
      cacheHit: false
    };

    return { results: [], stats };
  }

  private async logSearchAsync(
    query: string, 
    stats: SearchStats, 
    error: Error | null
  ): Promise<void> {
    // 비동기로 로깅하여 사용자 응답 속도에 영향 없도록
    setTimeout(async () => {
      try {
        await supabase.from('search_logs').insert({
          session_id: this.sessionId,
          query,
          query_type: stats.searchType,
          results_count: stats.resultsCount,
          search_time_ms: stats.searchTimeMs,
          filters: {}
        });

        // 분석 이벤트도 전송
        analyticsService.track('search', {
          query,
          results_count: stats.resultsCount,
          search_time_ms: stats.searchTimeMs,
          search_type: stats.searchType,
          cache_hit: stats.cacheHit,
          error: error?.message || null
        });
      } catch (logError) {
        console.error('Search logging failed:', logError);
      }
    }, 0);
  }

  private getCacheKey(query: string, options: SearchOptions): string {
    return `search:${query}:${JSON.stringify(options)}`;
  }

  private getFromCache(key: string): SearchResult[] | null {
    const cached = this.resultCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.results;
    }
    this.resultCache.delete(key);
    return null;
  }

  private setCache(key: string, results: SearchResult[]): void {
    this.resultCache.set(key, {
      results,
      timestamp: Date.now()
    });
  }

  private getStaticSuggestions(query: string): string[] {
    const staticSuggestions = [
      '블로그 글 작성', 'ChatGPT', 'AI 이미지 생성', '번역 도구',
      '프롬프트 템플릿', '워크플로 자동화', '코딩 도우미', 'PPT 제작',
      '요약 도구', '디자인 AI', '음성 인식', '비디오 편집'
    ];

    return staticSuggestions.filter(s => 
      s.toLowerCase().includes(query.toLowerCase())
    );
  }

  private generateSessionId(): string {
    return `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initCleanupInterval(): void {
    // 10분마다 캐시 정리
    setInterval(() => {
      const now = Date.now();
      
      // 결과 캐시 정리
      for (const [key, cached] of this.resultCache.entries()) {
        if (now - cached.timestamp > this.CACHE_TTL) {
          this.resultCache.delete(key);
        }
      }

      // 임베딩 캐시 정리
      for (const [query, cached] of Object.entries(this.embeddingCache)) {
        if (now - cached.timestamp > cached.ttl) {
          delete this.embeddingCache[query];
        }
      }
    }, 10 * 60 * 1000);
  }
}

// 싱글톤 인스턴스
export const searchService = new SearchService();

// 편의성 함수들
export const search = (query: string, options?: SearchOptions) => 
  searchService.search(query, options);

export const searchFTS = (query: string, options?: SearchOptions) => 
  searchService.searchFTS(query, options);

export const getSuggestions = (query: string, limit?: number) =>
  searchService.getSuggestions(query, limit);

export const logUserAction = (
  query: string, 
  clickedItem: { itemType: string; itemId: string; position: number } | null,
  dwellTimeMs?: number
) => searchService.logUserAction(query, clickedItem, dwellTimeMs);