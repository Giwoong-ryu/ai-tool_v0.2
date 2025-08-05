// src/components/AIToolIcon.jsx
import React, { useState, useEffect } from 'react';
// Lucide-react 전체 모듈 임포트
import * as Lucide from 'lucide-react'; 

// 1. 커스텀 브랜드 SVG 아이콘 (가장 높은 우선순위)
// aiTools.js의 name 필드를 기준으로 정확히 매칭되는 SVG 아이콘을 하드코딩.
// image_d5f3f8.png 에서 보인 고품질 아이콘들을 여기에 정의합니다.
const CustomBrandIcons = {
  "ChatGPT": () => (
    <svg viewBox="0 0 24 24" className="w-full h-full text-green-600">
      <path fill="currentColor" d="M22.5 12c0 5.799-4.701 10.5-10.5 10.5S1.5 17.799 1.5 12 6.201 1.5 12 1.5s10.5 4.701 10.5 10.5zM8.466 15.432l1.365-2.798 1.366 2.798H8.466zm7.068-6.864L12 15.432 8.466 8.568h7.068z" />
    </svg>
  ),
  "Gemini": () => (
    <svg viewBox="0 0 24 24" className="w-full h-full text-blue-600">
      <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
    </svg>
  ),
  "Claude": () => (
    <svg viewBox="0 0 24 24" className="w-full h-full text-purple-600">
      <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
    </svg>
  ),
  "Naver Clova X": () => (
    <span style={{ fontSize: '1.2em', fontWeight: 'bold', color: '#03C75A' }}>N</span>
  ),
  "Wrtn (뤼튼)": () => (
    <span style={{ fontSize: '1.2em', fontWeight: 'bold', color: '#FF5733' }}>W</span>
  ),
  "DeepL 번역": () => (
    <span style={{ fontSize: '1.2em', fontWeight: 'bold', color: '#0047AB' }}>D</span>
  ),
  // 추가적인 특정 브랜드 아이콘이 있다면 여기에 SVG로 정의합니다.
};

// 2. aiTools.js의 'icon' 필드 또는 'name' 필드를 Lucide 아이콘으로 매핑
// 대부분의 AI 도구 이름/아이콘 문자열이 Lucide 아이콘과 일치하도록 매핑합니다.
const LucideIconMapping = {
  // aiTools.js의 'icon' 필드 값 (소문자 또는 그대로)
  "messagesquare": Lucide.MessageSquare,
  "sparkles": Lucide.Sparkles,
  "brain": Lucide.Brain,
  "booktext": Lucide.BookText,
  "alignjustify": Lucide.AlignJustify,
  "languages": Lucide.Languages,
  "edit3": Lucide.Edit3,
  "newspaper": Lucide.Newspaper,
  "filetext": Lucide.FileText,
  "clipboardlist": Lucide.ClipboardList,
  "checkshield": Lucide.CheckShield,
  "image": Lucide.Image,
  "pentool": Lucide.PenTool,
  "imagedown": Lucide.ImageDown,
  "palette": Lucide.Palette,
  "video": Lucide.Video,
  "film": Lucide.Film,
  "scissors": Lucide.Scissors,
  "videotext": Lucide.VideoText,
  "mic": Lucide.Mic,
  "audiolines": Lucide.AudioLines,
  "volumex": Lucide.VolumeX,
  "ruler": Lucide.Ruler,
  "megaphone": Lucide.Megaphone,
  "messagesquaremore": Lucide.MessageSquareMore,
  "home": Lucide.Home,
  "imageup": Lucide.ImageUp,
  "squareterminal": Lucide.SquareTerminal,
  "spellcheck": Lucide.SpellCheck,
  "code": Lucide.Code,
  "filecode": Lucide.FileCode,
  "terminal": Lucide.Terminal,
  "bookopen": Lucide.BookOpen,
  "lightbulb": Lucide.Lightbulb,
  "searchcode": Lucide.SearchCode,
  "bot": Lucide.Bot,
  "camera": Lucide.Camera,
  "scrolltext": Lucide.ScrollText,
  "clipboardcheck": Lucide.ClipboardCheck,
  "squarefunction": Lucide.SquareFunction,
  "notebooktext": Lucide.NotebookText,
  "ganttchart": Lucide.GanttChart,
  "rocket": Lucide.Rocket,
  "zap": Lucide.Zap,
  "binary": Lucide.Binary,

  // aiTools.js의 'name' 필드 (일부 툴이름도 아이콘으로 사용됨)
  "ChatGPT": Lucide.MessageSquare, // 이미 CustomBrandIcons에 있지만, 폴백으로도 남겨둠
  "Gemini": Lucide.Sparkles, // 이미 CustomBrandIcons에 있지만, 폴백으로도 남겨둠
  "Claude": Lucide.Brain, // 이미 CustomBrandIcons에 있지만, 폴백으로도 남겨둠
  "Karlo": Lucide.Image,
  "Midjourney": Lucide.PenTool,
  "Leonardo.Ai": Lucide.Image,
  "Remove.bg": Lucide.ImageDown,
  "Adobe Firefly": Lucide.Palette,
  "RunwayML": Lucide.Film,
  "Descript": Lucide.Mic,
  "HeyGen": Lucide.Video,
  "CapCut (AI Features)": Lucide.Scissors,
  "Vrew (브루)": Lucide.Video,
  "Pictory AI": Lucide.VideoText,
  "Otter.ai": Lucide.Mic,
  "Krisp": Lucide.VolumeX,
  "Typeface": Lucide.Ruler,
  "Canva Magic Studio": Lucide.Sparkles,
  "AdCreative.ai": Lucide.Megaphone,
  "ManyChat (AI)": Lucide.MessageSquareMore,
  "Synthesia": Lucide.Video,
  "ElevenLabs (API)": Lucide.AudioLines,
  "D-ID": Lucide.Video, // D-ID는 주로 영상 생성
  "Kasa (AI Features)": Lucide.Home,
  "Remini": Lucide.ImageUp,
  "Galileo AI": Lucide.SquareTerminal,
  // 기타 필요한 매핑 추가
};

// 3. 대체 아이콘 (simpleicons.org 또는 이니셜)을 위한 함수
const imageStyle = {
  width: '100%',          // 부모 크기 상속
  height: '100%',
  objectFit: 'contain',
  display: 'block',
  margin: 'auto',
  borderRadius: '50%',
  background: 'transparent',
};

// 외부 아이콘 URL 생성 함수
const getSimpleIconsUrl = (id) => {
  if (!id) return null;
  // Simple Icons는 소문자 kebab-case를 선호
  const formattedId = String(id).toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, ''); 
  return `https://cdn.simpleicons.org/${encodeURIComponent(formattedId)}`;
};

const getFaviconUrl = (homepage) => homepage ? `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(homepage)}` : null;

// 아이콘 폴백 로직 (가장 안정적인 아이콘을 찾아서 렌더링)
const getIconToRender = (tool) => {
  // 1. CustomBrandIcons에 정의된 특정 브랜드 아이콘이 있는지 확인 (최고 우선순위)
  if (CustomBrandIcons[tool.name]) {
    return CustomBrandIcons[tool.name](); // 컴포넌트 호출
  }

  // 2. LucideIconMapping에 정의된 Lucide 아이콘이 있는지 확인 (aiTools.js의 name 또는 icon 필드 기반)
  const lucideIconComponentByName = LucideIconMapping[tool.name];
  const lucideIconComponentByIconField = LucideIconMapping[String(tool.icon).toLowerCase()];
  
  if (lucideIconComponentByName) {
    return React.createElement(lucideIconComponentByName, { className: "w-6 h-6 text-gray-700 dark:text-gray-200" });
  }
  if (lucideIconComponentByIconField) {
    return React.createElement(lucideIconComponentByIconField, { className: "w-6 h-6 text-gray-700 dark:text-gray-200" });
  }

  // 3. Simple Icons 또는 Favicon 이미지 URL 시도 (네트워크 요청 발생 가능성 있음)
  // 이 부분은 AIToolIcon 컴포넌트 자체에서 useState로 관리하여 동적으로 로드하게 됩니다.
  // 이 함수는 '어떤 아이콘을 렌더링할지' 결정하는 정적 함수이므로, 이미지 URL은 여기서 반환하지 않습니다.
  // 대신, AIToolIcon 컴포넌트의 useEffect와 useState 로직이 이 부분을 처리합니다.
  
  // 4. 최후의 폴백: 툴 이름의 첫 글자
  const initial = tool.name ? tool.name[0].toUpperCase() : '?';
  return (
    <div style={{
      width: '100%', height: '100%', borderRadius: '50%',
      background: '#e5e7eb', color: '#555', fontWeight: 700, fontSize: 24, // 크기 조정
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      {initial}
    </div>
  );
};


const AIToolIcon = ({ tool, className = "" }) => {
  const [imgSrc, setImgSrc] = useState(null);
  const [triedFavicon, setTriedFavicon] = useState(false);
  const [currentFallback, setCurrentFallback] = useState(null); // Lucide/Custom/이니셜 폴백을 저장

  useEffect(() => {
    if (!tool) return;

    // 1. CustomBrandIcons 또는 LucideIconMapping을 먼저 시도 (네트워크 요청 없음)
    const staticIconComponent = getIconToRender(tool);
    if (staticIconComponent && typeof staticIconComponent !== 'string') { // string이 아닌 React 요소인 경우
        setCurrentFallback(staticIconComponent);
        setImgSrc(null); // 이미지 URL 시도는 건너뜜
        return;
    }

    // 2. Simple Icons 또는 Favicon 이미지 로딩 시도
    let simpleIconId = tool.simpleIconId || tool.name; // tool.name을 기본 simpleIconId로 사용
    const simpleIconsUrl = getSimpleIconsUrl(simpleIconId);

    setImgSrc(simpleIconsUrl);
    setTriedFavicon(false); // 파비콘 시도 플래그 초기화
    setCurrentFallback(null); // 이 시점에서는 정적 폴백 초기화

  }, [tool]);

  const handleError = () => {
    if (!triedFavicon && tool?.link) {
      // Simple Icons 실패 시 Favicon 시도
      setImgSrc(getFaviconUrl(tool.link));
      setTriedFavicon(true);
    } else {
      // Favicon까지 실패하면, 최후의 폴백 (이니셜)을 렌더링하도록 null로 설정
      setImgSrc(null); 
      setCurrentFallback(getIconToRender({ ...tool, name: tool.name || '?' })); // 강제로 이니셜 생성
    }
  };

  if (!tool) {
    return (
      <div className={`rounded-full bg-gray-100 ${className}`} style={{width:'56px',height:'56px',display:'flex',alignItems:'center',justifyContent:'center',padding:'0'}}>
        {React.createElement(Lucide.Globe, { className: "w-13 h-13 text-gray-600 mx-auto" })}
      </div>
    );
  }

  // 먼저 정적(Custom/Lucide) 아이콘이 결정되었는지 확인
  if (currentFallback) {
      return (
          <div className={`rounded-full bg-gray-100 ${className}`} style={{width:'56px',height:'56px',display:'flex',alignItems:'center',justifyContent:'center',padding:'0'}}>
              {currentFallback}
          </div>
      );
  }

  // 그 다음 이미지 URL 로딩 시도 (Simple Icons 또는 Favicon)
  if (imgSrc) {
    return (
      <div className={`rounded-full bg-gray-100 ${className}`} style={{width:'56px',height:'56px',display:'flex',alignItems:'center',justifyContent:'center',padding:'0'}}>
        <img
          src={imgSrc}
          alt={`${tool.name} 아이콘`}
          style={imageStyle}
          onError={handleError} // 이미지 로딩 실패 시 handleError 호출
        />
      </div>
    );
  }

  // 모든 시도 실패 시, getIconToRender의 최후 폴백 (이니셜) 렌더링
  return (
    <div className={`rounded-full bg-gray-100 ${className}`} style={{width:'56px',height:'56px',display:'flex',alignItems:'center',justifyContent:'center',padding:'0'}}>
      {getIconToRender(tool)}
    </div>
  );
};

export default AIToolIcon;
