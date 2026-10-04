# FolioHub

FolioHub is a Cloudflare-first portfolio builder. A user can register, create multiple CV-style portfolios, keep drafts private, publish selected portfolios, and upload an avatar to private object storage.

## Stack

- Vue 3 + Vite frontend on Cloudflare Pages
- Hono + TypeScript API on Cloudflare Workers
- Cloudflare D1 for relational data
- Private Cloudflare R2 bucket for images
- npm workspaces for the monorepo

## Local development

Requirements: Node.js 22 or newer.

```bash
npm install
npm run db:migrate:local --workspace @foliohub/api
npm run dev
```

Open `http://localhost:5173`. Local D1 data is persisted by Wrangler under `apps/api/.wrangler/state`; it is not the production database and is ignored by Git.

## Cloudflare resources

Sign in once on your development machine:

```bash
npx wrangler login
```

Create separate remote resources:

```bash
cd apps/api
npx wrangler d1 create foliohub-develop
npx wrangler d1 create foliohub-production
npx wrangler r2 bucket create foliohub-develop-media
npx wrangler r2 bucket create foliohub-production-media
```

Cloudflare prints each D1 `database_id`. Replace the matching placeholder IDs in `apps/api/wrangler.jsonc` and commit that configuration. These IDs identify resources; they are not database passwords. Access is controlled by the logged-in Cloudflare account locally and by API credentials in CI.

Apply migrations to each environment explicitly:

```bash
# Development D1 on Cloudflare
npx wrangler d1 migrations apply foliohub-develop --remote --env develop

# Production D1 on Cloudflare
npx wrangler d1 migrations apply foliohub-production --remote
```

Create the Pages project once:

```bash
npx wrangler pages project create foliohub --production-branch main
```

## GitHub deployment

The workflow `.github/workflows/deploy-production.yml` only deploys automatically after a push to `main` (or a manual workflow run). It verifies the source, builds the frontend, applies only unapplied production migrations, deploys the API Worker, then deploys `apps/web/dist` to Pages.

Configure these repository settings:

- Secret `CLOUDFLARE_API_TOKEN`: a scoped Cloudflare API token with Workers, D1, R2, and Pages permissions.
- Secret `CLOUDFLARE_ACCOUNT_ID`: the Cloudflare account ID.
- Variable `PRODUCTION_API_URL`: deployed Worker origin, for example `https://foliohub-api.<subdomain>.workers.dev`.

Set the production `APP_ORIGIN` in `apps/api/wrangler.jsonc` to the real Pages or custom-domain origin before deploying. Do not add secrets to `wrangler.jsonc`; use `wrangler secret put` for future secret values.

## API overview

- `POST /v1/auth/register`, `POST /v1/auth/login`, `POST /v1/auth/logout`
- `GET /v1/auth/me`
- `GET|POST /v1/me/portfolios`
- `GET|PUT /v1/me/portfolios/:id`
- `GET /v1/public/portfolios/:username/:slug`
- `POST /v1/media/portfolio/:portfolioId/avatar`
- `GET /v1/media/:id`

Authenticated web requests use an HttpOnly session cookie. Other clients can use the returned session token as `Authorization: Bearer <token>`. Public portfolio endpoints require no authentication.

## Migration policy

Never edit an already-applied migration. Create a new migration file, test it locally, apply it to development, and only then merge it into `main`. The production workflow applies pending migrations before deploying code. Destructive schema migrations require an explicit backup and manual review.

Cloudflare references: [D1 migration commands](https://developers.cloudflare.com/workers/wrangler/commands/d1/), [Pages direct upload](https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/), and [Workers GitHub Actions](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/).
