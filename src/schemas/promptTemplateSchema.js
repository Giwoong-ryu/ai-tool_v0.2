// src/schemas/promptTemplateSchema.js
import { z } from "zod";

/* ========================================
 * 템플릿 스키마 정의 (Zod/JSON Schema)
 * 지시: 템플릿별 필수·기본값·설명·옵션을 스키마로 고정
 * 부연: JSON Schema 저장, 앱 로드시 Zod로 런타임 검증
 * ======================================== */

// 옵션 필드 스키마
const optionFieldSchema = z.object({
  key: z.string().min(1, "옵션 키는 필수입니다"),
  label: z.string().min(1, "옵션 레이블은 필수입니다"),
  type: z.enum(["text", "select", "textarea", "number", "checkbox", "multiselect"], {
    errorMap: () => ({ message: "지원되지 않는 옵션 타입입니다" })
  }),
  options: z.array(z.union([
    z.string(),
    z.object({
      value: z.string(),
      label: z.string()
    })
  ])).optional(),
  placeholder: z.string().optional(),
  description: z.string().optional(),
  required: z.boolean().default(false),
  defaultValue: z.any().optional(),
  validation: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
    custom: z.function().optional()
  }).optional()
});

// 기본 템플릿 스키마
const baseTemplateSchema = z.object({
  id: z.string().min(1, "템플릿 ID는 필수입니다"),
  name: z.string().min(1, "템플릿 이름은 필수입니다"),
  category: z.string().min(1, "카테고리는 필수입니다"),
  description: z.string().min(1, "설명은 필수입니다"),
  icon: z.string().default("📝"),
  
  // 버전 관리 필드
  version: z.string().default("1.0.0"),
  status: z.enum(["active", "deprecated", "draft"]).default("active"),
  slug: z.string().optional(),
  
  // 템플릿 내용 (Handlebars 형식)
  template: z.string().min(1, "템플릿 내용은 필수입니다"),
  
  // 옵션 정의
  options: z.array(optionFieldSchema).min(1, "최소 하나의 옵션이 필요합니다"),
  
  // 메타데이터
  metadata: z.object({
    author: z.string().optional(),
    tags: z.array(z.string()).default([]),
    difficulty: z.enum(["beginner", "intermediate", "advanced"]).default("beginner"),
    estimatedTime: z.string().optional(), // "5-10분"
    usage: z.object({
      totalUsage: z.number().default(0),
      monthlyUsage: z.number().default(0)
    }).default({})
  }).optional(),
  
  // 개별 템플릿 기본값 오버라이드
  defaults: z.union([
    z.record(z.any()),
    z.function().returns(z.record(z.any()))
  ]).optional(),
  
  // 생성/수정 시간
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date())
});

// 포크 관련 스키마
const forkTemplateSchema = baseTemplateSchema.extend({
  parentId: z.string().min(1, "부모 템플릿 ID는 필수입니다"),
  forkType: z.enum(["fork", "remix", "clone"]).default("fork"),
  changes: z.object({
    added: z.array(z.string()).default([]),
    modified: z.array(z.string()).default([]),
    removed: z.array(z.string()).default([])
  }).optional(),
  diff: z.record(z.any()).optional() // 변경사항 diff 저장
});

// 템플릿 컬렉션 스키마
const templateCollectionSchema = z.object({
  version: z.string().default("1.0.0"),
  lastUpdated: z.date().default(() => new Date()),
  templates: z.array(baseTemplateSchema),
  categories: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    icon: z.string().optional()
  })).default([])
});

// 특정 템플릿 타입별 스키마 확장
const resumeTemplateSchema = baseTemplateSchema.extend({
  category: z.literal("취업"),
  options: z.array(optionFieldSchema).refine(
    (options) => {
      const requiredFields = ["position", "company", "experience", "tone", "length"];
      const optionKeys = options.map(opt => opt.key);
      return requiredFields.every(field => optionKeys.includes(field));
    },
    { message: "자기소개서 템플릿에 필수 필드가 누락되었습니다" }
  )
});

const blogTemplateSchema = baseTemplateSchema.extend({
  category: z.literal("콘텐츠"),
  options: z.array(optionFieldSchema).refine(
    (options) => {
      const requiredFields = ["topic", "target_audience", "style", "length"];
      const optionKeys = options.map(opt => opt.key);
      return requiredFields.every(field => optionKeys.includes(field));
    },
    { message: "블로그 템플릿에 필수 필드가 누락되었습니다" }
  )
});

const presentationTemplateSchema = baseTemplateSchema.extend({
  category: z.literal("비즈니스"),
  options: z.array(optionFieldSchema).refine(
    (options) => {
      const requiredFields = ["subject", "slideCount", "toneStyle", "tool", "contentStructure"];
      const optionKeys = options.map(opt => opt.key);
      return requiredFields.every(field => optionKeys.includes(field));
    },
    { message: "프레젠테이션 템플릿에 필수 필드가 누락되었습니다" }
  )
});

// 유니언 스키마로 모든 템플릿 타입 지원
const templateSchema = z.discriminatedUnion("category", [
  resumeTemplateSchema,
  blogTemplateSchema,
  presentationTemplateSchema,
  baseTemplateSchema.extend({
    category: z.string().refine(
      (cat) => !["취업", "콘텐츠", "비즈니스"].includes(cat),
      { message: "이미 정의된 카테고리입니다" }
    )
  })
]);

// 템플릿 유효성 검사 헬퍼 함수
export const validateTemplate = (template) => {
  try {
    return {
      success: true,
      data: templateSchema.parse(template),
      errors: null
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      errors: error.errors || [{ message: error.message }]
    };
  }
};

// 템플릿 컬렉션 유효성 검사
export const validateTemplateCollection = (collection) => {
  try {
    return {
      success: true,
      data: templateCollectionSchema.parse(collection),
      errors: null
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      errors: error.errors || [{ message: error.message }]
    };
  }
};

// 옵션 필드 유효성 검사
export const validateOptionField = (option) => {
  try {
    return {
      success: true,
      data: optionFieldSchema.parse(option),
      errors: null
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      errors: error.errors || [{ message: error.message }]
    };
  }
};

// JSON Schema 변환 함수 (외부 시스템 호환성)
export const toJSONSchema = (zodSchema) => {
  // Zod를 JSON Schema로 변환하는 유틸리티
  // 실제 구현에서는 zod-to-json-schema 라이브러리 사용 권장
  return {
    type: "object",
    properties: {
      // 기본 JSON Schema 형태로 변환
      // 실제 구현시 zod-to-json-schema 패키지 사용
    }
  };
};

// 기본 템플릿 생성 헬퍼
export const createDefaultTemplate = (overrides = {}) => {
  const defaultTemplate = {
    id: `template_${Date.now()}`,
    name: "새 템플릿",
    category: "기타",
    description: "새로 생성된 템플릿입니다",
    icon: "📝",
    version: "1.0.0",
    status: "draft",
    template: "{{content}}에 대한 내용을 작성해주세요.",
    options: [
      {
        key: "content",
        label: "내용",
        type: "textarea",
        required: true,
        placeholder: "작성할 내용을 입력하세요"
      }
    ],
    metadata: {
      tags: [],
      difficulty: "beginner",
      usage: {
        totalUsage: 0,
        monthlyUsage: 0
      }
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };

  return validateTemplate(defaultTemplate);
};

// 스키마 내보내기
export {
  baseTemplateSchema,
  forkTemplateSchema,
  templateCollectionSchema,
  templateSchema,
  optionFieldSchema,
  resumeTemplateSchema,
  blogTemplateSchema,
  presentationTemplateSchema
};

// 타입 정의 (TypeScript 지원용)
export const TemplateTypes = {
  TEXT: "text",
  SELECT: "select", 
  TEXTAREA: "textarea",
  NUMBER: "number",
  CHECKBOX: "checkbox",
  MULTISELECT: "multiselect"
};

export const TemplateStatus = {
  ACTIVE: "active",
  DEPRECATED: "deprecated", 
  DRAFT: "draft"
};

export const ForkTypes = {
  FORK: "fork",
  REMIX: "remix",
  CLONE: "clone"
};