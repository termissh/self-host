# termissh Self-Host Runtime

Self-hosted `termissh` backend skeleton built with Deploy4Me + Express.

## Includes

- JWT auth
- Rate limiting
- SSH connection CRUD
- Runtime module reload: `/api/admin/reload/:moduleName`
- Sync endpoint: `/api/termius/sync`

## Run

```bash
cd self-host-runtime
cp .env.example .env
npm install
npm run dev
```

Server: `http://localhost:4300`

## Quick API

Login:

```bash
curl -X POST http://localhost:4300/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@termissh.local","password":"ChangeMe123!"}'
```

List connections:

```bash
curl http://localhost:4300/api/connections \
  -H "Authorization: Bearer <TOKEN>"
```

Reload module:

```bash
curl -X POST http://localhost:4300/api/admin/reload/connections \
  -H "Authorization: Bearer <TOKEN>"
```
