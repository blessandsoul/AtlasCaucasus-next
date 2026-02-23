import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/features/auth/store/authSlice';
import chatReducer from '@/features/chat/store/chatSlice';

// Load auth state from localStorage
const loadAuthState = () => {
  if (typeof window === 'undefined') return undefined;
  try {
    const state = localStorage.getItem('auth');
    return state ? JSON.parse(state) : undefined;
  } catch {
    return undefined;
  }
};

export const store = configureStore({
  reducer: {
    auth: authReducer,
    chat: chatReducer,
  },
  preloadedState: {
    auth: loadAuthState(),
  },
});

// Save auth state to localStorage on changes and sync session cookie for middleware
if (typeof window !== 'undefined') {
  const syncSessionCookie = (isAuthenticated: boolean): void => {
    if (isAuthenticated) {
      document.cookie = 'has_session=1; path=/; SameSite=Lax';
    } else {
      document.cookie = 'has_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
  };

  // Immediately sync cookie with initial state on page load.
  // This prevents a deadlock where localStorage was cleared (manually or by corruption)
  // but the has_session cookie persists, causing middleware to redirect /login → /dashboard
  // while the client has no auth state, trapping the user.
  syncSessionCookie(store.getState().auth.isAuthenticated);

  store.subscribe(() => {
    const authState = store.getState().auth;
    try {
      localStorage.setItem('auth', JSON.stringify(authState));
    } catch {
      // Ignore localStorage errors
    }
    syncSessionCookie(authState.isAuthenticated);
  });
}

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
