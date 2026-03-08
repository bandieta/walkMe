// Mock API service — replaces all real HTTP calls during development
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  USERS, DOGS, WALKS, EVENTS, PLACES, MESSAGES, MATCHES, SWIPE_CANDIDATES,
  CURRENT_USER_ID,
  MockUser, MockDog, MockWalk, MockEvent, MockPlace, MockMessage, MockMatch,
} from './data';

// Realistic async delay
const delay = (ms = 350) => new Promise(res => setTimeout(res, ms));

// Mutable in-memory state (persists for app session)
let _users: MockUser[] = JSON.parse(JSON.stringify(USERS));
let _dogs: MockDog[] = JSON.parse(JSON.stringify(DOGS));
let _walks: MockWalk[] = JSON.parse(JSON.stringify(WALKS));
let _events: MockEvent[] = JSON.parse(JSON.stringify(EVENTS));
let _messages: MockMessage[] = JSON.parse(JSON.stringify(MESSAGES));
let _matches: MockMatch[] = JSON.parse(JSON.stringify(MATCHES));
let _swipeDeck: string[] = [...SWIPE_CANDIDATES];

// Helper to wrap response in axios-like shape
const ok = <T>(data: T) => ({ data });

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const mockAuth = {
  login: async (_email: string, _password: string) => {
    await delay();
    const user = _users.find(u => u.id === CURRENT_USER_ID)!;
    const token = 'mock-jwt-token-' + Date.now();
    await AsyncStorage.setItem('accessToken', token);
    await AsyncStorage.setItem('currentUserId', CURRENT_USER_ID);
    return ok({ user: { id: user.id, email: user.email, displayName: user.displayName }, token });
  },
  register: async (_email: string, displayName: string, _password: string) => {
    await delay();
    const token = 'mock-jwt-token-' + Date.now();
    await AsyncStorage.setItem('accessToken', token);
    await AsyncStorage.setItem('currentUserId', CURRENT_USER_ID);
    // Update display name
    const u = _users.find(u => u.id === CURRENT_USER_ID)!;
    u.displayName = displayName;
    return ok({ user: { id: u.id, email: u.email, displayName }, token });
  },
  firebaseLogin: async () => {
    await delay();
    const user = _users.find(u => u.id === CURRENT_USER_ID)!;
    const token = 'mock-jwt-token-' + Date.now();
    await AsyncStorage.setItem('accessToken', token);
    return ok({ user: { id: user.id, email: user.email, displayName: user.displayName }, token });
  },
};

// ─── Users / Profile ─────────────────────────────────────────────────────────
export const mockUsers = {
  getMe: async () => {
    await delay();
    const u = _users.find(u => u.id === CURRENT_USER_ID)!;
    return ok(u);
  },
  getProfile: async (userId: string) => {
    await delay();
    const u = _users.find(u => u.id === userId) ?? _users[0];
    return ok(u);
  },
  updateProfile: async (data: Partial<MockUser>) => {
    await delay();
    const idx = _users.findIndex(u => u.id === CURRENT_USER_ID);
    _users[idx] = { ..._users[idx], ...data };
    return ok(_users[idx]);
  },
  updateFcmToken: async () => {
    await delay(100);
    return ok({ success: true });
  },
  getMyDogs: async () => {
    await delay();
    const me = _users.find(u => u.id === CURRENT_USER_ID)!;
    const dogs = _dogs.filter(d => me.dogIds.includes(d.id));
    return ok(dogs);
  },
  getDogsByOwner: async (ownerId: string) => {
    await delay();
    return ok(_dogs.filter(d => d.ownerId === ownerId));
  },
  createDog: async (data: Omit<MockDog, 'id' | 'ownerId'>) => {
    await delay();
    const dog: MockDog = { id: 'dog-' + Date.now(), ownerId: CURRENT_USER_ID, ...data };
    _dogs.push(dog);
    const me = _users.find(u => u.id === CURRENT_USER_ID)!;
    me.dogIds = [...me.dogIds, dog.id];
    return ok(dog);
  },
  updateDog: async (dogId: string, data: Partial<MockDog>) => {
    await delay();
    const idx = _dogs.findIndex(d => d.id === dogId);
    if (idx !== -1) _dogs[idx] = { ..._dogs[idx], ...data };
    return ok(_dogs[idx]);
  },
  deleteDog: async (dogId: string) => {
    await delay();
    _dogs = _dogs.filter(d => d.id !== dogId);
    const me = _users.find(u => u.id === CURRENT_USER_ID)!;
    me.dogIds = me.dogIds.filter(id => id !== dogId);
    return ok({ success: true });
  },
};

// ─── Walks ────────────────────────────────────────────────────────────────────
export const mockWalks = {
  list: async () => {
    await delay();
    const enriched = _walks.map(w => ({
      ...w,
      host: _users.find(u => u.id === w.hostId),
      participants: w.participantIds.map(id => _users.find(u => u.id === id)).filter(Boolean),
    }));
    return ok(enriched);
  },
  getById: async (id: string) => {
    await delay();
    const w = _walks.find(w => w.id === id);
    if (!w) throw new Error('Walk not found');
    return ok({
      ...w,
      host: _users.find(u => u.id === w.hostId),
      participants: w.participantIds.map(id => _users.find(u => u.id === id)).filter(Boolean),
    });
  },
  create: async (data: Partial<MockWalk>) => {
    await delay();
    const walk: MockWalk = {
      id: 'walk-' + Date.now(),
      title: data.title ?? 'New Walk',
      description: data.description ?? '',
      category: data.category ?? 'Park',
      hostId: CURRENT_USER_ID,
      meetingLat: data.meetingLat ?? 52.2297,
      meetingLng: data.meetingLng ?? 21.0122,
      meetingPoint: data.meetingPoint ?? 'Warsaw',
      scheduledAt: data.scheduledAt ?? new Date().toISOString(),
      maxParticipants: data.maxParticipants ?? 8,
      participantIds: [CURRENT_USER_ID],
      status: 'upcoming',
      duration: data.duration ?? '1h',
    };
    _walks.unshift(walk);
    return ok(walk);
  },
  join: async (id: string) => {
    await delay();
    const w = _walks.find(w => w.id === id);
    if (w && !w.participantIds.includes(CURRENT_USER_ID)) {
      w.participantIds.push(CURRENT_USER_ID);
    }
    return ok({ success: true });
  },
  leave: async (id: string) => {
    await delay();
    const w = _walks.find(w => w.id === id);
    if (w) w.participantIds = w.participantIds.filter(id => id !== CURRENT_USER_ID);
    return ok({ success: true });
  },
  updateStatus: async (id: string, status: string) => {
    await delay();
    const w = _walks.find(w => w.id === id);
    if (w) (w as any).status = status;
    return ok({ success: true });
  },
};

// ─── Events ───────────────────────────────────────────────────────────────────
export const mockEvents = {
  list: async () => {
    await delay();
    return ok([..._events]);
  },
  getById: async (id: string) => {
    await delay();
    const e = _events.find(e => e.id === id);
    if (!e) throw new Error('Event not found');
    return ok({ ...e, organizer: _users.find(u => u.id === e.organizerId) });
  },
  create: async (data: Partial<MockEvent>) => {
    await delay();
    const event: MockEvent = {
      id: 'event-' + Date.now(),
      title: data.title ?? 'New Event',
      description: data.description ?? '',
      date: data.date ?? new Date().toISOString(),
      location: data.location ?? 'Warsaw',
      lat: data.lat ?? 52.2297,
      lng: data.lng ?? 21.0122,
      organizerId: CURRENT_USER_ID,
      participantCount: 1,
      maxParticipants: data.maxParticipants ?? 30,
      isJoined: true,
      status: 'upcoming',
      category: data.category ?? 'Meetup',
      emoji: data.emoji ?? '🎉',
    };
    _events.unshift(event);
    return ok(event);
  },
  join: async (id: string) => {
    await delay();
    const e = _events.find(e => e.id === id);
    if (e && !e.isJoined) { e.isJoined = true; e.participantCount++; }
    return ok({ success: true });
  },
  leave: async (id: string) => {
    await delay();
    const e = _events.find(e => e.id === id);
    if (e && e.isJoined) { e.isJoined = false; e.participantCount = Math.max(0, e.participantCount - 1); }
    return ok({ success: true });
  },
};

// ─── Chat ─────────────────────────────────────────────────────────────────────
export const mockChat = {
  getRooms: async () => {
    await delay();
    // Group chats = walks the current user is in
    const myWalks = _walks.filter(w => w.participantIds.includes(CURRENT_USER_ID));
    const groupRooms = myWalks.map(w => ({
      walkId: w.id,
      walkTitle: w.title,
      type: 'group' as const,
      unreadCount: 0,
      lastMessage: _messages.filter(m => m.roomId === w.id).slice(-1)[0] ?? null,
    }));
    return ok(groupRooms);
  },
  getMessages: async (roomId: string) => {
    await delay();
    return ok(_messages.filter(m => m.roomId === roomId));
  },
  sendMessage: async (roomId: string, content: string) => {
    await delay(150);
    const me = _users.find(u => u.id === CURRENT_USER_ID)!;
    const msg: MockMessage = {
      id: 'msg-' + Date.now(),
      roomId,
      senderId: CURRENT_USER_ID,
      senderName: me.displayName,
      content,
      createdAt: new Date().toISOString(),
    };
    _messages.push(msg);
    return ok(msg);
  },
};

// ─── Matches / Discover ───────────────────────────────────────────────────────
export const mockMatches = {
  getAll: async () => {
    await delay();
    const enriched = _matches.map(m => ({
      ...m,
      user: _users.find(u => u.id === m.userId),
    }));
    return ok(enriched);
  },
  getMessages: async (matchId: string) => {
    await delay();
    return ok(_messages.filter(m => m.roomId === matchId));
  },
  sendMessage: async (matchId: string, content: string) => {
    await delay(150);
    const me = _users.find(u => u.id === CURRENT_USER_ID)!;
    const msg: MockMessage = {
      id: 'msg-' + Date.now(),
      roomId: matchId,
      senderId: CURRENT_USER_ID,
      senderName: me.displayName,
      content,
      createdAt: new Date().toISOString(),
    };
    _messages.push(msg);
    // Update last message in match
    const match = _matches.find(m => m.id === matchId);
    if (match) { match.lastMessage = content; match.lastMessageAt = msg.createdAt; match.unread = 0; }
    return ok(msg);
  },
  markRead: async (matchId: string) => {
    await delay(100);
    const match = _matches.find(m => m.id === matchId);
    if (match) match.unread = 0;
    return ok({ success: true });
  },
  getSwipeDeck: async () => {
    await delay();
    const candidates = _users.filter(u => _swipeDeck.includes(u.id)).map(u => ({
      ...u,
      dogs: _dogs.filter(d => u.dogIds.includes(d.id)),
    }));
    return ok(candidates);
  },
  swipeRight: async (userId: string) => {
    await delay(200);
    _swipeDeck = _swipeDeck.filter(id => id !== userId);
    // Simulate 60% match rate
    const isMatch = Math.random() > 0.4;
    if (isMatch) {
      const matchId = 'match-' + Date.now();
      const newMatch: MockMatch = {
        id: matchId,
        userId,
        matchedAt: new Date().toISOString(),
        lastMessage: '',
        lastMessageAt: new Date().toISOString(),
        unread: 0,
      };
      _matches.unshift(newMatch);
      return ok({ matched: true, match: newMatch, user: _users.find(u => u.id === userId) });
    }
    return ok({ matched: false });
  },
  swipeLeft: async (userId: string) => {
    await delay(100);
    _swipeDeck = _swipeDeck.filter(id => id !== userId);
    return ok({ success: true });
  },
};

// ─── Places ───────────────────────────────────────────────────────────────────
export const mockPlaces = {
  list: async () => {
    await delay();
    return ok([...PLACES]);
  },
  getById: async (id: string) => {
    await delay();
    return ok(PLACES.find(p => p.id === id));
  },
};
