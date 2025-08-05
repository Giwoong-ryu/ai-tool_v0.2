import React from 'react';
import { useState, useMemo, useCallback } from 'react';
import { aiTools, categories, aiUsageGuides } from '../data/aiTools';
import AIToolIcon from './AIToolIcon'; // AIToolIcon은 이제 자체적으로 모든 아이콘 로딩 로직을 처리합니다.

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
// AIToolsGrid.jsx 내에서 모든 Lucide 아이콘을 Lucide 객체로 접근합니다.
import * as Lucide from 'lucide-react'; 

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
  Palette: Lucide.Palette,
  Languages: Lucide.Languages,
  Edit3: Lucide.Edit3,
  AudioLines: Lucide.AudioLines,
  Mic: Lucide.Mic,
  Film: Lucide.Film,
  Video: Lucide.Video,
  Scissors: Lucide.Scissors,
};


// PromptGeneratorModal 컴포넌트
const PromptGeneratorModal = ({ isOpen, onClose, aiToolsData }) => {
  const { toast } = useToast();

  const [role, setRole] = useState('');
  const [topic, setTopic] = useState('');
  const [conditions, setConditions] = useState('');
  const [outputFormat, setOutputFormat] = useState('');
  const [tone, setTone] = useState(''); // 초기값을 빈 문자열로 유지
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [recommendedModel, setRecommendedModel] = useState({ primary: '', alternative: '' });
  const [promptQuality, setPromptQuality] = useState(50); // 슬라이더 기본값

  // 추천 모델 URL 맵
  const modelUrls = useMemo(() => ({
    'ChatGPT': 'https://chat.openai.com/',
    'Gemini': 'https://gemini.google.com/',
    'Claude': 'https://claude.ai/',
    'Wrtn': 'https://wrtn.ai/',
    'DeepL': 'https://www.deepl.com/translator',
    'Midjourney': 'https://www.midjourney.com/',
    'RunwayML': 'https://runwayml.com/',
    'HeyGen': 'https://www.heygen.com/',
    'ElevenLabs': 'https://elevenlabs.io/',
    'D-ID': 'https://www.d-id.com/',
    'Cursor': 'https://cursor.sh/', // 외부 모델
    'Perplexity': 'https://www.perplexity.ai/', // 외부 모델
    // aiTools.js의 link 필드를 활용하여 동적으로 가져올 수도 있습니다.
  }), []);


  const getModelUrl = (modelName) => {
    // aiToolsData에서 해당 모델의 link를 찾아 반환
    const tool = aiToolsData.find(tool => tool.name === modelName);
    if (tool && tool.link) {
      return tool.link;
    }
    // 미리 정의된 modelUrls에서 찾아 반환
    return modelUrls[modelName] || `https://www.google.com/search?q=${encodeURIComponent(modelName + ' AI tool')}`;
  };

  const recommendModel = useCallback((promptText) => {
    const lowerPrompt = promptText.toLowerCase();
    let primary = 'ChatGPT'; // 기본값
    let alternatives = [];
    let rationale = '범용적인 텍스트 생성에 적합합니다.';

    // 6) "전송 + 모델 추천" 프롬프트 문서 기반 로직
    if (lowerPrompt.includes('서사') || lowerPrompt.includes('장문 구조화') || lowerPrompt.includes('긴 글')) {
      primary = 'Claude';
      alternatives = ['ChatGPT', 'Gemini', 'Wrtn'];
      rationale = '긴 텍스트 컨텍스트 처리와 서사 구조화에 강점이 있습니다.';
    } else if (lowerPrompt.includes('포맷 엄격') || lowerPrompt.includes('표') || lowerPrompt.includes('json') || lowerPrompt.includes('데이터')) {
      primary = 'ChatGPT';
      alternatives = ['Gemini'];
      rationale = '정확한 포맷 준수 및 데이터 구조화에 강점이 있습니다.';
    } else if (lowerPrompt.includes('코드') || lowerPrompt.includes('ide') || lowerPrompt.includes('프로그래밍') || lowerPrompt.includes('디버깅')) {
      primary = 'Cursor';
      alternatives = ['ChatGPT', 'Copilot'];
      rationale = '코드 생성 및 디버깅에 특화된 기능을 제공합니다.';
    } else if (lowerPrompt.includes('검색') || lowerPrompt.includes('출처') || lowerPrompt.includes('최신 정보')) {
      primary = 'Perplexity';
      alternatives = ['Gemini'];
      rationale = '실시간 웹 검색 및 출처 기반 답변에 강점이 있습니다.';
    } else if (lowerPrompt.includes('google sheets') || lowerPrompt.includes('구글 시트') || lowerPrompt.includes('스프레드시트')) {
      primary = 'Gemini';
      alternatives = ['ChatGPT'];
      rationale = 'Google 서비스와의 연동성이 뛰어나 스프레드시트 작업에 용이합니다.';
    } else if (lowerPrompt.includes('이미지') || lowerPrompt.includes('디자인') || lowerPrompt.includes('그림') || lowerPrompt.includes('포토샵')) {
      primary = 'Midjourney';
      alternatives = ['Karlo', 'Leonardo.Ai', 'Adobe Firefly', 'Canva Magic Studio'];
      rationale = '고품질의 예술적인 이미지 생성에 최적입니다.';
    } else if (lowerPrompt.includes('영상') || lowerPrompt.includes('비디오') || lowerPrompt.includes('편집')) {
      primary = 'RunwayML';
      alternatives = ['HeyGen', 'Synthesia', 'CapCut', 'Vrew', 'Pictory AI'];
      rationale = '텍스트/이미지 기반 영상 생성 및 편집에 강점이 있습니다.';
    } else if (lowerPrompt.includes('음성') || lowerPrompt.includes('오디오') || lowerPrompt.includes('녹음')) {
      primary = 'ElevenLabs';
      alternatives = ['Descript', 'Krisp'];
      rationale = '고품질 음성 합성 및 복제에 뛰어납니다.';
    } else if (lowerPrompt.includes('번역') || lowerPrompt.includes('언어')) {
      primary = 'DeepL';
      alternatives = ['Gemini'];
      rationale = '자연스러운 번역 품질에 강점이 있습니다.';
    } else if (lowerPrompt.includes('자기소개서') || lowerPrompt.includes('보고서') || lowerPrompt.includes('글쓰기') || lowerPrompt.includes('문서')) {
      primary = 'Wrtn';
      alternatives = ['ChatGPT', 'Claude', 'Copy.ai'];
      rationale = '한국어 글쓰기 및 다양한 문서 형식 생성에 특화되어 있습니다.';
    }

    setRecommendedModel({ primary, alternative: alternatives[0] || '' });
  }, [modelUrls, aiToolsData]); // aiToolsData도 의존성에 추가하여 동적 URL 매핑 가능

  const handleGeneratePrompt = useCallback(async () => {
    setLoading(true);
    setGeneratedPrompt('');
    setRecommendedModel({ primary: '', alternative: '' });

    const personaPart = role ? `당신은 ${role}입니다.` : '';
    const topicPart = topic ? `${topic}을(를) 작성하세요.` : '주어진 주제에 대해 작성하세요.';
    const conditionsPart = conditions ? `세부 조건: ${conditions}` : '';
    const outputFormatPart = outputFormat ? `결과물 형식: ${outputFormat}` : '';
    const tonePart = tone ? `톤: ${tone}` : '';

    const basePrompt = [personaPart, topicPart, conditionsPart, outputFormatPart, tonePart]
      .filter(part => part !== '')
      .join('\n');

    const fullPrompt = `다음 지시사항에 따라 AI 프롬프트를 생성해 주세요:
${basePrompt}

이 프롬프트는 AI 모델에게 주어질 것입니다. 매우 명확하고 구체적으로 작성해 주세요.
${promptQuality > 70 ? '추가적으로, 최고의 답변을 얻기 위해 프롬프트의 구체성과 명확성을 최대한 높여주세요.' : ''}
`;

    // Gemini API 호출 (Placeholder)
    try {
      let chatHistory = [];
      chatHistory.push({ role: "user", parts: [{ text: fullPrompt }] });
      const payload = { contents: chatHistory };
      const apiKey = ""; // Canvas 환경에서 자동 제공됨
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`API error! status: ${response.status}`);
      }

      const result = await response.json();
      const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (text) {
        setGeneratedPrompt(text);
        recommendModel(text); // 프롬프트 기반 모델 추천
      } else {
        setGeneratedPrompt('프롬프트 생성에 실패했습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      console.error('Failed to generate prompt:', error);
      setGeneratedPrompt('프롬프트 생성 중 오류가 발생했습니다.');
      toast({
        title: "오류 발생",
        description: "프롬프트 생성 중 오류가 발생했습니다. 네트워크 또는 API 설정을 확인해주세요.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [role, topic, conditions, outputFormat, tone, promptQuality, recommendModel, toast]);

  const handleCopyToClipboard = () => {
    if (generatedPrompt) {
      const textarea = document.createElement('textarea');
      textarea.value = generatedPrompt;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      toast({
        title: "복사 완료",
        description: "생성된 프롬프트가 클립보드에 복사되었습니다.",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-4xl p-6 bg-white dark:bg-gray-800 rounded-lg shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">프롬프트 허브 ✨</DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-300">
            당신만을 위한 AI 프롬프트를 만들고, 최적의 AI 도구를 추천받으세요.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-4">
          {/* 입력 필드 섹션 */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="role" className="mb-2 block text-gray-700 dark:text-gray-200">역할 (페르소나)</Label>
              <Input
                id="role"
                placeholder="예: 마케터, 개발자, 강사"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="topic" className="mb-2 block text-gray-700 dark:text-gray-200">주제/목표</Label>
              <Input
                id="topic"
                placeholder="예: 자기소개서 작성, 블로그 글 생성"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="conditions" className="mb-2 block text-gray-700 dark:text-gray-200">세부 조건</Label>
              <Textarea
                id="conditions"
                placeholder="예: '가장 도전적이었던 경험'을 중심으로, 500자 이내로"
                value={conditions}
                onChange={(e) => setConditions(e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="outputFormat" className="mb-2 block text-gray-700 dark:text-gray-200">결과물 형식</Label>
              <Input
                id="outputFormat"
                placeholder="예: 마크다운, 표, JSON, 대화체"
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="tone" className="mb-2 block text-gray-700 dark:text-gray-200">톤</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">선택 안 함</SelectItem>
                  <SelectItem value="친근한">친근한</SelectItem>
                  <SelectItem value="전문적인">전문적인</SelectItem>
                  <SelectItem value="유머러스한">유머러스한</SelectItem>
                  <SelectItem value="설득력 있는">설득력 있는</SelectItem>
                  <SelectItem value="간결한">간결한</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="mb-2 block text-gray-700 dark:text-gray-200">프롬프트 품질 (구체성/명확성)</Label>
              <Slider
                value={[promptQuality]}
                onValueChange={([val]) => setPromptQuality(val)}
                max={100}
                step={10}
                className="w-[90%] mx-auto"
              />
              <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                {promptQuality <= 30 && "간단하고 유연하게 (낮음)"}
                {promptQuality > 30 && promptQuality <= 70 && "균형 잡힌 상세함 (보통)"}
                {promptQuality > 70 && "매우 구체적이고 명확하게 (높음)"}
              </div>
            </div>
            <Button
              onClick={handleGeneratePrompt}
              className="w-full py-3 mt-4 text-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              disabled={loading}
            >
              {loading ? '생성 중...' : '프롬프트 생성'}
            </Button>
          </div>

          {/* 결과 및 추천 섹션 */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="generatedPrompt" className="mb-2 block text-gray-700 dark:text-gray-200">생성된 프롬프트</Label>
              <Textarea
                id="generatedPrompt"
                value={generatedPrompt}
                readOnly
                rows={10}
                className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100"
                placeholder="여기에 생성된 프롬프트가 표시됩니다..."
              />
              <Button
                onClick={handleCopyToClipboard}
                className="w-full py-2 mt-2 bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-colors"
                disabled={!generatedPrompt}
              >
                클립보드에 복사
              </Button>
            </div>

            {recommendedModel.primary && (
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-750 p-4 rounded-lg shadow-md border border-blue-100 dark:border-gray-600 animate-fade-in">
                <CardHeader className="p-0 mb-3">
                  <CardTitle className="text-xl font-bold text-blue-700 dark:text-blue-300">
                        💡 추천 AI 모델
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 space-y-3">
                      <p className="text-gray-800 dark:text-gray-200 text-base">
                        이 프롬프트에는 <span className="font-semibold text-blue-600 dark:text-blue-200">{recommendedModel.primary}</span> 모델이 가장 적합합니다.
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        <span className="font-medium">추천 근거:</span> {recommendedModel.rationale || '생성된 프롬프트의 목적에 따라 최적화되었습니다.'}
                      </p>
                      {recommendedModel.alternative && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          대안 모델: {recommendedModel.alternative}
                        </p>
                      )}
                      <Button
                        onClick={() => window.open(getModelUrl(recommendedModel.primary), '_blank')}
                        className="w-full mt-3 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                      >
                        <Lucide.ExternalLink className="w-4 h-4 mr-2" />
                        {recommendedModel.primary} 바로가기
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            <DialogFooter className="mt-4 flex justify-end">
              <Button onClick={onClose} variant="outline" className="px-6 py-2">닫기</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
    };


    const AIToolsGrid = () => {
      const [selectedCategory, setSelectedCategory] = useState('all');
      const [searchTerm, setSearchTerm] = useState('');
      const [showToolModal, setShowToolModal] = useState(false); // 도구 상세 모달
      const [showWorkflowModal, setShowWorkflowModal] = useState(false); // 활용법 상세 모달
      const [showPromptGeneratorModal, setShowPromptGeneratorModal] = useState(false); // 프롬프트 허브 모달
      const [selectedTool, setSelectedTool] = useState(null);
      const [selectedWorkflow, setSelectedWorkflow] = useState(null);

      // 필터링된 도구 목록을 메모이제이션하여 성능 최적화
      const filteredTools = useMemo(() => {
        let tools = aiTools;

        if (selectedCategory !== 'all') {
          tools = tools.filter(tool => tool.category === selectedCategory);
        }

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
              <Lucide.Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            ))}
            {hasHalfStar && <Lucide.Star className="w-4 h-4 fill-yellow-400/50 text-yellow-400" />}
            <span className="text-xs text-muted-foreground ml-1">{rating}</span>
          </div>
        );
      };

      const openToolModal = (tool) => {
        setSelectedTool(tool);
        setShowToolModal(true);
      };

      const openWorkflowModal = (workflow) => {
        setSelectedWorkflow(workflow);
        setShowWorkflowModal(true);
      };

      const closeModal = () => {
        setShowToolModal(false);
        setShowWorkflowModal(false);
        setSelectedTool(null);
        setSelectedWorkflow(null);
      };

      const isStrongPointFeature = (feature, strengths) => {
        if (!Array.isArray(strengths)) return false;
        // 강점 배열에 feature 텍스트가 포함되어 있는지 대소문자 구분 없이 확인
        return strengths.some(strength => strength.toLowerCase().includes(feature.toLowerCase()));
      };

      // 개별 AI 도구 카드를 렌더링하는 함수
      const renderToolCard = (tool) => {
        // AIToolIcon 컴포넌트가 이제 모든 아이콘 로딩 로직을 자체적으로 처리합니다.
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
                    <Lucide.CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
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
    };

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
                {/* LucideIcons 객체는 AIToolsGrid.jsx 내에서 정의되어 있습니다. */}
                {React.createElement(LucideIcons[category.icon] || Lucide.Globe, { className: "w-4 h-4" })}
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
        {showToolModal && (
          <Dialog open={showToolModal} onOpenChange={closeModal}>
            <DialogContent className="w-full max-w-[700px] p-6 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto">
              <DialogHeader className="flex justify-between items-start sticky top-0 bg-white dark:bg-gray-800 z-10 pb-4">
                {selectedTool && (
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      {/* 여기서는 AIToolIcon 컴포넌트를 사용합니다. */}
                      {/* AIToolIcon은 tool prop을 받아서 모든 아이콘 로딩 로직을 자체적으로 처리합니다. */}
                      <AIToolIcon tool={selectedTool} className="w-6 h-6 text-gray-700 dark:text-gray-200" />
                    </div>
                    <div>
                      <DialogTitle className="text-2xl font-bold">{selectedTool.name}</DialogTitle>
                      <DialogDescription className="text-sm text-gray-500 dark:text-gray-400">
                        {selectedTool.category} | 평점: {selectedTool.rating}
                      </DialogDescription>
                    </div>
                  </div>
                )}
                <Button onClick={closeModal} variant="ghost" className="absolute right-4 top-4 rounded-full">
                  <Lucide.X className="w-5 h-5 text-gray-500" />
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

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4 flex justify-end gap-2">
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
              )}

              {selectedWorkflow && (
                <div className="mt-4 space-y-4 text-gray-800 dark:text-gray-200">
                  <p className="text-base leading-relaxed text-blue-700 dark:text-blue-300">{selectedWorkflow.description}</p>
                  <div className="space-y-3">
                    <h3 className="font-semibold text-xl text-blue-800 dark:text-blue-200">단계별 가이드</h3>
                    <ol className="space-y-4">
                      {selectedWorkflow.steps.map((step, index) => (
                        <li key={index} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-sm">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-sm">
                              {step.step_number}
                            </div>
                            <h4 className="font-semibold text-md text-gray-900 dark:text-gray-100">{step.tool_name}</h4>
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{step.tool_action}</p>
                          {step.details && <p className="text-xs text-gray-500 dark:text-gray-400">{step.details}</p>}
                          {step.link && (
                            <Button
                              variant="link"
                              onClick={() => window.open(step.link, '_blank')}
                              className="text-blue-600 dark:text-blue-400 text-xs mt-2 p-0 h-auto"
                            >
                              <Lucide.ExternalLink className="w-3 h-3 mr-1" />
                              {step.tool_name} 바로가기
                            </Button>
                          )}
                        </li>
                      ))}
                    </ol>
                  </div>

                  {selectedWorkflow.keywords && selectedWorkflow.keywords.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg text-gray-700 dark:text-gray-200">관련 키워드</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedWorkflow.keywords.map((keyword, index) => (
                          <Badge key={index} variant="outline" className="text-sm">{keyword}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  </div>
                )}
            </DialogContent>
          </Dialog>
        )}

        {/* 프롬프트 생성기 모달 */}
        {showPromptGeneratorModal && (
          <PromptGeneratorModal
            isOpen={showPromptGeneratorModal}
            onClose={() => setShowPromptGeneratorModal(false)}
            aiToolsData={aiTools} // aiTools 데이터를 프롬프트 생성 모달에 전달
          />
        )}
      </div>
    );
};

export default AIToolsGrid;
