import React from 'react';
// app.jsx가 src 폴더에 있고, AIToolsGrid.jsx가 src/components 폴더에 있다고 가정합니다.
import AIToolsGrid from './components/AIToolsGrid.jsx';
// App.css가 app.jsx와 같은 폴더 (src)에 있다고 가정합니다.
import './App.css';

function App() {
  return (
    <div className="min-h-screen bg-background font-inter antialiased">
      <AIToolsGrid />
    </div>
  );
}

export default App;
