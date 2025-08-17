// src/components/AIToolsGrid.jsx
import React, { useState, useMemo } from 'react'
import AutoBrandIcon from './AutoBrandIcon.jsx';

// Shadcn UI 컴포넌트 임포트 (경로 수정: `./ui/파일이름` 형태로)
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import {
  Card, CardContent, CardDescription, CardFooter,
  CardHeader, CardTitle
} from './ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { useToast } from './ui/use-toast';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';

// --- Lucide React 전체 모듈 임포트 ---
import * as Lucide from 'lucide-react';
import { aiTools, categories } from '../data/aiTools.js'; 

// AIToolsGrid.jsx에서 직접 사용하는 Lucide 아이콘 매핑 (주로 카테고리 아이콘, 기타 UI 요소)
// 이 LucideIcons 객체는 AIToolsGrid.jsx 내에서만 사용되며, AIToolIcon.jsx의 LucideIconMap과는 독립적입니다.
const LucideIcons = {
  // 기본 UI 아이콘 (AIToolsGrid.jsx에서 직접 사용하는 것들)
  Star: Lucide.Star,
  ExternalLink: Lucide.ExternalLink,
  CheckCircle: Lucide.CheckCircle,
  AlertTriangle: Lucide.AlertTriangle,
  Lock: Lucide.Lock,
  X: Lucide.X,
  Globe: Lucide.Globe,
  Search: Lucide.Search,
  Layout: Lucide.Layout,
  BookOpen: Lucide.BookOpen, // '활용 가이드' 섹션
  Lightbulb: Lucide.Lightbulb, // '프롬프트 허브' 섹션
  Newspaper: Lucide.Newspaper, // 'AI 최신 뉴스' 섹션
  
  // aiTools.js의 categories 배열 'icon' 필드와 매칭되는 Lucide 아이콘
  MessageSquare: Lucide.MessageSquare, // '대화' 카테고리
  FilePen: Lucide.FilePen,             // '문서편집' 카테고리 (aiTools.js에 'FilePen'으로 정의되어 있다고 가정)
  Palette: Lucide.Palette,             // '이미지/디자인' 카테고리
  Video: Lucide.Video,                 // '동영상' 카테고리
  Mic: Lucide.Mic,                     // '음성' 카테고리
  Presentation: Lucide.Presentation,   // 'PPT/발표' 카테고리
  Hourglass: Lucide.Hourglass,         // '생산성' 카테고리
  Users: Lucide.Users,                 // '협업' 카테고리
  Handshake: Lucide.Handshake,         // '채용' 카테고리
  Laptop: Lucide.Laptop,               // '코딩/노코드' 카테고리

  // 기타 AIToolsGrid 내에서 직접 Lucide.<IconName> 형태로 사용될 수 있는 아이콘들 (옵셔널, 중복 방지)
  SearchSlash: Lucide.SearchCode,     
  BookOpenText: Lucide.BookText,      
  Bot: Lucide.Bot,
  Camera: Lucide.Camera,
  ScrollText: Lucide.ScrollText,
  ClipboardCheck: Lucide.ClipboardCheck,
  Code: Lucide.Code,
  FileCode: Lucide.FileCode,
  SquareFunction: Lucide.SquareFunction,
  NotebookText: Lucide.NotebookText,
  GanttChart: Lucide.GanttChart,
  Rocket: Lucide.Rocket,
  Zap: Lucide.Zap,
  Binary: Lucide.Binary,
  Megaphone: Lucide.Megaphone,
  MessageSquareMore: Lucide.MessageSquareMore,
  FileAudio: Lucide.FileAudio,
  VolumeX: Lucide.VolumeX,
  Ruler: Lucide.Ruler,
  Home: Lucide.Home,
  ImageUp: Lucide.ImageUp,
  SquareTerminal: Lucide.SquareTerminal,
  AlignJustify: Lucide.AlignJustify,
  ClipboardList: Lucide.ClipboardList,
  CheckShield: Lucide.CheckShield,
  VideoText: Lucide.VideoText,
  SpellCheck: Lucide.SpellCheck,
  Sparkles: Lucide.Sparkles,
  Brain: Lucide.Brain,
  Image: Lucide.Image,
  PenTool: Lucide.PenTool,
  ImageDown: Lucide.ImageDown,
  Languages: Lucide.Languages,
  Edit3: Lucide.Edit3,
  AudioLines: Lucide.AudioLines,
  Film: Lucide.Film,
  Scissors: Lucide.Scissors,
};

const AIToolsGrid = () => {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('popular') // popular, name, rating
  const [showToolModal, setShowToolModal] = useState(false);
  const [selectedTool, setSelectedTool] = useState(null);

  const openToolModal = (tool) => {
    setSelectedTool(tool);
    setShowToolModal(true);
  };

  const closeModal = () => {
    setShowToolModal(false);
    setSelectedTool(null);
  };

  // 필터링 및 정렬된 도구들 (aiTools.js에서 직접 가져오기)
  const filteredAndSortedTools = useMemo(() => {
    let filtered = aiTools

    // 카테고리 필터
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(tool => tool.category === selectedCategory)
    }

    // 검색 필터
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(tool => 
        tool.name.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query) ||
        tool.category.toLowerCase().includes(query) ||
        tool.features?.some(feature => feature.toLowerCase().includes(query))
      )
    }

    // 정렬
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          // 인기도: 한국 인기 > 글로벌 인기 > 평점 > 이름
          if (a.isPopularKr !== b.isPopularKr) return b.isPopularKr - a.isPopularKr
          if (a.isPopular !== b.isPopular) return b.isPopular - a.isPopular
          if (a.rating !== b.rating) return b.rating - a.rating
          return a.name.localeCompare(b.name)
        case 'rating':
          return b.rating - a.rating
        case 'name':
          return a.name.localeCompare(b.name)
        default:
          return 0
      }
    })
  }, [selectedCategory, searchQuery, sortBy])

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating); // 정수 별 개수
    const hasHalfStar = rating % 1 !== 0; // 반쪽 별 여부

    return (
      <div className="flex items-center gap-0.5">
        {[...Array(fullStars)].map((_, i) => (
          <Lucide.Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        ))}
        {hasHalfStar && <Lucide.Star className="w-4 h-4 fill-yellow-400/50 text-yellow-400" />}
        <span className="text-xs text-muted-foreground ml-1">{rating}</span>
      </div>
    );
  };

  const isStrongPointFeature = (feature, strengths) => {
    if (!Array.isArray(strengths)) return false;
    // 강점 배열에 feature 텍스트가 포함되어 있는지 대소문자 구분 없이 확인
    return strengths.some(strength => strength.toLowerCase().includes(feature.toLowerCase()));
  };

  

  const renderIcon = (iconName) => {
    const IconComponent = LucideIcons[iconName]
    return IconComponent ? <IconComponent className="w-5 h-5" /> : <Lucide.Globe className="w-5 h-5" />
  }

  const getPricingBadgeColor = (tool) => {
    if (tool.freeLimitations && tool.freeLimitations.includes('무료')) {
      return 'bg-green-100 text-green-800'
    }
    if (tool.freeLimitations && (tool.freeLimitations.includes('체험') || tool.freeLimitations.includes('제한'))) {
      return 'bg-blue-100 text-blue-800'
    }
    return 'bg-orange-100 text-orange-800'
  }

  const getPricingText = (tool) => {
    if (tool.freeLimitations && tool.freeLimitations.includes('무료')) {
      return '무료'
    }
    if (tool.freeLimitations && (tool.freeLimitations.includes('체험') || tool.freeLimitations.includes('제한'))) {
      return '프리미엄'
    }
    return '유료'
  }

  return (
      <div className="min-h-screen bg-white py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 bg-green-100 text-green-800 px-4 py-2 rounded-full mb-4">
            <Lucide.Sparkles className="w-4 h-4" />
            <span className="font-medium text-sm">AI 도구 모음</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            나에게 꼭 맞는 AI 도구 찾기
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            한국인이 쓰기 가장 편한걸로 골랐습니다.<br/>
            <span className="text-green-800 font-semibold">하고싶은 작업만 입력하면 자동으로 AI모델을 추천해줍니다.</span>
          </p>
        </div>

        {/* 검색 및 카테고리 필터 섹션 */}
        <div className="space-y-6 mb-12 px-4 max-w-4xl mx-auto">
          <div className="max-w-xl mx-auto">
            <Input
              type="text"
              placeholder="원하는 작업이나 도구 이름으로 검색해보세요. (예: '보고서 작성', '영상 편집', '블로그 글')"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  // 엔터 키 누르면 검색 (상태 업데이트로 자동 반영)
                }
              }}
              className="w-full rounded-full py-2 px-6 text-base shadow-lg focus:ring-2 focus:ring-blue-500 transition-all duration-300
                         bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100
                         focus:border-blue-500 focus:shadow-outline"
            />
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map(category => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectedCategory(category.id);
                  setSearchQuery(''); // 카테고리 선택 시 검색어 초기화
                }}
                className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium
                           transition-all duration-300 hover:scale-105 hover:shadow-md
                           data-[state=active]:bg-primary data-[state=active]:text-primary-foreground
                           bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600"
              >
                {/* 카테고리 아이콘 렌더링 (안전성 강화) */}
                {/* LucideIcons 객체는 AIToolsGrid.jsx 내에서 정의되어 있습니다. */}
                {React.createElement(LucideIcons[category.icon] || Lucide.Globe, { className: "w-4 h-4" })}
                <span>{category.name}</span>
              </Button>
            ))}
          </div>
          {/* 정렬 옵션 */}
          <div className="flex justify-center gap-2">
            <Button
              variant={sortBy === 'popular' ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy('popular')}
            >
              인기순
            </Button>
            <Button
              variant={sortBy === 'rating' ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy('rating')}
            >
              평점순
            </Button>
            <Button
              variant={sortBy === 'name' ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy('name')}
            >
              이름순
            </Button>
          </div>
        </div>

        {/* AI 도구 그리드 섹션 */}
        <section className="mb-12 px-4 max-w-7xl mx-auto">
          {!searchQuery && ( // 검색어가 없을 때만 "AI 도구" 제목 표시
            <h2 className="text-3xl font-bold text-center mb-8 text-gray-800 dark:text-gray-100 animate-fade-in-up">
              AI 도구 ({filteredAndSortedTools.length}개)
            </h2>
          )}
          {searchQuery && filteredAndSortedTools.length > 0 && ( // 검색어가 있고, 도구도 있을 때만 "AI 도구 검색 결과" 제목 표시
            <h2 className="text-3xl font-bold text-center mb-8 text-gray-800 dark:text-gray-100 animate-fade-in-up">
              AI 도구 검색 결과 ({filteredAndSortedTools.length}개)
            </h2>
          )}

          {filteredAndSortedTools.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedTools.map((tool) => (
            <Card key={tool.id} className="bg-slate-100 hover:shadow-lg transition-all duration-200 group" onClick={() => openToolModal(tool)}>
              <CardHeader>
                <div className="flex items-start gap-3 mb-2">
                  <div className="flex-shrink-0">
                    <AutoBrandIcon
                      domain={tool.domain || tool.link}
                      name={tool.name}
                      size={48} // 예: 48~56 추천
                      className="shrink-0 md:[width:56px] md:[height:56px]"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-lg truncate">{tool.name}</CardTitle>
                      {tool.isPopularKr && (
                        <Badge className="bg-red-100 text-red-800 text-xs">🇰🇷 인기</Badge>
                      )}
                      {tool.isKorean && (
                        <Badge className="bg-blue-100 text-blue-800 text-xs">한국어</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className="text-xs">{tool.category}</Badge>
                      <div className="flex items-center gap-1">
                        <Lucide.Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm text-gray-600">{tool.rating}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <CardDescription className="text-gray-600 mb-4 text-sm leading-relaxed line-clamp-3">
                  {tool.description}
                </CardDescription>
                
                {/* 주요 기능 */}
                {tool.features && tool.features.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {tool.features.slice(0, 3).map((feature, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                      {tool.features.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{tool.features.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
                
                {/* 하단 액션 */}
                <div className="flex items-center justify-between">
                  <Badge className={getPricingBadgeColor(tool)}>
                    {getPricingText(tool)}
                  </Badge>
                  
                  <Button 
                    className="flex items-center gap-2 group-hover:bg-blue-600 transition-colors"
                    size="sm"
                  >
                    <Lucide.ExternalLink className="w-4 h-4" />
                    사용하기
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
            </div>
          ) : (
            <div className="text-center text-gray-600 dark:text-gray-300 py-10">
              <p className="text-xl">검색 조건에 맞는 도구 또는 활용법이 없습니다.</p>
              <p className="text-md mt-2">다른 검색어나 카테고리를 선택해보세요.</p>
            </div>
          )}
        </section>

        {/* 도구 및 활용법 상세 모달 */}
        {showToolModal && (
          <Dialog open={showToolModal} onOpenChange={closeModal}>
            <DialogContent 
              className="w-full max-w-[600px] p-0 bg-transparent text-gray-900 dark:text-gray-100 rounded-lg shadow-none animate-fade-in-up max-h-[80vh] overflow-visible"
            >
              {selectedTool && (
                <div className="relative rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 overflow-visible">
                  {/* 패널은 버튼이 잘리지 않게 overflow-visible 권장 */}
                  <div className="relative rounded-2xl bg-white shadow ring-1 ring-black/5 overflow-visible">
                    <div className="relative grid grid-cols-[auto_1fr] gap-3 items-start p-5">
                      {/* 아이콘: X는 여기 두지 않음 */}
                      <AutoBrandIcon domain={selectedTool.domain || selectedTool.link} name={selectedTool.name} size={56} className="shrink-0" />

                      {/* 제목/메타 */}
                      <div className="pr-10">
                        <h3 className="text-lg font-semibold text-gray-900">{selectedTool.name}</h3>
                        <p className="mt-0.5 text-xs text-gray-500">{selectedTool.category} · 평점: {selectedTool.rating}</p>
                      </div>

                      {/* ✅ 닫기 버튼은 헤더 우상단 하나만 */}
                      
                    </div>
                    {/* ...본문... */}
                  </div>

                  <div className="border-t border-gray-100" />
                  {/* ==== 본문 ... ==== */}
                  <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]" onClick={(e) => e.stopPropagation()}> 
                    <p className="text-base leading-relaxed">{selectedTool.description}</p>

                    {selectedTool.strengths && selectedTool.strengths.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="font-semibold text-lg text-green-700 dark:text-green-300">✅ 강점</h3>
                        <ul className="list-disc list-inside space-y-1">
                          {selectedTool.strengths.map((item, index) => (
                            <li key={index} className="text-sm">{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {selectedTool.weaknesses && selectedTool.weaknesses.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="font-semibold text-lg text-yellow-700 dark:text-yellow-300">⚠️ 약점</h3>
                        <ul className="list-disc list-inside space-y-1">
                          {selectedTool.weaknesses.map((item, index) => (
                            <li key={index} className="text-sm">{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {selectedTool.freeLimitations && (
                      <div className="space-y-2">
                        <h3 className="font-semibold text-lg text-red-700 dark:text-red-300">🔒 무료 사용 제한</h3>
                        <p className="text-sm">{selectedTool.freeLimitations}</p>
                      </div>
                    )}

                    {selectedTool.features && selectedTool.features.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="font-semibold text-lg text-gray-700 dark:text-gray-200">✨ 주요 기능</h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedTool.features.map((feature, index) => (
                            <Badge
                              key={index}
                              variant={isStrongPointFeature(feature, selectedTool.strengths) ? "destructive" : "secondary"}
                              className="text-sm"
                            >
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 사용 사례 렌더링 부분 */}
                    {selectedTool.usecases && selectedTool.usecases.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="font-semibold text-lg text-gray-700 dark:text-gray-200">💡 실용적 활용법</h3>
                        <div className="space-y-2">
                          {selectedTool.usecases.map((usecase, index) => (
                            <div key={index} className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md">
                              <div className="font-medium text-sm text-primary dark:text-blue-300">{usecase.title}</div>
                              <div className="text-xs text-muted-foreground dark:text-gray-400 mt-1">{usecase.detail}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedTool.competitiveAdvantage && selectedTool.competitiveAdvantage.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="font-semibold text-lg text-purple-700 dark:text-purple-300">⚔️ 경쟁 우위</h3>
                        <ul className="list-disc list-inside space-y-1">
                          {selectedTool.competitiveAdvantage.map((item, index) => (
                            <li key={index} className="bg-purple-50 dark:bg-purple-900 p-3 rounded-md text-sm">
                              <span className="font-medium text-purple-800 dark:text-purple-200">vs {item.vs}:</span> {item.advantage}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4 flex justify-end gap-2" onClick={(e) => e.stopPropagation()}> 
                      <Button size="lg" asChild className="rounded-full shadow-md">
                        <a href={selectedTool.link} target="_blank" rel="noopener noreferrer">
                          사용해보기
                        </a>
                      </Button>
                      {selectedTool.detail && selectedTool.detail !== selectedTool.link && (
                        <Button size="lg" variant="outline" asChild className="rounded-full shadow-md">
                          <a href={selectedTool.detail} target="_blank" rel="noopener noreferrer">
                            <Lucide.ExternalLink className="w-5 h-5 mr-2" /> 상세 정보
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        )}
      </div>
    );
}

export default AIToolsGrid