import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { aiTools } from '../data/aiTools.js';
import AIToolIcon from './AIToolIcon';
import InteractivePrompt from './InteractivePrompt';

const InteractiveHub = ({ onNavigateToPrompts }) => {
  const [topTools, setTopTools] = useState([]);

  useEffect(() => {
    const rankedTools = aiTools.sort((a, b) => b.rating - a.rating).slice(0, 10);
    setTopTools(rankedTools);
  }, []);

  return (
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left Column: AI Tools Ranking */}
        <div className="lg:col-span-1">
          <Card className="bg-white shadow-xl border border-slate-200/50 rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-indigo-50 px-6 py-5 border-b border-slate-200/50">
              <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg text-white text-sm">
                  🏆
                </span>
                AI 도구 주간 랭킹
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ul className="space-y-3">
                {topTools.map((tool, index) => (
                  <li key={tool.name} className="flex items-center space-x-4 p-3 rounded-xl hover:bg-slate-50 transition-all duration-300 group cursor-pointer">
                    <span className={`flex items-center justify-center w-8 h-8 rounded-lg text-white text-sm font-bold ${
                      index === 0 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                      index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                      index === 2 ? 'bg-gradient-to-r from-orange-600 to-yellow-600' :
                      'bg-gradient-to-r from-slate-400 to-slate-500'
                    }`}>
                      {index + 1}
                    </span>
                    <AIToolIcon tool={tool} className="w-8 h-8 group-hover:scale-110 transition-transform duration-300" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{tool.name}</h4>
                      <p className="text-sm text-slate-500">{tool.category}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`text-xs ${
                              star <= Math.floor(tool.rating)
                                ? 'text-yellow-500'
                                : star <= tool.rating
                                ? 'text-yellow-300'
                                : 'text-gray-300'
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <span className="text-xs font-semibold text-slate-600">{tool.rating}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Interactive Prompt */}
        <div className="lg:col-span-2">
          <InteractivePrompt onNavigateToPrompts={onNavigateToPrompts} />
        </div>
      </div>
    </div>
  );
};

export default InteractiveHub;