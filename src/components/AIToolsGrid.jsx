import React from 'react';
import { useState, useMemo } from 'react';
import { aiTools, categories } from '../data/aiTools';
import { aiUsageGuides } from '../data/aiUsageGuides';
import AIToolIcon from './AIToolIcon';

// Shadcn UI 컴포넌트 임포트
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  Card, CardContent, CardDescription, CardFooter,
  CardHeader, CardTitle
} from '../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '../components/ui/dialog';

// --- Lucide React 아이콘 명시적 임포트 ---
// aiTools.js와 categories 배열에 사용된 모든 'icon' 문자열에 해당하는
// Lucide React 아이콘 이름을 여기에 빠짐없이 임포트해야 합니다.
// 'MicrosoftIcon'은 존재하지 않으므로, 'SquareMicrosoft'를 임포트합니다.
import {
  Star, ExternalLink, CheckCircle, AlertTriangle, Lock, X,
  MessageSquare, Globe, FileText, Newspaper,
  ImagePlus, Image, Brush, Palette,
  Video, Film, MonitorPlay, Scissors,
  Mic, User, Briefcase, Search, Compass,
  Lightbulb, Presentation, FileSpreadsheet,
  FolderOpen, Cloud, Smile, Headphones,
  Check, Play, Package,
  Database, LayoutGrid,
  GraduationCap, Music, Shield, Users,
  Laptop, Hourglass, Handshake,
  Terminal, Layout, BookText,
  Monitor,
  SearchCode as SearchSlash,
  BookText as BookOpenText,
  Bot, // AI 챗봇
  Sparkles, // AI 마법/생성
  Brain, // AI 지능
  ImageDown, // 이미지 생성
  Languages, // 번역
  Edit3, // 텍스트 편집
  PenTool, // 디자인
  Camera, // 비디오
  ScrollText, // 문서
  Code, // 코딩
  FileCode, // 코드 파일
  ClipboardCheck, // 검사/확인
  AudioLines, // 오디오
  ScanText, // 텍스트 스캔
  Rocket, // 성능/속도
  Zap, // 파워
  Binary // 데이터/분석
} from 'lucide-react';

// 임포트된 모든 Lucide 아이콘 컴포넌트를 하나의 객체로 매핑합니다.
// aiTools.js에서 'icon: "Microsoft"'로 되어 있다면,
// 이 객체에서 'Microsoft' 키를 'SquareMicrosoft' 컴포넌트에 매핑합니다.
const LucideIcons = {
  // 기본 UI 아이콘
  Star, ExternalLink, CheckCircle, AlertTriangle, Lock, X,
  Globe, Search, Layout,
  
  // AI 챗봇 및 대화
  ChatGPT: Bot,
  Gemini: Sparkles,
  Claude: Brain,
  ClovaX: BookText,
  
  // 이미지 및 디자인
  Karlo: ImageDown,
  Midjourney: PenTool,
  "Leonardo.Ai": Palette,
  Canva: Image,
  
  // 문서 및 텍스트 처리
  Wrtn: Edit3,
  DeepL: Languages,
  "DeepL Write": ScrollText,
  StoryTell: FileText,
  CopyAi: Edit3,
  
  // 코드 및 개발
  Copilot: Code,
  Codeium: FileCode,
  Tabnine: Terminal,
  
  // 검사 및 분석
  GPTZero: ClipboardCheck,
  Originality: Shield,
  Copykiller: ClipboardCheck,
  GPTkiller: ScanText,
  
  // 오디오 및 음성
  ElevenLabs: AudioLines,
  Descript: Mic,
  
  // 기타
  Microsoft: Monitor,
  SearchSlash,
  BookOpenText,
  BookOpen: BookText,
  
  // 기본 아이콘들
  MessageSquare, FileText, Newspaper,
  ImagePlus, Brush, Video, Film,
  MonitorPlay, Scissors, User, Briefcase,
  Compass, Lightbulb, Presentation,
  FileSpreadsheet, FolderOpen, Cloud,
  Smile, Headphones, Check, Play,
  Package, Database, LayoutGrid,
  GraduationCap, Music, Shield, Users,
  Laptop, Hourglass, Handshake
};


const AIToolsGrid = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedTool, setSelectedTool] = useState(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);

  // 필터링된 도구 목록을 메모이제이션하여 성능 최적화
  const filteredTools = useMemo(() => {
    let tools = aiTools;

    // 선택된 카테고리에 따라 도구 필터링
    if (selectedCategory !== 'all') {
      tools = tools.filter(tool => tool.category === selectedCategory);
    }

    // 검색어에 따라 도구 필터링 (이름, 설명, 기능)
    if (searchTerm) {
      tools = tools.filter(tool =>
        tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tool.features && tool.features.some(feature => feature.toLowerCase().includes(searchTerm.toLowerCase())))
      );
    }
    return tools;
  }, [selectedCategory, searchTerm]);

  // 활용법(워크플로우) 검색 결과를 메모이제이션
  const filteredWorkflows = useMemo(() => {
    if (!searchTerm) return []; // 검색어가 없으면 활용법을 표시하지 않음

    return aiUsageGuides.filter(workflow =>
      workflow.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workflow.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workflow.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [searchTerm]);

  // 별점 아이콘 렌더링 함수
  const renderStars = (rating) => {
    const fullStars = Math.floor(rating); // 정수 별 개수
    const hasHalfStar = rating % 1 !== 0; // 반쪽 별 여부

    return (
      <div className="flex items-center gap-0.5">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        ))}
        {hasHalfStar && <Star className="w-4 h-4 fill-yellow-400/50 text-yellow-400" />}
        <span className="text-xs text-muted-foreground ml-1">{rating}</span>
      </div>
    );
  };

  // 도구 상세 정보 모달 열기
  const openToolModal = (tool) => {
    setSelectedTool(tool);
    setShowModal(true);
  };

  // 활용법 상세 정보 모달 열기
  const openWorkflowModal = (workflow) => {
    setSelectedWorkflow(workflow);
    setShowModal(true);
  };

  // 모든 모달 닫기
  const closeModal = () => {
    setShowModal(false);
    setSelectedTool(null);
    setSelectedWorkflow(null);
  };

  // 주요 기능(features)이 도구의 강점(strengths)에 해당하는지 확인하는 함수
  const isStrongPointFeature = (feature, strengths) => {
    if (!Array.isArray(strengths)) return false;
    // 강점 배열에 feature 텍스트가 포함되어 있는지 대소문자 구분 없이 확인
    return strengths.some(strength => strength.toLowerCase().includes(feature.toLowerCase()));
  };

  // 개별 AI 도구 카드를 렌더링하는 함수
  const renderToolCard = (tool) => {
    // aiTools.js의 icon 문자열에 해당하는 Lucide React 컴포넌트를 가져옵니다.
    // LucideIcons 객체에 해당 아이콘이 없으면 Globe 아이콘을 폴백으로 사용합니다.
    const IconComponent = LucideIcons[tool.icon] || Globe;

    return (
      <Card
        key={tool.id}
        className="group h-full min-h-[420px] max-h-[480px] flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer
                   bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden w-full"
        style={{ maxWidth: '100%' }}
        onClick={() => openToolModal(tool)}
      >
        <CardHeader className="pb-4 pt-4 px-4 flex-row items-start border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-4">
            {/* AI 도구 아이콘 영역 */}
            <div className="flex-shrink-0 w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-700
             flex items-center justify-center shadow-inner group-hover:bg-primary/10 transition-colors duration-300">
              {tool.name && (
                <AIToolIcon 
                  tool={tool}
                  className="w-[22px] h-[22px] text-gray-700 dark:text-gray-200 group-hover:text-primary transition-colors duration-300"
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100 truncate mb-2">{tool.name}</CardTitle>
                <div className="flex items-center gap-2">
                  {renderStars(tool.rating)}
                  {tool.rating >= 4.8 && (
                    <Badge variant="destructive" className="text-xs animate-fade-in-right">
                      인기
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 px-4 py-4 space-y-4">
          {/* 설명 */}
          <CardDescription className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-3">
            {tool.description}
          </CardDescription>

          {/* 첫 번째 강점 */}
          {tool.strengths && tool.strengths.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-start gap-2 text-sm text-green-700 dark:text-green-300">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span className="leading-relaxed line-clamp-2">{tool.strengths[0]}</span>
              </div>
            </div>
          )}

          {/* 주요 기능 (features) 태그 */}
          <div>
            <h4 className="font-semibold text-gray-700 dark:text-gray-200 mb-2 text-sm">주요 기능</h4>
            <div className="flex flex-wrap gap-2">
              {tool.features.slice(0, 6).map((feature, index) => (
                <Badge
                  key={index}
                  variant={isStrongPointFeature(feature, tool.strengths) ? "destructive" : "secondary"}
                  className="text-xs transition-all duration-300 hover:scale-110 animate-fade-in-up whitespace-nowrap"
                >
                  {feature}
                </Badge>
              ))}
            </div>
          </div>


        </CardContent>
      </Card>
    );
  };

  // 워크플로우 카드 렌더링 함수
  const renderWorkflowCard = (workflow) => (
    <Card
      key={workflow.id}
      className="group h-full min-h-[420px] max-h-[480px] flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer
                 bg-blue-50 dark:bg-gray-700 border border-blue-100 dark:border-gray-600 rounded-lg overflow-hidden w-full"
      style={{ maxWidth: '100%' }}
      onClick={() => openWorkflowModal(workflow)}
    >
      <CardHeader className="pb-4 pt-4 px-4 border-b border-blue-100 dark:border-gray-600">
        <CardTitle className="text-xl font-bold text-blue-800 dark:text-blue-200 line-clamp-1">{workflow.title}</CardTitle>
        <CardDescription className="text-blue-600 dark:text-blue-300 line-clamp-2">
          {workflow.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 px-4 py-4 space-y-3">
        <h4 className="font-semibold text-blue-700 dark:text-blue-200 mb-2 text-sm">주요 단계</h4>
        <ul className="space-y-2">
          {workflow.steps.slice(0, 3).map((step, index) => (
            <li key={index} className="flex items-start gap-2 bg-blue-100/50 dark:bg-gray-600/50 p-2 rounded-md">
              <span className="font-medium text-blue-500 dark:text-blue-300 flex-shrink-0">{step.step_number}.</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-blue-800 dark:text-blue-100 font-medium line-clamp-1">{step.tool_name}</p>
                <p className="text-xs text-blue-600 dark:text-blue-300 mt-0.5 line-clamp-2">{step.tool_action}</p>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* 메인 헤더 섹션 */}
      <header className="text-center mb-12 p-8 bg-green-100 dark:bg-gray-900 rounded-lg shadow-lg max-w-4xl mx-auto
                         animate-fade-in-down transition-all duration-500 transform scale-100 hover:scale-105">
        <h1 className="text-5xl font-extrabold mb-4 text-green-900 dark:text-green-500 font-serif">
          AI 도구 모음
        </h1>
        <p className="text-lg text-green-700 dark:text-green-300 max-w-2xl mx-auto mt-4">
          수백 가지 AI 도구 중, <span className="font-semibold">한국 사용자를 위해 선별된 AI Tools</span>만 소개합니다.<br />
          당신에게 꼭 맞는 AI 도구를 찾아보세요!
        </p>
      </header>

      {/* 검색 및 카테고리 필터 섹션 */}
      <div className="space-y-6 mb-12 px-4 max-w-4xl mx-auto">
        <div className="max-w-xl mx-auto">
          <Input
            type="text"
            placeholder="원하는 작업이나 도구 이름으로 검색해보세요. (예: '보고서 작성', '영상 편집', '블로그 글')"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
                setSearchTerm(''); // 카테고리 선택 시 검색어 초기화
              }}
              className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium
                         transition-all duration-300 hover:scale-105 hover:shadow-md
                         data-[state=active]:bg-primary data-[state=active]:text-primary-foreground
                         bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600"
            >
              {/* 카테고리 아이콘 렌더링 (안전성 강화) */}
              {React.createElement(LucideIcons[category.icon] || Globe, { className: "w-4 h-4" })}
              <span>{category.name}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* 활용법(워크플로우) 추천 섹션 */}
      {searchTerm && filteredWorkflows.length > 0 && (
        <section className="mb-12 px-4 max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-800 dark:text-gray-100 animate-fade-in-up">
            ✨ 추천 활용법
          </h2>
          <div className="tools-grid">
            {filteredWorkflows.map(renderWorkflowCard)}
          </div>
          <div className="text-center mt-8 text-gray-600 dark:text-gray-300">
            <p>위 활용법이 당신의 작업에 도움이 될 것입니다.</p>
          </div>
        </section>
      )}

      {/* AI 도구 그리드 섹션 */}
      <section className="mb-12 px-4 max-w-7xl mx-auto">
        {!searchTerm && ( // 검색어가 없을 때만 "AI 도구" 제목 표시
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-800 dark:text-gray-100 animate-fade-in-up">
            AI 도구 ({filteredTools.length}개)
          </h2>
        )}
        {searchTerm && filteredTools.length > 0 && ( // 검색어가 있고, 도구도 있을 때만 "AI 도구 검색 결과" 제목 표시
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-800 dark:text-gray-100 animate-fade-in-up">
            AI 도구 검색 결과 ({filteredTools.length}개)
          </h2>
        )}

        {filteredTools.length > 0 ? (
          <div className="tools-grid">
            {filteredTools.map(renderToolCard)}
          </div>
        ) : (
          <div className="text-center text-gray-600 dark:text-gray-300 py-10">
            <p className="text-xl">검색 조건에 맞는 도구 또는 활용법이 없습니다.</p>
            <p className="text-md mt-2">다른 검색어나 카테고리를 선택해보세요.</p>
          </div>
        )}
      </section>

      {/* 도구 및 활용법 상세 모달 */}
      {showModal && (
        <Dialog open={showModal} onOpenChange={closeModal}>
          <DialogContent className="w-full max-w-[700px] p-6 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto">
            <DialogHeader className="flex justify-between items-start sticky top-0 bg-white dark:bg-gray-800 z-10 pb-4">
              {selectedTool && (
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    {/* 아이콘 컴포넌트 렌더링 (모달 내부) */}
                    {React.createElement(LucideIcons[selectedTool.icon] || Globe, { className: "w-6 h-6 text-gray-700 dark:text-gray-200" })}
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-bold">{selectedTool.name}</DialogTitle>
                    <DialogDescription className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedTool.category} | 평점: {selectedTool.rating}
                    </DialogDescription>
                  </div>
                </div>
              )}
              {selectedWorkflow && (
                <div>
                  <DialogTitle className="text-2xl font-bold text-blue-600 dark:text-blue-300">{selectedWorkflow.title}</DialogTitle>
                  <DialogDescription className="text-sm text-blue-500 dark:text-blue-400">
                    추천 활용법
                  </DialogDescription>
                </div>
              )}
              <Button onClick={closeModal} variant="ghost" className="absolute right-4 top-4 rounded-full">
                <X className="w-5 h-5 text-gray-500" />
              </Button>
            </DialogHeader>

            {selectedTool && (
              <div className="mt-4 space-y-4 text-gray-800 dark:text-gray-200">
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

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4 flex justify-end gap-2">
                  <Button size="lg" asChild className="rounded-full shadow-md">
                    <a href={selectedTool.link} target="_blank" rel="noopener noreferrer">
                      사용해보기
                    </a>
                  </Button>
                  {selectedTool.detail && selectedTool.detail !== selectedTool.link && (
                    <Button size="lg" variant="outline" asChild className="rounded-full shadow-md">
                      <a href={selectedTool.detail} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-5 h-5 mr-2" /> 상세 정보
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            )}

            {selectedWorkflow && (
              <div className="mt-4 space-y-4 text-gray-800 dark:text-gray-200">
                <p className="text-base leading-relaxed text-blue-700 dark:text-blue-300">{selectedWorkflow.description}</p>
                <div className="space-y-3">
                  <h3 className="font-semibold text-xl text-blue-800 dark:text-blue-200">단계별 가이드</h3>
                  {selectedWorkflow.steps.map((step, index) => (
                    <div key={index} className="flex items-start bg-blue-50 dark:bg-blue-900 p-4 rounded-lg shadow-sm">
                      <span className="text-2xl font-bold text-blue-600 dark:text-blue-400 mr-4 flex-shrink-0">{step.step_number}.</span>
                      <div>
                        <p className="font-semibold text-lg text-blue-700 dark:text-blue-300">{step.tool_name}</p>
                        <p className="text-md text-gray-800 dark:text-gray-100 mt-1">{step.tool_action}</p>
                        {step.details && <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{step.details}</p>}
                      </div>
                    </div>
                  ))}
                </div>
                {selectedWorkflow.keywords && selectedWorkflow.keywords.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg text-gray-700 dark:text-gray-200">관련 키워드</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedWorkflow.keywords.map((keyword, index) => (
                        <Badge key={index} variant="outline" className="text-sm">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Additional Sections Placeholder */}
      <section className="mt-20 py-12 bg-gray-50 dark:bg-gray-900 shadow-inner">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-12">
          <h2 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-8 animate-fade-in-up">AI를 더 잘 활용하는 방법</h2>

          {/* 활용 가이드 섹션 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col items-center justify-center text-center animate-fade-in-up delay-200">
              <LucideIcons.BookOpenText className="w-16 h-16 text-blue-500 mb-4" />
              <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">활용 가이드</h3>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                각 AI 도구의 상세한 사용법과 팁, 그리고 작업 효율을 높이는 노하우를 배워보세요.
              </p>
              <Button variant="link" className="mt-4 text-blue-600 dark:text-blue-400">더 알아보기</Button>
            </div>

            {/* 프롬프트 검색 섹션 */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col items-center justify-center text-center animate-fade-in-up delay-400">
              <LucideIcons.SearchSlash className="w-16 h-16 text-purple-500 mb-4" />
              <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">프롬프트 허브</h3>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                최적의 AI 결과물을 위한 다양한 프롬프트 예시와 작성 가이드를 찾아보세요.
              </p>
              <Button variant="link" className="mt-4 text-purple-600 dark:text-purple-400">프롬프트 검색</Button>
            </div>

            {/* AI 뉴스 섹션 */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col items-center justify-center text-center animate-fade-in-up delay-600">
              <LucideIcons.Newspaper className="w-16 h-16 text-emerald-500 mb-4" />
              <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">AI 최신 뉴스</h3>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                빠르게 변화하는 AI 산업의 최신 소식과 트렌드를 한눈에 확인하세요.
              </p>
              <Button variant="link" className="mt-4 text-emerald-600 dark:text-emerald-400">뉴스 보기</Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AIToolsGrid;
