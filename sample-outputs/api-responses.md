# Sample API Responses

## POST /api/auth/signup
**Request:**
```json
{
  "name": "Vinayak Koli",
  "email": "vinayak@example.com",
  "password": "securepassword123"
}
```
**Response (201):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "name": "Vinayak Koli",
    "email": "vinayak@example.com"
  }
}
```

---

## POST /api/auth/login
**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "name": "Vinayak Koli",
    "email": "vinayak@example.com"
  }
}
```

---

## GET /api/notes
**Response (200):**
```json
[
  {
    "id": "note-uuid-1",
    "title": "Q3 Product Roadmap",
    "content": "<p>Key initiatives for Q3...</p>",
    "isArchived": false,
    "shareId": null,
    "authorId": "user-uuid",
    "createdAt": "2026-05-14T10:00:00.000Z",
    "updatedAt": "2026-05-17T08:30:00.000Z",
    "tags": [
      { "id": "tag-uuid-1", "name": "product" },
      { "id": "tag-uuid-2", "name": "planning" }
    ]
  }
]
```

---

## POST /api/notes
**Request:**
```json
{
  "title": "Meeting Notes",
  "content": "<p>Discussed Q3 goals with the team...</p>"
}
```
**Response (201):**
```json
{
  "id": "note-uuid-2",
  "title": "Meeting Notes",
  "content": "<p>Discussed Q3 goals with the team...</p>",
  "isArchived": false,
  "shareId": null,
  "authorId": "user-uuid",
  "createdAt": "2026-05-17T09:00:00.000Z",
  "updatedAt": "2026-05-17T09:00:00.000Z"
}
```

---

## PATCH /api/notes/:id (with tags)
**Request:**
```json
{
  "title": "Q3 Roadmap — Updated",
  "content": "<p><strong>Priority 1:</strong> Launch AI features</p>",
  "newTags": ["product", "ai", "q3"]
}
```
**Response (200):**
```json
{
  "id": "note-uuid-1",
  "title": "Q3 Roadmap — Updated",
  "content": "<p><strong>Priority 1:</strong> Launch AI features</p>",
  "isArchived": false,
  "shareId": null,
  "updatedAt": "2026-05-17T10:00:00.000Z",
  "tags": [
    { "id": "tag-uuid-1", "name": "product" },
    { "id": "tag-uuid-3", "name": "ai" },
    { "id": "tag-uuid-4", "name": "q3" }
  ]
}
```

---

## POST /api/notes/:id/share
**Response (200):**
```json
{
  "shareId": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
}
```
Public URL: `http://localhost:5173/shared/f47ac10b-58cc-4372-a567-0e02b2c3d479`

---

## GET /api/notes/shared/:shareId (public, no auth)
**Response (200):**
```json
{
  "id": "note-uuid-1",
  "title": "Q3 Roadmap — Updated",
  "content": "<p><strong>Priority 1:</strong> Launch AI features</p>",
  "createdAt": "2026-05-14T10:00:00.000Z",
  "updatedAt": "2026-05-17T10:00:00.000Z",
  "author": {
    "name": "Vinayak Koli"
  }
}
```

---

## GET /api/insights
**Response (200):**
```json
{
  "totalNotes": 12,
  "aiUsage": 8,
  "recentlyEdited": [
    { "id": "note-uuid-1", "title": "Q3 Roadmap", "updatedAt": "2026-05-17T10:00:00.000Z" },
    { "id": "note-uuid-2", "title": "Meeting Notes", "updatedAt": "2026-05-17T09:00:00.000Z" }
  ],
  "mostUsedTags": [
    { "name": "product", "count": 5 },
    { "name": "ai", "count": 3 },
    { "name": "planning", "count": 2 }
  ]
}
```

---

## POST /api/ai/notes/:id/summary
**Response (200):**
```json
{
  "result": "This note outlines the Q3 product roadmap, prioritizing the launch of AI-powered features including smart summarization and action item extraction. Secondary goals include improving the real-time collaboration experience and shipping a mobile-responsive layout."
}
```

## POST /api/ai/notes/:id/action-items
**Response (200):**
```json
{
  "result": "- Launch AI summary and action items features by end of July\n- Complete mobile responsive layout before Q3 review\n- Schedule collaboration UX testing session with the design team\n- Update product documentation with new AI feature guides\n- Set up performance monitoring for the notes API"
}
```

## POST /api/ai/notes/:id/title
**Response (200):**
```json
{
  "result": "Q3 AI Feature Launch Plan"
}
```
