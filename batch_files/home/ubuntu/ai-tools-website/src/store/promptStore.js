import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const usePromptStore = create(
  persist(
    (set, get) => ({
      // 현재 선택된 템플릿
      currentTemplate: null,
      
      // 사용자 선택값
      selections: {},
      
      // 체크된 질문들
      checkedQuestions: [],
      
      // 북마크된 프롬프트들
      bookmarks: [],
      
      // 최종 생성된 프롬프트
      finalPrompt: '',
      
      // 모달 상태
      isComparisonModalOpen: false,
      
      // 온보딩 완료 여부
      hasCompletedOnboarding: false,
      
      // 심플/고급 모드
      isAdvancedMode: false,
      
      // 액션들
      setCurrentTemplate: (template) => {
        set({ 
          currentTemplate: template,
          selections: {},
          checkedQuestions: [],
          finalPrompt: ''
        });
      },
      
      updateSelection: (key, value) => {
        const { selections } = get();
        const newSelections = { ...selections, [key]: value };
        set({ selections: newSelections });
        
        // 프롬프트 자동 업데이트
        get().generateFinalPrompt();
      },
      
      toggleQuestion: (question) => {
        const { checkedQuestions } = get();
        const newQuestions = checkedQuestions.includes(question)
          ? checkedQuestions.filter(q => q !== question)
          : [...checkedQuestions, question];
        
        set({ checkedQuestions: newQuestions });
        get().generateFinalPrompt();
      },
      
      generateFinalPrompt: () => {
        const { currentTemplate, selections, checkedQuestions } = get();
        if (!currentTemplate) return;
        
        let promptText = currentTemplate.template;
        
        // 변수 치환
        promptText = promptText.replace(/\{\{(\w+)\}\}/g, (match, key) => {
          const selectedValue = selections[key];
          const defaultValue = currentTemplate.defaults[key];
          return selectedValue !== undefined ? selectedValue : defaultValue;
        });
        
        // 선택된 질문들 추가
        if (checkedQuestions.length > 0) {
          promptText += '\n\n추가 고려사항:\n' + checkedQuestions.map(q => `- ${q}`).join('\n');
        }
        
        set({ finalPrompt: promptText });
      },
      
      saveBookmark: (bookmark) => {
        const { bookmarks } = get();
        set({ bookmarks: [...bookmarks, bookmark] });
      },
      
      removeBookmark: (bookmarkId) => {
        const { bookmarks } = get();
        set({ bookmarks: bookmarks.filter(b => b.id !== bookmarkId) });
      },
      
      loadBookmark: (bookmark) => {
        // 북마크에서 템플릿과 선택값 복원
        set({
          selections: bookmark.selections || {},
          checkedQuestions: bookmark.checkedQuestions || [],
          finalPrompt: bookmark.finalPrompt
        });
      },
      
      setComparisonModalOpen: (isOpen) => {
        set({ isComparisonModalOpen: isOpen });
      },
      
      completeOnboarding: () => {
        set({ hasCompletedOnboarding: true });
      },
      
      toggleAdvancedMode: () => {
        const { isAdvancedMode } = get();
        set({ isAdvancedMode: !isAdvancedMode });
      },
      
      resetState: () => {
        set({
          currentTemplate: null,
          selections: {},
          checkedQuestions: [],
          finalPrompt: '',
          isComparisonModalOpen: false
        });
      }
    }),
    {
      name: 'prompt-launcher-storage',
      partialize: (state) => ({
        bookmarks: state.bookmarks,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        isAdvancedMode: state.isAdvancedMode
      })
    }
  )
);

export default usePromptStore;

