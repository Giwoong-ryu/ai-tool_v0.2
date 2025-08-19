// src/prompt/prompt-compiler.js
import Handlebars from "handlebars";

/* ========================================
 * Handlebars 컴파일러 및 후처리 파이프라인
 * 지시: Mustache/Handlebars로 컴파일 → 후처리 파이프라인 적용
 * 부연: bullet→MD 표준화, 길이 제한, 공백/중복 라인 정리
 * ======================================== */

// Handlebars 헬퍼 등록
Handlebars.registerHelper({
  // 조건부 렌더링
  'if_eq': function(a, b, options) {
    return (a === b) ? options.fn(this) : options.inverse(this);
  },
  
  // 배열/문자열 길이
  'length': function(item) {
    if (!item) return 0;
    return Array.isArray(item) ? item.length : String(item).length;
  },
  
  // 문자열 대소문자 변환
  'uppercase': function(str) {
    return str ? str.toString().toUpperCase() : '';
  },
  
  'lowercase': function(str) {
    return str ? str.toString().toLowerCase() : '';
  },
  
  // 문자열 자르기
  'truncate': function(str, length, suffix = '...') {
    if (!str || str.length <= length) return str;
    return str.substring(0, length) + suffix;
  },
  
  // 리스트 포맷팅
  'list': function(items, options) {
    if (!Array.isArray(items)) return '';
    return items.map(item => `- ${item}`).join('\n');
  },
  
  // 번호 리스트
  'numbered_list': function(items, options) {
    if (!Array.isArray(items)) return '';
    return items.map((item, index) => `${index + 1}. ${item}`).join('\n');
  },
  
  // 기본값 설정
  'default': function(value, defaultValue) {
    return value || defaultValue;
  },
  
  // 날짜 포맷팅
  'format_date': function(date, format = 'YYYY-MM-DD') {
    if (!date) return '';
    const d = new Date(date);
    if (format === 'YYYY-MM-DD') {
      return d.toISOString().split('T')[0];
    }
    return d.toLocaleDateString('ko-KR');
  },
  
  // 조건부 줄바꿈
  'br_if': function(condition) {
    return condition ? '\n\n' : '';
  },
  
  // JSON 파싱
  'json': function(obj) {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  }
});

// 빈 값 처리를 위한 missing 헬퍼 등록
Handlebars.registerHelper('helperMissing', function(/* dynamic arguments */) {
  const args = Array.prototype.slice.call(arguments);
  const options = args[args.length - 1];
  const name = options.name;
  
  // 빈 값에 대해 플레이스홀더 반환
  return `[${name}]`;
});

// 빈 변수 처리를 위한 blockHelperMissing 등록
Handlebars.registerHelper('blockHelperMissing', function(context, options) {
  // 블록 헬퍼가 없는 경우 기본 동작
  if (options.fn) {
    return options.fn(context);
  }
  return '';
});

// 컴파일러 설정
const compilerOptions = {
  noEscape: true, // HTML 이스케이프 비활성화 (마크다운용)
  strict: false,  // 엄격 모드 비활성화 (빈 값 처리를 위해)
  knownHelpers: {
    'if_eq': true,
    'length': true,
    'uppercase': true,
    'lowercase': true,
    'truncate': true,
    'list': true,
    'numbered_list': true,
    'default': true,
    'format_date': true,
    'br_if': true,
    'json': true
  },
  knownHelpersOnly: false // 알려진 헬퍼만 허용하지 않음
};

// 후처리 파이프라인 함수들
const postProcessors = {
  
  // 1. 마크다운 표준화 (bullet→MD)
  standardizeMarkdown: (text) => {
    return text
      // • → -
      .replace(/^[\s]*[•·‧⁃▪▫]/gm, '-')
      // 다양한 bullet 스타일 통일
      .replace(/^[\s]*[*+]\s/gm, '- ')
      // 번호 리스트 표준화 (1) → 1.
      .replace(/^[\s]*\((\d+)\)\s/gm, '$1. ')
      // 헤더 표준화
      .replace(/^[\s]*#{1,6}[\s]*(.+)$/gm, (match, p1, offset, string) => {
        const level = match.match(/#{1,6}/)[0].length;
        return '#'.repeat(level) + ' ' + p1.trim();
      });
  },

  // 2. 길이 제한 및 조정
  enforceLength: (text, options = {}) => {
    const { 
      maxLength = 5000, 
      minLength = 100,
      preserveStructure = true 
    } = options;
    
    if (text.length <= maxLength && text.length >= minLength) {
      return text;
    }
    
    if (text.length > maxLength) {
      if (preserveStructure) {
        // 문단 단위로 자르기
        const paragraphs = text.split('\n\n');
        let result = '';
        let currentLength = 0;
        
        for (const paragraph of paragraphs) {
          if (currentLength + paragraph.length + 2 <= maxLength) {
            result += (result ? '\n\n' : '') + paragraph;
            currentLength += paragraph.length + 2;
          } else {
            // 마지막 문단은 일부만 포함
            const remaining = maxLength - currentLength - 5; // "..." 공간
            if (remaining > 20) {
              result += (result ? '\n\n' : '') + paragraph.substring(0, remaining) + '...';
            }
            break;
          }
        }
        return result;
      } else {
        // 단순 자르기
        return text.substring(0, maxLength - 3) + '...';
      }
    }
    
    // 최소 길이 미달시 확장 가이드 추가
    if (text.length < minLength) {
      return text + '\n\n**더 자세한 내용을 추가해 주세요.**';
    }
    
    return text;
  },

  // 3. 공백 및 중복 라인 정리
  cleanWhitespace: (text) => {
    return text
      // 탭을 스페이스로 변환
      .replace(/\t/g, '  ')
      // 줄 끝 공백 제거
      .replace(/[ \t]+$/gm, '')
      // 연속된 빈 줄을 최대 2개로 제한
      .replace(/\n{3,}/g, '\n\n')
      // 문서 시작/끝 공백 제거
      .trim();
  },

  // 4. 한국어 텍스트 최적화
  optimizeKorean: (text) => {
    if (!text || typeof text !== 'string') return text;
    
    return text
      // 한글 문장 부호 표준화
      .replace(/。/g, '.')
      .replace(/、/g, ',')
      // 문장 간격 조정 (가장 간단한 패턴만)
      .replace(/([.!?])([가-힣])/g, '$1 $2')
      // 영문과 한글 사이 공백
      .replace(/([a-zA-Z])([가-힣])/g, '$1 $2')
      .replace(/([가-힣])([a-zA-Z])/g, '$1 $2')
      // 숫자와 한글 사이 공백
      .replace(/([0-9])([가-힣])/g, '$1 $2')
      .replace(/([가-힣])([0-9])/g, '$1 $2')
      // 영문과 숫자 사이 공백 (기존 공백이 없는 경우만)
      .replace(/([a-zA-Z])([0-9])/g, '$1 $2');
  },

  // 5. 구조 검증 및 수정
  validateStructure: (text) => {
    const lines = text.split('\n');
    const result = [];
    let inCodeBlock = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // 코드 블록 상태 추적
      if (line.startsWith('```')) {
        inCodeBlock = !inCodeBlock;
      }
      
      // 코드 블록 내부는 수정하지 않음
      if (inCodeBlock) {
        result.push(line);
        continue;
      }
      
      // 헤더 후 빈 줄 보장
      if (line.match(/^#{1,6}\s/)) {
        result.push(line);
        if (i + 1 < lines.length && lines[i + 1].trim() !== '') {
          result.push('');
        }
        continue;
      }
      
      // 리스트 들여쓰기 정규화
      if (line.match(/^[\s]*[-*+]\s/) || line.match(/^\s*\d+\.\s/)) {
        const cleaned = line.replace(/^[\s]*/, '');
        result.push(cleaned);
        continue;
      }
      
      result.push(line);
    }
    
    return result.join('\n');
  },

  // 6. 메타데이터 정리
  cleanMetadata: (text) => {
    return text
      // 불필요한 메타데이터 제거
      .replace(/^\s*---[\s\S]*?---\s*/m, '')
      // HTML 태그 제거 (마크다운에서 불필요한 경우)
      .replace(/<[^>]*>/g, '')
      // 특수 문자 정리 (플레이스홀더 대괄호 보존)
      .replace(/[^\w\s가-힣ㄱ-ㅎㅏ-ㅣ.,!?:;()\-'"#\[\]\n]/g, '');
  }
};

// 메인 컴파일러 클래스
export class PromptCompiler {
  constructor(options = {}) {
    this.options = {
      enablePostProcessing: true,
      lengthLimits: {
        maxLength: 4000, // Step 5: 4,000자 컷
        minLength: 10    // 최소 길이 조정
      },
      preserveStructure: true,
      optimizeKorean: true,
      enableValidation: true,
      ...options
    };
    
    this.compiledTemplates = new Map();
    this.compilationStats = {
      total: 0,
      successful: 0,
      failed: 0,
      cached: 0
    };
  }

  // 템플릿 컴파일 (캐싱 지원)
  compile(templateString, cacheKey = null) {
    try {
      // 캐시 확인
      if (cacheKey && this.compiledTemplates.has(cacheKey)) {
        this.compilationStats.cached++;
        return this.compiledTemplates.get(cacheKey);
      }

      // Handlebars 컴파일
      const compiled = Handlebars.compile(templateString, compilerOptions);
      
      // 캐시 저장
      if (cacheKey) {
        this.compiledTemplates.set(cacheKey, compiled);
      }
      
      this.compilationStats.total++;
      this.compilationStats.successful++;
      
      return compiled;
    } catch (error) {
      this.compilationStats.total++;
      this.compilationStats.failed++;
      
      console.error('Template compilation failed:', error);
      throw new Error(`템플릿 컴파일 실패: ${error.message}`);
    }
  }

  // 프롬프트 생성 (후처리 포함)
  generate(templateString, data = {}, options = {}) {
    const config = { ...this.options, ...options };
    
    try {
      // 1. 데이터 전처리
      const processedData = this.preprocessData(data);
      
      // 2. 템플릿 컴파일 및 렌더링
      const cacheKey = this.generateCacheKey(templateString);
      const template = this.compile(templateString, cacheKey);
      let result = template(processedData);
      
      // 3. 후처리 파이프라인 적용
      if (config.enablePostProcessing) {
        result = this.applyPostProcessing(result, config);
      }
      
      // 4. 최종 검증
      if (config.enableValidation) {
        result = this.validateResult(result, config);
      }
      
      return {
        success: true,
        content: result,
        metadata: {
          originalLength: templateString.length,
          resultLength: result.length,
          processingTime: Date.now(),
          dataKeys: Object.keys(processedData)
        }
      };
      
    } catch (error) {
      console.error('Prompt generation failed:', error);
      return {
        success: false,
        content: null,
        error: error.message,
        metadata: {
          failedAt: 'generation',
          originalTemplate: templateString.substring(0, 100) + '...'
        }
      };
    }
  }

  // 데이터 전처리
  preprocessData(data) {
    const processed = { ...data };
    
    // 빈 값 기본값 처리
    Object.keys(processed).forEach(key => {
      const value = processed[key];
      if (value === null || value === undefined || value === '') {
        processed[key] = `[${key}]`;
      }
    });
    
    // 템플릿에서 참조되지만 데이터에 없는 키들도 처리
    // 기본 필드들에 대한 플레이스홀더 설정
    const defaultFields = ['topic', 'target_audience', 'tone', 'style', 'content', 'keywords', 'call_to_action'];
    defaultFields.forEach(field => {
      if (!(field in processed)) {
        processed[field] = `[${field}]`;
      }
    });
    
    // 특수 헬퍼 데이터 추가
    processed._meta = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      generator: 'EasyPick Prompt Engine'
    };
    
    return processed;
  }

  // 후처리 파이프라인 적용
  applyPostProcessing(text, config) {
    let result = text;
    
    // 1. 마크다운 표준화
    result = postProcessors.standardizeMarkdown(result);
    
    // 2. 공백 정리
    result = postProcessors.cleanWhitespace(result);
    
    // 3. 한국어 최적화
    if (config.optimizeKorean) {
      result = postProcessors.optimizeKorean(result);
    }
    
    // 4. 구조 검증
    result = postProcessors.validateStructure(result);
    
    // 5. 길이 조정
    result = postProcessors.enforceLength(result, config.lengthLimits);
    
    // 6. 메타데이터 정리
    result = postProcessors.cleanMetadata(result);
    
    return result;
  }

  // 결과 검증
  validateResult(result, config) {
    // 기본 검증
    if (!result || typeof result !== 'string') {
      throw new Error('유효하지 않은 결과입니다');
    }
    
    // 길이 검증
    if (result.length < config.lengthLimits.minLength) {
      console.warn('결과가 최소 길이보다 짧습니다');
    }
    
    if (result.length > config.lengthLimits.maxLength) {
      console.warn('결과가 최대 길이를 초과합니다');
    }
    
    // 구조 검증
    const hasContent = result.trim().length > 0;
    const hasPlaceholders = result.includes('[') && result.includes(']');
    
    if (!hasContent) {
      throw new Error('빈 결과입니다');
    }
    
    if (hasPlaceholders) {
      console.warn('미처리된 플레이스홀더가 있습니다');
    }
    
    return result;
  }

  // 캐시 키 생성
  generateCacheKey(templateString) {
    // 단순 해시 함수 (실제 환경에서는 crypto 모듈 사용 권장)
    let hash = 0;
    for (let i = 0; i < templateString.length; i++) {
      const char = templateString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32비트 정수로 변환
    }
    return `template_${Math.abs(hash)}`;
  }

  // 통계 및 상태 조회
  getStats() {
    return {
      ...this.compilationStats,
      cacheSize: this.compiledTemplates.size,
      cacheHitRate: this.compilationStats.cached / this.compilationStats.total * 100
    };
  }

  // 캐시 관리
  clearCache() {
    this.compiledTemplates.clear();
    console.log('Template cache cleared');
  }

  invalidateCache(cacheKey) {
    if (this.compiledTemplates.has(cacheKey)) {
      this.compiledTemplates.delete(cacheKey);
      console.log(`Cache invalidated: ${cacheKey}`);
    }
  }
}

// 기본 컴파일러 인스턴스
export const promptCompiler = new PromptCompiler();

// 편의 함수들 - Step 5 요구사항: 4,000자 컷 적용
export const compilePrompt = (templateString, data = {}, options = {}) => {
  const defaultOptions = {
    enablePostProcessing: true,
    lengthLimits: {
      maxLength: 4000, // Step 5: 4,000자 컷
      minLength: 10    // 최소 길이를 10자로 낮춤
    },
    optimizeKorean: true,
    enableValidation: true,
    ...options
  };
  return promptCompiler.generate(templateString, data, defaultOptions);
};

export const registerHelper = (name, helper) => {
  Handlebars.registerHelper(name, helper);
};

export const registerPartial = (name, partial) => {
  Handlebars.registerPartial(name, partial);
};

// 후처리 함수 개별 내보내기 (테스트/디버깅용)
export { postProcessors };

// 테스트 헬퍼 함수들
export const testHelpers = {
  createBasicTemplate: (topic, audience) => {
    return `# {{topic}}\n\n대상 독자: {{target_audience}}\n\n내용을 작성해주세요.`;
  },
  
  createTestData: (overrides = {}) => {
    return {
      topic: '기본 주제',
      target_audience: '일반 사용자',
      tone: '친근한',
      style: '간결한',
      ...overrides
    };
  },
  
  testPostProcessing: (text) => {
    const before = text;
    let after = postProcessors.standardizeMarkdown(text);
    after = postProcessors.cleanWhitespace(after);
    after = postProcessors.optimizeKorean(after);
    
    return { before, after };
  }
};

// 설정 상수 - Step 5 요구사항 반영
export const CompilerDefaults = {
  MAX_LENGTH: 4000, // Step 5: 4,000자 컷
  MIN_LENGTH: 10,   // 최소 길이 조정
  CACHE_SIZE_LIMIT: 100,
  PROCESSING_TIMEOUT: 5000
};