// src/components/AIToolsGrid.jsx
import React, { useState, useMemo, useEffect } from 'react';
// aiWorkflows도 aiTools.js에서 export되어 있다고 가정
import { aiTools, categories, aiWorkflows } from '../data/aiTools.js'; 
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card, CardContent, CardDescription, CardFooter,
  CardHeader, CardTitle
} from '@/components/ui/card';
import { Star, ExternalLink, XCircle, ChevronRight } from 'lucide-react'; 
import AIToolIcon from './AIToolIcon';

// ToolDetailModal 컴포넌트
const ToolDetailModal = ({ tool, onClose }) => {
  if (!tool) return null;

  const showDetailButton = tool.detail && tool.detail !== tool.link;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/80 backdrop-blur-lg p-4 sm:p-6 md:p-8"
      onClick={onClose}
    >
      <div
        className="relative bg-neutral-0/95 backdrop-blur-lg text-neutral-900 rounded-lg shadow-glass w-full max-w-lg lg:max-w-2xl h-full overflow-y-auto animate-in fade-in zoom-in-90 sm:slide-in-from-bottom-8 duration-300 border border-neutral-200/50"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 rounded-full text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 backdrop-blur-sm"
          onClick={onClose}
        >
          <XCircle className="w-6 h-6" />
          <span className="sr-only">닫기</span>
        </Button>

        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <AIToolIcon tool={tool} className="w-12 h-12" />
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-primary">{tool.name}</h2>
              <Badge variant="secondary" className="text-sm sm:text-base">{tool.category}</Badge>
            </div>
          </div>

          <div className="flex items-center gap-1 mb-4">
            {[...Array(Math.floor(tool.rating))].map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            ))}
            {tool.rating % 1 !== 0 && <Star className="w-5 h-5 fill-yellow-400/50 text-yellow-400" />}
            <span className="text-base text-muted-foreground ml-1">{tool.rating}</span>
          </div>

          <p className="text-muted-foreground mb-6 text-sm sm:text-base leading-relaxed">
            {tool.description}
          </p>

          <div className="space-y-6 mb-6">
            <div>
              <h3 className="font-semibold text-lg mb-2 text-foreground">강점</h3>
              {Array.isArray(tool.strengths) ? (
                <ul className="list-disc list-inside space-y-1 text-green-700 dark:text-green-400 text-sm sm:text-base">
                  {tool.strengths.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-green-700 dark:text-green-400 text-sm sm:text-base">{tool.strengths}</p>
              )}
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2 text-foreground">약점</h3>
              {Array.isArray(tool.weaknesses) ? (
                <ul className="list-disc list-inside space-y-1 text-yellow-700 dark:text-yellow-400 text-sm sm:text-base">
                  {tool.weaknesses.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-yellow-700 dark:text-yellow-400 text-sm sm:text-base">{tool.weaknesses}</p>
              )}
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2 text-foreground">무료 제한 사항</h3>
              {Array.isArray(tool.freeLimitations) ? (
                <ul className="list-disc list-inside space-y-1 text-red-700 dark:text-red-400 text-sm sm:text-base">
                  {tool.freeLimitations.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-red-700 dark:text-red-400 text-sm sm:text-base">{tool.freeLimitations}</p>
              )}
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2 text-foreground">주요 기능</h3>
              <div className="flex flex-wrap gap-2">
                {tool.features && tool.features.map((feature, index) => (
                  <Badge key={index} variant="secondary" className="text-sm sm:text-base px-3 py-1">
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2 text-foreground">실용적 활용법</h3>
              <div className="space-y-3">
                {tool.usecases && tool.usecases.map((usecase, index) => (
                  <div key={index} className="bg-muted/50 p-3 rounded-md">
                    <div className="font-medium text-sm sm:text-base text-primary">{usecase.title}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground mt-1">{usecase.detail}</div>
                    {usecase.example && <div className="text-xs sm:text-sm text-gray-500 italic mt-0.5">{usecase.example}</div>}
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">연계 도구:</span> {tool.integrations && tool.integrations.length > 0 ? tool.integrations.join(', ') : '없음'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-4 pt-6 pb-4 border-t px-6 sm:px-8">
          <Button size="lg" asChild className="w-full sm:w-auto">
            <a href={tool.link} target="_blank" rel="noopener noreferrer">
              사용해보기
            </a>
          </Button>
          {showDetailButton && (
            <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
              <a href={tool.detail} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-5 h-5 mr-2" /> 상세 정보
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

const WorkflowDetailModal = ({ workflow, onClose }) => {
  if (!workflow) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4 sm:p-6 md:p-8"
      onClick={onClose}
    >
      <div
        className="relative bg-background text-foreground rounded-xl shadow-2xl w-full max-w-lg lg:max-w-2xl h-full overflow-y-auto animate-in fade-in zoom-in-90 sm:slide-in-from-bottom-8 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 rounded-full text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 backdrop-blur-sm"
          onClick={onClose}
        >
          <XCircle className="w-6 h-6" />
          <span className="sr-only">닫기</span>
        </Button>

        <div className="p-6 sm:p-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-primary">{workflow.title}</h2>
          <p className="text-muted-foreground mb-6 text-sm sm:text-base leading-relaxed">
            {workflow.description}
          </p>

          <div className="space-y-6">
            <h3 className="font-semibold text-xl mb-3 text-foreground">워크플로우 단계</h3>
            <div className="space-y-4">
              {workflow.steps.map((step, index) => (
                <div key={index} className="bg-muted/50 p-4 rounded-md flex items-start gap-3">
                  <Badge variant="default" className="flex-shrink-0 text-base font-bold min-w-[32px] h-8 flex items-center justify-center">
                    {step.step_number}
                  </Badge>
                  <div>
                    <h4 className="font-medium text-lg text-foreground">{step.tool_name}</h4>
                    <p className="text-primary text-sm sm:text-base font-semibold">{step.tool_action}</p>
                    {step.details && <p className="text-muted-foreground text-xs sm:text-sm mt-1">{step.details}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AIToolsGrid = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showToolModal, setShowToolModal] = useState(false);
  const [selectedToolDetail, setSelectedToolDetail] = useState(null);
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [selectedWorkflowDetail, setSelectedWorkflowDetail] = useState(null);

  const matchingWorkflows = useMemo(() => {
    if (!searchTerm) return [];
    const lowerCaseSearchTerm = searchTerm.toLowerCase();

    return aiWorkflows.filter(workflow =>
      workflow.title.toLowerCase().includes(lowerCaseSearchTerm) ||
      workflow.keywords.some(keyword => keyword.toLowerCase().includes(lowerCaseSearchTerm)) ||
      workflow.description.toLowerCase().includes(lowerCaseSearchTerm)
    );
  }, [searchTerm]);

  const filteredTools = useMemo(() => {
    if (matchingWorkflows.length > 0) return []; 

    let tools = selectedCategory === 'all'
      ? aiTools
      : aiTools.filter(tool => tool.category === selectedCategory);

    if (searchTerm) {
      tools = tools.filter(tool =>
        tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tool.features && tool.features.some(feature => feature.toLowerCase().includes(searchTerm.toLowerCase())))
      );
    }
    return tools;
  }, [selectedCategory, searchTerm, matchingWorkflows]);

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    return (
      <div className="flex items-center gap-1">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        ))}
        {hasHalfStar && <Star className="w-4 h-4 fill-yellow-400/50 text-yellow-400" />}
        <span className="text-sm text-muted-foreground ml-1">{rating}</span>
      </div>
    );
  };

  const openToolModal = (tool) => {
    setSelectedToolDetail(tool);
    setShowToolModal(true);
    document.body.style.overflow = 'hidden'; 
  };

  const closeToolModal = () => {
    setShowToolModal(false);
    setSelectedToolDetail(null);
    document.body.style.overflow = ''; 
  };

  const openWorkflowModal = (workflow) => {
    setSelectedWorkflowDetail(workflow);
    setShowWorkflowModal(true);
    document.body.style.overflow = 'hidden';
  };

  const closeWorkflowModal = () => {
    setShowWorkflowModal(false);
    setSelectedWorkflowDetail(null);
    document.body.style.overflow = '';
  };

  const renderToolCard = (tool) => {
    const isStrongPointFeature = (feature) => 
      Array.isArray(tool.strengths) && tool.strengths.some(s => feature.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(feature.toLowerCase()));

    return (
      <Card
        key={tool.id}
        className="h-full flex flex-col transition-all duration-300 hover:shadow-elev hover:-translate-y-2 cursor-pointer 
                   bg-neutral-0/90 backdrop-blur-lg border border-neutral-200/50 shadow-glass 
                   overflow-hidden rounded-lg group relative"
        onClick={() => openToolModal(tool)} 
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-0"></div>

        <CardHeader className="pb-3 relative z-10">
          <div className="flex justify-between items-start gap-2">
            <div className="flex items-center gap-3">
              <AIToolIcon tool={tool} className="w-12 h-12" />
              <CardTitle className="font-display text-heading font-semibold text-neutral-900">{tool.name}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {tool.rating && renderStars(tool.rating)} 
              {tool.isPopularKr && tool.rating >= 4.8 && ( 
                <Badge variant="destructive" className="text-xs px-2 py-1 bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-md">
                  인기
                </Badge>
              )}
            </div>
          </div>
          <CardDescription className="font-body text-body-lg leading-relaxed text-neutral-700 mt-3">
            {tool.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="flex-1 space-y-4 relative z-10">
          <div className="space-y-1 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-accent-500 font-body text-body-sm font-medium">
                {Array.isArray(tool.strengths) ? tool.strengths[0] : tool.strengths}
              </span>
            </div>
          </div>

          <div>
            <h4 className="font-body text-body-sm font-semibold mb-3 text-neutral-900">주요 기능</h4>
            <div className="flex flex-wrap gap-1">
              {tool.features && tool.features.slice(0, 6).map((feature, index) => { 
                const isStrongPoint = isStrongPointFeature(feature); 
                return (
                  <Badge
                    key={index}
                    variant={isStrongPoint ? "destructive" : "secondary"}
                    className={`text-xs px-2 py-1 animate-fade-in-up transition-transform duration-200 hover:scale-110 
                                ${isStrongPoint ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-sm' : ''}`}
                    style={{ animationDelay: `${index * 0.05}s` }} 
                  >
                    {feature}
                  </Badge>
                );
              })}
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between items-center pt-4 border-t border-primary/5 relative z-10">
          <Badge variant="outline" className="font-medium text-sm text-primary">
            {tool.freeLimitations && tool.freeLimitations.includes("무료") ? '무료 이용 가능' : '유료 또는 제한적 무료'}
          </Badge>
        </CardFooter>
      </Card>
    );
  };

  const renderWorkflowCard = (workflow) => (
    <Card
      key={workflow.id}
      className="h-full flex flex-col transition-all duration-300 hover:shadow-elev hover:-translate-y-2 cursor-pointer 
                 bg-neutral-0/90 backdrop-blur-lg border border-neutral-200/50 shadow-glass 
                 rounded-lg group relative"
      onClick={() => openWorkflowModal(workflow)}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-0"></div>

      <CardHeader className="pb-3 relative z-10">
        <CardTitle className="font-display text-heading font-bold text-neutral-900 mb-3">{workflow.title}</CardTitle>
        <CardDescription className="font-body text-body-lg leading-relaxed text-neutral-700">
          {workflow.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 space-y-3 relative z-10">
        <h4 className="font-body text-body-sm font-semibold text-primary-600">추천 워크플로우</h4>
        <div className="flex flex-col gap-2">
          {workflow.steps.map((step, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <Badge variant="default" className="bg-primary-500 text-neutral-0 font-body text-body-sm flex-shrink-0">
                Step {step.step_number}
              </Badge>
              <span className="text-neutral-900 font-body text-body-sm font-medium">{step.tool_name}</span>
              <ChevronRight className="w-4 h-4 text-primary-600 flex-shrink-0" />
              <span className="text-neutral-700 font-body text-body-sm line-clamp-1">{step.tool_action}</span>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="relative z-10">
        <div className="flex flex-wrap gap-1">
          {workflow.keywords && workflow.keywords.map((keyword, index) => (
            <Badge key={index} variant="outline" className="text-primary-600 border-primary-200 font-body text-body-sm">
              {keyword}
            </Badge>
          ))}
        </div>
      </CardFooter>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-12 sm:py-16">
      <header className="text-center mb-16 sm:mb-20">
        <div className="bg-neutral-0/90 backdrop-blur-lg text-neutral-900 p-8 sm:p-12 rounded-lg shadow-glass mx-auto max-w-4xl border border-neutral-200/50">
          <h1 className="font-display text-display-xl font-bold mb-6 leading-tight">
            AI 도구 모음
          </h1>
          <p className="font-body text-body-lg text-neutral-700 leading-relaxed max-w-2xl mx-auto">
            다양한 AI 도구와 추천 워크플로우를 통해 당신의 작업을 최적화해보세요.
          </p>
        </div>
      </header>

      <div className="space-y-8 mb-12 sm:mb-16">
        <div className="max-w-2xl mx-auto">
          <Input
            type="text"
            placeholder="원하는 작업이나 도구 이름을 검색해보세요. (예: '보고서 작성', '영상 편집', '블로그 글쓰기')"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full font-body text-body-lg py-4 px-6 rounded-lg shadow-glass border border-neutral-200/50 focus:border-primary-500 transition-all duration-300 focus:ring-2 focus:ring-primary-500/20 bg-neutral-0/90 backdrop-blur-lg"
          />
        </div>
        
        {!searchTerm && (
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
            {categories.map(category => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="lg"
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-6 py-3 font-body text-body-sm font-medium rounded-lg transition-all duration-300 ${
                  selectedCategory === category.id 
                    ? 'bg-primary-500 text-neutral-0 shadow-elev transform scale-105' 
                    : 'border-2 border-neutral-200 text-neutral-700 hover:bg-neutral-50 backdrop-blur-sm'
                }`}
              >
                <span>{category.icon}</span>
                <span>{category.name}</span>
              </Button>
            ))}
          </div>
        )}
      </div>

      {searchTerm && matchingWorkflows.length > 0 && (
        <div className="mb-12 sm:mb-16">
          <h2 className="font-display text-display-lg font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-accent-500">
            ✨ 추천 워크플로우
          </h2>
          <div className="tools-grid animate-fade-in-up">
            {matchingWorkflows.map(renderWorkflowCard)}
          </div>
        </div>
      )}

      <div className="text-center mb-6 sm:mb-8">
        <p className="font-body text-body-lg text-neutral-700">
          {matchingWorkflows.length > 0 ? "" : `${filteredTools.length}개의 도구가 있습니다`}
        </p>
      </div>

      <div className="tools-grid">
        {matchingWorkflows.length === 0 && filteredTools.length > 0 ? (
          filteredTools.map(renderToolCard)
        ) : matchingWorkflows.length === 0 && filteredTools.length === 0 && searchTerm ? (
          <div className="col-span-full text-center py-16 text-neutral-700 font-body text-body-lg">
            <p>검색 조건에 맞는 도구 또는 워크플로우가 없습니다.</p>
          </div>
        ) : null}
        {matchingWorkflows.length === 0 && filteredTools.length === 0 && !searchTerm && (
           <div className="col-span-full text-center py-16 text-neutral-700 font-body text-body-lg">
             <p>선택된 카테고리에 맞는 도구가 없습니다.</p>
           </div>
        )}
      </div>

      <ToolDetailModal tool={showToolModal ? selectedToolDetail : null} onClose={closeToolModal} />
      <WorkflowDetailModal workflow={showWorkflowModal ? selectedWorkflowDetail : null} onClose={closeWorkflowModal} />
    </div>
  );
};

export default AIToolsGrid;