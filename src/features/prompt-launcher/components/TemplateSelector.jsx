// src/features/prompt-launcher/components/TemplateSelector.jsx
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card.jsx'
import { Badge } from '../../../components/ui/badge.jsx'
import { usePromptStore } from '../../../store/promptStore.js'

const TemplateSelector = () => {
  // Store를 안전하게 사용
  let templates = []
  let currentTemplate = null
  let setCurrentTemplate = () => {}
  
  try {
    const promptData = usePromptStore()
    templates = promptData.templates || []
    currentTemplate = promptData.currentTemplate
    setCurrentTemplate = promptData.setCurrentTemplate
  } catch (error) {
    console.warn('Prompt store error in TemplateSelector:', error)
  }
  
  // 카테고리별 그룹화
  const groupedTemplates = templates.reduce((groups, template) => {
    const category = template.category
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(template)
    return groups
  }, {})

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg text-gray-900">템플릿 선택</h3>
      
      {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
        <div key={category} className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 bg-gray-50 px-3 py-1 rounded">
            {category}
          </h4>
          
          {categoryTemplates.map((template) => (
            <Card
              key={template.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                currentTemplate?.id === template.id
                  ? 'ring-2 ring-blue-500 bg-blue-50'
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => setCurrentTemplate(template)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{template.icon}</div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-medium text-gray-900 truncate">
                      {template.name}
                    </h5>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {template.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ))}
      
      {templates.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>사용 가능한 템플릿이 없습니다.</p>
        </div>
      )}
    </div>
  )
}

export default TemplateSelector