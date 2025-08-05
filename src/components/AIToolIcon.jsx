import React, { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';

const imageStyle = {
  width: '52px',
  height: '52px',
  objectFit: 'contain',
  display: 'block',
  margin: 'auto',
  borderRadius: '50%',
  background: 'transparent',
};

const getSimpleIconsUrl = (id) => id ? `https://cdn.simpleicons.org/${id}` : null;
const getFaviconUrl = (homepage) => homepage ? `https://www.google.com/s2/favicons?sz=64&domain_url=${homepage}` : null;

// 도구 이름에서 이니셜을 추출하는 함수
const getInitials = (name) => {
  if (!name) return '?';
  const words = name.split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// 이름을 기반으로 고유한 색상을 생성하는 함수
const getColorFromName = (name) => {
  if (!name) return 'bg-slate-500';
  
  const colors = [
    'bg-gradient-to-br from-blue-500 to-blue-600',
    'bg-gradient-to-br from-purple-500 to-purple-600', 
    'bg-gradient-to-br from-green-500 to-green-600',
    'bg-gradient-to-br from-orange-500 to-orange-600',
    'bg-gradient-to-br from-red-500 to-red-600',
    'bg-gradient-to-br from-indigo-500 to-indigo-600',
    'bg-gradient-to-br from-pink-500 to-pink-600',
    'bg-gradient-to-br from-teal-500 to-teal-600',
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
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
      <div className={`rounded-full bg-gradient-to-br from-slate-400 to-slate-500 ${className} shadow-md`} style={{width:'56px',height:'56px',display:'flex',alignItems:'center',justifyContent:'center',padding:'0'}}>
        <Globe className="w-6 h-6 text-white" />
      </div>
    );
  }

  if (imgSrc) {
    return (
      <div className={`rounded-full bg-white ${className} shadow-md border border-slate-200`} style={{width:'56px',height:'56px',display:'flex',alignItems:'center',justifyContent:'center',padding:'2px'}}>
        <img
          src={imgSrc}
          alt={`${tool.name} 아이콘`}
          style={imageStyle}
          onError={handleError}
        />
      </div>
    );
  }

  // 이미지가 없을 때 이니셜 아이콘으로 대체
  const initials = getInitials(tool.name);
  const colorClass = getColorFromName(tool.name);

  return (
    <div className={`rounded-full ${colorClass} ${className} shadow-md`} style={{width:'56px',height:'56px',display:'flex',alignItems:'center',justifyContent:'center',padding:'0'}}>
      <span className="text-white font-bold text-lg select-none">
        {initials}
      </span>
    </div>
  );
};

export default AIToolIcon;