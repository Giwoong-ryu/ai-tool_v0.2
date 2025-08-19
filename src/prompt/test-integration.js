// EasyPick 프롬프트 컴파일러 통합 테스트
// Step 5: compilePrompt() 함수 검증 및 blog_draft.json 스키마 테스트

import { compilePrompt, postProcessors, CompilerDefaults } from './prompt-compiler.js'

// 간단한 테스트 실행기
async function runIntegrationTests() {
  console.log('🧪 EasyPick 프롬프트 컴파일러 통합 테스트 시작...\n')
  
  let passed = 0
  let failed = 0
  
  // 테스트 헬퍼
  const test = async (name, fn) => {
    try {
      await fn()
      console.log(`✅ ${name}`)
      passed++
    } catch (error) {
      console.log(`❌ ${name}`)
      console.log(`   오류: ${error.message}`)
      failed++
    }
  }

  // 1. 기본 컴파일 테스트
  await test('기본 템플릿 컴파일', () => {
    const template = '# {{topic}}\n\n대상 독자: {{target_audience}}'
    const data = { topic: 'AI 도구 활용법', target_audience: '개발자' }
    
    const result = compilePrompt(template, data)
    
    if (!result.success) throw new Error('컴파일 실패')
    if (!result.content.includes('AI 도구 활용법')) throw new Error('주제 누락')
    if (!result.content.includes('개발자')) throw new Error('대상 독자 누락')
  })

  // 2. 4,000자 길이 제한 테스트 (Step 5 요구사항)
  await test('4,000자 길이 제한 (Step 5)', () => {
    const longText = 'A'.repeat(5000)
    const template = `# 긴 콘텐츠\n\n${longText}\n\n더 많은 내용...`
    
    const result = compilePrompt(template, {})
    
    if (!result.success) throw new Error('컴파일 실패')
    if (result.content.length > CompilerDefaults.MAX_LENGTH) {
      throw new Error(`길이 제한 초과: ${result.content.length} > ${CompilerDefaults.MAX_LENGTH}`)
    }
  })

  // 3. 불릿 포인트 → 마크다운 변환 테스트 (Step 5 요구사항)
  await test('불릿 포인트 → 마크다운 변환 (Step 5)', () => {
    const template = `
주요 기능:
• 기능 1
▪ 서브 기능 1  
* 다른 스타일 불릿
+ 또 다른 스타일
`
    
    const result = compilePrompt(template, {})
    
    if (!result.success) throw new Error('컴파일 실패')
    if (!result.content.includes('- 기능 1')) throw new Error('• → - 변환 실패')
    if (!result.content.includes('- 서브 기능 1')) throw new Error('▪ → - 변환 실패')
    if (!result.content.includes('- 다른 스타일 불릿')) throw new Error('* → - 변환 실패')
    if (!result.content.includes('- 또 다른 스타일')) throw new Error('+ → - 변환 실패')
  })

  // 4. Handlebars 헬퍼 테스트
  await test('Handlebars 헬퍼 함수', () => {
    const template = `
# {{uppercase topic}}

{{#if_eq target_audience "전문가"}}
전문가용 내용
{{else}}
일반인용 내용
{{/if_eq}}

키워드:
{{#list keywords}}{{/list}}
`
    
    const data = {
      topic: 'ai 도구',
      target_audience: '전문가',
      keywords: ['AI', '도구', '자동화']
    }
    
    const result = compilePrompt(template, data)
    
    if (!result.success) throw new Error('컴파일 실패')
    if (!result.content.includes('AI 도구')) throw new Error('uppercase 헬퍼 실패')
    if (!result.content.includes('전문가용 내용')) throw new Error('if_eq 헬퍼 실패')
    if (!result.content.includes('- AI')) throw new Error('list 헬퍼 실패')
  })

  // 5. 후처리 파이프라인 테스트
  await test('후처리 파이프라인', () => {
    const testText = `
• 불릿 포인트 1


너무    많은   공백
English한글Mixed123
`
    
    // 개별 후처리 함수 테스트
    const standardized = postProcessors.standardizeMarkdown(testText)
    const cleaned = postProcessors.cleanWhitespace(standardized)
    const optimized = postProcessors.optimizeKorean(cleaned)
    
    if (!standardized.includes('- 불릿 포인트 1')) throw new Error('마크다운 표준화 실패')
    if (cleaned.includes('\n\n\n')) throw new Error('공백 정리 실패')
    if (!optimized.includes('English 한글 Mixed 123')) throw new Error('한국어 최적화 실패')
  })

  // 6. blog_draft.json 스키마 통합 테스트
  await test('blog_draft.json 스키마 통합', () => {
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
    
    if (!result.success) throw new Error('블로그 템플릿 컴파일 실패')
    if (!result.content.includes('ChatGPT 활용 팁')) throw new Error('주제 누락')
    if (!result.content.includes('직장인을 위한')) throw new Error('대상 독자 처리 실패')
    if (!result.content.includes('- ChatGPT')) throw new Error('키워드 리스트 누락')
    if (!result.content.includes('친근하고 전문적인')) throw new Error('톤앤매너 누락')
    if (!result.content.includes('댓글로 남겨주세요')) throw new Error('CTA 처리 실패')
    if (result.content.length > 4000) throw new Error('4,000자 제한 초과')
    if (!result.content.includes('EasyPick Prompt Engine')) throw new Error('메타데이터 누락')
  })

  // 7. 에러 처리 테스트
  await test('에러 처리', () => {
    // 잘못된 Handlebars 문법 (닫는 태그 없음)
    const invalidTemplate = '{{#if topic}}미완료 블록'
    const result = compilePrompt(invalidTemplate, {})
    
    if (result.success) throw new Error('잘못된 템플릿이 성공으로 처리됨')
    if (!result.error) throw new Error('에러 메시지 누락')
  })

  // 8. 성능 테스트
  await test('성능 테스트', () => {
    const template = `
# {{topic}}

{{#list items}}{{/list}}

작성자: {{author}}
날짜: {{format_date date}}
`
    
    const data = {
      topic: '성능 테스트',
      items: Array.from({length: 100}, (_, i) => `항목 ${i + 1}`),
      author: 'EasyPick',
      date: new Date().toISOString()
    }
    
    const startTime = Date.now()
    const result = compilePrompt(template, data)
    const endTime = Date.now()
    
    const processingTime = endTime - startTime
    
    if (!result.success) throw new Error('성능 테스트 컴파일 실패')
    if (processingTime > 1000) throw new Error(`처리 시간 초과: ${processingTime}ms`)
    if (!result.metadata?.processingTime) throw new Error('처리 시간 메타데이터 누락')
  })

  // 9. 빈 데이터 처리 테스트
  await test('빈 데이터 처리', () => {
    const template = '주제: {{topic}}, 대상: {{target_audience}}'
    const data = { topic: '', target_audience: null }
    
    const result = compilePrompt(template, data)
    
    if (!result.success) throw new Error('빈 데이터 컴파일 실패')
    if (!result.content.includes('[topic]')) throw new Error('빈 값 플레이스홀더 처리 실패')
    if (!result.content.includes('[target_audience]')) throw new Error('null 값 플레이스홀더 처리 실패')
  })

  // 10. 메타데이터 확인
  await test('메타데이터 검증', () => {
    const template = '생성기: {{_meta.generator}}, 버전: {{_meta.version}}'
    const result = compilePrompt(template, {})
    
    if (!result.success) throw new Error('메타데이터 컴파일 실패')
    if (!result.content.includes('EasyPick Prompt Engine')) throw new Error('생성기 이름 누락')
    if (!result.content.includes('1.0.0')) throw new Error('버전 누락')
    if (!result.metadata) throw new Error('결과 메타데이터 누락')
    if (typeof result.metadata.resultLength !== 'number') throw new Error('결과 길이 누락')
  })

  // 결과 출력
  const total = passed + failed
  console.log('\n📊 통합 테스트 결과:')
  console.log(`   총 테스트: ${total}`)
  console.log(`   성공: ${passed}`)
  console.log(`   실패: ${failed}`)
  console.log(`   성공률: ${((passed / total) * 100).toFixed(1)}%`)

  if (failed === 0) {
    console.log('\n🎉 모든 통합 테스트가 통과했습니다!')
    console.log('✅ compilePrompt() 함수가 정상 작동합니다')
    console.log('✅ Step 5 요구사항이 모두 구현되었습니다:')
    console.log('   - Handlebars 기반 컴파일러 ✅')
    console.log('   - 불릿→MD 후처리 ✅')
    console.log('   - 4,000자 컷 후처리 ✅')
    console.log('   - blog_draft.json 스키마 통합 ✅')
    console.log('   - 유닛 테스트 통과 ✅')
  } else {
    console.log('\n⚠️  일부 테스트가 실패했습니다. 위의 오류를 확인해주세요.')
  }

  return failed === 0
}

// 실행
runIntegrationTests().catch(console.error)