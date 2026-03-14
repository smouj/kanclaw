# KanClaw API Documentation

## Base URL
```
http://localhost:3020/api
```

## Endpoints

### Health Check

**GET** `/api/health`

Returns the health status of the application.

```json
{
  "app": "kanclaw",
  "openclaw": {
    "connected": true,
    "status": 200,
    "agents": []
  },
  "config": {
    "httpBase": "http://localhost:18789",
    "wsBase": "ws://localhost:18789/events",
    "hasToken": true
  }
}
```

---

### Projects

**GET** `/api/projects`

List all projects.

**GET** `/api/projects/[slug]`

Get a specific project by slug.

---

### Agents

**GET** `/api/agents`

List all available agents.

---

### Chat

**POST** `/api/chat`

Send a message to an agent.

**Request Body:**
```json
{
  "projectSlug": "rpgclaw",
  "agentName": "QuestAgent",
  "message": "Hello!"
}
```

**GET** `/api/chat/search`

Search messages across all threads.

---

### Files

**GET** `/api/files`

Get file tree for a project.

**POST** `/api/import/local-folder`

Import files from a local folder.

---

### Snapshots

**GET** `/api/snapshots`

List all snapshots for a project.

**POST** `/api/snapshots`

Create a new snapshot.

---

### Runs

**GET** `/api/runs`

List all runs for a project.

**POST** `/api/send-task`

Send a task to an agent.

---

### Tasks

**GET** `/api/tasks`

List all tasks.

---

### Connectors

**GET** `/api/connectors/github`

Get GitHub connector status.

**GET** `/api/connectors/github/repositories`

List GitHub repositories.

---

### OpenClaw Config

**GET** `/api/openclaw/config`

Get OpenClaw configuration.

---

### Metrics

**GET** `/api/metrics`

Get project metrics.

---

## Error Responses

All endpoints may return error responses:

```json
{
  "error": "Error message"
}
```

Common status codes:
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

---

## WebSocket

For real-time updates, connect to:

```
ws://localhost:18789/events
```

Events are published for:
- New messages
- Agent status changes
- Task completions
