# Local Setup (Docker + Prisma)

This project uses:

- MySQL in Docker (via `docker-compose.yml`)
- Prisma for migrations and DB access

## 1) Start MySQL (Docker)

From the project root:

```bash
docker compose up -d mysql
```

Check status:

```bash
docker compose ps
```

MySQL will be reachable on:

- `localhost:3306`

## 2) Apply migrations (create tables)

From the project root:

```bash
npx prisma migrate dev
```

Notes:

- This creates/updates tables in `tourism_db`.
- This command typically runs `prisma generate` automatically.

## 3) Run the API server

```bash
npm run dev
```

API base URL:

- `http://localhost:3000/api/v1`

## 4) Open Prisma Studio

```bash
npx prisma studio
```

Studio UI opens on:

- `http://localhost:5555`

Important:

- `5555` is the Studio web UI port.
- Studio connects to MySQL using `DATABASE_URL` from `.env` (which points to Docker MySQL on `localhost:3306`).

## Common issue: Windows EPERM during Prisma generate

If you see errors like:

- `EPERM: operation not permitted, rename ... query_engine-windows.dll.node.tmp -> query_engine-windows.dll.node`

Fix:

- Stop the dev server (`npm run dev`) and Prisma Studio (close the terminal running it)
- Retry:

```bash
npx prisma generate
```

If it still fails, restart your IDE (or PC) and try again.
