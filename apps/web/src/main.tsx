import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { UIProvider } from '@bharatsales/ui';
import App from './App';
import { RouterLink } from './components/common/RouterLink';
import { installIdNormalizer } from './lib/normalizeIds';
import './styles.css';

installIdNormalizer();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      {/* Toasts (useToast) + router-aware links for @bharatsales/ui components. */}
      <UIProvider linkComponent={RouterLink}>
        <App />
      </UIProvider>
    </BrowserRouter>
  </StrictMode>,
);
