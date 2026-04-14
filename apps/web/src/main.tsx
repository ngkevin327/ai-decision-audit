import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { AuthProvider } from './auth/AuthProvider';
import { QueryProvider } from './providers/QueryProvider';
import { ThemeProvider } from './providers/ThemeProvider';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <QueryProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </QueryProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
);
