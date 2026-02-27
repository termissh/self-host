const store = require('../store/in-memory-store');

function getRequestContext(payload) {
  const req = payload?.req || payload?.request || payload || {};
  const params = payload?.params || req.params || {};
  const user = req.user || payload?.user || null;
  return { params, user };
}

function ensureUser(user) {
  if (!user || !user.sub) {
    const error = new Error('Unauthorized');
    error.statusCode = 401;
    throw error;
  }
}

module.exports = {
  name: 'sessions',
  version: '1.0.0',
  register(context) {
    context.http.registerRoute({
      id: 'termius-connect',
      method: 'POST',
      path: '/api/termius/connect/:id',
      handler: async (payload) => {
        const { user, params } = getRequestContext(payload);
        ensureUser(user);

        const connection = store.getConnection(user.sub, params.id);
        if (!connection) {
          return { error: 'Connection not found' };
        }

        const session = store.createSession(user.sub, connection.id);
        return {
          session,
          target: {
            host: connection.host,
            port: connection.port,
            username: connection.username,
          },
        };
      },
    });

    context.http.registerRoute({
      id: 'termius-session-list',
      method: 'GET',
      path: '/api/termius/sessions',
      handler: async (payload) => {
        const { user } = getRequestContext(payload);
        ensureUser(user);
        return { sessions: store.listSessions(user.sub) };
      },
    });
  },
};
