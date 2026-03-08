import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import walksReducer from './slices/walksSlice';
import profileReducer from './slices/profileSlice';
import dogsReducer from './slices/dogsSlice';
import chatReducer from './slices/chatSlice';
import eventsReducer from './slices/eventsSlice';
import mapReducer from './slices/mapSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    walks: walksReducer,
    profile: profileReducer,
    dogs: dogsReducer,
    chat: chatReducer,
    events: eventsReducer,
    map: mapReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
