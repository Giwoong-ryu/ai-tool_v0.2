import { useState } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ExternalLink } from 'lucide-react';

export default function AIToolCard({ tool }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const renderStars = (rating) => {
    return (
      <div className="flex items-center">
        <div className="flex space-x-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <svg
              key={star}
              className={`w-4 h-4 ${star <= rating ? 'text-yellow-400' : 'text-gray-200'}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
        <span className="ml-1 text-sm font-semibold">{rating.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <div className="p-4">
        <div className="flex gap-4">
          {/* 왼쪽: 아이콘 */}
          <AIToolIcon toolName={tool.name} className="w-10 h-10 flex-none" />

          {/* 중앙: 제목과 설명 */}
          <div className="flex-1 min-w-0">
             {/* 제목 줄 */}
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold truncate">{tool.name}</h3>
              
              {/* 별점과 뱃지 */}
              <div className="flex flex-col items-end gap-1 flex-none">
                <div className="flex items-center whitespace-nowrap">
                  
                  {renderStars(tool.rating || 4.5)}
                </div>
                {(tool.isPopularKr || tool.isPopular) && (
                  <Badge 
                    variant="destructive" 
                    className="h-5 px-1.5 py-0 text-[11px] font-medium bg-red-500 hover:bg-red-500"
                  >
                    인기
                  </Badge>
                )}
              </div>
            </div>

            {/* 설명 */}
            <p className={`text-sm text-gray-600 ${isExpanded ? '' : 'line-clamp-2'}`}>
              {tool.description}
            </p>
          </div>
        </div>
      </div>
      
      <div className="mt-auto space-y-2">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{tool.category}</Badge>
          {tool.freeLimitations && (
            <Badge variant="success">무료</Badge>
          )}
        </div>
        
        <div className="flex justify-between items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? '접기' : '더보기'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(tool.url, '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            방문하기
          </Button>
        </div>
      </div>
    </Card>
  );
}
