import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useVirtualizer } from '@tanstack/react-virtual';
import { Star, Tag, TrendingUp, Clock, ExternalLink, Wrench, Sparkles, Workflow } from 'lucide-react';
import { searchService, logUserAction } from '../../services/search.service';
import { track } from '../../lib/analytics';

// Skeleton Loader Component
const SkeletonCard = React.memo(() => (
  <div className="animate-pulse">
    <div className="bg-white rounded-lg border border-gray-200 p-4 h-48">
      {/* Badge area */}
      <div className="flex items-center gap-2 mb-3">
        <div className="h-6 w-16 bg-gray-200 rounded"></div>
        <div className="h-6 w-12 bg-gray-200 rounded"></div>
      </div>
      
      {/* Title */}
      <div className="h-6 bg-gray-200 rounded mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
      
      {/* Description */}
      <div className="space-y-2 mb-3">
        <div className="h-3 bg-gray-200 rounded"></div>
        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
      </div>
      
      {/* Meta info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-4 w-12 bg-gray-200 rounded"></div>
          <div className="h-4 w-16 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  </div>
));

// 3-Column Fixed Section Component
const ResultSection = React.memo(({ 
  title, 
  icon, 
  color, 
  items, 
  onSelect, 
  searchQuery, 
  loading = false 
}) => {
  const parentRef = useRef();
  
  const virtualizer = useVirtualizer({
    count: Math.ceil(items.length / 3),
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200, // Card height
    overscan: 2,
  });

  const handleItemClick = useCallback(async (item, position) => {
    if (onSelect) {
      onSelect(item);
      
      // Analytics tracking
      try {
        await track('select_template', {
          template_id: item.item_id || item.id,
          template_type: getTemplateTypeFromItemType(item.item_type),
          category: item.category,
          search_query: searchQuery,
          position: position + 1,
          rating: item.rating,
          section: item.item_type
        });
      } catch (error) {
        console.warn('Analytics tracking failed:', error);
      }
      
      // Legacy logging
      logUserAction(searchQuery, {
        itemType: item.item_type,
        itemId: item.item_id,
        position: position + 1
      });
    }
  }, [onSelect, searchQuery]);

  if (loading) {
    return (
      <section className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className={`${color} text-xl`}>{icon}</div>
          <h2 className={`text-xl font-bold ${color}`}>{title}</h2>
          <div className="h-6 w-12 bg-gray-200 rounded animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      </section>
    );
  }

  if (!items.length) return null;

  return (
    <section className="mb-8">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className={`${color} text-xl`}>{icon}</div>
        <h2 className={`text-xl font-bold ${color}`}>{title}</h2>
        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
          {items.length}개
        </span>
      </div>

      {/* Virtual Grid */}
      <div
        ref={parentRef}
        className="h-96 overflow-auto"
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const rowIndex = virtualItem.index;
            const startIndex = rowIndex * 3;
            const rowItems = items.slice(startIndex, startIndex + 3);

            return (
              <div
                key={virtualItem.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-2">
                  {rowItems.map((item, colIndex) => (
                    <ResultCard
                      key={item.item_id || item.id}
                      item={item}
                      onClick={() => handleItemClick(item, startIndex + colIndex)}
                    />
                  ))}
                  
                  {/* Fill empty slots */}
                  {rowItems.length < 3 && Array.from({ length: 3 - rowItems.length }).map((_, index) => (
                    <div key={`empty-${index}`} className="invisible">
                      <div className="h-48"></div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
});

// Individual Result Card Component
const ResultCard = React.memo(({ item, onClick }) => {
  return (
    <button
      className="bg-white rounded-lg border border-gray-200 p-4 h-48 w-full text-left transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:border-gray-300 group"
      onClick={onClick}
      aria-label={`${item.title} 상세 열기`}
    >
      {/* Badge area */}
      <div className="flex items-center gap-2 mb-3">
        <div className={`px-2 py-1 rounded text-xs font-medium type-${item.item_type}`}>
          {getTypeDisplayName(item.item_type)}
        </div>
        {item.is_popular && (
          <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium">
            <TrendingUp className="w-3 h-3" />
            인기
          </div>
        )}
        {item.is_korean && (
          <div className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
            한국어
          </div>
        )}
      </div>
      
      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600">
        {item.title}
      </h3>
      
      {/* Description */}
      <p className="text-sm text-gray-600 mb-3 line-clamp-3">
        {item.description}
      </p>
      
      {/* Meta info */}
      <div className="flex items-center justify-between text-xs text-gray-500 mt-auto">
        <div className="flex items-center gap-3">
          {item.rating && (
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{item.rating.toFixed(1)}</span>
            </div>
          )}
          {item.category && (
            <div className="flex items-center gap-1">
              <Tag className="w-3 h-3" />
              <span>{item.category}</span>
            </div>
          )}
        </div>
        
        {/* Search score (dev/debug) */}
        {(item.similarity_score || item.final_score) && (
          <div className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
            {item.similarity_score ? 
              `유사도: ${(item.similarity_score * 100).toFixed(0)}%` :
              `점수: ${(item.final_score * 100).toFixed(0)}%`
            }
          </div>
        )}
      </div>
      
      {/* Tags */}
      {item.tags && item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {item.tags.slice(0, 3).map((tag, idx) => (
            <span 
              key={idx} 
              className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
            >
              {tag}
            </span>
          ))}
          {item.tags.length > 3 && (
            <span className="text-xs text-gray-400">+{item.tags.length - 3}</span>
          )}
        </div>
      )}
    </button>
  );
});

// 타입 표시명 변환
function getTypeDisplayName(itemType) {
  const typeMap = {
    'ai_tool': 'AI 도구',
    'workflow': '워크플로',
    'prompt_template': '프롬프트'
  };
  return typeMap[itemType] || itemType;
}

// <mark>Step 4: Analytics 템플릿 타입 매핑</mark>
function getTemplateTypeFromItemType(itemType) {
  const typeMap = {
    'ai_tool': 'ai_tool',
    'workflow': 'workflow', 
    'prompt_template': 'prompt'
  };
  return typeMap[itemType] || 'template';
}

// 섹션 헤더 컴포넌트
const SectionHeader = ({ itemType, count, totalResults }) => {
  const typeInfo = {
    'ai_tool': { name: 'AI 도구', icon: '🤖', color: 'text-blue-600' },
    'workflow': { name: '워크플로', icon: '⚡', color: 'text-green-600' },
    'prompt_template': { name: '프롬프트', icon: '💬', color: 'text-purple-600' }
  };
  
  const info = typeInfo[itemType] || { name: itemType, icon: '📄', color: 'text-gray-600' };
  
  return (
    <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-gray-200 px-4 py-3 mb-2">
      <div className="flex items-center justify-between">
        <h2 className={`text-lg font-semibold ${info.color} flex items-center gap-2`}>
          <span>{info.icon}</span>
          {info.name}
          <span className="text-sm text-gray-500 font-normal">({count}개)</span>
        </h2>
        <div className="text-sm text-gray-500">
          전체 {totalResults}개 중
        </div>
      </div>
    </div>
  );
};

export default function ResultGridV2({ 
  items = [], 
  onSelect, 
  searchQuery = '',
  loading = false,
  groupByType = true 
}) {
  // Group items by type
  const groupedItems = useMemo(() => {
    if (!groupByType) {
      return [{ type: 'all', items }];
    }
    
    const groups = items.reduce((acc, item) => {
      const type = item.item_type;
      if (!acc[type]) acc[type] = [];
      acc[type].push(item);
      return acc;
    }, {});
    
    // Type order and configuration
    const typeConfig = {
      'ai_tool': { 
        title: 'AI 도구', 
        icon: <Wrench className="w-5 h-5" />, 
        color: 'text-blue-600' 
      },
      'prompt_template': { 
        title: '프롬프트 템플릿', 
        icon: <Sparkles className="w-5 h-5" />, 
        color: 'text-green-600' 
      },
      'workflow': { 
        title: '워크플로우', 
        icon: <Workflow className="w-5 h-5" />, 
        color: 'text-purple-600' 
      }
    };
    
    return Object.keys(typeConfig)
      .filter(type => groups[type]?.length > 0)
      .map(type => ({ 
        type, 
        items: groups[type],
        config: typeConfig[type]
      }));
  }, [items, groupByType]);
  
  // Loading state
  if (loading) {
    return (
      <div className="w-full space-y-8">
        {/* Skeleton for AI Tools */}
        <ResultSection
          title="AI 도구"
          icon={<Wrench className="w-5 h-5" />}
          color="text-blue-600"
          items={[]}
          loading={true}
        />
        
        {/* Skeleton for Templates */}
        <ResultSection
          title="프롬프트 템플릿"
          icon={<Sparkles className="w-5 h-5" />}
          color="text-green-600"
          items={[]}
          loading={true}
        />
        
        {/* Skeleton for Workflows */}
        <ResultSection
          title="워크플로우"
          icon={<Workflow className="w-5 h-5" />}
          color="text-purple-600"
          items={[]}
          loading={true}
        />
      </div>
    );
  }
  
  // Empty state
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <div className="text-4xl mb-4">🔍</div>
        <h3 className="text-lg font-medium mb-2">검색 결과가 없습니다</h3>
        <p className="text-sm text-center">
          다른 키워드로 검색해보시거나<br />
          필터를 조정해보세요.
        </p>
      </div>
    );
  }
  
  // Render grouped sections
  return (
    <div className="w-full space-y-8">
      {groupedItems.map(group => (
        <ResultSection
          key={group.type}
          title={group.config.title}
          icon={group.config.icon}
          color={group.config.color}
          items={group.items}
          onSelect={onSelect}
          searchQuery={searchQuery}
          loading={false}
        />
      ))}
    </div>
  );
}
