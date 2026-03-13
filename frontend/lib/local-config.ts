import 'server-only';

import { promises as fs } from 'fs';
import crypto from 'crypto';
import path from 'path';
import { getKanClawConfigPath } from '@/utils/fs';

interface GitHubConnectorConfig {
  provider: 'github';
  mode: 'pat';
  username: string;
  tokenEncrypted: string;
  scopes?: string[];
  lastVerifiedAt: string;
}

interface ConnectorStore {
  github?: GitHubConnectorConfig;
}

const CONNECTOR_STORE_FILE = getKanClawConfigPath('connectors.json');
const SECRET_KEY_FILE = getKanClawConfigPath('local.key');

async function ensureSecretKey() {
  try {
    const existing = await fs.readFile(SECRET_KEY_FILE, 'utf8');
    return Buffer.from(existing, 'base64');
  } catch {
    const key = crypto.randomBytes(32);
    await fs.mkdir(path.dirname(SECRET_KEY_FILE), { recursive: true });
    await fs.writeFile(SECRET_KEY_FILE, key.toString('base64'), { mode: 0o600 });
    return key;
  }
}

function encryptValue(value: string, key: Buffer) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

function decryptValue(value: string, key: Buffer) {
  const payload = Buffer.from(value, 'base64');
  const iv = payload.subarray(0, 12);
  const tag = payload.subarray(12, 28);
  const encrypted = payload.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

async function readStore(): Promise<ConnectorStore> {
  try {
    const content = await fs.readFile(CONNECTOR_STORE_FILE, 'utf8');
    return JSON.parse(content) as ConnectorStore;
  } catch {
    return {};
  }
}

async function writeStore(store: ConnectorStore) {
  await fs.mkdir(path.dirname(CONNECTOR_STORE_FILE), { recursive: true });
  await fs.writeFile(CONNECTOR_STORE_FILE, JSON.stringify(store, null, 2), { mode: 0o600 });
}

export async function getGitHubConnectorConfig() {
  const store = await readStore();
  return store.github || null;
}

export async function saveGitHubConnectorConfig(input: { token: string; username: string; scopes?: string[] }) {
  const key = await ensureSecretKey();
  const store = await readStore();
  store.github = {
    provider: 'github',
    mode: 'pat',
    username: input.username,
    tokenEncrypted: encryptValue(input.token, key),
    scopes: input.scopes,
    lastVerifiedAt: new Date().toISOString(),
  };
  await writeStore(store);
  return store.github;
}

export async function clearGitHubConnectorConfig() {
  const store = await readStore();
  delete store.github;
  await writeStore(store);
}

export async function getGitHubToken() {
  const config = await getGitHubConnectorConfig();
  if (!config) {
    return null;
  }
  const key = await ensureSecretKey();
  return decryptValue(config.tokenEncrypted, key);
}