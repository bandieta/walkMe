import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import walksReducer from './slices/walksSlice';
import profileReducer from './slices/profileSlice';
import dogsReducer from './slices/dogsSlice';
import chatReducer from './slices/chatSlice';
import eventsReducer from './slices/eventsSlice';
import mapReducer from './slices/mapSlice';
import matchesReducer from './slices/matchesSlice';
import placesReducer from './slices/placesSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    walks: walksReducer,
    profile: profileReducer,
    dogs: dogsReducer,
    chat: chatReducer,
    events: eventsReducer,
    map: mapReducer,
    matches: matchesReducer,
    places: placesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
