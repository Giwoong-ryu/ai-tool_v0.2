// src/components/AIToolIcon.jsx
import React, { useState, useEffect } from 'react';
import { Scissors, Video, Film, Globe, Image } from 'lucide-react';

// SVG 아이콘 컴포넌트
const IconComponents = {
  ChatGPT: () => (
    <svg viewBox="0 0 24 24" className="w-6 h-6 text-green-600">
      <circle cx="12" cy="12" r="10" className="fill-current opacity-20" />
      <path
        fill="currentColor"
        d="M12 4c1.648 0 3 1.352 3 3v3h3c1.648 0 3 1.352 3 3s-1.352 3-3 3h-3v3c0 1.648-1.352 3-3 3s-3-1.352-3-3v-3H6c-1.648 0-3-1.352-3-3s1.352-3 3-3h3V7c0-1.648 1.352-3 3-3z"
      />
    </svg>
  ),
  Gemini: () => (
    <svg viewBox="0 0 24 24" className="w-6 h-6 text-blue-600">
      <circle cx="12" cy="12" r="10" className="fill-current opacity-20" />
      <path
        fill="currentColor"
        d="M8 8l8 8M16 8l-8 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
  Claude: () => (
    <svg viewBox="0 0 24 24" className="w-6 h-6 text-purple-600">
      <circle cx="12" cy="12" r="10" className="fill-current opacity-20" />
      <path
        fill="currentColor"
        d="M12 6v12M7 12h10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
  Midjourney: () => (
    <svg viewBox="0 0 24 24" className="w-full h-full">
      <path
        fill="currentColor"
        d="M12 1.5C6.201 1.5 1.5 6.201 1.5 12S6.201 22.5 12 22.5 22.5 17.799 22.5 12 17.799 1.5 12 1.5zM8.466 15.432l1.365-2.798 1.366 2.798H8.466zm7.068-6.864L12 15.432 8.466 8.568h7.068z"
      />
    </svg>
  ),
  Karlo: () => (
    <svg viewBox="0 0 24 24" className="w-full h-full">
      <path
        fill="currentColor"
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"
      />
    </svg>
  ),
  Leonardo: () => (
    <svg viewBox="0 0 24 24" className="w-full h-full">
      <path
        fill="currentColor"
        d="M12 2L1 21h22L12 2zm0 4l7.53 13H4.47L12 6zm0 4l-3 5h6l-3-5z"
      />
    </svg>
  ),
  'D-ID': () => (
    <svg viewBox="0 0 24 24" className="w-full h-full">
      <path
        fill="currentColor"
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"
      />
    </svg>
  ),
  HeyGen: () => (
    <svg viewBox="0 0 24 24" className="w-full h-full">
      <path
        fill="currentColor"
        d="M21 3H3c-1.11 0-2 .89-2 2v12c0 1.1.89 2 2 2h5v2h8v-2h5c1.1 0 2-.9 2-2V5c0-1.11-.9-2-2-2zm0 14H3V5h18v12zm-5-7v2H8v-2h8z"
      />
    </svg>
  )
};

// 이미지 크기 조정을 위한 스타일
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
const getSimpleIconsUrl = (id) => id ? `https://cdn.simpleicons.org/${id}` : null;
const getFaviconUrl = (homepage) => homepage ? `https://www.google.com/s2/favicons?sz=64&domain_url=${homepage}` : null;

// 툴별 대체 아이콘/컬러 매핑
const fallbackIconMap = {
  capcut: { icon: <Scissors className="w-10 h-10 text-black" />, bg: "#fff" },
  vrew:   { icon: <Video className="w-10 h-10 text-blue-500" />, bg: "#e6f0ff" },
  karlo:  { icon: <Image className="w-10 h-10 text-yellow-600" />, bg: "#fef3c7" },
  "naver clova x": { icon: <span style={{fontSize: 28, fontWeight: 700, color: '#03c75a'}}>N</span>, bg: "#e8f5e8" },
  // 필요시 추가
};

// Lucide 아이콘 매핑
const lucideIconMap = {
  scissors: Scissors,
  video: Video,
  videoicon: Film, // Vrew 등 VideoIcon은 Film으로 대체
  // 필요시 추가
};

const getFallbackIcon = (tool) => {
  // 1. icon 필드 우선 (Lucide 매핑)
  const iconKey = tool.icon ? String(tool.icon).toLowerCase() : null;
  if (iconKey && lucideIconMap[iconKey]) {
    const LucideIcon = lucideIconMap[iconKey];
    return (
      <div style={{
        width: 48, height: 48, borderRadius: '50%',
        background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <LucideIcon className="w-10 h-10 text-gray-700" />
      </div>
    );
  }
  // 2. fallbackIconMap
  const idRaw = tool.simpleIconId || tool.id || tool.name || "";
  const id = String(idRaw).toLowerCase();
  if (fallbackIconMap[id]) {
    return (
      <div style={{
        width: 48, height: 48, borderRadius: '50%',
        background: fallbackIconMap[id].bg, display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        {fallbackIconMap[id].icon}
      </div>
    );
  }
  // 3. 이니셜+연한 회색
  const initial = tool.name ? tool.name[0].toUpperCase() : '?';
  return (
    <div style={{
      width: 48, height: 48, borderRadius: '50%',
      background: '#e5e7eb', color: '#555', fontWeight: 700, fontSize: 28,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      {initial}
    </div>
  );
};

const AIToolIcon = ({ tool, className = "" }) => {
  const [imgSrc, setImgSrc] = useState(null);
  const [triedFavicon, setTriedFavicon] = useState(false);

  useEffect(() => {
    if (!tool) return;
    let simpleIconId = tool.simpleIconId || (typeof tool.id === 'string' ? tool.id : tool.name?.toLowerCase());
    setImgSrc(getSimpleIconsUrl(simpleIconId));
    setTriedFavicon(false);
  }, [tool]);

  const handleError = () => {
    if (!triedFavicon && tool?.link) {
      setImgSrc(getFaviconUrl(tool.link));
      setTriedFavicon(true);
    } else {
      setImgSrc(null);
    }
  };

  if (!tool) {
    return (
      <div className={`rounded-full bg-gray-100 ${className}`} style={{width:'56px',height:'56px',display:'flex',alignItems:'center',justifyContent:'center',padding:'0'}}>
        <Globe className="w-13 h-13 text-gray-600 mx-auto" />
      </div>
    );
  }

  // 공식 아이콘이 있을 때만 이미지 렌더링
  if (imgSrc) {
    return (
      <div className={`rounded-full bg-gray-100 ${className}`} style={{width:'56px',height:'56px',display:'flex',alignItems:'center',justifyContent:'center',padding:'0'}}>
        <img
          src={imgSrc}
          alt={`${tool.name} 아이콘`}
          style={imageStyle}
          onError={handleError}
        />
      </div>
    );
  }

  // 공식 아이콘/파비콘 모두 없을 때 대체 아이콘
  return (
    <div className={`rounded-full bg-gray-100 ${className}`} style={{width:'56px',height:'56px',display:'flex',alignItems:'center',justifyContent:'center',padding:'0'}}>
      {getFallbackIcon(tool)}
    </div>
  );
};

export default AIToolIcon;
