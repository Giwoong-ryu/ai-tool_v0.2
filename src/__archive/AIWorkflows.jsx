// [자동 분류] 이 파일은 현재 사용되지 않으며 중복된 컴포넌트로 판단되어 아카이브 처리되었습니다.

import React from 'react';
import { aiWorkflows } from '../data/aiTools';

const AIWorkflows = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold text-center mb-8">AI 도구 연계 18선</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {aiWorkflows.map((workflow) => (
          <div key={workflow.id} className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4">{workflow.title}</h3>
            <ul className="space-y-2">
              {workflow.steps.map((step, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-blue-500 font-medium mr-2">{step.step_number}</span>
                  <div>
                    <p className="font-medium">{step.tool_action}</p>
                    {step.details && <p className="text-gray-600 text-sm">{step.details}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AIWorkflows;