import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ComparisonProvider, ImageLibraryProvider } from './contexts';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ComparisonProvider>
      <ImageLibraryProvider>
        <App />
      </ImageLibraryProvider>
    </ComparisonProvider>
  </React.StrictMode>
);
