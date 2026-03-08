// ─── User ───────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Walk ────────────────────────────────────────────────────────────────────

export type WalkStatus = 'pending' | 'active' | 'completed' | 'cancelled';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Walk {
  id: string;
  hostId: string;
  title: string;
  description?: string;
  meetingPoint: Coordinates;
  route?: Coordinates[];
  status: WalkStatus;
  maxParticipants: number;
  participants: string[];
  scheduledAt: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Chat ────────────────────────────────────────────────────────────────────

export interface Message {
  id: string;
  walkId: string;
  senderId: string;
  senderName: string;
  content: string;
  type: 'text' | 'image' | 'location';
  imageUrl?: string;
  location?: Coordinates;
  sentAt: string;
}

// ─── Socket events ────────────────────────────────────────────────────────────

export const SOCKET_EVENTS = {
  // Chat
  SEND_MESSAGE: 'chat:message:send',
  RECEIVE_MESSAGE: 'chat:message:receive',
  JOIN_WALK_ROOM: 'chat:room:join',
  LEAVE_WALK_ROOM: 'chat:room:leave',
  // Location
  UPDATE_LOCATION: 'location:update',
  WALK_LOCATION_UPDATE: 'location:walk:update',
  // Walk lifecycle
  WALK_STARTED: 'walk:started',
  WALK_ENDED: 'walk:ended',
  PARTICIPANT_JOINED: 'walk:participant:joined',
  PARTICIPANT_LEFT: 'walk:participant:left',
} as const;

// ─── API response wrappers ───────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
