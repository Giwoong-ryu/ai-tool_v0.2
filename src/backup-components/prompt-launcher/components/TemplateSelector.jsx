import React, { useState, useEffect } from 'react';
import { usePromptStore } from '../../../store/promptStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import templatesData from '../data/templates.json';

const TemplateSelector = () => {
  const { currentTemplate, setCurrentTemplate } = usePromptStore();
  const [templates] = useState(templatesData);

  const handleTemplateSelect = (template) => {
    setCurrentTemplate(template);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">템플릿 선택</h3>
      <div className="space-y-3">
        {templates.map((template) => (
          <Card 
            key={template.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              currentTemplate?.id === template.id 
                ? 'ring-2 ring-blue-500 bg-blue-50' 
                : 'hover:bg-gray-50'
            }`}
            onClick={() => handleTemplateSelect(template)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{template.title}</CardTitle>
              <CardDescription className="text-xs">{template.category}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-gray-600 line-clamp-2">{template.notes}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TemplateSelector;
