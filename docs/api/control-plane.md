# Control Plane API

Base URL: `http://localhost:3000` (local)

## Authentication

### Browser session (Clerk)

The web UI forwards Clerk session identity via headers during MVP integration:

| Header              | Description                               |
| ------------------- | ----------------------------------------- |
| `X-User-Id`         | Clerk user ID (`external_id` in database) |
| `X-Organization-Id` | Active organization UUID                  |

### Machine ingest (API keys)

| Header      | Description                                        |
| ----------- | -------------------------------------------------- |
| `X-Api-Key` | Key issued as `at_live_…` (shown once at creation) |

## Organizations

```http
POST /public/organizations
Content-Type: application/json

{
  "name": "Acme Support",
  "slug": "acme-support"
}
```

## Projects

```http
GET /organizations/{orgId}/projects
X-User-Id: user_2abc
X-Organization-Id: {orgId}
```

```http
POST /organizations/{orgId}/projects
Content-Type: application/json

{
  "name": "Copilot",
  "slug": "copilot"
}
```

Creates `staging` and `production` environments automatically.

## API keys

```http
POST /organizations/{orgId}/api-keys
Content-Type: application/json

{
  "name": "SDK ingest",
  "projectId": "…",
  "scopes": ["trace:ingest", "trace:read"]
}
```

Response includes `plaintextKey` — store immediately; only the bcrypt hash is persisted.

## Roles

| Role      | Ingest | Search | Export | Admin |
| --------- | ------ | ------ | ------ | ----- |
| org_admin | ✓      | ✓      | ✓      | ✓     |
| developer | ✓      | ✓      | ✗      | ✗     |
| auditor   | ✗      | ✓      | ✓      | ✗     |
| viewer    | ✗      | ✓      | ✗      | ✗     |

OpenAPI specification: [`apps/api/openapi.yaml`](../../apps/api/openapi.yaml)
