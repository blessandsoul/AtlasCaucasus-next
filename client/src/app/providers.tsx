'use client';

// Initialize i18n (side effect)
// Initialize i18n (side effect)
import '@/lib/i18n';
import { Provider } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
import { store } from '@/store';
import { queryClient } from '@/lib/api/query-client';
import { LoadingProvider } from '@/context/LoadingContext';
import { WebSocketProvider } from '@/context/WebSocketContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <LoadingProvider>
          <WebSocketProvider>
            {children}
          </WebSocketProvider>
        </LoadingProvider>
      </QueryClientProvider>
    </Provider>
  );
}
