# CredPlat

Multi-tenant credential compliance management platform. Portfolio project.

## Stack
- Frontend: React Router 7, Vercel
- Backend: Express 5, Render
- Database: Neon (serverless Postgres) + Drizzle ORM
- Storage: Cloudflare R2 (presigned PUT/GET)
- Email: Resend
- CI/CD: GitHub Actions

## Local Setup

### Prerequisites
- Docker + Docker Compose
- Node 20+

### Steps
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Fill in values in both .env files

docker compose up
# Frontend: http://localhost:3000
# Backend:  http://localhost:4000
```

## Database Migrations
```bash
cd backend
npm run db:migrate        # apply pending migrations
npm run db:generate       # generate migration from schema changes
```

## Running Tests
```bash
cd backend
npm run test:unit         # pure logic tests, no DB required
npm run test:integration  # full HTTP+DB stack via Docker Compose
```

## Cloudflare R2 Setup
1. Create a private bucket in the Cloudflare dashboard.
2. Generate an API token with Object Read & Write permissions.
3. Set CORS policy to allow PUT from your Vercel deployment origin.
4. Add R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, S3_BUCKET_NAME to your .env.

## GitHub Actions Secrets
| Secret | Purpose |
|---|---|
| RENDER_HOOK | Render deploy hook URL |
| INTERNAL_CRON_SECRET | Shared secret for expiration-alerts workflow |
| API_BASE_URL | Deployed API base URL (no trailing slash) |
| DATABASE_URL_DIRECT | Direct Neon connection for integration tests |

## Architecture Notes
- File bytes never pass through the API server. The frontend PUTs directly to R2 via a presigned URL.
- All credential state transitions are atomic: status update + audit log write in a single DB transaction.
- The `credential_audit_log` table is append-only. No UPDATE or DELETE is ever issued against it.
- Expiration alerts are triggered by a daily GitHub Actions workflow calling POST /api/internal/expiration-alerts.
