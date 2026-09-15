# WalkMe — Project Knowledge Base

> Auto-generated from full source analysis. Update when significant changes land.

---

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Monorepo Structure](#monorepo-structure)
3. [Backend — NestJS API](#backend--nestjs-api)
4. [Mobile — React Native](#mobile--react-native)
5. [State Management (Redux)](#state-management-redux)
6. [Navigation Map](#navigation-map)
7. [Component Library](#component-library)
8. [Services Layer](#services-layer)
9. [Data Models & Entities](#data-models--entities)
10. [API Contract Reference](#api-contract-reference)
11. [WebSocket Events](#websocket-events)
12. [Native Platform Config](#native-platform-config)
13. [Dependency Graphs](#dependency-graphs)
14. [Known Gaps & TODO](#known-gaps--todo)
15. [Dev Environment](#dev-environment)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     React Native Mobile                      │
│  Redux Toolkit  │  React Navigation  │  Socket.io-client    │
│  react-native-maps  │  Axios  │  AsyncStorage              │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP + WebSocket
┌──────────────────────────▼──────────────────────────────────┐
│                      NestJS Backend                          │
│  REST API (:3000)  │  Socket.io Gateway (/chat)            │
│  JWT Auth  │  Firebase Admin  │  TypeORM                   │
└────────┬──────────────────────────────────┬─────────────────┘
         │                                  │
┌────────▼────────┐                ┌────────▼────────┐
│   PostgreSQL    │                │     Redis        │
│  (entities,     │                │  (sessions,      │
│   walks, chat)  │                │   pub/sub)       │
└─────────────────┘                └─────────────────┘
                     External Services
        Google Maps API  │  Firebase Auth  │  AWS S3 / Azure Blob
        Firebase Cloud Messaging (push notifications)
```

**Key architectural decisions:**
- Monorepo with `shared/` package for type sharing between BE and mobile
- Mock service layer (`mobile/src/services/mock/`) lets mobile run without a live backend
- Socket.io used for both chat and real-time location tracking
- Azure Blob Storage used (not AWS S3 as README says — see `backend/src/storage/storage.service.ts`)

---

## Monorepo Structure

```
walkMe/
├── mobile/                   React Native 0.74 app
│   ├── android/              Native Android project (Kotlin)
│   ├── ios/                  Native iOS project (Obj-C bridge)
│   ├── src/
│   │   ├── components/       Shared UI components
│   │   ├── navigation/       React Navigation config
│   │   ├── screens/          Feature screens
│   │   ├── services/         API, socket, mock services
│   │   ├── store/            Redux store + slices
│   │   └── utils/            theme, env helpers
│   ├── App.tsx               Root component
│   └── index.js              RN entry point
├── backend/
│   └── src/
│       ├── auth/             JWT + Firebase auth
│       ├── chat/             WebSocket gateway + REST
│       ├── database/         Entities, migrations, seeds
│       ├── health/           Health check endpoint
│       ├── maps/             Google Maps proxy
│       ├── notifications/    FCM push notifications
│       ├── redis/            Redis service
│       ├── storage/          Azure Blob file upload
│       ├── users/            User CRUD
│       └── walks/            Walk CRUD + join/leave
├── shared/
│   └── src/index.ts          Shared TS types
├── docker-compose.yml        Postgres + Redis
└── package.json              Workspace root
```

---

## Backend — NestJS API

### Modules

| Module | File | Responsibility |
|--------|------|----------------|
| `AppModule` | `app.module.ts` | Root — imports all feature modules, ConfigModule, TypeORM, Throttler |
| `AuthModule` | `auth/` | Register/login (email+bcrypt), Firebase token login, JWT strategy |
| `UsersModule` | `users/` | User profile CRUD |
| `WalksModule` | `walks/` | Walk CRUD, join/leave, nearby query |
| `ChatModule` | `chat/` | REST message history + Socket.io gateway |
| `MapsModule` | `maps/` | Google Maps Places proxy (avoids API key exposure on client) |
| `NotificationsModule` | `notifications/` | Firebase Cloud Messaging push send |
| `StorageModule` | `storage/` | Azure Blob file upload (`@azure/storage-blob`) |
| `RedisModule` | `redis/` | Shared Redis client (ioredis-compatible) |
| `HealthModule` | `health/` | `GET /health` — simple uptime check |

### Auth Flow

```
Register:  POST /api/v1/auth/register  { email, password, displayName }
           → bcrypt hash → save User → return JWT

Login:     POST /api/v1/auth/login  { email, password }
           → bcrypt compare → return JWT

Firebase:  POST /api/v1/auth/firebase  { idToken }
           → firebase-admin.auth().verifyIdToken(idToken)
           → upsert User → return JWT

All protected routes use JwtAuthGuard (Bearer token in Authorization header)
```

### Database Entities

#### `User`
```
id (uuid PK)
email (unique)
passwordHash (nullable — Firebase users have no password)
displayName
photoUrl
firebaseUid (unique, nullable)
createdAt / updatedAt
```

#### `Dog`
```
id (uuid PK)
name, breed, age (number), weight (nullable)
bio (nullable)
emoji (nullable)
personality (text array)
ownerId → User
```

#### `Walk`
```
id (uuid PK)
title, description
lat, lng (decimal)
scheduledAt (timestamp)
maxParticipants (int, default 10)
status (enum: SCHEDULED | ACTIVE | COMPLETED | CANCELLED)
creatorId → User
participants (ManyToMany → User)
```

#### `Message`
```
id (uuid PK)
content (text)
type (enum: TEXT | IMAGE | SYSTEM)
walkId → Walk (nullable — null for DMs)
senderId → User
createdAt
```

#### `Session`
```
id (uuid PK)
userId → User
token (text)
expiresAt
```

---

## Mobile — React Native

### Screens Inventory

| Screen | File | State source | API calls | Status |
|--------|------|-------------|-----------|--------|
| `SplashScreen` | `Splash/SplashScreen.tsx` | `auth.isAuthenticated` | none | ✅ complete |
| `LoginScreen` | `Auth/LoginScreen.tsx` | `authSlice` | `loginUser` thunk | ✅ UI + mock |
| `MapScreen` | `Map/MapScreen.tsx` | `mapSlice`, `walksSlice` | `fetchNearbyWalks` | 🟡 mock only |
| `DiscoverScreen` | `Discover/DiscoverScreen.tsx` | local state | mock data inline | 🟡 mock only |
| `CreateWalkScreen` | `Walk/CreateWalkScreen.tsx` | `walksSlice` | `createWalk` thunk | 🟡 mock only |
| `WalkDetailScreen` | `Walk/WalkDetailScreen.tsx` | `walksSlice` | `joinWalk` / `leaveWalk` | 🟡 mock only |
| `MyWalksScreen` | `Walk/MyWalksScreen.tsx` | `walksSlice` | `fetchMyWalks` | 🟡 mock only |
| `ChatScreen` (list) | `Chat/ChatScreen.tsx` | `chatSlice` | `fetchConversations` | 🟡 mock only |
| `DirectMessageScreen` | `Chat/DirectMessageScreen.tsx` | `chatSlice` | `fetchMessages`, socket | 🟡 mock only |
| `WalkChatScreen` | `Chat/WalkChatScreen.tsx` | `chatSlice` | `fetchMessages`, socket | 🟡 mock only |
| `EventsScreen` | `Events/EventsScreen.tsx` | `eventsSlice` | `fetchEvents` | 🟡 mock only |
| `EventDetailScreen` | `Events/EventDetailScreen.tsx` | `eventsSlice` | join event | 🟡 mock only |
| `CreateEventScreen` | `Events/CreateEventScreen.tsx` | `eventsSlice` | `createEvent` | 🟡 mock only |
| `ChatListScreen` (matches) | `Matches/ChatListScreen.tsx` | `matchesSlice` | `fetchMatches` | 🟡 mock only |
| `ProfileScreen` | `Profile/ProfileScreen.tsx` | `auth.user` | none | 🟡 hardcoded stats |
| `EditProfileScreen` | `Profile/EditProfileScreen.tsx` | `profileSlice` | `updateProfile` | 🟡 mock only |
| `MyDogsScreen` | `Profile/MyDogsScreen.tsx` | `dogsSlice` | `fetchMyDogs`, `deleteDog` | 🟡 mock only |
| `AddDogScreen` | `Profile/AddDogScreen.tsx` | `dogsSlice` | `createDog` | 🟡 mock only |

**Legend:** ✅ Working end-to-end | 🟡 Mock data, needs real API wiring | 🔴 Not started

---

## State Management (Redux)

### Store Structure

```typescript
RootState {
  auth:    { user, token, isAuthenticated, loading, error }
  walks:   { walks[], selectedWalk, nearbyWalks[], loading, error }
  chat:    { conversations[], messages{walkId→Message[]}, activeRoom, loading }
  dogs:    { dogs[], loading, error }
  events:  { events[], selectedEvent, loading, error }
  matches: { matches[], loading, error }
  map:     { region, markers[], userLocation, loading }
  places:  { places[], selectedPlace, loading }
  profile: { updating, error }
}
```

### Slice Summary

| Slice | Key thunks | Notes |
|-------|-----------|-------|
| `authSlice` | `loginUser`, `registerUser`, `logout` | Persists token to AsyncStorage; `logout` clears it |
| `walksSlice` | `fetchNearbyWalks`, `fetchMyWalks`, `createWalk`, `joinWalk`, `leaveWalk` | All call `mockWalkService` |
| `chatSlice` | `fetchConversations`, `fetchMessages`, `sendMessage` | `sendMessage` goes via socket, not REST |
| `dogsSlice` | `fetchMyDogs`, `createDog`, `deleteDog` | CRUD against user's dogs |
| `eventsSlice` | `fetchEvents`, `createEvent` | Community events, separate from walks |
| `matchesSlice` | `fetchMatches` | Dog-owner discovery/matching |
| `mapSlice` | `updateRegion`, `setUserLocation` | Map viewport + nearby pins |
| `placesSlice` | `fetchNearbyPlaces` | Dog-friendly places via Maps API |
| `profileSlice` | `updateProfile` | Thin slice, mostly delegates to auth |

---

## Navigation Map

```
Root Navigator (Stack)
├── Splash                        (no auth guard)
├── Login                         (unauthenticated)
└── Main (Bottom Tab Navigator)   (authenticated)
    ├── Map Tab
    │   └── MapScreen
    ├── Discover Tab
    │   └── DiscoverScreen
    ├── Walk Tab (Stack)
    │   ├── MyWalksScreen
    │   ├── CreateWalkScreen
    │   ├── WalkDetailScreen
    │   └── WalkChatScreen
    ├── Chat Tab (Stack)
    │   ├── ChatScreen (conversation list)
    │   ├── ChatListScreen (matches)
    │   └── DirectMessageScreen
    ├── Events Tab (Stack)
    │   ├── EventsScreen
    │   ├── EventDetailScreen
    │   └── CreateEventScreen
    └── Profile Tab (Stack)
        ├── ProfileScreen
        ├── EditProfileScreen
        ├── MyDogsScreen
        └── AddDogScreen
```

Auth guard lives in `AppNavigator.tsx` — watches `auth.isAuthenticated` in Redux.

---

## Component Library

All in `mobile/src/components/`, exported from `index.ts`.

| Component | Props highlights | Notes |
|-----------|-----------------|-------|
| `Button` | `title`, `onPress`, `variant` (primary/secondary/outline/ghost), `loading`, `disabled`, `size` | Wraps TouchableOpacity; spinner via ActivityIndicator |
| `Input` | `label`, `error`, `secureTextEntry`, `multiline`, `leftIcon`, `rightIcon` | Controlled component |
| `Header` | `title`, `subtitle`, `showBack`, `rightAction` | Uses `useNavigation` for back |
| `Card` | `style`, children | Shadow wrapper |
| `Avatar` | `uri`, `name` (fallback initials), `size`, `badge` | Circular, initials if no image |
| `Badge` | `label`, `color`, `size` | Pill label |
| `Modal` | `visible`, `onClose`, `title`, children | RN Modal wrapper |
| `BottomSheet` | `visible`, `onClose`, `snapPoints` | Animated slide-up sheet |
| `Toast` | `message`, `type` (success/error/info), `visible` | Auto-dismisses after 3s |
| `EmptyState` | `icon`, `title`, `subtitle`, `action` | Used when lists are empty |

---

## Services Layer

### `mobile/src/services/api/index.ts`
- Axios instance with `baseURL` from `env.ts` (`REACT_APP_API_URL` or `http://10.0.2.2:3000` for Android emulator)
- Request interceptor injects `Authorization: Bearer <token>` from AsyncStorage
- Response interceptor handles 401 → dispatch logout

### `mobile/src/services/mock/`
- `data.ts` — static fixtures for walks, users, dogs, events, messages
- `index.ts` — async functions matching the real API interface but returning mock data with `setTimeout` delays

### `mobile/src/services/socket/index.ts`
- Singleton Socket.io client (`io(BASE_URL, { auth: { token } })`)
- Exported functions: `joinRoom(walkId)`, `leaveRoom(walkId)`, `sendMessage(walkId, content)`, `onMessage(cb)`, `disconnect()`

---

## Data Models & Entities

### Shared types (`shared/src/index.ts`)

```typescript
User    { id, email, displayName, photoUrl? }
Dog     { id, name, breed, age, weight?, bio?, emoji?, personality[], ownerId }
Walk    { id, title, description, lat, lng, scheduledAt, maxParticipants,
          status, creatorId, participants[] }
Message { id, content, type, walkId?, senderId, createdAt }
Event   { id, title, description, location, date, maxAttendees,
          category, attendees[] }
Match   { id, user, dog, lastMessage?, unreadCount, updatedAt }
```

---

## API Contract Reference

All routes prefixed `/api/v1`. Auth routes are public; rest require `Authorization: Bearer <jwt>`.

### Auth
| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | `/auth/register` | `{ email, password, displayName }` | `{ token, user }` |
| POST | `/auth/login` | `{ email, password }` | `{ token, user }` |
| POST | `/auth/firebase` | `{ idToken }` | `{ token, user }` |

### Walks
| Method | Path | Params / Body | Response |
|--------|------|---------------|----------|
| GET | `/walks` | `?lat=&lng=&radius=` | `Walk[]` |
| POST | `/walks` | `CreateWalkDto` | `Walk` |
| POST | `/walks/:id/join` | — | `Walk` |
| POST | `/walks/:id/leave` | — | `Walk` |

### Chat
| Method | Path | Response |
|--------|------|----------|
| GET | `/chat/:walkId/messages` | `Message[]` |

### Storage
| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | `/storage/upload` | multipart `file` | `{ url }` |

### Maps
| Method | Path | Params | Response |
|--------|------|--------|----------|
| GET | `/maps/nearby` | `?lat=&lng=&type=` | `Place[]` |

---

## WebSocket Events

Connect: `ws://localhost:3000/chat` with `{ auth: { token: '<jwt>' } }`

| Event | Direction | Payload |
|-------|-----------|---------|
| `chat:room:join` | Client → Server | `{ walkId: string }` |
| `chat:room:leave` | Client → Server | `{ walkId: string }` |
| `chat:message:send` | Client → Server | `{ walkId: string, content: string }` |
| `chat:message:receive` | Server → Client | `Message` object |
| `location:update` | Client → Server | `{ lat: number, lng: number }` |
| `walk:started` | Server → Client | `{ walkId: string }` |
| `walk:ended` | Server → Client | `{ walkId: string }` |

---

## Native Platform Config

### Android (`mobile/android/`)
- **Min SDK:** not explicitly set (React Native default ~21)
- **Target SDK:** 34 (Android 14)
- **Permissions declared:** `INTERNET` only ⚠️ — `ACCESS_FINE_LOCATION` is missing (needed for Maps)
- **Google Maps API key:** placeholder `YOUR_GOOGLE_MAPS_API_KEY` in `AndroidManifest.xml`
- **Build tools:** Gradle 8.8, Kotlin
- **Entry:** `MainActivity.kt` → `MainApplication.kt` (standard RN 0.74 architecture)

### iOS (`mobile/ios/`)
- **Minimum iOS:** delegates to `min_ios_version_supported` (RN 0.74 → iOS 13.4)
- **Supported architectures:** `arm64` only (no simulator slice in production)
- **ATS:** `NSAllowsArbitraryLoads = false`, `NSAllowsLocalNetworking = true` (localhost dev OK)
- **Location usage string:** empty string ⚠️ — must be filled before App Store submission
- **Deep links:** not configured (no `CFBundleURLTypes`)
- **CocoaPods:** auto-linked only; no extra pods declared beyond RN defaults

---

## Dependency Graphs

Dependency JSON files are at `.graphs/mobile-deps.json` and `.graphs/backend-deps.json`.

To regenerate:
```bash
/tmp/madge-tool/node_modules/.bin/madge \
  --ts-config mobile/tsconfig.json --extensions ts,tsx \
  mobile/src --json > .graphs/mobile-deps.json

/tmp/madge-tool/node_modules/.bin/madge \
  --ts-config backend/tsconfig.json --extensions ts \
  backend/src --json > .graphs/backend-deps.json
```

**Circular dependencies:** None detected in either layer (0 cycles found by madge).

**Mobile — key import hubs (most imported files):**
- `src/store/index.ts` — imported by all screens
- `src/services/mock/index.ts` — imported by all Redux thunks
- `src/components/index.ts` — imported by all screens
- `src/utils/theme.ts` — imported by all components

---

## Known Gaps & TODO

### Critical (blocks functionality)
1. **Missing Android location permissions** — `ACCESS_FINE_LOCATION` + `ACCESS_COARSE_LOCATION` not in `AndroidManifest.xml`
2. **Google Maps API key** — placeholder in `AndroidManifest.xml` and `Info.plist` (needs real key)
3. **iOS location usage string** — empty `NSLocationWhenInUseUsageDescription`
4. **Firebase config files** — `google-services.json` (Android) and `GoogleService-Info.plist` (iOS) not present
5. **Real API wiring** — all screens use `mockService`; `api/index.ts` exists but is never called
6. **Environment file** — `backend/.env` missing (only `.env.example` exists)

### Important (feature completeness)
7. **Socket integration in chat screens** — socket service exists but `DirectMessageScreen` and `WalkChatScreen` don't call it
8. **Profile stats are hardcoded** — "12 Walks Done", "34 km", "8 Friends" are static strings
9. **Image upload** — `storage/upload` endpoint exists on backend; mobile has `react-native-image-picker` installed but no screen uses it
10. **Push notifications** — backend FCM service exists but mobile has no notification handler
11. **Achievements, Privacy & Safety, Help screens** — navigation targets not defined
12. **Auth persistence** — login stores token but app restart still hits `SplashScreen → Login` (no rehydration check)

### Nice to have
13. **Deep links** — not configured on either platform
14. **Biometric / Apple Sign-in** — referenced in README but not implemented
15. **Walk status transitions** — `ACTIVE`, `COMPLETED`, `CANCELLED` states exist in entity but no business logic drives transitions
16. **Dog matching algorithm** — `matchesSlice` and `DiscoverScreen` use mock data; no matching logic exists

---

## Dev Environment

### Prerequisites installed on this machine

| Tool | Location | Version |
|------|----------|---------|
| Node.js | `/usr/local/bin/node` | (system) |
| npm | `/usr/local/bin/npm` | (system) |
| JDK 17 (Temurin) | `~/.jdk/Contents/Home` | 17.0.11 |
| Android SDK | `~/Android/sdk` | cmdline-tools + platform-tools |
| Android Emulator | `~/Android/sdk/emulator` | installed |
| Android Platform | `~/Android/sdk/platforms/android-34` | API 34 |
| System Image | `~/Android/sdk/system-images/android-34/google_apis/arm64-v8a` | installed |
| AVD | `~/.android/avd/walkme-pixel6.avd` | Pixel 6, Android 14, arm64 |
| madge | `/tmp/madge-tool/node_modules/.bin/madge` | 8.0.0 |

### Required: Install Xcode from Mac App Store
iOS Simulator requires the **full Xcode app** (not just Xcode CLI tools).
1. Open **Mac App Store** → search "Xcode" → Install (~14 GB)
2. After install: `sudo xcode-select -s /Applications/Xcode.app`
3. Accept license: `sudo xcodebuild -license accept`
4. Install simulators: Xcode → Settings → Platforms → iOS

### Starting the Android emulator
```bash
export JAVA_HOME="$HOME/.jdk/Contents/Home"
export ANDROID_HOME="$HOME/Android/sdk"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"

# Launch emulator (headless for screenshots)
emulator -avd walkme-pixel6 -no-audio &

# Wait for boot, then take screenshot
adb wait-for-device
adb exec-out screencap -p > /tmp/screenshot.png
```

### Persistent shell env (add to ~/.zshrc)
```bash
export JAVA_HOME="$HOME/.jdk/Contents/Home"
export ANDROID_HOME="$HOME/Android/sdk"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"
```

### Starting the backend
```bash
cd backend
cp .env.example .env   # fill in DB_HOST, JWT_SECRET, FIREBASE_*, etc.
npm install
docker-compose up -d postgres redis
npm run start:dev
```

### Running the mobile app
```bash
cd mobile
npm install
# Android (emulator must be running)
npm run android
# iOS (Xcode required)
npx pod-install ios
npm run ios
```
