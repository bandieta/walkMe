// API layer — currently backed by mock service.
// Set USE_MOCK=false and configure ENV.API_BASE_URL to switch to real backend.
import { mockAuth, mockUsers, mockWalks, mockEvents, mockChat, mockMatches, mockPlaces } from '../mock';

export const USE_MOCK = true;

export const authApi = mockAuth;
export const usersApi = mockUsers;
export const walksApi = mockWalks;
export const eventsApi = mockEvents;
export const chatApi = mockChat;
export const matchesApi = mockMatches;
export const placesApi = mockPlaces;

