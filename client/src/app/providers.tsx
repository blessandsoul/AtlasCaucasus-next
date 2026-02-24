'use client';

// Initialize i18n (side effect)
import '@/lib/i18n';
import { Provider } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { store } from '@/store';
import { queryClient } from '@/lib/api/query-client';
import { LoadingProvider } from '@/context/LoadingContext';
import { WebSocketProvider } from '@/context/WebSocketContext';
import { CurrencyProvider } from '@/context/CurrencyContext';
import { NotificationInitializer } from '@/features/notifications/components/NotificationInitializer';
import { AuthInitializer } from '@/features/auth/components/AuthInitializer';
import { AgentationProvider } from '@/components/dev/AgentationProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <CurrencyProvider>
          <LoadingProvider>
            <WebSocketProvider>
              <AuthInitializer />
              <NotificationInitializer />
              {children}
              <Toaster position="top-center" toastOptions={{ duration: 2000 }} />
              <AgentationProvider />
            </WebSocketProvider>
          </LoadingProvider>
        </CurrencyProvider>
      </QueryClientProvider>
    </Provider>
  );
}
