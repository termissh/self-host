const path = require('path');
const { Kernel, createRuntimeContext } = require('@deployforme/core');
const { ExpressAdapter } = require('@deployforme/adapter-express');

function resolveModulePath(moduleName) {
  return path.resolve(__dirname, '..', 'modules', `${moduleName}.module.js`);
}

function clearRequireCache(modulePath) {
  try {
    const resolved = require.resolve(modulePath);
    delete require.cache[resolved];
  } catch (error) {
    // Module was not cached yet.
  }
}

function createRuntimeManager(app, kernelConfig = {}) {
  const context = createRuntimeContext(new ExpressAdapter(app));
  const kernel = new Kernel(context, kernelConfig);
  const modules = new Map();

  function registerModule(moduleName) {
    modules.set(moduleName, {
      name: moduleName,
      filePath: resolveModulePath(moduleName),
      loadedAt: null,
      version: null,
      status: 'pending',
      error: null,
    });
  }

  async function loadModule(moduleName) {
    const entry = modules.get(moduleName);
    if (!entry) throw new Error(`Unknown module: ${moduleName}`);

    clearRequireCache(entry.filePath);

    // Kernel.load() already unloads previously registered modules by name.
    const moduleDef = require(entry.filePath);
    await kernel.load(entry.filePath);

    entry.version = moduleDef.version || 'unknown';
    entry.loadedAt = new Date().toISOString();
    entry.status = 'loaded';
    entry.error = null;

    return entry;
  }

  async function loadAll() {
    const results = [];
    for (const moduleName of modules.keys()) {
      try {
        const loaded = await loadModule(moduleName);
        results.push(loaded);
      } catch (error) {
        const entry = modules.get(moduleName);
        if (entry) {
          entry.status = 'error';
          entry.error = error instanceof Error ? error.message : String(error);
        }
      }
    }
    return results;
  }

  async function reload(moduleName) {
    return loadModule(moduleName);
  }

  function status() {
    return Array.from(modules.values());
  }

  function monitor() {
    return kernel.getMonitor();
  }

  return {
    registerModule,
    loadAll,
    reload,
    status,
    monitor,
  };
}

module.exports = {
  createRuntimeManager,
};
