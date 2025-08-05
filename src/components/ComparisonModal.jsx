import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { usePromptStore } from "../store/promptStore";

// A simple diffing function to highlight changes
const highlightDiff = (original, modified) => {
  const originalWords = original.split(/(\s+)/);
  const modifiedWords = modified.split(/(\s+)/);
  
  return modifiedWords.map((word, index) => {
    if (originalWords[index] !== word) {
      return <span key={index} className="bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 px-1 py-0.5 rounded-md font-semibold border border-amber-200">{word}</span>;
    }
    return word;
  });
};

const ComparisonModal = ({ isOpen, onOpenChange, onUsePrompt }) => {
  const { templates, selectedTemplate, selections } = usePromptStore();
  const currentTemplate = templates.find(t => t.id === selectedTemplate);

  if (!currentTemplate || !currentTemplate.fields) return null;

  // Generate original prompt from defaults
  let originalPrompt = currentTemplate.template;
  currentTemplate.fields.forEach(field => {
    originalPrompt = originalPrompt.replace(new RegExp(`{{${field.id}}}`, 'g'), currentTemplate.defaults[field.id]);
  });

  // Generate modified prompt from user selections
  let modifiedPrompt = currentTemplate.template;
  currentTemplate.fields.forEach(field => {
    const value = selections[field.id] || currentTemplate.defaults[field.id];
    modifiedPrompt = modifiedPrompt.replace(new RegExp(`{{${field.id}}}`, 'g'), value);
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl bg-white rounded-2xl border border-slate-200 shadow-2xl">
        <DialogHeader className="text-center space-y-4 pb-6 border-b border-slate-200">
          <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center justify-center gap-3">
            <span className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl text-white">
              🔍
            </span>
            당신의 선택이 더 나은 질문을 만들었습니다
          </DialogTitle>
          <p className="text-slate-600">기본 프롬프트와 비교해서 어떻게 개선되었는지 확인해보세요</p>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 bg-slate-500 rounded-lg text-white text-sm font-bold">
                기본
              </span>
              <h4 className="font-semibold text-slate-700">Standard Prompt</h4>
            </div>
            <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 leading-relaxed min-h-[200px]">
              {originalPrompt}
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg text-white text-sm font-bold">
                개선
              </span>
              <h4 className="font-semibold text-slate-700">Your Enhanced Prompt</h4>
            </div>
            <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 text-slate-700 leading-relaxed min-h-[200px]">
              {highlightDiff(originalPrompt, modifiedPrompt)}
            </div>
          </div>
        </div>
        
        <div className="text-center py-4 bg-slate-50 rounded-xl mx-6 mb-6">
          <p className="text-slate-600 font-medium">
            💡 하이라이트된 부분이 당신의 선택을 반영한 개선사항입니다
          </p>
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-200">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="px-8 py-3 border-2 border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl font-medium transition-all duration-300"
          >
            계속 수정하기
          </Button>
          <Button 
            onClick={onUsePrompt}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-12 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            이대로 전송하기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ComparisonModal;