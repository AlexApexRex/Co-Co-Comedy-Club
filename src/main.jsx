import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ContentProvider } from './context/ContentContext';
import { SavedProvider } from './context/SavedContext';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <AuthProvider>
        <ContentProvider>
          <SavedProvider><App /></SavedProvider>
        </ContentProvider>
      </AuthProvider>
    </HashRouter>
  </React.StrictMode>
);
