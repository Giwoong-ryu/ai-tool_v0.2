// EasyPick 프롬프트 컴파일러 유닛 테스트
// Step 5: compilePrompt() 함수 테스트 및 통합 검증

import { compilePrompt, testHelpers, postProcessors, CompilerDefaults } from './prompt-compiler.js'

// 테스트 러너 (간단한 구현)
class SimpleTestRunner {
  constructor() {
    this.tests = []
    this.results = {
      passed: 0,
      failed: 0,
      total: 0
    }
  }

  test(name, fn) {
    this.tests.push({ name, fn })
  }

  async run() {
    console.log('🧪 프롬프트 컴파일러 유닛 테스트 시작...\n')
    
    for (const test of this.tests) {
      try {
        await test.fn()
        console.log(`✅ ${test.name}`)
        this.results.passed++
      } catch (error) {
        console.log(`❌ ${test.name}`)
        console.log(`   오류: ${error.message}`)
        this.results.failed++
      }
      this.results.total++
    }

    console.log('\n📊 테스트 결과:')
    console.log(`   총 테스트: ${this.results.total}`)
    console.log(`   성공: ${this.results.passed}`)
    console.log(`   실패: ${this.results.failed}`)
    console.log(`   성공률: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`)

    return this.results.failed === 0
  }
}

// 어설션 헬퍼
const assert = {
  equal: (actual, expected, message = '') => {
    if (actual !== expected) {
      throw new Error(`${message} - Expected: ${expected}, Actual: ${actual}`)
    }
  },
  
  true: (actual, message = '') => {
    if (actual !== true) {
      throw new Error(`${message} - Expected true, got: ${actual}`)
    }
  },
  
  false: (actual, message = '') => {
    if (actual !== false) {
      throw new Error(`${message} - Expected false, got: ${actual}`)
    }
  },
  
  includes: (text, substring, message = '') => {
    if (!text.includes(substring)) {
      throw new Error(`${message} - Expected "${text}" to include "${substring}"`)
    }
  },
  
  lessThanOrEqual: (actual, expected, message = '') => {
    if (actual > expected) {
      throw new Error(`${message} - Expected ${actual} to be <= ${expected}`)
    }
  },
  
  greaterThanOrEqual: (actual, expected, message = '') => {
    if (actual < expected) {
      throw new Error(`${message} - Expected ${actual} to be >= ${expected}`)
    }
  }
}

// 테스트 스위트
const runner = new SimpleTestRunner()

// 1. 기본 컴파일 테스트
runner.test('기본 템플릿 컴파일', () => {
  const template = testHelpers.createBasicTemplate('AI 도구 활용법', '개발자')
  const data = testHelpers.createTestData({
    topic: 'AI 도구 활용법',
    target_audience: '개발자'
  })
  
  const result = compilePrompt(template, data)
  
  assert.true(result.success, '컴파일이 성공해야 함')
  assert.includes(result.content, 'AI 도구 활용법', '주제가 포함되어야 함')
  assert.includes(result.content, '개발자', '대상 독자가 포함되어야 함')
})

// 2. 4,000자 컷 테스트 (Step 5 요구사항)
runner.test('4,000자 길이 제한 테스트', () => {
  // 긴 텍스트 생성
  const longText = 'A'.repeat(5000)
  const template = `# 긴 콘텐츠\n\n${longText}\n\n더 많은 내용...`
  
  const result = compilePrompt(template, {})
  
  assert.true(result.success, '컴파일이 성공해야 함')
  assert.lessThanOrEqual(result.content.length, CompilerDefaults.MAX_LENGTH, '4,000자를 초과하지 않아야 함')
  assert.true(result.metadata?.truncated || result.content.length <= 4000, '길이 제한이 적용되어야 함')
})

// 3. 불릿 포인트 마크다운 변환 테스트 (Step 5 요구사항)
runner.test('불릿 포인트 → 마크다운 변환', () => {
  const template = `
주요 기능:
• 기능 1
• 기능 2
▪ 서브 기능 1
* 다른 스타일 불릿
+ 또 다른 스타일
`
  
  const result = compilePrompt(template, {})
  
  assert.true(result.success, '컴파일이 성공해야 함')
  assert.includes(result.content, '- 기능 1', '• 기호가 -로 변환되어야 함')
  assert.includes(result.content, '- 기능 2', '• 기호가 -로 변환되어야 함')
  assert.includes(result.content, '- 서브 기능 1', '▪ 기호가 -로 변환되어야 함')
  assert.includes(result.content, '- 다른 스타일 불릿', '* 기호가 -로 변환되어야 함')
  assert.includes(result.content, '- 또 다른 스타일', '+ 기호가 -로 변환되어야 함')
})

// 4. Handlebars 헬퍼 테스트
runner.test('Handlebars 헬퍼 함수', () => {
  const template = `
# {{uppercase topic}}

{{#if_eq target_audience "전문가"}}
전문가용 내용
{{else}}
일반인용 내용
{{/if_eq}}

키워드 목록:
{{#list keywords}}{{/list}}

작성일: {{format_date _meta.timestamp}}
`
  
  const data = {
    topic: 'ai 도구',
    target_audience: '전문가',
    keywords: ['AI', '도구', '자동화']
  }
  
  const result = compilePrompt(template, data)
  
  assert.true(result.success, '컴파일이 성공해야 함')
  assert.includes(result.content, 'AI 도구', 'uppercase 헬퍼가 작동해야 함')
  assert.includes(result.content, '전문가용 내용', 'if_eq 헬퍼가 작동해야 함')
  assert.includes(result.content, '- AI', 'list 헬퍼가 작동해야 함')
  assert.includes(result.content, '- 도구', 'list 헬퍼가 작동해야 함')
})

// 5. 후처리 파이프라인 개별 테스트
runner.test('후처리 파이프라인 테스트', () => {
  const testText = `
• 불릿 포인트 1
▪ 서브 불릿
  
  

너무    많은   공백이    있는    텍스트
English한글Mixed텍스트123
`
  
  const processed = testHelpers.testPostProcessing(testText)
  
  assert.includes(processed.after, '- 불릿 포인트 1', '불릿 변환이 되어야 함')
  assert.includes(processed.after, '- 서브 불릿', '서브 불릿 변환이 되어야 함')
  assert.false(processed.after.includes('\n\n\n'), '3개 이상 연속 줄바꿈이 없어야 함')
  assert.includes(processed.after, 'English 한글 Mixed 텍스트 123', '영문/한글 사이 공백이 있어야 함')
})

// 6. 빈 데이터 처리 테스트
runner.test('빈 데이터 처리', () => {
  const template = '주제: {{topic}}, 대상: {{target_audience}}'
  const data = {
    topic: '',
    target_audience: null
  }
  
  const result = compilePrompt(template, data)
  
  assert.true(result.success, '컴파일이 성공해야 함')
  assert.includes(result.content, '[topic]', '빈 값이 플레이스홀더로 대체되어야 함')
  assert.includes(result.content, '[target_audience]', 'null 값이 플레이스홀더로 대체되어야 함')
})

// 7. 에러 처리 테스트
runner.test('에러 처리', () => {
  // 잘못된 Handlebars 문법 (닫는 태그 없음)
  const invalidTemplate = '{{#if topic}}미완료 블록'
  
  const result = compilePrompt(invalidTemplate, {})
  
  assert.false(result.success, '잘못된 템플릿은 실패해야 함')
  assert.true(!!result.error, '에러 메시지가 있어야 함')
})

// 8. 메타데이터 테스트
runner.test('메타데이터 포함', () => {
  const template = '작성자: {{_meta.generator}}, 버전: {{_meta.version}}'
  
  const result = compilePrompt(template, {})
  
  assert.true(result.success, '컴파일이 성공해야 함')
  assert.includes(result.content, 'EasyPick Prompt Engine', '생성기 이름이 포함되어야 함')
  assert.includes(result.content, '1.0.0', '버전이 포함되어야 함')
  assert.true(!!result.metadata, '메타데이터가 포함되어야 함')
  assert.true(result.metadata.resultLength > 0, '결과 길이가 기록되어야 함')
})

// 9. 한국어 최적화 테스트
runner.test('한국어 텍스트 최적화', () => {
  const template = `
한글문장입니다。잘못된문장부호가、있습니다.
English한글이섞인경우123처리가필요합니다.
`
  
  const result = compilePrompt(template, {})
  
  assert.true(result.success, '컴파일이 성공해야 함')
  assert.includes(result.content, '한글문장입니다.', '일본식 마침표가 변환되어야 함')
  assert.includes(result.content, '잘못된문장부호가,', '일본식 쉼표가 변환되어야 함')
  assert.includes(result.content, 'English 한글', '영문과 한글 사이 공백이 있어야 함')
  assert.includes(result.content, '123 처리', '숫자와 한글 사이 공백이 있어야 함')
})

// 10. 성능 테스트
runner.test('성능 테스트', () => {
  const template = testHelpers.createBasicTemplate('성능 테스트', '개발자')
  const data = testHelpers.createTestData()
  
  const startTime = Date.now()
  const result = compilePrompt(template, data)
  const endTime = Date.now()
  
  const processingTime = endTime - startTime
  
  assert.true(result.success, '컴파일이 성공해야 함')
  assert.lessThanOrEqual(processingTime, 1000, '1초 이내에 처리되어야 함')
  assert.true(typeof result.metadata?.processingTime === 'number', '메타데이터 처리 시간이 기록되어야 함')
})

// 통합 테스트: blog_draft.json 스키마와 함께 테스트
runner.test('blog_draft.json 스키마 통합 테스트', () => {
  const blogTemplate = `
# {{topic}}에 대한 {{#if_eq structure "도입-본론-결론"}}체계적인{{else}}창의적인{{/if_eq}} 글

{{#if_eq target_audience "전문가"}}
이 글은 {{target_audience}}을 대상으로 작성되었습니다.
{{else}}
이 글은 {{target_audience}}을 위한 쉬운 설명입니다.
{{/if_eq}}

## 주요 내용

{{#if keywords}}
핵심 키워드:
{{#list keywords}}{{/list}}
{{/if}}

## 글의 톤앤매너
{{tone}} 톤으로 작성하여 독자들이 쉽게 이해할 수 있도록 하겠습니다.

{{#if call_to_action}}
{{#if_eq call_to_action "댓글 유도"}}
## 마무리
이 글에 대한 여러분의 의견을 댓글로 남겨주세요!
{{else}}
## 다음 단계
{{call_to_action}}
{{/if_eq}}
{{/if}}

---
작성일: {{format_date _meta.timestamp}}
생성기: {{_meta.generator}}
`

  const blogData = {
    topic: 'ChatGPT 활용 팁',
    target_audience: '직장인',
    tone: '친근하고 전문적인',
    structure: '도입-본론-결론',
    keywords: ['ChatGPT', '생산성', '업무효율', 'AI도구'],
    call_to_action: '댓글 유도'
  }
  
  const result = compilePrompt(blogTemplate, blogData)
  
  assert.true(result.success, '블로그 템플릿 컴파일이 성공해야 함')
  assert.includes(result.content, 'ChatGPT 활용 팁', '주제가 제목에 포함되어야 함')
  assert.includes(result.content, '직장인을 위한', '대상 독자가 포함되어야 함')
  assert.includes(result.content, '- ChatGPT', '키워드 리스트가 포함되어야 함')
  assert.includes(result.content, '친근하고 전문적인', '톤앤매너가 포함되어야 함')
  assert.includes(result.content, '댓글로 남겨주세요', 'CTA가 올바르게 처리되어야 함')
  assert.lessThanOrEqual(result.content.length, 4000, '4,000자 제한을 준수해야 함')
})

// 테스트 실행
export async function runTests() {
  try {
    const success = await runner.run()
    
    if (success) {
      console.log('\n🎉 모든 테스트가 통과했습니다!')
      console.log('✅ compilePrompt() 함수가 정상 작동합니다')
      console.log('✅ 4,000자 컷 후처리가 정상 작동합니다')
      console.log('✅ 불릿→MD 변환이 정상 작동합니다')
      console.log('✅ Handlebars 헬퍼가 정상 작동합니다')
      console.log('✅ blog_draft.json 스키마와 통합이 정상 작동합니다')
    } else {
      console.log('\n⚠️  일부 테스트가 실패했습니다. 위의 오류를 확인해주세요.')
    }
    
    return success
  } catch (error) {
    console.error('\n💥 테스트 실행 중 오류 발생:', error)
    return false
  }
}

// Node.js 환경에서 직접 실행
if (typeof window === 'undefined') {
  runTests()
}