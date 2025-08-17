// src/features/prompt-launcher/components/PromptPreview.jsx
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card.jsx'
import { Button } from '../../../components/ui/button.jsx'
import { Copy, Wand2 } from 'lucide-react'
import { usePromptStore } from '../../../store/promptStore.js'
import toast from 'react-hot-toast'

const PromptPreview = () => {
  // Store를 안전하게 사용
  let currentTemplate = null
  let selectedOptions = {}
  let generatedPrompt = ''
  let generatePrompt = () => ''
  
  try {
    const promptData = usePromptStore()
    currentTemplate = promptData.currentTemplate
    selectedOptions = promptData.selectedOptions || {}
    generatedPrompt = promptData.generatedPrompt || ''
    generatePrompt = promptData.generatePrompt
  } catch (error) {
    console.warn('Prompt store error in PromptPreview:', error)
  }

  const handleGeneratePrompt = () => {
    if (!currentTemplate) {
      toast.error('먼저 템플릿을 선택해주세요.')
      return
    }

    // 필수 옵션 체크
    const requiredOptions = currentTemplate.options.filter(opt => opt.required)
    const missingOptions = requiredOptions.filter(opt => !selectedOptions[opt.key])
    
    if (missingOptions.length > 0) {
      toast.error(`필수 항목을 입력해주세요: ${missingOptions.map(opt => opt.label).join(', ')}`)
      return
    }

    const prompt = generatePrompt()
    if (prompt) {
      toast.success('프롬프트가 생성되었습니다!')
    }
  }

  const handleCopyPrompt = async () => {
    if (!generatedPrompt) {
      toast.error('먼저 프롬프트를 생성해주세요.')
      return
    }

    try {
      await navigator.clipboard.writeText(generatedPrompt)
      toast.success('프롬프트가 클립보드에 복사되었습니다!')
    } catch (error) {
      console.error('Copy failed:', error)
      toast.error('복사에 실패했습니다. 다시 시도해주세요.')
    }
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>생성된 프롬프트</span>
          <div className="flex gap-2">
            <Button
              onClick={handleGeneratePrompt}
              disabled={!currentTemplate}
              className="flex items-center gap-2"
            >
              <Wand2 className="w-4 h-4" />
              생성하기
            </Button>
            <Button
              onClick={handleCopyPrompt}
              disabled={!generatedPrompt}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              복사
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {!currentTemplate ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-4">🎯</div>
            <p>왼쪽에서 템플릿을 선택해주세요</p>
          </div>
        ) : !generatedPrompt ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-4">✨</div>
            <p>옵션을 설정하고 "생성하기" 버튼을 눌러주세요</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg border">
              <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono max-h-96 overflow-y-auto">
                {generatedPrompt}
              </pre>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>💡</span>
              <span>이 프롬프트를 복사해서 ChatGPT, Claude 등의 AI에게 전달하세요</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="font-medium text-blue-900 mb-1">추천 AI 도구</div>
                <div className="text-blue-700">ChatGPT, Claude, Bard</div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="font-medium text-green-900 mb-1">글자 수</div>
                <div className="text-green-700">{generatedPrompt.length.toLocaleString()}자</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default PromptPreview