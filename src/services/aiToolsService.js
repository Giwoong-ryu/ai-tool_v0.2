// src/services/aiToolsService.js
import { supabase } from '../lib/supabase.js'
import { ACTIVITY_TYPES } from '../lib/supabase.js'

// === [ADD] 간단 동의어 사전 & 질의 확장 ===
const SYN = {
  '보고서': ['문서', '문서 작성', '리포트', '레포트', '보고', '문서화'],
  '문서': ['보고서', '리포트', '문서 작성'],
  '이미지': ['그림', '사진', '디자인'],
  '영상': ['동영상', '비디오', '편집'],
  '발표': ['프레젠테이션', 'PPT', '슬라이드'],
  '코딩': ['개발', '프로그래밍', '코드'],
  '채용': ['고용', '인사', '이력서'],
  '검색': ['서치', '찾기']
  // 필요 시 계속 보강
};

function expandQuery(q) {
  const terms = q.trim().split(/\s+/);
  const bag = new Set();
  for (const t of terms) {
    bag.add(t);
    const syns = SYN[t] || [];
    for (const s of syns) bag.add(s);
  }
  return Array.from(bag);
}

// === [REPLACE] 검색 함수 ===
export async function searchTools(query, filters = {}, options = {}) {
  console.log('searchTools called with:', { query, filters, options });
  let qb = supabase.from('ai_tools').select('*', { count: 'exact' });

  // Apply search query
  if (query && query.trim()) {
    const terms = expandQuery(query);
    console.log('Expanded terms:', terms);

    const searchColumns = ['name', 'description', 'category', 'subcategory'];

    const orConditions = [];

    terms.forEach(term => {
      const p = `%${term.toLowerCase()}%`;
      searchColumns.forEach(column => {
        orConditions.push(`${column}.ilike.${p}`);
      });
    });
    console.log('Generated OR conditions:', orConditions);
    qb = qb.or(orConditions.join(','));
  }

  // Apply filters
  if (filters.category && filters.category !== 'all') {
    qb = qb.eq('category', filters.category);
  }
  if (filters.subcategory) {
    qb = qb.eq('subcategory', filters.subcategory);
  }
  if (filters.pricing && filters.pricing.length > 0) {
    qb = qb.in('pricing_type', filters.pricing);
  }
  if (filters.minRating && filters.minRating > 0) {
    qb = qb.gte('rating', filters.minRating);
  }
  if (filters.verifiedOnly) {
    qb = qb.eq('is_verified', true);
  }
  if (filters.featuredOnly) {
    qb = qb.eq('is_featured', true);
  }
  if (filters.tags && filters.tags.length > 0) {
    qb = qb.overlaps('tags', filters.tags);
  }

  // Apply sorting
  const sortBy = options.sortBy || 'popularity';
  switch (sortBy) {
    case 'rating':
      qb = qb.order('rating', { ascending: false });
      break;
    case 'newest':
      qb = qb.order('created_at', { ascending: false });
      break;
    case 'name':
      qb = qb.order('name', { ascending: true });
      break;
    case 'views':
      qb = qb.order('view_count', { ascending: false });
      break;
    case 'bookmarks':
      qb = qb.order('bookmark_count', { ascending: false });
      break;
    default: // popularity
      qb = qb.order('view_count', { ascending: false });
      qb = qb.order('rating', { ascending: false });
  }

  // Apply pagination
  const page = options.page || 1;
  const limit = options.limit || 50; // Default to 50 for search results
  const offset = (page - 1) * limit;
  qb = qb.range(offset, offset + limit - 1);

  const { data, error, count } = await qb;
  console.log('Supabase raw response data:', data);
  console.log('Supabase error:', error);
  console.log('Supabase count:', count);

  if (error) {
    console.error('Search tools error:', error);
    return {
      data: [],
      count: 0,
      page: 1,
      limit: limit,
      totalPages: 0,
      error
    };
  }

  return {
    data: data || [],
    count: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit)
  };
}

export class AIToolsService {

  // 도구 상세 정보 조회
  static async getToolById(id) {
    try {
      const { data, error } = await supabase
        .from('ai_tools')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      // 조회수 증가
      await this.incrementViewCount(id)

      return { data, error: null }
    } catch (error) {
      console.error('Get tool by id error:', error)
      return { data: null, error }
    }
  }

  // 인기 도구 조회
  static async getPopularTools(limit = 10) {
    try {
      const { data, error } = await supabase
        .from('ai_tools')
        .select('*')
        .order('view_count', { ascending: false })
        .order('rating', { ascending: false })
        .limit(limit)

      if (error) throw error

      return { data: data || [], error: null }
    } catch (error) {
      console.error('Get popular tools error:', error)
      return { data: [], error }
    }
  }

  // 추천 도구 조회
  static async getFeaturedTools(limit = 6) {
    try {
      const { data, error } = await supabase
        .from('ai_tools')
        .select('*')
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      return { data: data || [], error: null }
    } catch (error) {
      console.error('Get featured tools error:', error)
      return { data: [], error }
    }
  }

  // 카테고리별 도구 조회
  static async getToolsByCategory(category, limit = 10) {
    try {
      const { data, error } = await supabase
        .from('ai_tools')
        .select('*')
        .eq('category', category)
        .order('rating', { ascending: false })
        .limit(limit)

      if (error) throw error

      return { data: data || [], error: null }
    } catch (error) {
      console.error('Get tools by category error:', error)
      return { data: [], error }
    }
  }

  // 유사한 도구 조회
  static async getSimilarTools(toolId, limit = 4) {
    try {
      // 현재 도구 정보 조회
      const { data: currentTool } = await supabase
        .from('ai_tools')
        .select('category, subcategory, tags')
        .eq('id', toolId)
        .single()

      if (!currentTool) return { data: [], error: null }

      let queryBuilder = supabase
        .from('ai_tools')
        .select('*')
        .neq('id', toolId) // 현재 도구 제외

      // 같은 카테고리 우선
      if (currentTool.subcategory) {
        queryBuilder = queryBuilder.eq('subcategory', currentTool.subcategory)
      } else {
        queryBuilder = queryBuilder.eq('category', currentTool.category)
      }

      const { data, error } = await queryBuilder
        .order('rating', { ascending: false })
        .limit(limit)

      if (error) throw error

      // 결과가 부족하면 태그 기반으로 추가 검색
      if (data.length < limit && currentTool.tags?.length > 0) {
        const additionalLimit = limit - data.length
        const { data: tagBasedTools } = await supabase
          .from('ai_tools')
          .select('*')
          .neq('id', toolId)
          .not('id', 'in', `(${data.map(t => `'${t.id}'`).join(',')})`)
          .overlaps('tags', currentTool.tags)
          .order('rating', { ascending: false })
          .limit(additionalLimit)

        if (tagBasedTools) {
          data.push(...tagBasedTools)
        }
      }

      return { data: data || [], error: null }
    } catch (error) {
      console.error('Get similar tools error:', error)
      return { data: [], error }
    }
  }

  // 조회수 증가
  static async incrementViewCount(toolId) {
    try {
      const { error } = await supabase
        .from('ai_tools')
        .update({ view_count: supabase.sql`view_count + 1` })
        .eq('id', toolId)

      if (error) throw error
    } catch (error) {
      console.error('Increment view count error:', error)
    }
  }

  // 북마크 추가/제거
  static async toggleBookmark(userId, toolId) {
    try {
      // 기존 북마크 확인
      const { data: existingBookmark } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('user_id', userId)
        .eq('tool_id', toolId)
        .single()

      let isBookmarked = false

      if (existingBookmark) {
        // 북마크 제거
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('id', existingBookmark.id)

        if (error) throw error

        // 활동 기록
        await this.logActivity(userId, ACTIVITY_TYPES.UNBOOKMARK, 'tool', toolId)
      } else {
        // 북마크 추가
        const { error } = await supabase
          .from('bookmarks')
          .insert([{
            user_id: userId,
            tool_id: toolId
          }])

        if (error) throw error

        isBookmarked = true

        // 활동 기록
        await this.logActivity(userId, ACTIVITY_TYPES.BOOKMARK, 'tool', toolId)
      }

      return { isBookmarked, error: null }
    } catch (error) {
      console.error('Toggle bookmark error:', error)
      return { isBookmarked: false, error }
    }
  }

  // 사용자 북마크 조회
  static async getUserBookmarks(userId, options = {}) {
    try {
      const page = options.page || 1
      const limit = options.limit || 20
      const offset = (page - 1) * limit

      const { data, error, count } = await supabase
        .from('bookmarks')
        .select(`
          *,
          ai_tools (*)
        `, { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error

      return {
        data: data?.map(bookmark => bookmark.ai_tools) || [],
        count: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      }
    } catch (error) {
      console.error('Get user bookmarks error:', error)
      return {
        data: [],
        count: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
        error
      }
    }
  }

  // 북마크 상태 확인
  static async checkBookmarkStatus(userId, toolIds) {
    try {
      if (!Array.isArray(toolIds)) {
        toolIds = [toolIds]
      }

      const { data, error } = await supabase
        .from('bookmarks')
        .select('tool_id')
        .eq('user_id', userId)
        .in('tool_id', toolIds)

      if (error) throw error

      const bookmarkedIds = new Set(data?.map(b => b.tool_id) || [])
      
      if (toolIds.length === 1) {
        return bookmarkedIds.has(toolIds[0])
      }

      return toolIds.reduce((result, toolId) => {
        result[toolId] = bookmarkedIds.has(toolId)
        return result
      }, {})
    } catch (error) {
      console.error('Check bookmark status error:', error)
      return toolIds.length === 1 ? false : {}
    }
  }

  // 활동 기록
  static async logActivity(userId, activityType, targetType, targetId, metadata = {}) {
    try {
      const { error } = await supabase
        .from('user_activities')
        .insert([{
          user_id: userId,
          activity_type: activityType,
          target_type: targetType,
          target_id: targetId,
          metadata: metadata,
          ip_address: null, // 클라이언트에서는 IP 수집 불가
          user_agent: navigator.userAgent
        }])

      if (error) throw error
    } catch (error) {
      console.error('Log activity error:', error)
    }
  }

  // 카테고리 목록 조회
  static async getCategories() {
    try {
      const { data, error } = await supabase
        .from('ai_tools')
        .select('category, subcategory')
        .not('category', 'is', null)

      if (error) throw error

      // 카테고리별로 그룹화
      const categories = {}
      data?.forEach(tool => {
        if (!categories[tool.category]) {
          categories[tool.category] = new Set()
        }
        if (tool.subcategory) {
          categories[tool.category].add(tool.subcategory)
        }
      })

      // Set을 Array로 변환
      Object.keys(categories).forEach(category => {
        categories[category] = Array.from(categories[category])
      })

      return { data: categories, error: null }
    } catch (error) {
      console.error('Get categories error:', error)
      return { data: {}, error }
    }
  }

  // 인기 태그 조회
  static async getPopularTags(limit = 20) {
    try {
      const { data, error } = await supabase
        .from('ai_tools')
        .select('tags')
        .not('tags', 'is', null)

      if (error) throw error

      // 모든 태그를 평면화하고 빈도 계산
      const tagCount = {}
      data?.forEach(tool => {
        tool.tags?.forEach(tag => {
          tagCount[tag] = (tagCount[tag] || 0) + 1
        })
      })

      // 빈도순으로 정렬
      const sortedTags = Object.entries(tagCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, limit)
        .map(([tag, count]) => ({ tag, count }))

      return { data: sortedTags, error: null }
    } catch (error) {
      console.error('Get popular tags error:', error)
      return { data: [], error }
    }
  }

  // 검색 자동완성
  static async getSearchSuggestions(query, limit = 5) {
    try {
      if (!query.trim()) return { data: [], error: null }

      const { data, error } = await supabase
        .from('ai_tools')
        .select('name, category')
        .ilike('name', `%${query.trim()}%`)
        .limit(limit)

      if (error) throw error

      return { data: data || [], error: null }
    } catch (error) {
      console.error('Get search suggestions error:', error)
      return { data: [], error }
    }
  }
}
