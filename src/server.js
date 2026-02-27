const express = require('express');
const morgan = require('morgan');
const { config } = require('./config');
const store = require('./store/in-memory-store');
const { signAccessToken } = require('./security/jwt');
const { authenticateJWT, requireAdmin } = require('./security/auth-middleware');
const { authLimiter, apiLimiter, adminLimiter } = require('./security/rate-limits');
const { createRuntimeManager } = require('./runtime/runtime-manager');

const DASHBOARD_CONFIG = {
  liveRunnerActions: true,
  port: 5000,
  host: 'localhost',
};

async function bootstrap() {
  const app = express();

  app.use(express.json({ limit: '1mb' }));
  app.use(morgan('tiny'));

  app.get('/health', (_, res) => {
    res.json({
      status: 'ok',
      service: 'termissh-self-host-runtime',
      timestamp: new Date().toISOString(),
    });
  });

  app.post('/api/auth/login', authLimiter, (req, res) => {
    const user = store.findUserByEmail(req.body?.email);
    if (!user || user.password !== req.body?.password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const accessToken = signAccessToken(user);
    return res.json({
      accessToken,
      tokenType: 'Bearer',
      expiresIn: config.jwtExpiresIn,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        plan: user.plan,
      },
    });
  });

  app.use('/api', apiLimiter, authenticateJWT);

  const runtimeManager = createRuntimeManager(app, DASHBOARD_CONFIG);
  runtimeManager.registerModule('connections');
  runtimeManager.registerModule('sessions');
  await runtimeManager.loadAll();

  app.get('/api/me', (req, res) => {
    const user = store.findUserById(req.user.sub);
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        plan: user.plan,
      },
    });
  });

  app.get('/api/admin/modules', adminLimiter, requireAdmin, (_, res) => {
    res.json({ modules: runtimeManager.status() });
  });

  app.get('/api/admin/stats', adminLimiter, requireAdmin, (_, res) => {
    const monitor = runtimeManager.monitor();
    res.json({
      stats: monitor.getStats(),
      builds: monitor.getBuilds(),
      modules: monitor.getActiveModules(),
    });
  });

  app.post('/api/admin/reload/:moduleName', adminLimiter, requireAdmin, async (req, res) => {
    try {
      const result = await runtimeManager.reload(req.params.moduleName);
      return res.json({ reloaded: result });
    } catch (error) {
      return res.status(500).json({
        error: 'Reload failed',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  app.use((error, _req, res, _next) => {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      error: error.message || 'Unexpected runtime error',
    });
  });

  app.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`[self-host-runtime] listening on :${config.port}`);
    // eslint-disable-next-line no-console
    console.log(`[self-host-runtime] dashboard on http://${DASHBOARD_CONFIG.host}:${DASHBOARD_CONFIG.port}`);
  });
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('[self-host-runtime] failed to start', error);
  process.exit(1);
});
