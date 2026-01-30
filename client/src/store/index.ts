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

// Save auth state to localStorage on changes
if (typeof window !== 'undefined') {
  store.subscribe(() => {
    try {
      localStorage.setItem('auth', JSON.stringify(store.getState().auth));
    } catch {
      // Ignore localStorage errors
    }
  });
}

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
