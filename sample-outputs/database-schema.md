# Database Schema

SQLite database managed via Prisma ORM.

## Entity Relationship Overview

```
User ──< Note ──< NoteTag >── Tag
User ──< Tag
User ──< AILog
```

## Tables

### User
| Column | Type | Constraints |
|--------|------|-------------|
| id | String (UUID) | PK |
| email | String | UNIQUE |
| passwordHash | String | bcrypt hash |
| name | String | |
| createdAt | DateTime | default: now() |

### Note
| Column | Type | Constraints |
|--------|------|-------------|
| id | String (UUID) | PK |
| title | String | default: "Untitled" |
| content | String | HTML from TipTap |
| isArchived | Boolean | default: false |
| shareId | String? | UNIQUE, nullable |
| authorId | String | FK → User.id |
| createdAt | DateTime | default: now() |
| updatedAt | DateTime | auto-updated |

### Tag
| Column | Type | Constraints |
|--------|------|-------------|
| id | String (UUID) | PK |
| name | String | |
| userId | String | FK → User.id |
| | | UNIQUE(name, userId) |

### NoteTag (join table)
| Column | Type | Constraints |
|--------|------|-------------|
| noteId | String | FK → Note.id (cascade delete) |
| tagId | String | FK → Tag.id (cascade delete) |
| | | PK(noteId, tagId) |

### AILog
| Column | Type | Constraints |
|--------|------|-------------|
| id | String (UUID) | PK |
| userId | String | FK → User.id |
| actionType | String | 'SUMMARY' \| 'ACTION_ITEMS' \| 'TITLE' |
| createdAt | DateTime | default: now() |

## Design Decisions

- **SQLite** chosen for zero-config local development; swap `provider` to `postgresql` in schema.prisma for production
- **shareId** is a UUID generated only on demand — null means private, non-null means public
- **NoteTag** uses cascade delete so removing a note cleans up its tag associations automatically
- **Tags are per-user** — `UNIQUE(name, userId)` means two users can have the same tag name without collision
- **AILog** tracks every AI action for usage analytics shown in the insights dashboard
