
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initAutoCachePurge } from './services/cacheService';

// Tự động kiểm tra phiên bản và dọn dẹp cache trình duyệt ngầm
initAutoCachePurge();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
