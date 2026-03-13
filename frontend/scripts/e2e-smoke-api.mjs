#!/usr/bin/env node

const BASE_URL = (process.env.KANCLAW_BASE_URL || 'http://127.0.0.1:3020').replace(/\/$/, '');

function log(step, message) {
  console.log(`[smoke][${step}] ${message}`);
}

async function requestJson(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'content-type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  return { response, body };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function ensureProject() {
  const { response, body } = await requestJson('/api/projects');
  assert(response.ok, `/api/projects failed with ${response.status}`);
  assert(Array.isArray(body), '/api/projects did not return an array');

  if (body.length > 0) {
    return body[0];
  }

  const createPayload = {
    name: 'CI Smoke Project',
    description: 'Auto-created by smoke tests',
    agents: [{ name: 'SmokeAgent', role: 'CI smoke agent' }],
  };

  const created = await requestJson('/api/projects', {
    method: 'POST',
    body: JSON.stringify(createPayload),
  });

  assert(created.response.status === 201, `Project creation failed with ${created.response.status}`);
  return created.body;
}

function pickAgent(project) {
  const agents = Array.isArray(project?.agents) ? project.agents : [];
  assert(agents.length > 0, 'Project has no agents');
  return agents[0];
}

async function pickThread(projectSlug, preferredAgentName) {
  const { response, body } = await requestJson(`/api/chat?projectSlug=${encodeURIComponent(projectSlug)}`);
  assert(response.ok, `/api/chat GET failed with ${response.status}`);
  assert(Array.isArray(body), '/api/chat GET did not return threads array');

  const direct = body.find((thread) => thread?.agent?.name === preferredAgentName) || body.find((thread) => thread?.scope === 'AGENT');
  assert(direct?.id, 'No usable chat thread found');
  return direct;
}

async function run() {
  log('start', `base=${BASE_URL}`);

  const health = await requestJson('/api/health');
  assert(health.response.ok, `/api/health failed with ${health.response.status}`);
  assert(health.body?.app === 'kanclaw', 'Health payload does not identify kanclaw app');
  log('health', `ok openclaw.connected=${String(health.body?.openclaw?.connected)}`);

  const project = await ensureProject();
  const projectSlug = project.slug;
  assert(typeof projectSlug === 'string' && projectSlug.length > 0, 'Project slug missing');

  const agent = pickAgent(project);
  const agentName = agent.name;
  assert(typeof agentName === 'string' && agentName.length > 0, 'Agent name missing');
  log('project', `slug=${projectSlug} agent=${agentName}`);

  const thread = await pickThread(projectSlug, agentName);
  log('thread', `id=${thread.id}`);

  const taskPayload = {
    projectSlug,
    agentName,
    prompt: 'SMOKE_SEND_TASK',
  };
  const sendTask = await requestJson('/api/send-task', {
    method: 'POST',
    body: JSON.stringify(taskPayload),
  });
  assert([200, 503].includes(sendTask.response.status), `/api/send-task unexpected status ${sendTask.response.status}`);
  log('send-task', `status=${sendTask.response.status}`);

  const chatPayload = {
    projectSlug,
    threadId: thread.id,
    targetAgentName: agentName,
    content: 'SMOKE_CHAT_MESSAGE',
    contextItems: [],
  };
  const chat = await requestJson('/api/chat', {
    method: 'POST',
    body: JSON.stringify(chatPayload),
  });
  assert([200, 503].includes(chat.response.status), `/api/chat unexpected status ${chat.response.status}`);
  log('chat', `status=${chat.response.status}`);

  log('done', 'Smoke API checks completed');
}

run().catch((error) => {
  console.error(`[smoke][error] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
