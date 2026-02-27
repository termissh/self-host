const { randomUUID } = require('crypto');
const { config } = require('../config');

const users = [
  {
    id: 'u-admin',
    email: config.adminEmail,
    password: config.adminPassword,
    role: 'admin',
    plan: 'pro',
  },
  {
    id: 'u-demo',
    email: 'demo@termissh.local',
    password: 'Demo123!',
    role: 'user',
    plan: 'free',
  },
];

const connections = [
  {
    id: randomUUID(),
    ownerId: 'u-admin',
    name: 'prod-eu-api',
    host: '10.10.20.12',
    port: 22,
    username: 'ubuntu',
    authType: 'key',
    tags: ['prod', 'eu', 'api'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: randomUUID(),
    ownerId: 'u-admin',
    name: 'staging-us-web',
    host: '10.10.30.44',
    port: 22,
    username: 'ubuntu',
    authType: 'password',
    tags: ['staging', 'us', 'web'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const sessions = [];

function findUserByEmail(email) {
  return users.find((user) => user.email.toLowerCase() === String(email || '').toLowerCase());
}

function findUserById(userId) {
  return users.find((user) => user.id === userId);
}

function listConnections(ownerId) {
  return connections.filter((item) => item.ownerId === ownerId);
}

function getConnection(ownerId, id) {
  return connections.find((item) => item.ownerId === ownerId && item.id === id) || null;
}

function createConnection(ownerId, payload) {
  const now = new Date().toISOString();
  const created = {
    id: randomUUID(),
    ownerId,
    name: payload.name,
    host: payload.host,
    port: Number(payload.port || 22),
    username: payload.username,
    authType: payload.authType || 'key',
    tags: Array.isArray(payload.tags) ? payload.tags : [],
    createdAt: now,
    updatedAt: now,
  };
  connections.push(created);
  return created;
}

function updateConnection(ownerId, id, payload) {
  const target = connections.find((item) => item.ownerId === ownerId && item.id === id);
  if (!target) return null;

  if (payload.name) target.name = payload.name;
  if (payload.host) target.host = payload.host;
  if (payload.port) target.port = Number(payload.port);
  if (payload.username) target.username = payload.username;
  if (payload.authType) target.authType = payload.authType;
  if (payload.tags) target.tags = Array.isArray(payload.tags) ? payload.tags : target.tags;
  target.updatedAt = new Date().toISOString();

  return target;
}

function deleteConnection(ownerId, id) {
  const index = connections.findIndex((item) => item.ownerId === ownerId && item.id === id);
  if (index < 0) return false;
  connections.splice(index, 1);
  return true;
}

function createSession(ownerId, connectionId) {
  const session = {
    id: randomUUID(),
    ownerId,
    connectionId,
    status: 'active',
    createdAt: new Date().toISOString(),
  };
  sessions.push(session);
  return session;
}

function listSessions(ownerId) {
  return sessions.filter((item) => item.ownerId === ownerId);
}

module.exports = {
  findUserByEmail,
  findUserById,
  listConnections,
  getConnection,
  createConnection,
  updateConnection,
  deleteConnection,
  createSession,
  listSessions,
};
