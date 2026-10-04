# FolioHub MVP

## Goal

Build a Cloudflare-first portfolio builder that runs locally and can later deploy as a Vue SPA, Hono Worker API, D1 database, and private R2 media store.

## Success criteria

- A user can register, sign in, and sign out.
- A signed-in user can create and edit multiple portfolios.
- Each portfolio has a stable `/u/{username}/{slug}` URL and public/private visibility.
- Public visitors can only read public portfolios.
- Images are stored privately in R2 and served through an authorized API route.
- The repository passes lint, type checking, tests, production builds, and a high-severity dependency audit.

## Tasks

1. [complete] Scaffold npm workspaces and shared contracts. Verify: dependencies install and workspace scripts resolve.
2. [complete] Add D1 schema and migrations. Verify: migration applies to a local D1 database.
3. [complete] Implement authentication and session security. Verify: auth tests pass.
4. [complete] Implement portfolio CRUD, visibility rules, and public API. Verify: route tests and local runtime checks pass.
5. [complete] Implement private R2 image upload and delivery. Verify: binding and authorization paths typecheck and build.
6. [complete] Build the Vue user flows and portfolio template. Verify: responsive UI inspection, web typecheck, and build pass.
7. [complete] Add local setup and Cloudflare deployment documentation. Verify: commands and environment names are consistent.
8. [complete] Run final lint, typecheck, tests, builds, UX audit, and dependency audit. Verify: all checks pass.
