// [자동 분류] 이 파일은 현재 사용되지 않으며 중복된 컴포넌트로 판단되어 아카이브 처리되었습니다.
import React, { useState, useRef, useEffect } from 'react';

const OptimizedImage = ({ 
  src, 
  alt, 
  className = '', 
  width, 
  height, 
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  placeholder = true,
  fallback = '/images/placeholder.webp'
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isIntersecting, setIsIntersecting] = useState(priority);
  const [error, setError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    if (priority) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setError(true);
  };

  // Generate WebP source and fallback
  const getOptimizedSrc = (originalSrc) => {
    if (originalSrc.endsWith('.svg')) return originalSrc;
    const baseSrc = originalSrc.replace(/\.(jpg|jpeg|png)$/i, '');
    return `${baseSrc}.webp`;
  };

  const getFallbackSrc = (originalSrc) => {
    if (originalSrc.endsWith('.svg')) return originalSrc;
    return originalSrc;
  };

  const shouldLoad = priority || isIntersecting;

  return (
    <div 
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      style={{ width, height }}
    >
      {/* Placeholder/skeleton */}
      {placeholder && !isLoaded && (
        <div 
          className="absolute inset-0 bg-gray-200 animate-pulse"
          style={{ 
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
            animation: 'skeleton-loading 1.5s infinite'
          }}
        />
      )}

      {/* Actual image */}
      {shouldLoad && (
        <picture>
          <source 
            srcSet={getOptimizedSrc(src)} 
            type="image/webp"
            sizes={sizes}
          />
          <img
            src={error ? fallback : getFallbackSrc(src)}
            alt={alt}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            onLoad={handleLoad}
            onError={handleError}
            className={`
              object-cover w-full h-full transition-opacity duration-300
              ${isLoaded ? 'opacity-100' : 'opacity-0'}
            `}
            style={{
              imageRendering: 'crisp-edges',
              WebkitImageRendering: 'crisp-edges',
            }}
            width={width}
            height={height}
          />
        </picture>
      )}
    </div>
  );
};

export default OptimizedImage;