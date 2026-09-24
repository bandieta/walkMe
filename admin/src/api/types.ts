export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export interface AdminMe {
  id: string;
  email: string;
  displayName: string;
  role: 'admin' | 'superadmin';
  createdAt: string;
  lastLoginAt?: string;
}

export interface DashboardStats {
  users: { total: number; active7d: number; suspended: number };
  dogs: number;
  walks: { total: number; live: number };
  events: number;
  matches: number;
  messages: number;
  places: number;
  signupsByDay: { date: string; count: number }[];
}

export type UserStatus = 'active' | 'suspended' | 'banned';

export interface AdminUserRow {
  id: string;
  displayName: string;
  email?: string;
  photoUrl?: string;
  provider: string;
  status: UserStatus;
  onboarded: boolean;
  createdAt: string;
  dogCount: number;
  walksHosted: number;
  walksJoined: number;
}

export interface AdminUserDetail extends AdminUserRow {
  bio?: string;
  location?: string;
  dogs: { id: string; name: string; breed: string; photoUrl?: string }[];
  hostedWalks: { id: string; title: string; status: string; scheduledAt: string }[];
  joinedWalks: { id: string; title: string; status: string; scheduledAt: string }[];
  matchCount: number;
}

export interface AdminDog {
  id: string;
  ownerId: string;
  ownerName: string;
  name: string;
  breed: string;
  age: number;
  photoUrl?: string;
}

export interface AdminWalkRow {
  id: string;
  title: string;
  category: string;
  status: string;
  scheduledAt: string;
  meetingPoint: string;
  hostId: string;
  hostName: string;
  participantCount: number;
  maxParticipants: number;
}

export interface AdminWalkDetail {
  id: string;
  title: string;
  description?: string;
  category: string;
  status: string;
  duration: string;
  scheduledAt: string;
  meetingPoint: string;
  meetingLat: number;
  meetingLng: number;
  maxParticipants: number;
  host: { id: string; displayName: string; email?: string };
  participants: { id: string; displayName: string; email?: string }[];
  createdAt: string;
}

export interface AdminEventRow {
  id: string;
  title: string;
  category: string;
  status: string;
  date: string;
  location: string;
  organizerId: string;
  organizerName: string;
  participantCount: number;
  maxParticipants: number;
  emoji?: string;
}

export interface AdminEventDetail {
  id: string;
  title: string;
  description?: string;
  category: string;
  status: string;
  date: string;
  location: string;
  lat: number;
  lng: number;
  maxParticipants: number;
  organizer: { id: string; displayName: string; email?: string };
  participants: { id: string; displayName: string; email?: string }[];
  createdAt: string;
}

export interface AdminPlace {
  id: string;
  name: string;
  category: string;
  address: string;
  lat: number;
  lng: number;
  rating: number;
  reviewCount: number;
  tags: string[];
  isOpen: boolean;
  description?: string;
  emoji?: string;
}

export interface AdminMessage {
  id: string;
  roomId: string;
  walkId?: string;
  senderId: string;
  senderName: string;
  content: string;
  type: string;
  createdAt: string;
}

export interface AdminMatch {
  id: string;
  userAId: string;
  userAName: string;
  userBId: string;
  userBName: string;
  matchedAt: string;
  lastMessage?: string;
  lastMessageAt: string;
}

export interface AdminUpload {
  name: string;
  sizeBytes: number;
  modifiedAt: string;
  url: string;
}

export interface AuditEntry {
  id: string;
  adminName: string;
  adminEmail: string;
  action: string;
  targetType: string;
  targetId: string;
  meta?: Record<string, unknown>;
  createdAt: string;
}
