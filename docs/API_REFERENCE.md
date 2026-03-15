# KanClaw API Reference

## Core APIs

### Chat

#### POST /api/chat
Send a message to an agent.

**Request:**
```json
{
  "projectSlug": "my-project",
  "threadId": "thread-uuid",
  "targetAgentName": "Builder",
  "content": "Fix the login bug",
  "contextItems": [
    { "id": "1", "kind": "file", "title": "auth.ts", "path": "/lib/auth.ts" }
  ]
}
```

**Response:**
```json
{
  "ok": true,
  "messageId": "msg-uuid",
  "thread": { "id": "thread-uuid", "title": "Main" }
}
```

### Events

#### GET /api/events
Server-Sent Events stream for real-time updates.

**Query Params:**
- `projectSlug`: Project identifier

**Event Types:**
- `agent_started`: Agent began execution
- `agent_thinking`: Agent is processing
- `task_started`: Task created
- `task_progress`: Task in progress
- `task_finished`: Task completed
- `task_failed`: Task failed
- `error`: Error occurred

### Runs

#### GET /api/runs
List project runs.

#### POST /api/runs
Create a new run.

### Tasks

#### GET /api/tasks
List project tasks.

#### POST /api/tasks
Create a new task.

#### PATCH /api/tasks/[id]
Update task status.

---

## Control Plane APIs

### Settings

#### GET /api/projects/[slug]/settings
Get project configuration including model settings.

**Response:**
```json
{
  "project": { "id", "name", "slug" },
  "modelConfig": {
    "effective": { "provider", "model", "temperature", "maxTokens" },
    "defaults": [],
    "available": [
      { "id": "minimax-m2.5:free", "name": "MiniMax M2.5", "provider": "kilocode", "free": true }
    ]
  },
  "features": {
    "USE_AGENT_MODEL_OVERRIDES": true,
    "USE_PROVENANCE_V2": true
  }
}
```

#### PUT /api/projects/[slug]/settings
Update project settings.

**Request:**
```json
{
  "action": "setDefault",
  "provider": "kilocode",
  "model": "minimax-m2.5:free",
  "temperature": 0.7
}
```

Or for agent override:
```json
{
  "action": "setAgentOverride",
  "agentName": "Builder",
  "provider": "anthropic",
  "model": "sonnet"
}
```

### Provenance

#### GET /api/projects/[slug]/provenance
Get execution provenance graph.

**Query Params:**
- `messageId`: Specific message
- `runId`: Specific run

**Response:**
```json
{
  "graph": {
    "nodes": [
      { "id", "type": "message|run|task", "title", "snippet", "timestamp" }
    ],
    "links": [
      { "sourceId", "targetId", "relationship": "triggered|created|used" }
    ]
  }
}
```

### Context

#### GET /api/projects/[slug]/context
Get context pack for a query.

**Query Params:**
- `query`: Search query
- `agentName`: Target agent

**Response:**
```json
{
  "projectSlug": "my-project",
  "query": "login bug",
  "items": [
    { "id", "type", "title", "content", "relevance", "priority" }
  ],
  "metadata": {
    "totalItems": 12,
    "tokenEstimate": 3500,
    "engine": "v2"
  }
}
```

### Memory

#### GET /api/projects/[slug]/memory
Get project memory summaries.

**Query Params:**
- `type`: `all`, `handoffs`, `curated`
- `query`: For curated memory

#### POST /api/projects/[slug]/memory
Create memory entry.

**Request:**
```json
{
  "action": "handoff",
  "fromAgent": "Strategist",
  "toAgent": "Builder",
  "summary": "User wants login fix prioritized",
  "pendingTasks": ["task-1", "task-2"]
}
```

Or periodic summary:
```json
{
  "action": "periodic",
  "focus": "weekly progress"
}
```

### Repo

#### GET /api/projects/[slug]/repo
Manage workspace repository.

**Query Params:**
- `action`: `tree`, `search`, `important`, `index`, `file`, `read`
- `path`: File path (for file/read actions)
- `query`: Search query (for search action)

**Response (tree):**
```json
{
  "tree": [
    { "path": "lib/auth.ts", "name": "auth.ts", "type": "file", "size": 1234 }
  ],
  "count": 42
}
```

---

## Integration APIs

### Official Agents

#### GET /api/official-agents
List available official agent templates.

#### POST /api/official-agents
Provision an official agent to a project.

### GitHub

#### GET /api/connectors/github
List connected GitHub repositories.

#### POST /api/connectors/github/repositories
Import a GitHub repository.

### OpenClaw

#### GET /api/openclaw/config
Get OpenClaw configuration status.

---

## WebSocket Events

Connect to `/api/events` with query param `projectSlug`.

### Event Schema
```json
{
  "type": "agent_started",
  "projectSlug": "my-project",
  "agentName": "Builder",
  "message": "🤖 Builder iniciado",
  "timestamp": "2026-03-15T12:00:00Z"
}
```
