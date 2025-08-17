// [자동 분류] 이 파일은 현재 사용되지 않으며 중복된 컴포넌트로 판단되어 아카이브 처리되었습니다.
import React from 'react';
import { Globe } from 'lucide-react';
import AutoBrandIcon from './AutoBrandIcon.jsx'; // Added import

const AIToolIcon = ({ tool, className = "" }) => {
  if (!tool) {
    return (
      <div className={`rounded-full bg-gradient-to-br from-slate-400 to-slate-500 ${className} shadow-md`} style={{width:'56px',height:'56px',display:'flex',alignItems:'center',justifyContent:'center',padding:'0'}}>
        <Globe className="w-6 h-6 text-white" />
      </div>
    );
  }

  return (
    <AutoBrandIcon
      domain={tool.link} // Assuming tool.link is the domain/url
      name={tool.name}
      size={56} // Based on current component's size
      className={className}
      // logoDevToken="(Optional: Your Logo.dev token)"
      // brandfetchClientId="(Optional: Your Brandfetch client ID)"
    />
  );
};

export default AIToolIcon;