// src/components/AIToolsGrid.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { aiTools, categories } from '../data/aiTools'; // categories도 aiTools.js에서 export되어 있다고 가정
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card, CardContent, CardDescription, CardFooter,
  CardHeader, CardTitle
} from '@/components/ui/card';
import { Star, ExternalLink, XCircle } from 'lucide-react'; // CheckCircle, AlertTriangle, Lock 아이콘은 모달에서만 사용

// ToolDetailModal 컴포넌트
const ToolDetailModal = ({ tool, onClose }) => {
  if (!tool) return null;

  // tool.detail이 tool.link와 다른 경우에만 상세 정보 버튼을 표시
  const showDetailButton = tool.detail && tool.detail !== tool.link;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4 sm:p-6 md:p-8"
      onClick={onClose} // 모달 외부 클릭 시 닫기
    >
      <div
        className="relative bg-background text-foreground rounded-xl shadow-2xl w-full max-w-lg lg:max-w-2xl h-full overflow-y-auto animate-in fade-in zoom-in-90 sm:slide-in-from-bottom-8 duration-300"
        onClick={(e) => e.stopPropagation()} // 모달 내부 클릭 시 닫히지 않도록 방지
      >
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3 rounded-full text-muted-foreground hover:bg-muted/20 hover:text-foreground"
          onClick={onClose}
        >
          <XCircle className="w-6 h-6" />
          <span className="sr-only">닫기</span>
        </Button>

        <div className="p-6 sm:p-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-primary">{tool.name}</h2>
          <Badge variant="secondary" className="mb-4 text-sm sm:text-base">{tool.category}</Badge>

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

            {tool.competitiveAdvantage && tool.competitiveAdvantage.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-2 text-foreground">경쟁 우위</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm sm:text-base">
                  {tool.competitiveAdvantage.map((comp, index) => (
                    <li key={index}>
                      <span className="font-medium text-primary-foreground">{comp.targetTool}:</span> {comp.advantage}
                    </li>
                  ))}
                </ul>
              </div>
            )}

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
          {showDetailButton && ( // 조건부 렌더링
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


const AIToolsGrid = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedToolDetail, setSelectedToolDetail] = useState(null);

  // 필터링된 도구 목록
  const filteredTools = useMemo(() => {
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
  }, [selectedCategory, searchTerm]);


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
    setShowModal(true);
    document.body.style.overflow = 'hidden'; // 모달 열렸을 때 본문 스크롤 방지
  };

  const closeToolModal = () => {
    setShowModal(false);
    setSelectedToolDetail(null);
    document.body.style.overflow = ''; // 본문 스크롤 허용
  };

  const renderToolCard = (tool) => (
    <Card
      key={tool.id}
      className="h-full flex flex-col transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
      onClick={() => openToolModal(tool)} // 카드 클릭 시 모달 열기
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-lg font-semibold">{tool.name}</CardTitle>
          <div className="flex items-center gap-2">
            {renderStars(tool.rating)}
            {tool.isPopular && (
              <Badge variant="destructive" className="text-xs">
                인기
              </Badge>
            )}
          </div>
        </div>
        <CardDescription className="text-sm leading-relaxed">
          {tool.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        {/* 장점, 약점, 무료 제한 사항은 메인 카드에서 간략히 표시하거나 숨길 수 있음 */}
        {/* 현재는 유지하되, 상세는 모달에서 집중적으로 보여줌 */}
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            {/* CheckCircle 아이콘은 모달에서만 사용 */}
            {/* <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" /> */}
            <span className="text-green-700 dark:text-green-400 line-clamp-2">
              {Array.isArray(tool.strengths) ? tool.strengths[0] : tool.strengths}
              {tool.strengths && tool.strengths.length > 1 && '...'}
            </span>
          </div>
          <div className="flex items-start gap-2">
            {/* AlertTriangle 아이콘은 모달에서만 사용 */}
            {/* <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" /> */}
            <span className="text-yellow-700 dark:text-yellow-400 line-clamp-2">
              {Array.isArray(tool.weaknesses) ? tool.weaknesses[0] : tool.weaknesses}
              {tool.weaknesses && tool.weaknesses.length > 1 && '...'}
            </span>
          </div>
          <div className="flex items-start gap-2">
            {/* Lock 아이콘은 모달에서만 사용 */}
            {/* <Lock className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" /> */}
            <span className="text-red-700 dark:text-red-400 line-clamp-2">
              {Array.isArray(tool.freeLimitations) ? tool.freeLimitations[0] : tool.freeLimitations}
              {tool.freeLimitations && tool.freeLimitations.length > 1 && '...'}
            </span>
          </div>
        </div>

        <div>
          <h4 className="font-medium text-sm mb-2">주요 기능</h4>
          <div className="flex flex-wrap gap-1">
            {tool.features && tool.features.map((feature, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="text-xs animate-fade-in-up transition-transform duration-200 hover:scale-110" // 애니메이션 및 호버 효과 추가
                style={{ animationDelay: `${index * 0.05}s` }} // 순차적 애니메이션
              >
                {feature}
              </Badge>
            ))}
          </div>
        </div>

      </CardContent>

      <CardFooter className="flex justify-between items-center pt-4">
        <Badge variant="outline" className="font-medium text-sm">
          {tool.freeLimitations && tool.freeLimitations.includes("무료") ? '무료 이용 가능' : '유료 또는 제한적 무료'}
        </Badge>
        {/* 이 부분은 모달로 옮겨졌으므로 삭제 */}
      </CardFooter>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12">
      <header className="text-center mb-12 sm:mb-16">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          AI 도구 모음
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          다양한 AI 도구들을 카테고리별로 탐색하고 최적의 도구를 찾아보세요
        </p>
      </header>

      <div className="space-y-6 mb-8 sm:mb-12">
        <div className="max-w-md mx-auto">
          <Input
            type="text"
            placeholder="도구 이름이나 기능으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-base"
          />
        </div>
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
          {categories.map(category => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className="flex items-center gap-1 sm:gap-2 px-3 py-2 text-sm sm:text-base rounded-md"
            >
              <span>{category.icon}</span>
              <span>{category.name}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* 카테고리 비교 섹션은 여기서 완전히 제거됨 */}

      <div className="text-center mb-6 sm:mb-8">
        <p className="text-base sm:text-lg text-muted-foreground">
          {filteredTools.length}개의 도구가 있습니다
        </p>
      </div>

      <div className="tools-grid">
        {filteredTools.length > 0 ? (
          filteredTools.map(renderToolCard)
        ) : (
          <div className="col-span-full text-center py-12 text-muted-foreground text-lg">
            <p>검색 조건에 맞는 도구가 없습니다.</p>
          </div>
        )}
      </div>

      {/* 모달 렌더링 */}
      <ToolDetailModal tool={selectedToolDetail} onClose={closeToolModal} />
    </div>
  );
};

export default AIToolsGrid;
