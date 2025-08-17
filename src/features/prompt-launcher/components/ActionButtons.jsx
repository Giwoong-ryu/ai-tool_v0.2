// src/features/prompt-launcher/components/ActionButtons.jsx
import React from 'react'
import { Button } from '../../../components/ui/button.jsx'
import { Card, CardContent } from '../../../components/ui/card.jsx'
import { RotateCcw, Download, Share2, BookOpen } from 'lucide-react'
import { usePromptStore } from '../../../store/promptStore.js'
import toast from 'react-hot-toast'

const ActionButtons = () => {
  // Store를 안전하게 사용
  let generatedPrompt = ''
  let resetPrompt = () => {}
  
  try {
    const promptData = usePromptStore()
    generatedPrompt = promptData.generatedPrompt || ''
    resetPrompt = promptData.resetPrompt
  } catch (error) {
    console.warn('Prompt store error in ActionButtons:', error)
  }

  const handleReset = () => {
    resetPrompt()
    toast.success('설정이 초기화되었습니다.')
  }

  const handleDownload = () => {
    if (!generatedPrompt) {
      toast.error('먼저 프롬프트를 생성해주세요.')
      return
    }

    const element = document.createElement('a')
    const file = new Blob([generatedPrompt], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = `prompt_${new Date().toISOString().slice(0, 10)}.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
    
    toast.success('프롬프트 파일이 다운로드되었습니다!')
  }

  const handleShare = async () => {
    if (!generatedPrompt) {
      toast.error('먼저 프롬프트를 생성해주세요.')
      return
    }

    try {
      if (navigator.share) {
        await navigator.share({
          title: '이지픽에서 생성한 프롬프트',
          text: generatedPrompt.substring(0, 100) + '...',
          url: window.location.href
        })
      } else {
        // 폴백: 클립보드에 복사
        await navigator.clipboard.writeText(generatedPrompt)
        toast.success('프롬프트가 클립보드에 복사되었습니다!')
      }
    } catch (error) {
      console.error('Share failed:', error)
      toast.error('공유에 실패했습니다.')
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
          <h3 className="font-medium text-gray-900">추가 작업</h3>
          
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={handleReset}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              다시 시작
            </Button>
            
            <Button
              onClick={handleDownload}
              variant="outline"
              disabled={!generatedPrompt}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              다운로드
            </Button>
          </div>
          
          <Button
            onClick={handleShare}
            disabled={!generatedPrompt}
            variant="outline"
            className="w-full flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            공유하기
          </Button>
          
          <div className="pt-2 border-t">
            <Button
              onClick={() => window.open('https://chat.openai.com', '_blank')}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              ChatGPT에서 사용하기
            </Button>
          </div>
          
          <div className="text-xs text-gray-500 text-center">
            💡 생성된 프롬프트를 복사해서 AI 도구에 붙여넣으세요
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default ActionButtons