import { create } from 'zustand';
import templatesData from '../features/prompt-launcher/data/templates.json';

// Transform the raw template data into a more usable format
const transformedTemplates = templatesData.map(template => {
  // templates.json already has 'fields' array, so we don't need to transform from options
  return {
    ...template,
    name: template.title, // Ensure the template has a 'name' property for display
  };
});

export const usePromptStore = create((set, get) => ({
  templates: transformedTemplates,
  selectedTemplate: null,
  selections: {},
  currentTemplate: null,
  isAdvancedMode: false,

  setSelectedTemplate: (templateId) => {
    const template = transformedTemplates.find(t => t.id === templateId);
    set({ 
      selectedTemplate: templateId, 
      currentTemplate: template,
      selections: {} 
    });
  },

  setFieldValue: (field, value) => {
    set(state => ({ 
      selections: { ...state.selections, [field]: value } 
    }));
  },

  setSelection: (field, value) => {
    set(state => ({ 
      selections: { ...state.selections, [field]: value } 
    }));
  },

  setCurrentTemplate: (template) => {
    set({ 
      selectedTemplate: template?.id, 
      currentTemplate: template,
      selections: {} 
    });
  },

  toggleAdvancedMode: () => {
    set(state => ({ isAdvancedMode: !state.isAdvancedMode }));
  },

  generatePrompt: () => {
    const { templates, selectedTemplate, selections } = get();
    if (!selectedTemplate) return "템플릿을 선택해주세요.";

    const template = templates.find(t => t.id === selectedTemplate);
    if (!template) return "";

    let prompt = template.template;
    if (template.fields) {
      template.fields.forEach(field => {
        const value = selections[field.id] || template.defaults[field.id] || `[${field.id}]`;
        prompt = prompt.replace(new RegExp(`{{${field.id}}}`, 'g'), value);
      });
    }

    return prompt;
  },

  getPromptPreview: () => {
    return get().generatePrompt();
  },

  toggleComparison: () => {
    // 비교 모달 토글 로직 (추후 구현)
    console.log('비교 모달 토글');
  },

  saveBookmark: () => {
    // 북마크 저장 로직 (추후 구현)
    const { currentTemplate, selections } = get();
    console.log('북마크 저장:', { template: currentTemplate?.id, selections });
  },
}));