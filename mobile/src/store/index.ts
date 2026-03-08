import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import walksReducer from './slices/walksSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    walks: walksReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
