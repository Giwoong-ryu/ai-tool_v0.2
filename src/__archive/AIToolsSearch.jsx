// [자동 분류] 이 파일은 현재 사용되지 않으며 중복된 컴포넌트로 판단되어 아카이브 처리되었습니다.
import { useState, useEffect } from 'react';
import { searchTools, getToolsByCategory, getFreeTools, getPopularTools } from '../data/aiTools';
import { Input } from './ui/input';
import { Button } from './ui/button';

export default function AIToolsSearch({ onSearch }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  const handleSearch = () => {
    let results;
    switch (filterType) {
      case 'free':
        results = getFreeTools();
        break;
      case 'popular':
        results = getPopularTools();
        break;
      default:
        results = searchQuery ? searchTools(searchQuery) : getToolsByCategory('all');
    }
    onSearch(results);
  };

  useEffect(() => {
    handleSearch();
  }, [searchQuery, filterType]);

  return (
    <div className="w-full space-y-4">
      <div className="flex gap-4">
        <Input
          type="text"
          placeholder="AI 도구 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <Button
          variant="outline"
          onClick={() => setFilterType('all')}
          className={filterType === 'all' ? 'bg-primary text-white' : ''}
        >
          전체
        </Button>
        <Button
          variant="outline"
          onClick={() => setFilterType('popular')}
          className={filterType === 'popular' ? 'bg-primary text-white' : ''}
        >
          인기
        </Button>
        <Button
          variant="outline"
          onClick={() => setFilterType('free')}
          className={filterType === 'free' ? 'bg-primary text-white' : ''}
        >
          무료
        </Button>
      </div>
    </div>
  );
}