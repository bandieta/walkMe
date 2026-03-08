# WalkMe

A community walking app for iOS & Android built with React Native, Node.js (NestJS), PostgreSQL, Redis, and WebSockets.

## Architecture

```
walkMe/
├── mobile/          # React Native app (iOS + Android)
├── backend/         # NestJS REST API + Socket.io
├── shared/          # Shared TypeScript types
└── docker-compose.yml
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | React Native 0.74, Redux Toolkit, React Navigation |
| Backend | NestJS, TypeORM, PostgreSQL, Redis |
| Real-time | Socket.io (WebSockets) |
| Auth | JWT + Firebase Auth (Google/Apple sign-in) |
| Maps | Google Maps SDK (react-native-maps) |
| Storage | AWS S3 (image uploads) |
| Push Notifications | Firebase Cloud Messaging |

## Quick Start

### 1. Start infrastructure
```bash
docker-compose up -d postgres redis
```

### 2. Backend
```bash
cd backend
cp .env.example .env    # fill in your API keys
npm install
npm run start:dev
```
API docs available at http://localhost:3000/api/docs

### 3. Mobile
```bash
cd mobile
npm install
npx pod-install ios      # iOS only
npm run ios              # or: npm run android
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/register` | Register with email/password |
| POST | `/api/v1/auth/login` | Login with email/password |
| POST | `/api/v1/auth/firebase` | Login with Firebase ID token |
| GET | `/api/v1/walks?lat=&lng=` | List nearby walks |
| POST | `/api/v1/walks` | Create a walk |
| POST | `/api/v1/walks/:id/join` | Join a walk |
| POST | `/api/v1/walks/:id/leave` | Leave a walk |
| GET | `/api/v1/chat/:walkId/messages` | Get chat history |

## WebSocket Events

Connect to `ws://localhost:3000/chat`

| Event | Direction | Description |
|-------|-----------|-------------|
| `chat:room:join` | Client → Server | Join a walk room |
| `chat:message:send` | Client → Server | Send a message |
| `chat:message:receive` | Server → Client | Receive a message |
| `location:update` | Client → Server | Send GPS location |
| `walk:started` | Server → Client | Walk has started |
| `walk:ended` | Server → Client | Walk has ended |

## Environment Variables

See [`backend/.env.example`](backend/.env.example) for required configuration.
