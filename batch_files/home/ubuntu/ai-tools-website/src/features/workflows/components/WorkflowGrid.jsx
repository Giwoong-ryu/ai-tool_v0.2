import React, { useState, useEffect } from 'react';
import WorkflowCard from './WorkflowCard';
import WorkflowDetail from './WorkflowDetail';
import workflowsData from '../data/workflows.json';

const WorkflowGrid = () => {
  const [workflows, setWorkflows] = useState([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [selectedDifficulty, setSelectedDifficulty] = useState('전체');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setWorkflows(workflowsData);
  }, []);

  // 필터링 로직
  const filteredWorkflows = workflows.filter(workflow => {
    const matchesCategory = selectedCategory === '전체' || workflow.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === '전체' || workflow.difficulty === selectedDifficulty;
    const matchesSearch = searchTerm === '' || 
      workflow.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workflow.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workflow.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesCategory && matchesDifficulty && matchesSearch;
  });

  // 카테고리 및 난이도 옵션
  const categories = ['전체', ...new Set(workflows.map(w => w.category))];
  const difficulties = ['전체', '초급', '중급', '고급'];

  const handleWorkflowSelect = (workflow) => {
    setSelectedWorkflow(workflow);
  };

  const handleCloseDetail = () => {
    setSelectedWorkflow(null);
  };

  const handleStartWorkflow = (workflow) => {
    // 워크플로우 시작 로직 (추후 구현)
    console.log('워크플로우 시작:', workflow.id);
    setSelectedWorkflow(null);
    
    // 첫 번째 단계의 도구로 이동하는 로직을 여기에 추가할 수 있습니다
    if (workflow.steps.length > 0) {
      const firstStep = workflow.steps[0];
      // AI 도구 페이지로 이동하거나 관련 기능 실행
      console.log('첫 번째 단계:', firstStep);
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">AI 워크플로우 추천</h2>
        <p className="text-gray-600">목적에 맞는 AI 도구 조합으로 효율적인 작업을 완성하세요</p>
      </div>

      {/* 검색 및 필터 */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="space-y-4">
          {/* 검색바 */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="워크플로우 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* 필터 버튼들 */}
          <div className="flex flex-wrap gap-4">
            {/* 카테고리 필터 */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">카테고리:</span>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === category
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* 난이도 필터 */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">난이도:</span>
              <div className="flex flex-wrap gap-2">
                {difficulties.map((difficulty) => (
                  <button
                    key={difficulty}
                    onClick={() => setSelectedDifficulty(difficulty)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      selectedDifficulty === difficulty
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {difficulty}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 결과 정보 */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          총 <span className="font-semibold text-gray-900">{filteredWorkflows.length}</span>개의 워크플로우
        </p>
        {(selectedCategory !== '전체' || selectedDifficulty !== '전체' || searchTerm) && (
          <button
            onClick={() => {
              setSelectedCategory('전체');
              setSelectedDifficulty('전체');
              setSearchTerm('');
            }}
            className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
          >
            필터 초기화
          </button>
        )}
      </div>

      {/* 워크플로우 그리드 */}
      {filteredWorkflows.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorkflows.map((workflow) => (
            <WorkflowCard
              key={workflow.id}
              workflow={workflow}
              onSelect={handleWorkflowSelect}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">워크플로우를 찾을 수 없습니다</h3>
          <p className="text-gray-500">다른 검색어나 필터를 시도해보세요</p>
        </div>
      )}

      {/* 워크플로우 상세 모달 */}
      {selectedWorkflow && (
        <WorkflowDetail
          workflow={selectedWorkflow}
          onClose={handleCloseDetail}
          onStartWorkflow={handleStartWorkflow}
        />
      )}
    </div>
  );
};

export default WorkflowGrid;

