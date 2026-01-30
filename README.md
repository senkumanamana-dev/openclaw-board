# OpenClaw Board

A kanban-style task board for human-AI collaboration, built for [OpenClaw](https://github.com/openclaw/openclaw).

## Features

- 🎯 **Drag-and-drop kanban** — TODO → In Progress → Needs Review → Done
- ⚡ **Real-time updates** — WebSocket-powered live sync
- 🤖 **AI working indicator** — Visual pulse shows what the AI is actively working on
- ✅ **Review workflow** — Tasks go through human approval before completion
- 🔗 **Task dependencies** — Block tasks until dependencies are done
- 📎 **Attachments** — Links, code snippets, and notes on tasks
- 💬 **Comments & subtasks** — Break down work and discuss
- 🏷️ **Human-readable IDs** — Jira-style keys (OCB-1, OCB-2, etc.)

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL (local or Docker)

### Setup

```bash
# Clone
git clone https://github.com/finchinslc/openclaw-board.git
cd openclaw-board

# Install
npm install

# Configure database
cp .env.example .env
# Edit .env with your PostgreSQL connection string

# Initialize database
npx prisma db push

# Start dev server
npm run dev
```

Open http://localhost:3000

### Environment

```bash
# .env
DATABASE_URL="postgresql://user@localhost:5432/openclaw?schema=public"
```

## API

REST API for programmatic task management:

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/tasks` | List all tasks |
| `POST` | `/api/tasks` | Create a task |
| `PATCH` | `/api/tasks/:id` | Update a task |
| `DELETE` | `/api/tasks/:id` | Delete a task |

### Examples

**Create a task:**
```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Build something cool", "priority": "HIGH", "tags": ["feature"]}'
```

**Start working (AI sets this):**
```bash
curl -X PATCH http://localhost:3000/api/tasks/<id> \
  -H "Content-Type: application/json" \
  -d '{"status": "IN_PROGRESS", "isActive": true, "actor": "agent"}'
```

**Submit for review:**
```bash
curl -X PATCH http://localhost:3000/api/tasks/<id> \
  -H "Content-Type: application/json" \
  -d '{"status": "NEEDS_REVIEW", "isActive": false, "actor": "agent"}'
```

### WebSocket

Connect to `/ws` for real-time events:
- `task:created`, `task:updated`, `task:deleted`, `tasks:reordered`

## Tech Stack

Next.js · Prisma · PostgreSQL · shadcn/ui · @hello-pangea/dnd

## License

MIT
