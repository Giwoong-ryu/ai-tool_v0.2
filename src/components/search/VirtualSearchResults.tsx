/**
 * Virtual Scrolling Search Results Component
 * Optimized for large result sets with 3-column responsive layout
 */

import React, { useMemo, useRef, useEffect, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { SearchResult } from '@/services/hybridSearch.service'
import { AIToolIcon } from '@/components/AIToolIcon'

// =====================================================
// Types & Interfaces
// =====================================================

interface VirtualSearchResultsProps {
  results: SearchResult[]
  isLoading: boolean
  hasMore: boolean
  onLoadMore: () => void
  onItemClick: (item: SearchResult) => void
  className?: string
}

interface GridItem {
  id: string
  type: 'result' | 'loading' | 'load-more'
  data?: SearchResult
}

// =====================================================
// Main Component
// =====================================================

export const VirtualSearchResults: React.FC<VirtualSearchResultsProps> = ({
  results,
  isLoading,
  hasMore,
  onLoadMore,
  onItemClick,
  className = ''
}) => {
  const parentRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(1200)

  // Calculate responsive columns
  const columnCount = useMemo(() => {
    if (containerWidth < 640) return 1  // sm
    if (containerWidth < 1024) return 2 // md
    return 3 // lg+
  }, [containerWidth])

  // Create virtual grid items
  const gridItems = useMemo((): GridItem[] => {
    const items: GridItem[] = results.map(result => ({
      id: result.id,
      type: 'result' as const,
      data: result
    }))

    // Add loading skeletons
    if (isLoading) {
      for (let i = 0; i < 6; i++) {
        items.push({
          id: `loading-${i}`,
          type: 'loading' as const
        })
      }
    }

    // Add load more trigger
    if (hasMore && !isLoading) {
      items.push({
        id: 'load-more',
        type: 'load-more' as const
      })
    }

    return items
  }, [results, isLoading, hasMore])

  // Calculate rows for virtual scrolling
  const rowData = useMemo(() => {
    const rows: GridItem[][] = []
    for (let i = 0; i < gridItems.length; i += columnCount) {
      rows.push(gridItems.slice(i, i + columnCount))
    }
    return rows
  }, [gridItems, columnCount])

  // Virtual scrolling setup
  const virtualizer = useVirtualizer({
    count: rowData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 280, // Estimated card height
    overscan: 2,
  })

  // Handle container resize
  useEffect(() => {
    const handleResize = () => {
      if (parentRef.current) {
        setContainerWidth(parentRef.current.offsetWidth)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Handle load more intersection
  useEffect(() => {
    const items = virtualizer.getVirtualItems()
    const lastItem = items[items.length - 1]
    
    if (lastItem && rowData[lastItem.index]?.some(item => item.type === 'load-more')) {
      onLoadMore()
    }
  }, [virtualizer.getVirtualItems(), rowData, onLoadMore])

  return (
    <div className={`relative ${className}`}>
      <div
        ref={parentRef}
        className="h-[600px] overflow-auto"
        style={{
          contain: 'strict',
        }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const rowItems = rowData[virtualRow.index]
            if (!rowItems) return null

            return (
              <div
                key={virtualRow.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <div 
                  className={`grid gap-4 p-4 h-full`}
                  style={{
                    gridTemplateColumns: `repeat(${columnCount}, 1fr)`
                  }}
                >
                  {rowItems.map((item, colIndex) => (
                    <GridItemComponent
                      key={`${virtualRow.index}-${colIndex}`}
                      item={item}
                      onItemClick={onItemClick}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Performance indicator */}
      <div className="absolute top-2 right-2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
        {results.length} results
      </div>
    </div>
  )
}

// =====================================================
// Grid Item Component
// =====================================================

interface GridItemComponentProps {
  item: GridItem
  onItemClick: (item: SearchResult) => void
}

const GridItemComponent: React.FC<GridItemComponentProps> = ({ item, onItemClick }) => {
  switch (item.type) {
    case 'result':
      return <SearchResultCard result={item.data!} onClick={() => onItemClick(item.data!)} />
    
    case 'loading':
      return <SearchResultSkeleton />
    
    case 'load-more':
      return <LoadMoreCard />
    
    default:
      return null
  }
}

// =====================================================
// Search Result Card
// =====================================================

interface SearchResultCardProps {
  result: SearchResult
  onClick: () => void
}

const SearchResultCard: React.FC<SearchResultCardProps> = ({ result, onClick }) => {
  return (
    <Card 
      className="h-64 cursor-pointer hover:shadow-md transition-shadow duration-200 group"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <AIToolIcon 
              name={result.item_id} 
              size={40}
              className="rounded-lg"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
              {result.title}
            </h3>
            <Badge variant="outline" className="mt-1 text-xs">
              {result.category}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
          {result.description}
        </p>
        
        <div className="flex flex-wrap gap-1 mb-3">
          {result.tags.slice(0, 3).map(tag => (
            <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0.5">
              {tag}
            </Badge>
          ))}
          {result.tags.length > 3 && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
              +{result.tags.length - 3}
            </Badge>
          )}
        </div>
        
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span className="capitalize">{result.match_type.replace('_', ' ')}</span>
          <span className="font-mono">
            {(result.final_score * 100).toFixed(0)}%
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

// =====================================================
// Loading Skeleton
// =====================================================

const SearchResultSkeleton: React.FC = () => {
  return (
    <Card className="h-64">
      <CardHeader className="pb-3">
        <div className="flex items-start space-x-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-3">
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
        
        <div className="flex gap-1">
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-10" />
        </div>
        
        <div className="flex justify-between">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-8" />
        </div>
      </CardContent>
    </Card>
  )
}

// =====================================================
// Load More Card
// =====================================================

const LoadMoreCard: React.FC = () => {
  return (
    <Card className="h-64 border-dashed border-2 flex items-center justify-center">
      <div className="text-center text-muted-foreground">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
        <p className="text-sm">Loading more results...</p>
      </div>
    </Card>
  )
}

export default VirtualSearchResults