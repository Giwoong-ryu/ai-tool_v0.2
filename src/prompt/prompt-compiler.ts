// EasyPick 프롬프트 컴파일러 v2 (TypeScript)
// 목적: Handlebars 기반 컴파일 + 후처리 (불릿→MD, 4,000자 컷)
// 단위 테스트 통과를 위한 구현

import Handlebars from 'handlebars'

// Types
export interface CompilerOptions {
  enablePostProcessing?: boolean
  lengthLimits?: {
    maxLength?: number
    minLength?: number
  }
  preserveStructure?: boolean
  optimizeKorean?: boolean
  enableValidation?: boolean
}

export interface CompilerResult {
  success: boolean
  content: string
  error?: string
  metadata?: {
    originalLength?: number
    resultLength?: number
    processingTime?: number
    dataKeys?: string[]
    truncated?: boolean
  }
}

export interface TemplateData {
  [key: string]: any
}

// Handlebars 헬퍼 등록
Handlebars.registerHelper({
  // 조건부 렌더링
  'if_eq': function(a: any, b: any, options: any) {
    return (a === b) ? options.fn(this) : options.inverse(this)
  },
  
  // 배열/문자열 길이
  'length': function(item: any) {
    if (!item) return 0
    return Array.isArray(item) ? item.length : String(item).length
  },
  
  // 문자열 대소문자 변환
  'uppercase': function(str: any) {
    return str ? str.toString().toUpperCase() : ''
  },
  
  'lowercase': function(str: any) {
    return str ? str.toString().toLowerCase() : ''
  },
  
  // 문자열 자르기
  'truncate': function(str: any, length: number, suffix = '...') {
    if (!str || str.length <= length) return str
    return str.substring(0, length) + suffix
  },
  
  // 리스트 포맷팅
  'list': function(items: any[], options: any) {
    if (!Array.isArray(items)) return ''
    return items.map(item => `- ${item}`).join('\n')
  },
  
  // 번호 리스트
  'numbered_list': function(items: any[], options: any) {
    if (!Array.isArray(items)) return ''
    return items.map((item, index) => `${index + 1}. ${item}`).join('\n')
  },
  
  // 기본값 설정
  'default': function(value: any, defaultValue: any) {
    return value || defaultValue
  },
  
  // 날짜 포맷팅
  'format_date': function(date: any, format = 'YYYY-MM-DD') {
    if (!date) return ''
    const d = new Date(date)
    if (format === 'YYYY-MM-DD') {
      return d.toISOString().split('T')[0]
    }
    return d.toLocaleDateString('ko-KR')
  },
  
  // 조건부 줄바꿈
  'br_if': function(condition: any) {
    return condition ? '\n\n' : ''
  },
  
  // JSON 파싱
  'json': function(obj: any) {
    try {
      return JSON.stringify(obj, null, 2)
    } catch {
      return String(obj)
    }
  }
})

// 후처리 파이프라인 함수들
export const postProcessors = {
  
  // 1. 마크다운 표준화 (bullet→MD) - Step 5 요구사항
  standardizeMarkdown: (text: string): string => {
    return text
      // • → -
      .replace(/^[\s]*[•·‧⁃▪▫]/gm, '-')
      // 다양한 bullet 스타일 통일
      .replace(/^[\s]*[*+]\s/gm, '- ')
      // 번호 리스트 표준화 (1) → 1.
      .replace(/^[\s]*\((\d+)\)\s/gm, '$1. ')
      // 헤더 표준화
      .replace(/^[\s]*#{1,6}[\s]*(.+)$/gm, (match, p1) => {
        const level = match.match(/#{1,6}/)![0].length
        return '#'.repeat(level) + ' ' + p1.trim()
      })
  },

  // 2. 길이 제한 및 조정 (4,000자 컷) - Step 5 요구사항
  enforceLength: (text: string, maxLength = 4000, minLength = 100): { result: string, truncated: boolean } => {
    if (text.length <= maxLength && text.length >= minLength) {
      return { result: text, truncated: false }
    }
    
    if (text.length > maxLength) {
      // 문단 단위로 자르기 (구조 보존)
      const paragraphs = text.split('\n\n')
      let result = ''
      let currentLength = 0
      
      for (const paragraph of paragraphs) {
        if (currentLength + paragraph.length + 2 <= maxLength) {
          result += (result ? '\n\n' : '') + paragraph
          currentLength += paragraph.length + 2
        } else {
          // 마지막 문단은 일부만 포함
          const remaining = maxLength - currentLength - 3 // "..." 공간
          if (remaining > 20) {
            result += (result ? '\n\n' : '') + paragraph.substring(0, remaining) + '...'
          }
          break
        }
      }
      return { result, truncated: true }
    }
    
    // 최소 길이 미달시 확장 가이드 추가
    if (text.length < minLength) {
      return { 
        result: text + '\n\n**더 자세한 내용을 추가해 주세요.**', 
        truncated: false 
      }
    }
    
    return { result: text, truncated: false }
  },

  // 3. 공백 및 중복 라인 정리
  cleanWhitespace: (text: string): string => {
    return text
      // 탭을 스페이스로 변환
      .replace(/\t/g, '  ')
      // 줄 끝 공백 제거
      .replace(/[ \t]+$/gm, '')
      // 연속된 빈 줄을 최대 2개로 제한
      .replace(/\n{3,}/g, '\n\n')
      // 문서 시작/끝 공백 제거
      .trim()
  },

  // 4. 한국어 텍스트 최적화
  optimizeKorean: (text: string): string => {
    return text
      // 한글 문장 부호 표준화
      .replace(/。/g, '.')
      .replace(/、/g, ',')
      // 불필요한 반복 제거
      .replace(/(.+?)\1{2,}/g, '$1')
      // 문장 간격 조정
      .replace(/([.!?])\s*([가-힣])/g, '$1 $2')
      // 영문/숫자와 한글 사이 공백
      .replace(/([a-zA-Z0-9])([가-힣])/g, '$1 $2')
      .replace(/([가-힣])([a-zA-Z0-9])/g, '$1 $2')
  },

  // 5. 구조 검증 및 수정
  validateStructure: (text: string): string => {
    const lines = text.split('\n')
    const result: string[] = []
    let inCodeBlock = false
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      
      // 코드 블록 상태 추적
      if (line.startsWith('```')) {
        inCodeBlock = !inCodeBlock
      }
      
      // 코드 블록 내부는 수정하지 않음
      if (inCodeBlock) {
        result.push(line)
        continue
      }
      
      // 헤더 후 빈 줄 보장
      if (line.match(/^#{1,6}\s/)) {
        result.push(line)
        if (i + 1 < lines.length && lines[i + 1].trim() !== '') {
          result.push('')
        }
        continue
      }
      
      // 리스트 들여쓰기 정규화
      if (line.match(/^[\s]*[-*+]\s/) || line.match(/^\s*\d+\.\s/)) {
        const cleaned = line.replace(/^[\s]*/, '')
        result.push(cleaned)
        continue
      }
      
      result.push(line)
    }
    
    return result.join('\n')
  }
}

// 메인 컴파일러 클래스
export class PromptCompiler {
  private options: Required<CompilerOptions>
  private compiledTemplates: Map<string, HandlebarsTemplateDelegate>
  private compilationStats: {
    total: number
    successful: number
    failed: number
    cached: number
  }

  constructor(options: CompilerOptions = {}) {
    this.options = {
      enablePostProcessing: true,
      lengthLimits: {
        maxLength: 4000, // Step 5 요구사항: 4,000자 컷
        minLength: 100
      },
      preserveStructure: true,
      optimizeKorean: true,
      enableValidation: true,
      ...options
    }
    
    this.compiledTemplates = new Map()
    this.compilationStats = {
      total: 0,
      successful: 0,
      failed: 0,
      cached: 0
    }
  }

  // 템플릿 컴파일 (캐싱 지원)
  compile(templateString: string, cacheKey?: string): HandlebarsTemplateDelegate {
    try {
      // 캐시 확인
      if (cacheKey && this.compiledTemplates.has(cacheKey)) {
        this.compilationStats.cached++
        return this.compiledTemplates.get(cacheKey)!
      }

      // Handlebars 컴파일
      const compiled = Handlebars.compile(templateString, {
        noEscape: true, // HTML 이스케이프 비활성화 (마크다운용)
        strict: false   // 엄격 모드 비활성화
      })
      
      // 캐시 저장
      if (cacheKey) {
        this.compiledTemplates.set(cacheKey, compiled)
      }
      
      this.compilationStats.total++
      this.compilationStats.successful++
      
      return compiled
    } catch (error) {
      this.compilationStats.total++
      this.compilationStats.failed++
      
      console.error('Template compilation failed:', error)
      throw new Error(`템플릿 컴파일 실패: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // 프롬프트 생성 (후처리 포함) - Step 5 핵심 함수
  generate(templateString: string, data: TemplateData = {}, options: CompilerOptions = {}): CompilerResult {
    const config = { ...this.options, ...options }
    const startTime = Date.now()
    
    try {
      // 1. 데이터 전처리
      const processedData = this.preprocessData(data)
      
      // 2. 템플릿 컴파일 및 렌더링
      const cacheKey = this.generateCacheKey(templateString)
      const template = this.compile(templateString, cacheKey)
      let result = template(processedData)
      
      let truncated = false
      
      // 3. 후처리 파이프라인 적용 (Step 5 요구사항)
      if (config.enablePostProcessing) {
        const processed = this.applyPostProcessing(result, config)
        result = processed.result
        truncated = processed.truncated
      }
      
      // 4. 최종 검증
      if (config.enableValidation) {
        result = this.validateResult(result, config)
      }
      
      return {
        success: true,
        content: result,
        metadata: {
          originalLength: templateString.length,
          resultLength: result.length,
          processingTime: Date.now() - startTime,
          dataKeys: Object.keys(processedData),
          truncated
        }
      }
      
    } catch (error) {
      console.error('Prompt generation failed:', error)
      return {
        success: false,
        content: '',
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          processingTime: Date.now() - startTime,
          originalLength: templateString.length
        }
      }
    }
  }

  // 데이터 전처리
  private preprocessData(data: TemplateData): TemplateData {
    const processed = { ...data }
    
    // 빈 값 기본값 처리
    Object.keys(processed).forEach(key => {
      if (processed[key] === null || processed[key] === undefined || processed[key] === '') {
        processed[key] = `[${key}]`
      }
    })
    
    // 특수 헬퍼 데이터 추가
    processed._meta = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      generator: 'EasyPick Prompt Engine'
    }
    
    return processed
  }

  // 후처리 파이프라인 적용 (Step 5 핵심 로직)
  private applyPostProcessing(text: string, config: Required<CompilerOptions>): { result: string, truncated: boolean } {
    let result = text
    
    // 1. 마크다운 표준화 (bullet→MD)
    result = postProcessors.standardizeMarkdown(result)
    
    // 2. 공백 정리
    result = postProcessors.cleanWhitespace(result)
    
    // 3. 한국어 최적화
    if (config.optimizeKorean) {
      result = postProcessors.optimizeKorean(result)
    }
    
    // 4. 구조 검증
    result = postProcessors.validateStructure(result)
    
    // 5. 길이 조정 (4,000자 컷)
    const lengthResult = postProcessors.enforceLength(
      result, 
      config.lengthLimits.maxLength, 
      config.lengthLimits.minLength
    )
    
    return lengthResult
  }

  // 결과 검증
  private validateResult(result: string, config: Required<CompilerOptions>): string {
    // 기본 검증
    if (!result || typeof result !== 'string') {
      throw new Error('유효하지 않은 결과입니다')
    }
    
    // 길이 검증
    if (result.length < config.lengthLimits.minLength) {
      console.warn('결과가 최소 길이보다 짧습니다')
    }
    
    if (result.length > config.lengthLimits.maxLength) {
      console.warn('결과가 최대 길이를 초과합니다')
    }
    
    // 구조 검증
    const hasContent = result.trim().length > 0
    const hasPlaceholders = result.includes('[') && result.includes(']')
    
    if (!hasContent) {
      throw new Error('빈 결과입니다')
    }
    
    if (hasPlaceholders) {
      console.warn('미처리된 플레이스홀더가 있습니다')
    }
    
    return result
  }

  // 캐시 키 생성
  private generateCacheKey(templateString: string): string {
    // 단순 해시 함수
    let hash = 0
    for (let i = 0; i < templateString.length; i++) {
      const char = templateString.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // 32비트 정수로 변환
    }
    return `template_${Math.abs(hash)}`
  }

  // 통계 및 상태 조회
  getStats() {
    return {
      ...this.compilationStats,
      cacheSize: this.compiledTemplates.size,
      cacheHitRate: this.compilationStats.total > 0 
        ? (this.compilationStats.cached / this.compilationStats.total) * 100 
        : 0
    }
  }

  // 캐시 관리
  clearCache(): void {
    this.compiledTemplates.clear()
    console.log('Template cache cleared')
  }

  invalidateCache(cacheKey: string): void {
    if (this.compiledTemplates.has(cacheKey)) {
      this.compiledTemplates.delete(cacheKey)
      console.log(`Cache invalidated: ${cacheKey}`)
    }
  }
}

// 기본 컴파일러 인스턴스
export const promptCompiler = new PromptCompiler()

// Step 5 요구사항: compilePrompt() 유닛 테스트 통과 함수
export const compilePrompt = (
  templateString: string, 
  data: TemplateData = {}, 
  options: CompilerOptions = {}
): CompilerResult => {
  return promptCompiler.generate(templateString, data, {
    enablePostProcessing: true,
    lengthLimits: {
      maxLength: 4000, // 4,000자 컷
      minLength: 100
    },
    optimizeKorean: true,
    enableValidation: true,
    ...options
  })
}

// 편의 함수들
export const registerHelper = (name: string, helper: Handlebars.HelperDelegate): void => {
  Handlebars.registerHelper(name, helper)
}

export const registerPartial = (name: string, partial: string): void => {
  Handlebars.registerPartial(name, partial)
}

// 설정 상수
export const CompilerDefaults = {
  MAX_LENGTH: 4000, // Step 5 요구사항 반영
  MIN_LENGTH: 100,
  CACHE_SIZE_LIMIT: 100,
  PROCESSING_TIMEOUT: 5000
} as const

// 유닛 테스트를 위한 테스트 헬퍼
export const testHelpers = {
  // 기본 템플릿 테스트
  createBasicTemplate: (topic: string, audience: string): string => {
    return `# {{topic}}에 대한 글

{{#if_eq target_audience "전문가"}}
이 글은 {{target_audience}}을 대상으로 작성되었습니다.
{{else}}
이 글은 {{target_audience}}을 위한 쉬운 설명입니다.
{{/if_eq}}

## 주요 내용

{{#list keywords}}{{/list}}

{{#if call_to_action}}
{{call_to_action}}
{{/if}}

작성일: {{format_date _meta.timestamp}}
`
  },

  // 테스트 데이터 생성
  createTestData: (overrides: Partial<TemplateData> = {}): TemplateData => ({
    topic: '테스트 주제',
    target_audience: '일반인',
    tone: '친근하고 전문적인',
    structure: '도입-본론-결론',
    keywords: ['키워드1', '키워드2', '키워드3'],
    call_to_action: '댓글로 의견을 남겨주세요',
    ...overrides
  }),

  // 후처리 테스트
  testPostProcessing: (text: string): { before: string, after: string, truncated: boolean } => {
    const before = text
    const result = postProcessors.enforceLength(
      postProcessors.standardizeMarkdown(
        postProcessors.cleanWhitespace(text)
      ), 
      4000, 
      100
    )
    return {
      before,
      after: result.result,
      truncated: result.truncated
    }
  }
}