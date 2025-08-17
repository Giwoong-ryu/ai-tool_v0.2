// [자동 분류] 이 파일은 현재 사용되지 않으며 중복된 컴포넌트로 판단되어 아카이브 처리되었습니다.
// src/components/백업_아이콘_v1.jsx
// === 백업본: 2024-07-19 ===
// 아래는 AIToolIcon.jsx의 백업 버전입니다.

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

  return (
    <div className={`rounded-full bg-gray-100 ${className}`} style={{width:'56px',height:'56px',display:'flex',alignItems:'center',justifyContent:'center',padding:'0'}}>
      <Globe className="w-13 h-13 text-gray-600 mx-auto" />
    </div>
  );
};

export default AIToolIcon;