// 임시 단순 앱 - 에러 없이 작동하는지 확인
import React from 'react'
import NewMainLanding from '../NewMainLanding.jsx'

function SimpleApp() {
  return (
    <div className="min-h-screen bg-background">
      <NewMainLanding 
        onNavigateToPrompts={() => console.log('Navigate to prompts')}
        onNavigate={() => console.log('Navigate')}
        onAuthClick={() => console.log('Auth click')}
        onProPlanClick={() => console.log('Pro plan click')}
      />
    </div>
  )
}

export default SimpleApp
