// [자동 분류] 이 파일은 현재 사용되지 않으며 중복된 컴포넌트로 판단되어 아카이브 처리되었습니다.
import { useState } from 'react';
import AIToolsSearch from './AIToolsSearch';
import AIToolCard from './AIToolCard';
import { getToolsByCategory } from '../data/aiTools';

export default function AIToolsContainer({ selectedGoal, setSelectedGoal }) {
  const [tools, setTools] = useState(getToolsByCategory('all'));

  return (
    <div className="container mx-auto px-4 py-8">
      <AIToolsSearch onSearch={setTools} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {tools.map((tool) => (
          <AIToolCard key={tool.name} tool={tool} />
        ))}
      </div>
      
      {tools.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          검색 결과가 없습니다.
        </div>
      )}
    </div>
  );
}