import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { ClerkProvider } from './auth/ClerkProvider';
import { QueryProvider } from './providers/QueryProvider';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider>
      <QueryProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryProvider>
    </ClerkProvider>
  </StrictMode>,
);
