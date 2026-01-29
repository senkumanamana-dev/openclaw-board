# Moltbot Board

A kanban-style task board for AI assistants running on [Moltbot/Clawdbot](https://github.com/clawdbot/clawdbot).

![Moltbot Board](https://img.shields.io/badge/AI-Task%20Tracker-emerald)

## Features

- 🎯 **Drag-and-drop kanban** - Move tasks between To Do, In Progress, and Done
- ⚡ **Real-time updates** - WebSocket-powered live synchronization
- 🤖 **Active task indicator** - Visual pulse effect shows what the AI is currently working on
- 🏷️ **Task metadata** - Priority levels, tags, descriptions, and timestamps
- 🐳 **Dockerized** - One command to run the entire stack

## Quick Start

### Prerequisites

- Docker & Docker Compose

### Run

```bash
# Clone the repo
git clone https://github.com/finchinslc/moltbot-board.git
cd moltbot-board

# Start the stack
docker-compose up -d

# Open in browser
open http://localhost:3000
```

That's it! The board is now running with a PostgreSQL database.

### Stop

```bash
docker-compose down
```

To also remove the database volume:

```bash
docker-compose down -v
```

## API

The board exposes a REST API for programmatic access:

### Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | List all tasks |
| POST | `/api/tasks` | Create a task |
| GET | `/api/tasks/:id` | Get a task |
| PATCH | `/api/tasks/:id` | Update a task |
| DELETE | `/api/tasks/:id` | Delete a task |

### Create a task

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Build something cool",
    "description": "A detailed description",
    "priority": "HIGH",
    "tags": ["feature", "urgent"]
  }'
```

### Update task status

```bash
curl -X PATCH http://localhost:3000/api/tasks/<id> \
  -H "Content-Type: application/json" \
  -d '{"status": "IN_PROGRESS", "isActive": true}'
```

### Mark as currently working

Set `isActive: true` on a task to show the visual "currently working" indicator:

```bash
curl -X PATCH http://localhost:3000/api/tasks/<id> \
  -H "Content-Type: application/json" \
  -d '{"isActive": true}'
```

## WebSocket Events

Connect to `/ws` for real-time updates:

- `task:created` - New task added
- `task:updated` - Task modified
- `task:deleted` - Task removed
- `tasks:reordered` - Tasks reordered

## Development

```bash
# Install dependencies
npm install

# Start PostgreSQL (requires Docker)
docker-compose up db -d

# Run migrations
npx prisma migrate dev

# Start dev server
npm run dev
```

## Tech Stack

- [Next.js](https://nextjs.org/) - React framework
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Prisma](https://prisma.io/) - Database ORM
- [PostgreSQL](https://postgresql.org/) - Database
- [@hello-pangea/dnd](https://github.com/hello-pangea/dnd) - Drag and drop
- [Docker](https://docker.com/) - Containerization

## License

MIT
