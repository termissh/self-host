const store = require('../store/in-memory-store');

function getRequestContext(payload) {
  const req = payload?.req || payload?.request || payload || {};
  const params = payload?.params || req.params || {};
  const body = payload?.body || req.body || {};
  const user = req.user || payload?.user || null;
  return { params, body, user };
}

function ensureUser(user) {
  if (!user || !user.sub) {
    const error = new Error('Unauthorized');
    error.statusCode = 401;
    throw error;
  }
}

module.exports = {
  name: 'connections',
  version: '1.0.0',
  register(context) {
    context.http.registerRoute({
      id: 'connections-list',
      method: 'GET',
      path: '/api/connections',
      handler: async (payload) => {
        const { user } = getRequestContext(payload);
        ensureUser(user);
        return {
          connections: store.listConnections(user.sub),
        };
      },
    });

    context.http.registerRoute({
      id: 'connections-get',
      method: 'GET',
      path: '/api/connections/:id',
      handler: async (payload) => {
        const { user, params } = getRequestContext(payload);
        ensureUser(user);
        const item = store.getConnection(user.sub, params.id);
        if (!item) {
          return { error: 'Connection not found' };
        }
        return { connection: item };
      },
    });

    context.http.registerRoute({
      id: 'connections-create',
      method: 'POST',
      path: '/api/connections',
      handler: async (payload) => {
        const { user, body } = getRequestContext(payload);
        ensureUser(user);

        if (!body.name || !body.host || !body.username) {
          return { error: 'name, host and username are required' };
        }

        const created = store.createConnection(user.sub, body);
        return { connection: created };
      },
    });

    context.http.registerRoute({
      id: 'connections-update',
      method: 'PUT',
      path: '/api/connections/:id',
      handler: async (payload) => {
        const { user, params, body } = getRequestContext(payload);
        ensureUser(user);
        const updated = store.updateConnection(user.sub, params.id, body);
        if (!updated) {
          return { error: 'Connection not found' };
        }
        return { connection: updated };
      },
    });

    context.http.registerRoute({
      id: 'connections-delete',
      method: 'DELETE',
      path: '/api/connections/:id',
      handler: async (payload) => {
        const { user, params } = getRequestContext(payload);
        ensureUser(user);
        const removed = store.deleteConnection(user.sub, params.id);
        if (!removed) {
          return { error: 'Connection not found' };
        }
        return { deleted: true };
      },
    });

    context.http.registerRoute({
      id: 'termius-sync',
      method: 'POST',
      path: '/api/termius/sync',
      handler: async (payload) => {
        const { user } = getRequestContext(payload);
        ensureUser(user);
        return {
          device: 'self-host-node',
          lastSyncAt: new Date().toISOString(),
          connections: store.listConnections(user.sub),
        };
      },
    });
  },
};
