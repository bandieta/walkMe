import { configureStore } from '@reduxjs/toolkit';
import authReducer, { logout, tokensRefreshed } from './slices/authSlice';
import { registerSessionHooks } from '../services/api/client';
import { disconnectSocket } from '../services/socket';
import walksReducer from './slices/walksSlice';
import profileReducer from './slices/profileSlice';
import dogsReducer from './slices/dogsSlice';
import chatReducer from './slices/chatSlice';
import eventsReducer from './slices/eventsSlice';
import mapReducer from './slices/mapSlice';
import matchesReducer from './slices/matchesSlice';
import placesReducer from './slices/placesSlice';
import shelterRequestsReducer from './slices/shelterRequestsSlice';
import notificationsReducer from './slices/notificationsSlice';

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
    shelterRequests: shelterRequestsReducer,
    notifications: notificationsReducer,
  },
});

registerSessionHooks({
  onTokensRefreshed: (tokens) => store.dispatch(tokensRefreshed(tokens)),
  onSessionExpired: () => {
    disconnectSocket();
    store.dispatch(logout());
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
