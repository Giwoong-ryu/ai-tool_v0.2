// src/components/prompt/TemplateGallery.jsx
import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';

export default function TemplateGallery({ templates = [], onSelect }) {
  const [category, setCategory] = useState('all');

  const categories = useMemo(() => {
    const cats = new Set(templates.map(t => t.category));
    return ['all', ...cats];
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    if (category === 'all') {
      return templates;
    }
    return templates.filter(t => t.category === category);
  }, [templates, category]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">프롬프트 갤러리</h2>
          <p className="text-md text-gray-600">원하는 작업 유형을 선택하여 시작하세요.</p>
        </div>
        
        <div className="flex justify-center gap-2 mb-8 flex-wrap">
          {categories.map(cat => (
            <Button
              key={cat}
              variant={category === cat ? 'default' : 'outline'}
              onClick={() => setCategory(cat)}
            >
              {cat === 'all' ? '전체' : cat}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <Card 
              key={template.id} 
              className="cursor-pointer hover:shadow-lg transition-shadow duration-200 flex flex-col"
              onClick={() => onSelect(template.id)}
            >
              <CardContent className="p-6 flex flex-col items-center text-center flex-grow">
                <div className="text-4xl mb-4">{template.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{template.name}</h3>
                <p className="text-sm text-gray-600 flex-grow">{template.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}