# Peblo Universe — AI-Powered Notes Workspace

A full-stack collaborative notes application built with React, Node.js, Prisma, and Google Gemini AI.

## Features

### Core
- **Authentication** — JWT-based signup/login with bcrypt password hashing, persistent sessions via localStorage
- **Notes CRUD** — Create, read, update, delete, and archive notes
- **Rich Text Editor** — TipTap-powered editor with Bold, Italic, Strikethrough, Bullet Lists, Undo/Redo
- **Tags** — Add/remove inline tag chips per note, filter notes by tag from the sidebar
- **Search** — Full-text search across note titles and content
- **Note Sharing** — Generate a public read-only link; revoke it at any time

### AI (Google Gemini 2.5 Flash)
- **Smart Summary** — Condenses note content into a concise summary
- **Action Items** — Extracts actionable tasks from any note
- **Auto Title** — Generates a short, descriptive title from note content

### Real-Time Collaboration
- Socket.io room-based broadcasting — multiple users editing the same note see changes live

### UX Polish
- Dark / Light theme toggle (CSS custom properties)
- Skeleton loading cards while notes fetch
- Auto-save with 2s debounce after typing
- `Ctrl+S` / `Cmd+S` manual save shortcut
- Word count in editor footer
- Toast notifications for all actions
- Insights panel: total notes, AI usage count, top tags, recently edited

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, TypeScript, Vite, TanStack Query, Zustand, Framer Motion |
| Editor | TipTap (ProseMirror-based) |
| Styling | Plain CSS with CSS custom properties |
| Backend | Node.js, Express, TypeScript |
| Database | SQLite via Prisma ORM |
| Auth | JWT + bcryptjs |
| AI | Google Gemini 2.5 Flash (`@google/genai`) |
| Real-time | Socket.io |

## Project Structure

```
├── backend/
│   ├── prisma/
│   │   └── schema.prisma       # User, Note, Tag, NoteTag, AILog models
│   └── src/
│       ├── controllers/        # auth, notes, insights, ai
│       ├── middleware/         # JWT requireAuth
│       ├── routes/             # Express routers
│       └── index.ts            # Express + Socket.io server
└── frontend/
    └── src/
        ├── api/                # Axios instance with auth interceptor
        ├── components/         # NoteEditor (TipTap + Socket.io + AI)
        ├── pages/              # AuthPage, Dashboard, SharedNote
        ├── store/              # Zustand auth store
        └── styles/             # CSS modules per component
```

## Getting Started

### Prerequisites
- Node.js 18+
- A Google Gemini API key — get one free at [aistudio.google.com](https://aistudio.google.com)

### 1. Clone & install

```bash
# Terminal 1 — Backend
cd backend
npm install

# Terminal 2 — Frontend
cd frontend
npm install
```

### 2. Configure environment

Create `backend/.env` (copy from `backend/.env.example`):
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="any_random_secret_string"
GEMINI_API_KEY="your_gemini_api_key_here"
PORT=3001
```

### 3. Set up the database

```bash
cd backend
npx prisma migrate dev
```

### 4. Run both servers

```bash
# Terminal 1 — Backend (http://localhost:3001)
cd backend
npm run dev

# Terminal 2 — Frontend (http://localhost:5173)
cd frontend
npm run dev
```

### 5. Open the app

Go to `http://localhost:5173`, sign up for an account, and start taking notes.

> **Note:** Both servers must be running simultaneously. The frontend proxies API calls to `localhost:3001`.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/notes` | List notes (supports `?search=` and `?tag=`) |
| POST | `/api/notes` | Create note |
| GET | `/api/notes/:id` | Get single note |
| PATCH | `/api/notes/:id` | Update note + tags |
| DELETE | `/api/notes/:id` | Delete note |
| POST | `/api/notes/:id/share` | Generate public share link |
| DELETE | `/api/notes/:id/share` | Revoke share link |
| GET | `/api/notes/shared/:shareId` | Public read-only note (no auth) |
| POST | `/api/ai/notes/:id/summary` | AI summary |
| POST | `/api/ai/notes/:id/action-items` | AI action items |
| POST | `/api/ai/notes/:id/title` | AI auto-title |
| GET | `/api/insights` | Dashboard stats |

## Socket.io Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `join-note` | Client → Server | `noteId` |
| `leave-note` | Client → Server | `noteId` |
| `note-change` | Client → Server | `{ noteId, delta: html }` |
| `receive-note-change` | Server → Client | `html` |
